// src/components/Footer.jsx
// ─── Responsive footer: bottom nav on mobile, full bar on desktop ─────────────
import { C } from "../constants/Colors";

const NAV_ITEMS = [
  { key: "landing",     label: "Home",        icon: "⌂" },
  { key: "restaurants", label: "Restaurants", icon: "🍽️" },
  { key: "orders",      label: "Orders",      icon: "📦" },
  { key: "settings",    label: "Settings",    icon: "⚙️" },
];

export default function Footer({ screen, go, user }) {

  function handleNav(key) {
    // Protect routes that need login
    if (!user && ["restaurants", "orders", "settings"].includes(key)) {
      go("login");
      return;
    }
    go(key);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .bb-footer-desktop { display: none !important; }
          .bb-footer-mobile  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .bb-footer-mobile  { display: none !important; }
          .bb-footer-desktop { display: flex !important; }
        }
        .bb-nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .bb-nav-btn:hover .bb-nav-label { color: ${C.text} !important; }
        .bb-nav-btn:hover .bb-nav-icon  { color: ${C.text} !important; }
        .bb-desk-btn:hover {
          background: #1E1E1E !important;
          color: ${C.text} !important;
        }
      `}</style>

      {/* ── MOBILE — fixed bottom nav ──────────────────────────────────── */}
      <nav className="bb-footer-mobile" style={{
        display: "none",
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        zIndex: 500,
        alignItems: "center",
        justifyContent: "space-around",
      }}>
        {NAV_ITEMS.map(item => {
          const active = screen === item.key;
          return (
            <button key={item.key} className="bb-nav-btn"
              onClick={() => handleNav(item.key)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flex: 1, height: "100%", position: "relative" }}>
              {/* Active indicator */}
              {active && (
                <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: C.accent, borderRadius: "0 0 4px 4px" }} />
              )}
              <span className="bb-nav-icon" style={{ fontSize: 20, color: active ? C.accent : C.muted, lineHeight: 1 }}>
                {item.icon}
              </span>
              <span className="bb-nav-label" style={{ fontSize: 10, fontWeight: 700, color: active ? C.accent : C.muted, letterSpacing: "0.03em" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── DESKTOP — horizontal footer bar ───────────────────────────── */}
      <footer className="bb-footer-desktop" style={{
        display: "none",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        flexWrap: "wrap",
        gap: 16,
      }}>
        {/* Logo */}
        <div onClick={() => go(user ? "restaurants" : "landing")}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔥</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: C.text }}>
            Big<span style={{ color: C.accent }}>byt</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const active = screen === item.key;
            return (
              <button key={item.key} className="bb-nav-btn bb-desk-btn"
                onClick={() => handleNav(item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", borderRadius: 9,
                  background: active ? "#1E1E1E" : "transparent",
                  color: active ? C.accent : C.muted,
                  fontSize: 13, fontWeight: 700,
                }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Copyright */}
        <span style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>
          © 2026 Bigbyt
        </span>
      </footer>

      {/* ── Mobile bottom padding so content isn't hidden behind nav ───── */}
      <div className="bb-footer-mobile" style={{ display: "none", height: 64 }} />
    </>
  );
}