import { supabase } from './supabase';
import { getTodayLocal, formatDateLocal } from './api';
import type { Business, BusinessOwner, Lead } from '@/types/database';

// =============================================
// Platform Statistics
// =============================================

export interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalCustomers: number;
  totalAppointments: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  newBusinessesThisMonth: number;
  totalLeads: number;
  newLeads: number;
  leadsThisMonth: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const today = getTodayLocal();
  const weekAgo = formatDateLocal(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const monthStart = formatDateLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [
    { count: totalBusinesses },
    { count: activeBusinesses },
    { count: totalCustomers },
    { count: totalAppointments },
    { count: appointmentsToday },
    { count: appointmentsThisWeek },
    { count: appointmentsThisMonth },
    { count: newBusinessesThisMonth },
    { count: totalLeads },
    { count: newLeads },
    { count: leadsThisMonth },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', weekAgo),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', monthStart),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
  ]);

  return {
    totalBusinesses: totalBusinesses || 0,
    activeBusinesses: activeBusinesses || 0,
    totalCustomers: totalCustomers || 0,
    totalAppointments: totalAppointments || 0,
    appointmentsToday: appointmentsToday || 0,
    appointmentsThisWeek: appointmentsThisWeek || 0,
    appointmentsThisMonth: appointmentsThisMonth || 0,
    newBusinessesThisMonth: newBusinessesThisMonth || 0,
    totalLeads: totalLeads || 0,
    newLeads: newLeads || 0,
    leadsThisMonth: leadsThisMonth || 0,
  };
}

// =============================================
// Business Statistics (per business)
// =============================================

export interface BusinessStats {
  business: Business;
  owner: BusinessOwner | null;
  customersCount: number;
  appointmentsCount: number;
  appointmentsThisMonth: number;
  servicesCount: number;
}

export async function getAllBusinessesWithStats(): Promise<BusinessStats[]> {
  const monthStart = formatDateLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // Get all businesses with their owners
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_owners(*)
    `)
    .order('created_at', { ascending: false });

  if (error || !businesses) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  // Get stats for each business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsPromises = businesses.map(async (business: any) => {
    const [
      { count: customersCount },
      { count: appointmentsCount },
      { count: appointmentsThisMonth },
      { count: servicesCount },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', business.id).gte('date', monthStart),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    ]);

    return {
      business: business as Business,
      owner: (business as any).business_owners as BusinessOwner | null,
      customersCount: customersCount || 0,
      appointmentsCount: appointmentsCount || 0,
      appointmentsThisMonth: appointmentsThisMonth || 0,
      servicesCount: servicesCount || 0,
    };
  });

  return Promise.all(statsPromises);
}

// =============================================
// Business Management
// =============================================

export async function createBusinessWithOwner(
  ownerData: { email: string; name: string; phone?: string; password: string },
  businessData: { name: string; slug: string; description?: string; address?: string; phone?: string }
): Promise<{ success: boolean; business?: Business; error?: string }> {
  try {
    // Check if slug is taken
    const { data: existingSlug } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', businessData.slug.toLowerCase())
      .single();

    if (existingSlug) {
      return { success: false, error: 'כתובת האתר כבר תפוסה' };
    }

    // Check if email is taken
    const { data: existingEmail } = await supabase
      .from('business_owners')
      .select('id')
      .eq('email', ownerData.email.toLowerCase())
      .single();

    if (existingEmail) {
      return { success: false, error: 'כתובת האימייל כבר קיימת במערכת' };
    }

    // Create owner
    const { data: owner, error: ownerError } = await supabase
      .from('business_owners')
      .insert({
        email: ownerData.email.toLowerCase(),
        name: ownerData.name,
        phone: ownerData.phone || null,
        password_hash: ownerData.password, // In production, hash this!
        is_active: true,
      })
      .select()
      .single();

    if (ownerError || !owner) {
      console.error('Error creating owner:', ownerError);
      return { success: false, error: 'שגיאה ביצירת בעל העסק' };
    }

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: owner.id,
        slug: businessData.slug.toLowerCase(),
        name: businessData.name,
        description: businessData.description || null,
        address: businessData.address || null,
        phone: businessData.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (businessError || !business) {
      console.error('Error creating business:', businessError);
      // Rollback owner creation
      await supabase.from('business_owners').delete().eq('id', owner.id);
      return { success: false, error: 'שגיאה ביצירת העסק' };
    }

    // Create default business hours (Sun-Thu 9-18, Fri 9-14, Sat closed)
    const defaultHours = [
      { business_id: business.id, day_of_week: 0, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
      { business_id: business.id, day_of_week: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
      { business_id: business.id, day_of_week: 6, open_time: null, close_time: null, is_closed: true },
    ];

    await supabase.from('business_hours').insert(defaultHours);

    return { success: true, business: business as Business };
  } catch (error) {
    console.error('Error in createBusinessWithOwner:', error);
    return { success: false, error: 'שגיאה לא צפויה' };
  }
}

export async function toggleBusinessActive(businessId: string, isActive: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/toggle-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, isActive }),
    });

    if (!response.ok) {
      console.error('Error toggling business');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error toggling business:', error);
    return false;
  }
}

export async function deleteBusiness(businessId: string): Promise<boolean> {
  // This will cascade delete all related data
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId);

  if (error) {
    console.error('Error deleting business:', error);
    return false;
  }

  return true;
}

// =============================================
// Activity Log (recent appointments across all businesses)
// =============================================

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'new_customer' | 'new_business';
  businessName: string;
  businessSlug: string;
  description: string;
  timestamp: string;
}

export async function getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
  // Get recent appointments with business info
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      created_at,
      date,
      start_time,
      status,
      businesses(name, slug),
      customers(name),
      services(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!appointments) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return appointments.map((apt: any) => ({
    id: apt.id,
    type: 'appointment' as const,
    businessName: (apt.businesses as any)?.name || 'Unknown',
    businessSlug: (apt.businesses as any)?.slug || '',
    description: `${(apt.customers as any)?.name || 'לקוח'} - ${(apt.services as any)?.name || 'שירות'} (${apt.date})`,
    timestamp: apt.created_at,
  }));
}

// =============================================
// Leads Management
// =============================================

export async function createLead(data: {
  business_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  notes?: string;
}): Promise<Lead | null> {
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      business_name: data.business_name,
      contact_name: data.contact_name,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes || null,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }

  return lead as Lead;
}

export async function getAllLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return data as Lead[];
}

export async function updateLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'converted' | 'closed'
): Promise<boolean> {
  // Using RPC function to avoid CORS issues with PATCH
  const { data, error } = await supabase
    .rpc('update_lead_status', {
      lead_id: leadId,
      new_status: status,
    });

  if (error) {
    console.error('Error updating lead:', error);
    return false;
  }

  return data === true;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Error deleting lead:', error);
    return false;
  }

  return true;
}
