'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { getAdminSession } from '@/lib/admin-auth';
import { upsertScheduleOverride, deleteScheduleOverride, formatDateLocal, getTodayLocal } from '@/lib/api';
import type { Business, BusinessHours, ScheduleOverride } from '@/types/database';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface SchedulePageProps {
  business: Business;
  businessHours: BusinessHours[];
  initialOverrides: ScheduleOverride[];
}

export function SchedulePage({ business, businessHours, initialOverrides }: SchedulePageProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>(initialOverrides);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form state
  const [formOpenTime, setFormOpenTime] = useState('09:00');
  const [formCloseTime, setFormCloseTime] = useState('18:00');
  const [formIsClosed, setFormIsClosed] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (!session || session.businessSlug !== business.slug) {
      router.push(`/${business.slug}/admin/login`);
      return;
    }
    setIsAuthorized(true);
  }, [business.slug, router]);

  // Get regular hours for a day of week
  const getRegularHours = (dayOfWeek: number) => {
    const hours = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!hours || hours.is_closed) return null;
    return { open: hours.open_time, close: hours.close_time };
  };

  // Get override for a specific date
  const getOverrideForDate = (date: string) => {
    return overrides.find(o => o.date === date);
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Add days from previous month to fill the first week
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const today = getTodayLocal();
    
    if (dateStr < today) return; // Can't edit past dates
    
    setSelectedDate(dateStr);
    
    // Check if there's an existing override
    const existing = getOverrideForDate(dateStr);
    if (existing) {
      setFormOpenTime(existing.open_time || '09:00');
      setFormCloseTime(existing.close_time || '18:00');
      setFormIsClosed(existing.is_closed);
      setFormReason(existing.reason || '');
    } else {
      // Use regular hours as default
      const dayOfWeek = date.getDay();
      const regular = getRegularHours(dayOfWeek);
      setFormOpenTime(regular?.open || '09:00');
      setFormCloseTime(regular?.close || '18:00');
      setFormIsClosed(!regular);
      setFormReason('');
    }
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    
    setIsSaving(true);
    
    const result = await upsertScheduleOverride(
      business.id,
      selectedDate,
      formIsClosed ? null : formOpenTime,
      formIsClosed ? null : formCloseTime,
      formIsClosed,
      formReason || undefined
    );

    if (result) {
      // Update local state
      const newOverride: ScheduleOverride = {
        id: result,
        business_id: business.id,
        date: selectedDate,
        open_time: formIsClosed ? null : formOpenTime,
        close_time: formIsClosed ? null : formCloseTime,
        is_closed: formIsClosed,
        reason: formReason || null,
        created_at: new Date().toISOString(),
      };
      
      setOverrides(prev => {
        const filtered = prev.filter(o => o.date !== selectedDate);
        return [...filtered, newOverride].sort((a, b) => a.date.localeCompare(b.date));
      });
      
      setSelectedDate(null);
    }
    
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    
    setIsSaving(true);
    
    const success = await deleteScheduleOverride(business.id, selectedDate);
    
    if (success) {
      setOverrides(prev => prev.filter(o => o.date !== selectedDate));
      setSelectedDate(null);
    }
    
    setIsSaving(false);
  };

  const formatDateHebrew = (dateStr: string) => {
    // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-600 animate-spin" />
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const today = getTodayLocal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <Link
            href={`/${business.slug}/admin`}
            className="p-2.5 -mr-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-lg text-gray-900">ניהול לוח זמנים</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <p className="text-sm text-blue-800">
            לחץ על תאריך כדי לשנות את שעות הפעילות ליום ספציפי.
            <br />
            שינויים אלה יחליפו את השעות הקבועות.
          </p>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg">
            {currentMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_SHORT.map((day, i) => (
              <div key={i} className="py-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const dateStr = formatDateLocal(date);
              const isPast = dateStr < today;
              const isToday = dateStr === today;
              const override = getOverrideForDate(dateStr);
              const dayOfWeek = date.getDay();
              const regularHours = getRegularHours(dayOfWeek);
              
              let statusColor = '';
              let statusText = '';
              
              if (override) {
                if (override.is_closed) {
                  statusColor = 'bg-red-100 text-red-600';
                  statusText = 'סגור';
                } else {
                  statusColor = 'bg-yellow-100 text-yellow-700';
                  statusText = override.open_time?.slice(0, 5) || '';
                }
              } else if (!regularHours) {
                statusColor = 'bg-gray-100 text-gray-400';
                statusText = 'סגור';
              }
              
              return (
                <button
                  key={i}
                  onClick={() => !isPast && isCurrentMonth && handleDateClick(date)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    relative p-2 min-h-[70px] border-b border-r border-gray-50 
                    transition-colors text-right
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isPast ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}
                    ${isToday ? 'bg-blue-50' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  {isCurrentMonth && !isPast && statusText && (
                    <div className={`mt-1 text-xs px-1 py-0.5 rounded ${statusColor}`}>
                      {statusText}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            <span>שעות שונות</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span>סגור</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
            <span>סגור (קבוע)</span>
          </div>
        </div>

        {/* Upcoming Overrides List */}
        {overrides.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-3">שינויים קרובים</h3>
            <div className="space-y-2">
              {overrides.filter(o => o.date >= today).map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDateHebrew(override.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {override.is_closed 
                        ? 'סגור' 
                        : `${override.open_time?.slice(0, 5)} - ${override.close_time?.slice(0, 5)}`
                      }
                      {override.reason && ` (${override.reason})`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const [y, mo, d] = override.date.split('-').map(Number);
                      handleDateClick(new Date(y, mo - 1, d));
                    }}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    ערוך
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{formatDateHebrew(selectedDate)}</h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Closed toggle */}
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <span className="font-medium">סגור ביום זה</span>
                <input
                  type="checkbox"
                  checked={formIsClosed}
                  onChange={(e) => setFormIsClosed(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
              </label>

              {/* Hours */}
              {!formIsClosed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">פתיחה</label>
                    <input
                      type="time"
                      value={formOpenTime}
                      onChange={(e) => setFormOpenTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">סגירה</label>
                    <input
                      type="time"
                      value={formCloseTime}
                      onChange={(e) => setFormCloseTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">סיבה (אופציונלי)</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="לדוגמה: חופשה, אירוע..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {getOverrideForDate(selectedDate) && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  isLoading={isSaving}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  מחק שינוי
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                fullWidth
              >
                <CheckIcon className="w-5 h-5" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
