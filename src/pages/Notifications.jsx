// src/pages/Notifications.jsx
// ─── Notifications screen ─────────────────────────────────────────────────────
import { useState } from "react";
import { C } from "../constants/Colors";

const MOCK_NOTIFICATIONS = [
  {
    id: 1, type: "order", read: false,
    icon: "🛵", title: "Order on the way!",
    body: "Your order from Flames & Smoke is 5 minutes away.",
    time: "2 min ago", action: "tracking",
  },
  {
    id: 2, type: "promo", read: false,
    icon: "🎁", title: "30% off at Sakura Express",
    body: "Limited time deal — use code BIGBYT30 at checkout.",
    time: "1 hr ago", action: "restaurants",
  },
  {
    id: 3, type: "order", read: false,
    icon: "✅", title: "Order delivered!",
    body: "Your Smash Burger Stack from Flames & Smoke was delivered. Enjoy! 🔥",
    time: "Yesterday", action: "orders",
  },
  {
    id: 4, type: "system", read: true,
    icon: "🔥", title: "Welcome to Bigbyt!",
    body: "Start exploring restaurants near you and place your first order.",
    time: "2 days ago", action: "restaurants",
  },
  {
    id: 5, type: "promo", read: true,
    icon: "🌟", title: "New restaurant: Nonna's Kitchen",
    body: "Authentic Italian cuisine just landed in Victoria Island. Check them out!",
    time: "3 days ago", action: "restaurants",
  },
  {
    id: 6, type: "order", read: true,
    icon: "⭐", title: "Rate your last order",
    body: "How was your meal from Sakura Express? Tap to leave a review.",
    time: "4 days ago", action: "orders",
  },
];

const TYPE_COLORS = {
  order:  { bg: `${C.accent}18`,   border: `${C.accent}33`,   dot: C.accent },
  promo:  { bg: "#F5A62318",        border: "#F5A62333",        dot: "#F5A623" },
  system: { bg: `${C.success}18`,  border: `${C.success}33`,  dot: C.success },
};

export default function Notifications({ go }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState("all"); // all | unread

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === "unread"
    ? notifications.filter(n => !n.read)
    : notifications;

  function markRead(id) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function deleteNotif(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function handleTap(notif) {
    markRead(notif.id);
    if (notif.action) go(notif.action);
  }

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", color: C.text, maxWidth: 600, margin: "0 auto", padding: "0 0 100px" }}>

      {/* Header */}
      <div style={{ padding: "28px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 2 }}>Notifications</h1>
          {unreadCount > 0 && (
            <div style={{ fontSize: 12, color: C.muted }}>
              <span style={{ color: C.accent, fontWeight: 700 }}>{unreadCount}</span> unread
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        {[
          { key: "all",    label: "All" },
          { key: "unread", label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ background: filter === tab.key ? `${C.accent}18` : "transparent", border: `1.5px solid ${filter === tab.key ? C.accent : C.border}`, borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, color: filter === tab.key ? C.accent : C.muted, cursor: "pointer", fontFamily: "'Syne', sans-serif", transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ padding: "8px 0" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: C.muted }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔔</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </div>
            <div style={{ fontSize: 13 }}>
              {filter === "unread" ? "No unread notifications" : "Order food to start getting updates"}
            </div>
          </div>
        ) : (
          filtered.map(notif => {
            const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.system;
            return (
              <div key={notif.id}
                style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: notif.read ? "transparent" : `${C.accent}06`, cursor: "pointer", transition: "background 0.15s", position: "relative" }}
                onClick={() => handleTap(notif)}
                onMouseEnter={e => e.currentTarget.style.background = notif.read ? "#111" : `${C.accent}0e`}
                onMouseLeave={e => e.currentTarget.style.background = notif.read ? "transparent" : `${C.accent}06`}>

                {/* Unread dot */}
                {!notif.read && (
                  <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
                )}

                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 13, background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {notif.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: notif.read ? 600 : 800, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{notif.title}</span>
                    <span style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", flexShrink: 0 }}>{notif.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{notif.body}</div>
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteNotif(notif.id); }}
                  style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 16, padding: "2px 4px", flexShrink: 0, lineHeight: 1 }}
                  title="Dismiss">
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}