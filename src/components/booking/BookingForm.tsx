'use client';

import { useState } from 'react';
import { UserIcon, PhoneIcon, KeyIcon, CheckCircleIcon, SparklesIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { 
  loginCustomer, 
  saveSession, 
  requestPasswordReset, 
  registerCustomer,
} from '@/lib/auth';
import type { BookingFormData, Customer } from '@/types/database';

interface BookingFormProps {
  businessId: string;
  businessSlug: string;
  businessName?: string;
  onSubmit: (data: Pick<BookingFormData, 'customer_name' | 'customer_phone'> & { existingCustomer?: Customer }) => void;
  isLoading?: boolean;
}

type FormMode = 'phone' | 'existing_customer' | 'new_customer' | 'forgot_password' | 'reset_password' | 'set_new_password';

export function BookingForm({ businessId, businessSlug, businessName, onSubmit, isLoading = false }: BookingFormProps) {
  const [mode, setMode] = useState<FormMode>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');

  // Check if phone exists in the database
  const handlePhoneCheck = async () => {
    if (phone.trim().length < 9) return;
    
    setIsChecking(true);
    setError('');

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .eq('phone', phone)
        .single();

      if (customer) {
        setExistingCustomer(customer);
        setMode('existing_customer');
      } else {
        setMode('new_customer');
      }
    } catch {
      setMode('new_customer');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle password verification for existing customer
  const handlePasswordVerify = async () => {
    if (!existingCustomer) return;

    setIsChecking(true);
    setError('');

    try {
      const result = await loginCustomer(businessId, phone, password);
      
      if (result.success && result.customer) {
        saveSession({
          customerId: result.customer.id,
          customerName: result.customer.name,
          phone: result.customer.phone,
          email: result.customer.email || undefined,
          businessId,
        });

        onSubmit({
          customer_name: result.customer.name,
          customer_phone: result.customer.phone,
          existingCustomer: result.customer,
        });
      } else {
        setError(result.error || 'סיסמה שגויה');
      }
    } catch {
      setError('שגיאה באימות');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    setIsChecking(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await requestPasswordReset(businessId, phone, businessName);
      
      if (result.success && result.maskedEmail) {
        setMaskedEmail(result.maskedEmail);
        setSuccessMessage('קוד אימות נשלח למייל שלך');
        setMode('reset_password');
      } else {
        setError(result.error || 'שגיאה בשליחת קוד');
      }
    } catch {
      setError('שגיאה בשליחת קוד');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle code verification (step 1)
  const handleVerifyCode = async () => {
    setIsChecking(true);
    setError('');

    try {
      const response = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone, code: resetCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('קוד אומת בהצלחה!');
        setMode('set_new_password');
      } else {
        setError(data.error || 'קוד שגוי');
      }
    } catch {
      setError('שגיאה באימות קוד');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle password reset (step 2)
  const handleSetNewPassword = async () => {
    setIsChecking(true);
    setError('');

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone, code: resetCode, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.customer) {
        saveSession({
          customerId: data.customer.id,
          customerName: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || undefined,
          businessId,
        });

        onSubmit({
          customer_name: data.customer.name,
          customer_phone: data.customer.phone,
          existingCustomer: data.customer,
        });
      } else {
        setError(data.error || 'שגיאה באיפוס סיסמה');
      }
    } catch {
      setError('שגיאה באיפוס סיסמה');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle new customer submission
  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    try {
      // Register customer with email
      const result = await registerCustomer(businessId, phone, name, password, email);
      
      if (result.success && result.customer) {
        saveSession({
          customerId: result.customer.id,
          customerName: result.customer.name,
          phone: result.customer.phone,
          email: result.customer.email || undefined,
          businessId,
        });

        onSubmit({
          customer_name: result.customer.name,
          customer_phone: result.customer.phone,
          existingCustomer: result.customer,
        });
      } else {
        setError(result.error || 'שגיאה ביצירת חשבון');
      }
    } catch {
      setError('שגיאה ביצירת חשבון');
    } finally {
      setIsChecking(false);
    }
  };

  // Reset to phone entry
  const handleChangePhone = () => {
    setMode('phone');
    setPhone('');
    setPassword('');
    setNewPassword('');
    setName('');
    setEmail('');
    setResetCode('');
    setError('');
    setSuccessMessage('');
    setExistingCustomer(null);
    setMaskedEmail('');
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Step 1: Phone Number */}
      {mode === 'phone' && (
        <>
          <p className="text-gray-600 text-sm text-right mb-2">
            הזן את מספר הטלפון שלך כדי להמשיך בהזמנה
          </p>
          <div className="relative">
            <label 
              htmlFor="phone" 
              className="block text-sm font-medium text-gray-700 mb-2 text-right"
            >
              מספר טלפון
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="050-1234567"
              required
              minLength={9}
              dir="ltr"
              className={`
                w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-left
                transition-all duration-200 outline-none
                ${focusedField === 'phone' 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            />
          </div>

          <button
            type="button"
            onClick={handlePhoneCheck}
            disabled={phone.trim().length < 9 || isChecking}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 btn-press
              ${phone.trim().length >= 9 && !isChecking
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                בודק...
              </span>
            ) : (
              'המשך'
            )}
          </button>
        </>
      )}

      {/* Step 2a: Existing Customer - Password verification */}
      {mode === 'existing_customer' && existingCustomer && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleChangePhone}
              className="text-green-600 text-sm font-medium hover:underline"
            >
              שנה
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-green-800">{existingCustomer.name}</p>
                <p className="text-green-600 text-sm" dir="ltr">{phone}</p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm">
            שלום {existingCustomer.name}! הזן את הסיסמה שלך
          </div>

          <div className="relative">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2 text-right"
            >
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="הזן סיסמה"
              required
              className={`
                w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-right
                transition-all duration-200 outline-none
                ${focusedField === 'password' 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePasswordVerify}
            disabled={password.length < 4 || isChecking || isLoading}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 btn-press
              ${password.length >= 4 && !isChecking && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isChecking || isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                מאמת...
              </span>
            ) : (
              'אישור הזמנה'
            )}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-blue-600 text-sm font-medium hover:underline"
          >
            שכחתי סיסמה
          </button>
        </>
      )}

      {/* Forgot Password - Step 1: Enter Code */}
      {mode === 'reset_password' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <EnvelopeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-800">שלחנו קוד אימות</p>
                <p className="text-blue-600 text-sm">לאימייל: {maskedEmail}</p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm text-center">
              {successMessage}
            </div>
          )}

          <div className="relative">
            <label 
              htmlFor="resetCode" 
              className="block text-sm font-medium text-gray-700 mb-2 text-right"
            >
              קוד אימות (6 ספרות)
            </label>
            <input
              type="text"
              id="resetCode"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className={`
                w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-center text-2xl tracking-widest
                transition-all duration-200 outline-none
                ${focusedField === 'resetCode' 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={resetCode.length !== 6 || isChecking}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 btn-press
              ${resetCode.length === 6 && !isChecking
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isChecking ? 'מאמת...' : 'אמת קוד'}
          </button>

          <button
            type="button"
            onClick={handleChangePhone}
            className="w-full text-center text-gray-500 text-sm hover:underline"
          >
            חזרה
          </button>
        </>
      )}

      {/* Forgot Password - Step 2: Set New Password */}
      {mode === 'set_new_password' && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="font-bold text-green-800">קוד אומת בהצלחה!</p>
                <p className="text-green-600 text-sm">הזן סיסמה חדשה</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <label 
              htmlFor="newPassword" 
              className="block text-sm font-medium text-gray-700 mb-2 text-right"
            >
              סיסמה חדשה (לפחות 4 תווים)
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="הזן סיסמה חדשה"
              required
              className={`
                w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-right
                transition-all duration-200 outline-none
                ${focusedField === 'newPassword' 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSetNewPassword}
            disabled={newPassword.length < 4 || isChecking}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 btn-press
              ${newPassword.length >= 4 && !isChecking
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isChecking ? 'מעדכן...' : 'עדכן סיסמה והמשך'}
          </button>
        </>
      )}

      {/* Step 2b: New Customer */}
      {mode === 'new_customer' && (
        <form onSubmit={handleNewCustomerSubmit}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-800">ברוך הבא!</p>
                <p className="text-blue-600 text-sm">זו הפעם הראשונה שלך. מלא את הפרטים</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={handleChangePhone}
              className="text-gray-600 text-sm font-medium hover:underline"
            >
              שנה
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-gray-500 text-sm">מספר טלפון</p>
                <p className="font-bold text-gray-800" dir="ltr">{phone}</p>
              </div>
              <div className="w-10 h-10 bg-gray-400 rounded-xl flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div className="relative">
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                שם מלא
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הזן את שמך המלא"
                required
                minLength={2}
                className={`
                  w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-right
                  transition-all duration-200 outline-none
                  ${focusedField === 'name' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              />
            </div>

            <div className="relative">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                אימייל <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                className={`
                  w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-left
                  transition-all duration-200 outline-none
                  ${focusedField === 'email' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">מומלץ - לשחזור סיסמה במידת הצורך</p>
            </div>

            <div className="relative">
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                סיסמה
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="בחר סיסמה"
                required
                minLength={4}
                className={`
                  w-full px-4 py-4 border-2 rounded-2xl text-gray-900 text-right
                  transition-all duration-200 outline-none
                  ${focusedField === 'password' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center mb-5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={name.trim().length < 2 || password.length < 4 || isChecking || isLoading}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 btn-press
              ${name.trim().length >= 2 && password.length >= 4 && !isChecking && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isChecking || isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                קובע תור...
              </span>
            ) : (
              'אישור הזמנה'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
