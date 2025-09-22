
'use client';

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { deleteInvoice } from '@/lib/actions';
import { AdminTitleContext } from '@/contexts/AdminTitleContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  items: { description: string; quantity: number; price: number }[];
  paymentStatus: 'Menunggu DP' | 'Menunggu Pelunasan' | 'Lunas' | 'Lewat Tempo';
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
});

export default function AdminInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Faktur');
    fetchInvoices();
  }, [setPageTitle]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const invoicesCollection = collection(db, 'invoices');
      const q = query(invoicesCollection, orderBy('issueDate', 'desc'));
      const invoicesSnapshot = await getDocs(q);
      const invoicesList = invoicesSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Invoice)
      );
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Gagal mengambil faktur: ', error);
      toast({ title: "Error", description: "Gagal mengambil data faktur.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    setIsDeleting(invoiceId);
    try {
      const result = await deleteInvoice(invoiceId);
      if (result.success) {
        toast({ title: "Faktur Dihapus", description: "Faktur telah berhasil dihapus." });
        setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      } else {
        throw new Error(result.message || "Terjadi kesalahan yang tidak diketahui");
      }
    } catch (error: any) {
      toast({ title: "Penghapusan Gagal", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const calculateTotal = (items: { quantity: number; price: number }[]) => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  };

  const getStatusVariant = (status: Invoice['paymentStatus']) => {
    switch (status) {
      case 'Lunas': return 'default';
      case 'Menunggu Pelunasan': return 'secondary';
      case 'Menunggu DP': return 'secondary';
      case 'Lewat Tempo': return 'destructive';
      default: return 'outline';
    }
  };


  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Faktur</CardTitle>
                <CardDescription>Buat, kirim, dan lacak faktur untuk klien Anda.</CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1" asChild>
                    <Link href="/admin/invoice/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sm:whitespace-nowrap">Buat Faktur Baru</span>
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                <TableHead className="hidden md:table-cell text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead><span className="sr-only">Tindakan</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {invoice.issueDate ? format(invoice.issueDate.toDate(), 'd MMM yyyy', { locale: id }) : 'N/A'}
                  </TableCell>
                   <TableCell className="hidden md:table-cell text-right">
                    {currencyFormatter.format(calculateTotal(invoice.items))}
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge variant={getStatusVariant(invoice.paymentStatus)} className={cn(
                       'rounded-sm',
                       getStatusVariant(invoice.paymentStatus) === 'default' && 'bg-green-500 text-white',
                     )}>
                        {invoice.paymentStatus}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === invoice.id}>
                              {isDeleting === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Buka menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/invoice/${invoice.id}`)}>Lihat</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/invoice/edit/${invoice.id}`)}>Ubah</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">Hapus</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak akan bisa dibatalkan. Ini akan menghapus faktur <span className="font-semibold">{invoice.invoiceNumber}</span> secara permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(invoice.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Lanjutkan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada faktur yang dibuat.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
