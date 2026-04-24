// src/pages/AdminRiders.jsx
// ─── Admin: manage riders and assign deliveries ───────────────────────────────
import { useState, useEffect } from "react";
import {
  getAllRiders, createRider, updateRider,
  assignRiderToOrder, getOrdersForDispatch,
} from "../services/riderService";

const A = {
  bg: "#080808", surface: "#111111", card: "#161616",
  border: "#1E1E1E", accent: "#FF4500", text: "#F0EBE1",
  muted: "#6B6860", success: "#00C48C", error: "#FF4560", warning: "#F5A623",
};

function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>;
}

function inp(extra = {}) {
  return { background: A.card, border: `1px solid ${A.border}`, borderRadius: 9, padding: "9px 13px", color: A.text, fontFamily: "sans-serif", fontSize: 13, outline: "none", width: "100%", ...extra };
}

function Lbl({ children }) {
  return <div style={{ fontSize: 11, color: A.muted, marginBottom: 5, fontWeight: 700 }}>{children}</div>;
}

const EMPTY_RIDER = { full_name: "", phone: "", email: "", zone: "" };
const STATUS_LABELS = {
  pending:    { label: "Pending",    color: A.muted,   bg: "#1A1A1A" },
  confirmed:  { label: "Confirmed",  color: "#378ADD", bg: "#378ADD18" },
  preparing:  { label: "Preparing",  color: A.warning, bg: "#F5A62318" },
  on_the_way: { label: "On the Way", color: A.accent,  bg: "#FF450018" },
};

export default function AdminRiders() {
  const [riders,       setRiders]       = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_RIDER);
  const [saving,       setSaving]       = useState(false);
  const [copiedId,     setCopiedId]     = useState(null);
  const [toast,        setToast]        = useState(null);
  const [assignModal,  setAssignModal]  = useState(null); // order being assigned
  const [selectedRider, setSelectedRider] = useState("");
  const [assigning,    setAssigning]    = useState(false);
  const [tab,          setTab]          = useState("riders"); // riders | dispatch

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ riders: r }, { orders: o }] = await Promise.all([
      getAllRiders(),
      getOrdersForDispatch(),
    ]);
    setRiders(r || []);
    setOrders(o || []);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  function openCreate() { setForm(EMPTY_RIDER); setEditTarget(null); setShowForm(true); }
  function openEdit(r)  { setForm({ full_name: r.full_name, phone: r.phone, email: r.email || "", zone: r.zone || "" }); setEditTarget(r.id); setShowForm(true); }

  async function handleSave() {
    if (!form.full_name || !form.phone) return showToast("Name and phone are required", "error");
    setSaving(true);
    if (editTarget) {
      const { error } = await updateRider(editTarget, form);
      if (error) showToast(error.message, "error");
      else showToast("Rider updated ✓");
    } else {
      const { error } = await createRider(form);
      if (error) showToast(error.message, "error");
      else showToast("Rider added ✓");
    }
    setSaving(false);
    setShowForm(false);
    setEditTarget(null);
    load();
  }

  function copyLink(rider) {
    const link = `${appUrl}/rider?token=${rider.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(rider.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast("Link copied to clipboard ✓");
    });
  }

  async function handleAssign() {
    if (!selectedRider) return showToast("Select a rider", "error");
    const chosen = riders.find(r => r.id === selectedRider);
    if (!chosen?.is_online) return showToast("This rider is offline. Select an online rider.", "error");
    setAssigning(true);
    const { error } = await assignRiderToOrder(assignModal.id, selectedRider);
    setAssigning(false);
    if (error) return showToast(error.message, "error");
    showToast("Rider assigned ✓ — they will see this order on their phone");
    setAssignModal(null);
    setSelectedRider("");
    load();
  }

  const onlineRiders = riders.filter(r => r.is_online && r.is_active);
  const unassigned   = orders.filter(o => !o.rider);

  return (
    <div style={{ fontFamily: "sans-serif", color: A.text }}>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? A.error : A.success, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 2000 }}>
          {toast.msg}
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setAssignModal(null); }}>
          <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Assign Rider</div>
            <div style={{ fontSize: 13, color: A.muted, marginBottom: 20 }}>
              Order #{assignModal.id.slice(0, 8).toUpperCase()} → {assignModal.restaurant?.emoji} {assignModal.restaurant?.name}
            </div>

            <Lbl>SELECT RIDER</Lbl>
            <select value={selectedRider} onChange={e => setSelectedRider(e.target.value)} style={{ ...inp(), marginBottom: 6 }}>
              <option value="">Choose a rider...</option>
              {riders.filter(r => r.is_active).map(r => (
                <option key={r.id} value={r.id}>
                  {r.full_name} {r.is_online ? "🟢" : "🔴"} — {r.zone || "No zone"}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: A.muted, marginBottom: 20 }}>🟢 = Online and available</div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleAssign} disabled={assigning}
                style={{ flex: 1, background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "sans-serif", opacity: assigning ? 0.7 : 1 }}>
                {assigning ? "Assigning..." : "Assign Rider"}
              </button>
              <button onClick={() => setAssignModal(null)}
                style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 10, padding: "11px 16px", color: A.muted, cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: A.text, marginBottom: 3 }}>Riders & Dispatch</h1>
        <div style={{ fontSize: 12, color: A.muted }}>
          {onlineRiders.length} rider{onlineRiders.length !== 1 ? "s" : ""} online · {unassigned.length} order{unassigned.length !== 1 ? "s" : ""} awaiting assignment
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["riders","🛵 Riders"], ["dispatch","📦 Dispatch"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ background: tab === key ? `${A.accent}18` : "transparent", border: `1px solid ${tab === key ? A.accent : A.border}`, borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, color: tab === key ? A.accent : A.muted, cursor: "pointer", fontFamily: "sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── RIDERS TAB ─────────────────────────────────────────────────────── */}
      {tab === "riders" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={openCreate}
              style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "sans-serif" }}>
              + Add Rider
            </button>
          </div>

          {/* Create / Edit form */}
          {showForm && (
            <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{editTarget ? "Edit Rider" : "New Rider"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div><Lbl>FULL NAME *</Lbl><input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Kola Adeyemi" style={inp()} /></div>
                <div><Lbl>PHONE *</Lbl><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+234 801 234 5678" style={inp()} /></div>
                <div><Lbl>EMAIL</Lbl><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="rider@email.com" style={inp()} /></div>
                <div><Lbl>DELIVERY ZONE</Lbl><input value={form.zone} onChange={e => set("zone", e.target.value)} placeholder="Lekki, VI, Ikoyi..." style={inp()} /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "sans-serif", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Rider"}
                </button>
                <button onClick={() => { setShowForm(false); setEditTarget(null); }}
                  style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 10, padding: "10px 16px", color: A.muted, cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rider list */}
          {riders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: A.muted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 6 }}>No riders yet</div>
              <div style={{ fontSize: 13 }}>Add your first rider to start assigning deliveries</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {riders.map(r => {
                const riderLink = `${appUrl}/rider?token=${r.token}`;
                return (
                  <div key={r.id} style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${A.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: A.accent, flexShrink: 0 }}>
                          {r.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>{r.full_name}</div>
                          <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>📞 {r.phone}{r.zone ? ` · 📍 ${r.zone}` : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <Badge label={r.is_online ? "🟢 Online" : "🔴 Offline"} color={r.is_online ? A.success : A.muted} bg={r.is_online ? "#00C48C18" : "#1A1A1A"} />
                        <Badge label={r.is_active ? "Active" : "Inactive"} color={r.is_active ? A.success : A.error} bg={r.is_active ? "#00C48C18" : "#FF456018"} />
                      </div>
                    </div>

                    {/* Rider link */}
                    <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: A.muted, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>RIDER LINK — share this with the rider</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, fontSize: 12, color: A.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Mono',monospace" }}>
                          {riderLink}
                        </div>
                        <button onClick={() => copyLink(r)}
                          style={{ background: copiedId === r.id ? `${A.success}18` : A.surface, border: `1px solid ${copiedId === r.id ? A.success : A.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: copiedId === r.id ? A.success : A.muted, fontFamily: "sans-serif", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                          {copiedId === r.id ? "✓ Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(r)}
                        style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: A.muted, cursor: "pointer", fontFamily: "sans-serif" }}>
                        Edit
                      </button>
                      <button onClick={() => updateRider(r.id, { is_active: !r.is_active }).then(load)}
                        style={{ background: "none", border: `1px solid ${r.is_active ? A.error + "44" : A.success + "44"}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: r.is_active ? A.error : A.success, cursor: "pointer", fontFamily: "sans-serif" }}>
                        {r.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DISPATCH TAB ───────────────────────────────────────────────────── */}
      {tab === "dispatch" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button onClick={load}
              style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 9, padding: "7px 16px", color: A.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}>
              🔄 Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: A.muted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 6 }}>No active orders</div>
              <div style={{ fontSize: 13 }}>All orders are assigned or delivered</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map(order => {
                const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                return (
                  <div key={order.id} style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>
                          {order.restaurant?.emoji} {order.restaurant?.name}
                        </div>
                        <div style={{ fontSize: 12, color: A.muted }}>
                          👤 {order.user?.full_name} · 📍 {order.delivery_address?.slice(0, 40)}{order.delivery_address?.length > 40 ? "..." : ""}
                        </div>
                        <div style={{ fontSize: 11, color: A.muted, marginTop: 3, fontFamily: "'DM Mono',monospace" }}>
                          #{order.id.slice(0, 8).toUpperCase()} · ${Number(order.total).toFixed(2)}
                        </div>
                      </div>
                      <Badge label={s.label} color={s.color} bg={s.bg} />
                    </div>

                    {/* Rider assignment */}
                    {order.rider ? (
                      <div style={{ background: `${A.success}18`, border: `1px solid ${A.success}33`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🛵</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: A.success }}>{order.rider.full_name}</div>
                          <div style={{ fontSize: 11, color: A.muted }}>{order.rider.phone}</div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAssignModal(order); setSelectedRider(""); }}
                        style={{ background: `${A.accent}18`, border: `1px solid ${A.accent}44`, borderRadius: 10, padding: "10px 16px", width: "100%", fontSize: 13, fontWeight: 700, color: A.accent, cursor: "pointer", fontFamily: "sans-serif", textAlign: "center" }}>
                        + Assign Rider
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}