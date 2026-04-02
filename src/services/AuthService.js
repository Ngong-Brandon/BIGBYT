// src/services/authService.js 
// ─── All authentication logic via Supabase Auth 

import { supabase } from "../lib/supabase"; 
 
// ── Helpers 
 
function calcAge(dob) { 
  const birth = new Date(dob); 
  const now   = new Date(); 
  let age = now.getFullYear() - birth.getFullYear(); 
  const m = now.getMonth() - birth.getMonth(); 
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--; 
  return age; 
} 
 
// ── REGISTER 

// Step 1: Create auth user + trigger OTP email verification 
export async function registerUser({ fullName, email, password, dateOfBirth, phone }) { 
  // Age gate — enforced on frontend AND you should enforce in a Supabase Function too 
  if (calcAge(dateOfBirth) < 18) { 
    return { error: { message: "You must be 18 or older to create an account." } }; 
  } 
 
  // Create the Supabase auth user 
  // Supabase will send a confirmation email automatically (enable in Dashboard → Auth → Email) 
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      // Pass extra fields — we'll write them to profiles table after confirmation 
      data: { 
        full_name:     fullName, 
        date_of_birth: dateOfBirth, 
        phone:         phone || null, 
      }, 
      // !! REPLACE with your actual app URL !! 
      // This is the URL the confirmation email redirects to 
      // emailRedirectTo: import.meta.env.VITE_APP_URL + "/auth/callback",
    }, 
  }); 
  
  
 
  if (error) return { error }; 
 
  // Write profile row immediately (user row exists, but session is not yet confirmed) 
  // This will succeed because we use the user's own id 
  // if (data.user) { 
  //   const { error: profileError } = await supabase.from("profiles").insert({ 
  //     id:            data.user.id, 
  //     full_name:     fullName, 
  //     phone:         phone || null, 
  //     date_of_birth: dateOfBirth, 
  //   }); 
 
  //   if (profileError) { 
  //     console.error("Profile insert error:", profileError); 
  //     // Non-fatal — profile can be created on first login 
  //   } 
  // } 
 
  return { data, error }; 
} 
 
 
// ── VERIFY OTP 
 
// Supabase sends a 6-digit OTP to the email when signUp is called. 
// Use this to verify it without a full page redirect. 
export async function verifyOtp({ email, token }) { 
  const { data, error } = await supabase.auth.verifyOtp({ 
    email, 
    token, 
    type: "signup",   // use "email" for magic link OTP, "signup" for registration 
  }); 
  return { data, error }; 
} 
 
 
// ── LOGIN 

export async function loginUser({ email, password }) { 
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }); 
  
  
  return { data, error }; 
} 
 
 
// ── LOGOUT 
 
export async function logoutUser() { 
  const { error } = await supabase.auth.signOut(); 
  return { error }; 
} 
 
 
// ── GET CURRENT SESSION 

export async function getSession() { 
  const { data, error } = await supabase.auth.getSession(); 
  return { session: data?.session, error }; 
} 
 
 
// ── GET PROFILE 
 
export async function getProfile(userId) { 
  const { data, error } = await supabase 
    .from("profiles") 
    .select("*") 
    .eq("id", userId) 
    .maybeSingle(); 
   
    
  return { profile: data, error }; 
} 
// await getProfile('');
//  console.log(await getProfile(''));
 

// ── UPDATE PROFILE 

export async function updateProfile(userId, updates) { 
  const { data, error } = await supabase 
    .from("profiles") 
    .update(updates) 
    .eq("id", userId) 
    .select() 
    .single(); 
  return { profile: data, error }; 
} 
 
 
// ── RESEND OTP 

export async function resendOtp(email) { 
  const { error } = await supabase.auth.resend({ 
    type: "signup", 
    email, 
    options: { 
      emailRedirectTo: import.meta.env.VITE_APP_URL + "/auth/callback", 
    }, 
  }); 
  return { error }; 
} 
 
 
// ── AUTH STATE LISTENER 

// Use this in AuthContext to react to login/logout events 
export function onAuthStateChange(callback) { 
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback); 
  return subscription; // call subscription.unsubscribe() on cleanup 
} 
 
 
 
