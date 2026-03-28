// src/services/addressService.js 
// ─── Saved delivery addresses for a user 
 
import { supabase } from "../lib/supabase"; 
 
// ── GET ALL ADDRESSES 

export async function getAddresses(userId) { 
  const { data, error } = await supabase 
    .from("addresses") 
    .select("*") 
    .eq("user_id", userId) 
    .order("is_default", { ascending: false }); 
  return { addresses: data || [], error }; 
} 
 
// ── ADD ADDRESS 

export async function addAddress(userId, { label, address, city, isDefault = false }) { 
  // If this is default, unset all others first 
  if (isDefault) { 
    await supabase 
      .from("addresses") 
      .update({ is_default: false }) 
      .eq("user_id", userId); 
  } 
 
  const { data, error } = await supabase 
    .from("addresses") 
    .insert({ user_id: userId, label, address, city, is_default: isDefault }) 
    .select() 
    .single(); 
  return { address: data, error }; 
} 
 
// ── DELETE ADDRESS 
 
export async function deleteAddress(addressId) { 
  const { error } = await supabase 
    .from("addresses") 
    .delete() 
    .eq("id", addressId); 
  return { error }; 
} 
 
// ── SET DEFAULT ADDRESS 

export async function setDefaultAddress(userId, addressId) { 
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId); 
  const { data, error } = await supabase 
    .from("addresses") 
    .update({ is_default: true }) 
    .eq("id", addressId) 
    .select() 
    .single(); 
  return { address: data, error }; 
} 
 
 
