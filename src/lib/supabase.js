// src/lib/supabase.js 
// ─── Supabase client — single instance used across the whole app ────────────── 
import { createClient } from "@supabase/supabase-js"; 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 


const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; 
if (!supabaseUrl || !supabaseAnonKey) { 
throw new Error( 
    "Missing Supabase env vars. Check your .env.local file.\n" + 
    "Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY" 
  ); 
} 
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, { 
  auth: { 
    persistSession: true,          // keeps user logged in on refresh 
    autoRefreshToken: true, 
    detectSessionInUrl: true,      // handles magic link / OAuth redirects 
  }, 
}); 
 
export default supabase;