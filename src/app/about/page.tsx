
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAboutSettings } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";

interface AboutSettings {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
}

const defaultSettings: AboutSettings = {
    heroImageUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2574&auto=format&fit=crop",
    headline: "Ningrat Stories lahir dari kecintaan kami dalam mengabadikan keindahan dalam momen-momen otentik.",
    paragraph: "Kami didorong oleh hasrat untuk merangkum esensi cinta, merangkainya menjadi narasi visual abadi yang menggambarkan keajaiban dan keunikan setiap kisah cinta.",
};

export default function AboutPage() {
    const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
    const [stories, setStories] = useState<ImagePlaceholder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPageData() {
            setLoading(true);
            try {
                 const [fetchedSettings, storiesSnapshot] = await Promise.all([
                    getAboutSettings(),
                    getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(6)))
                ]);
                
                setSettings({
                    heroImageUrl: fetchedSettings?.heroImageUrl || defaultSettings.heroImageUrl,
                    headline: fetchedSettings?.headline || defaultSettings.headline,
                    paragraph: fetchedSettings?.paragraph || defaultSettings.paragraph,
                });
                
                const storiesList = storiesSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        slug: data.slug,
                        title: data.category || 'Sesi Pasangan',
                        description: data.credit,
                        category: data.category || 'Pernikahan',
                        imageUrl: data.heroImageUrl || 'https://picsum.photos/seed/placeholder/800/600',
                        width: 800,
                        height: 600,
                        imageHint: 'pasangan cerita pernikahan',
                    };
                });
                setStories(storiesList);

            } catch (error) {
                console.error("Gagal mengambil data halaman tentang:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPageData();
    }, []);

    if (loading) {
        return (
             <>
                <Skeleton className="h-[60vh] md:h-[80vh] w-full" />
                <section className="bg-[#F8F5F1] text-center py-20 md:py-32">
                    <div className="container max-w-3xl mx-auto px-4">
                        <Skeleton className="h-12 md:h-14 w-full max-w-2xl mx-auto" />
                        <div className="mt-8 space-y-5">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6 mx-auto" />
                        </div>
                    </div>
                </section>
                <section className="bg-[#F8F5F1] pb-20 md:pb-32">
                    <div className="container mx-auto px-4">
                        <Skeleton className="h-10 w-48 mx-auto mb-12" />
                        <div className="flex justify-center">
                            <Skeleton className="w-full max-w-5xl h-[400px]" />
                        </div>
                    </div>
                </section>
            </>
        )
    }

  return (
    <>
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-center text-white bg-black">
        <Image
          src={settings.heroImageUrl!}
          alt="Tim Kami"
          fill
          className="object-cover opacity-50"
          data-ai-hint="tim bioskop seru"
          priority
        />
        <div className="relative z-10 p-4 max-w-2xl">
        </div>
      </section>

      <section className="bg-[#F8F5F1] text-center py-20 md:py-32">
        <div className="container max-w-3xl mx-auto px-4 animate-in fade-in duration-1500">
            <h1 className="font-headline text-4xl md:text-5xl text-[#333] tracking-tight">
                {settings.headline}
            </h1>
            <div className="mt-8 space-y-5 text-sm md:text-base text-gray-600 tracking-wider font-story whitespace-pre-line">
                <p>
                    {settings.paragraph}
                </p>
            </div>
            <div className="w-20 h-px bg-gray-300 mx-auto my-12"></div>
        </div>
      </section>

       {stories.length > 0 && (
         <section className="bg-[#F8F5F1] pb-20 md:pb-32">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl tracking-tight text-[#333]">Kisah Kami</h2>
                </div>
                 <Carousel
                    opts={{ loop: true, align: "start" }}
                    plugins={[Autoplay({ delay: 5000 })]}
                    className="w-full max-w-5xl mx-auto"
                >
                    <CarouselContent className="-ml-4">
                      {stories.map((story) => (
                        <CarouselItem key={story.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <Link href={`/stories/${story.slug}`} className="group block">
                               <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                                   <Image
                                      src={story.imageUrl}
                                      alt={story.title}
                                      fill
                                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                   />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                   <div className="absolute bottom-0 left-0 p-6 text-white">
                                     <h3 className="font-headline text-2xl font-medium tracking-tight">{story.title}</h3>
                                     <p className="text-sm uppercase tracking-widest">{story.description}</p>
                                     <div className="mt-2 text-xs uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Lihat Cerita</span>
                                        <ArrowRight className="h-3 w-3" />
                                     </div>
                                   </div>
                               </div>
                            </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden lg:flex" />
                    <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden lg:flex" />
                </Carousel>
            </div>
        </section>
       )}
    </>
  );
}
