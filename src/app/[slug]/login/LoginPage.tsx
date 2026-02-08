'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, PhoneIcon, LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { registerCustomer, loginCustomer, saveSession } from '@/lib/auth';
import type { Business } from '@/types/database';

interface LoginPageProps {
  business: Business;
}

export function LoginPage({ business }: LoginPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name) {
          setError('יש להזין שם');
          setIsLoading(false);
          return;
        }
        if (pin.length !== 4) {
          setError('הקוד חייב להיות 4 ספרות');
          setIsLoading(false);
          return;
        }

        const result = await registerCustomer(business.id, phone, name, pin, email || undefined);
        
        if (!result.success) {
          setError(result.error || 'שגיאה ביצירת חשבון');
          setIsLoading(false);
          return;
        }

        // Save session and redirect
        saveSession({
          customerId: result.customer!.id,
          customerName: result.customer!.name,
          phone: result.customer!.phone,
          businessId: business.id,
        });

        router.push(`/${business.slug}/my-appointments`);
      } else {
        // Login
        if (pin.length !== 4) {
          setError('הקוד חייב להיות 4 ספרות');
          setIsLoading(false);
          return;
        }

        const result = await loginCustomer(business.id, phone, pin);
        
        if (!result.success) {
          setError(result.error || 'שגיאה בכניסה');
          setIsLoading(false);
          return;
        }

        // Save session and redirect
        saveSession({
          customerId: result.customer!.id,
          customerName: result.customer!.name,
          phone: result.customer!.phone,
          businessId: business.id,
        });

        router.push(`/${business.slug}/my-appointments`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="font-bold text-lg text-gray-900">
            {mode === 'login' ? 'כניסה' : 'הרשמה'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-8 max-w-lg mx-auto">
        {/* Logo/Business name */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
            <span className="text-3xl text-white font-bold">
              {business.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
          <p className="text-gray-500 mt-1">
            {mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון חדש'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
              ${mode === 'login' 
                ? 'bg-white text-gray-900 shadow-md' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            כניסה
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
              ${mode === 'register' 
                ? 'bg-white text-gray-900 shadow-md' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            הרשמה
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="relative">
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="שם מלא"
                  className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="relative">
                <EnvelopeIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="אימייל (לאיפוס סיסמה)"
                  className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </>
          )}

          <div className="relative">
            <PhoneIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="מספר טלפון"
              className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
              required
            />
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={mode === 'register' ? 'בחר קוד (4 ספרות)' : 'קוד (4 ספרות)'}
              className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            {mode === 'login' ? 'כניסה' : 'צור חשבון'}
          </Button>
        </form>

        {/* Guest booking option */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-3">או</p>
          <Link
            href={`/${business.slug}/book`}
            className="text-blue-600 font-medium hover:underline"
          >
            המשך בלי חשבון להזמנת תור
          </Link>
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-20" />
      </main>

      {/* Bottom Navigation */}
      <BottomNav slug={business.slug} theme={business.theme || 'light'} />
    </div>
  );
}
