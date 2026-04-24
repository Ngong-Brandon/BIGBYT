// src/pages/Settings.jsx
// Real Supabase calls + old password verification
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";
import { updateProfile } from "../services/AuthService";
import { supabase } from "../lib/supabase";
import { addAddress, deleteAddress, getAddresses, setDefaultAddress } from "../services/addressService";

function Section({ title, children }) {
  return (
    <div style={{ margin:"0 0 8px", paddingTop:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:2, textTransform:"uppercase", padding:"0 8px", marginBottom:8, fontFamily:"'DM Mono',monospace" }}>{title}</div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>{children}</div>
    </div>
  );
}

function Row({ icon, iconBg="#1A1A1A", label, sub, right, onClick, danger, last }) {
  return (
    <div onClick={onClick}
      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:last?"none":`1px solid #1A1A1A`, cursor:onClick?"pointer":"default", transition:"background 0.15s", gap:12 }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.background="#161616"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:danger?C.error:C.text }}>{label}</div>
          {sub && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {right}
        {onClick && <span style={{ color:"#444", fontSize:14 }}>›</span>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{ width:44, height:24, borderRadius:12, background:value?C.accent:"#333", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:value?23:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
    </div>
  );
}

function Badge({ label, color=C.muted, bg="#1A1A1A" }) {
  return <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:6, background:bg, color }}>{label}</span>;
}

function BackHeader({ title, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"24px 0 16px", borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
      <button onClick={onBack} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, width:36, height:36, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:C.text }}>←</button>
      <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>{title}</span>
    </div>
  );
}

const inp = (extra={}) => ({ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"13px 16px", color:C.text, fontFamily:"sans-serif", fontSize:15, outline:"none", ...extra });
const lbl = { display:"block", fontSize:11, color:C.muted, fontWeight:700, marginBottom:6, letterSpacing:1, fontFamily:"'DM Mono',monospace" };
const btnPrimary = (extra={}) => ({ background:C.accent, color:"#fff", border:"none", padding:"14px", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"sans-serif", width:"100%", ...extra });

// ── 1. EDIT PROFILE ───────────────────────────────────────────────────────────
function EditProfile({ onBack, showToast }) {
  const { user, profile } = useAuth();
  const [name,   setName]   = useState(profile?.full_name || "");
  const [phone,  setPhone]  = useState(profile?.phone     || "");
  const [avatar, setAvatar] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.phone)     setPhone(profile.phone);
    if (profile?.avatar_url) setAvatar(profile.avatar_url);
  }, [profile]);

  async function save() {
    if (!name.trim()) return showToast("Name cannot be empty", "error");
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: name.trim(), phone: phone.trim() || null, avatar_url: avatar || null });
    
    setSaving(false);
    if (error) return showToast(error.message || "Failed to update", "error");
    showToast("Profile updated!", "success");
    onBack();
  }

  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() || "?";
  return (
    <div>
      <BackHeader title="Edit Profile" onBack={onBack} />
      <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
  {avatar ? (
    // Show uploaded photo
    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
      <img src={avatar} alt="avatar"
        style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}` }} />
      <button onClick={() => setAvatar("")}
        style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: C.error, border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        ×
      </button>
    </div>
  ) : (
    // Show initials + upload prompt
   
    
    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
     {profile?.avatar_url ? ( 
  <img src={profile.avatar_url} alt="avatar"
    style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${C.accent}` }} />
) : (
  <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
    {initials}
  </div>
)}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageUpload
          bucket="restaurants"   // reuse existing bucket
          folder="avatars"
          currentUrl=""
          onUpload={url => setAvatar(url)}
          size={80}
          shape="circle"
          label="📷"
        />
      </div>
    </div>
  )}
  <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginTop: 8, cursor: "pointer" }}
    onClick={() => document.querySelector('input[type="file"]')?.click()}>
    {avatar ? "Change Photo" : "Upload Photo"}
  </div>
</div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:14, marginBottom:16 }}>
        <div><span style={lbl}>FULL NAME</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" style={inp()} /></div>
        <div><span style={lbl}>EMAIL</span><input value={user?.email||""} disabled style={inp({ opacity:0.5, cursor:"not-allowed" })} /><div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Email cannot be changed</div></div>
        <div><span style={lbl}>PHONE NUMBER</span><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000" style={inp()} /></div>
        <div><span style={lbl}>DATE OF BIRTH</span><input value={profile?.date_of_birth||""} disabled type="date" style={inp({ opacity:0.5, cursor:"not-allowed", colorScheme:"dark" })} /><div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Cannot be changed after registration</div></div>
      </div>
      <button onClick={save} disabled={saving} style={btnPrimary({ opacity:saving?0.7:1 })}>{saving?"Saving...":"Save Changes"}</button>
    </div>
  );
}

// ── 2. SAVED ADDRESSES ────────────────────────────────────────────────────────
function SavedAddresses({ onBack, showToast }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [newLabel,  setNewLabel]  = useState("");
  const [newAddr,   setNewAddr]   = useState("");
  const [newCity,   setNewCity]   = useState("Lagos");
  const [isDef,     setIsDef]     = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getAddresses(user.id).then(({ addresses }) => { setAddresses(addresses||[]); setLoading(false); });
  }, [user?.id]);

  async function handleAdd() {
    if (!newLabel.trim()||!newAddr.trim()||!newCity.trim()) return showToast("Fill all fields","error");
    setSaving(true);
    const { address, error } = await addAddress(user.id, { label:newLabel.trim(), address:newAddr.trim(), city:newCity.trim(), isDefault:isDef });
    setSaving(false);
    if (error) return showToast(error.message||"Failed to add","error");
    setAddresses(prev=>[...(isDef?prev.map(a=>({...a,is_default:false})):prev), address]);
    setNewLabel(""); setNewAddr(""); setNewCity("Lagos"); setIsDef(false); setAdding(false);
    showToast("Address added!","success");
  }

  async function handleDelete(id) {
    const { error } = await deleteAddress(id);
    if (error) return showToast("Failed to remove","error");
    setAddresses(prev=>prev.filter(a=>a.id!==id));
    showToast("Address removed","success");
  }

  async function handleSetDefault(id) {
    const { error } = await setDefaultAddress(user.id, id);
    if (error) return showToast("Failed to set default","error");
    setAddresses(prev=>prev.map(a=>({...a,is_default:a.id===id})));
    showToast("Default updated!","success");
  }

  return (
    <div>
      <BackHeader title="Saved Addresses" onBack={onBack} />
      {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>Loading...</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {addresses.map(addr=>(
            <div key={addr.id} style={{ background:C.surface, border:`1px solid ${addr.is_default?C.accent:C.border}`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                {addr.label?.toLowerCase()==="home"?"🏠":addr.label?.toLowerCase()==="work"?"🏢":"📍"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:14 }}>{addr.label}</span>
                  {addr.is_default && <Badge label="DEFAULT" color={C.accent} bg={`${C.accent}18`} />}
                </div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{addr.address}, {addr.city}</div>
                {!addr.is_default && <span onClick={()=>handleSetDefault(addr.id)} style={{ fontSize:11, color:C.accent, cursor:"pointer", fontWeight:700, marginTop:4, display:"inline-block" }}>Set as default</span>}
              </div>
              <button onClick={()=>handleDelete(addr.id)} style={{ background:"none", border:"none", color:C.error, cursor:"pointer", fontSize:18, padding:4, flexShrink:0 }}>🗑️</button>
            </div>
          ))}
          {addresses.length===0&&!adding&&<div style={{ textAlign:"center", padding:"32px 0", color:C.muted, fontSize:13 }}>No saved addresses yet</div>}
        </div>
      )}
      {adding ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>New Address</span>
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Label (Home, Work...)" style={inp()} />
          <input value={newAddr}  onChange={e=>setNewAddr(e.target.value)}  placeholder="Street address"       style={inp()} />
          <input value={newCity}  onChange={e=>setNewCity(e.target.value)}  placeholder="City"                 style={inp()} />
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:C.text }}>
            <input type="checkbox" checked={isDef} onChange={e=>setIsDef(e.target.checked)} />
            Set as default address
          </label>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setAdding(false)} style={{ flex:1, background:C.card, color:C.muted, border:`1px solid ${C.border}`, padding:12, borderRadius:10, cursor:"pointer", fontFamily:"sans-serif", fontWeight:700 }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ flex:1, background:C.accent, color:"#fff", border:"none", padding:12, borderRadius:10, cursor:"pointer", fontFamily:"sans-serif", fontWeight:800, opacity:saving?0.7:1 }}>{saving?"Saving...":"Save"}</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ width:"100%", background:C.surface, color:C.accent, border:`1.5px dashed ${C.accent}55`, padding:14, borderRadius:14, cursor:"pointer", fontFamily:"sans-serif", fontWeight:800, fontSize:14 }}>+ Add New Address</button>
      )}
    </div>
  );
}

// ── 3. CHANGE PASSWORD — requires old password verification ───────────────────
function ChangePassword({ onBack, showToast }) {
  const { user } = useAuth();
  const [oldPass,   setOldPass]   = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [verified,  setVerified]  = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function verifyOldPassword() {
    if (!oldPass) return showToast("Enter your current password","error");
    setVerifying(true);
    const { error } = await supabase.auth.signInWithPassword({ email:user.email, password:oldPass });
    setVerifying(false);
    if (error) { showToast("Current password is incorrect","error"); setOldPass(""); return; }
    setVerified(true);
    showToast("Password verified!","success");
  }

  async function saveNewPassword() {
    if (!newPass)            return showToast("Enter a new password","error");
    if (newPass.length < 6)  return showToast("Must be at least 6 characters","error");
    if (newPass !== confirm)  return showToast("Passwords don't match","error");
    if (newPass === oldPass)  return showToast("New password must differ from old","error");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password:newPass });
    setSaving(false);
    if (error) return showToast(error.message||"Failed to update","error");
    showToast("Password updated!","success");
    onBack();
  }

  return (
    <div>
      <BackHeader title="Change Password" onBack={onBack} />
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:14, color:verified?C.success:C.text }}>
          {verified ? "✓ Current password verified" : "Step 1 — Verify your current password"}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={oldPass} onChange={e=>setOldPass(e.target.value)} type="password" placeholder="Current password" disabled={verified} style={inp({ flex:1, opacity:verified?0.5:1 })} />
          {!verified && (
            <button onClick={verifyOldPassword} disabled={verifying}
              style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"0 16px", color:C.text, cursor:"pointer", fontFamily:"sans-serif", fontWeight:700, fontSize:13, whiteSpace:"nowrap", opacity:verifying?0.7:1 }}>
              {verifying?"Checking...":"Verify"}
            </button>
          )}
        </div>
      </div>

      {verified && (
        <>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:24, marginBottom:16, display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Step 2 — Set your new password</div>
            <div>
              <span style={lbl}>NEW PASSWORD</span>
              <input value={newPass} onChange={e=>setNewPass(e.target.value)} type="password" placeholder="Min 6 characters" style={inp()} />
              {newPass.length>0&&newPass.length<6&&<div style={{ fontSize:11, color:C.error, marginTop:4 }}>Too short</div>}
            </div>
            <div>
              <span style={lbl}>CONFIRM NEW PASSWORD</span>
              <input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" placeholder="Repeat new password" style={inp()} />
              {confirm.length>0&&newPass!==confirm&&<div style={{ fontSize:11, color:C.error, marginTop:4 }}>Passwords don't match</div>}
              {confirm.length>0&&newPass===confirm&&newPass.length>=6&&<div style={{ fontSize:11, color:C.success, marginTop:4 }}>Passwords match</div>}
            </div>
          </div>
          <button onClick={saveNewPassword} disabled={saving} style={btnPrimary({ opacity:saving?0.7:1 })}>{saving?"Updating...":"Update Password"}</button>
        </>
      )}
    </div>
  );
}

// ── 4. DIETARY PREFS — saves to profiles ─────────────────────────────────────
function DietaryPrefs({ onBack, showToast }) {
  const { user, profile } = useAuth();
  const [prefs, setPrefs]       = useState({ vegetarian:false, vegan:false, halal:false, glutenFree:false, dairyFree:false, nutFree:false });
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (profile?.dietary_prefs) { try { setPrefs(JSON.parse(profile.dietary_prefs)); } catch {} }
    if (profile?.allergies)     setAllergies(profile.allergies);
  }, [profile]);

  async function save() {
    setSaving(true);
    const { error } = await updateProfile(user.id, { dietary_prefs:JSON.stringify(prefs), allergies:allergies.trim()||null });
    setSaving(false);
    if (error) return showToast(error.message||"Failed to save","error");
    showToast("Preferences saved!","success");
    onBack();
  }

  const items = [
    { key:"vegetarian", label:"Vegetarian", icon:"🥗" },
    { key:"vegan",      label:"Vegan",       icon:"🌱" },
    { key:"halal",      label:"Halal",        icon:"☪️" },
    { key:"glutenFree", label:"Gluten Free",  icon:"🌾" },
    { key:"dairyFree",  label:"Dairy Free",   icon:"🥛" },
    { key:"nutFree",    label:"Nut Free",     icon:"🥜" },
  ];

  return (
    <div>
      <BackHeader title="Dietary Preferences" onBack={onBack} />
      <Section title="Diet Type">
        {items.map((item,i) => (
          <Row key={item.key} icon={item.icon} label={item.label}
            right={<Toggle value={prefs[item.key]} onChange={()=>setPrefs(p=>({...p,[item.key]:!p[item.key]}))} />}
            last={i===items.length-1} />
        ))}
      </Section>
      <div style={{ marginTop:16 }}>
        <span style={lbl}>ALLERGIES & NOTES</span>
        <textarea value={allergies} onChange={e=>setAllergies(e.target.value)}
          placeholder="e.g. shellfish allergy, no onions..."
          style={{ ...inp(), height:90, resize:"none", paddingTop:12 }} />
      </div>
      <button onClick={save} disabled={saving} style={btnPrimary({ marginTop:16, opacity:saving?0.7:1 })}>{saving?"Saving...":"Save Preferences"}</button>
    </div>
  );
}

// ── 5. NOTIFICATIONS ──────────────────────────────────────────────────────────
function NotificationSettings({ onBack, notifs, setNotifs, showToast, user }) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await updateProfile(user.id, { notification_prefs:JSON.stringify(notifs) });
    setSaving(false);
    if (error) return showToast(error.message||"Failed to save","error");
    showToast("Notification settings saved!","success");
    onBack();
  }

  const items = [
    { key:"orderUpdates", icon:"🔔", label:"Order Updates",       sub:"Delivery status alerts" },
    { key:"promotions",   icon:"🎁", label:"Promotions & Deals",  sub:"Offers from restaurants" },
    { key:"emailNotifs",  icon:"📧", label:"Email Notifications", sub:"Receipts and newsletters" },
    { key:"smsAlerts",    icon:"📱", label:"SMS Alerts",          sub:"Text message updates" },
  ];

  return (
    <div>
      <BackHeader title="Notifications" onBack={onBack} />
      <Section title="Notification Types">
        {items.map((item,i) => (
          <Row key={item.key} icon={item.icon} label={item.label} sub={item.sub}
            right={<Toggle value={notifs[item.key]} onChange={()=>setNotifs(p=>({...p,[item.key]:!p[item.key]}))} />}
            last={i===items.length-1} />
        ))}
      </Section>
      <button onClick={save} disabled={saving} style={btnPrimary({ marginTop:20, opacity:saving?0.7:1 })}>{saving?"Saving...":"Save Settings"}</button>
    </div>
  );
}

// ── 6. HELP & SUPPORT ─────────────────────────────────────────────────────────
function HelpSupport({ onBack }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q:"How do I track my order?",        a:"Go to Orders in the bottom nav. Your live order status updates in real time once placed." },
    { q:"Can I cancel my order?",           a:"You can cancel before the restaurant starts preparing. Go to Orders → tap your order → Cancel." },
    { q:"What if my food arrives late?",    a:"Contact support via the chat button below. We'll investigate and offer a refund if applicable." },
    { q:"How do I get a refund?",           a:"Refunds are processed within 3-5 business days. Contact support with your order ID." },
    { q:"Can I change delivery address?",   a:"No — the delivery address is locked once the restaurant confirms your order." },
  ];
  return (
    <div>
      <BackHeader title="Help & Support" onBack={onBack} />
      <Section title="Frequently Asked Questions">
        {faqs.map((faq,i) => (
          <div key={i} style={{ borderBottom:i<faqs.length-1?`1px solid #1A1A1A`:"none" }}>
            <div onClick={()=>setOpen(open===i?null:i)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#161616"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:14, fontWeight:700, color:C.text, paddingRight:12 }}>{faq.q}</span>
              <span style={{ color:C.accent, fontSize:18, flexShrink:0, fontWeight:700 }}>{open===i?"−":"+"}</span>
            </div>
            {open===i && <div style={{ padding:"0 16px 14px", fontSize:13, color:C.muted, lineHeight:1.6 }}>{faq.a}</div>}
          </div>
        ))}
      </Section>
      <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { icon:"💬", label:"Live Chat",    sub:"Usually replies in 2 minutes",  color:C.success },
          { icon:"📞", label:"Call Support", sub:"+234 800 BIGBYT",               color:C.accent },
          { icon:"📧", label:"Email Us",     sub:"support@bigbyt.com",            color:"#F5A623" },
        ].map(item=>(
          <div key={item.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${item.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{item.icon}</div>
            <div><div style={{ fontWeight:700, fontSize:14 }}>{item.label}</div><div style={{ fontSize:12, color:C.muted }}>{item.sub}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleText({ title, onBack, content }) {
  return (
    <div>
      <BackHeader title={title} onBack={onBack} />
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.8 }}>{content}</p>
      </div>
    </div>
  );
}

// ── MAIN SETTINGS PAGE ────────────────────────────────────────────────────────
export default function Settings({ go }) {
  const { user, profile, logout } = useAuth();
  const [sub,   setSub]   = useState(null);
  const [toast, setToast] = useState(null);
  const [notifs, setNotifs] = useState({ orderUpdates:true, promotions:true, emailNotifs:false, smsAlerts:false });

  // Load saved notification prefs from profile
  useEffect(() => {
    if (profile?.notification_prefs) { try { setNotifs(JSON.parse(profile.notification_prefs)); } catch {} }
  }, [profile]);

  function showToast(msg, type="info") {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 2500);
  }

  async function handleLogout() { await logout(); go("landing"); }

  const name     = profile?.full_name || user.email?.split("@")[0].slice(0,5)+'...' || "User";
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const wrap = children => (
    <div style={{ fontFamily:"sans-serif", color:C.text, maxWidth:600, margin:"0 auto", padding:"0 16px 100px" }}>
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, background:toast.type==="error"?C.error:C.success, color:"#fff", padding:"10px 18px", borderRadius:10, fontWeight:700, fontSize:13, zIndex:9999 }}>{toast.msg}</div>
      )}
      {children}
    </div>
  );

  const back = () => setSub(null);

  if (sub==="edit-profile")    return wrap(<EditProfile       onBack={back} showToast={showToast} />);
  if (sub==="addresses")       return wrap(<SavedAddresses    onBack={back} showToast={showToast} />);
  if (sub==="change-password") return wrap(<ChangePassword    onBack={back} showToast={showToast} />);
  if (sub==="dietary")         return wrap(<DietaryPrefs      onBack={back} showToast={showToast} />);
  if (sub==="notifications")   return wrap(<NotificationSettings onBack={back} notifs={notifs} setNotifs={setNotifs} showToast={showToast} user={user} />);
  if (sub==="help")            return wrap(<HelpSupport        onBack={back} />);
  if (sub==="terms")           return wrap(<SimpleText onBack={back} title="Terms of Service" content="By using Bigbyt you agree to our terms of service. You must be 18 or older to use this platform. Orders are subject to restaurant availability. Bigbyt acts as a marketplace and is not responsible for food quality. Refunds are handled on a case by case basis." />);
  if (sub==="privacy")         return wrap(<SimpleText onBack={back} title="Privacy Policy"   content="Bigbyt collects your name, email, phone, location, and order data to provide the delivery service. We do not sell your data to third parties. Payment details are processed securely and never stored on our servers. You may request deletion of your data at any time." />);

  return wrap(
    <>
      <div style={{ padding:"32px 8px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", flexShrink:0 }}>
                 {profile?.avatar_url ? ( 
  <img src={profile.avatar_url} alt="avatar"
    style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${C.accent}` }} />
) : (
  <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
    {initials}
  </div>
)}
            </div>
          <div>
            <div style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>{name}</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{user?.email}</div>
            <div style={{ display:"inline-flex", alignItems:"center", marginTop:6, background:`${C.accent}18`, border:`1px solid ${C.accent}44`, borderRadius:6, padding:"3px 10px" }}>
              <span style={{ fontSize:10, color:C.accent, fontWeight:700 }}>MEMBER SINCE 2026</span>
            </div>
          </div>
        </div>
      </div>

      <Section title="Account">
        <Row icon="👤" label="Edit Profile"      sub={`${name} · ${user?.email}`}     onClick={()=>setSub("edit-profile")} />
        <Row icon="📍" label="Saved Addresses"   sub="Manage delivery locations"       onClick={()=>setSub("addresses")} />
        <Row icon="💳" label="Payment Methods"   sub="Manage your cards"               onClick={()=>showToast("Payment methods coming soon","info")} />
        <Row icon="🔒" label="Change Password"   sub="Update your password"            onClick={()=>setSub("change-password")} last />
      </Section>

      <Section title="Orders">
        <Row icon="📦" label="Order History"         sub="View all past orders"        onClick={()=>go("orders")} />
        <Row icon="⭐" label="My Reviews"            sub="Ratings you've submitted"    onClick={()=>showToast("Reviews coming soon","info")} />
        <Row icon="❤️" label="Favourite Restaurants" sub="Saved spots"                 onClick={()=>go("restaurants")} last />
      </Section>

      <Section title="Notifications">
        <Row icon="🔔" label="Notification Settings"
          sub={`${Object.values(notifs).filter(Boolean).length} of ${Object.keys(notifs).length} enabled`}
          onClick={()=>setSub("notifications")} last />
      </Section>

      <Section title="Preferences">
        <Row icon="📍" label="Location"            sub="MOLYKO, BUEA"          onClick={()=>showToast("Location settings coming soon","info")} />
        <Row icon="🌍" label="Language"            sub="English"                       onClick={()=>showToast("Language settings coming soon","info")} />
        <Row icon="💰" label="Currency"            sub="FRANCS (FCFA)"                       onClick={()=>showToast("Currency settings coming soon","info")} />
        <Row icon="🥗" label="Dietary Preferences" sub="Halal, no known allergies"     onClick={()=>setSub("dietary")} last />
      </Section>

      <Section title="Support">
        <Row icon="💬" label="Help & Support"   sub="FAQs and contact us"              onClick={()=>setSub("help")} />
        <Row icon="📄" label="Terms of Service" sub="Legal agreements"                 onClick={()=>setSub("terms")} />
        <Row icon="🔏" label="Privacy Policy"   sub="How we use your data"             onClick={()=>setSub("privacy")} />
        <Row icon="⭐" label="Rate Bigbyt"      sub="Leave a review on the app store"  onClick={()=>showToast("Thanks for the love! 🔥","success")} last />
        <Row icon="🔐" label="Admin Panel" sub="Platform management" onClick={() => go("admin")} />
      </Section>

      <Section title="Danger Zone">
        <Row icon="🗑️" iconBg="#1A0A0A" label="Delete Account" sub="Permanently remove your data"
          danger last onClick={()=>{ if(window.confirm("Are you sure? This cannot be undone.")) showToast("Account deletion coming soon","error"); }} />
      </Section>

      <div onClick={handleLogout}
        style={{ margin:"16px 0", borderRadius:14, background:"#1A0A00", border:`1px solid ${C.accent}33`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}
        onMouseEnter={e=>e.currentTarget.style.background="#220D00"}
        onMouseLeave={e=>e.currentTarget.style.background="#1A0A00"}>
        <span style={{ fontSize:16 }}>🚪</span>
        <span style={{ fontSize:14, fontWeight:800, color:C.accent }}>Log Out</span>
      </div>

      <div style={{ textAlign:"center", padding:16, fontSize:11, color:"#333", fontFamily:"'DM Mono',monospace" }}>Bigbyt v1.0.0 · Build 2026</div>
    </>
  );
}