
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays, BookUser, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentBlock {
  id: string;
  type: 'text' | 'h1' | 'h2' | 'image_full' | 'image_split' | 'image_tri' | 'title_and_paragraph' | 'video' | 'link';
  content: any;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  excerpt?: string;
  contentBlocks?: ContentBlock[];
  heroImageUrl?: string;
  createdAt: Timestamp;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  try {
    const q = query(collection(db, 'blogPosts'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        title: 'Postingan tidak ditemukan',
      };
    }

    const postDoc = querySnapshot.docs[0];
    const post = postDoc.data() as BlogPost;

    const title = post.title;
    const description = post.excerpt || `Sebuah postingan blog oleh ${post.author}.`;
    const ogImage = post.heroImageUrl || '/og-image.png';

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
     console.error("Gagal membuat metadata blog:", error);
     return {
        title: 'Kesalahan Server',
        description: 'Gagal memuat metadata untuk postingan ini.',
     }
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

const BlogContentRenderer = ({ blocks }: { blocks: ContentBlock[] }) => {
    return (
      <div className="space-y-4 md:space-y-8">
        {blocks.map((block) => {
          if (!block.content || (Array.isArray(block.content) && block.content.length === 0)) {
            return null;
          }

          switch (block.type) {
            case 'text':
              if (typeof block.content === 'string' && block.content.trim() === '') return null;
              return (
                <div key={block.id} className="max-w-2xl mx-auto">
                    <p className="font-story text-base md:text-lg leading-relaxed whitespace-pre-line text-gray-700 tracking-wider">
                       {block.content}
                    </p>
                </div>
              );
            case 'h1':
               if (typeof block.content === 'string' && block.content.trim() === '') return null;
              return (
                <div key={block.id} className="max-w-2xl mx-auto pt-4 md:pt-6">
                  <h1 className="font-headline text-3xl md:text-4xl tracking-tight font-bold text-gray-900">
                    {block.content}
                  </h1>
                </div>
              );
             case 'h2':
               if (typeof block.content === 'string' && block.content.trim() === '') return null;
              return (
                <div key={block.id} className="max-w-2xl mx-auto pt-3 md:pt-4">
                  <h2 className="font-headline text-2xl md:text-3xl tracking-tight font-semibold text-gray-800">
                    {block.content}
                  </h2>
                </div>
              );
            case 'title_and_paragraph':
              if (!block.content.title && !block.content.paragraph) return null;
              return (
                <div key={block.id} className="max-w-2xl mx-auto py-4 md:py-6">
                  {block.content.title && (
                    <h1 className="font-headline text-3xl md:text-4xl tracking-tight font-bold mb-4 text-gray-900">
                      {block.content.title}
                    </h1>
                  )}
                  {block.content.paragraph && (
                    <p className="font-story text-base md:text-lg leading-relaxed whitespace-pre-line text-gray-700 tracking-wider">
                      {block.content.paragraph}
                    </p>
                  )}
                </div>
              );
            case 'image_full':
              return (
                <div key={block.id} className="relative w-full overflow-hidden my-6 md:my-10 rounded-lg">
                    <Image
                        src={Array.isArray(block.content) ? block.content[0] : ''}
                        alt={`blog-image-${block.id}`}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto object-cover"
                    />
                </div>
              );
            case 'image_split':
              return (
                <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 my-6 md:my-10">
                  {(block.content as string[]).map((url, index) => (
                     <div key={index} className="relative w-full overflow-hidden rounded-lg">
                       <Image
                         src={url}
                         alt={`blog-image-${block.id}-${index}`}
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
                <div key={block.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 my-6 md:my-10">
                  {(block.content as string[]).map((url, index) => (
                     <div key={index} className="relative w-full overflow-hidden rounded-lg">
                       <Image
                         src={url}
                         alt={`blog-image-${block.id}-${index}`}
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
                            className="w-full h-full rounded-lg"
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


export default async function BlogPostPage({ params }: { params: { slug: string }}) {
  const { slug } = params;

  if (!slug) {
    return notFound();
  }

  const postsCollection = collection(db, 'blogPosts');
  const q = query(postsCollection, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return notFound();
  }

  const postDoc = querySnapshot.docs[0];
  const post = { id: postDoc.id, ...postDoc.data() } as BlogPost;
  
  return (
    <div className="animate-in fade-in duration-1000 bg-[#F8F5F1]">
      <div className="relative w-full aspect-[16/9] md:aspect-video flex items-center justify-center text-center text-white">
        {post.heroImageUrl && (
          <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30"></div>
      </div>

      <article className="container mx-auto px-4 relative z-10 pb-12 md:pb-24">
        <header className="max-w-3xl mx-auto -mt-24 md:-mt-32 mb-12 md:mb-16 bg-background p-6 md:p-10 text-center shadow-lg rounded-lg">
            <h1 className="font-headline text-3xl md:text-5xl tracking-tight text-gray-900">
                {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1.5">
                    <BookUser className="h-4 w-4" />
                    <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    <time dateTime={post.createdAt.toDate().toISOString()}>
                        {format(post.createdAt.toDate(), 'd MMMM, yyyy', { locale: id })}
                    </time>
                </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto">
            {post.contentBlocks && post.contentBlocks.length > 0 ? (
              <BlogContentRenderer blocks={post.contentBlocks} />
            ) : (
              <p className="text-center text-muted-foreground">Konten untuk postingan ini belum tersedia.</p>
            )}
        </main>
      </article>
    </div>
  );
}
