'use client';

import type { Service } from '@/types/database';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ServicesListProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  selectedServiceId?: string;
  accentGradient?: string; // e.g., "from-pink-400 to-rose-500"
  accentColor?: string; // e.g., "text-pink-500"
  isDark?: boolean;
}

export function ServicesList({ 
  services, 
  onSelectService, 
  selectedServiceId,
  accentGradient = "from-blue-500 to-blue-600",
  accentColor = "text-blue-600",
  isDark = false,
}: ServicesListProps) {
  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`w-16 h-16 ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-2xl">📋</span>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>אין שירותים זמינים כרגע</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.filter(s => s.is_active).map((service, index) => {
        const isSelected = selectedServiceId === service.id;
        
        return (
          <div
            key={service.id}
            onClick={() => onSelectService(service)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectService(service);
              }
            }}
            className={`
              relative p-5 rounded-2xl cursor-pointer select-none
              transition-all duration-300
              ${isSelected
                ? `bg-gradient-to-r ${accentGradient} shadow-xl scale-[1.02]`
                : isDark 
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.01]'
                  : 'bg-white shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/70 hover:scale-[1.01]'
              }
            `}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-4 left-4">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            )}

            <div className="flex justify-between items-start gap-4">
              {/* Price and duration */}
              <div className="flex flex-col items-end flex-shrink-0">
                <div className={`text-2xl font-bold ${isSelected ? 'text-white' : accentColor}`}>
                  <span className="text-base font-normal">₪</span>
                  {service.price}
                </div>
                <div className={`flex items-center gap-1 text-sm mt-1 ${isSelected ? 'text-white/70' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                  <ClockIcon className="w-4 h-4" />
                  <span>{service.duration} דקות</span>
                </div>
              </div>

              {/* Service info */}
              <div className="flex-1 text-right">
                <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                  {service.name}
                </h3>
                {service.description && (
                  <p className={`text-sm mt-1 ${isSelected ? 'text-white/70' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                    {service.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
