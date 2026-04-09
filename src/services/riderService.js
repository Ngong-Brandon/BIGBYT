// src/services/riderService.js
// ─── Rider management and delivery tracking ───────────────────────────────────
import { supabase } from "../lib/supabase";

// ── Get rider by token (used on rider page — no auth required) ────────────────
export async function getRiderByToken(token) {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("token", token)
    .single();
  return { rider: data, error };
}

// ── Get ALL active orders assigned to this rider (FIFO — oldest first) ──────────
export async function getRiderActiveOrders(riderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total, delivery_address,
      placed_at, picked_up_at,
      restaurant:restaurants(name, emoji, image_url, address),
      user:profiles(full_name, phone),
      items:order_items(name, qty, price)
    `)
    .eq("rider_id", riderId)
    .in("status", ["confirmed", "preparing", "on_the_way"])
    .order("placed_at", { ascending: true }); // oldest first = FIFO
  return { orders: data || [], error };
}

// Keep backward compat alias
export async function getRiderActiveOrder(riderId) {
  const { orders, error } = await getRiderActiveOrders(riderId);
  return { order: orders?.[0] || null, error };
}

// ── Rider updates order status ────────────────────────────────────────────────
export async function riderUpdateStatus(orderId, status) {
  const updates = { status };
  if (status === "on_the_way") updates.picked_up_at = new Date().toISOString();
  if (status === "delivered")  updates.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();
  return { order: data, error };
}

// ── Rider sets themselves online/offline ──────────────────────────────────────
export async function setRiderOnline(riderId, isOnline) {
  const { error } = await supabase
    .from("riders")
    .update({ is_online: isOnline })
    .eq("id", riderId);
  return { error };
}

// ── ADMIN: get all riders ─────────────────────────────────────────────────────
export async function getAllRiders() {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .order("created_at", { ascending: false });
  return { riders: data || [], error };
}

// ── ADMIN: create a new rider ─────────────────────────────────────────────────
export async function createRider(payload) {
  // Generate token server-side using the SQL function
  const { data: tokenData } = await supabase.rpc("generate_rider_token");
  const token = tokenData || Math.random().toString(36).slice(2) + Date.now().toString(36);

  const { data, error } = await supabase
    .from("riders")
    .insert({ ...payload, token })
    .select()
    .single();
  return { rider: data, error };
}

// ── ADMIN: update rider ───────────────────────────────────────────────────────
export async function updateRider(id, updates) {
  const { data, error } = await supabase
    .from("riders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { rider: data, error };
}

// ── ADMIN: assign rider to order ──────────────────────────────────────────────
export async function assignRiderToOrder(orderId, riderId) {
  const { data, error } = await supabase
    .from("orders")
    .update({ rider_id: riderId, status: "confirmed" })
    .eq("id", orderId)
    .select()
    .single();
  return { order: data, error };
}

// ── ADMIN: get all orders with rider info ─────────────────────────────────────
export async function getOrdersForDispatch() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, status, total, delivery_address, placed_at,
      restaurant:restaurants(name, emoji),
      user:profiles(full_name, phone),
      rider:riders(id, full_name, phone)
    `)
    .in("status", ["pending", "confirmed", "preparing", "on_the_way"])
    .order("placed_at", { ascending: true });
  return { orders: data || [], error };
}