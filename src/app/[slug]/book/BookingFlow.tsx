'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ServicesList } from '@/components/business/ServicesList';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { AuthFlow } from '@/components/booking/AuthFlow';
import { getAvailableTimeSlots, createAppointment } from '@/lib/api';
import { getSession, saveSession } from '@/lib/auth';
import type { Business, Service, BusinessHours, BookingFormData, TimeSlot } from '@/types/database';

// Theme configurations
const themes = {
  light: {
    bg: 'bg-gradient-to-b from-gray-50 to-white',
    headerBg: 'bg-white/80',
    headerBorder: 'border-gray-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'from-blue-500 to-blue-600',
    accentSolid: 'bg-blue-500',
    progressBg: 'bg-gray-100',
    progressActive: 'bg-blue-500',
    cardBg: 'bg-white',
  },
  dark: {
    bg: 'bg-gray-950',
    headerBg: 'bg-gray-900/80',
    headerBorder: 'border-gray-800',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'from-purple-500 to-cyan-500',
    accentSolid: 'bg-purple-500',
    progressBg: 'bg-gray-800',
    progressActive: 'bg-purple-500',
    cardBg: 'bg-gray-900',
  },
  ocean: {
    bg: 'bg-gradient-to-b from-cyan-50 to-white',
    headerBg: 'bg-white/80',
    headerBorder: 'border-cyan-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'from-cyan-500 to-blue-600',
    accentSolid: 'bg-cyan-500',
    progressBg: 'bg-cyan-100',
    progressActive: 'bg-cyan-500',
    cardBg: 'bg-white',
  },
  sunset: {
    bg: 'bg-gradient-to-b from-orange-50 to-white',
    headerBg: 'bg-white/80',
    headerBorder: 'border-orange-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'from-orange-500 to-pink-600',
    accentSolid: 'bg-orange-500',
    progressBg: 'bg-orange-100',
    progressActive: 'bg-orange-500',
    cardBg: 'bg-white',
  },
  forest: {
    bg: 'bg-gradient-to-b from-emerald-50 to-white',
    headerBg: 'bg-white/80',
    headerBorder: 'border-emerald-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'from-emerald-500 to-green-600',
    accentSolid: 'bg-emerald-500',
    progressBg: 'bg-emerald-100',
    progressActive: 'bg-emerald-500',
    cardBg: 'bg-white',
  },
  rose: {
    bg: 'bg-gradient-to-b from-pink-50 to-white',
    headerBg: 'bg-white/80',
    headerBorder: 'border-pink-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'from-pink-400 to-rose-500',
    accentSolid: 'bg-pink-500',
    progressBg: 'bg-pink-100',
    progressActive: 'bg-pink-500',
    cardBg: 'bg-white',
  },
  modern: {
    bg: 'bg-gray-950',
    headerBg: 'bg-gray-950/80',
    headerBorder: 'border-gray-800',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'from-violet-500 to-fuchsia-500',
    accentSolid: 'bg-violet-500',
    progressBg: 'bg-gray-800',
    progressActive: 'bg-violet-500',
    cardBg: 'bg-gray-900',
  },
};

interface BookingFlowProps {
  business: Business;
  services: Service[];
  businessHours: BusinessHours[];
}

type Step = 'service' | 'datetime' | 'details' | 'confirmation';

export function BookingFlow({ business, services, businessHours }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Check if user is logged in
  const [session, setSession] = useState<{ customerId: string; customerName: string; phone: string } | null>(null);
  
  useEffect(() => {
    const currentSession = getSession();
    if (currentSession && currentSession.businessId === business.id) {
      setSession(currentSession);
    }
  }, [business.id]);

  const isLoggedIn = session !== null;

  const availableDays = businessHours
    .filter(h => !h.is_closed)
    .map(h => h.day_of_week);

  // Load time slots when date or service changes
  useEffect(() => {
    async function loadTimeSlots() {
      if (!selectedDate || !selectedService) {
        setTimeSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slots = await getAvailableTimeSlots(
          business.id,
          selectedDate,
          selectedService.duration
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        setTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    loadTimeSlots();
  }, [selectedDate, selectedService, business.id]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime(null);
    setCurrentStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    
    // If logged in, skip details and book directly
    if (isLoggedIn && session) {
      await handleBookingForLoggedInUser(time);
    } else {
      setCurrentStep('details');
    }
  };

  // Handle booking for logged-in users (skip details form)
  const handleBookingForLoggedInUser = async (time: string) => {
    if (!selectedService || !selectedDate || !session) return;

    setIsSubmitting(true);
    
    try {
      // Calculate end time
      const [hours, mins] = time.split(':').map(Number);
      const endMinutes = hours * 60 + mins + selectedService.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Create appointment using session customer ID
      const appointment = await createAppointment(
        business.id,
        session.customerId,
        selectedService.id,
        selectedDate,
        time,
        endTime,
        undefined
      );

      if (!appointment) {
        throw new Error('Failed to create appointment');
      }

      const fullBookingData: BookingFormData = {
        service_id: selectedService.id,
        date: selectedDate,
        time: time,
        customer_name: session.customerName,
        customer_phone: session.phone,
      };

      setBookingData(fullBookingData);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('שגיאה בקביעת התור. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthComplete = async (customer: { id: string; name: string; phone: string; email?: string }) => {
    // User authenticated, now create the booking
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    try {
      // Update session state
      setSession({
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
      });

      // Also save to auth module
      saveSession({
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        businessId: business.id,
      });

      // Calculate end time
      const [hours, mins] = selectedTime.split(':').map(Number);
      const endMinutes = hours * 60 + mins + selectedService.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Create appointment
      const appointment = await createAppointment(
        business.id,
        customer.id,
        selectedService.id,
        selectedDate,
        selectedTime,
        endTime,
        undefined
      );

      if (!appointment) {
        throw new Error('Failed to create appointment');
      }

      const fullBookingData: BookingFormData = {
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        customer_name: customer.name,
        customer_phone: customer.phone,
      };

      setBookingData(fullBookingData);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('שגיאה בקביעת התור. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('service');
        break;
      case 'details':
        setCurrentStep('datetime');
        break;
    }
  };

  // Determine if back button should be a link (for navigation) or button (for step change)
  const isBackButtonLink = currentStep === 'service' || currentStep === 'confirmation';
  const backHref = `/${business.slug}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Steps - skip 'details' step if logged in
  const steps = isLoggedIn
    ? [
        { id: 'service', label: 'שירות', number: 1 },
        { id: 'datetime', label: 'מועד', number: 2 },
      ]
    : [
        { id: 'service', label: 'שירות', number: 1 },
        { id: 'datetime', label: 'מועד', number: 2 },
        { id: 'details', label: 'פרטים', number: 3 },
      ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Get theme
  const theme = themes[business.theme as keyof typeof themes] || themes.light;
  const isDark = business.theme === 'dark' || business.theme === 'modern';

  return (
    <div className={`min-h-screen ${theme.bg} ${isDark ? 'text-white' : ''}`}>
      {/* Header */}
      <header className={`${theme.headerBg} backdrop-blur-xl border-b ${theme.headerBorder} sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          {isBackButtonLink ? (
            <Link
              href={backHref}
              className={`p-2.5 -mr-2 hover:bg-black/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95`}
            >
              <ArrowRightIcon className={`w-5 h-5 ${theme.textMuted}`} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className={`p-2.5 -mr-2 hover:bg-black/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95`}
            >
              <ArrowRightIcon className={`w-5 h-5 ${theme.textMuted}`} />
            </button>
          )}
          <h1 className={`font-bold text-lg ${theme.text}`}>הזמן תור</h1>
          <div className="w-10" />
        </div>

        {/* Progress indicator */}
        {currentStep !== 'confirmation' && (
          <div className="flex justify-center gap-3 pb-4 px-4 max-w-lg mx-auto">
            {steps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                    transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-br ${theme.accent} text-white shadow-lg` 
                      : `${theme.progressBg} ${isDark ? 'text-gray-500' : 'text-gray-400'}`
                    }
                    ${isCurrent ? 'scale-110' : ''}
                  `}>
                    {index < currentStepIndex ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-12 h-1 rounded-full transition-all duration-300
                      ${index < currentStepIndex ? theme.progressActive : (isDark ? 'bg-gray-800' : 'bg-gray-200')}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Loading overlay for logged-in booking */}
        {isSubmitting && isLoggedIn && (
          <div className={`fixed inset-0 ${isDark ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex items-center justify-center`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full border-4 ${isDark ? 'border-gray-800' : 'border-gray-200'} border-t-current animate-spin mx-auto mb-4 ${theme.progressActive.replace('bg-', 'text-')}`} />
              <p className={`${theme.textMuted} font-medium`}>קובע תור...</p>
            </div>
          </div>
        )}

        {/* Logged in indicator */}
        {isLoggedIn && session && currentStep !== 'confirmation' && (
          <div className={`${isDark ? 'bg-white/5 border-white/10' : `${theme.progressBg} border-${theme.accentSolid.replace('bg-', '')}/20`} border rounded-2xl p-4 mb-6 flex items-center justify-between`}>
            <Link
              href={`/${business.slug}/my-appointments`}
              className={`${theme.accentSolid.replace('bg-', 'text-')} text-sm font-medium hover:underline`}
            >
              התורים שלי ←
            </Link>
            <div className={`flex items-center gap-2 ${theme.text}`}>
              <span className="font-medium">{session.customerName}</span>
              <CheckIcon className={`w-5 h-5 ${theme.accentSolid.replace('bg-', 'text-')}`} />
            </div>
          </div>
        )}

        {/* Step 1: Select Service */}
        {currentStep === 'service' && (
          <div className="animate-fade-in">
            <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-2`}>
              <span className={`w-10 h-10 ${isDark ? 'bg-white/10' : theme.progressBg} rounded-xl flex items-center justify-center`}>
                <span className="text-lg">✂️</span>
              </span>
              בחר שירות
            </h2>
            <ServicesList
              services={services}
              onSelectService={handleServiceSelect}
              selectedServiceId={selectedService?.id}
              accentGradient={theme.accent}
              accentColor={theme.accentSolid.replace('bg-', 'text-')}
              isDark={isDark}
            />
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {currentStep === 'datetime' && selectedService && (
          <div className="animate-fade-in">
            {/* Selected service summary */}
            <div className={`bg-gradient-to-r ${theme.accent} rounded-2xl p-4 mb-6 text-white shadow-xl`}>
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <span className="text-2xl font-bold">₪{selectedService.price}</span>
                  <span className="text-white/70 text-sm mr-2">({selectedService.duration} דקות)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-lg">{selectedService.name}</span>
                </div>
              </div>
            </div>

            <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
              <span className={`w-10 h-10 ${isDark ? 'bg-white/10' : theme.progressBg} rounded-xl flex items-center justify-center`}>
                <span className="text-lg">📅</span>
              </span>
              בחר תאריך
            </h2>
            <DatePicker
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              availableDays={availableDays}
            />

            {selectedDate && (
              <div className="mt-8 animate-slide-up">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🕐</span>
                  </span>
                  בחר שעה
                </h2>
                <TimeSlots
                  slots={timeSlots}
                  selectedTime={selectedTime}
                  onSelectTime={handleTimeSelect}
                  isLoading={isLoadingSlots}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === 'details' && selectedService && selectedDate && selectedTime && (
          <div className="animate-fade-in">
            {/* Booking summary */}
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-lg shadow-gray-200/50 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-blue-500" />
                סיכום הזמנה
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-600">₪{selectedService.price}</span>
                  <span className="text-gray-600">{selectedService.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">{selectedTime}</span>
                  <span className="text-gray-600">{formatDate(selectedDate)}</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-lg">👤</span>
              </span>
              הזדהות
            </h2>
            <AuthFlow 
              businessId={business.id} 
              businessSlug={business.slug} 
              businessName={business.name} 
              onAuthenticated={handleAuthComplete}
            />
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirmation' && bookingData && selectedService && (
          <div className="text-center py-8 animate-scale-in">
            {/* Success animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
                <CheckIcon className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </div>
            
            <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>התור נקבע בהצלחה!</h2>
            <p className={`${theme.textMuted} mb-8`}>נשמר במערכת ✓</p>

            <div className={`${theme.cardBg} rounded-3xl p-6 shadow-xl text-right mb-8 border ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <h3 className={`font-bold ${theme.text} mb-5 text-center flex items-center justify-center gap-2`}>
                <SparklesIcon className={`w-5 h-5 ${theme.accentSolid.replace('bg-', 'text-')}`} />
                פרטי התור
              </h3>
              <div className="space-y-4 text-sm">
                <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`${theme.text} font-medium`}>{business.name}</span>
                  <span className={theme.textMuted}>עסק</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`${theme.text} font-medium`}>{selectedService.name}</span>
                  <span className={theme.textMuted}>שירות</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`${theme.text} font-medium`}>{formatDate(bookingData.date)}</span>
                  <span className={theme.textMuted}>תאריך</span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`${theme.text} font-medium text-lg`}>{bookingData.time}</span>
                  <span className={theme.textMuted}>שעה</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className={`text-xl font-bold ${theme.accentSolid.replace('bg-', 'text-')}`}>₪{selectedService.price}</span>
                  <span className={theme.textMuted}>מחיר</span>
                </div>
              </div>
            </div>

            <Link
              href={`/${business.slug}`}
              className={`block w-full py-4 bg-gradient-to-r ${theme.accent} text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 btn-press text-center`}
            >
              חזרה לדף העסק
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
