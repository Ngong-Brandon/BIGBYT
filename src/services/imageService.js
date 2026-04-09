// src/services/imageService.js
// ─── Upload and manage images via Supabase Storage ───────────────────────────
import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ── Get public URL for a stored image ─────────────────────────────────────────
export function getImageUrl(bucket, path) {
  if (!path) return null;
  // If already a full URL just return it
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ── Upload an image file, return the public URL ────────────────────────────────
export async function uploadImage(bucket, file, folder = "") {
  if (!file) return { url: null, error: null };

  // Sanitise filename
  const ext      = file.name.split(".").pop().toLowerCase();
  const filename = `${folder ? folder + "/" : ""}${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, {
      cacheControl: "3600",
      upsert:       false,
    });

  if (error) return { url: null, error };

  const url = getImageUrl(bucket, data.path);
  return { url, path: data.path, error: null };
}

// ── Delete an image ───────────────────────────────────────────────────────────
export async function deleteImage(bucket, path) {
  if (!path || path.startsWith("http")) return { error: null };
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}