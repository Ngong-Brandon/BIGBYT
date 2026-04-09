// src/pages/Orders.jsx
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { getOrderHistory } from "../services/orderService";
import { supabase } from "../lib/supabase";
import AppImage from "../components/AppImage";

const STATUS = {
  pending:    { label: "Pending",    color: "#F5A623", bg: "#F5A62318", icon: "⏳" },
  confirmed:  { label: "Confirmed",  color: "#378ADD", bg: "#378ADD18", icon: "✅" },
  preparing:  { label: "Preparing",  color: "#F5A623", bg: "#F5A62318", icon: "👨‍🍳" },
  on_the_way: { label: "On the Way", color: C.accent,  bg: `${C.accent}18`, icon: "🛵" },
  delivered:  { label: "Delivered",  color: C.success, bg: `${C.success}18`, icon: "🏠" },
  cancelled:  { label: "Cancelled",  color: C.error,   bg: `${C.error}18`,   icon: "✕" },
};

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtPrice(n) { return `$${Number(n || 0).toFixed(2)}`; }

// ─── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: 28,
            cursor: readonly ? "default" : "pointer",
            opacity: star <= (hovered || value) ? 1 : 0.25,
            transition: "opacity 0.1s",
            filter: star <= (hovered || value) ? "none" : "grayscale(1)",
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const [hov, setHov] = useState(false);
  const s = STATUS[order.status] || STATUS.pending;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: C.surface, border: `1px solid ${hov ? "#FF450055" : C.border}`, borderRadius: 18, padding: 20, cursor: "pointer", transform: hov ? "translateY(-1px)" : "none", transition: "all 0.18s" }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AppImage src={order.restaurant?.image_url} fallback={order.restaurant?.emoji || "🍽️"} width={48} height={48} borderRadius={13} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{order.restaurant?.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{timeAgo(order.placed_at)}</div>
          </div>
        </div>
        <div style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 12 }}>{s.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {order.items?.map(i => i.name).join(", ") || "No items"}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 11, color: C.muted }}> · </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, fontFamily: "'DM Mono',monospace" }}>{fmtPrice(order.total)}</span>
        </div>
        {order.status === "on_the_way" && (
          <div style={{ background: C.accent, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800, color: "#fff" }}>Track →</div>
        )}
        {order.status === "delivered" && !order.rating && (
          <div style={{ background: `${C.success}18`, border: `1px solid ${C.success}44`, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: C.success }}>
            ⭐ Rate order
          </div>
        )}
        {order.status === "delivered" && order.rating && (
          <div style={{ fontSize: 13 }}>{"⭐".repeat(order.rating)}</div>
        )}
      </div>
    </div>
  );
}

// ─── Order Detail with Rating ─────────────────────────────────────────────────
function OrderDetail({ order, onBack, go, onRated }) {
  const { user } = useAuth();
  const s = STATUS[order.status] || STATUS.pending;

  const [rating,    setRating]    = useState(order.rating || 0);
  const [comment,   setComment]   = useState(order.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(!!order.rating);
  const [toast,      setToast]      = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function submitRating() {
    if (!rating) return showToast("Please select a star rating", "error");
    setSubmitting(true);

    // Insert review into reviews table
    const { error: reviewError } = await supabase
      .from("reviews")
      .upsert({
        order_id:      order.id,
        user_id:       user.id,
        restaurant_id: order.restaurant_id,
        rating,
        comment: comment.trim() || null,
      }, { onConflict: "order_id" });

    if (reviewError) {
      setSubmitting(false);
      return showToast(reviewError.message || "Failed to submit review", "error");
    }

    // Update restaurant's average rating
    await supabase.rpc("update_restaurant_rating", { p_restaurant_id: order.restaurant_id });

    setSubmitting(false);
    setSubmitted(true);
    showToast("Review submitted! Thank you 🔥", "success");
    if (onRated) onRated(order.id, rating);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.type === "error" ? C.error : C.success, color: "#fff", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>←</button>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>Order Details</span>
      </div>

      {/* Status */}
      <div style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 32 }}>{s.icon}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.label}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{timeAgo(order.placed_at)}</div>
        </div>
        {order.status === "on_the_way" && (
          <button onClick={() => go("tracking")}
            style={{ marginLeft: "auto", background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            Track Live →
          </button>
        )}
      </div>

      {/* Restaurant */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>RESTAURANT</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AppImage src={order.restaurant?.image_url} fallback={order.restaurant?.emoji || "🍽️"} width={48} height={48} borderRadius={12} />
          <div style={{ fontWeight: 800, fontSize: 16 }}>{order.restaurant?.name}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>ITEMS ORDERED</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AppImage src={item.image_url} fallback={item.emoji || "🍽️"} width={44} height={44} borderRadius={10} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>x{item.qty}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: C.accent }}>
                {fmtPrice(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>PRICE BREAKDOWN</div>
        {[
          ["Subtotal",     fmtPrice(order.subtotal)],
          ["Delivery Fee", fmtPrice(order.delivery_fee)],
          ["Tax",          fmtPrice(order.tax)],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: C.muted }}>
            <span>{label}</span><span style={{ color: C.text }}>{val}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
          <span>Total</span>
          <span style={{ color: C.accent, fontFamily: "'DM Mono',monospace" }}>{fmtPrice(order.total)}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>DELIVERY ADDRESS</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <span style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{order.delivery_address || "Not specified"}</span>
        </div>
      </div>

      {/* ── RATING SECTION — only for delivered orders ──────────────────── */}
      {order.status === "delivered" && (
        <div style={{ background: C.surface, border: `1px solid ${submitted ? C.success : C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.success, marginBottom: 6 }}>Thanks for your review!</div>
              <StarRating value={rating} readonly />
              {comment && <div style={{ fontSize: 13, color: C.muted, marginTop: 10, fontStyle: "italic" }}>"{comment}"</div>}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Rate your order</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>How was your experience with {order.restaurant?.name}?</div>

              <div style={{ marginBottom: 16 }}>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                    {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                  </div>
                )}
              </div>

              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us about your experience (optional)..."
                style={{ width: "100%", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontFamily: "'Syne',sans-serif", fontSize: 13, outline: "none", resize: "none", height: 80, marginBottom: 14 }}
              />

              <button onClick={submitRating} disabled={submitting || !rating}
                style={{ width: "100%", background: rating ? C.accent : C.card, color: rating ? "#fff" : C.muted, border: "none", padding: "13px", borderRadius: 11, fontSize: 15, fontWeight: 800, cursor: rating ? "pointer" : "not-allowed", fontFamily: "'Syne',sans-serif", transition: "all 0.15s" }}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.status === "delivered" && (
          <button onClick={() => go("restaurants")}
            style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            🔄 Reorder from {order.restaurant?.name}
          </button>
        )}
        <button onClick={onBack}
          style={{ width: "100%", background: C.surface, color: C.muted, border: `1px solid ${C.border}`, padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
          Back to Orders
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ORDERS PAGE ─────────────────────────────────────────────────────────
export default function Orders({ go }) {
  const { user }  = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      const { orders: data, error } = await getOrderHistory(user.id);
      setOrders(error ? [] : (data || []));
      setLoading(false);
    }
    load();
  }, [user?.id]);

  // Called after rating submitted — update order in list
  function handleRated(orderId, rating) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rating } : o));
    if (selected?.id === orderId) setSelected(prev => ({ ...prev, rating }));
  }

  if (selected) {
    return (
      <div style={{ fontFamily: "'Syne',sans-serif", color: C.text }}>
        <OrderDetail order={selected} onBack={() => setSelected(null)} go={go} onRated={handleRated} />
      </div>
    );
  }

  const FILTERS = [
    { key: "all",       label: "All" },
    { key: "active",    label: "Active" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const filtered = orders.filter(o => {
    if (filter === "active")    return ["pending","confirmed","preparing","on_the_way"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const activeOrders = orders.filter(o =>
    ["pending","confirmed","preparing","on_the_way"].includes(o.status)
  );

  const unratedDelivered = orders.filter(o => o.status === "delivered" && !o.rating);

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <div style={{ padding: "28px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>My Orders</h1>
        <div style={{ fontSize: 12, color: C.muted }}>
          {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""}` : "No orders yet"}
        </div>
      </div>

      {/* Active order alert */}
      {activeOrders.length > 0 && (
        <div onClick={() => setSelected(activeOrders[0])}
          style={{ background: C.accent, borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", margin: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🛵</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                {activeOrders.length} active order{activeOrders.length > 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 11, color: "#ffffff99" }}>{activeOrders[0].restaurant?.name}</div>
            </div>
          </div>
          <div style={{ background: "#fff2", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>View →</div>
        </div>
      )}

      {/* Rate prompt */}
      {unratedDelivered.length > 0 && (
        <div onClick={() => setSelected(unratedDelivered[0])}
          style={{ background: `${C.success}12`, border: `1px solid ${C.success}44`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.success }}>Rate your last order</div>
            <div style={{ fontSize: 12, color: C.muted }}>How was {unratedDelivered[0].restaurant?.name}?</div>
          </div>
          <span style={{ fontSize: 14, color: C.success }}>→</span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, padding: "10px 0 18px", overflowX: "auto" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ background: filter === f.key ? `${C.accent}18` : "transparent", border: `1.5px solid ${filter === f.key ? C.accent : C.border}`, borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, color: filter === f.key ? C.accent : C.muted, cursor: "pointer", fontFamily: "'Syne',sans-serif", whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {f.label}
            {f.key === "active" && activeOrders.length > 0 && (
              <span style={{ marginLeft: 6, background: C.accent, color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>
                {activeOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 140, background: C.surface, borderRadius: 18, animation: "pulse 1.5s infinite" }} />)}
        </div>

      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛵</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>No orders yet</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
            Your order history will appear here once you place your first order.
          </div>
          <button onClick={() => go("restaurants")}
            style={{ background: C.accent, color: "#fff", border: "none", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            Browse Restaurants 🔥
          </button>
        </div>

      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No {filter} orders</div>
          <div style={{ fontSize: 14, color: C.muted }}>
            {filter === "active" ? "No active orders right now" : `No ${filter} orders found`}
          </div>
        </div>

      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}
    </div>
  );
}