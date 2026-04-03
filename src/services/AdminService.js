// src/services/adminService.js
// ─── All admin Supabase queries ───────────────────────────────────────────────
// !! IMPORTANT: Admin operations require the service_role key !!
// !! Never expose the service_role key on the frontend !!
// !! For production, move these to Supabase Edge Functions !!
// !! For development/testing, these use the anon key with RLS bypassed !!
import { supabase } from "../lib/supabase";

// ── DASHBOARD STATS ───────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [ordersRes, revenueRes, usersRes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact" }).gte("placed_at", today),
    supabase.from("orders").select("total").gte("placed_at", today).eq("payment_status", "paid"),
    supabase.from("profiles").select("id", { count: "exact" }),
  ]);

  const todayRevenue = (revenueRes.data || []).reduce((s, o) => s + Number(o.total), 0);

  return {
    todayOrders:  ordersRes.count  || 0,
    todayRevenue: todayRevenue.toFixed(2),
    totalUsers:   usersRes.count   || 0,
  };
}

// ── RECENT ORDERS ─────────────────────────────────────────────────────────────
export async function getRecentOrders(limit = 10) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, total, status, payment_status, placed_at,
      user:profiles(full_name),
      restaurant:restaurants(name, emoji)
    `)
    .order("placed_at", { ascending: false })
    .limit(limit);
  return { orders: data || [], error };
}

// ── ALL ORDERS (with filters) ─────────────────────────────────────────────────
export async function getAllOrders({ status, limit = 50 } = {}) {
  let query = supabase
    .from("orders")
    .select(`
      id, total, status, placed_at, delivery_address,
      user:profiles(full_name),
      restaurant:restaurants(name, emoji),
      items:order_items(name, qty, price)
    `)
    .order("placed_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  return { orders: data || [], error };
}

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    })
    .eq("id", orderId)
    .select()
    .single();
  return { order: data, error };
}

// ── ALL RESTAURANTS ───────────────────────────────────────────────────────────
export async function getAdminRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");
  return { restaurants: data || [], error };
}

// ── CREATE RESTAURANT ─────────────────────────────────────────────────────────
export async function createRestaurant(payload) {
  const { data, error } = await supabase
    .from("restaurants")
    .insert(payload)
    .select()
    .single();
  return { restaurant: data, error };
}

// ── UPDATE RESTAURANT ─────────────────────────────────────────────────────────
export async function updateRestaurant(id, updates) {
  const { data, error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { restaurant: data, error };
}

// ── TOGGLE RESTAURANT OPEN/CLOSED ─────────────────────────────────────────────
export async function toggleRestaurantOpen(id, isOpen) {
  return updateRestaurant(id, { is_open: isOpen });
}

// ── ALL MENU ITEMS ────────────────────────────────────────────────────────────
export async function getAdminMenuItems(restaurantId = null) {
  let query = supabase
    .from("menu_items")
    .select(`*, restaurant:restaurants(name), category:menu_categories(name)`)
    .order("name");

  if (restaurantId) query = query.eq("restaurant_id", restaurantId);

  const { data, error } = await query;
  return { items: data || [], error };
}

// ── CREATE MENU ITEM ──────────────────────────────────────────────────────────
export async function createMenuItem(payload) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(payload)
    .select()
    .single();
    
    
  return { item: data, error };
}

// ── UPDATE MENU ITEM ──────────────────────────────────────────────────────────
export async function updateMenuItem(id, updates) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { item: data, error };
}

// ── TOGGLE ITEM AVAILABILITY ──────────────────────────────────────────────────
export async function toggleMenuItemAvailability(id, isAvailable) {
  return updateMenuItem(id, { is_available: isAvailable });
}

// ── ALL USERS ─────────────────────────────────────────────────────────────────
export async function getAdminUsers(limit = 50) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { users: data || [], error };
}

// ── ALL REVIEWS ───────────────────────────────────────────────────────────────
export async function getAdminReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, created_at,
      user:profiles(full_name),
      restaurant:restaurants(name)
    `)
    .order("created_at", { ascending: false });
  return { reviews: data || [], error };
}

// ── DELETE REVIEW ─────────────────────────────────────────────────────────────
export async function deleteReview(id) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return { error };
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, revenueRes, topRestaurantsRes] = await Promise.all([
    supabase.from("orders").select("id, placed_at, status").gte("placed_at", thirtyDaysAgo),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("placed_at", thirtyDaysAgo),
    supabase.from("orders").select("restaurant_id, restaurant:restaurants(name, emoji)").gte("placed_at", thirtyDaysAgo),
  ]);

  const totalRevenue = (revenueRes.data || []).reduce((s, o) => s + Number(o.total), 0);

  // Count orders per restaurant
  const restaurantCounts = {};
  (topRestaurantsRes.data || []).forEach(o => {
    const key = o.restaurant_id;
    if (!restaurantCounts[key]) restaurantCounts[key] = { count: 0, name: o.restaurant?.name, emoji: o.restaurant?.emoji };
    restaurantCounts[key].count++;
  });
  const topRestaurants = Object.values(restaurantCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalOrders = ordersRes.data?.length || 0;
  topRestaurants.forEach(r => { r.pct = totalOrders ? Math.round((r.count / totalOrders) * 100) : 0; });

  return {
    totalOrders,
    totalRevenue: totalRevenue.toFixed(2),
    topRestaurants,
    error: null,
  };
}