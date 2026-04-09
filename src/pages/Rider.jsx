// src/pages/Rider.jsx
// ─── Rider delivery page — accessed via ?token=xxx link ───────────────────────
// Riders open this on their phone browser, no login needed
import { useState, useEffect } from "react";
import {
  getRiderByToken,
  getRiderActiveOrder,
  riderUpdateStatus,
  setRiderOnline,
} from "../services/riderService";

const R = {
  bg:      "#080808",
  surface: "#111111",
  card:    "#161616",
  border:  "#1E1E1E",
  accent:  "#FF4500",
  text:    "#F0EBE1",
  muted:   "#6B6860",
  success: "#00C48C",
  error:   "#FF4560",
  warning: "#F5A623",
};

const STATUS_CONFIG = {
  confirmed:  { label: "Order Confirmed",  color: "#378ADD", icon: "✅", next: "preparing",  nextLabel: "Start Preparing" },
  preparing:  { label: "Preparing",         color: R.warning,  icon: "👨‍🍳", next: "on_the_way", nextLabel: "Picked Up — On the Way!" },
  on_the_way: { label: "On the Way",        color: R.accent,   icon: "🛵", next: "delivered",  nextLabel: "Mark as Delivered" },
  delivered:  { label: "Delivered",         color: R.success,  icon: "✅", next: null,         nextLabel: null },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function Rider() {
  // Read token from URL: /rider?token=abc123
  const token = new URLSearchParams(window.location.search).get("token");

  const [rider,    setRider]    = useState(null);
  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [online,   setOnline]   = useState(false);

  useEffect(() => {
    if (!token) { setError("No rider token in URL. Ask your admin for the correct link."); setLoading(false); return; }
    load();
  }, [token]);

  // Auto-refresh order every 30 seconds
  useEffect(() => {
    if (!rider) return;
    const interval = setInterval(() => loadOrder(rider.id), 30000);
    return () => clearInterval(interval);
  }, [rider]);

  async function load() {
    setLoading(true);
    const { rider: r, error: rErr } = await getRiderByToken(token);
    if (rErr || !r) { setError("Invalid or expired rider link. Contact your admin."); setLoading(false); return; }
    setRider(r);
    setOnline(r.is_online);
    await loadOrder(r.id);
    setLoading(false);
  }

  async function loadOrder(riderId) {
    const { order: o } = await getRiderActiveOrder(riderId);
    setOrder(o || null);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatusUpdate(orderId, nextStatus) {
    setUpdating(true);
    const { error } = await riderUpdateStatus(orderId, nextStatus);
    setUpdating(false);
    if (error) { showToast("Failed to update. Try again.", "error"); return; }

    const labels = {
      preparing:  "Marked as Preparing ✓",
      on_the_way: "Picked up! Customer notified 🛵",
      delivered:  "Order delivered! Great work 🎉",
    };
    showToast(labels[nextStatus] || "Updated ✓");

    if (nextStatus === "delivered") {
      setOrder(null); // clear order — wait for next assignment
    } else {
      setOrder(prev => ({ ...prev, status: nextStatus }));
    }
  }

  async function handleToggleOnline() {
    const newState = !online;
    setOnline(newState);
    await setRiderOnline(rider.id, newState);
    showToast(newState ? "You are now Online 🟢" : "You are now Offline 🔴");
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: R.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif" }}>
        <div style={{ textAlign: "center", color: R.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛵</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: R.text }}>Loading...</div>
        </div>
      </div>
    );
  }

  // ── Invalid token ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: R.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Syne',sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: R.text, marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.6 }}>{error}</div>
        </div>
      </div>
    );
  }

  const s = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed) : null;

  return (
    <div style={{ background: R.bg, minHeight: "100vh", fontFamily: "'Syne',sans-serif", color: R.text, maxWidth: 480, margin: "0 auto", padding: "0 0 40px" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? R.error : R.success, color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: R.surface, borderBottom: `1px solid ${R.border}`, padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: R.muted, fontFamily: "'DM Mono',monospace", marginBottom: 2 }}>BIGBYT RIDER</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>{rider?.full_name}</div>
            <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>{rider?.zone ? `📍 ${rider.zone}` : ""}</div>
          </div>

          {/* Online toggle */}
          <div style={{ textAlign: "center" }}>
            <div onClick={handleToggleOnline}
              style={{ width: 56, height: 56, borderRadius: "50%", background: online ? `${R.success}22` : R.card, border: `2px solid ${online ? R.success : R.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", fontSize: 24, margin: "0 auto 4px" }}>
              {online ? "🟢" : "🔴"}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: online ? R.success : R.muted }}>
              {online ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>

        {/* No active order */}
        {!order ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {online ? "Waiting for an order..." : "You are offline"}
            </div>
            <div style={{ fontSize: 14, color: R.muted, lineHeight: 1.6, marginBottom: 24 }}>
              {online
                ? "Your next delivery will appear here when admin assigns it to you."
                : "Tap the button above to go online and receive deliveries."}
            </div>
            <button onClick={() => loadOrder(rider.id)}
              style={{ background: R.surface, color: R.muted, border: `1px solid ${R.border}`, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              🔄 Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Status banner */}
            <div style={{ background: `${s.color}18`, border: `1px solid ${s.color}44`, borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 36 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>Order placed {timeAgo(order.placed_at)}</div>
              </div>
            </div>

            {/* Restaurant */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: R.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>PICK UP FROM</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: R.card, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {order.restaurant?.emoji || "🍽️"}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{order.restaurant?.name}</div>
                  {order.restaurant?.address && (
                    <div style={{ fontSize: 12, color: R.muted, marginTop: 2 }}>{order.restaurant.address}</div>
                  )}
                </div>
              </div>
              {/* Open in maps */}
              {order.restaurant?.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.restaurant.address)}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: R.card, border: `1px solid ${R.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: R.accent, textDecoration: "none" }}>
                  📍 Open in Google Maps
                </a>
              )}
            </div>

            {/* Customer / Deliver to */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: R.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>DELIVER TO</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{order.user?.full_name || "Customer"}</div>
              <div style={{ fontSize: 13, color: R.muted, lineHeight: 1.5, marginBottom: 10 }}>{order.delivery_address}</div>
              {/* Call customer */}
              {order.user?.phone && (
                <a href={`tel:${order.user.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${R.success}18`, border: `1px solid ${R.success}44`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: R.success, textDecoration: "none" }}>
                  📞 Call Customer
                </a>
              )}
              {/* Open delivery address in maps */}
              {order.delivery_address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 8, background: R.card, border: `1px solid ${R.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: R.accent, textDecoration: "none" }}>
                  📍 Navigate
                </a>
              )}
            </div>

            {/* Order items */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: R.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>ITEMS IN ORDER</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, background: R.card, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: R.accent }}>{item.qty}x</div>
                      <span>{item.name}</span>
                    </div>
                    <span style={{ color: R.muted, fontFamily: "'DM Mono',monospace" }}>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${R.border}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: R.accent, fontFamily: "'DM Mono',monospace" }}>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Main action button */}
            {s.next && (
              <button
                onClick={() => handleStatusUpdate(order.id, s.next)}
                disabled={updating}
                style={{
                  width: "100%", padding: "18px", borderRadius: 14, border: "none",
                  background: s.next === "delivered" ? R.success : R.accent,
                  color: "#fff", fontSize: 17, fontWeight: 800, cursor: updating ? "not-allowed" : "pointer",
                  fontFamily: "'Syne',sans-serif", opacity: updating ? 0.7 : 1,
                  letterSpacing: "-0.3px", transition: "opacity 0.15s",
                }}>
                {updating ? "Updating..." : s.nextLabel}
              </button>
            )}

            {/* Delivered — done state */}
            {order.status === "delivered" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: R.success }}>Delivered!</div>
                <div style={{ fontSize: 13, color: R.muted, marginTop: 4 }}>Waiting for next order...</div>
              </div>
            )}

            {/* Refresh */}
            <button onClick={() => loadOrder(rider.id)}
              style={{ width: "100%", marginTop: 12, background: "none", border: `1px solid ${R.border}`, borderRadius: 10, padding: "11px", color: R.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              🔄 Refresh Order
            </button>
          </>
        )}
      </div>
    </div>
  );
}