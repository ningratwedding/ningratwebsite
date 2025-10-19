
'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Download, Printer, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getSiteSettings, getServicesSettings } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface InvoiceSubItem {
  description: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subItems?: InvoiceSubItem[];
}

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientWhatsapp?: string;
  myContactInfo?: string;
  invoiceNumber: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  items: InvoiceItem[];
  notes?: string;
  paymentStatus: 'Menunggu DP' | 'Menunggu Pelunasan' | 'Lunas' | 'Lewat Tempo';
  downPayment?: number;
}

interface SiteSettings {
    appName?: string;
    logoUrl?: string;
}

interface ServicesSettings {
    tagline?: string;
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

export default function InvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [servicesSettings, setServicesSettings] = useState<ServicesSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoiceAndSettings = async () => {
      if (!invoiceId) {
        setLoading(false);
        return;
      }
      try {
        const [invoiceDoc, siteData, servicesData] = await Promise.all([
            getDoc(doc(db, 'invoices', invoiceId)),
            getSiteSettings(),
            getServicesSettings(),
        ]);
        
        if (invoiceDoc.exists()) {
          setInvoice({ id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice);
        }
        if (siteData) {
            setSiteSettings(siteData as SiteSettings);
        }
        if (servicesData) {
            setServicesSettings(servicesData as ServicesSettings);
        }

      } catch (error) {
        console.error("Gagal mengambil data:", error);
        toast({ title: "Error", description: "Gagal memuat data faktur.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceAndSettings();
  }, [invoiceId, toast]);

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setIsProcessing(true);
    toast({ title: "Mempersiapkan PDF...", description: "Ini mungkin memakan waktu beberapa saat." });
    try {
      const canvas = await html2canvas(invoiceRef.current, { 
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth / ratio;
      
      if(imgHeight > pdfHeight){
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * ratio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = 0;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`Faktur-${invoice?.invoiceNumber}.pdf`);
    } catch(e) {
      console.error(e);
      toast({ title: "Gagal Membuat PDF", description: "Terjadi kesalahan saat membuat file PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Faktur ${invoice?.invoiceNumber}`,
        text: `Lihat faktur dari ${siteSettings?.appName}`,
        url: window.location.href,
      }).catch((error) => console.log('Gagal membagikan', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Tautan Disalin', description: 'Tautan faktur telah disalin ke papan klip.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
        <Card className="w-full max-w-4xl mx-auto"><CardContent className="p-8">
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-6 w-32" /></div>
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-96 w-full" />
        </CardContent></Card>
      </div>
    );
  }

  if (!invoice) {
    return notFound();
  }

  const subtotal = invoice.items.reduce((total, item) => total + item.quantity * item.price, 0);
  const downPayment = invoice.downPayment || 0;
  const remainingBalance = subtotal - downPayment;


  const getStatusStyles = (status: Invoice['paymentStatus']): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
        display: 'inline-block',
        padding: '2px 10px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '1',
    };
    switch (status) {
      case 'Lunas': return { ...baseStyles, backgroundColor: '#22c55e', color: 'white' };
      case 'Menunggu Pelunasan': return { ...baseStyles, backgroundColor: '#e2e8f0', color: 'black' };
      case 'Menunggu DP': return { ...baseStyles, backgroundColor: '#e2e8f0', color: 'black' };
      case 'Lewat Tempo': return { ...baseStyles, backgroundColor: '#ef4444', color: 'white' };
      default: return { ...baseStyles, border: '1px solid #e2e8f0', color: 'black' };
    }
  };


  return (
    <div className="p-4 sm:p-8 md:p-12 print:p-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
             <Card className="w-full mx-auto mb-4 print:hidden">
                <CardHeader>
                    <CardTitle>Faktur {invoice.invoiceNumber}</CardTitle>
                    <CardDescription>Bagikan atau unduh faktur Anda.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button onClick={handleShare}><Share2 className="mr-2"/> Bagikan</Button>
                    <Button variant="outline" onClick={handleDownload} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>}
                        Unduh PDF
                    </Button>
                </CardContent>
            </Card>

            <div ref={invoiceRef} className="bg-background p-0 rounded-lg shadow-sm print:shadow-none overflow-hidden">
                 <header className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10 bg-black text-white p-6 sm:p-10">
                    <div className="flex items-center gap-4">
                         <Image src="/logo-faktur.svg" alt="logo" className="h-12 w-auto" width={150} height={50}/>
                        <div>
                            <h1 className="text-2xl font-bold">{siteSettings?.appName || 'Perusahaan Anda'}</h1>
                            <p className="text-muted-foreground text-sm text-gray-300">ningratwedding.id</p>
                        </div>
                    </div>
                     <div className="text-left sm:text-right">
                        <h2 className="text-xl font-semibold text-white">{invoice.invoiceNumber}</h2>
                        <div style={getStatusStyles(invoice.paymentStatus)} className="mt-1">
                            {invoice.paymentStatus}
                        </div>
                    </div>
                </header>

                <div className="px-6 sm:px-10">
                    <div className="grid sm:grid-cols-2 gap-8 mb-10">
                        <div>
                            <h3 className="font-semibold mb-2 text-muted-foreground">DITERBITKAN UNTUK:</h3>
                            <p className="font-bold">{invoice.clientName}</p>
                            <p>{invoice.clientEmail}</p>
                            {invoice.clientWhatsapp && <p>{invoice.clientWhatsapp}</p>}
                            {invoice.clientAddress && <p className="whitespace-pre-line mt-2">{invoice.clientAddress}</p>}
                        </div>
                        <div className="text-left sm:text-right">
                             <h3 className="font-semibold text-muted-foreground">Tanggal Terbit:</h3>
                             <p>{format(invoice.issueDate.toDate(), 'd MMMM yyyy', { locale: id })}</p>
                             <h3 className="font-semibold text-muted-foreground mt-4">Jatuh Tempo:</h3>
                             <p>{format(invoice.dueDate.toDate(), 'd MMMM yyyy', { locale: id })}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Deskripsi</TableHead>
                                <TableHead className="text-center">Jumlah</TableHead>
                                <TableHead className="text-right">Harga Satuan</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {invoice.items.map((item, index) => (
                              <React.Fragment key={item.id || index}>
                                <TableRow>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(item.price)}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(item.quantity * item.price)}</TableCell>
                                </TableRow>
                                {item.subItems && item.subItems.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-0 pl-8 pr-4">
                                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 py-2">
                                                {item.subItems.map((sub, subIndex) => (
                                                    <li key={subIndex}>{sub.description}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </React.Fragment>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <Separator className="my-6"/>

                    <div className="flex justify-end">
                        <div className="grid gap-2 text-right w-full max-w-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{currencyFormatter.format(subtotal)}</span>
                            </div>
                            {downPayment > 0 && (
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Uang Muka (DP)</span>
                                    <span>- {currencyFormatter.format(downPayment)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                <span>SISA TAGIHAN</span>
                                <span>{currencyFormatter.format(remainingBalance)}</span>
                            </div>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="mt-10 pt-6 border-t">
                            <h4 className="font-semibold mb-2">Catatan:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                        </div>
                    )}
                </div>
                
                 <footer className="mt-12 p-6 sm:p-10 border-t text-xs text-muted-foreground">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold">{siteSettings?.appName || 'Ningrat Wedding'}</p>
                             {servicesSettings?.tagline && <p className="italic">{servicesSettings.tagline}</p>}
                        </div>
                         <div className="sm:text-right space-y-1">
                           {invoice.myContactInfo?.split('\n').map((line, index) => (
                                <div key={index}>{line}</div>
                           ))}
                         </div>
                    </div>
                </footer>
            </div>
        </div>
    </div>
  );
}
