'use client';

import Image from 'next/image';
import type { Business } from '@/types/database';

interface BusinessHeaderProps {
  business: Business;
}

export function BusinessHeader({ business }: BusinessHeaderProps) {
  return (
    <div className="relative">
      {/* Cover Image with Gradient Overlay */}
      <div className="h-56 sm:h-72 relative overflow-hidden">
        {business.cover_image_url ? (
          <Image
            src={business.cover_image_url}
            alt={business.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 gradient-animate" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 z-10">
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-110" />
          
          <div className="relative w-28 h-28 rounded-full bg-white shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center ring-4 ring-white/50">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={`${business.name} logo`}
                width={112}
                height={112}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {business.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
