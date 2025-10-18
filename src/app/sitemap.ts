
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.ningratwedding.id';

interface Story {
  slug: string;
  updatedAt?: { toDate: () => Date };
  createdAt: { toDate: () => Date };
}

interface BlogPost {
  slug: string;
  updatedAt?: { toDate: () => Date };
  createdAt: { toDate: () => Date };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/about',
    '/portfolio',
    '/contact',
    '/services',
    '/blog',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  try {
    // Get Stories
    const storiesSnapshot = await getDocs(collection(db, 'stories'));
    const storiesRoutes = storiesSnapshot.docs.map(doc => {
      const data = doc.data() as Story;
      return {
        url: `${BASE_URL}/stories/${data.slug}`,
        lastModified: data.updatedAt ? data.updatedAt.toDate() : data.createdAt.toDate(),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    // Get Blog Posts
    const blogPostsSnapshot = await getDocs(collection(db, 'blogPosts'));
    const blogPostsRoutes = blogPostsSnapshot.docs.map(doc => {
      const data = doc.data() as BlogPost;
      return {
        url: `${BASE_URL}/blog/${data.slug}`,
        lastModified: data.updatedAt ? data.updatedAt.toDate() : data.createdAt.toDate(),
        changeFrequency: 'weekly',
        priority: 0.6,
      };
    });

    return [...staticRoutes, ...storiesRoutes, ...blogPostsRoutes];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    // Return only static routes if Firestore fetch fails
    return staticRoutes;
  }
}
