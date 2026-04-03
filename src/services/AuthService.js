// src/services/authService.js
import { supabase } from "../lib/supabase";

function calcAge(dob) {
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── REGISTER — creates user, Supabase sends OTP email automatically ───────────
export async function registerUser({ fullName, email, password, dateOfBirth, phone }) {
  if (calcAge(dateOfBirth) < 18) {
    return { error: { message: "You must be 18 or older to create an account." } };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name:     fullName,
        date_of_birth: dateOfBirth,
        phone:         phone || null,
      },
    },
  });

  if (error) return { data: null, error };

  // If identities is empty the email already exists
  if (data?.user && data.user.identities?.length === 0) {
    return { data: null, error: { message: "An account with this email already exists." } };
  }

  return { data, error: null };
}

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
export async function verifyEmailOtp({ email, token }) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type:  "signup",
  });
  return { data, error };
}

// ── RESEND OTP ────────────────────────────────────────────────────────────────
export async function resendOtp(email) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return { error };
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Catch unconfirmed email specifically
  if (error?.message?.toLowerCase().includes("email not confirmed")) {
    return { data: null, error: { message: "EMAIL_NOT_CONFIRMED", email } };
  }

  return { data, error };
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── GET PROFILE ───────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return { profile: data, error };
}

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();
  return { profile: data, error };
}

// ── AUTH STATE LISTENER ───────────────────────────────────────────────────────
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}