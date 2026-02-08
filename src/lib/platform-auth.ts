'use client';

interface PlatformSession {
  adminId: string;
  adminName: string;
  email: string;
  role: 'admin' | 'super_admin';
}

const SESSION_KEY = 'platform_admin_session';

export async function loginPlatformAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; session?: PlatformSession; error?: string }> {
  try {
    const res = await fetch('/api/platform-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'אימייל או סיסמה שגויים' };
    }

    savePlatformSession(data.session);
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'שגיאה בהתחברות' };
  }
}

export function savePlatformSession(session: PlatformSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as PlatformSession;
  } catch {
    return null;
  }
}

export function clearPlatformSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isPlatformAdmin(): boolean {
  return getPlatformSession() !== null;
}
