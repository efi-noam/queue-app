'use client';

import { useState, useMemo } from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  availableDays?: number[]; // 0-6, Sunday-Saturday
  isDark?: boolean;
}

export function DatePicker({ selectedDate, onSelectDate, availableDays = [0, 1, 2, 3, 4, 5], isDark = false }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  const formatDate = (date: Date): string => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    return availableDays.includes(date.getDay());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  return (
    <div className={`${isDark ? 'bg-white/10 backdrop-blur-xl' : 'bg-white shadow-gray-200/50'} rounded-3xl p-5 shadow-lg animate-scale-in`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToNextMonth}
          className={`p-2.5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-xl transition-all duration-200 hover:scale-110 active:scale-95`}
        >
          <ChevronLeftIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {hebrewMonths[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToPreviousMonth}
          className={`p-2.5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-xl transition-all duration-200 hover:scale-110 active:scale-95`}
        >
          <ChevronRightIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {hebrewDays.map((day, index) => (
          <div 
            key={day} 
            className={`text-center text-xs font-semibold py-2 ${
              index === 6 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="p-2 aspect-square" />;
          }

          const dateStr = formatDate(date);
          const isSelected = selectedDate === dateStr;
          const isAvailable = isDateAvailable(date);
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateStr}
              onClick={() => isAvailable && onSelectDate(dateStr)}
              disabled={!isAvailable}
              className={`
                relative p-2 aspect-square rounded-xl text-sm font-medium
                transition-all duration-200
                ${isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 z-10'
                  : isAvailable
                    ? `${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-blue-50 text-gray-900'} hover:scale-105`
                    : `${isDark ? 'text-gray-600' : 'text-gray-300'} cursor-not-allowed`
                }
              `}
            >
              {isTodayDate && !isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-blue-500" />
              )}
              <span className="relative">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
