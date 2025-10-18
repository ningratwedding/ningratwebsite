
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import StoryDetailClient from '@/components/story-detail-client';

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
  const data = storyDoc.data();
  const storyData = { 
    id: storyDoc.id, 
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  } as Story;
  
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
  
  return <StoryDetailClient story={JSON.parse(JSON.stringify(storyData))} relatedImages={relatedList} />;
}
