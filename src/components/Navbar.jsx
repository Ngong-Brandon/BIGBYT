// src/components/Navbar.jsx
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../hooks/useNotifications";

export default function Navbar({ screen, go }) {
  const { user, logout }    = useAuth();
  const { cartCount }       = useCart();
  const { unreadCount, clearUnread } = useNotifications();

  function handleLogout() { logout(); go("landing"); }

  function handleBell() {
    clearUnread();
    go("notifications");
  }

  return (
    <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderBottom:`1px solid ${C.border}`, background:`${C.bg}ee`, position:"sticky", top:0, zIndex:100, backdropFilter:"blur(12px)" }}>

      {/* Logo */}
      <div onClick={() => go(user ? "home" : "landing")}
        style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:32, height:32, background:C.accent, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔥</div>
        <span style={{ fontSize:21, fontWeight:800, letterSpacing:"-0.5px", color:C.text }}>
          Big<span style={{ color:C.accent }}>byt</span>
        </span>
      </div>

      {/* Right side */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {user ? (
          <>
            {screen === "restaurant" && (
              <button onClick={() => go("restaurants")}
                style={{ background:"transparent", border:`1.5px solid ${C.border}`, color:C.muted, padding:"8px 16px", borderRadius:9, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600 }}>
                ← Restaurants
              </button>
            )}

            {/* 🔔 Bell with realtime badge */}
            <div onClick={handleBell} style={{ position:"relative", cursor:"pointer" }}>
              <div style={{ width:38, height:38, background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                🔔
              </div>
              {unreadCount > 0 && (
                <div style={{ position:"absolute", top:-4, right:-4, minWidth:18, height:18, background:C.error, borderRadius:9, border:`2px solid ${C.bg}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff", padding:"0 3px" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>

            {/* Cart */}
            <button onClick={() => go("cart")}
              style={{ background:C.surface, border:`1.5px solid ${C.border}`, color:C.text, padding:"8px 14px", borderRadius:9, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              🛒
              {cartCount > 0 && (
                <span style={{ background:C.accent, color:"#fff", borderRadius:"50%", width:19, height:19, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800 }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* User pill */}
            <div onClick={handleLogout} title="Logout"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:C.surface, borderRadius:9, border:`1px solid ${C.border}`, cursor:"pointer" }}>
              <span style={{ fontSize:12, color:C.muted }}>👤 {user.email?.split("@")[0].slice(0,5)}...</span>
              <span style={{ color:C.error, fontSize:10, fontWeight:700 }}>OUT</span>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => go("login")}
              style={{ background:"transparent", border:`1.5px solid ${C.border}`, color:C.muted, padding:"10px 20px", borderRadius:10, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600 }}>
              Log In
            </button>
            <button onClick={() => go("register")}
              style={{ background:C.accent, color:"#fff", border:"none", padding:"10px 18px", borderRadius:9, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800 }}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}