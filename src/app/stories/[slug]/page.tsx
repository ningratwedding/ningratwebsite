
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowUp, Share2, Link as LinkIcon } from 'lucide-react';
import PortfolioGrid from '@/components/portfolio-grid';
import { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';


interface ContentBlock {
  id: string;
  type: 'text' | 'h1' | 'h2' | 'image_full' | 'image_split' | 'image_tri' | 'title_and_paragraph' | 'video' | 'link';
  content: any;
}

interface Story {
  id: string;
  slug: string;
  title: string;
  description?: string;
  credit: string;
  story?: string;
  contentBlocks?: ContentBlock[];
  heroImageUrl?: string;
  audioFileUrl?: string;
  galleryImageUrls?: string[];
  category?: string;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  try {
    const q = query(collection(db, 'stories'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        title: 'Cerita tidak ditemukan',
      };
    }

    const storyDoc = querySnapshot.docs[0];
    const story = storyDoc.data() as Story;

    const title = story.title;
    const description = story.description || `Kisah oleh ${story.credit}.`;
    const ogImage = story.heroImageUrl || '/og-image.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("Gagal membuat metadata:", error);
    return {
      title: 'Kesalahan Server',
      description: 'Gagal memuat metadata untuk cerita ini.',
    };
  }
}

const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtube.com/watch?v=')) {
        videoId = new URL(url).searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
        videoId = new URL(url).pathname.split('/')[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const getVimeoEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('vimeo.com/')) {
        const videoId = new URL(url).pathname.split('/')[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
}


const StoryContentRenderer = ({ blocks }: { blocks: ContentBlock[] }) => {
    return (
      <div className="space-y-4 md:space-y-8">
        {blocks.map((block) => {
          if (!block.content || (Array.isArray(block.content) && block.content.length === 0)) {
            return null;
          }

          switch (block.type) {
            case 'text':
              if (typeof block.content === 'string' && block.content.trim() === '') {
                  return null;
              }
              return (
                <div key={block.id} className="max-w-xl mx-auto py-4 md:py-8">
                    <p className="font-story text-sm md:text-base leading-relaxed whitespace-pre-line text-center tracking-wider">
                       {block.content}
                    </p>
                    <Separator className="my-6 md:my-8" />
                </div>
              );
            case 'h1':
               if (typeof block.content === 'string' && block.content.trim() === '') {
                  return null;
              }
              return (
                <div key={block.id} className="max-w-xl mx-auto py-2 md:py-4">
                  <h1 className="font-headline text-3xl md:text-4xl tracking-tight text-center font-bold">
                    {block.content}
                  </h1>
                </div>
              );
             case 'h2':
               if (typeof block.content === 'string' && block.content.trim() === '') {
                  return null;
              }
              return (
                <div key={block.id} className="max-w-xl mx-auto py-2 md:py-4">
                  <h2 className="font-headline text-2xl md:text-3xl tracking-tight text-center font-semibold">
                    {block.content}
                  </h2>
                </div>
              );
            case 'title_and_paragraph':
              if (!block.content.title && !block.content.paragraph) {
                return null;
              }
              return (
                <div key={block.id} className="max-w-xl mx-auto py-4 md:py-8">
                  {block.content.title && (
                    <h1 className="font-headline text-3xl md:text-4xl tracking-tight text-center font-bold mb-4">
                      {block.content.title}
                    </h1>
                  )}
                  {block.content.paragraph && (
                    <p className="font-story text-sm md:text-base leading-relaxed whitespace-pre-line text-center tracking-wider">
                      {block.content.paragraph}
                    </p>
                  )}
                  <Separator className="my-6 md:my-8" />
                </div>
              );
            case 'image_full':
              return (
                <div key={block.id} className="relative w-full overflow-hidden">
                    <Image
                        src={Array.isArray(block.content) ? block.content[0] : ''}
                        alt={`gambar-cerita-${block.id}`}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto object-cover"
                    />
                </div>
              );
            case 'image_split':
              return (
                <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(block.content as string[]).map((url, index) => (
                     <div key={index} className="relative w-full overflow-hidden">
                       <Image
                         src={url}
                         alt={`gambar-cerita-${block.id}-${index}`}
                         width={0}
                         height={0}
                         sizes="50vw"
                         className="w-full h-auto object-cover"
                       />
                     </div>
                  ))}
                </div>
              );
            case 'image_tri':
                 return (
                <div key={block.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {(block.content as string[]).map((url, index) => (
                     <div key={index} className="relative w-full overflow-hidden">
                       <Image
                         src={url}
                         alt={`gambar-cerita-${block.id}-${index}`}
                         width={0}
                         height={0}
                         sizes="33vw"
                         className="w-full h-auto object-cover"
                       />
                     </div>
                  ))}
                </div>
              );
            case 'video':
                const youtubeUrl = getYoutubeEmbedUrl(block.content);
                const vimeoUrl = getVimeoEmbedUrl(block.content);
                const embedUrl = youtubeUrl || vimeoUrl;

                if (!embedUrl) return null;

                return (
                    <div key={block.id} className="w-full aspect-video my-6 md:my-10">
                        <iframe
                            src={embedUrl}
                            title={`video-${block.id}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                );
             case 'link':
                 if (!block.content.url || !block.content.text) return null;
                 return (
                     <div key={block.id} className="text-center my-6 md:my-10">
                         <Button asChild variant="link" className="text-lg">
                             <Link href={block.content.url} target="_blank" rel="noopener noreferrer">
                                 <LinkIcon className="mr-2 h-4 w-4" />
                                 {block.content.text}
                             </Link>
                         </Button>
                     </div>
                 );
            default:
              return null;
          }
        })}
      </div>
    );
};

function StoryDetailClient({ story, relatedImages }: { story: Story; relatedImages: ImagePlaceholder[] }) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => setIsAudioPlaying(true);
  const handlePause = () => setIsAudioPlaying(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handlePause);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handlePause);
      };
    }
  }, [story]);
  
  const isNewStory = story.contentBlocks && story.contentBlocks.length > 0;
  const description = story.description || '';

  return (
    <div className="animate-in fade-in duration-1000 bg-[#F8F5F1]">
      <div className="relative w-full aspect-[4/5] md:aspect-video flex items-center justify-center text-center text-white">
        {story.heroImageUrl && (
          <Image
              src={story.heroImageUrl}
              alt={story.title}
              fill
              className="object-cover"
              priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20"></div>
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
            <h1 className="font-headline text-4xl md:text-6xl tracking-tight text-white">
                {story.title}
            </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pb-12 md:pb-24">
        
        <div className="max-w-3xl mx-auto my-12 md:my-16 p-6 md:p-10 text-center">
            {description && (
              <p className="text-base text-gray-700 max-w-2xl mx-auto">
                  {description}
              </p>
            )}
            <p className="text-sm italic text-muted-foreground mt-5">{story.credit}</p>
            
            {(description || story.credit) && <div className="w-24 border-t border-gray-300 my-6 mx-auto"></div>}

            {story.audioFileUrl && (
              <div
                className={cn(
                  'w-full max-w-sm flex flex-col items-center transition-all duration-300 mx-auto',
                  isAudioPlaying &&
                    'fixed bottom-0 left-0 w-full max-w-full bg-background/80 backdrop-blur-sm p-2 md:p-4 border-t z-50'
                )}
              >
                 {isAudioPlaying && (
                    <div className="text-center mb-2 w-full max-w-2xl mx-auto px-4">
                      <p className="text-sm font-semibold truncate">{story.title}</p>
                      <p className="text-xs text-muted-foreground">{story.credit}</p>
                    </div>
                 )}
                <audio
                  ref={audioRef}
                  controls
                  src={story.audioFileUrl}
                  className={cn(
                    'w-full bg-transparent',
                    isAudioPlaying ? 'max-w-2xl' : 'rounded-lg'
                  )}
                >
                  Browser Anda tidak mendukung elemen audio.
                </audio>
                {!isAudioPlaying && (
                    <p className="text-sm italic text-muted-foreground mt-3">
                    Dengarkan ceritanya
                    </p>
                )}
              </div>
            )}
        </div>


            <div className="max-w-5xl mx-auto">
              {isNewStory ? (
                  <StoryContentRenderer blocks={story.contentBlocks!} />
              ) : (
                  <div className="max-w-2xl mx-auto">
                      {story.story && (
                          <p className="font-story text-sm md:text-base leading-relaxed whitespace-pre-line text-center tracking-wider">
                            {story.story}
                          </p>
                      )}

                      {story.galleryImageUrls && story.galleryImageUrls.length > 0 && (
                        <div className="mt-16 md:mt-24">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {story.galleryImageUrls.map((url, index) => (
                              <div
                                key={index}
                                className="relative aspect-[4/5] overflow-hidden rounded-md"
                              >
                                <Image
                                  src={url}
                                  alt={`detail ${index + 1}`}
                                  fill
                                  className="object-cover transition-transform duration-300 hover:scale-105"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
              )}
            </div>

            <div className="text-center my-16 md:my-24">
              <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Share2 className="mr-2 h-4 w-4" />
                Bagikan Cerita Ini
              </Button>
            </div>

            {relatedImages.length > 0 && (
              <div className="pt-8">
                <div className="flex flex-col items-center text-center mb-12">
                  <h2 className="text-3xl font-headline tracking-tight">
                    Anda Mungkin Juga Suka
                  </h2>
                </div>
                <PortfolioGrid images={relatedImages} />
              </div>
            )}
       
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
            <span className="sr-only">Gulir ke atas</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default async function StoryDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    return notFound();
  }

  const storiesCollection = collection(db, 'stories');
  const q = query(storiesCollection, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return notFound();
  }

  const storyDoc = querySnapshot.docs[0];
  const storyData = { id: storyDoc.id, ...storyDoc.data() } as Story;
  
  const relatedQuery = query(
    storiesCollection,
    where('category', '==', storyData.category || 'Weddings'),
    where('__name__', '!=', storyData.id),
    limit(3)
  );
  const relatedSnapshot = await getDocs(relatedQuery);
  const relatedList: ImagePlaceholder[] = relatedSnapshot.docs.map((doc) => {
     const data = doc.data();
     let description = data.description || 'Lihat cerita';
     if (description.length > 70) {
        description = description.substring(0, 70) + '...';
     }
     return {
       id: doc.id,
       slug: data.slug,
       title: data.title,
       description: description,
       category: data.category || 'Pernikahan',
       imageUrl: data.heroImageUrl || 'https://picsum.photos/seed/placeholder/800/600',
       width: 800,
       height: 600,
       imageHint: 'foto cerita',
     };
  });
  
  return <StoryDetailClient story={storyData} relatedImages={relatedList} />;
}
