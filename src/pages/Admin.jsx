// src/pages/Admin.jsx
// ─── Full admin dashboard — every click wired ─────────────────────────────────
import { useState, useEffect } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats, getRecentOrders, getAllOrders,
  updateOrderStatus, getAdminRestaurants, toggleRestaurantOpen,
  getAdminMenuItems, toggleMenuItemAvailability,
  getAdminUsers, getAdminReviews, deleteReview, getAnalytics,
  createRestaurant, updateRestaurant, createMenuItem, updateMenuItem,
} from "../services/adminService";

const A = {
  bg: "#080808", sidebar: "#0D0D0D", surface: "#111111", card: "#161616",
  border: "#1E1E1E", accent: "#FF4500", text: "#F0EBE1", muted: "#6B6860",
  success: "#00C48C", error: "#FF4560", warning: "#F5A623", info: "#378ADD",
};

const ORDER_STATUS = {
  pending:    { label: "Pending",    color: A.warning, bg: "#F5A62318" },
  confirmed:  { label: "Confirmed",  color: A.info,    bg: "#378ADD18" },
  preparing:  { label: "Preparing",  color: A.warning, bg: "#F5A62318" },
  on_the_way: { label: "On the Way", color: A.accent,  bg: "#FF450018" },
  delivered:  { label: "Delivered",  color: A.success, bg: "#00C48C18" },
  cancelled:  { label: "Cancelled",  color: A.error,   bg: "#FF456018" },
};

// ─── Shared primitives ────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>;
}

function ActBtn({ label, onClick, danger, success, disabled }) {
  const color = danger ? A.error : success ? A.success : A.muted;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: "none", border: `1px solid ${color}33`, borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", color: disabled ? "#444" : color, fontFamily: "'Syne', sans-serif", transition: "all 0.15s" }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}11`; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.background = "none"; }}>
      {label}
    </button>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: A.text, marginBottom: 3 }}>{title}</h1>
      {sub && <div style={{ fontSize: 12, color: A.muted }}>{sub}</div>}
    </div>
  );
}

function Table({ headers, children, empty }) {
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ fontSize: 10, color: A.muted, fontWeight: 700, letterSpacing: 1, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${A.border}`, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div style={{ textAlign: "center", padding: "40px 0", color: A.muted, fontSize: 13 }}>{empty}</div>}
    </div>
  );
}

function Tr({ children }) {
  const [hov, setHov] = useState(false);
  return <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? "#0D0D0D" : "transparent" }}>{children}</tr>;
}

function Td({ children, mono, muted, accent, nowrap }) {
  return <td style={{ padding: "11px 14px", fontSize: 13, borderBottom: `1px solid #0D0D0D`, color: accent ? A.accent : muted ? A.muted : A.text, fontFamily: mono ? "'DM Mono', monospace" : "'Syne', sans-serif", fontWeight: accent ? 800 : 400, whiteSpace: nowrap ? "nowrap" : "normal" }}>{children}</td>;
}

function Inp({ label, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: A.muted, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 9, padding: "9px 13px", color: A.text, fontFamily: "'Syne', sans-serif", fontSize: 13, outline: "none", width: "100%", ...style }} />
    </div>
  );
}

function BtnPrimary({ label, onClick, loading, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif", opacity: loading ? 0.7 : 1, ...style }}>
      {loading ? "Saving..." : label}
    </button>
  );
}

function BtnGhost({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: "none", border: `1px solid ${A.border}`, borderRadius: 10, padding: "9px 18px", color: A.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
      {label}
    </button>
  );
}

function StatCard({ label, value, change, changeType }) {
  const changeColor = changeType === "up" ? A.success : changeType === "down" ? A.error : A.warning;
  const changeIcon  = changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→";
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 18, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: A.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: A.text, marginBottom: 4 }}>{value}</div>
      {change && <div style={{ fontSize: 11, color: changeColor }}>{changeIcon} {change}</div>}
    </div>
  );
}

// ─── MODAL wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: A.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: A.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel, danger }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{danger ? "⚠️" : "❓"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.text, marginBottom: 8 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <BtnGhost label="Cancel" onClick={onCancel} />
          <button onClick={onConfirm} style={{ background: danger ? A.error : A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  function show(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }
  const Toast = toast ? (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? A.error : A.success, color: "#fff", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 2000 }}>{toast.msg}</div>
  ) : null;
  return { show, Toast };
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function Dashboard({ onNav }) {
  const [stats, setStats]   = useState(null);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    getDashboardStats().then(s => setStats(s));
    getRecentOrders(5).then(({ orders }) => setOrders(orders));
  }, []);
  return (
    <div>
      <SectionTitle title="Dashboard" sub="Overview of today's activity" />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Today's Orders"  value={stats?.todayOrders  ?? "—"} change="vs yesterday" changeType="up" />
        <StatCard label="Today's Revenue" value={stats ? `$${stats.todayRevenue}` : "—"} change="vs yesterday" changeType="up" />
        <StatCard label="Total Users"     value={stats?.totalUsers   ?? "—"} change="platform total" changeType="none" />
        <StatCard label="Avg Delivery"    value="24 min" change="3 min faster" changeType="up" />
      </div>
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: A.text }}>Recent Orders</span>
          <span onClick={() => onNav("orders")} style={{ fontSize: 12, color: A.accent, cursor: "pointer", fontWeight: 700 }}>View all →</span>
        </div>
        <Table headers={["ORDER ID", "CUSTOMER", "RESTAURANT", "TOTAL", "STATUS", "ACTION"]}
          empty={orders.length === 0 ? "No orders yet" : null}>
          {orders.map(o => {
            const s = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
            return (
              <Tr key={o.id}>
                <Td mono muted>#{o.id.slice(0, 8).toUpperCase()}</Td>
                <Td>{o.user?.full_name || "Unknown"}</Td>
                <Td>{o.restaurant?.emoji} {o.restaurant?.name}</Td>
                <Td accent>${Number(o.total).toFixed(2)}</Td>
                <Td><Badge label={s.label} color={s.color} bg={s.bg} /></Td>
                <Td><ActBtn label="View" onClick={() => onNav("orders")} /></Td>
              </Tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}

function AdminOrders() {
  const { show, Toast } = useToast();
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    getAllOrders({ status: filter }).then(({ orders }) => { setOrders(orders); setLoading(false); });
  }, [filter]);

  async function changeStatus(orderId, status) {
    const { error } = await updateOrderStatus(orderId, status);
    if (error) return show("Failed to update status", "error");
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    show(`Order status → ${status.replace("_", " ")}`);
    setSelected(null);
  }

  const FILTERS = ["all", "pending", "confirmed", "preparing", "on_the_way", "delivered", "cancelled"];

  return (
    <div>
      {Toast}
      <SectionTitle title="Orders" sub="Manage and advance order status" />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? `${A.accent}18` : "transparent", border: `1px solid ${filter === f ? A.accent : A.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: filter === f ? A.accent : A.muted, cursor: "pointer", fontFamily: "'Syne', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: A.muted }}>Loading orders...</div>
      ) : (
        <Table headers={["ORDER", "CUSTOMER", "RESTAURANT", "TOTAL", "STATUS", "PLACED", "ACTIONS"]}
          empty={orders.length === 0 ? "No orders found" : null}>
          {orders.map(o => {
            const s = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
            return (
              <Tr key={o.id}>
                <Td mono muted>#{o.id.slice(0, 8).toUpperCase()}</Td>
                <Td>{o.user?.full_name || "Unknown"}</Td>
                <Td>{o.restaurant?.emoji} {o.restaurant?.name}</Td>
                <Td accent>${Number(o.total).toFixed(2)}</Td>
                <Td><Badge label={s.label} color={s.color} bg={s.bg} /></Td>
                <Td muted nowrap>{new Date(o.placed_at).toLocaleString()}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <ActBtn label="Details" onClick={() => setSelected(o)} />
                    {o.status === "confirmed"  && <ActBtn label="→ Preparing"  onClick={() => changeStatus(o.id, "preparing")} />}
                    {o.status === "preparing"  && <ActBtn label="→ On the Way" onClick={() => changeStatus(o.id, "on_the_way")} />}
                    {o.status === "on_the_way" && <ActBtn label="→ Delivered"  onClick={() => changeStatus(o.id, "delivered")} success />}
                    {["pending","confirmed","preparing"].includes(o.status) && <ActBtn label="Cancel" onClick={() => changeStatus(o.id, "cancelled")} danger />}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {/* Order detail modal */}
      {selected && (
        <Modal title={`Order #${selected.id.slice(0, 8).toUpperCase()}`} onClose={() => setSelected(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: A.muted, marginBottom: 4 }}>Customer</div>
                <div style={{ fontWeight: 700 }}>{selected.user?.full_name || "Unknown"}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: A.muted, marginBottom: 4 }}>Restaurant</div>
                <div style={{ fontWeight: 700 }}>{selected.restaurant?.emoji} {selected.restaurant?.name}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: A.muted, marginBottom: 4 }}>Delivery Address</div>
              <div style={{ fontSize: 13, color: A.text }}>{selected.delivery_address}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: A.muted, marginBottom: 8 }}>Items</div>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${A.border}`, fontSize: 13 }}>
                  <span>{item.qty}× {item.name}</span>
                  <span style={{ color: A.accent, fontWeight: 700 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontWeight: 800, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: A.accent }}>${Number(selected.total).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              {selected.status === "confirmed"  && <BtnPrimary label="→ Mark Preparing"  onClick={() => changeStatus(selected.id, "preparing")} />}
              {selected.status === "preparing"  && <BtnPrimary label="→ Mark On the Way" onClick={() => changeStatus(selected.id, "on_the_way")} />}
              {selected.status === "on_the_way" && <BtnPrimary label="→ Mark Delivered"  onClick={() => changeStatus(selected.id, "delivered")} />}
              {["pending","confirmed","preparing"].includes(selected.status) && (
                <button onClick={() => changeStatus(selected.id, "cancelled")}
                  style={{ background: `${A.error}18`, color: A.error, border: `1px solid ${A.error}44`, borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminRestaurants() {
  const { show, Toast } = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [modal, setModal]   = useState(null); // null | "add" | restaurant object
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const EMPTY_FORM = { name: "", cuisine_tags: "", neighborhood: "", city: "Lagos", emoji: "🍽️", delivery_time: "25–35 min", delivery_fee: "2.99", min_order: "8.00", description: "" };
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { getAdminRestaurants().then(({ restaurants }) => setRestaurants(restaurants)); }, []);

  function openAdd()  { setForm(EMPTY_FORM); setModal("add"); }
  function openEdit(r) {
    setForm({ ...r, cuisine_tags: r.cuisine_tags?.join(", ") || "", delivery_fee: String(r.delivery_fee), min_order: String(r.min_order) });
    setModal(r);
  }

  async function handleSave() {
    if (!form.name || !form.neighborhood || !form.city) return show("Name, neighborhood and city are required", "error");
    setSaving(true);
    const payload = { ...form, cuisine_tags: form.cuisine_tags.split(",").map(s => s.trim()).filter(Boolean), delivery_fee: parseFloat(form.delivery_fee) || 2.99, min_order: parseFloat(form.min_order) || 8 };

    if (modal === "add") {
      const { restaurant, error } = await createRestaurant(payload);
      if (error) { show(error.message, "error"); } else { setRestaurants(prev => [...prev, restaurant]); show("Restaurant added ✓"); }
    } else {
      const { restaurant, error } = await updateRestaurant(modal.id, payload);
      if (error) { show(error.message, "error"); } else { setRestaurants(prev => prev.map(r => r.id === modal.id ? restaurant : r)); show("Restaurant updated ✓"); }
    }
    setSaving(false);
    setModal(null);
  }

  async function handleToggle(r) {
    setConfirm({ message: `${r.is_open ? "Close" : "Open"} ${r.name}?`, danger: r.is_open, onConfirm: async () => {
      await toggleRestaurantOpen(r.id, !r.is_open);
      setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, is_open: !x.is_open } : x));
      show(`${r.name} is now ${r.is_open ? "closed" : "open"}`);
      setConfirm(null);
    }});
  }

  const FIELDS = [
    ["Name",          "name",          "Flames & Smoke"],
    ["Description",   "description",   "The best BBQ in the city"],
    ["Cuisine Tags",  "cuisine_tags",  "BBQ, Burgers (comma separated)"],
    ["Neighborhood",  "neighborhood",  "Lekki Phase 1"],
    ["City",          "city",          "Lagos"],
    ["Emoji",         "emoji",         "🔥"],
    ["Delivery Time", "delivery_time", "18–25 min"],
    ["Delivery Fee",  "delivery_fee",  "1.99"],
    ["Min Order",     "min_order",     "8.00"],
  ];

  return (
    <div>
      {Toast}
      {confirm && <Confirm message={confirm.message} danger={confirm.danger} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SectionTitle title="Restaurants" sub="Add, edit and manage restaurant listings" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <BtnPrimary label="+ Add Restaurant" onClick={openAdd} />
      </div>
      <Table headers={["RESTAURANT", "CUISINE", "NEIGHBORHOOD", "RATING", "STATUS", "ACTIONS"]}
        empty={restaurants.length === 0 ? "No restaurants yet" : null}>
        {restaurants.map(r => (
          <Tr key={r.id}>
            <Td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>{r.emoji}</span><span style={{ fontWeight: 700 }}>{r.name}</span></div></Td>
            <Td muted>{r.cuisine_tags?.join(" · ")}</Td>
            <Td muted>{r.neighborhood}</Td>
            <Td><span style={{ color: A.warning, fontWeight: 700 }}>⭐ {r.rating}</span></Td>
            <Td><Badge label={r.is_open ? "Open" : "Closed"} color={r.is_open ? A.success : A.error} bg={r.is_open ? "#00C48C18" : "#FF456018"} /></Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActBtn label="Edit" onClick={() => openEdit(r)} />
                <ActBtn label={r.is_open ? "Close" : "Open"} onClick={() => handleToggle(r)} danger={r.is_open} success={!r.is_open} />
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {modal && (
        <Modal title={modal === "add" ? "Add Restaurant" : `Edit — ${modal.name}`} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {FIELDS.map(([label, key, ph]) => (
              <div key={key} style={{ gridColumn: ["description", "cuisine_tags"].includes(key) ? "1 / -1" : "auto" }}>
                <Inp label={label} value={form[key] || ""} onChange={v => setForm(p => ({ ...p, [key]: v }))} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnPrimary label={modal === "add" ? "Create Restaurant" : "Save Changes"} onClick={handleSave} loading={saving} />
            <BtnGhost label="Cancel" onClick={() => setModal(null)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminMenuItems() {
  const { show, Toast } = useToast();
  const [items, setItems]         = useState([]);
  const [restaurants, setRests]   = useState([]);
  const [rFilter, setRFilter]     = useState("");
  const [modal, setModal]         = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [saving, setSaving]       = useState(false);

  const EMPTY_FORM = { name: "", description: "", price: "", emoji: "🍽️", restaurant_id: "", category_id: "", is_popular: false, is_available: true };
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    getAdminMenuItems().then(({ items }) => setItems(items));
    getAdminRestaurants().then(({ restaurants }) => setRests(restaurants));
  }, []);

  function openAdd()  { setForm(EMPTY_FORM); setModal("add"); }
  function openEdit(item) {
    setForm({ ...item, price: String(item.price), restaurant_id: item.restaurant_id || "" });
    setModal(item);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.restaurant_id) return show("Name, price and restaurant are required", "error");
    setSaving(true);
    const payload = {
  ...form,
  price:       parseFloat(form.price),
  category_id: form.category_id || null,  // ← convert empty string to null
  restaurant_id: form.restaurant_id || null,
};

    if (modal === "add") {
      const { item, error } = await createMenuItem(payload);
      if (error) { show(error.message, "error"); } else { setItems(prev => [...prev, item]); show("Item added ✓"); }
    } else {
      const { item, error } = await updateMenuItem(modal.id, payload);
      if (error) { show(error.message, "error"); } else { setItems(prev => prev.map(x => x.id === modal.id ? item : x)); show("Item updated ✓"); }
    }
    setSaving(false);
    setModal(null);
  }

  async function handleToggle(item) {
    setConfirm({ message: `${item.is_available ? "Hide" : "Show"} "${item.name}"?`, danger: item.is_available, onConfirm: async () => {
      await toggleMenuItemAvailability(item.id, !item.is_available);
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x));
      show(`"${item.name}" is now ${item.is_available ? "hidden" : "available"}`);
      setConfirm(null);
    }});
  }

  const filtered = rFilter ? items.filter(i => i.restaurant_id === rFilter) : items;

  return (
    <div>
      {Toast}
      {confirm && <Confirm message={confirm.message} danger={confirm.danger} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SectionTitle title="Menu Items" sub="Manage food items across all restaurants" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <select value={rFilter} onChange={e => setRFilter(e.target.value)}
          style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 9, padding: "8px 13px", color: A.text, fontFamily: "'Syne', sans-serif", fontSize: 13, outline: "none" }}>
          <option value="">All Restaurants</option>
          {restaurants.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
        </select>
        <BtnPrimary label="+ Add Item" onClick={openAdd} />
      </div>
      <Table headers={["ITEM", "RESTAURANT", "CATEGORY", "PRICE", "POPULAR", "STATUS", "ACTIONS"]}
        empty={filtered.length === 0 ? "No items found" : null}>
        {filtered.map(item => (
          <Tr key={item.id}>
            <Td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>{item.emoji}</span><span style={{ fontWeight: 700 }}>{item.name}</span></div></Td>
            <Td muted>{item.restaurant?.name}</Td>
            <Td muted>{item.category?.name || "—"}</Td>
            <Td accent>${Number(item.price).toFixed(2)}</Td>
            <Td>{item.is_popular ? <Badge label="⭐ Yes" color={A.warning} bg="#F5A62318" /> : <span style={{ color: A.muted, fontSize: 12 }}>No</span>}</Td>
            <Td><Badge label={item.is_available ? "Available" : "Hidden"} color={item.is_available ? A.success : A.error} bg={item.is_available ? "#00C48C18" : "#FF456018"} /></Td>
            <Td>
              <div style={{ display: "flex", gap: 5 }}>
                <ActBtn label="Edit" onClick={() => openEdit(item)} />
                <ActBtn label={item.is_available ? "Hide" : "Show"} onClick={() => handleToggle(item)} danger={item.is_available} success={!item.is_available} />
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {modal && (
        <Modal title={modal === "add" ? "Add Menu Item" : `Edit — ${modal.name}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Name"  value={form.name}  onChange={v => setForm(p => ({ ...p, name: v }))}  placeholder="Smash Burger Stack" />
              <Inp label="Price" value={form.price} onChange={v => setForm(p => ({ ...p, price: v }))} placeholder="14.99" type="number" />
              <Inp label="Emoji" value={form.emoji} onChange={v => setForm(p => ({ ...p, emoji: v }))} placeholder="🍔" />
              <div>
                <div style={{ fontSize: 11, color: A.muted, marginBottom: 5, fontWeight: 700 }}>Restaurant</div>
                <select value={form.restaurant_id} onChange={e => setForm(p => ({ ...p, restaurant_id: e.target.value }))}
                  style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 9, padding: "9px 13px", color: A.text, fontFamily: "'Syne', sans-serif", fontSize: 13, outline: "none", width: "100%" }}>
                  <option value="">Select restaurant</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                </select>
              </div>
            </div>
            <Inp label="Description" value={form.description || ""} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Double smash patty, special sauce..." />
            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: A.text }}>
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm(p => ({ ...p, is_popular: e.target.checked }))} />
                Mark as Popular
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: A.text }}>
                <input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} />
                Available
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnPrimary label={modal === "add" ? "Add Item" : "Save Changes"} onClick={handleSave} loading={saving} />
            <BtnGhost label="Cancel" onClick={() => setModal(null)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminUsers() {
  const { show, Toast } = useToast();
  const [users, setUsers]     = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { getAdminUsers().then(({ users }) => setUsers(users)); }, []);

  return (
    <div>
      {Toast}
      <SectionTitle title="Users" sub="View all registered users" />
      <Table headers={["USER", "JOINED", "DOB", "PHONE", "ACTION"]}
        empty={users.length === 0 ? "No users yet" : null}>
        {users.map(u => (
          <Tr key={u.id}>
            <Td>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${A.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: A.accent, flexShrink: 0 }}>
                  {(u.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontWeight: 700 }}>{u.full_name || "No name"}</span>
              </div>
            </Td>
            <Td muted>{new Date(u.created_at).toLocaleDateString()}</Td>
            <Td muted>{u.date_of_birth || "—"}</Td>
            <Td muted>{u.phone || "—"}</Td>
            <Td><ActBtn label="View" onClick={() => setSelected(u)} /></Td>
          </Tr>
        ))}
      </Table>

      {selected && (
        <Modal title="User Details" onClose={() => setSelected(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${A.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: A.accent }}>
                {(selected.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{selected.full_name}</div>
                <div style={{ fontSize: 12, color: A.muted }}>User ID: {selected.id.slice(0, 16)}…</div>
              </div>
            </div>
            {[
              ["Date of Birth", selected.date_of_birth || "—"],
              ["Phone",         selected.phone         || "—"],
              ["Joined",        new Date(selected.created_at).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${A.border}`, fontSize: 13 }}>
                <span style={{ color: A.muted }}>{label}</span>
                <span>{val}</span>
              </div>
            ))}
            <BtnGhost label="Close" onClick={() => setSelected(null)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminReviews() {
  const { show, Toast } = useToast();
  const [reviews, setReviews]   = useState([]);
  const [confirm, setConfirm]   = useState(null);
  const [filter, setFilter]     = useState("all");

  useEffect(() => { getAdminReviews().then(({ reviews }) => setReviews(reviews)); }, []);

  function handleDelete(review) {
    setConfirm({ message: `Remove review from "${review.user?.full_name}"?`, danger: true, onConfirm: async () => {
      const { error } = await deleteReview(review.id);
      if (error) return show("Failed to delete review", "error");
      setReviews(prev => prev.filter(r => r.id !== review.id));
      show("Review removed");
      setConfirm(null);
    }});
  }

  const filtered = reviews.filter(r => {
    if (filter === "low")  return r.rating <= 2;
    if (filter === "high") return r.rating >= 4;
    return true;
  });

  return (
    <div>
      {Toast}
      {confirm && <Confirm message={confirm.message} danger={confirm.danger} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <SectionTitle title="Reviews" sub="Moderate customer reviews across restaurants" />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all","All"],["high","4–5 Stars"],["low","1–2 Stars"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ background: filter === key ? `${A.accent}18` : "transparent", border: `1px solid ${filter === key ? A.accent : A.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: filter === key ? A.accent : A.muted, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: A.muted }}>No reviews</div>}
        {filtered.map(r => (
          <div key={r.id} style={{ background: A.surface, border: `1px solid ${r.rating <= 2 ? A.error + "44" : A.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.user?.full_name || "Anonymous"}</span>
                <span style={{ color: A.muted, fontSize: 12, marginLeft: 8 }}>→ {r.restaurant?.name}</span>
                {r.rating <= 2 && <Badge label="Low Rating" color={A.error} bg="#FF456018" style={{ marginLeft: 8 }} />}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: A.warning }}>{"⭐".repeat(r.rating)}</span>
                <span style={{ fontSize: 11, color: A.muted, fontFamily: "'DM Mono', monospace" }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#999", lineHeight: 1.6, marginBottom: 12 }}>"{r.comment}"</p>
            <div style={{ display: "flex", gap: 8 }}>
              <ActBtn label="Remove" onClick={() => handleDelete(r)} danger />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => { getAnalytics().then(d => setData(d)); }, []);
  return (
    <div>
      <SectionTitle title="Analytics" sub="Platform performance — last 30 days" />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total Orders (30d)"  value={data?.totalOrders  ?? "—"} changeType="none" />
        <StatCard label="Total Revenue (30d)" value={data ? `$${data.totalRevenue}` : "—"} changeType="none" />
      </div>
      {data?.topRestaurants?.length > 0 && (
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Top Restaurants by Orders</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.topRestaurants.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, width: 24 }}>{r.emoji}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{r.name}</span>
                <div style={{ flex: 2, background: "#1A1A1A", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: A.accent, width: `${r.pct}%`, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, color: A.accent, fontWeight: 700, width: 36, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{r.pct}%</span>
                <span style={{ fontSize: 11, color: A.muted, width: 60, textAlign: "right" }}>{r.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!data && <div style={{ textAlign: "center", padding: "40px 0", color: A.muted }}>Loading analytics...</div>}
    </div>
  );
}

function AdminSettings() {
  const { user } = useAuth();
  const { show, Toast } = useToast();
  const [config, setConfig] = useState({ name: "Bigbyt", city: "Lagos", tax: "8", fee: "2.99" });

  return (
    <div>
      {Toast}
      <SectionTitle title="Admin Settings" sub="Platform configuration" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Platform Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Inp label="Platform Name"    value={config.name} onChange={v => setConfig(p => ({ ...p, name: v }))} />
            <Inp label="Default City"     value={config.city} onChange={v => setConfig(p => ({ ...p, city: v }))} />
            <Inp label="Tax Rate (%)"     value={config.tax}  onChange={v => setConfig(p => ({ ...p, tax: v }))}  type="number" />
            <Inp label="Default Del. Fee" value={config.fee}  onChange={v => setConfig(p => ({ ...p, fee: v }))}  type="number" />
          </div>
          <BtnPrimary label="Save Changes" onClick={() => show("Settings saved ✓")} />
        </div>
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Admin Access</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${A.border}` }}>
            <div>
              <div style={{ fontWeight: 700 }}>{user?.email}</div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>Super Admin · Full access</div>
            </div>
            <Badge label="Super Admin" color={A.accent} bg={`${A.accent}18`} />
          </div>
          <div style={{ marginTop: 14 }}>
            <BtnPrimary label="+ Invite Admin" onClick={() => show("Invite feature coming soon", "error")} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV CONFIG ───────────────────────────────────────────────────────
const NAV = [
  { group: "OVERVIEW", items: [
    { key: "dashboard",   label: "Dashboard",  icon: "📊" },
    { key: "orders",      label: "Orders",      icon: "📦" },
    { key: "analytics",   label: "Analytics",   icon: "📈" },
  ]},
  { group: "MANAGE", items: [
    { key: "restaurants", label: "Restaurants", icon: "🍽️" },
    { key: "menu",        label: "Menu Items",  icon: "📋" },
    { key: "users",       label: "Users",        icon: "👥" },
  ]},
  { group: "SYSTEM", items: [
    { key: "reviews",     label: "Reviews",     icon: "⭐" },
    { key: "settings",    label: "Settings",    icon: "⚙️" },
  ]},
];

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function Admin({ go }) {
  const { isAdmin, loading } = useAdmin();
  const [active, setActive]  = useState("dashboard");

  if (loading) {
    return (
      <div style={{ background: A.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", color: A.muted }}>
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ background: A.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: A.text, marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 14, color: A.muted, marginBottom: 24 }}>You don't have admin privileges.</div>
        <button onClick={() => go("home")} style={{ background: A.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>← Back to App</button>
      </div>
    );
  }

  const SECTIONS = {
    dashboard:   <Dashboard onNav={setActive} />,
    orders:      <AdminOrders />,
    analytics:   <AdminAnalytics />,
    restaurants: <AdminRestaurants />,
    menu:        <AdminMenuItems />,
    users:       <AdminUsers />,
    reviews:     <AdminReviews />,
    settings:    <AdminSettings />,
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: A.bg, display: "flex", minHeight: "100vh", color: A.text }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: A.sidebar, borderRight: `1px solid ${A.border}`, flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${A.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: A.accent, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔥</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Bigbyt</div>
            <div style={{ fontSize: 9, color: A.accent, fontWeight: 700, letterSpacing: 2 }}>ADMIN</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div style={{ fontSize: 9, color: "#333", fontWeight: 700, letterSpacing: 2, padding: "10px 20px 6px", fontFamily: "'DM Mono', monospace" }}>{group.group}</div>
              {group.items.map(item => (
                <div key={item.key} onClick={() => setActive(item.key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: active === item.key ? A.accent : A.muted, background: active === item.key ? `${A.accent}12` : "transparent", borderLeft: `2px solid ${active === item.key ? A.accent : "transparent"}`, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (active !== item.key) { e.currentTarget.style.background = "#161616"; e.currentTarget.style.color = A.text; }}}
                  onMouseLeave={e => { if (active !== item.key) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = A.muted; }}}>
                  <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${A.border}` }}>
          <button onClick={() => go("home")} style={{ width: "100%", background: "none", border: `1px solid ${A.border}`, borderRadius: 9, padding: "9px 0", color: A.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            ← Back to App
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>
        {SECTIONS[active]}
      </div>
    </div>
  );
}