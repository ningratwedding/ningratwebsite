
'use client';

import { useEffect, useState, useContext } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { AdminTitleContext } from '@/contexts/AdminTitleContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
import { Badge } from '@/components/ui/badge';

interface Submission {
  id: string;
  name: string;
  eventType: string;
  location: string;
  whatsapp: string;
  submittedAt: Timestamp;
}

export default function AdminInboxPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Pesan Masuk');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const submissionsCollection = collection(db, 'contactSubmissions');
        const q = query(submissionsCollection, orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const subsList = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Submission)
        );
        setSubmissions(subsList);
      } catch (error) {
        console.error('Gagal mengambil pesan masuk: ', error);
        toast({
            title: "Error",
            description: "Gagal mengambil data pesan masuk.",
            variant: "destructive"
        })
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [toast]);


  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Belum ada pesan masuk.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
