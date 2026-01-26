'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getGoogleUser, completeGoogleRegistration, saveSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [status, setStatus] = useState<'loading' | 'need_phone' | 'error'>('loading');
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get Google user info
        const user = await getGoogleUser();
        
        if (!user) {
          setStatus('error');
          setError('לא הצלחנו לקבל את פרטי המשתמש');
          return;
        }

        setGoogleUser(user);

        // Get business ID from slug
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!business) {
          setStatus('error');
          setError('העסק לא נמצא');
          return;
        }

        // Check if customer exists with this email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', business.id)
          .eq('email', user.email.toLowerCase())
          .single();

        if (existingCustomer) {
          // Existing customer - save session and redirect
          saveSession({
            customerId: existingCustomer.id,
            customerName: existingCustomer.name,
            phone: existingCustomer.phone,
            email: existingCustomer.email || undefined,
            businessId: business.id,
          });

          router.push(`/${slug}/book`);
        } else {
          // New customer - need phone number
          setStatus('need_phone');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setError('שגיאה בהתחברות');
      }
    };

    handleCallback();
  }, [slug, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!business) {
        setError('העסק לא נמצא');
        return;
      }

      // Complete registration
      const result = await completeGoogleRegistration(
        business.id,
        googleUser.email,
        googleUser.name,
        phone
      );

      if (result.success && result.customer) {
        saveSession({
          customerId: result.customer.id,
          customerName: result.customer.name,
          phone: result.customer.phone,
          email: result.customer.email || undefined,
          businessId: business.id,
        });

        router.push(`/${slug}/book`);
      } else {
        setError(result.error || 'שגיאה ביצירת חשבון');
      }
    } catch {
      setError('שגיאה ביצירת חשבון');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">מתחבר...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה בהתחברות</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/${slug}/book`)}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            חזרה להזמנה
          </button>
        </div>
      </div>
    );
  }

  // Need phone number
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">ברוך הבא, {googleUser?.name}!</h1>
          <p className="text-gray-600">כדי להשלים את ההרשמה, הזן את מספר הטלפון שלך</p>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              מספר טלפון
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              required
              minLength={9}
              dir="ltr"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-left focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={phone.length < 9 || isSubmitting}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg transition-all
              ${phone.length >= 9 && !isSubmitting
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'שומר...' : 'המשך להזמנה'}
          </button>
        </form>
      </div>
    </div>
  );
}
