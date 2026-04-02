// src/pages/Orders.jsx
// ─── Order history + order detail screen ─────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { getOrderHistory, getOrder } from "../services/orderService";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: "Pending",    color: "#F5A623", bg: "#F5A62318", icon: "⏳" },
  confirmed:  { label: "Confirmed",  color: "#378ADD", bg: "#378ADD18", icon: "✅" },
  preparing:  { label: "Preparing",  color: "#F5A623", bg: "#F5A62318", icon: "👨‍🍳" },
  on_the_way: { label: "On the Way", color: C.accent,  bg: `${C.accent}18`, icon: "🛵" },
  delivered:  { label: "Delivered",  color: C.success, bg: `${C.success}18`, icon: "🏠" },
  cancelled:  { label: "Cancelled",  color: C.error,   bg: `${C.error}18`,   icon: "✕" },
};

// ─── Mock orders for when Supabase has no data yet ───────────────────────────
const MOCK_ORDERS = [
  {
    id: "mock-1",
    placed_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: "on_the_way",
    total: 32.47,
    restaurant: { name: "Flames & Smoke", emoji: "🔥" },
    items: [
      { name: "Smash Burger Stack", qty: 1, price: 14.99 },
      { name: "Truffle Fries",      qty: 1, price: 7.99  },
      { name: "Craft Lemonade",     qty: 2, price: 4.49  },
    ],
    delivery_address: "12 Admiralty Way, Lekki Phase 1",
    subtotal: 31.96, delivery_fee: 1.99, tax: 2.56,
  },
  {
    id: "mock-2",
    placed_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: "delivered",
    total: 28.97,
    restaurant: { name: "Sakura Express", emoji: "🌸" },
    items: [
      { name: "Salmon Nigiri (6pc)", qty: 1, price: 13.99 },
      { name: "Dragon Roll",         qty: 1, price: 16.99 },
    ],
    delivery_address: "12 Admiralty Way, Lekki Phase 1",
    subtotal: 30.98, delivery_fee: 2.49, tax: 2.48,
  },
  {
    id: "mock-3",
    placed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: "delivered",
    total: 45.96,
    restaurant: { name: "Spice Route", emoji: "🌶️" },
    items: [
      { name: "Butter Chicken",  qty: 2, price: 16.99 },
      { name: "Garlic Naan",     qty: 2, price: 5.99  },
    ],
    delivery_address: "12 Admiralty Way, Lekki Phase 1",
    subtotal: 47.96, delivery_fee: 2.49, tax: 3.84,
  },
  {
    id: "mock-4",
    placed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: "cancelled",
    total: 22.99,
    restaurant: { name: "The Burger Lab", emoji: "🧪" },
    items: [
      { name: "Black Truffle Burger", qty: 1, price: 19.99 },
    ],
    delivery_address: "12 Admiralty Way, Lekki Phase 1",
    subtotal: 19.99, delivery_fee: 1.99, tax: 1.60,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(mins / 60);
  const days  = Math.floor(hrs / 24);
  if (mins < 60)  return `${mins} min ago`;
  if (hrs < 24)   return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  if (days < 7)   return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtPrice(n) { return `$${Number(n || 0).toFixed(2)}`; }

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const [hovered, setHovered] = useState(false);
  const s = STATUS[order.status] || STATUS.pending;
  const itemNames = order.items?.map(i => i.name).join(", ") || "";

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: C.surface, border: `1px solid ${hovered ? "#FF450055" : C.border}`, borderRadius: 18, padding: 20, cursor: "pointer", transform: hovered ? "translateY(-1px)" : "none", transition: "all 0.18s" }}>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {order.restaurant?.emoji || "🍽️"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{order.restaurant?.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
              {timeAgo(order.placed_at)}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 12 }}>{s.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
        </div>
      </div>

      {/* Items preview */}
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {itemNames}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div>
          <span style={{ fontSize: 11, color: C.muted }}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 11, color: C.muted }}> · </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{fmtPrice(order.total)}</span>
        </div>

        {order.status === "on_the_way" && (
          <div style={{ background: C.accent, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800, color: "#fff" }}>
            Track →
          </div>
        )}
        {order.status === "delivered" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: C.muted }}>
            View Details →
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Detail Screen ──────────────────────────────────────────────────────
function OrderDetail({ order, onBack, go }) {
  const s = STATUS[order.status] || STATUS.pending;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>

      {/* Back header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>←</button>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>Order Details</span>
      </div>

      {/* Status banner */}
      <div style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 32 }}>{s.icon}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: s.color }}>{s.label}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{timeAgo(order.placed_at)}</div>
        </div>
        {order.status === "on_the_way" && (
          <button onClick={() => go("tracking")}
            style={{ marginLeft: "auto", background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Track Live →
          </button>
        )}
      </div>

      {/* Restaurant */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>RESTAURANT</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: C.card, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {order.restaurant?.emoji || "🍽️"}
          </div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{order.restaurant?.name}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>ITEMS ORDERED</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 24, background: C.card, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.accent }}>
                  {item.qty}x
                </div>
                <span style={{ fontSize: 14, color: C.text }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>
                {fmtPrice(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>PRICE BREAKDOWN</div>
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
          <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>{fmtPrice(order.total)}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>DELIVERED TO</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>📍</span>
          <span style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{order.delivery_address}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.status === "delivered" && (
          <button onClick={() => go("restaurants")}
            style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            🔄 Reorder from {order.restaurant?.name}
          </button>
        )}
        {["pending", "confirmed"].includes(order.status) && (
          <button
            style={{ width: "100%", background: C.errorDim, color: C.error, border: `1px solid ${C.error}44`, padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Cancel Order
          </button>
        )}
        <button onClick={() => go("home")}
          style={{ width: "100%", background: C.surface, color: C.muted, border: `1px solid ${C.border}`, padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ORDERS PAGE ─────────────────────────────────────────────────────────
export default function Orders({ go }) {
  const { user } = useAuth();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter]           = useState("all");

  useEffect(() => {
    async function load() {
      if (!user?.id) { setOrders(MOCK_ORDERS); setLoading(false); return; }
      const { orders: data, error } = await getOrderHistory(user.id);
      if (error || !data?.length) {
        setOrders(MOCK_ORDERS); // fallback to mock if no real orders
      } else {
        setOrders(data);
      }
      setLoading(false);
    }
    load();
  }, [user?.id]);

  // If viewing order detail
  if (selectedOrder) {
    return (
      <div style={{ fontFamily: "'Syne', sans-serif", color: C.text }}>
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} go={go} />
      </div>
    );
  }

  const FILTERS = [
    { key: "all",        label: "All" },
    { key: "active",     label: "Active" },
    { key: "delivered",  label: "Delivered" },
    { key: "cancelled",  label: "Cancelled" },
  ];

  const filtered = orders.filter(o => {
    if (filter === "active")    return ["pending","confirmed","preparing","on_the_way"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const activeOrders = orders.filter(o => ["pending","confirmed","preparing","on_the_way"].includes(o.status));

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", color: C.text, maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>

      {/* Header */}
      <div style={{ padding: "28px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>My Orders</h1>
        <div style={{ fontSize: 12, color: C.muted }}>{orders.length} total order{orders.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Active order alert */}
      {activeOrders.length > 0 && (
        <div onClick={() => setSelectedOrder(activeOrders[0])}
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
            style={{ background: filter === f.key ? `${C.accent}18` : "transparent", border: `1.5px solid ${filter === f.key ? C.accent : C.border}`, borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, color: filter === f.key ? C.accent : C.muted, cursor: "pointer", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 140, background: C.surface, borderRadius: 18, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
            {filter === "all" ? "Place your first order to see it here" : `You have no ${filter} orders`}
          </div>
          <button onClick={() => go("restaurants")}
            style={{ background: C.accent, color: "#fff", border: "none", padding: "13px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Browse Restaurants 🔥
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
}