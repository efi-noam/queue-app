import { createClient } from '@supabase/supabase-js';

// Get env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a function to safely get the client
function createSafeClient() {
  // Check if we have valid env vars
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars missing - returning mock client');
    // Return a mock client that won't crash
    return {
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }), remove: () => Promise.resolve({ error: null }) }) },
      auth: { getSession: () => Promise.resolve({ data: null, error: null }) },
    };
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createSafeClient();
