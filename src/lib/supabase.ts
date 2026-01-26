import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton pattern to avoid build-time initialization
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Export a getter that creates the client on first access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = {
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient());
  },
  get rpc() {
    return getSupabaseClient().rpc.bind(getSupabaseClient());
  },
  get storage() {
    return getSupabaseClient().storage;
  },
  get auth() {
    return getSupabaseClient().auth;
  },
} as unknown as SupabaseClient;
