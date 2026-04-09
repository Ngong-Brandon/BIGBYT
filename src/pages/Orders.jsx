// src/pages/Orders.jsx
// ─── Real orders only — no mock data ─────────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { getOrderHistory } from "../services/orderService";
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

// ─── Order card ───────────────────────────────────────────────────────────────
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
          {/* Restaurant image or emoji */}
          <AppImage
            src={order.restaurant?.image_url}
            fallback={order.restaurant?.emoji || "🍽️"}
            width={48} height={48}
            borderRadius={13}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{order.restaurant?.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>
              {timeAgo(order.placed_at)}
            </div>
          </div>
        </div>
        <div style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 12 }}>{s.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
        </div>
      </div>

      {/* Items preview */}
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {order.items?.map(i => i.name).join(", ") || "No items"}
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 11, color: C.muted }}> · </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, fontFamily: "'DM Mono',monospace" }}>{fmtPrice(order.total)}</span>
        </div>
        {order.status === "on_the_way" && (
          <div style={{ background: C.accent, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800, color: "#fff" }}>Track →</div>
        )}
      </div>
    </div>
  );
}

// ─── Order detail ─────────────────────────────────────────────────────────────
function OrderDetail({ order, onBack, go }) {
  const s = STATUS[order.status] || STATUS.pending;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>
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

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.status === "delivered" && (
          <button onClick={() => go("restaurants")}
            style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            🔄 Reorder from {order.restaurant?.name}
          </button>
        )}
        <button onClick={() => go("home")}
          style={{ width: "100%", background: C.surface, color: C.muted, border: `1px solid ${C.border}`, padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ORDERS PAGE ─────────────────────────────────────────────────────────
export default function Orders({ go }) {
  const { user }  = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      const { orders: data, error } = await getOrderHistory(user.id);
      // Real orders only — no mock fallback
      setOrders(error ? [] : (data || []));
      setLoading(false);
    }
    load();
  }, [user?.id]);

  if (selected) {
    return (
      <div style={{ fontFamily: "'Syne',sans-serif", color: C.text }}>
        <OrderDetail order={selected} onBack={() => setSelected(null)} go={go} />
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

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
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
          <div style={{ background: "#fff2", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Track →</div>
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
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 140, background: C.surface, borderRadius: 18, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>

      /* Empty state — no orders at all */
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

      /* Empty state for filter */
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No {filter} orders</div>
          <div style={{ fontSize: 14, color: C.muted }}>
            {filter === "active" ? "You have no active orders right now" : `You have no ${filter} orders`}
          </div>
        </div>

      /* Orders list */
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