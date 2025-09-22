
'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { saveInvoice, type InvoiceFormData } from '@/lib/actions';
import { AdminTitleContext } from '@/contexts/AdminTitleContext';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Nama klien wajib diisi"),
  clientEmail: z.string().email("Email klien tidak valid"),
  clientAddress: z.string().optional(),
  invoiceNumber: z.string().min(1, "Nomor faktur wajib diisi"),
  issueDate: z.date({ required_error: "Tanggal penerbitan wajib diisi." }),
  dueDate: z.date({ required_error: "Tanggal jatuh tempo wajib diisi." }),
  items: z.array(invoiceItemSchema).min(1, "Harus ada setidaknya satu item"),
  notes: z.string().optional(),
  status: z.enum(['Lunas', 'Belum Lunas', 'Lewat Tempo']),
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
});

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Buat Faktur Baru');
  }, [setPageTitle]);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-`,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
      items: [{ id: uuidv4(), description: '', quantity: 1, price: 0 }],
      notes: 'Terima kasih atas pembayaran Anda. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.',
      status: 'Belum Lunas',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    setIsProcessing(true);
    toast({ title: 'Menyimpan Faktur...', description: 'Harap tunggu sebentar.' });
    try {
      const result = await saveInvoice(values);
      if (result.success) {
        toast({ title: 'Faktur Dibuat!', description: result.message });
        router.push('/admin/invoice');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Gagal Membuat Faktur', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = form.watch('items').reduce((acc, item) => acc + (item.quantity * item.price), 0);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Klien</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem><FormLabel>Nama Klien</FormLabel><FormControl><Input placeholder="Nama lengkap klien" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="clientEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Klien</FormLabel><FormControl><Input type="email" placeholder="klien@contoh.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="clientAddress" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Alamat Klien (Opsional)</FormLabel><FormControl><Textarea placeholder="Alamat lengkap klien" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Item Faktur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                        <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-6"><FormControl><Input placeholder="Deskripsi item" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem className="col-span-6 sm:col-span-2"><FormControl><Input type="number" placeholder="Jml" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                          <FormItem className="col-span-6 sm:col-span-3"><FormControl><Input type="number" placeholder="Harga" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="destructive" size="icon" className="col-span-12 sm:col-span-1 mt-2 sm:mt-0" onClick={() => remove(index)} disabled={fields.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), description: '', quantity: 1, price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
                  </Button>
                </CardContent>
                <CardContent>
                    <div className="text-right text-lg font-bold">
                        Total: {currencyFormatter.format(totalAmount)}
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
                   <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
                          <SelectItem value="Lunas">Lunas</SelectItem>
                          <SelectItem value="Lewat Tempo">Lewat Tempo</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Catatan</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Catatan Tambahan (Opsional)</FormLabel><FormControl><Textarea placeholder="Catatan untuk klien..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end gap-2 pb-8">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/invoice')} disabled={isProcessing}>Batal</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Faktur
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
