// src/pages/RestaurantMenu.jsx
// ─── Pulls live menu from Supabase for the selected restaurant ────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { getMenu } from "../services/restaurantService";
import { useCart } from "../context/CartContext";

export default function RestaurantMenu({ restaurant, go }) {
  const { addToCart, removeFromCart, getItemInCart, cartCount, cartSubtotal } = useCart();

  const [menu, setMenu]       = useState([]);   // [{ id, name, items: [] }]
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [menuCat,    setMenuCat]    = useState("All");
  const [dishSearch, setDishSearch] = useState("");

  // ── Load menu from Supabase ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setMenuCat("All");
      const { menu, error } = await getMenu(restaurant.id);
      if (error) {
        setError("Could not load menu. Please try again.");
        console.error(error);
      } else {
        setMenu(menu);
      }
      setLoading(false);
    }
    load();
  }, [restaurant.id]);

  // ── Build flat item list filtered by selected category ─────────────────────
  const allItems   = menu.flatMap(cat => cat.items.map(item => ({ ...item, catName: cat.name })));
  const categories = ["All", ...menu.map(c => c.name)];
  const filtered   = allItems.filter(item => {
    const matchesCat    = menuCat === "All" || item.catName === menuCat;
    const matchesSearch = !dishSearch.trim() ||
      item.name?.toLowerCase().includes(dishSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(dishSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "0 20px 60px" }}>
        <div style={{ background: C.surface, borderRadius: "0 0 24px 24px", padding: "32px 28px", marginBottom: 32, border: `1px solid ${C.border}`, borderTop: "none" }}>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ width: 72, height: 72, background: C.card, borderRadius: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: 200, height: 28, background: C.card, borderRadius: 8, marginBottom: 10 }} />
              <div style={{ width: 140, height: 16, background: C.card, borderRadius: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 20, height: 220, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: C.muted }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>{error}</div>
        <button onClick={() => go("restaurants")}
          style={{ background: C.accent, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, marginTop: 12 }}>
          ← Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto", padding: "0 20px 80px" }}>

      {/* Restaurant hero banner */}
      <div style={{ background: C.surface, borderRadius: "0 0 24px 24px", padding: "32px 28px 28px", marginBottom: 32, border: `1px solid ${C.border}`, borderTop: "none" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Logo or emoji */}
          <div style={{ width: 72, height: 72, background: C.card, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, border: `1px solid ${C.border}`, flexShrink: 0, overflow: "hidden" }}>
            {restaurant.logo_url
              ? <img src={restaurant.logo_url} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : restaurant.emoji || "🍽️"
            }
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", color: C.text }}>{restaurant.name}</h1>
              {!restaurant.is_open && (
                <span style={{ background: C.errorDim, color: C.error, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>CLOSED</span>
              )}
              {restaurant.is_featured && (
                <span style={{ background: C.accentDim, color: C.accent, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>FEATURED</span>
              )}
            </div>

            {restaurant.description && (
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{restaurant.description}</p>
            )}

            <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
              {restaurant.cuisine_tags?.join(" · ")} · {restaurant.neighborhood}
            </p>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                ["⭐", restaurant.rating ? `${Number(restaurant.rating).toFixed(1)} (${restaurant.review_count || 0} reviews)` : "New restaurant"],
                ["⏱", restaurant.delivery_time || "25-35 min"],
                ["🛵", restaurant.delivery_fee != null ? `$${Math.round(Number(restaurant.delivery_fee)).toLocaleString("fr-FR")} XAF delivery` : "Free delivery"],
                ["📦", restaurant.min_order != null ? `$${Math.round(Number(restaurant.min_order)).toLocaleString("fr-FR")} XAF min order` : "No minimum"],
              ].map(([ic, val]) => (
                <div key={ic} style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ic} {val}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty menu state */}
      {menu.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No menu items yet</div>
          <div style={{ fontSize: 13 }}>This restaurant hasn't added their menu yet.</div>
        </div>
      )}

      {/* Dish search bar */}
      {menu.length > 0 && (
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.muted }}>🔍</span>
          <input
            value={dishSearch}
            onChange={e => setDishSearch(e.target.value)}
            placeholder={`Search dishes in ${restaurant.name}...`}
            style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 40px 12px 42px", color: C.text, fontFamily: "'Syne', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          {dishSearch && (
            <span onClick={() => setDishSearch("")}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, fontSize: 18 }}>
              ×
            </span>
          )}
        </div>
      )}

      {/* Category tabs */}
      {menu.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setMenuCat(cat)} style={{
                background: menuCat === cat ? C.accent : C.surface,
                color: menuCat === cat ? "#fff" : C.muted,
                border: `1.5px solid ${menuCat === cat ? C.accent : C.border}`,
                borderRadius: 100, padding: "8px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* No search results */}
          {dishSearch && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No dishes found</div>
              <div style={{ fontSize: 13 }}>Try a different keyword</div>
            </div>
          )}

          {/* Menu grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18 }}>
            {filtered.map(item => {
              const inCart = getItemInCart(restaurant.id, item.id);
              return (
                <div key={item.id} className="card" style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
                  padding: 22, display: "flex", flexDirection: "column", gap: 10,
                  opacity: restaurant.is_open ? 1 : 0.5,
                }}>
                  {/* Image or emoji */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} />
                      : <span style={{ fontSize: 42 }}>{item.emoji || "🍽️"}</span>
                    }
                    {item.is_popular && (
                      <span style={{ background: C.goldDim, color: C.gold, border: `1px solid ${C.gold}44`, borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                        POPULAR
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: C.text }}>{item.name}</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{item.description}</div>
                    {item.allergens?.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>
                        ⚠️ {item.allergens.join(", ")}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span style={{ color: C.accent, fontWeight: 800, fontSize: 20, fontFamily: "'DM Mono',monospace" }}>
                      ${Math.round(Number(item.price)).toLocaleString("fr-FR")} XAF
                    </span>

                    {restaurant.is_open ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {inCart && (
                          <>
                            <button onClick={() => removeFromCart(inCart._key)}
                              style={{ width: 30, height: 30, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 16 }}>
                              −
                            </button>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, minWidth: 16, textAlign: "center", color: C.text }}>
                              {inCart.qty}
                            </span>
                          </>
                        )}
                        <button onClick={() => addToCart(item, restaurant)}
                          style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 16 }}>
                          +
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: C.error, fontSize: 12, fontWeight: 700 }}>Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div onClick={() => go("cart")} style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.accent, color: "#fff", padding: "15px 30px", borderRadius: 16,
          fontWeight: 800, fontSize: 15, cursor: "pointer",
          boxShadow: `0 8px 32px ${C.accent}55`, zIndex: 200,
          display: "flex", gap: 14, alignItems: "center", whiteSpace: "nowrap",
        }}>
          <span>🛒 View Cart ({cartCount})</span>
          <span style={{ background: "#fff3", borderRadius: 8, padding: "3px 12px", fontFamily: "'DM Mono',monospace" }}>
            ${Math.round(cartSubtotal.toFixed(2)).toLocaleString("fr-FR")} XAF
          </span>
        </div>
      )}
    </div>
  );
}