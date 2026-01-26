import { supabase } from './supabase';
import type { Business, Service, BusinessHours, GalleryImage, Customer, Appointment, TimeSlot, ScheduleOverride } from '@/types/database';

// =============================================
// Utility Functions
// =============================================

/**
 * Format a Date object to YYYY-MM-DD string in LOCAL timezone
 * This avoids timezone issues with toISOString()
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string in LOCAL timezone
 */
export function getTodayLocal(): string {
  return formatDateLocal(new Date());
}

// =============================================
// Business Functions
// =============================================

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }

  return data;
}

// =============================================
// Services Functions
// =============================================

export async function getServicesByBusinessId(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

// =============================================
// Business Hours Functions
// =============================================

export async function getBusinessHours(businessId: string): Promise<BusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('business_id', businessId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching business hours:', error);
    return [];
  }

  return data || [];
}

// =============================================
// Gallery Functions
// =============================================

export async function getGalleryImages(businessId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }

  return data || [];
}

// =============================================
// Customer Functions
// =============================================

export async function getCustomerByPhone(businessId: string, phone: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching customer:', error);
  }

  return data || null;
}

export async function createCustomer(
  businessId: string,
  phone: string,
  name: string,
  pinHash?: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      phone,
      name,
      pin_hash: pinHash || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    return null;
  }

  return data;
}

export async function getOrCreateCustomer(
  businessId: string,
  phone: string,
  name: string
): Promise<Customer | null> {
  // First try to find existing customer
  let customer = await getCustomerByPhone(businessId, phone);
  
  if (!customer) {
    // Create new customer
    customer = await createCustomer(businessId, phone, name);
  }

  return customer;
}

// =============================================
// Appointment Functions
// =============================================

export async function getAppointmentsByDate(
  businessId: string,
  date: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .eq('date', date)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  return data || [];
}

export async function getCustomerAppointments(customerId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      services (name, duration, price)
    `)
    .eq('customer_id', customerId)
    .neq('status', 'cancelled')
    .gte('date', getTodayLocal())
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching customer appointments:', error);
    return [];
  }

  return data || [];
}

export async function createAppointment(
  businessId: string,
  customerId: string,
  serviceId: string,
  date: string,
  startTime: string,
  endTime: string,
  notes?: string
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      customer_id: customerId,
      service_id: serviceId,
      date,
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return null;
  }

  return data;
}

export async function getBusinessAppointments(
  businessId: string,
  fromDate?: string
): Promise<Appointment[]> {
  const today = fromDate || getTodayLocal();
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (name, phone),
      services (name, duration, price)
    `)
    .eq('business_id', businessId)
    .gte('date', today)
    .neq('status', 'cancelled')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching business appointments:', error);
    return [];
  }

  return data || [];
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  // Using RPC to avoid CORS issues with PATCH
  const { data, error } = await supabase.rpc('update_appointment_status', {
    p_appointment_id: appointmentId,
    p_status: 'cancelled',
  });

  if (error) {
    console.error('Error cancelling appointment:', error);
    return false;
  }

  return data === true;
}

// =============================================
// Business Update Functions
// =============================================

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
): Promise<Business | null> {
  console.log('updateBusiness called with:', { businessId, updates });
  
  // Using RPC to avoid CORS issues with PATCH
  const params = {
    p_business_id: businessId,
    p_name: updates.name !== undefined ? updates.name : null,
    p_description: updates.description !== undefined ? updates.description : null,
    p_address: updates.address !== undefined ? updates.address : null,
    p_phone: updates.phone !== undefined ? updates.phone : null,
    p_whatsapp: updates.whatsapp !== undefined ? updates.whatsapp : null,
    p_instagram: updates.instagram !== undefined ? updates.instagram : null,
    p_logo_url: updates.logo_url !== undefined ? updates.logo_url : null,
    p_cover_image_url: updates.cover_image_url !== undefined ? updates.cover_image_url : null,
    p_theme: updates.theme !== undefined ? updates.theme : null,
  };
  
  console.log('RPC params:', params);
  
  const { data, error } = await supabase.rpc('update_business_info', params);

  console.log('RPC result:', { data, error });

  if (error) {
    console.error('Error updating business:', error);
    return null;
  }

  // Return updated business
  if (data) {
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    return business;
  }

  return null;
}

export async function createService(
  businessId: string,
  service: { name: string; description?: string; duration: number; price: number }
): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .insert({
      business_id: businessId,
      name: service.name,
      description: service.description || null,
      duration: service.duration,
      price: service.price,
      is_active: true,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    return null;
  }

  return data;
}

export async function updateService(
  serviceId: string,
  updates: Partial<Service>
): Promise<Service | null> {
  // Using RPC to avoid CORS issues with PATCH
  const { data, error } = await supabase.rpc('update_service_info', {
    p_service_id: serviceId,
    p_name: updates.name || null,
    p_description: updates.description || null,
    p_duration: updates.duration || null,
    p_price: updates.price || null,
    p_is_active: updates.is_active ?? null,
  });

  if (error) {
    console.error('Error updating service:', error);
    return null;
  }

  // Return updated service
  if (data) {
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
    return service;
  }

  return null;
}

export async function deleteService(serviceId: string): Promise<boolean> {
  // Using RPC to avoid CORS issues with PATCH
  const { data, error } = await supabase.rpc('update_service_info', {
    p_service_id: serviceId,
    p_is_active: false,
  });

  if (error) {
    console.error('Error deleting service:', error);
    return false;
  }

  return data === true;
}

export async function updateBusinessHours(
  businessId: string,
  hours: { day_of_week: number; open_time: string | null; close_time: string | null; break_start: string | null; break_end: string | null; is_closed: boolean }[]
): Promise<boolean> {
  // Delete existing hours and insert new ones
  const { error: deleteError } = await supabase
    .from('business_hours')
    .delete()
    .eq('business_id', businessId);

  if (deleteError) {
    console.error('Error deleting business hours:', deleteError);
    return false;
  }

  const { error: insertError } = await supabase
    .from('business_hours')
    .insert(
      hours.map(h => ({
        business_id: businessId,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        break_start: h.break_start,
        break_end: h.break_end,
        is_closed: h.is_closed,
      }))
    );

  if (insertError) {
    console.error('Error inserting business hours:', insertError);
    return false;
  }

  return true;
}

// =============================================
// Image Upload Functions
// =============================================

export async function uploadImage(
  file: File,
  businessId: string,
  type: 'logo' | 'cover' | 'gallery'
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('business-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('business-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteImage(imageUrl: string): Promise<boolean> {
  // Extract path from URL
  const path = imageUrl.split('/business-images/')[1];
  if (!path) return false;

  const { error } = await supabase.storage
    .from('business-images')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
}

export async function addGalleryImage(
  businessId: string,
  imageUrl: string
): Promise<GalleryImage | null> {
  const { data, error } = await supabase
    .from('gallery_images')
    .insert({
      business_id: businessId,
      image_url: imageUrl,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding gallery image:', error);
    return null;
  }

  return data;
}

export async function deleteGalleryImage(imageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error('Error deleting gallery image:', error);
    return false;
  }

  return true;
}

export async function updateBusinessSlug(
  businessId: string,
  newSlug: string
): Promise<{ success: boolean; error?: string }> {
  // Check if slug is already taken
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', newSlug)
    .neq('id', businessId)
    .single();

  if (existing) {
    return { success: false, error: 'כתובת זו כבר תפוסה' };
  }

  // Using RPC to avoid CORS issues with PATCH
  const { data, error } = await supabase.rpc('update_business_slug', {
    p_business_id: businessId,
    p_new_slug: newSlug,
  });

  if (error) {
    console.error('Error updating slug:', error);
    return { success: false, error: 'שגיאה בעדכון הכתובת' };
  }

  return { success: data === true };
}

// =============================================
// Time Slots Functions
// =============================================

export async function getAvailableTimeSlots(
  businessId: string,
  date: string,
  serviceDuration: number,
  slotInterval?: number // Optional: if not provided, will fetch from business
): Promise<TimeSlot[]> {
  // First, check for schedule override for this specific date
  const override = await getScheduleOverrideForDate(businessId, date);
  
  let openTime: string;
  let closeTime: string;
  let breakStart: string | null = null;
  let breakEnd: string | null = null;

  // Get slot interval from business if not provided
  let interval: number = slotInterval || 30;
  if (!slotInterval) {
    const { data: business } = await supabase
      .from('businesses')
      .select('slot_interval')
      .eq('id', businessId)
      .single();
    interval = business?.slot_interval || 30;
  }

  if (override) {
    // Use override hours
    if (override.is_closed || !override.open_time || !override.close_time) {
      return []; // Business is closed on this specific date
    }
    openTime = override.open_time;
    closeTime = override.close_time;
    // Override doesn't have break times for now
  } else {
    // Fall back to regular business hours
    const dayOfWeek = new Date(date).getDay();
    const businessHours = await getBusinessHours(businessId);
    const todayHours = businessHours.find(h => h.day_of_week === dayOfWeek);

    if (!todayHours || todayHours.is_closed || !todayHours.open_time || !todayHours.close_time) {
      return []; // Business is closed
    }
    openTime = todayHours.open_time;
    closeTime = todayHours.close_time;
    breakStart = todayHours.break_start;
    breakEnd = todayHours.break_end;
  }

  // Get existing appointments for this date
  const appointments = await getAppointmentsByDate(businessId, date);

  // Parse break times if they exist
  let breakStartMinutes: number | null = null;
  let breakEndMinutes: number | null = null;
  if (breakStart && breakEnd) {
    const [breakStartH, breakStartM] = breakStart.split(':').map(Number);
    const [breakEndH, breakEndM] = breakEnd.split(':').map(Number);
    breakStartMinutes = breakStartH * 60 + breakStartM;
    breakEndMinutes = breakEndH * 60 + breakEndM;
  }

  // Generate time slots
  const slots: TimeSlot[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let currentTimeMinutes = openHour * 60 + openMin; // Convert to minutes
  const closeTimeMinutes = closeHour * 60 + closeMin;

  while (currentTimeMinutes + serviceDuration <= closeTimeMinutes) {
    const hours = Math.floor(currentTimeMinutes / 60);
    const mins = currentTimeMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    // Check if slot is available (not overlapping with existing appointments)
    const slotEnd = currentTimeMinutes + serviceDuration;
    
    // Check if slot overlaps with break time
    const overlapsWithBreak = breakStartMinutes !== null && breakEndMinutes !== null && 
      (currentTimeMinutes < breakEndMinutes && slotEnd > breakStartMinutes);

    const isAvailable = !overlapsWithBreak && !appointments.some(apt => {
      const [aptStartH, aptStartM] = apt.start_time.split(':').map(Number);
      const [aptEndH, aptEndM] = apt.end_time.split(':').map(Number);
      const aptStart = aptStartH * 60 + aptStartM;
      const aptEnd = aptEndH * 60 + aptEndM;

      // Check for overlap
      return (currentTimeMinutes < aptEnd && slotEnd > aptStart);
    });

    slots.push({ time: timeStr, available: isAvailable });

    currentTimeMinutes += interval; // Use configurable interval
  }

  return slots;
}

// =============================================
// Schedule Overrides Functions
// =============================================

export async function getScheduleOverrides(
  businessId: string,
  fromDate?: string,
  toDate?: string
): Promise<ScheduleOverride[]> {
  let query = supabase
    .from('schedule_overrides')
    .select('*')
    .eq('business_id', businessId)
    .order('date', { ascending: true });

  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  if (toDate) {
    query = query.lte('date', toDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching schedule overrides:', error);
    return [];
  }

  return data || [];
}

export async function getScheduleOverrideForDate(
  businessId: string,
  date: string
): Promise<ScheduleOverride | null> {
  const { data, error } = await supabase
    .from('schedule_overrides')
    .select('*')
    .eq('business_id', businessId)
    .eq('date', date)
    .single();

  if (error) {
    // Not found is not an error
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching schedule override:', error);
    return null;
  }

  return data;
}

export async function upsertScheduleOverride(
  businessId: string,
  date: string,
  openTime: string | null,
  closeTime: string | null,
  isClosed: boolean,
  reason?: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('upsert_schedule_override', {
    p_business_id: businessId,
    p_date: date,
    p_open_time: openTime,
    p_close_time: closeTime,
    p_is_closed: isClosed,
    p_reason: reason || null,
  });

  if (error) {
    console.error('Error upserting schedule override:', error);
    return null;
  }

  return data;
}

export async function deleteScheduleOverride(
  businessId: string,
  date: string
): Promise<boolean> {
  const { error } = await supabase
    .from('schedule_overrides')
    .delete()
    .eq('business_id', businessId)
    .eq('date', date);

  if (error) {
    console.error('Error deleting schedule override:', error);
    return false;
  }

  return true;
}
