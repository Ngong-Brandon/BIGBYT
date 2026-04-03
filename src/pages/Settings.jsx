// src/pages/Settings.jsx
// ─── Settings page + all sub-sections ────────────────────────────────────────
import { useState } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ margin: "0 0 8px", paddingTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", padding: "0 8px", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
        {title}
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, iconBg = "#1A1A1A", label, sub, right, onClick, danger, last }) {
  return (
    <div onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: last ? "none" : `1px solid #1A1A1A`, cursor: onClick ? "pointer" : "default", transition: "background 0.15s", gap: 12 }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "#161616"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: danger ? C.error : C.text }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {right}
        {onClick && <span style={{ color: "#444", fontSize: 14 }}>›</span>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.accent : "#333", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
  );
}

function Badge({ label, color = C.muted, bg = "#1A1A1A" }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: bg, color }}>{label}</span>;
}

function BackHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
      <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>←</button>
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>{title}</span>
    </div>
  );
}

const inputStyle = (extra = {}) => ({
  width: "100%", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12,
  padding: "13px 16px", color: C.text, fontFamily: " sans-serif",
  fontSize: 15, outline: "none", ...extra,
});

const labelStyle = { display: "block", fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: 1, fontFamily: "'DM Mono', monospace" };

// ─── SUB-SCREENS ──────────────────────────────────────────────────────────────

function EditProfile({ onBack, profile, user, showToast }) {
  const [name, setName]   = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name) return showToast("Name cannot be empty", "error");
    setSaving(true);
    // !! Connect: import { updateProfile } from "../services/authService"
    // !! then: await updateProfile(user.id, { full_name: name, phone });
    setTimeout(() => {
      setSaving(false);
      showToast("Profile updated ✓", "success");
      onBack();
    }, 800);
  }

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <BackHeader title="Edit Profile" onBack={onBack} />
      <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 auto 8px" }}>
          {initials}
        </div>
        <span style={{ fontSize: 12, color: C.accent, fontWeight: 700, cursor: "pointer" }}>Change Photo</span>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={labelStyle}>FULL NAME</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle()} />
        </div>
        <div>
          <span style={labelStyle}>EMAIL</span>
          <input value={user?.email || ""} disabled style={inputStyle({ opacity: 0.5, cursor: "not-allowed" })} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Email cannot be changed</div>
        </div>
        <div>
          <span style={labelStyle}>PHONE NUMBER</span>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" style={inputStyle()} />
        </div>
        <div>
          <span style={labelStyle}>DATE OF BIRTH</span>
          <input value={profile?.date_of_birth || ""} disabled type="date" style={inputStyle({ opacity: 0.5, cursor: "not-allowed", colorScheme: "dark" })} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Cannot be changed after registration</div>
        </div>
      </div>
      <button onClick={save} disabled={saving} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 16, opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function SavedAddresses({ onBack, showToast }) {
  const [addresses, setAddresses] = useState([
    { id: "1", label: "Home", address: "12 Admiralty Way, Lekki Phase 1", city: "Lagos", is_default: true },
    { id: "2", label: "Work", address: "Plot 1, Ozumba Mbadiwe, VI", city: "Lagos", is_default: false },
  ]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("Lagos");

  function handleAdd() {
    if (!newLabel || !newAddress || !newCity) return showToast("Fill all fields", "error");
    // !! Connect: await addAddress(user.id, { label: newLabel, address: newAddress, city: newCity })
    setAddresses(prev => [...prev, { id: Date.now().toString(), label: newLabel, address: newAddress, city: newCity, is_default: false }]);
    setNewLabel(""); setNewAddress(""); setNewCity("Lagos");
    setAdding(false);
    showToast("Address added ✓", "success");
  }

  function handleDelete(id) {
    // !! Connect: await deleteAddress(id)
    setAddresses(prev => prev.filter(a => a.id !== id));
    showToast("Address removed", "success");
  }

  return (
    <div>
      <BackHeader title="Saved Addresses" onBack={onBack} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {addresses.map(addr => (
          <div key={addr.id} style={{ background: C.surface, border: `1px solid ${addr.is_default ? C.accent : C.border}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {addr.label === "Home" ? "🏠" : addr.label === "Work" ? "🏢" : "📍"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.label}</span>
                {addr.is_default && <span style={{ fontSize: 10, fontWeight: 700, background: `${C.accent}18`, color: C.accent, padding: "2px 7px", borderRadius: 5 }}>DEFAULT</span>}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{addr.address}, {addr.city}</div>
            </div>
            <button onClick={() => handleDelete(addr.id)} style={{ background: "none", border: "none", color: C.error, cursor: "pointer", fontSize: 16, padding: 4 }}>🗑️</button>
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>New Address</span>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label (Home, Work...)" style={inputStyle()} />
          <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Street address" style={inputStyle()} />
          <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="City" style={inputStyle()} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setAdding(false)} style={{ flex: 1, background: C.card, color: C.muted, border: `1px solid ${C.border}`, padding: 12, borderRadius: 10, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Cancel</button>
            <button onClick={handleAdd} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", padding: 12, borderRadius: 10, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>Save</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", background: C.surface, color: C.accent, border: `1.5px dashed ${C.accent}55`, padding: 14, borderRadius: 14, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>
          + Add New Address
        </button>
      )}
    </div>
  );
}

function ChangePassword({ onBack, showToast }) {
  const [newPass, setNewPass]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [saving, setSaving]     = useState(false);

  async function save() {
    if (!newPass || !confirm) return showToast("Fill all fields", "error");
    if (newPass.length < 6) return showToast("Password must be at least 6 characters", "error");
    if (newPass !== confirm) return showToast("Passwords don't match", "error");
    setSaving(true);
    // !! Connect: import { supabase } from "../lib/supabase"
    // !! then: const { error } = await supabase.auth.updateUser({ password: newPass });
    setTimeout(() => {
      setSaving(false);
      showToast("Password updated ✓", "success");
      onBack();
    }, 1000);
  }

  return (
    <div>
      <BackHeader title="Change Password" onBack={onBack} />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={labelStyle}>NEW PASSWORD</span>
          <input value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="Min 6 characters" style={inputStyle()} />
        </div>
        <div>
          <span style={labelStyle}>CONFIRM NEW PASSWORD</span>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Repeat new password" style={inputStyle()} />
          {confirm && newPass !== confirm && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>✗ Passwords don't match</div>}
          {confirm && newPass === confirm && newPass.length >= 6 && <div style={{ fontSize: 11, color: C.success, marginTop: 4 }}>✓ Passwords match</div>}
        </div>
      </div>
      <button onClick={save} disabled={saving} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 16, opacity: saving ? 0.7 : 1 }}>
        {saving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}

function DietaryPrefs({ onBack, showToast }) {
  const [prefs, setPrefs] = useState({ vegetarian: false, vegan: false, halal: true, glutenFree: false, dairyFree: false, nutFree: false });
  const [allergies, setAllergies] = useState("");
  const items = [
    { key: "vegetarian", label: "Vegetarian", icon: "🥗" },
    { key: "vegan",      label: "Vegan",       icon: "🌱" },
    { key: "halal",      label: "Halal",        icon: "☪️" },
    { key: "glutenFree", label: "Gluten Free",  icon: "🌾" },
    { key: "dairyFree",  label: "Dairy Free",   icon: "🥛" },
    { key: "nutFree",    label: "Nut Free",     icon: "🥜" },
  ];
  return (
    <div>
      <BackHeader title="Dietary Preferences" onBack={onBack} />
      <Section title="Diet Type">
        {items.map((item, i) => (
          <Row key={item.key} icon={item.icon} label={item.label}
            right={<Toggle value={prefs[item.key]} onChange={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))} />}
            last={i === items.length - 1} />
        ))}
      </Section>
      <div style={{ marginTop: 16 }}>
        <span style={labelStyle}>ALLERGIES & OTHER NOTES</span>
        <textarea value={allergies} onChange={e => setAllergies(e.target.value)}
          placeholder="e.g. shellfish allergy, no onions..."
          style={{ ...inputStyle(), height: 90, resize: "none", paddingTop: 12 }} />
      </div>
      <button onClick={() => { showToast("Preferences saved ✓", "success"); onBack(); }}
        style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 16 }}>
        Save Preferences
      </button>
    </div>
  );
}

function NotificationSettings({ onBack, notifs, setNotifs }) {
  const items = [
    { key: "orderUpdates", icon: "🔔", label: "Order Updates",       sub: "Delivery status alerts" },
    { key: "promotions",   icon: "🎁", label: "Promotions & Deals",  sub: "Offers from restaurants" },
    { key: "emailNotifs",  icon: "📧", label: "Email Notifications", sub: "Receipts and newsletters" },
    { key: "smsAlerts",    icon: "📱", label: "SMS Alerts",          sub: "Text message updates" },
  ];
  return (
    <div>
      <BackHeader title="Notifications" onBack={onBack} />
      <Section title="Notification Types">
        {items.map((item, i) => (
          <Row key={item.key} icon={item.icon} label={item.label} sub={item.sub}
            right={<Toggle value={notifs[item.key]} onChange={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key] }))} />}
            last={i === items.length - 1} />
        ))}
      </Section>
    </div>
  );
}

function HelpSupport({ onBack }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "How do I track my order?",      a: "Go to Orders in the bottom nav. Your live order status updates in real time once placed." },
    { q: "Can I cancel my order?",         a: "You can cancel before the restaurant starts preparing. Go to Orders → tap your order → Cancel Order." },
    { q: "What if my food arrives late?",  a: "Contact support via the chat button below. We'll investigate and offer a refund if applicable." },
    { q: "How do I get a refund?",         a: "Refunds are processed within 3–5 business days. Contact support with your order ID." },
    { q: "Can I change my delivery address after ordering?", a: "No — the delivery address is locked once the restaurant confirms your order." },
  ];
  return (
    <div>
      <BackHeader title="Help & Support" onBack={onBack} />
      <Section title="Frequently Asked Questions">
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? `1px solid #1A1A1A` : "none" }}>
            <div onClick={() => setOpen(open === i ? null : i)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#161616"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, paddingRight: 12 }}>{faq.q}</span>
              <span style={{ color: C.accent, fontSize: 18, flexShrink: 0, fontWeight: 700 }}>{open === i ? "−" : "+"}</span>
            </div>
            {open === i && <div style={{ padding: "0 16px 14px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{faq.a}</div>}
          </div>
        ))}
      </Section>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "💬", label: "Live Chat",    sub: "Usually replies in 2 minutes",  color: C.success },
          { icon: "📞", label: "Call Support", sub: "+234 800 BIGBYT",               color: C.accent },
          { icon: "📧", label: "Email Us",     sub: "support@bigbyt.com",            color: "#F5A623" },
        ].map(item => (
          <div key={item.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleTextScreen({ title, onBack, content }) {
  return (
    <div>
      <BackHeader title={title} onBack={onBack} />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{content}</p>
      </div>
    </div>
  );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
export default function Settings({ go }) {
  const { user, profile, logout } = useAuth();
  const [subScreen, setSubScreen] = useState(null);
  const [toast, setToast]         = useState(null);
  const [notifs, setNotifs]       = useState({
    orderUpdates: true, promotions: true, emailNotifs: false, smsAlerts: false,
  });

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleLogout() {
    await logout();
    go("landing");
  }

  const name     = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const wrap = (children) => (
    <div style={{ fontFamily: "'Syne', sans-serif", color: C.text, maxWidth: 600, margin: "0 auto", padding: "0 16px 100px" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.type === "error" ? C.error : C.success, color: "#fff", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
      {children}
    </div>
  );

  // ── Sub-screen router ──────────────────────────────────────────────────────
  const back = () => setSubScreen(null);
  if (subScreen === "edit-profile")    return wrap(<EditProfile       onBack={back} profile={profile} user={user} showToast={showToast} />);
  if (subScreen === "addresses")       return wrap(<SavedAddresses    onBack={back} user={user} showToast={showToast} />);
  if (subScreen === "change-password") return wrap(<ChangePassword    onBack={back} showToast={showToast} />);
  if (subScreen === "dietary")         return wrap(<DietaryPrefs      onBack={back} showToast={showToast} />);
  if (subScreen === "notifications")   return wrap(<NotificationSettings onBack={back} notifs={notifs} setNotifs={setNotifs} />);
  if (subScreen === "help")            return wrap(<HelpSupport        onBack={back} />);
  if (subScreen === "terms")           return wrap(<SimpleTextScreen   onBack={back} title="Terms of Service"
    content="By using Bigbyt you agree to our terms of service. You must be 18 or older to use this platform. Orders are subject to restaurant availability. Bigbyt acts as a marketplace and is not responsible for food quality. Refunds are handled on a case by case basis. These terms may be updated at any time." />);
  if (subScreen === "privacy")         return wrap(<SimpleTextScreen   onBack={back} title="Privacy Policy"
    content="Bigbyt collects your name, email, phone, location, and order data to provide the delivery service. We do not sell your data to third parties. Payment details are processed securely and never stored on our servers. You may request deletion of your account and data at any time by contacting support." />);

  // ── Main settings list ─────────────────────────────────────────────────────
  return wrap(
    <>
      {/* Profile header */}
      <div style={{ padding: "32px 8px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.5px" }}>{name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{user?.email}</div>
            <div style={{ display: "inline-flex", alignItems: "center", marginTop: 6, background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 6, padding: "3px 10px" }}>
              <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>MEMBER SINCE 2026</span>
            </div>
          </div>
        </div>
      </div>

      <Section title="Account">
        <Row icon="👤" label="Edit Profile"      sub="Name, phone number"        onClick={() => setSubScreen("edit-profile")} />
        <Row icon="📍" label="Saved Addresses"   sub="Home, Work, Other"         right={<Badge label="2 saved" color={C.accent} bg={`${C.accent}18`} />} onClick={() => setSubScreen("addresses")} />
        <Row icon="💳" label="Payment Methods"   sub="Manage your cards"         right={<Badge label="Visa ••4242" />} onClick={() => showToast("Payment methods coming soon", "info")} />
        <Row icon="🔒" label="Change Password"   sub="Update your password"      onClick={() => setSubScreen("change-password")} last />
      </Section>

      <Section title="Orders">
        <Row icon="📦" label="Order History"         sub="View all past orders"      onClick={() => go("orders")} />
        <Row icon="⭐" label="My Reviews"            sub="Ratings you've submitted"  onClick={() => showToast("Reviews coming soon", "info")} />
        <Row icon="❤️" label="Favourite Restaurants" sub="Saved spots"               onClick={() => go("restaurants")} last />
      </Section>

      <Section title="Notifications">
        <Row icon="🔔" label="Notification Settings"
          sub={`${Object.values(notifs).filter(Boolean).length} of ${Object.values(notifs).length} enabled`}
          onClick={() => setSubScreen("notifications")} last />
      </Section>

      <Section title="Preferences">
        <Row icon="📍" label="Location"            sub="Lekki Phase 1, Lagos"      onClick={() => showToast("Location settings coming soon", "info")} />
        <Row icon="🌍" label="Language"            sub="English"                   onClick={() => showToast("Language settings coming soon", "info")} />
        <Row icon="💰" label="Currency"            sub="USD ($)"                   onClick={() => showToast("Currency settings coming soon", "info")} />
        <Row icon="🥗" label="Dietary Preferences" sub="Halal · No known allergies" onClick={() => setSubScreen("dietary")} last />
      </Section>

      <Section title="Support">
        <Row icon="💬" label="Help & Support"    sub="FAQs and contact us"         onClick={() => setSubScreen("help")} />
        <Row icon="📄" label="Terms of Service"  sub="Legal agreements"            onClick={() => setSubScreen("terms")} />
        <Row icon="🔏" label="Privacy Policy"    sub="How we use your data"        onClick={() => setSubScreen("privacy")} />
        <Row icon="⭐" label="Rate Bigbyt"       sub="Leave a review on the app store" onClick={() => showToast("Thanks for the love! 🔥", "success")} last />
      <Row icon="🔐" label="Admin Panel" sub="Platform management" onClick={() => go("admin")} />
      </Section>

      <Section title="Danger Zone">
        <Row icon="🗑️" iconBg="#1A0A0A" label="Delete Account" sub="Permanently remove your data"
          danger last onClick={() => {
            if (window.confirm("Are you sure? This cannot be undone.")) {
              showToast("Account deletion coming soon", "error");
            }
          }} />
      </Section>

      <div onClick={handleLogout}
        style={{ margin: "16px 0", borderRadius: 14, background: "#1A0A00", border: `1px solid ${C.accent}33`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.background = "#220D00"}
        onMouseLeave={e => e.currentTarget.style.background = "#1A0A00"}>
        <span style={{ fontSize: 16 }}>🚪</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>Log Out</span>
      </div>

      <div style={{ textAlign: "center", padding: 16, fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace" }}>
        Bigbyt v1.0.0 · Build 2026
      </div>
    </>
  );
}