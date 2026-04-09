// src/services/advertisementService.js
// ─── Fetch and manage in-app advertisements ───────────────────────────────────
import { supabase } from "../lib/supabase";

// ── Get active non-expired adverts (for Home page) ────────────────────────────
export async function getActiveAdverts() {
  const { data, error } = await supabase
    .from("advertisements")
    .select(`
      *,
      restaurant:restaurants(id, name, emoji, image_url)
    `)
    .eq("is_active", true)
    .lte("starts_at", new Date().toISOString())
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return { adverts: data || [], error };
}

// ── Get ALL adverts for admin (including expired) ─────────────────────────────
export async function getAllAdverts() {
  const { data, error } = await supabase
    .from("advertisements")
    .select(`
      *,
      restaurant:restaurants(id, name, emoji, image_url)
    `)
    .order("created_at", { ascending: false });
  return { adverts: data || [], error };
}

// ── Create a new advert ───────────────────────────────────────────────────────
export async function createAdvert(payload) {
  const { data, error } = await supabase
    .from("advertisements")
    .insert(payload)
    .select()
    .single();
  return { advert: data, error };
}

// ── Update an advert ──────────────────────────────────────────────────────────
export async function updateAdvert(id, updates) {
  const { data, error } = await supabase
    .from("advertisements")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { advert: data, error };
}

// ── Deactivate an advert ──────────────────────────────────────────────────────
export async function deactivateAdvert(id) {
  return updateAdvert(id, { is_active: false });
}

// ── Delete an advert ──────────────────────────────────────────────────────────
export async function deleteAdvert(id) {
  const { error } = await supabase
    .from("advertisements")
    .delete()
    .eq("id", id);
  return { error };
}

// ── Helper: days remaining ────────────────────────────────────────────────────
export function daysRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Helper: is expired ────────────────────────────────────────────────────────
export function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() < Date.now();
}