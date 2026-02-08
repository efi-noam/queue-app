'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, CalendarIcon, ClockIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { getSession, clearSession } from '@/lib/auth';
import { getCustomerAppointments, cancelAppointment } from '@/lib/api';
import type { Business, Appointment } from '@/types/database';

interface MyAppointmentsPageProps {
  business: Business;
}

interface AppointmentWithService extends Appointment {
  services?: {
    name: string;
    duration: number;
    price: number;
  };
}

export function MyAppointmentsPage({ business }: MyAppointmentsPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      const session = getSession();
      
      if (!session || session.businessId !== business.id) {
        // Not logged in - redirect to login
        router.push(`/${business.slug}/login`);
        return;
      }

      setCustomerName(session.customerName);

      try {
        const customerAppointments = await getCustomerAppointments(session.customerId);
        setAppointments(customerAppointments as AppointmentWithService[]);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [business.id, business.slug, router]);

  const handleCancelAppointment = (appointmentId: string) => {
    setConfirmDialog({
      message: 'האם אתה בטוח שברצונך לבטל את התור?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const success = await cancelAppointment(appointmentId);
          if (success) {
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

  const handleLogout = () => {
    clearSession();
    router.push(`/${business.slug}`);
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <Link
            href={`/${business.slug}`}
            className="p-2.5 -mr-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-lg text-gray-900">התורים שלי</h1>
          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
            title="יציאה"
          >
            <UserCircleIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Welcome message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">שלום {customerName}!</h2>
          <p className="text-gray-500 text-sm mt-1">
            {appointments.length > 0 
              ? `יש לך ${appointments.length} תורים קרובים`
              : 'אין לך תורים קרובים'
            }
          </p>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg shadow-gray-200/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6">אין תורים קרובים</p>
            <Link href={`/${business.slug}/book`}>
              <Button variant="primary">הזמן תור חדש</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
              >
                {/* Date and status */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-700'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }
                  `}>
                    {appointment.status === 'confirmed' ? 'מאושר' : appointment.status === 'cancelled' ? 'בוטל' : 'ממתין'}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatDate(appointment.date)}</p>
                    <p className="text-gray-500 text-sm flex items-center justify-end gap-1 mt-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatTime(appointment.start_time)}
                    </p>
                  </div>
                </div>

                {/* Service info */}
                {appointment.services && (
                  <div className="flex justify-between items-center py-3 border-t border-gray-100">
                    <span className="font-bold text-blue-600">
                      ₪{appointment.services.price}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {appointment.services.name}
                    </span>
                  </div>
                )}

                {/* Cancel button - only show for non-cancelled appointments */}
                {appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="w-full mt-3 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    בטל תור
                  </button>
                )}
              </div>
            ))}

            <div className="pt-4">
              <Link href={`/${business.slug}/book`}>
                <Button variant="outline" fullWidth>
                  הזמן תור נוסף
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Logout link */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          התנתק
        </button>

        {/* Spacer for bottom nav */}
        <div className="h-20" />
      </main>

      {/* Bottom Navigation */}
      <BottomNav slug={business.slug} theme={business.theme || 'light'} />

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
