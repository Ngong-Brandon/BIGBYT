// src/components/RestaurantCard.jsx
import { useState } from "react";
import { C } from "../constants/Colors";
import AppImage from "./AppImage";

export default function RestaurantCard({ restaurant: r, onClick }) {
  const [hov, setHov] = useState(false);
  if (!r) return null;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: C.surface, border: `1px solid ${hov ? "#FF450055" : C.border}`, borderRadius: 18, overflow: "hidden", cursor: "pointer", transform: hov ? "translateY(-2px)" : "none", transition: "all 0.18s" }}>

      {/* Image */}
      <div style={{ width: "100%", height: 140, position: "relative", overflow: "hidden" }}>
        <AppImage
          src={r.image_url}
          fallback={r.emoji || "🍽️"}
          width="100%"
          height={140}
          borderRadius={0}
          style={{ width: "100%", height: 140, objectFit: "cover" }}
        />
        {/* Open/Closed badge */}
        <div style={{ position: "absolute", top: 10, right: 10, background: r.is_open ? `${C.success}dd` : `${C.error}dd`, borderRadius: 7, padding: "3px 9px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
          {r.is_open ? "OPEN" : "CLOSED"}
        </div>
        {r.is_featured && (
          <div style={{ position: "absolute", top: 10, left: 10, background: `${C.accent}dd`, borderRadius: 7, padding: "3px 9px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
            FEATURED
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, color: C.text }}>{r.name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          {r.cuisine_tags?.join(" · ")}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <span>⏱ {r.delivery_time || "25–35 min"}</span>
          <span>🛵 {r.delivery_fee != null ? `${Number(r.delivery_fee).toFixed(2)} XAF` : "Free"}</span>
          <span style={{ color: "#F5A623", fontWeight: 700 }}>⭐ {r.rating || "New"}</span>
        </div>
      </div>
    </div>
  );
}