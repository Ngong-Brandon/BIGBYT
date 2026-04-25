// src/pages/Home.jsx
// ─── Authenticated home — 100% data from Supabase ────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { getRestaurants, getPopularItems } from "../services/restaurantService";
import { getOrderHistory } from "../services/orderService";
import { getActiveAdverts } from "../services/advertisementService";
import AppImage from "../components/AppImage";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({ title, cta, onCta }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</span>
      {cta && <span onClick={onCta} style={{ fontSize: 12, color: C.accent, fontWeight: 700, cursor: "pointer" }}>{cta} →</span>}
    </div>
  );
}

function Skeleton({ w = "100%", h = 100, radius = 14 }) {
  return <div style={{ width: w, height: h, background: C.surface, borderRadius: radius, animation: "pulse 1.5s infinite", flexShrink: 0 }} />;
}

// ── Restaurant mini card ───────────────────────────────────────────────────────
function RestaurantMini({ r, onEnter }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onEnter}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "#181818", border: `1px solid ${hov ? "#FF450055" : C.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", flex: "1 1 calc(50% - 6px)", minWidth: 150, transform: hov ? "translateY(-2px)" : "none", transition: "all 0.18s" }}>
      <div style={{ width: "100%", height: 90, overflow: "hidden" }}>
        <AppImage src={r.image_url} fallback={r.emoji || "🍽️"} width="100%" height={90} borderRadius={0} style={{ width: "100%", height: 90, objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{r.cuisine_tags?.slice(0, 2).join(" · ")}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          <span>⏱ {r.delivery_time || "25–35m"}</span>
          <span style={{ color: "#F5A623", fontWeight: 700 }}>⭐ {r.rating || "New"}</span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home({ go, setActiveRestaurant, activeOrder, showToast }) {
  const { user, profile }            = useAuth();
  const { unreadCount, clearUnread } = useNotifications();

  const [allRestaurants,    setAllRestaurants]    = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [recentOrders,      setRecentOrders]      = useState([]);
  const [popularItems,      setPopularItems]      = useState([]);
  const [adverts,           setAdverts]           = useState([]);
  const [categories,        setCategories]        = useState([{ label: "All", emoji: "" }]);
  const [activeCat,         setActiveCat]         = useState("All");
  const [totalOrders,       setTotalOrders]       = useState(0);
  const [avgRating,         setAvgRating]         = useState(null);
  const [loading,           setLoading]           = useState(true);

  const name             = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0].slice(0,5)+"..." || "there";

  
  const userNeighborhood = profile?.neighborhood || import.meta.env.VITE_DEFAULT_NEIGHBORHOOD || "Molyko";
  const userCity         = profile?.city         || import.meta.env.VITE_DEFAULT_CITY         || "Buea";
  console.log(import.meta.env.VITE_DEFAULT_CITY);
  
  

  const EMOJI_MAP = {
    burgers:"🍔", sushi:"🍣", pizza:"🍕", indian:"🍛", healthy:"🥗",
    noodles:"🍜", bbq:"🥩", italian:"🍝", japanese:"🌸", chinese:"🥡",
    mexican:"🌮", seafood:"🦞", chicken:"🍗", pasta:"🍝", salads:"🥗",
  };

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      setLoading(true);
      const [
        { restaurants },
        { orders },
        { items: popular },
        { adverts: liveAdverts },
      ] = await Promise.all([
        getRestaurants(),
        getOrderHistory(user.id),
        getPopularItems(),
        getActiveAdverts(),
      ]);

      // ── Restaurants ──────────────────────────────────────────────────────
      const all = restaurants || [];
      setAllRestaurants(all);

      const nearby = all.filter(r =>
        r.is_open && r.neighborhood?.toLowerCase() === userNeighborhood?.toLowerCase()
      );
      setNearbyRestaurants(
        nearby.length > 0 ? nearby.slice(0, 4) : all.filter(r => r.is_open).slice(0, 4)
      );

      // ── Categories from real cuisine_tags ────────────────────────────────
      const tagSet = new Set();
      all.forEach(r => r.cuisine_tags?.forEach(t => tagSet.add(t)));
      setCategories([
        { label: "All", emoji: "" },
        ...Array.from(tagSet).slice(0, 8).map(tag => ({
          label: tag,
          emoji: EMOJI_MAP[tag.toLowerCase()] || "🍽️",
        })),
      ]);

      // ── Orders ───────────────────────────────────────────────────────────
      const orderList = orders || [];
      setRecentOrders(orderList.slice(0, 2));
      setTotalOrders(orderList.length);

      const rated = orderList.filter(o => o.rating);
      if (rated.length > 0) {
        setAvgRating((rated.reduce((s, o) => s + o.rating, 0) / rated.length).toFixed(1));
      }

      // ── Popular items ─────────────────────────────────────────────────────
      setPopularItems((popular || []).slice(0, 6));

      // ── Live adverts ──────────────────────────────────────────────────────
      setAdverts(liveAdverts || []);

      setLoading(false);
    }
    load();
  }, [user?.id]);

  function goToRestaurantById(id) {
    const r = allRestaurants.find(x => x.id === id);
    if (r) { setActiveRestaurant(r); go("restaurant"); }
    else go("restaurants");
  }

  function handleAdvertTap(advert) {
    if (advert.target_restaurant_id) goToRestaurantById(advert.target_restaurant_id);
    else go("restaurants");
  }

  const STATS = [
    { val: totalOrders,                     label: "Orders",     color: C.accent,   onClick: () => go("orders") },
    { val: avgRating || "—",                label: "Avg Rating", color: "#F5A623",  onClick: () => go("orders") },
    { val: nearbyRestaurants.length || "—", label: "Nearby",     color: C.success,  onClick: () => go("restaurants") },
    { val: recentOrders.length || "—",      label: "Recent",     color: C.text,     onClick: () => go("orders") },
  ];

  return (
    <div style={{ fontFamily: "sans-serif", color: C.text, background: C.bg, paddingBottom: 100 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── Greeting + bell ─────────────────────────────────────────────── */}
      <div style={{ padding: "28px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>{getGreeting()} 🔥</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>Hey, {name} 👋</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <span>📍</span>
            <span style={{ fontSize: 13, color: C.muted }}>
              {userNeighborhood} · <span style={{ color: C.accent, fontWeight: 700 }}>{userCity}</span>
            </span>
          </div>
        </div>
        <div onClick={() => { clearUnread(); go("notifications"); }} style={{ position: "relative", cursor: "pointer" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔔</div>
          {unreadCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: C.error, borderRadius: 9, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", padding: "0 3px" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 20px" }}>
        <div onClick={() => go("restaurants")}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 14, color: C.muted }}>Search restaurants, cuisines, dishes...</span>
        </div>
      </div>

      {/* ── Active order banner ─────────────────────────────────────────── */}
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

      {/* ── Promo banners — live from advertisements table ───────────────── */}
      {(loading || adverts.length > 0) && (
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {loading ? (
              [1, 2].map(i => <Skeleton key={i} w={260} h={130} radius={18} />)
            ) : (
              adverts.map(advert => (
                <div key={advert.id} onClick={() => handleAdvertTap(advert)}
                  style={{ background: advert.bg_color, border: `1px solid ${advert.border_color}`, borderRadius: 18, padding: "18px 20px", minWidth: 260, position: "relative", overflow: "hidden", flexShrink: 0, cursor: "pointer" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: advert.accent_color, letterSpacing: 2, marginBottom: 8 }}>PROMOTION</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>{advert.title}</div>
                  {advert.subtitle && <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{advert.subtitle}</div>}
                  <div style={{ background: advert.cta_bg, display: "inline-block", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: advert.cta_text_color }}>
                    {advert.cta_label || "Order Now"}
                  </div>
                  <div style={{ position: "absolute", right: 14, top: 14, fontSize: 44, opacity: 0.15 }}>{advert.icon}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
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

      {/* ── Categories — from real cuisine_tags ──────────────────────────── */}
      <div style={{ padding: "0 20px 20px" }}>
        <SectionHeader title="Browse by Category" />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {loading ? (
            [1,2,3,4,5].map(i => <Skeleton key={i} w={80} h={34} radius={100} />)
          ) : (
            categories.map(cat => (
              <div key={cat.label}
                onClick={() => { setActiveCat(cat.label); go("restaurants"); }}
                style={{ background: activeCat === cat.label ? `${C.accent}18` : "#161616", border: `1px solid ${activeCat === cat.label ? C.accent : C.border}`, borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: activeCat === cat.label ? C.accent : C.muted, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                {cat.emoji} {cat.label}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Near You ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 24px" }}>
        <SectionHeader title="📍 Near You" cta="See all" onCta={() => go("restaurants")} />
        {loading ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[1,2,3,4].map(i => <Skeleton key={i} w="calc(50% - 6px)" h={160} />)}
          </div>
        ) : nearbyRestaurants.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {nearbyRestaurants.filter(Boolean).map(r => (
              <RestaurantMini key={r.id} r={r} onEnter={() => { setActiveRestaurant(r); go("restaurant"); }} />
            ))}
          </div>
        ) : (
          <div onClick={() => go("restaurants")}
            style={{ textAlign: "center", padding: "40px 0", color: C.muted, cursor: "pointer" }}>
            No open restaurants near you · <span style={{ color: C.accent }}>Browse all →</span>
          </div>
        )}
      </div>

      {/* ── Order Again ──────────────────────────────────────────────────── */}
      {(loading || recentOrders.length > 0) && (
        <div style={{ padding: "0 20px 24px" }}>
          <SectionHeader title="🔄 Order Again" cta="History" onCta={() => go("orders")} />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2].map(i => <Skeleton key={i} w="100%" h={72} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentOrders.map(order => (
                <div key={order.id}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#FF450055"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  onClick={() => goToRestaurantById(order.restaurant_id)}>
                  <AppImage src={order.restaurant?.image_url} fallback={order.restaurant?.emoji || "🍽️"} width={44} height={44} borderRadius={12} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.restaurant?.name || "Restaurant"}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""} · ${Number(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); goToRestaurantById(order.restaurant_id); }}
                    style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "ans-serif", flexShrink: 0 }}>
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Popular Right Now — from menu_items is_popular=true ──────────── */}
      {(loading || popularItems.length > 0) && (
        <div style={{ padding: "0 20px 24px" }}>
          <SectionHeader title="🔥 Popular Right Now" cta="See all" onCta={() => go("restaurants")} />
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} w={148} h={180} />)
            ) : (
              popularItems.filter(Boolean).map((item, i) => (
                <div key={item.id || i} onClick={() => goToRestaurantById(item.restaurant_id)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", minWidth: 148, cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#FF450055"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <AppImage src={item.image_url} fallback={item.emoji || "🍽️"} width={148} height={100} borderRadius={0} style={{ width: 148, height: 100, objectFit: "cover" }} />
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name.length > 11 ? `${item.name.substring(0, 11)}...` : item.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.restaurant?.name}</div>
                    <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, fontFamily: "'DM Mono',monospace" }}>{Number(item.price).toFixed(2)}XAF</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* First time empty state */}
      {!loading && nearbyRestaurants.length === 0 && recentOrders.length === 0 && popularItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Let's get started!</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>Browse restaurants and place your first order</div>
          <button onClick={() => go("restaurants")}
            style={{ background: C.accent, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "ans-serif" }}>
            Browse Restaurants 🔥
          </button>
        </div>
      )}
    </div>
  );
}