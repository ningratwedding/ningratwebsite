
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PortfolioGrid from '@/components/portfolio-grid';
import { Skeleton } from '@/components/ui/skeleton';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { getPortfolioSettings } from '@/lib/actions';

interface PortfolioSettings {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
}

const defaultSettings: PortfolioSettings = {
    heroImageUrl: "https://images.unsplash.com/photo-1502675135487-e971002a6adb?q=80&w=2670&auto=format&fit=crop",
    headline: "Cerita Kami",
    paragraph: "Kumpulan momen yang telah kami hargai dan abadikan.",
};


export default function PortfolioPage() {
  const [stories, setStories] = useState<ImagePlaceholder[]>([]);
  const [settings, setSettings] = useState<PortfolioSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storiesSnapshot, fetchedSettings] = await Promise.all([
            getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc'))),
            getPortfolioSettings()
        ]);

        const storiesList = storiesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            slug: data.slug,
            title: data.title || 'Cerita Tanpa Judul',
            description: data.credit,
            category: data.category || 'Pernikahan',
            imageUrl:
              data.heroImageUrl ||
              'https://picsum.photos/seed/placeholder/800/600',
            width: 800,
            height: 600,
            imageHint: 'pasangan cerita pernikahan',
          };
        });
        setStories(storiesList);

        setSettings({
            heroImageUrl: fetchedSettings?.heroImageUrl || defaultSettings.heroImageUrl,
            headline: fetchedSettings?.headline || defaultSettings.headline,
            paragraph: fetchedSettings?.paragraph || defaultSettings.paragraph,
        });

      } catch (error) {
        console.error('Gagal mengambil data portofolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Skeleton className="h-[60vh] md:h-[70vh] w-full" />
        <div className="container mx-auto px-4 py-12 md:py-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center text-white bg-black">
        {settings.heroImageUrl && (
            <Image
              src={settings.heroImageUrl}
              alt={settings.headline || "Portofolio"}
              fill
              className="object-cover opacity-40"
              data-ai-hint="sampul portofolio"
              priority
            />
        )}
        <div className="relative z-10 p-4 max-w-3xl">
           <h1 className="font-headline text-4xl md:text-6xl tracking-tight">
             {settings.headline}
            </h1>
        </div>
      </section>
      
      <section className="bg-[#F8F5F1] text-center py-20 md:py-32">
        <div className="container max-w-2xl mx-auto px-4">
            <div className="mt-8 space-y-5 text-sm md:text-base text-gray-600 tracking-wider font-story">
                <p>
                    {settings.paragraph}
                </p>
            </div>
             <p className="text-sm italic text-muted-foreground mt-8">oleh Ningrat Wedding</p>
            <div className="w-20 h-px bg-gray-300 mx-auto my-12"></div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-24 animate-in fade-in duration-1500">
        {stories.length > 0 ? (
           <PortfolioGrid images={stories} />
        ) : (
          <div className="text-center text-muted-foreground py-20">
              Belum ada cerita yang ditemukan.
          </div>
        )}
      </div>
    </>
  );
}
