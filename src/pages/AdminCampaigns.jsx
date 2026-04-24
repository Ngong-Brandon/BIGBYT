// src/pages/AdminCampaigns.jsx
// ─── Admin: create and send notification campaigns ────────────────────────────
import { useState, useEffect } from "react";
import { getCampaigns, createCampaign, sendCampaign } from "../services/notificationService";
import { getAdminRestaurants } from "../services/AdminService";

const A = {
  bg: "#080808", surface: "#111111", card: "#161616",
  border: "#1E1E1E", accent: "#FF4500", text: "#F0EBE1",
  muted: "#6B6860", success: "#00C48C", error: "#FF4560", warning: "#F5A623",
};

function Badge({ label, color, bg }) {
  return <span style={{ display:"inline-flex", padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:700, background:bg, color }}>{label}</span>;
}

const CATEGORIES = ["Burgers", "Sushi", "Pizza", "Indian", "Healthy", "Noodles", "BBQ", "Italian", "Pasta"];

const EMPTY_FORM = {
  title: "", body: "", icon: "🎁", action_screen: "restaurants",
  audience: "all", target_restaurant_id: "", target_category: "",
  send_in_app: true, send_email: false,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function AdminCampaigns() {
  const [campaigns,    setCampaigns]    = useState([]);
  const [restaurants,  setRestaurants]  = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [sending,      setSending]      = useState(null); // campaign id being sent
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    getCampaigns().then(({ campaigns })       => setCampaigns(campaigns));
    getAdminRestaurants().then(({ restaurants }) => setRestaurants(restaurants));
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  async function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) return showToast("Title and message are required", "error");
    if (form.audience === "restaurant" && !form.target_restaurant_id) return showToast("Select a target restaurant", "error");
    if (form.audience === "category"   && !form.target_category)       return showToast("Select a target category", "error");
    if (!form.send_in_app && !form.send_email) return showToast("Select at least one channel", "error");

    setSaving(true);
    const payload = {
      ...form,
      target_restaurant_id: form.audience === "restaurant" ? form.target_restaurant_id : null,
      target_category:      form.audience === "category"   ? form.target_category       : null,
      status: "draft",
    };

    const { campaign, error } = await createCampaign(payload);
    setSaving(false);

    if (error) return showToast(error.message || "Failed to create campaign", "error");

    setCampaigns(prev => [campaign, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    showToast("Campaign created — ready to send!");
  }

  async function handleSend(campaign) {
    if (!window.confirm(`Send "${campaign.title}" to users now?`)) return;

    setSending(campaign.id);
    const { data, error } = await sendCampaign(campaign.id);
    setSending(null);

    if (error) return showToast(error.message || "Failed to send campaign", "error");

    setCampaigns(prev => prev.map(c =>
      c.id === campaign.id ? { ...c, status: "sent", sent_count: data?.sent_count || 0 } : c
    ));

    showToast(`Sent to ${data?.sent_count || 0} users! ${data?.emails_sent ? `· ${data.emails_sent} emails` : ""}`);
  }

  const inp = (extra = {}) => ({
    background: A.card, border: `1px solid ${A.border}`, borderRadius: 9,
    padding: "9px 13px", color: A.text, fontFamily: "sans-serif",
    fontSize: 13, outline: "none", width: "100%", ...extra,
  });

  const STATUS_BADGE = {
    draft:   { label: "Draft",   color: A.muted,   bg: "#1A1A1A" },
    sending: { label: "Sending", color: A.warning,  bg: "#F5A62318" },
    sent:    { label: "Sent",    color: A.success,  bg: "#00C48C18" },
    failed:  { label: "Failed",  color: A.error,    bg: "#FF456018" },
  };

  const AUDIENCE_LABELS = {
    all:        "All users",
    restaurant: "Restaurant customers",
    category:   "Category fans",
  };

  const ICON_OPTIONS = ["🎁", "🔥", "🌟", "⚡", "🎉", "💥", "🍕", "🍔", "🍜", "🥗", "🎊", "💰"];

  return (
    <div style={{ fontFamily: "sans-serif", color: A.text }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, background:toast.type==="error"?A.error:A.success, color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:13, zIndex:2000, maxWidth:320 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", color:A.text, marginBottom:3 }}>Notification Campaigns</h1>
        <div style={{ fontSize:12, color:A.muted }}>Create and send promotional notifications to targeted users</div>
      </div>

      {/* Create button */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background:A.accent, color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"sans-serif" }}>
          {showForm ? "× Cancel" : "+ New Campaign"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background:A.surface, border:`1px solid ${A.border}`, borderRadius:16, padding:24, marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:18 }}>New Campaign</div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Icon picker + title */}
            <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:11, color:A.muted, marginBottom:5, fontWeight:700 }}>ICON</div>
                <select value={form.icon} onChange={e=>set("icon",e.target.value)} style={{ ...inp({ width:70 }) }}>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:A.muted, marginBottom:5, fontWeight:700 }}>TITLE</div>
                <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="30% off Pizza tonight 🍕" style={inp()} />
              </div>
            </div>

            {/* Message */}
            <div>
              <div style={{ fontSize:11, color:A.muted, marginBottom:5, fontWeight:700 }}>MESSAGE</div>
              <textarea value={form.body} onChange={e=>set("body",e.target.value)}
                placeholder="Order your favourite pizza today and save 30%. Valid until midnight!"
                style={{ ...inp(), height:80, resize:"none", paddingTop:10 }} />
            </div>

            {/* Audience */}
            <div>
              <div style={{ fontSize:11, color:A.muted, marginBottom:8, fontWeight:700 }}>TARGET AUDIENCE</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { key:"all",        label:"All Users",            desc:"Every registered user" },
                  { key:"restaurant", label:"Restaurant Customers", desc:"Users who ordered from a specific restaurant" },
                  { key:"category",   label:"Category Fans",        desc:"Users who ordered a specific food category" },
                ].map(opt => (
                  <div key={opt.key} onClick={()=>set("audience",opt.key)}
                    style={{ background:form.audience===opt.key?`${A.accent}18`:A.card, border:`1.5px solid ${form.audience===opt.key?A.accent:A.border}`, borderRadius:10, padding:"10px 14px", cursor:"pointer", flex:1, minWidth:160, transition:"all 0.15s" }}>
                    <div style={{ fontWeight:700, fontSize:13, color:form.audience===opt.key?A.accent:A.text, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:A.muted }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurant selector */}
            {form.audience === "restaurant" && (
              <div>
                <div style={{ fontSize:11, color:A.muted, marginBottom:5, fontWeight:700 }}>SELECT RESTAURANT</div>
                <select value={form.target_restaurant_id} onChange={e=>set("target_restaurant_id",e.target.value)} style={inp()}>
                  <option value="">Choose a restaurant...</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                </select>
                <div style={{ fontSize:11, color:A.muted, marginTop:4 }}>Only users who previously ordered from this restaurant</div>
              </div>
            )}

            {/* Category selector */}
            {form.audience === "category" && (
              <div>
                <div style={{ fontSize:11, color:A.muted, marginBottom:5, fontWeight:700 }}>SELECT CATEGORY</div>
                <select value={form.target_category} onChange={e=>set("target_category",e.target.value)} style={inp()}>
                  <option value="">Choose a category...</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div style={{ fontSize:11, color:A.muted, marginTop:4 }}>Only users who previously ordered from this category</div>
              </div>
            )}

            {/* Channels */}
            <div>
              <div style={{ fontSize:11, color:A.muted, marginBottom:10, fontWeight:700 }}>SEND VIA</div>
              <div style={{ display:"flex", gap:10 }}>
                <label onClick={()=>set("send_in_app",!form.send_in_app)}
                  style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:form.send_in_app?`${A.accent}18`:A.card, border:`1.5px solid ${form.send_in_app?A.accent:A.border}`, borderRadius:10, padding:"10px 16px", transition:"all 0.15s" }}>
                  <div style={{ width:18, height:18, borderRadius:4, background:form.send_in_app?A.accent:"#222", border:`2px solid ${form.send_in_app?A.accent:A.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {form.send_in_app && <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:form.send_in_app?A.accent:A.text }}>🔔 In-App</div>
                    <div style={{ fontSize:11, color:A.muted }}>Bell notification</div>
                  </div>
                </label>
                <label onClick={()=>set("send_email",!form.send_email)}
                  style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:form.send_email?`${A.accent}18`:A.card, border:`1.5px solid ${form.send_email?A.accent:A.border}`, borderRadius:10, padding:"10px 16px", transition:"all 0.15s" }}>
                  <div style={{ width:18, height:18, borderRadius:4, background:form.send_email?A.accent:"#222", border:`2px solid ${form.send_email?A.accent:A.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {form.send_email && <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:form.send_email?A.accent:A.text }}>📧 Email</div>
                    <div style={{ fontSize:11, color:A.muted }}>Via Resend SMTP</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            {(form.title || form.body) && (
              <div style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:A.muted, marginBottom:10, fontWeight:700 }}>PREVIEW</div>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:"#F5A62318", border:"1px solid #F5A62333", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                    {form.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:A.text, marginBottom:3 }}>{form.title || "Campaign title"}</div>
                    <div style={{ fontSize:12, color:A.muted, lineHeight:1.5 }}>{form.body || "Campaign message..."}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Save */}
            <button onClick={handleCreate} disabled={saving}
              style={{ background:A.accent, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:800, cursor:saving?"not-allowed":"pointer", fontFamily:"sans-serif", opacity:saving?0.7:1 }}>
              {saving ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:A.muted }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📣</div>
          <div style={{ fontSize:16, fontWeight:700, color:A.text, marginBottom:6 }}>No campaigns yet</div>
          <div style={{ fontSize:13 }}>Create your first notification campaign above</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {campaigns.map(c => {
            const s = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
            return (
              <div key={c.id} style={{ background:A.surface, border:`1px solid ${A.border}`, borderRadius:14, padding:20 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>
                    <div style={{ width:42, height:42, borderRadius:11, background:"#F5A62318", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                      {c.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:A.text, marginBottom:3 }}>{c.title}</div>
                      <div style={{ fontSize:13, color:A.muted, lineHeight:1.5 }}>{c.body}</div>
                    </div>
                  </div>
                  <Badge label={s.label} color={s.color} bg={s.bg} />
                </div>

                {/* Meta row */}
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:A.muted, marginBottom:14, paddingTop:12, borderTop:`1px solid ${A.border}` }}>
                  <span>👥 {AUDIENCE_LABELS[c.audience]}{c.restaurant ? ` · ${c.restaurant.emoji} ${c.restaurant.name}` : ""}{c.target_category ? ` · ${c.target_category}` : ""}</span>
                  <span>📣 {[c.send_in_app?"In-App":null, c.send_email?"Email":null].filter(Boolean).join(" + ")}</span>
                  {c.status==="sent" && <span style={{ color:A.success }}>✓ {c.sent_count} users reached</span>}
                  <span style={{ marginLeft:"auto" }}>{timeAgo(c.created_at)}</span>
                </div>

                {/* Actions */}
                {c.status === "draft" && (
                  <button onClick={()=>handleSend(c)} disabled={sending===c.id}
                    style={{ background:A.accent, color:"#fff", border:"none", borderRadius:9, padding:"9px 20px", fontSize:13, fontWeight:800, cursor:sending===c.id?"not-allowed":"pointer", fontFamily:"sans-serif", opacity:sending===c.id?0.7:1 }}>
                    {sending===c.id ? "Sending..." : "🚀 Send Now"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}