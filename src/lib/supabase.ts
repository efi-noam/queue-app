import { createClient } from '@supabase/supabase-js';

// Get env vars - use empty strings as fallback during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client - will fail gracefully if env vars are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
