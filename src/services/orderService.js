// src/services/orderService.js
// ─── Order placement, tracking, history via Supabase ─────────────────────────
import { supabase } from "../lib/supabase";



// ── PLACE ORDER ───────────────────────────────────────────────────────────────
export async function placeOrder({ userId, restaurantId, items, deliveryAddress, deliveryFee, paymentRef }) {
  // items = [{ id, name, price, qty, emoji }]

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = +(subtotal * 0.08).toFixed(2);
  const total    = +(subtotal + deliveryFee + tax).toFixed(2);

  // 1. Insert the order row
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id:          userId,
      restaurant_id:    restaurantId,
      delivery_address: deliveryAddress,
      subtotal:         +subtotal.toFixed(2),
      delivery_fee:     deliveryFee,
      tax,
      total,
      status:           "pending",
      payment_status:   paymentRef ? "paid" : "unpaid",
      payment_ref:      paymentRef || null,  // !! fill this from Paystack/Stripe webhook !!
      estimated_mins:   30,
    })
    .select()
    .single();

  if (orderError) return { order: null, error: orderError };

  // 2. Insert all order items
  const orderItems = items.map(item => ({
    order_id:     order.id,
    menu_item_id: item.id,
    name:         item.name,
    price:        item.price,
    qty:          item.qty,
    emoji:        item.emoji || "🍽️",
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete the order if items failed
    await supabase.from("orders").delete().eq("id", order.id);
    return { order: null, error: itemsError };
  }

  // 3. Update status to confirmed
  await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", order.id);
   
  return { order: { ...order, status: "confirmed" }, error: null };
}


// ── GET ORDER BY ID (with items) ──────────────────────────────────────────────
export async function getOrder(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      restaurant:restaurants(id, name, emoji, phone),
      items:order_items(id, name, price, qty, emoji, subtotal)
    `)
    .eq("id", orderId)
    .single();
  return { order: data, error };
}


// ── GET USER ORDER HISTORY ────────────────────────────────────────────────────
export async function getOrderHistory(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, user_id, restaurant_id,
      total, subtotal, delivery_fee, tax,
      status, payment_status, placed_at, delivered_at,
      delivery_address, rating,
      restaurant:restaurants(id, name, emoji, image_url, address),
      items:order_items(id, name, price, qty, emoji, image_url)
    `)
    .eq("user_id", userId)
    .order("placed_at", { ascending: false });
  return { orders: data || [], error };
}


// ── CANCEL ORDER ──────────────────────────────────────────────────────────────
export async function cancelOrder(orderId) {
  // Only allow cancel if status is pending or confirmed
  const { data: existing } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (["on_the_way", "delivered"].includes(existing?.status)) {
    return { error: { message: "Cannot cancel — order is already on the way." } };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select()
    .single();

  return { order: data, error };
}


// ── REALTIME ORDER TRACKING ───────────────────────────────────────────────────
// Subscribe to live status updates for a specific order
// Usage:
//   const sub = subscribeToOrder(orderId, (updatedOrder) => setOrder(updatedOrder));
//   return () => sub.unsubscribe();
export function subscribeToOrder(orderId, callback) {

  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      "postgres_changes",
      {
        event:  "UPDATE",
        schema: "public",
        table:  "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return channel;
}


// ── SUBMIT REVIEW ─────────────────────────────────────────────────────────────
export async function submitReview({ userId, restaurantId, orderId, rating, comment }) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({ user_id: userId, restaurant_id: restaurantId, order_id: orderId, rating, comment })
    .select()
    .single();
  return { review: data, error };
}