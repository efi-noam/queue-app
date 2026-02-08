'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { getBusinessAppointments, cancelAppointment, getBusinessHours } from '@/lib/api';
import { getAdminSession, clearAdminSession } from '@/lib/admin-auth';
import type { Business, Service, Appointment, BusinessHours } from '@/types/database';

interface AdminDashboardProps {
  business: Business;
  services: Service[];
}

interface AppointmentWithDetails extends Appointment {
  customers?: {
    name: string;
    phone: string;
  };
  services?: {
    name: string;
    duration: number;
    price: number;
  };
}

// Helper to format date as YYYY-MM-DD
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AdminDashboard({ business, services }: AdminDashboardProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [businessHoursData, setBusinessHoursData] = useState<BusinessHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Check admin session
  useEffect(() => {
    const session = getAdminSession();
    if (!session || session.businessSlug !== business.slug) {
      router.push(`/${business.slug}/admin/login`);
      return;
    }
    setIsAuthorized(true);
    setAdminName(session.ownerName);
  }, [business.slug, router]);

  useEffect(() => {
    if (!isAuthorized) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [appointmentsData, hoursData] = await Promise.all([
          getBusinessAppointments(business.id),
          getBusinessHours(business.id)
        ]);
        setAppointments(appointmentsData as AppointmentWithDetails[]);
        setBusinessHoursData(hoursData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [business.id, isAuthorized]);

  const handleLogout = () => {
    clearAdminSession();
    router.push(`/${business.slug}`);
  };

  // Show loading while checking auth
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-600 animate-spin" />
      </div>
    );
  }

  const handleCancelAppointment = (appointmentId: string) => {
    setConfirmDialog({
      message: 'האם אתה בטוח שברצונך לבטל את התור?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const success = await cancelAppointment(appointmentId);
          if (success) {
            // Send cancellation notification to customer (fire and forget)
            fetch('/api/cancel-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId, cancelledBy: 'admin' }),
            }).catch(console.error);
            setAppointments(prev => prev.filter(a => a.id !== appointmentId));
          } else {
            showToast('שגיאה בביטול התור');
          }
        } catch (err) {
          console.error('Error cancelling:', err);
          showToast('שגיאה בביטול התור');
        }
      },
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Date navigation
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  const goToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  };

  const isToday = formatDateLocal(selectedDate) === formatDateLocal(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = formatDateLocal(selectedDate) === formatDateLocal(tomorrow);

  // Get appointments for selected date
  const selectedDateStr = formatDateLocal(selectedDate);
  const dayAppointments = appointments.filter(apt => apt.date === selectedDateStr && apt.status !== 'cancelled');

  // Get business hours for selected day
  const dayOfWeek = selectedDate.getDay();
  const todayHours = businessHoursData.find(h => h.day_of_week === dayOfWeek);

  // Generate timeline slots
  const generateTimelineSlots = () => {
    if (!todayHours || todayHours.is_closed || !todayHours.open_time || !todayHours.close_time) {
      return [];
    }

    const slots: { time: string; type: 'free' | 'appointment' | 'break'; appointment?: AppointmentWithDetails }[] = [];
    const [openH, openM] = todayHours.open_time.split(':').map(Number);
    const [closeH, closeM] = todayHours.close_time.split(':').map(Number);
    
    let breakStartMinutes: number | null = null;
    let breakEndMinutes: number | null = null;
    if (todayHours.break_start && todayHours.break_end) {
      const [bsH, bsM] = todayHours.break_start.split(':').map(Number);
      const [beH, beM] = todayHours.break_end.split(':').map(Number);
      breakStartMinutes = bsH * 60 + bsM;
      breakEndMinutes = beH * 60 + beM;
    }

    let currentMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    while (currentMinutes < closeMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Check if this is break time
      if (breakStartMinutes !== null && breakEndMinutes !== null &&
          currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
        slots.push({ time: timeStr, type: 'break' });
      } else {
        // Check if there's an appointment at this time
        const apt = dayAppointments.find(a => {
          const [aptH, aptM] = a.start_time.split(':').map(Number);
          return aptH * 60 + aptM === currentMinutes;
        });

        if (apt) {
          slots.push({ time: timeStr, type: 'appointment', appointment: apt });
        } else {
          // Check if this slot is covered by an ongoing appointment
          const ongoingApt = dayAppointments.find(a => {
            const [startH, startM] = a.start_time.split(':').map(Number);
            const [endH, endM] = a.end_time.split(':').map(Number);
            const aptStart = startH * 60 + startM;
            const aptEnd = endH * 60 + endM;
            return currentMinutes > aptStart && currentMinutes < aptEnd;
          });

          if (!ongoingApt) {
            slots.push({ time: timeStr, type: 'free' });
          }
        }
      }

      currentMinutes += business.slot_interval || 30;
    }

    return slots;
  };

  const timelineSlots = generateTimelineSlots();
  const freeSlots = timelineSlots.filter(s => s.type === 'free').length;

  const todayCount = appointments.filter(
    a => a.date === formatDateLocal(new Date())
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <button
            onClick={handleLogout}
            className="p-2.5 -mr-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            title="יציאה"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-lg text-gray-900">{business.name}</h1>
            <p className="text-xs text-gray-500">{adminName}</p>
          </div>
          <Link
            href={`/${business.slug}/admin/settings`}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
                <p className="text-sm text-gray-500">תורים היום</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                <p className="text-sm text-gray-500">סה״כ קרובים</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href={`/${business.slug}/admin/schedule`}
            className="flex-1 bg-white rounded-2xl p-4 shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-gray-700"
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="font-medium">לוח זמנים</span>
          </Link>
          <Link
            href={`/${business.slug}/admin/settings`}
            className="flex-1 bg-white rounded-2xl p-4 shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-gray-700"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span className="font-medium">הגדרות</span>
          </Link>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrevDay}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="font-bold text-lg text-gray-900 text-center">
              {formatSelectedDate(selectedDate)}
            </h2>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isToday
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              היום
            </button>
            <button
              onClick={goToTomorrow}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isTomorrow
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              מחר
            </button>
          </div>
        </div>

        {/* Timeline View */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          </div>
        ) : !todayHours || todayHours.is_closed ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg shadow-gray-200/50">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-gray-500 font-medium">העסק סגור ביום זה</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{dayAppointments.length}</p>
                  <p className="text-xs text-gray-500">תורים</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{freeSlots}</p>
                  <p className="text-xs text-gray-500">פנויים</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {todayHours.open_time?.slice(0, 5)} - {todayHours.close_time?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-gray-500">שעות פעילות</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {timelineSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`flex items-stretch ${
                    slot.type === 'break' ? 'bg-orange-50' :
                    slot.type === 'appointment' ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Time column */}
                  <div className="w-16 py-3 px-3 border-l border-gray-100 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-500">{slot.time}</span>
                  </div>

                  {/* Content column */}
                  <div className="flex-1 py-3 px-3">
                    {slot.type === 'break' && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍽️</span>
                        <span className="text-sm font-medium text-orange-600">הפסקה</span>
                      </div>
                    )}
                    {slot.type === 'free' && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-green-600">פנוי</span>
                      </div>
                    )}
                    {slot.type === 'appointment' && slot.appointment && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleCancelAppointment(slot.appointment!.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="בטל תור"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-gray-900 text-sm">
                              {slot.appointment.customers?.name}
                            </span>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 mt-1">
                            <a
                              href={`tel:${slot.appointment.customers?.phone}`}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <PhoneIcon className="w-3 h-3" />
                              {slot.appointment.customers?.phone}
                            </a>
                            <span className="text-xs text-blue-600 font-medium">
                              {slot.appointment.services?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav for admin */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="flex justify-around items-center max-w-md mx-auto py-3">
            <Link
              href={`/${business.slug}/admin`}
              className="flex flex-col items-center gap-1 px-6 py-2 text-blue-600"
            >
              <CalendarIcon className="w-6 h-6" />
              <span className="text-xs font-semibold">תורים</span>
            </Link>
            <Link
              href={`/${business.slug}/admin/settings`}
              className="flex flex-col items-center gap-1 px-6 py-2 text-gray-400 hover:text-gray-600"
            >
              <Cog6ToothIcon className="w-6 h-6" />
              <span className="text-xs font-medium">הגדרות</span>
            </Link>
            <Link
              href={`/${business.slug}`}
              className="flex flex-col items-center gap-1 px-6 py-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowRightIcon className="w-6 h-6" />
              <span className="text-xs font-medium">לאתר</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-gray-900 text-center font-medium mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                בטל תור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}
