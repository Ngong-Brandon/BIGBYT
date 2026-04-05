// supabase/functions/send-campaign/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("campaign_id is required");

    // Use service role key — this bypasses RLS and is safe server-side only
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Fetch the campaign ─────────────────────────────────────────────────
    const { data: campaign, error: campError } = await supabase
      .from("notification_campaigns")
      .select("*, restaurant:restaurants(name, emoji)")
      .eq("id", campaign_id)
      .single();

    if (campError || !campaign) throw new Error("Campaign not found");
    if (campaign.status === "sent") throw new Error("Campaign already sent");

    // Mark as sending
    await supabase
      .from("notification_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    // ── 2. Resolve target users ───────────────────────────────────────────────
    let targetUserIds: string[] = [];

    if (campaign.audience === "all") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      targetUserIds = (profiles || []).map((p: any) => p.id);

    } else if (campaign.audience === "restaurant" && campaign.target_restaurant_id) {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id")
        .eq("restaurant_id", campaign.target_restaurant_id)
        .eq("status", "delivered");
      const seen = new Set<string>();
      (orders || []).forEach((o: any) => seen.add(o.user_id));
      targetUserIds = Array.from(seen);

    } else if (campaign.audience === "category" && campaign.target_category) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order:orders(user_id, status), menu_item:menu_items(category:menu_categories(name))");
      const seen = new Set<string>();
      (orderItems || []).forEach((oi: any) => {
        const cat    = oi.menu_item?.category?.name;
        const userId = oi.order?.user_id;
        const status = oi.order?.status;
        if (cat?.toLowerCase() === campaign.target_category?.toLowerCase() && status === "delivered" && userId) {
          seen.add(userId);
        }
      });
      targetUserIds = Array.from(seen);
    }

    if (targetUserIds.length === 0) {
      await supabase
        .from("notification_campaigns")
        .update({ status: "sent", sent_count: 0, sent_at: new Date().toISOString() })
        .eq("id", campaign_id);
      return new Response(
        JSON.stringify({ success: true, sent_count: 0, message: "No matching users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Insert in-app notifications ────────────────────────────────────────
    if (campaign.send_in_app) {
      const rows = targetUserIds.map(userId => ({
        user_id:       userId,
        type:          "promo",
        title:         campaign.title,
        body:          campaign.body,
        icon:          campaign.icon || "🎁",
        action_screen: campaign.action_screen || "restaurants",
      }));
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from("notifications").insert(rows.slice(i, i + 100));
      }
    }

    // ── 4. Send emails via Resend ─────────────────────────────────────────────
    let emailsSent = 0;
    if (campaign.send_email) {
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_KEY) throw new Error("RESEND_API_KEY not set");

      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const emailMap: Record<string, string> = {};
      (authUsers?.users || []).forEach((u: any) => { if (u.email) emailMap[u.id] = u.email; });

      const emails = targetUserIds.map(id => emailMap[id]).filter(Boolean);

      for (let i = 0; i < emails.length; i += 10) {
        await Promise.all(emails.slice(i, i + 10).map(async (email) => {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from:    "Bigbyt <onboarding@resend.dev>",
              to:      [email],
              subject: campaign.title,
              html: `
                <div style="font-family:sans-serif;background:#080808;padding:40px 20px">
                  <div style="max-width:480px;margin:0 auto;background:#111;border-radius:20px;overflow:hidden">
                    <div style="background:#FF4500;padding:24px;text-align:center">
                      <h1 style="color:#fff;font-size:28px;font-weight:900;margin:0">🔥 Bigbyt</h1>
                    </div>
                    <div style="padding:32px">
                      <h2 style="color:#F0EBE1;font-size:22px;margin:0 0 12px">${campaign.icon || "🎁"} ${campaign.title}</h2>
                      <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 24px">${campaign.body}</p>
                      <a href="https://your-app.netlify.app" style="background:#FF4500;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:800;font-size:14px;display:inline-block">Order Now →</a>
                    </div>
                    <div style="border-top:1px solid #222;padding:20px;text-align:center">
                      <p style="color:#444;font-size:12px;margin:0">© 2026 Bigbyt</p>
                    </div>
                  </div>
                </div>
              `,
            }),
          });
          if (res.ok) emailsSent++;
        }));
        if (i + 10 < emails.length) await new Promise(r => setTimeout(r, 1000));
      }
    }

    // ── 5. Mark sent ──────────────────────────────────────────────────────────
    await supabase
      .from("notification_campaigns")
      .update({ status: "sent", sent_count: targetUserIds.length, sent_at: new Date().toISOString() })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({ success: true, sent_count: targetUserIds.length, emails_sent: emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("send-campaign error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});