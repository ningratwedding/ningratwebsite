
'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { updateInvoice, type InvoiceFormData } from '@/lib/actions';
import { AdminTitleContext } from '@/contexts/AdminTitleContext';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const subItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Deskripsi sub-item tidak boleh kosong'),
});

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  subItems: z.array(subItemSchema).optional(),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Nama klien wajib diisi"),
  clientEmail: z.string().email("Email klien tidak valid").optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientWhatsapp: z.string().optional(),
  myContactInfo: z.string().optional(),
  invoiceNumber: z.string().min(1, "Nomor faktur wajib diisi"),
  issueDate: z.date({ required_error: "Tanggal penerbitan wajib diisi." }),
  dueDate: z.date({ required_error: "Tanggal jatuh tempo wajib diisi." }),
  items: z.array(invoiceItemSchema).min(1, "Harus ada setidaknya satu item"),
  notes: z.string().optional(),
  paymentStatus: z.enum(['Menunggu DP', 'Menunggu Pelunasan', 'Lunas', 'Lewat Tempo']),
  downPayment: z.coerce.number().optional(),
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

const InvoiceItemRow = ({ itemIndex, control, remove, fieldsLength }: { itemIndex: number, control: any, remove: (index: number) => void, fieldsLength: number }) => {
    const { fields: subItemFields, append: appendSubItem, remove: removeSubItem } = useFieldArray({
      control,
      name: `items.${itemIndex}.subItems`
    });
  
    return (
      <div className="rounded-lg border p-4 mb-4">
         <div className="grid grid-cols-12 gap-2 items-start">
             <FormField control={control} name={`items.${itemIndex}.description`} render={({ field }) => (
                <FormItem className="col-span-12 sm:col-span-6"><FormControl><Input placeholder="Deskripsi item utama" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name={`items.${itemIndex}.quantity`} render={({ field }) => (
                <FormItem className="col-span-6 sm:col-span-2"><FormControl><Input type="number" placeholder="Jml" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name={`items.${itemIndex}.price`} render={({ field }) => (
                <FormItem className="col-span-6 sm:col-span-3"><FormControl><Input type="number" placeholder="Harga" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="button" variant="destructive" size="icon" className="col-span-12 sm:col-span-1 sm:ml-auto" onClick={() => remove(itemIndex)} disabled={fieldsLength <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
         </div>
          <div className="pl-4 mt-3 space-y-2">
            {subItemFields.map((subItem, subIndex) => (
               <div key={subItem.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">&#9500;</span>
                  <FormField control={control} name={`items.${itemIndex}.subItems.${subIndex}.description`} render={({ field }) => (
                    <FormItem className="flex-grow"><FormControl><Input placeholder="Deskripsi sub-item" {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSubItem(subIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
               </div>
            ))}
             <Button type="button" size="sm" variant="ghost" onClick={() => appendSubItem({ id: uuidv4(), description: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Sub-Item
            </Button>
          </div>
      </div>
    )
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Ubah Faktur');
  }, [setPageTitle]);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
  });

  useEffect(() => {
    const fetchInvoiceData = async (id: string) => {
      setLoading(true);
      try {
        const invoiceRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(invoiceRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            ...data,
            issueDate: (data.issueDate as Timestamp).toDate(),
            dueDate: (data.dueDate as Timestamp).toDate(),
            items: data.items.map((item: any) => ({ ...item, id: item.id || uuidv4() })),
          });
        } else {
          toast({ title: "Tidak Ditemukan", description: "Faktur tidak dapat ditemukan.", variant: "destructive" });
          router.push('/admin/invoice');
        }
      } catch (error) {
        console.error("Gagal mengambil faktur:", error);
        toast({ title: "Error", description: "Gagal mengambil data faktur.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [invoiceId, router, toast, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    setIsProcessing(true);
    toast({ title: 'Memperbarui Faktur...', description: 'Harap tunggu sebentar.' });
    try {
      const result = await updateInvoice(invoiceId, values);
      if (result.success) {
        toast({ title: 'Faktur Diperbarui!', description: result.message });
        router.push('/admin/invoice');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Gagal Memperbarui Faktur', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const watchedItems = form.watch('items');
  const watchedDownPayment = form.watch('downPayment');
  const subtotal = watchedItems?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  const remainingBalance = subtotal - (watchedDownPayment || 0);
  
  if (loading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-72 w-full" />
                </div>
             </div>
        </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader><CardTitle>Informasi Klien</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem><FormLabel>Nama Klien</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="clientEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Klien (Opsional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="clientWhatsapp" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>WhatsApp Klien (Opsional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="clientAddress" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Alamat Klien (Opsional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Item Faktur</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    {fields.map((field, index) => (
                      <InvoiceItemRow
                        key={field.id}
                        itemIndex={index}
                        control={form.control}
                        remove={remove}
                        fieldsLength={fields.length}
                      />
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), description: '', quantity: 1, price: 0, subItems: [] })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
                  </Button>
                   <Separator />
                   <div className="space-y-4 text-right">
                        <div className="flex justify-end items-center gap-4">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold w-40">{currencyFormatter.format(subtotal)}</span>
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            <span className="text-muted-foreground">DP Dibayar</span>
                            <span className="font-semibold w-40">{currencyFormatter.format(watchedDownPayment || 0)}</span>
                        </div>
                        <div className="flex justify-end items-center gap-4 text-lg">
                            <span className="font-bold">Sisa Tagihan</span>
                            <span className="font-bold w-40">{currencyFormatter.format(remainingBalance)}</span>
                        </div>
                   </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8 sticky top-24">
              <Card>
                <CardHeader><CardTitle>Detail Faktur</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nomor Faktur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Tanggal Penerbitan</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, 'd MMMM yyyy', { locale: id }) : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover><FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Tanggal Jatuh Tempo</FormLabel>
                       <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, 'd MMMM yyyy', { locale: id }) : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover><FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="downPayment" render={({ field }) => (
                    <FormItem><FormLabel>Uang Muka (DP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                    <FormItem><FormLabel>Status Pembayaran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="Menunggu DP">Menunggu DP</SelectItem>
                          <SelectItem value="Menunggu Pelunasan">Menunggu Pelunasan</SelectItem>
                          <SelectItem value="Lunas">Lunas</SelectItem>
                          <SelectItem value="Lewat Tempo">Lewat Tempo</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Informasi Bisnis & Catatan</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="myContactInfo" render={({ field }) => (
                      <FormItem><FormLabel>Informasi Kontak Anda (Opsional)</FormLabel><FormControl><Textarea {...field} className="min-h-24"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Catatan Tambahan (Opsional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end gap-2 pb-8">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/invoice')} disabled={isProcessing}>Batal</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perbarui Faktur
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
