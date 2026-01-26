import { supabase } from './supabase';
import type { BusinessOwner } from '@/types/database';

// Admin session management
const ADMIN_SESSION_KEY = 'queue_app_admin_session';

interface AdminSession {
  ownerId: string;
  ownerName: string;
  email: string;
  businessId: string;
  businessSlug: string;
}

export async function loginBusinessOwner(
  email: string,
  password: string,
  businessSlug: string
): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
  // Get business by slug
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('slug', businessSlug)
    .single();

  if (businessError || !business) {
    return { success: false, error: 'עסק לא נמצא' };
  }

  // Get business owner
  const { data: owner, error: ownerError } = await supabase
    .from('business_owners')
    .select('*')
    .eq('id', business.owner_id)
    .single();

  if (ownerError || !owner) {
    return { success: false, error: 'בעל העסק לא נמצא' };
  }

  // Check email match (simple check - in production use proper auth)
  if (owner.email.toLowerCase() !== email.toLowerCase()) {
    return { success: false, error: 'אימייל או סיסמה שגויים' };
  }

  // Check if account is active
  if (owner.is_active === false) {
    return { success: false, error: 'החשבון מושהה' };
  }

  // Check password (simple comparison - in production use proper password hashing with bcrypt)
  if (owner.password_hash && owner.password_hash !== password) {
    return { success: false, error: 'אימייל או סיסמה שגויים' };
  }
  
  // If no password_hash set yet, accept any password (for legacy accounts)
  if (!owner.password_hash && password.length < 4) {
    return { success: false, error: 'אימייל או סיסמה שגויים' };
  }

  const session: AdminSession = {
    ownerId: owner.id,
    ownerName: owner.name,
    email: owner.email,
    businessId: business.id,
    businessSlug: business.slug,
  };

  return { success: true, session };
}

export function saveAdminSession(session: AdminSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminLoggedIn(businessSlug: string): boolean {
  const session = getAdminSession();
  return session !== null && session.businessSlug === businessSlug;
}
