// src/pages/Landing.jsx
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { getFeaturedRestaurants } from "../services/restaurantService";
import RestaurantCard from "../components/RestaurantCard";

export default function Landing({ go }) {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const { featured } = await getFeaturedRestaurants();
      setFeatured(featured);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 0 52px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.accentDim, border: `1px solid ${C.accentBorder}`,
          borderRadius: 100, padding: "6px 16px", fontSize: 11, color: C.accent,
          fontWeight: 700, letterSpacing: 2, marginBottom: 28,
          fontFamily: "'DM Mono', monospace",
        }}>
          🔥 FAST DELIVERY · YOUR CITY
        </div>

        <h1 style={{ fontSize: "clamp(52px, 9vw, 96px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-3px", marginBottom: 22, color: C.text }}>
          Food That<br /><span style={{ color: C.accent }}>Hits Different</span>
        </h1>

        <p style={{ color: C.muted, fontSize: 18, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.65 }}>
          Order from the best restaurants in your city — fresh, fast, delivered to your door.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => go("register")}
            style={{ background: C.accent, color: "#fff", border: "none", padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Get Started →
          </button>
          <button onClick={() => go("login")}
            style={{ background: "transparent", border: `1.5px solid ${C.border}`, color: C.muted, padding: "16px 28px", borderRadius: 12, fontSize: 15, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
            I have an account
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 64 }}>
        {[
          ["⚡", "25 min avg", "Delivery time"],
          ["⭐", "4.7 avg",    "Restaurant rating"],
          ["🍽️", "Growing",   "Restaurants"],
        ].map(([ic, val, lbl]) => (
          <div key={lbl} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{ic}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text }}>{val}</div>
            <div style={{ color: C.muted, fontSize: 12 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Featured restaurants */}
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 20, color: C.text }}>
        🏙️ Featured Restaurants
      </h2>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginBottom: 64 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 20, height: 180, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : featured.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginBottom: 64 }}>
          {featured.map(r => (
            <RestaurantCard key={r.id} r={r} onEnter={() => go("register")} />
          ))}
        </div>
      ) : (
        // Fallback if no featured restaurants set yet
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginBottom: 64 }}>
          {["🔥 BBQ & Burgers", "🌸 Japanese", "🍝 Italian", "🌶️ Indian"].map(name => (
            <div key={name} onClick={() => go("register")} className="card"
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{name.split(" ")[0]}</div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{name.slice(3)}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Sign up to explore →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}