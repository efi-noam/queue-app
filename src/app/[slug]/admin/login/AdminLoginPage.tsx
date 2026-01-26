'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { loginBusinessOwner, saveAdminSession } from '@/lib/admin-auth';
import type { Business } from '@/types/database';

interface AdminLoginPageProps {
  business: Business;
}

export function AdminLoginPage({ business }: AdminLoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Save session and redirect
      saveAdminSession(result.session!);
      router.push(`/${business.slug}/admin`);
    } catch (err) {
      console.error('Login error:', err);
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
          <h1 className="font-bold text-lg text-gray-900">כניסת מנהל</h1>
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
          <p className="text-gray-500 mt-1">כניסה לממשק הניהול</p>
        </div>

        {/* Form */}
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
            className="!bg-gray-900 hover:!bg-gray-800"
          >
            כניסה לניהול
          </Button>
        </form>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>רק בעלי העסק יכולים להיכנס לממשק הניהול</p>
        </div>
      </main>
    </div>
  );
}
