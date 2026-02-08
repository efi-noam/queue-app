'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, EnvelopeIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { loginBusinessOwner, saveAdminSession } from '@/lib/admin-auth';
import type { Business } from '@/types/database';

interface AdminLoginPageProps {
  business: Business;
}

type ViewState = 'login' | 'forgot' | 'code' | 'newPassword';

export function AdminLoginPage({ business }: AdminLoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot password states
  const [view, setView] = useState<ViewState>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginBusinessOwner(email, password, business.slug);
      
      if (!result.success) {
        setError(result.error || 'שגיאה בכניסה');
        setIsLoading(false);
        return;
      }

      saveAdminSession(result.session!);
      router.push(`/${business.slug}/admin`);
    } catch (err) {
      console.error('Login error:', err);
      setError('שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, businessSlug: business.slug }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת קוד');
      } else {
        setMaskedEmail(data.maskedEmail || '');
        setView('code');
      }
    } catch {
      setError('שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (resetCode.length !== 6) {
      setError('נא להזין קוד בן 6 ספרות');
      return;
    }
    setView('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('סיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          businessSlug: business.slug,
          code: resetCode,
          newPassword,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'שגיאה באיפוס סיסמה');
      } else {
        setSuccessMessage('הסיסמה שונתה בהצלחה!');
        setTimeout(() => {
          setView('login');
          setSuccessMessage('');
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
        }, 2000);
      }
    } catch {
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
            {view === 'login' ? 'כניסת מנהל' : 'איפוס סיסמה'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-8 max-w-lg mx-auto">
        {/* Logo/Business name */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-3xl text-white font-bold">
              {business.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
          <p className="text-gray-500 mt-1">
            {view === 'login' ? 'כניסה לממשק הניהול' : 'איפוס סיסמת מנהל'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 bg-green-50 text-green-700 py-3 px-4 rounded-xl text-center text-sm font-medium">
            {successMessage}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        {/* Login Form */}
        {view === 'login' && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <EnvelopeIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="אימייל"
                  className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  dir="ltr"
                  required
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמה"
                  className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="!bg-gray-900 hover:!bg-gray-800"
              >
                כניסה לניהול
              </Button>
            </form>

            <button
              onClick={() => { setView('forgot'); setError(''); }}
              className="block w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              שכחתי סיסמה
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>רק בעלי העסק יכולים להיכנס לממשק הניהול</p>
            </div>
          </>
        )}

        {/* Forgot Password - Enter Email */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-center text-gray-600 text-sm mb-2">
              הזן את כתובת האימייל שלך ונשלח לך קוד לאיפוס הסיסמה
            </p>
            <div className="relative">
              <EnvelopeIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="אימייל"
                className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                dir="ltr"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              שלח קוד איפוס
            </Button>

            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              חזרה לכניסה
            </button>
          </form>
        )}

        {/* Enter Code */}
        {view === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-center text-gray-600 text-sm mb-2">
              שלחנו קוד אימות ל-{maskedEmail}
            </p>
            <div className="relative">
              <KeyIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="קוד אימות (6 ספרות)"
                className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              אמת קוד
            </Button>

            <button
              type="button"
              onClick={() => { setView('forgot'); setError(''); setResetCode(''); }}
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              שלח קוד חדש
            </button>
          </form>
        )}

        {/* New Password */}
        {view === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-center text-gray-600 text-sm mb-2">
              הזן סיסמה חדשה (לפחות 6 תווים)
            </p>
            <div className="relative">
              <LockClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="סיסמה חדשה"
                className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              שמור סיסמה חדשה
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
