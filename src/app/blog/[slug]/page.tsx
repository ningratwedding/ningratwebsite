
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import BlogPostClient from '@/components/blog-post-client';


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
  
  return <BlogPostClient post={post} />;
}
