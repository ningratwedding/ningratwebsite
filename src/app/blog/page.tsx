
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookUser, CalendarDays } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  author: string;
  heroImageUrl?: string;
  createdAt: Timestamp;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, 'blogPosts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(q);
        const postsList = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BlogPost));
        setPosts(postsList);
      } catch (error) {
        console.error('Gagal mengambil postingan blog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#F8F5F1] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-2/3 mx-auto mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-video rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F5F1] animate-in fade-in duration-1000">
        <section className="relative h-[50vh] w-full flex items-center justify-center text-center text-white bg-black">
            <div className="relative z-10 p-4 max-w-2xl">
                 <h1 className="font-headline text-4xl md:text-6xl tracking-tight">Jurnal Kami</h1>
                 <p className="mt-4 text-lg text-white/90">Wawasan, cerita, dan inspirasi dari dunia fotografi pernikahan.</p>
            </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col">
                  <div className="overflow-hidden rounded-lg mb-4">
                    <Image
                      src={post.heroImageUrl || 'https://picsum.photos/seed/blog/800/450'}
                      alt={post.title}
                      width={800}
                      height={450}
                      className="w-full h-auto object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h2 className="font-headline text-2xl font-semibold tracking-tight text-gray-800 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 mb-3">
                        <div className="flex items-center gap-1.5">
                            <BookUser className="h-3.5 w-3.5" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <time dateTime={post.createdAt.toDate().toISOString()}>
                                {format(post.createdAt.toDate(), 'd MMMM, yyyy', { locale: id })}
                            </time>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 flex-grow">
                      {post.excerpt}
                    </p>
                    <span className="text-sm font-semibold text-primary mt-4 inline-block">
                        Baca Selengkapnya...
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              Belum ada postingan blog yang ditemukan.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
