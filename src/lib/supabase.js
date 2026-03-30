import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "bigbyt-auth",  // ← unique key prevents conflicts
    storage: window.localStorage,
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,  // ← force anon key on every request
    },
  },
});

export default supabase;