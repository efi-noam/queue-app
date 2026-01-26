'use client';

import type { Business } from '@/types/database';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface BusinessInfoProps {
  business: Business;
}

export function BusinessInfo({ business }: BusinessInfoProps) {
  const address = business.address || '';

  return (
    <div className="text-center pt-18 pb-6 px-4 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {business.name}
      </h1>
      
      {address && (
        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100/80 rounded-full text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer">
          <MapPinIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{address}</span>
        </div>
      )}
    </div>
  );
}
