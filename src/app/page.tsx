
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ArrowRight, Instagram, Facebook, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { getHomeSettings } from '@/lib/actions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const socialLinks = [
    { Icon: Instagram, href: "https://www.instagram.com/ningrat_wedding" },
    { Icon: Facebook, href: "https://web.facebook.com/people/Wedding-bekasi/61552709649604/" },
    { Icon: Mail, href: "mailto:ningratwedding@gmail.com" },
]

interface HeroMedia {
    url: string;
    type: string;
}

interface HomeSettings {
    heroMedia: HeroMedia[];
    introHeadline: string;
    introParagraph1: string;
    introParagraph2: string;
}

export default function Home() {
    const [featuredStories, setFeaturedStories] = useState<ImagePlaceholder[]>([]);
    const [homeSettings, setHomeSettings] = useState<HomeSettings>({
        heroMedia: [],
        introHeadline: "Hai, Anda menemukan kami!",
        introParagraph1: "Selamat datang. Kami melihat cinta sebagai sebuah mahakarya. Merupakan suatu kehormatan Anda ada di sini, mempertimbangkan kami untuk melukiskan kisah Anda melalui lensa kami.",
        introParagraph2: "Kami mengabadikan momen-momen nyata yang tidak direkayasa—tatapan diam-diam, air mata bahagia, dan tawa lepas. Fragmen-fragmen ini dijalin bersama untuk menceritakan kisah sejati hari Anda."
    });
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchPageData = async () => {
        try {
            const [storiesSnapshot, settings] = await Promise.all([
                 getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(6))),
                 getHomeSettings()
            ]);

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
            setFeaturedStories(storiesList);

            if (settings) {
                setHomeSettings({
                    heroMedia: settings.heroMedia || [],
                    introHeadline: settings.introHeadline || "Hai, Anda menemukan kami!",
                    introParagraph1: settings.introParagraph1 || "Selamat datang. Kami melihat cinta sebagai sebuah mahakarya. Merupakan suatu kehormatan Anda ada di sini, mempertimbangkan kami untuk melukiskan kisah Anda melalui lensa kami.",
                    introParagraph2: settings.introParagraph2 || "Kami mengabadikan momen-momen nyata yang tidak direkayasa—tatapan diam-diam, air mata bahagia, dan tawa lepas. Fragmen-fragmen ini dijalin bersama untuk menceritakan kisah sejati hari Anda."
                });
            }

        } catch (error) {
            console.error('Gagal mengambil data beranda:', error);
        } finally {
            setLoading(false);
        }
        };

        fetchPageData();
    }, []);

    if (loading) {
        return (
             <div className="flex flex-col">
                <Skeleton className="w-full h-screen" />
                <div className="container mx-auto px-4 py-16 sm:py-24">
                    <div className="flex flex-col items-center text-center gap-4">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                </div>
                 <div className="container mx-auto px-4 py-16 sm:py-24">
                     <div className="grid md:grid-cols-2 gap-12 items-center">
                         <Skeleton className="w-full aspect-square rounded-lg" />
                         <div className="space-y-4">
                             <Skeleton className="h-8 w-48" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-3/4" />
                         </div>
                     </div>
                 </div>
             </div>
        )
    }

  return (
    <div className="flex flex-col bg-[#F8F5F1] animate-in fade-in duration-1500">
      <section className="relative h-[75vh] w-full flex items-center justify-center text-center text-white">
        {homeSettings.heroMedia.length > 0 ? (
           <Carousel
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 5000 })]}
            className="w-full h-full"
          >
            <CarouselContent>
              {homeSettings.heroMedia.map((media, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-[75vh]">
                    {media.type.startsWith('video') ? (
                       <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={media.url}
                        alt={`Gambar hero ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {homeSettings.heroMedia.length > 1 && (
                <>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/20 hover:bg-black/50 border-none" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/20 hover:bg-black/50 border-none" />
                </>
            )}
          </Carousel>
        ) : (
             <Image
              src="https://images.unsplash.com/photo-1595864149097-9a386b1bee2d?q=80&w=2070&auto=format&fit=crop"
              alt="Wanita dengan gaun melambai"
              fill
              className="object-cover"
              priority
              data-ai-hint="wanita elegan"
            />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </section>
      
      <section className="bg-[#F8F5F1] text-center py-20 md:py-32">
        <div className="container max-w-2xl mx-auto px-4 animate-in fade-in duration-1500">
            <h1 className="font-headline text-4xl md:text-5xl text-[#333] tracking-tight">{homeSettings.introHeadline}</h1>
            <div className="mt-8 space-y-5 text-sm md:text-base text-gray-600 tracking-wider font-story">
                <p>
                    {homeSettings.introParagraph1}
                </p>
                <p>
                    {homeSettings.introParagraph2}
                </p>
            </div>
            <div className="w-20 h-px bg-gray-300 mx-auto my-12"></div>
        </div>
      </section>

       {featuredStories.length > 0 && (
         <section className="bg-[#F8F5F1] pb-20 md:pb-32">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {featuredStories.map((story, index) => (
                    <Link key={story.id} href={`/stories/${story.slug}`} className="group relative aspect-square overflow-hidden">
                       <Image
                          src={story.imageUrl}
                          alt={story.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                       />
                       <div className="absolute inset-0 bg-black/30"></div>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                         <h1 className="font-headline text-3xl font-medium uppercase tracking-tight">{story.title}</h1>
                         <p className="text-sm uppercase tracking-widest">{story.description}</p>
                         <div className="mt-2 text-xs uppercase tracking-widest flex items-center gap-2">
                            <span>Detail</span>
                            <ArrowRight className="h-3 w-3" />
                         </div>
                       </div>
                    </Link>
                  ))}
                </div>
            </div>
        </section>
       )}


      <section className="bg-black text-center py-20 md:py-40">
            <div className="container max-w-xl mx-auto px-4">
                 <h2 className="font-headline text-4xl md:text-5xl tracking-tight text-white">Keabadianmu dimulai sekarang</h2>
                 <div className="w-20 h-px bg-gray-700 mx-auto my-8"></div>
                 <div className="space-y-4 text-sm md:text-base text-gray-300 tracking-wider font-story">
                    <p>
                        Hari pernikahan Anda lebih dari sekadar acara; ini adalah bab seumur hidup. Kami di sini untuk menangkap setiap esensinya dengan sentuhan feminin, elegan, dan abadi. Mari kita mulai percakapan.
                    </p>
                 </div>
                 <Button asChild variant="outline" className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90 border-accent hover:border-accent/90 rounded-sm uppercase tracking-widest font-normal px-8 py-6">
                    <Link href="/contact">
                       Hubungi Kami
                    </Link>
                 </Button>
            </div>
      </section>

      <section className="bg-[#F8F5F1] text-center py-16 md:py-24">
        <a href="https://www.instagram.com/ningrat_wedding" target="_blank" rel="noopener noreferrer" className="inline-flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors">
            <Instagram className="h-7 w-7" />
            <p className="mt-4 text-sm font-medium tracking-wide">Ikuti Instagram kami</p>
            <p className="text-sm uppercase tracking-widest mt-1">@ningrat_wedding</p>
        </a>
      </section>

    </div>
  );
}
