// src/pages/Home.jsx
// ─── Authenticated home screen — all buttons fully wired ─────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { getRestaurants } from "../services/restaurantService";
import { getOrderHistory } from "../services/orderService";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CATEGORIES = [
  { label: "All",     emoji: "" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Sushi",   emoji: "🍣" },
  { label: "Pizza",   emoji: "🍕" },
  { label: "Indian",  emoji: "🍛" },
  { label: "Healthy", emoji: "🥗" },
  { label: "Noodles", emoji: "🍜" },
  { label: "BBQ",     emoji: "🥩" },
];

const POPULAR_ITEMS = [
  { name: "BBQ Ribs Half Rack", restaurant: "Flames & Smoke",  emoji: "🥩", price: 22.99 },
  { name: "Dragon Roll",        restaurant: "Sakura Express",  emoji: "🐉", price: 16.99 },
  { name: "Cacio e Pepe",       restaurant: "Nonna's Kitchen", emoji: "🍝", price: 15.99 },
  { name: "Butter Chicken",     restaurant: "Spice Route",     emoji: "🍛", price: 16.99 },
  { name: "Smash Burger Stack", restaurant: "Flames & Smoke",  emoji: "🍔", price: 14.99 },
];

const PROMOS = [
  { label: "LIMITED TIME",   title: "30% OFF",         sub: "First order from Sakura Express", cta: "Claim Deal",   bg: "#1A0800", border: "#FF450033", ctaBg: "#FF4500", ctaColor: "#fff",    accent: "#FF4500", icon: "🌸", target: "Sakura Express" },
  { label: "FREE DELIVERY",  title: "Orders over $20", sub: "All restaurants this weekend",    cta: "Order Now",    bg: "#0A1200", border: "#00C48C33", ctaBg: "#00C48C", ctaColor: "#fff",    accent: "#00C48C", icon: "🛵", target: null },
  { label: "NEW RESTAURANT", title: "Nonna's Kitchen", sub: "Authentic Italian · Now open",    cta: "Explore Menu", bg: "#0A0A1A", border: "#F5A62333", ctaBg: "#F5A623", ctaColor: "#412402", accent: "#F5A623", icon: "🍝", target: "Nonna's Kitchen" },
];

function SectionHeader({ title, cta, onCta }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</span>
      {cta && <span onClick={onCta} style={{ fontSize: 12, color: C.accent, fontWeight: 700, cursor: "pointer" }}>{cta} →</span>}
    </div>
  );
}

function RestaurantMini({ r, onEnter }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onEnter}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#181818", border: `1px solid ${hovered ? "#FF450055" : C.border}`, borderRadius: 16, padding: 16, cursor: "pointer", flex: "1 1 calc(50% - 6px)", minWidth: 140, transform: hovered ? "translateY(-2px)" : "none", transition: "all 0.18s" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{r.emoji || "🍽️"}</div>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, color: C.text }}>{r.name}</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{r.cuisine_tags?.join(" · ")}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <span>⏱ {r.delivery_time}</span>
        <span style={{ color: "#F5A623", fontWeight: 700 }}>⭐ {r.rating}</span>
      </div>
    </div>
  );
}

export default function Home({ go, setActiveRestaurant, activeOrder, showToast }) {
  const { user, profile } = useAuth();

  const [allRestaurants, setAllRestaurants]     = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [recentOrders, setRecentOrders]         = useState([]);
  const [activeCat, setActiveCat]               = useState("All");
  const [loading, setLoading]                   = useState(true);
  const [notifCount, setNotifCount]             = useState(3);

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    async function load() {
      const [{ restaurants }, { orders }] = await Promise.all([
        getRestaurants(),
        user?.id ? getOrderHistory(user.id) : Promise.resolve({ orders: [] }),
      ]);
      const all  = restaurants || [];
      const open = all.filter(r => r.is_open);
      setAllRestaurants(all);
      setNearbyRestaurants(open.slice(0, 4));
      setRecentOrders((orders || []).slice(0, 2));
      setLoading(false);
    }
    load();
  }, [user?.id]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  function goToRestaurant(name) {
    const r = allRestaurants.find(x => x.name === name);
    if (r) { setActiveRestaurant(r); go("restaurant"); }
    else go("restaurants");
  }

  const STATS = [
    { val: recentOrders.length || 0, label: "Orders",     color: C.accent,  onClick: () => go("orders") },
    { val: "$0",                      label: "Saved",      color: C.success, onClick: () => showToast?.("Savings coming soon 🔥", "info") },
    { val: "4.8",                     label: "Avg Rating", color: "#F5A623", onClick: () => go("orders") },
    { val: "3",                       label: "Faves",      color: C.text,    onClick: () => go("restaurants") },
  ];

  return (
    <div style={{ fontFamily: " sans-serif", color: C.text, background: C.bg, paddingBottom: 100 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── Greeting + bell ─────────────────────────────────────────────── */}
      <div style={{ padding: "28px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{getGreeting()} 🔥</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>Hey, {name} 👋</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <span>📍</span>
            <span style={{ fontSize: 13, color: C.muted }}>Lekki Phase 1 · <span style={{ color: C.accent, fontWeight: 700 }}>Lagos</span></span>
          </div>
        </div>
        {/* 🔔 Bell → clears notification count */}
        <div onClick={() => { setNotifCount(0); go("notifications"); }} style={{ position: "relative", cursor: "pointer" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔔</div>
          {notifCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: C.error, borderRadius: "50%", border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{notifCount}</div>
          )}
        </div>
      </div>

      {/* ── Search → goes to restaurants ───────────────────────────────── */}
      <div style={{ padding: "0 20px 20px" }}>
        <div onClick={() => go("restaurants")}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 14, color: C.muted }}>Search restaurants, cuisines, dishes...</span>
        </div>
      </div>

      {/* ── Active order banner → goes to tracking ──────────────────────── */}
      {activeOrder && (
        <div style={{ padding: "0 20px 20px" }}>
          <div onClick={() => go("tracking")}
            style={{ background: C.accent, borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, background: "#fff2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛵</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Order on the way!</div>
                <div style={{ fontSize: 11, color: "#ffffff99", marginTop: 2 }}>{activeOrder.restaurantName} · ETA {activeOrder.eta}</div>
              </div>
            </div>
            <div style={{ background: "#fff2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Track →</div>
          </div>
        </div>
      )}

      {/* ── Promo banners → go to specific restaurant or restaurants ────── */}
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {PROMOS.map((p, i) => (
            <div key={i} onClick={() => p.target ? goToRestaurant(p.target) : go("restaurants")}
              style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 18, padding: "18px 20px", minWidth: 248, position: "relative", overflow: "hidden", flexShrink: 0, cursor: "pointer" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: p.accent, letterSpacing: 2, marginBottom: 8 }}>{p.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{p.sub}</div>
              <div style={{ background: p.ctaBg, display: "inline-block", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: p.ctaColor }}>{p.cta}</div>
              <div style={{ position: "absolute", right: 14, top: 14, fontSize: 44, opacity: 0.15 }}>{p.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat cards → each goes to a different screen ────────────────── */}
      <div style={{ padding: "0 20px 24px", display: "flex", gap: 10 }}>
        {STATS.map(({ val, label, color, onClick }) => (
          <div key={label} onClick={onClick}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 8px", flex: 1, textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#FF450055"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Category pills → go to restaurants (filter applied later) ────── */}
      <div style={{ padding: "0 20px 20px" }}>
        <SectionHeader title="Browse by Category" />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.label}
              onClick={() => { setActiveCat(cat.label); go("restaurants"); }}
              style={{ background: activeCat === cat.label ? `${C.accent}18` : "#161616", border: `1px solid ${activeCat === cat.label ? C.accent : C.border}`, borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: activeCat === cat.label ? C.accent : C.muted, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
              {cat.emoji} {cat.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Nearby restaurants → card goes to restaurant menu ────────────── */}
      <div style={{ padding: "0 20px 24px" }}>
        <SectionHeader title="📍 Near You" cta="See all" onCta={() => go("restaurants")} />
        {loading ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: "1 1 calc(50% - 6px)", height: 140, background: C.surface, borderRadius: 16, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : nearbyRestaurants.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {nearbyRestaurants.map(r => (
              <RestaurantMini key={r.id} r={r} onEnter={() => { setActiveRestaurant(r); go("restaurant"); }} />
            ))}
          </div>
        ) : (
          <div onClick={() => go("restaurants")} style={{ textAlign: "center", padding: "40px 0", color: C.muted, cursor: "pointer" }}>
            No open restaurants · <span style={{ color: C.accent }}>Browse all →</span>
          </div>
        )}
      </div>

      {/* ── Reorder → Reorder button goes to that restaurant ────────────── */}
      {recentOrders.length > 0 && (
        <div style={{ padding: "0 20px 24px" }}>
          <SectionHeader title="🔄 Order Again" cta="History" onCta={() => go("orders")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentOrders.map(order => (
              <div key={order.id}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#FF450055"}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                onClick={() => { const r = allRestaurants.find(x => x.id === order.restaurant_id); if (r) { setActiveRestaurant(r); go("restaurant"); } else go("restaurants"); }}>
                <div style={{ width: 44, height: 44, background: C.card, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {order.restaurant?.emoji || "🍽️"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{order.restaurant?.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · ${Number(order.total).toFixed(2)}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); const r = allRestaurants.find(x => x.id === order.restaurant_id); if (r) { setActiveRestaurant(r); go("restaurant"); } else go("restaurants"); }}
                  style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Popular items → goes to that item's restaurant ───────────────── */}
      <div style={{ padding: "0 20px 24px" }}>
        <SectionHeader title="🔥 Popular Right Now" cta="See all" onCta={() => go("restaurants")} />
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {POPULAR_ITEMS.map((item, i) => (
            <div key={i} onClick={() => goToRestaurant(item.restaurant)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, minWidth: 148, cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#FF450055"}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: C.text }}>{item.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{item.restaurant}</div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 15, fontFamily: "'DM Mono', monospace" }}>${item.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}