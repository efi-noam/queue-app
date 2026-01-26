'use client';

import Image from 'next/image';
import type { GalleryImage } from '@/types/database';

interface GallerySectionProps {
  images: GalleryImage[];
  businessName: string;
}

export function GallerySection({ images, businessName }: GallerySectionProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900 text-center mb-4">קצת ממני</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden snap-center"
          >
            <Image
              src={image.image_url}
              alt={image.caption || `${businessName} - תמונה ${index + 1}`}
              width={160}
              height={160}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
