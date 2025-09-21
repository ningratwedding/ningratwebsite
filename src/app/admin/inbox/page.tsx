
'use client';

import { useEffect, useState, useContext } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { AdminTitleContext } from '@/contexts/AdminTitleContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { getInboxSettings, saveInboxSettings } from '@/lib/actions';
import FileManagerDialog from "@/components/file-manager-dialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, File as FileIcon, X, Library } from 'lucide-react';


interface Submission {
  id: string;
  name: string;
  eventType: string;
  location: string;
  whatsapp: string;
  submittedAt: Timestamp;
}

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.459l-6.323 1.751zm7.412-8.995c-.193.124-1.109.559-1.282.627-.172.069-.344.093-.465.093-.232 0-.44-.069-.64-.138-.344-.138-.781-.345-1.172-.621-1.339-.965-2.22-2.179-2.393-2.346-.172-.169-.345-.38-.345-.621s.093-.345.161-.414c.068-.068.161-.184.23-.276.069-.093.115-.115.184-.115.115 0 .207.023.276.023.115.023.23.069.322.184.116.116.322.782.368.828.046.046.069.092.069.138 0 .092-.023.184-.046.207-.023.023-.069.069-.115.115-.046.046-.092.092-.127.127-.023.023-.046.046-.069.069-.046.046-.023.092 0 .138.161.253.943 1.524 2.158 2.506.253.207.483.345.713.414.23.069.414.069.53.046.115-.023.644-.276.782-.345.138-.069.23-.046.322.023.092.069.414.506.46.575.046.068.069.115.069.161.001.093-.023.161-.069.207-.046.046-.345.207-.483.276z"/>
    </svg>
)

export default function AdminInboxPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState("Hai [nama],\nCinta pantas dirayakan dengan indah.\nKami Ningrat Wedding hadir untuk membantu merangkai hari bahagia jadi kenangan abadi.\n\nDetail penawaran jasa pernikahan Terbaru Kami ada di file terlampir ya. Terimakasih!");
  const [templateFileUrl, setTemplateFileUrl] = useState<string | null>(null);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Pesan Masuk');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      try {
        const [submissionsSnapshot, settings] = await Promise.all([
           getDocs(query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'))),
           getInboxSettings()
        ]);

        const subsList = submissionsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Submission)
        );
        setSubmissions(subsList);
        
        if(settings) {
            setWhatsappTemplate(settings.whatsappTemplate || "Hai [nama],\nCinta pantas dirayakan dengan indah.\nKami Ningrat Wedding hadir untuk membantu merangkai hari bahagia jadi kenangan abadi.\n\nDetail penawaran jasa pernikahan Terbaru Kami ada di file terlampir ya. Terimakasih!");
            setTemplateFileUrl(settings.templateFileUrl || null);
        }

      } catch (error) {
        console.error('Gagal mengambil data halaman pesan masuk: ', error);
        toast({
            title: "Error",
            description: "Gagal mengambil data pesan masuk.",
            variant: "destructive"
        })
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [toast]);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
        const result = await saveInboxSettings({ whatsappTemplate, templateFileUrl: templateFileUrl || undefined });
        if (result.success) {
            toast({
                title: "Sukses!",
                description: "Templat pesan WhatsApp telah disimpan."
            });
        } else {
            throw new Error(result.message || "Gagal menyimpan templat.");
        }
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleFileSelect = (file: { url: string }) => {
    setTemplateFileUrl(file.url);
    setIsFileManagerOpen(false);
  };


  const formatWhatsappUrl = (number: string, name: string) => {
    let formattedNumber = number.replace(/[^0-9]/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    }

    let message = whatsappTemplate
      .replace(/\[nama\]/gi, name)
      .replace(/\[file\]/gi, templateFileUrl || '');

    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  };


  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
         <Card>
            <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
         </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
    <FileManagerDialog 
        open={isFileManagerOpen}
        onOpenChange={setIsFileManagerOpen}
        onFileSelect={handleFileSelect}
    />
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Templat Pesan WhatsApp</CardTitle>
          <CardDescription>
            Atur pesan otomatis. Gunakan `[nama]` untuk nama klien dan `[file]` untuk tautan lampiran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-template">Templat Pesan</Label>
            <Textarea 
              id="whatsapp-template"
              placeholder="Contoh: Halo [nama], terima kasih telah menghubungi. Berikut katalog kami: [file]"
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="min-h-[150px]"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Lampiran File</Label>
            {templateFileUrl ? (
                <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {templateFileUrl.split('/').pop()}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTemplateFileUrl(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                 <Button variant="outline" onClick={() => setIsFileManagerOpen(true)} disabled={isSaving}>
                    <Library className="mr-2 h-4 w-4" />
                    Pilih File Lampiran
                 </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Opsional: Pilih file untuk disertakan sebagai tautan dalam templat.
            </p>
          </div>
          
          <Button onClick={handleSaveTemplate} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Templat
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Pesan Masuk Formulir Kontak</CardTitle>
            <CardDescription>
              Lihat semua pesan yang dikirim melalui formulir kontak Anda.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Jenis Acara</TableHead>
                <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                <TableHead className="hidden lg:table-cell">WhatsApp</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
                <TableHead><span className="sr-only">Tindakan</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length > 0 ? submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{sub.eventType}</TableCell>
                  <TableCell className="hidden md:table-cell">{sub.location}</TableCell>
                  <TableCell className="hidden lg:table-cell">{sub.whatsapp}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                     {sub.submittedAt ? format(sub.submittedAt.toDate(), 'PPP, HH:mm', { locale: id }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="icon">
                        <Link href={formatWhatsappUrl(sub.whatsapp, sub.name)} target="_blank">
                            <WhatsappIcon />
                            <span className="sr-only">Kirim WhatsApp</span>
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Belum ada pesan masuk.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
    </>
  );
}
