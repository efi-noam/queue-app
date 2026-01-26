'use client';

import type { Business } from '@/types/database';

interface AboutSectionProps {
  business: Business;
}

export function AboutSection({ business }: AboutSectionProps) {
  if (!business.description) return null;

  return (
    <div className="mx-4 my-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="relative bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-100/50 to-transparent rounded-full translate-x-12 translate-y-12" />
        
        <div className="relative">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
            <span className="w-8 h-0.5 bg-gradient-to-r from-transparent to-blue-500 rounded-full" />
            על העסק
            <span className="w-8 h-0.5 bg-gradient-to-l from-transparent to-blue-500 rounded-full" />
          </h2>
          <p className="text-gray-600 text-center leading-relaxed text-base">
            {business.description}
          </p>
        </div>
      </div>
    </div>
  );
}
