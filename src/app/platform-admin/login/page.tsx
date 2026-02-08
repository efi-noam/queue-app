'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { loginPlatformAdmin } from '@/lib/platform-auth';

type ViewState = 'login' | 'forgot' | 'code' | 'newPassword';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

    const result = await loginPlatformAdmin(email, password);

    if (result.success) {
      router.push('/platform-admin');
    } else {
      setError(result.error || 'שגיאה בהתחברות');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/platform-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
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
    
    if (newPassword.length < 8) {
      setError('סיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/platform-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-2xl font-bold text-white">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Queue Platform</h1>
          <p className="text-gray-400 mt-2">
            {view === 'login' ? 'כניסת מנהל מערכת' : 'איפוס סיסמה'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 py-3 px-4 rounded-xl text-center text-sm font-medium">
            {successMessage}
          </div>
        )}

        {/* Login Form */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="admin@example.com"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">סיסמה</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
            >
              התחבר
            </Button>

            <button
              type="button"
              onClick={() => { setView('forgot'); setError(''); }}
              className="block w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              שכחתי סיסמה
            </button>
          </form>
        )}

        {/* Forgot Password - Enter Email */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            <p className="text-center text-gray-400 text-sm mb-4">
              הזן את כתובת האימייל שלך ונשלח לך קוד לאיפוס הסיסמה
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">אימייל</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="admin@example.com"
                dir="ltr"
                required
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              שלח קוד איפוס
            </Button>

            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className="block w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              חזרה לכניסה
            </button>
          </form>
        )}

        {/* Enter Code */}
        {view === 'code' && (
          <form onSubmit={handleVerifyCode} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            <p className="text-center text-gray-400 text-sm mb-4">
              שלחנו קוד אימות ל-{maskedEmail}
            </p>
            
            <div className="mb-4">
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-center text-2xl tracking-[0.5em]"
                placeholder="000000"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
            >
              אמת קוד
            </Button>

            <button
              type="button"
              onClick={() => { setView('forgot'); setError(''); setResetCode(''); }}
              className="block w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              שלח קוד חדש
            </button>
          </form>
        )}

        {/* New Password */}
        {view === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            <p className="text-center text-gray-400 text-sm mb-4">
              הזן סיסמה חדשה (לפחות 8 תווים)
            </p>
            
            <div className="mb-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="סיסמה חדשה"
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              שמור סיסמה חדשה
            </Button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          גישה למנהלי מערכת בלבד
        </p>
      </div>
    </div>
  );
}
