'use client';

import type { TimeSlot } from '@/types/database';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  isLoading?: boolean;
  isDark?: boolean;
}

export function TimeSlots({ slots, selectedTime, onSelectTime, isLoading = false, isDark = false }: TimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className={`w-16 h-16 ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-2xl">🕐</span>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>אין שעות פנויות בתאריך זה</p>
      </div>
    );
  }

  const availableSlots = slots.filter(slot => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className={`w-16 h-16 ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-2xl">😔</span>
        </div>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>אין שעות פנויות בתאריך זה</p>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>נסה לבחור תאריך אחר</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 animate-scale-in">
      {slots.map((slot, index) => {
        const isSelected = selectedTime === slot.time;
        
        return (
          <button
            key={slot.time}
            onClick={() => slot.available && onSelectTime(slot.time)}
            disabled={!slot.available}
            className={`
              relative py-3.5 px-2 rounded-xl text-sm font-semibold
              transition-all duration-200 animate-fade-in
              ${isSelected
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : slot.available
                  ? isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-102'
                    : 'bg-white text-gray-900 shadow-sm hover:shadow-md hover:scale-102 hover:bg-blue-50'
                  : isDark
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed line-through'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
              }
            `}
            style={{ animationDelay: `${index * 0.02}s` }}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
