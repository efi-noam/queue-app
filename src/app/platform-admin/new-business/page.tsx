'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { getPlatformSession } from '@/lib/platform-auth';
import { createBusinessWithOwner } from '@/lib/platform-api';

export default function NewBusinessPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');

  // Owner fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Business fields
  const [businessName, setBusinessName] = useState('');
  const [businessSlug, setBusinessSlug] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  useEffect(() => {
    const session = getPlatformSession();
    if (!session) {
      router.push('/platform-admin/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  // Auto-generate slug from business name
  useEffect(() => {
    if (businessName && !businessSlug) {
      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
      setBusinessSlug(slug);
    }
  }, [businessName, businessSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!ownerName || !ownerEmail || !ownerPassword) {
      setError('יש למלא את כל פרטי בעל העסק');
      setIsLoading(false);
      return;
    }

    if (!businessName || !businessSlug) {
      setError('יש למלא שם עסק וכתובת אתר');
      setIsLoading(false);
      return;
    }

    const result = await createBusinessWithOwner(
      {
        email: ownerEmail,
        name: ownerName,
        phone: ownerPhone || undefined,
        password: ownerPassword,
      },
      {
        name: businessName,
        slug: businessSlug,
        description: businessDescription || undefined,
        address: businessAddress || undefined,
        phone: businessPhone || undefined,
      }
    );

    if (result.success && result.business) {
      setSuccess(true);
      setCreatedSlug(result.business.slug);
    } else {
      setError(result.error || 'שגיאה ביצירת העסק');
    }

    setIsLoading(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">העסק נוצר בהצלחה!</h2>
          <p className="text-gray-400 mb-6">
            {businessName} נוסף למערכת.
            <br />
            בעל העסק יכול להתחבר עם האימייל והסיסמה שהגדרת.
          </p>
          
          <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">כתובת האתר:</p>
            <p className="text-blue-400 font-mono" dir="ltr">/{createdSlug}</p>
          </div>

          <div className="flex gap-3">
            <Link href="/platform-admin" className="flex-1">
              <Button variant="outline" fullWidth>
                חזרה לדשבורד
              </Button>
            </Link>
            <Link href={`/${createdSlug}`} target="_blank" className="flex-1">
              <Button variant="gradient" fullWidth>
                צפה באתר
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/platform-admin"
            className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="font-bold text-white">יצירת עסק חדש</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Owner Section */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm">1</span>
              פרטי בעל העסק
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="יוסי כהן"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">טלפון</label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="050-1234567"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">אימייל *</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="yossi@example.com"
                  dir="ltr"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">סיסמה *</label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Section */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm">2</span>
              פרטי העסק
            </h2>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">שם העסק *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="מספרת יוסי"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">כתובת אתר *</label>
                  <input
                    type="text"
                    value={businessSlug}
                    onChange={(e) => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="yossi-barber"
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1" dir="ltr">queueapp.com/{businessSlug || 'your-business'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">תיאור העסק</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="ספר קצת על העסק..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">כתובת</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="רחוב הרצל 1, תל אביב"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">טלפון העסק</label>
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="03-1234567"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            צור עסק חדש
          </Button>
        </form>
      </main>
    </div>
  );
}
