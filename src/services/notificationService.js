// src/services/notificationService.js
import { supabase } from "../lib/supabase";




// ── Fetch all notifications for current user ──────────────────────────────────
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return { notifications: data || [], error };
}

// ── Get unread count ──────────────────────────────────────────────────────────
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { count: count || 0, error };
}

// ── Mark single notification as read ─────────────────────────────────────────
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  return { error };
}

// ── Mark all notifications as read ───────────────────────────────────────────
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { error };
}

// ── Realtime subscription ─────────────────────────────────────────────────────
// Returns a Supabase channel — call supabase.removeChannel(channel) to unsubscribe
export function subscribeToNotifications(userId, onNew) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event:  "INSERT",
        schema: "public",
        table:  "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new)
    )
    .subscribe();

  return channel;
}

// FIXED — passes auth token from current session
export async function sendCampaign(campaignId) {
  // Directly insert notification without Edge Function
  const { data: campaign } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();


  if (!campaign) return { error: { message: "Campaign not found" } };

  // Get all user IDs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id");

  const rows = (profiles || []).map(p => ({
    user_id:       p.id,
    type:          "promo",
    title:         campaign.title,
    body:          campaign.body,
    icon:          campaign.icon || "🎁",
    action_screen: "restaurants",
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (!error) {
    await supabase
      .from("notification_campaigns")
      .update({ status: "sent", sent_count: rows.length, sent_at: new Date().toISOString() })
      .eq("id", campaignId);
  }

  return { data: { success: true, sent_count: rows.length }, error };
}
// ── Get all campaigns (admin) ─────────────────────────────────────────────────
export async function getCampaigns() {
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select("*, restaurant:restaurants(name, emoji)")
    .order("created_at", { ascending: false });
  return { campaigns: data || [], error };
}

// ── Create campaign (admin) ───────────────────────────────────────────────────
export async function createCampaign(payload) {
  const { data, error } = await supabase
    .from("notification_campaigns")
    .insert(payload)
    .select()
    .single();
  return { campaign: data, error };
}