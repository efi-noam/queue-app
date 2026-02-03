'use client';

import { useState } from 'react';
import { 
  PhoneIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { saveSession, registerCustomer, loginCustomer, requestPasswordReset } from '@/lib/auth';

interface AuthFlowProps {
  businessId: string;
  businessSlug: string;
  businessName?: string;
  onAuthenticated: (customer: { id: string; name: string; phone: string; email?: string }) => void;
}

type AuthStep = 
  | 'phone'           // Enter phone number
  | 'new_customer'    // New customer registration (name, email)
  | 'pin_setup'       // Create PIN
  | 'pin_login'       // Enter PIN
  | 'forgot_password' // Forgot password flow
  | 'reset_code'      // Enter reset code
  | 'new_password';   // Enter new password

interface ExistingCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export function AuthFlow({ businessId, businessSlug, businessName, onAuthenticated }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [existingCustomer, setExistingCustomer] = useState<ExistingCustomer | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle phone number submission
  const handlePhoneSubmit = async () => {
    if (phone.length < 9) {
      setError('מספר טלפון לא תקין');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if customer exists
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('business_id', businessId)
        .eq('phone', phone)
        .single();

      if (customer) {
        // Existing customer - go to PIN login
        setExistingCustomer(customer);
        setStep('pin_login');
      } else {
        // New customer - go to registration
        setStep('new_customer');
      }
    } catch (err) {
      console.error('Phone check error:', err);
      setError('שגיאה בבדיקת מספר טלפון');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new customer registration
  const handleNewCustomerSubmit = async () => {
    if (name.trim().length < 2) {
      setError('יש להזין שם מלא');
      return;
    }

    // Email is required for password recovery
    if (!email.trim() || !email.includes('@')) {
      setError('יש להזין כתובת אימייל תקינה');
      return;
    }

    // Go to PIN setup
    setStep('pin_setup');
  };

  // Handle PIN setup
  const handlePinSetup = async () => {
    if (pin.length !== 4) {
      setError('הקוד חייב להיות 4 ספרות');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await registerCustomer(businessId, phone, name, pin, email || undefined);
      
      if (!result.success || !result.customer) {
        setError(result.error || 'שגיאה ביצירת חשבון');
        return;
      }

      // Save session and complete
      saveSession({
        customerId: result.customer.id,
        customerName: result.customer.name,
        phone: result.customer.phone,
        email: result.customer.email || undefined,
        businessId,
      });
      onAuthenticated({
            id: result.customer.id,
            name: result.customer.name,
            phone: result.customer.phone,
            email: result.customer.email || undefined,
          });
    } catch (err) {
      console.error('PIN setup error:', err);
      setError('שגיאה ביצירת חשבון');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN login
  const handlePinLogin = async () => {
    if (pin.length !== 4) {
      setError('הקוד חייב להיות 4 ספרות');
      return;
    }

    if (!existingCustomer) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await loginCustomer(businessId, phone, pin);
      
      if (!result.success || !result.customer) {
        setError(result.error || 'קוד שגוי');
        return;
      }

      saveSession({
        customerId: result.customer.id,
        customerName: result.customer.name,
        phone: result.customer.phone,
        email: result.customer.email || undefined,
        businessId,
      });
      onAuthenticated({
            id: result.customer.id,
            name: result.customer.name,
            phone: result.customer.phone,
            email: result.customer.email || undefined,
          });
    } catch (err) {
      console.error('PIN login error:', err);
      setError('שגיאה בכניסה');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!existingCustomer) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await requestPasswordReset(businessId, phone, businessName);
      
      if (!result.success) {
        setError(result.error || 'שגיאה בשליחת קוד');
        return;
      }

      setMaskedEmail(result.maskedEmail || '');
      setStep('reset_code');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('שגיאה בשליחת קוד');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset code verification
  const handleResetCodeVerify = async () => {
    if (resetCode.length !== 6) {
      setError('הקוד חייב להיות 6 ספרות');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone, code: resetCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'קוד שגוי');
        return;
      }

      setStep('new_password');
    } catch (err) {
      console.error('Reset code error:', err);
      setError('שגיאה באימות קוד');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new password
  const handleNewPassword = async () => {
    if (newPassword.length < 4) {
      setError('הקוד חייב להיות לפחות 4 תווים');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone, code: resetCode, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בעדכון סיסמה');
        return;
      }

      const data = await res.json();
      
      if (data.customer) {
        saveSession({
          customerId: data.customer.id,
          customerName: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || undefined,
          businessId,
        });
        onAuthenticated(data.customer);
      }
    } catch (err) {
      console.error('New password error:', err);
      setError('שגיאה בעדכון סיסמה');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back
  const handleBack = () => {
    setError('');
    if (step === 'new_customer' || step === 'pin_login') {
      setStep('phone');
      setExistingCustomer(null);
    } else if (step === 'pin_setup') {
      setStep('new_customer');
    } else if (step === 'forgot_password' || step === 'reset_code') {
      setStep('pin_login');
    } else if (step === 'new_password') {
      setStep('reset_code');
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back button */}
      {step !== 'phone' && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>חזור</span>
        </button>
      )}

      {/* Step 1: Phone Number */}
      {step === 'phone' && (
        <>
          <div className="text-center mb-6">
            <p className="text-gray-600">הזן את מספר הטלפון שלך כדי להמשיך</p>
          </div>

          <div className="relative">
            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-left focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handlePhoneSubmit}
            disabled={phone.length < 9 || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              phone.length >= 9 && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'בודק...' : 'המשך'}
          </button>
        </>
      )}

      {/* Step 2: New Customer Registration */}
      {step === 'new_customer' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-blue-800 font-medium">ברוך הבא! 👋</p>
            <p className="text-blue-600 text-sm">זו הפעם הראשונה שלך - בוא ניצור חשבון</p>
          </div>

          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם מלא"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-right focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל (לשחזור סיסמה)"
              dir="ltr"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-left focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            האימייל ישמש לשחזור הקוד במידה ותשכח אותו
          </p>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleNewCustomerSubmit}
            disabled={name.trim().length < 2 || !email.includes('@') || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              name.trim().length >= 2 && email.includes('@') && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'יוצר חשבון...' : 'המשך'}
          </button>
        </>
      )}

      {/* Step 3: PIN Setup */}
      {step === 'pin_setup' && (
        <>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">בחר קוד PIN</h3>
            <p className="text-gray-600">הקוד ישמש אותך לכניסה בפעמים הבאות</p>
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 ספרות"
              inputMode="numeric"
              maxLength={4}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handlePinSetup}
            disabled={pin.length !== 4 || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              pin.length === 4 && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'יוצר חשבון...' : 'סיום הרשמה'}
          </button>
        </>
      )}

      {/* PIN Login */}
      {step === 'pin_login' && existingCustomer && (
        <>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">שלום {existingCustomer.name}!</h3>
            <p className="text-gray-600">הזן את קוד ה-PIN שלך</p>
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 ספרות"
              inputMode="numeric"
              maxLength={4}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handlePinLogin}
            disabled={pin.length !== 4 || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              pin.length === 4 && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'מתחבר...' : 'התחבר'}
          </button>

          <button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="w-full text-center text-blue-600 text-sm font-medium hover:underline"
          >
            שכחתי את הקוד
          </button>
        </>
      )}

      {/* Reset Code */}
      {step === 'reset_code' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <EnvelopeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-800 font-medium">שלחנו קוד אימות</p>
            <p className="text-blue-600 text-sm">לאימייל: {maskedEmail}</p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="הזן קוד (6 ספרות)"
              inputMode="numeric"
              maxLength={6}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleResetCodeVerify}
            disabled={resetCode.length !== 6 || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              resetCode.length === 6 && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'בודק...' : 'אמת קוד'}
          </button>
        </>
      )}

      {/* New Password */}
      {step === 'new_password' && (
        <>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">בחר קוד חדש</h3>
            <p className="text-gray-600">הזן קוד PIN חדש בן 4 ספרות</p>
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 ספרות"
              inputMode="numeric"
              maxLength={4}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm bg-red-50 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleNewPassword}
            disabled={newPassword.length !== 4 || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              newPassword.length === 4 && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'מעדכן...' : 'עדכן והתחבר'}
          </button>
        </>
      )}
    </div>
  );
}
