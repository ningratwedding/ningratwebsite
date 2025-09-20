
'use client';

import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';

interface PortfolioGridProps {
  images: ImagePlaceholder[];
  onImageClick?: (image: ImagePlaceholder) => void;
}

export default function PortfolioGrid({
  images,
  onImageClick,
}: PortfolioGridProps) {
  const router = useRouter();

  const handleCardClick = (image: ImagePlaceholder) => {
    if (onImageClick) {
      onImageClick(image);
    } else {
      router.push(`/stories/${image.slug}`);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group animate-in fade-in-0 zoom-in-95 duration-500 cursor-pointer"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both',
          }}
          onClick={() => handleCardClick(image)}
        >
          <div className="overflow-hidden rounded-md">
            <div className="relative aspect-[4/3] transition-transform duration-300 group-hover:scale-105">
              <Image
                src={image.imageUrl}
                alt={image.title}
                fill
                data-ai-hint={image.imageHint}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </div>
          <div className="py-4">
              <h3 className="font-headline text-xl font-semibold uppercase tracking-tight text-gray-800">{image.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 tracking-tight">{image.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
