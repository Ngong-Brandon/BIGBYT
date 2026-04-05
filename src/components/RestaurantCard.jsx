// src/components/RestaurantCard.jsx
import { C } from "../constants/Colors";

export default function RestaurantCard({ r, onEnter }) {

  
  return (
    <div
      className="card"
      onClick={r.is_open ? onEnter : undefined}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
        padding: 22, cursor: r.is_open ? "pointer" : "not-allowed",
        opacity: r.is_open ? 1 : 0.6, position: "relative", overflow: "hidden",
      }}
    >
      {r.tag && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBorder}`,
          borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 700,
        }}>
          {r.tag}
        </div>
      )}

      <div style={{ fontSize: 44, marginBottom: 14 }}>{r.emoji}</div>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3, color: C.text }}>{r.name}</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>{r.cuisine_tags}</div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>📍 {r.neighborhood}</div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `1px solid ${C.border}`, paddingTop: 14,
      }}>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted }}>
          <span>⏱ {r.delivery_time}</span>
          <span>🛵 ${r.delivery_fee}</span>
        </div>
        <span style={{ color: C.gold, fontWeight: 800, fontSize: 13 }}>⭐ {r.rating}</span>
      </div>

      {!r.is_open && (
        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: C.error }}>
          Currently Closed
        </div>
      )}
    </div>
  );
}