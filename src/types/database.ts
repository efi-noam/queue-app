export interface Database {
  public: {
    Tables: {
      business_owners: {
        Row: BusinessOwner;
        Insert: Omit<BusinessOwner, 'id' | 'created_at'>;
        Update: Partial<Omit<BusinessOwner, 'id'>>;
      };
      businesses: {
        Row: Business;
        Insert: Omit<Business, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Business, 'id'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at'>;
        Update: Partial<Omit<Service, 'id'>>;
      };
      business_hours: {
        Row: BusinessHours;
        Insert: Omit<BusinessHours, 'id'>;
        Update: Partial<Omit<BusinessHours, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at'>;
        Update: Partial<Omit<Customer, 'id'>>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Appointment, 'id'>>;
      };
      gallery_images: {
        Row: GalleryImage;
        Insert: Omit<GalleryImage, 'id' | 'created_at'>;
        Update: Partial<Omit<GalleryImage, 'id'>>;
      };
    };
  };
}

export interface BusinessOwner {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  slot_interval: number; // Minutes between slots (15, 20, 30)
  theme: 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'rose' | 'modern'; // UI theme
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration: number; // in minutes
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  open_time: string | null; // HH:MM format
  close_time: string | null; // HH:MM format
  break_start: string | null; // HH:MM format - start of break
  break_end: string | null; // HH:MM format - end of break
  is_closed: boolean;
}

export interface Customer {
  id: string;
  business_id: string;
  phone: string;
  name: string;
  email: string | null;
  pin_hash: string | null;
  notes: string | null;
  reset_code: string | null;
  reset_code_expires: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  business_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ScheduleOverride {
  id: string;
  business_id: string;
  date: string; // YYYY-MM-DD
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  reason: string | null;
  created_at: string;
}

// Helper types
export type AppointmentStatus = Appointment['status'];
export type LeadStatus = Lead['status'];

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingFormData {
  service_id: string;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  customer_pin?: string;
  notes?: string;
}
