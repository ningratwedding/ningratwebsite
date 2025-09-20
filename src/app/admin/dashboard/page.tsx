
'use client';

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { deleteStory } from '@/lib/actions';
import { AdminTitleContext } from '@/contexts/AdminTitleContext';

import { categories } from '@/lib/placeholder-images';
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

interface Story {
  id: string;
  title: string;
  slug: string;
  category?: string;
  heroImageUrl?: string;
  credit: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Dasbor');
  }, [setPageTitle]);


  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchStories();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const storiesCollection = collection(db, 'stories');
      const q = query(storiesCollection, orderBy('createdAt', 'desc'));
      const storiesSnapshot = await getDocs(q);
      const storiesList = storiesSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Story)
      );
      setStories(storiesList);
    } catch (error) {
      console.error('Gagal mengambil cerita: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    setIsDeleting(storyId);
    try {
      const result = await deleteStory(storyId);
       if (result.success) {
         toast({
            title: "Cerita Dihapus",
            description: "Cerita telah berhasil dihapus.",
         });
         setStories(prevStories => prevStories.filter(story => story.id !== storyId));
       } else {
         throw new Error(result.message || "Terjadi kesalahan yang tidak diketahui");
       }

    } catch (error: any) {
        toast({
            title: "Penghapusan Gagal",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cerita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Cerita Portofolio</CardTitle>
                <CardDescription>
                  Kelola cerita terbaru Anda di sini.
                </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1" asChild>
                    <Link href="/admin/stories/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Tambah Cerita Baru
                        </span>
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Gambar</span>
                </TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>
                  <span className="sr-only">Tindakan</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={story.title}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={story.heroImageUrl || '/placeholder.svg'}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{story.title}</TableCell>
                  <TableCell>
                    <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={isDeleting === story.id}
                            >
                              {isDeleting === story.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              <span className="sr-only">Buka menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/stories/${story.slug}`)}
                            >
                              Lihat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                               onClick={() => router.push(`/admin/stories/edit/${story.id}`)}
                            >
                              Ubah
                            </DropdownMenuItem>
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    Hapus
                                </DropdownMenuItem>
                             </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus cerita secara permanen
                                berjudul <span className="font-semibold">"{story.title}"</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(story.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Lanjutkan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
