import { supabase } from './supabase';
import type { Customer } from '@/types/database';

// Simple hash function for password (in production, use bcrypt on server)
function hashPassword(password: string): string {
  // For simplicity, storing password as-is
  // In production, all auth should go through server-side API with proper hashing
  return password;
}

// Generate a random 6-digit code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerCustomer(
  businessId: string,
  phone: string,
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  // Check if customer already exists by phone
  const { data: existingPhone } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  if (existingPhone) {
    return { success: false, error: 'מספר טלפון זה כבר רשום' };
  }

  // Check if customer already exists by email
  const { data: existingEmail } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('email', email.toLowerCase())
    .single();

  if (existingEmail) {
    return { success: false, error: 'אימייל זה כבר רשום' };
  }

  // Create new customer
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      phone,
      name,
      email: email.toLowerCase(),
      pin_hash: hashPassword(password),
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering customer:', error);
    return { success: false, error: 'שגיאה ביצירת חשבון' };
  }

  return { success: true, customer: data };
}

export async function loginCustomer(
  businessId: string,
  phone: string,
  password: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  if (error || !customer) {
    return { success: false, error: 'מספר טלפון לא נמצא' };
  }

  // Check password
  if (customer.pin_hash !== hashPassword(password)) {
    return { success: false, error: 'סיסמה שגויה' };
  }

  return { success: true, customer };
}

// Request password reset - calls server API to generate code and send email
export async function requestPasswordReset(
  businessId: string,
  phone: string,
  businessName?: string
): Promise<{ success: boolean; maskedEmail?: string; error?: string }> {
  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, phone, businessName }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'שגיאה בשליחת קוד' };
    }

    return { 
      success: true, 
      maskedEmail: data.maskedEmail,
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'שגיאה בשליחת קוד' };
  }
}

// Get reset code for sending email (internal use)
export async function getResetCode(
  businessId: string,
  phone: string
): Promise<string | null> {
  const { data: customer } = await supabase
    .from('customers')
    .select('reset_code')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  return customer?.reset_code || null;
}

// Verify reset code and set new password
export async function resetPassword(
  businessId: string,
  phone: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  if (error || !customer) {
    return { success: false, error: 'מספר טלפון לא נמצא' };
  }

  // Check if code matches
  if (customer.reset_code !== code) {
    return { success: false, error: 'קוד שגוי' };
  }

  // Check if code is expired
  if (customer.reset_code_expires && new Date(customer.reset_code_expires) < new Date()) {
    return { success: false, error: 'הקוד פג תוקף. בקש קוד חדש' };
  }

  // Update password and clear reset code
  const { error: updateError } = await supabase
    .from('customers')
    .update({
      pin_hash: hashPassword(newPassword),
      reset_code: null,
      reset_code_expires: null,
    })
    .eq('id', customer.id);

  if (updateError) {
    console.error('Error updating password:', updateError);
    return { success: false, error: 'שגיאה בעדכון סיסמה' };
  }

  return { success: true, customer };
}

// Login or register with Google OAuth
export async function loginWithGoogle(
  businessId: string,
  email: string,
  name: string
): Promise<{ success: boolean; customer?: Customer; isNew?: boolean; error?: string }> {
  // Check if customer exists by email
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('email', email.toLowerCase())
    .single();

  if (existingCustomer) {
    return { success: true, customer: existingCustomer, isNew: false };
  }

  // New customer via Google - return success but mark as new (need phone)
  return { success: true, isNew: true };
}

// Complete Google registration with phone number
export async function completeGoogleRegistration(
  businessId: string,
  email: string,
  name: string,
  phone: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  // Check if phone already exists
  const { data: existingPhone } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  if (existingPhone) {
    // Link this email to existing account
    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update({ email: email.toLowerCase() })
      .eq('id', existingPhone.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: 'שגיאה בקישור החשבון' };
    }

    return { success: true, customer: updatedCustomer };
  }

  // Create new customer
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      phone,
      name,
      email: email.toLowerCase(),
      pin_hash: null, // No password for Google users
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating Google customer:', error);
    return { success: false, error: 'שגיאה ביצירת חשבון' };
  }

  return { success: true, customer: data };
}

// Session management using localStorage
const SESSION_KEY = 'queue_app_session';

interface Session {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  businessId: string;
}

export function saveSession(session: Session): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isLoggedIn(businessId: string): boolean {
  const session = getSession();
  return session !== null && session.businessId === businessId;
}

// Supabase OAuth helpers
export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function getGoogleUser(): Promise<{ email: string; name: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  return {
    email: user.email || '',
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
  };
}

export async function signOutGoogle(): Promise<void> {
  await supabase.auth.signOut();
}
