'use client';

import { supabase } from './supabase';
import type { PlatformAdmin } from '@/types/database';

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
    // Find admin by email
    const { data: admin, error } = await supabase
      .from('platform_admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return { success: false, error: 'אימייל או סיסמה שגויים' };
    }

    // Simple password check (in production, use proper hashing!)
    if (admin.password_hash !== password) {
      return { success: false, error: 'אימייל או סיסמה שגויים' };
    }

    // Update last login
    await supabase
      .from('platform_admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    const session: PlatformSession = {
      adminId: admin.id,
      adminName: admin.name,
      email: admin.email,
      role: admin.role,
    };

    savePlatformSession(session);
    return { success: true, session };
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
