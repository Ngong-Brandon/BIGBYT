// src/pages/Notifications.jsx
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { playNotificationSound } from "../utils/sound";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";


const TYPE_STYLE = {
  order_confirmed:  { color: "#378ADD", bg: "#378ADD18" },
  order_preparing:  { color: "#F5A623", bg: "#F5A62318" },
  order_on_the_way: { color: C.accent,  bg: `${C.accent}18` },
  order_delivered:  { color: C.success, bg: `${C.success}18` },
  payment_success:  { color: C.success, bg: `${C.success}18` },
  promo:            { color: "#F5A623", bg: "#F5A62318" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hrs < 24)   return `${hrs}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications({ go }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [marking,  setMarking]  = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user?.id) return;
    load();

    // Realtime — new notifications appear instantly
    const channel = supabase
      .channel(`notif-page-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      playNotificationSound();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  async function load() {
    setLoading(true);
    const { notifications } = await getNotifications(user.id);
    setNotifications(notifications);
    setLoading(false);
  }

  async function handleMarkRead(n) {
    if (n.is_read) {
      // navigate on tap even if already read
      if (n.action_screen) go(n.action_screen);
      return;
    }
    await markAsRead(n.id);
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    if (n.action_screen) go(n.action_screen);
  }

  async function handleClearAll() {
  if (!window.confirm("Delete all notifications?")) return;
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);
  if (!error) setNotifications([]);
}

  async function handleMarkAllRead() {
    setMarking(true);
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarking(false);
  }

  const filtered = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div style={{ fontFamily:"'Syne',sans-serif", color:C.text, maxWidth:600, margin:"0 auto", padding:"0 0 100px" }}>

      {/* Header */}
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

  {/* Buttons */}
  <div style={{ display: "flex", gap: 8 }}>
    {unreadCount > 0 && (
      <button onClick={handleMarkAllRead} disabled={marking}
        style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", opacity: marking ? 0.6 : 1 }}>
        {marking ? "Marking..." : "Mark all read"}
      </button>
    )}
    {notifications.length > 0 && (
      <button onClick={handleClearAll}
        style={{ background: "none", border: `1px solid ${C.error}44`, borderRadius: 9, padding: "8px 14px", color: C.error, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
        Clear all
      </button>
    )}
  </div>
</div>
      {/* Filter tabs */}
      <div style={{ display:"flex", gap:8, padding:"14px 20px", borderBottom:`1px solid ${C.border}` }}>
        {[["all","All"],["unread",`Unread${unreadCount>0?` (${unreadCount})`:""}`]].map(([key,label]) => (
          <button key={key} onClick={()=>setFilter(key)}
            style={{ background:filter===key?`${C.accent}18`:"transparent", border:`1.5px solid ${filter===key?C.accent:C.border}`, borderRadius:100, padding:"7px 18px", fontSize:13, fontWeight:700, color:filter===key?C.accent:C.muted, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding:"8px 0" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"64px 20px", color:C.muted }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🔔</div>
            <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:6 }}>
              {filter==="unread" ? "All caught up!" : "No notifications yet"}
            </div>
            <div style={{ fontSize:13 }}>
              {filter==="unread" ? "No unread notifications" : "Place an order to get started"}
            </div>
          </div>
        ) : (
          filtered.map(n => {
            const style = TYPE_STYLE[n.type] || TYPE_STYLE.promo;
            return (
              <div key={n.id} onClick={()=>handleMarkRead(n)}
                style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 20px", borderBottom:`1px solid ${C.border}`, background:n.is_read?"transparent":`${C.accent}06`, cursor:"pointer", transition:"background 0.15s", position:"relative" }}
                onMouseEnter={e=>e.currentTarget.style.background=n.is_read?"#111":`${C.accent}0e`}
                onMouseLeave={e=>e.currentTarget.style.background=n.is_read?"transparent":`${C.accent}06`}>

                {/* Unread dot */}
                {!n.is_read && <div style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", width:6, height:6, borderRadius:"50%", background:C.accent }} />}

                {/* Icon */}
                <div style={{ width:44, height:44, borderRadius:13, background:style.bg, border:`1px solid ${style.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                  {n.icon}
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:n.is_read?600:800, fontSize:14, color:C.text, lineHeight:1.3 }}>{n.title}</span>
                    <span style={{ fontSize:10, color:C.muted, fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap", flexShrink:0 }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>{n.body}</div>
                  {n.action_screen && !n.is_read && (
                    <div style={{ fontSize:11, color:style.color, fontWeight:700, marginTop:4 }}>Tap to view →</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}