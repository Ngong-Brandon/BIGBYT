// src/pages/AdminAdverts.jsx
// ─── Admin: create and manage in-app advertisement banners ───────────────────
import { useState, useEffect } from "react";
import {
  getAllAdverts, createAdvert, updateAdvert,
  deactivateAdvert, deleteAdvert, daysRemaining, isExpired,
} from "../services/advertisementService";
import { getAdminRestaurants } from "../services/AdminService";
import ImageUpload from "../components/ImageUpload";
import AppImage from "../components/AppImage";

const A = {
  bg: "#080808", surface: "#111111", card: "#161616",
  border: "#1E1E1E", accent: "#FF4500", text: "#F0EBE1",
  muted: "#6B6860", success: "#00C48C", error: "#FF4560", warning: "#F5A623",
};

// Preset color themes for adverts
const THEMES = [
  { label: "Fire",   bg: "#1A0800", border: "#FF450033", ctaBg: "#FF4500", ctaColor: "#fff",    accent: "#FF4500" },
  { label: "Forest", bg: "#0A1200", border: "#00C48C33", ctaBg: "#00C48C", ctaColor: "#fff",    accent: "#00C48C" },
  { label: "Gold",   bg: "#0A0800", border: "#F5A62333", ctaBg: "#F5A623", ctaColor: "#1A0A00", accent: "#F5A623" },
  { label: "Ocean",  bg: "#000A1A", border: "#378ADD33", ctaBg: "#378ADD", ctaColor: "#fff",    accent: "#378ADD" },
  { label: "Rose",   bg: "#1A000A", border: "#FF456033", ctaBg: "#FF4560", ctaColor: "#fff",    accent: "#FF4560" },
];

const ICONS = ["🔥","🎁","⚡","🌟","💥","🎉","🍕","🍔","🍜","🥗","🍝","🌮","🥩","🍣","💰","🛵"];

const EMPTY_FORM = {
  title: "", subtitle: "", cta_label: "Order Now",
  icon: "🔥", image_url: "",
  bg_color: "#1A0800", border_color: "#FF450033",
  cta_bg: "#FF4500", cta_text_color: "#fff", accent_color: "#FF4500",
  target_restaurant_id: "",
  days: 7, // how many days the advert runs
  is_active: true,
};

function inp(extra = {}) {
  return {
    background: A.card, border: `1px solid ${A.border}`, borderRadius: 9,
    padding: "9px 13px", color: A.text, fontFamily: "'Syne',sans-serif",
    fontSize: 13, outline: "none", width: "100%", ...extra,
  };
}

function Lbl({ children }) {
  return <div style={{ fontSize: 11, color: A.muted, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5 }}>{children}</div>;
}

function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>;
}

// Live preview of what the advert looks like
function AdvertPreview({ form }) {
  return (
    <div style={{ background: form.bg_color, border: `1px solid ${form.border_color}`, borderRadius: 18, padding: "18px 20px", position: "relative", overflow: "hidden", minHeight: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: form.accent_color, letterSpacing: 2, marginBottom: 8 }}>PROMOTION</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: A.text, marginBottom: 4 }}>{form.title || "Your Ad Title"}</div>
      <div style={{ fontSize: 13, color: A.muted, marginBottom: 14 }}>{form.subtitle || "Your ad subtitle goes here"}</div>
      <div style={{ background: form.cta_bg, display: "inline-block", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: form.cta_text_color }}>
        {form.cta_label || "Order Now"}
      </div>
      <div style={{ position: "absolute", right: 14, top: 14, fontSize: 44, opacity: 0.15 }}>{form.icon}</div>
      {form.days > 0 && (
        <div style={{ position: "absolute", bottom: 12, right: 14, fontSize: 10, color: A.muted }}>
          Runs {form.days} day{form.days !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

export default function AdminAdverts() {
  const [adverts,      setAdverts]      = useState([]);
  const [restaurants,  setRestaurants]  = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null); // advert id being edited
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [filter,       setFilter]       = useState("all"); // all | active | expired

  useEffect(() => {
    load();
    getAdminRestaurants().then(({ restaurants }) => setRestaurants(restaurants || []));
  }, []);

  async function load() {
    const { adverts } = await getAllAdverts();
    setAdverts(adverts);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  function applyTheme(theme) {
    setForm(p => ({
      ...p,
      bg_color:       theme.bg,
      border_color:   theme.border,
      cta_bg:         theme.ctaBg,
      cta_text_color: theme.ctaColor,
      accent_color:   theme.accent,
    }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(advert) {
    const daysLeft = Math.ceil((new Date(advert.expires_at) - new Date(advert.starts_at)) / (1000 * 60 * 60 * 24));
    setForm({
      title:                advert.title,
      subtitle:             advert.subtitle || "",
      cta_label:            advert.cta_label || "Order Now",
      icon:                 advert.icon || "🔥",
      image_url:            advert.image_url || "",
      bg_color:             advert.bg_color,
      border_color:         advert.border_color,
      cta_bg:               advert.cta_bg,
      cta_text_color:       advert.cta_text_color,
      accent_color:         advert.accent_color,
      target_restaurant_id: advert.target_restaurant_id || "",
      days:                 daysLeft || 7,
      is_active:            advert.is_active,
    });
    setEditTarget(advert.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim())  return showToast("Title is required", "error");
    if (!form.days || form.days < 1) return showToast("Duration must be at least 1 day", "error");

    setSaving(true);

    const startsAt  = new Date();
    const expiresAt = new Date(startsAt.getTime() + form.days * 24 * 60 * 60 * 1000);

    const payload = {
      title:                form.title.trim(),
      subtitle:             form.subtitle.trim() || null,
      cta_label:            form.cta_label.trim() || "Order Now",
      icon:                 form.icon,
      image_url:            form.image_url || null,
      bg_color:             form.bg_color,
      border_color:         form.border_color,
      cta_bg:               form.cta_bg,
      cta_text_color:       form.cta_text_color,
      accent_color:         form.accent_color,
      target_restaurant_id: form.target_restaurant_id || null,
      starts_at:            startsAt.toISOString(),
      expires_at:           expiresAt.toISOString(),
      is_active:            form.is_active,
    };

    if (editTarget) {
      const { error } = await updateAdvert(editTarget, payload);
      if (error) { showToast(error.message || "Failed to update", "error"); }
      else { showToast("Advert updated ✓"); }
    } else {
      const { error } = await createAdvert(payload);
      if (error) { showToast(error.message || "Failed to create", "error"); }
      else { showToast("Advert created and live ✓"); }
    }

    setSaving(false);
    setShowForm(false);
    setEditTarget(null);
    load();
  }

  async function handleDeactivate(advert) {
    await deactivateAdvert(advert.id);
    showToast(`"${advert.title}" deactivated`);
    load();
  }

  async function handleDelete(advert) {
    if (!window.confirm(`Delete "${advert.title}"? This cannot be undone.`)) return;
    await deleteAdvert(advert.id);
    showToast(`"${advert.title}" deleted`);
    load();
  }

  const filtered = adverts.filter(a => {
    if (filter === "active")  return a.is_active && !isExpired(a.expires_at);
    if (filter === "expired") return !a.is_active || isExpired(a.expires_at);
    return true;
  });

  return (
    <div style={{ fontFamily: "'Syne',sans-serif", color: A.text }}>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? A.error : A.success, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 2000 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: A.text, marginBottom: 3 }}>Advertisements</h1>
        <div style={{ fontSize: 12, color: A.muted }}>Create in-app promo banners shown on the home screen</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 8 }}>
          {[["all","All"],["active","Active"],["expired","Expired"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{ background: filter === key ? `${A.accent}18` : "transparent", border: `1px solid ${filter === key ? A.accent : A.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: filter === key ? A.accent : A.muted, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={openCreate}
          style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
          + New Advert
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>{editTarget ? "Edit Advert" : "New Advert"}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Left — form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>

              {/* Icon picker */}
              <div>
                <Lbl>ICON</Lbl>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ICONS.map(ic => (
                    <div key={ic} onClick={() => set("icon", ic)}
                      style={{ width: 36, height: 36, borderRadius: 9, background: form.icon === ic ? `${A.accent}22` : A.card, border: `1.5px solid ${form.icon === ic ? A.accent : A.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>
                      {ic}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Lbl>TITLE *</Lbl>
                <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="30% off Burgers tonight!" style={inp()} />
              </div>

              <div>
                <Lbl>SUBTITLE</Lbl>
                <input value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Valid for orders above $15" style={inp()} />
              </div>

              <div>
                <Lbl>BUTTON LABEL</Lbl>
                <input value={form.cta_label} onChange={e => set("cta_label", e.target.value)} placeholder="Order Now" style={inp()} />
              </div>

              <div>
                <Lbl>DURATION (days) *</Lbl>
                <input value={form.days} onChange={e => set("days", parseInt(e.target.value) || 1)} type="number" min="1" max="365" style={inp()} />
                <div style={{ fontSize: 11, color: A.muted, marginTop: 4 }}>
                  Expires: {new Date(Date.now() + (form.days || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              <div>
                <Lbl>TARGET RESTAURANT (optional)</Lbl>
                <select value={form.target_restaurant_id} onChange={e => set("target_restaurant_id", e.target.value)} style={inp()}>
                  <option value="">→ Go to all restaurants</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: A.muted, marginTop: 4 }}>
                  If selected, tapping the advert opens that restaurant directly
                </div>
              </div>

              {/* Color theme presets */}
              <div>
                <Lbl>COLOR THEME</Lbl>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {THEMES.map(theme => (
                    <div key={theme.label} onClick={() => applyTheme(theme)}
                      style={{ background: theme.bg, border: `2px solid ${form.bg_color === theme.bg ? theme.accent : theme.border}`, borderRadius: 9, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: theme.accent }}>
                      {theme.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advert image */}
              <div>
                <Lbl>ADVERT IMAGE (optional)</Lbl>
                <ImageUpload
                  bucket="restaurants"
                  folder="adverts"
                  currentUrl={form.image_url}
                  onUpload={url => set("image_url", url)}
                  shape="wide"
                  label="Upload banner image"
                />
              </div>
            </div>

            {/* Right — live preview */}
            <div>
              <Lbl>LIVE PREVIEW</Lbl>
              <AdvertPreview form={form} />
              <div style={{ marginTop: 12, fontSize: 12, color: A.muted, lineHeight: 1.6 }}>
                This is how it will appear on the home screen. Tap anywhere on the banner will take users to {form.target_restaurant_id ? restaurants.find(r => r.id === form.target_restaurant_id)?.name || "the selected restaurant" : "the restaurants page"}.
              </div>

              {/* Active toggle */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, background: A.card, border: `1px solid ${A.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div onClick={() => set("is_active", !form.is_active)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: form.is_active ? A.accent : "#333", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: form.is_active ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>Active</div>
                  <div style={{ fontSize: 11, color: A.muted }}>{form.is_active ? "Will show on home screen" : "Hidden from users"}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${A.border}` }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Syne',sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : editTarget ? "Update Advert" : "Create Advert"}
            </button>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }}
              style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 10, padding: "11px 20px", color: A.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Advert list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: A.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 6 }}>No adverts yet</div>
          <div style={{ fontSize: 13 }}>Create your first advert to show promotions on the home screen</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(advert => {
            const expired  = isExpired(advert.expires_at);
            const days     = daysRemaining(advert.expires_at);
            const active   = advert.is_active && !expired;

            return (
              <div key={advert.id} style={{ background: A.surface, border: `1px solid ${expired ? A.border : advert.border_color}`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

                  {/* Mini preview */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ background: advert.bg_color, border: `1px solid ${advert.border_color}`, borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden", opacity: expired || !advert.is_active ? 0.5 : 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: advert.accent_color, letterSpacing: 2, marginBottom: 5 }}>PROMOTION</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: A.text, marginBottom: 3 }}>{advert.title}</div>
                      {advert.subtitle && <div style={{ fontSize: 12, color: A.muted }}>{advert.subtitle}</div>}
                      <div style={{ position: "absolute", right: 10, top: 10, fontSize: 32, opacity: 0.15 }}>{advert.icon}</div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 140 }}>
                    <Badge
                      label={expired ? "Expired" : advert.is_active ? `${days}d left` : "Inactive"}
                      color={expired ? A.error : advert.is_active ? A.success : A.muted}
                      bg={expired ? "#FF456018" : advert.is_active ? "#00C48C18" : "#1A1A1A"}
                    />
                    <div style={{ fontSize: 11, color: A.muted, textAlign: "right" }}>
                      <div>Created {new Date(advert.created_at).toLocaleDateString()}</div>
                      <div>Expires {new Date(advert.expires_at).toLocaleDateString()}</div>
                    </div>
                    {advert.restaurant && (
                      <div style={{ fontSize: 11, color: A.muted }}>
                        → {advert.restaurant.emoji} {advert.restaurant.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.border}`, flexWrap: "wrap" }}>
                  <button onClick={() => openEdit(advert)}
                    style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: A.muted, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                    Edit
                  </button>
                  {active && (
                    <button onClick={() => handleDeactivate(advert)}
                      style={{ background: "none", border: `1px solid ${A.warning}44`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: A.warning, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                      Deactivate
                    </button>
                  )}
                  <button onClick={() => handleDelete(advert)}
                    style={{ background: "none", border: `1px solid ${A.error}44`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: A.error, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}