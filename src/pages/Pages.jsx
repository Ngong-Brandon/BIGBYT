//  src/pages/RestaurantMenu.jsx 
import { useState } from "react"; 
import { C } from "../constants/Colors"; 
import { useCart } from "../context/CartContext";  
import { useEffect } from "react"; 
import { useAuth } from "../context/AuthContext";
import AddressInput from "../components/AddressInput";
import { getAddresses } from "../services/addressService";
import { supabase } from "../lib/supabase";
import { subscribeToOrder } from "../services/orderService";
import DeliveryMap from "../components/DeliveryMap";

 
export function RestaurantMenu({ restaurant, go }) { 
  const { addToCart, removeFromCart, getItemInCart, cartCount, cartSubtotal } = useCart(); 
  const [menuCat, setMenuCat] = useState("All"); 
 
  const categories  = ["All", ...new Set(restaurant.menu.map(i => i.cat))]; 
  const filtered    = restaurant.menu.filter(i => menuCat === "All" || i.cat === menuCat); 
 
  return ( 
    <div style={{ maxWidth: 1050, margin: "0 auto", padding: "0 20px 60px" }}> 
      {/* Hero */} 
      <div style={{ background: C.surface, borderRadius: "0 0 24px 24px", padding: "32px 28px 28px", marginBottom: 32, border: `1px solid ${C.border}`, borderTop: "none" }}> 
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}> 
          <div style={{ width: 72, height: 72, background: C.card, borderRadius: 18, display: "flex", 
alignItems: "center", justifyContent: "center", fontSize: 38, border: `1px solid ${C.border}`, 
flexShrink: 0 }}> 
            {restaurant.emoji} 
          </div> 
          <div style={{ flex: 1, minWidth: 200 }}> 
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", 
marginBottom: 6 }}> 
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", color: C.text 
}}>{restaurant.name}</h1> 
              {!restaurant.open && <span style={{ background: C.errorDim, color: C.error, 
borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>CLOSED</span>} 
              {restaurant.tag && <span style={{ background: C.accentDim, color: C.accent, 
borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{restaurant.tag}</span>} 
            </div> 
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 14 }}>{restaurant.cuisine} · 
{restaurant.neighborhood}</p> 
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}> 
              { [
    ["⭐", restaurant.rating]
, ["⏱", restaurant.deliveryTime],
 ["🛵", `$${restaurant.deliveryFee} fee`],
  ["📦", `$${restaurant.minOrder} min order`]].map(([ic, val]) => ( <div key={val} style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ic} {val}</div> 
              )) } 
            </div> 
          </div> 
        </div> 
      </div> 
 
      {/* Category tabs */} 
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}> 
        {categories.map(cat => ( 
          <button key={cat} onClick={() => setMenuCat(cat)} style={{ 
            background: menuCat === cat ? C.accent : C.surface, 
            color: menuCat === cat ? "#fff" : C.muted, 
            border: `1.5px solid ${menuCat === cat ? C.accent : C.border}`, 
            borderRadius: 100, padding: "8px 18px", fontSize: 13, fontWeight: 700, 
            cursor: "pointer", fontFamily: "'Syne', sans-serif", transition: "all 0.15s", 
          }}> 
            {cat} 
          </button> 
        ))} 
      </div> 
 
      {/* Menu grid */} 
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", 
gap: 18 }}> 
        {filtered.map(item => { 
          const inCart = getItemInCart(restaurant.id, item.id); 
          return ( 
            <div key={item.id} className="card" style={{ background: C.card, border: `1px solid 
${C.border}`, borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 10, 
opacity: restaurant.open ? 1 : 0.5 }}> 
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}> 
                <span style={{ fontSize: 42 }}>{item.emoji}</span> 
                {item.popular && <span style={{ background: C.goldDim, color: C.gold, border: `1px 
solid ${C.gold}44`, borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 700 
}}>POPULAR</span>} 
              </div> 
              <div> 
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: C.text 
}}>{item.name}</div> 
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div> 
              </div> 
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", 
marginTop: "auto" }}> 
                <span style={{ color: C.accent, fontWeight: 800, fontSize: 20, fontFamily: "'DM Mono',monospace" }}>${item.price.toFixed(2)}</span> 
                {restaurant.open ? ( 
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}> 
                    {inCart && <> 
                      <button onClick={() => removeFromCart(inCart._key)} style={{ width: 30, height: 
30, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, 
cursor: "pointer", fontWeight: 800, fontSize: 16 }}>−</button> 
                      <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, minWidth: 
16, textAlign: "center", color: C.text }}>{inCart.qty}</span> 
                    </>} 
                    <button onClick={() => addToCart(item, restaurant)} style={{ width: 30, height: 30, 
borderRadius: 8, background: C.accent, border: "none", color: "#fff", cursor: "pointer", 
fontWeight: 800, fontSize: 16 }}>+</button> 
                  </div> 
                ) : <span style={{ color: C.error, fontSize: 12, fontWeight: 700 }}>Closed</span>} 
              </div> 
            </div> 
          ); 
        })} 
      </div> 
 
      {/* Floating cart */} 
      {cartCount > 0 && ( 
        <div onClick={() => go("cart")} style={{ position: "fixed", bottom: 24, left: "50%", transform: 
"translateX(-50%)", background: C.accent, color: "#fff", padding: "15px 30px", borderRadius: 16, 
fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 8px 32px ${C.accent}55`, 
zIndex: 200, display: "flex", gap: 14, alignItems: "center", whiteSpace: "nowrap" }}> 
          <span>
🛒
 View Cart ({cartCount})</span> 
          <span style={{ background: "#fff3", borderRadius: 8, padding: "3px 12px", fontFamily: 
"'DM Mono',monospace" }}>${cartSubtotal.toFixed(2)}</span> 
        </div> 
      )} 
    </div> 
  ); 
} 
 
 

// src/pages/Cart.jsx 

 
export function Cart({ go }) { 
  const { cart, cartSubtotal, cartRestaurant, addToCart, removeFromCart } = useCart(); 
  const deliveryFee = cartRestaurant?.deliveryFee || 2.99; 
  const tax         = cartSubtotal * 0.08; 
  const total       = cartSubtotal + deliveryFee + tax; 
 
  return ( 
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 20px" }}> 
      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8, color: 
C.text }}>Your Cart</h1> 
      {cart.length > 0 && <p style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>From: 
<strong style={{ color: C.text }}>{cart[0]?.restaurantName}</strong></p>} 
 
      {cart.length === 0 ? ( 
        <div style={{ textAlign: "center", padding: "64px 0" }}> 
          <div style={{ fontSize: 56, marginBottom: 14 }}>
🛒
</div> 
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.text }}>Cart is 
empty</div> 
          <button onClick={() => go("restaurants")} style={{ background: C.accent, color: "#fff", 
border: "none", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontFamily: 
"'Syne',sans-serif", fontWeight: 700, marginTop: 16, fontSize: 14 }}>Browse 
Restaurants</button> 
        </div> 
      ) : ( 
        <> 
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}> 
            {cart.map(item => ( 
              <div key={item._key} style={{ background: C.card, border: `1px solid ${C.border}`, 
borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}> 
                <span style={{ fontSize: 30 }}>{item.emoji}</span> 
                <div style={{ flex: 1 }}> 
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{item.name}</div> 
                  <div style={{ color: C.muted, fontSize: 12 }}>${item.price.toFixed(2)} each</div> 
                </div> 
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}> 
                  <button onClick={() => removeFromCart(item._key)} style={{ width: 28, height: 28, 
borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`, color: C.text, cursor: 
"pointer", fontWeight: 800, fontSize: 15 }}>−</button> 
                  <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 14, 
color: C.text }}>{item.qty}</span> 
                  <button onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, 
emoji: item.emoji, cat: item.cat, desc: item.desc }, RESTAURANTS.find(r => r.id === 
item.restaurantId))} style={{ width: 28, height: 28, borderRadius: 7, background: C.accent, 
border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 15 }}>+</button> 
                </div> 
                <span style={{ color: C.accent, fontWeight: 800, minWidth: 58, textAlign: "right", 
fontFamily: "'DM Mono',monospace", fontSize: 14 }}>${(item.price * item.qty).toFixed(2)}</span> 
              </div> 
            ))} 
          </div> 
 
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, 
padding: 24, marginBottom: 18 }}> 
            {[["Subtotal", `$${cartSubtotal.toFixed(2)}`], [`Delivery (${cartRestaurant?.name})`, 
`$${deliveryFee.toFixed(2)}`], ["Tax (8%)", `$${tax.toFixed(2)}`]].map(([l, v]) => ( 
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, 
fontSize: 14, color: C.muted }}> 
                <span>{l}</span><span style={{ color: C.text }}>{v}</span> 
              </div> 
            ))} 
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", 
justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}> 
              <span style={{ color: C.text }}>Total</span> 
              <span style={{ color: C.accent, fontFamily: "'DM Mono',monospace" 
}}>${total.toFixed(2)}</span> 
            </div> 
          </div> 
 
          <button onClick={() => go("checkout")} style={{ width: "100%", background: C.accent, 
color: "#fff", border: "none", padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800, 
cursor: "pointer", fontFamily: "'Syne', sans-serif" }}> 
            Proceed to Checkout → 
          </button> 
        </> 
      )} 
    </div> 
  ); 
} 
 
 



// src/pages/Checkout.jsx 

export function Checkout({ go, showToast, setCustomerLocation }) {
  const { cartSubtotal, cartRestaurant, checkout } = useCart();
  const { user } = useAuth();
 
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSaved,  setSelectedSaved]  = useState(null); // selected saved address id
  const [address,        setAddress]        = useState("");
  const [addressData,    setAddressData]    = useState(null);
  const [useNewAddress,  setUseNewAddress]  = useState(false);
  const [cardNum,        setCardNum]        = useState("");
  const [expiry,         setExpiry]         = useState("");
  const [cvv,            setCvv]            = useState("");
  const [placing,        setPlacing]        = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
 
  const deliveryFee = cartRestaurant?.delivery_fee || 2.99;
  const tax         = cartSubtotal * 0.08;
  const total       = cartSubtotal + deliveryFee + tax;
 
  // ── Load saved addresses on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoadingAddresses(false); return; }
    getAddresses(user.id).then(({ addresses }) => {
      const list = addresses || [];
      setSavedAddresses(list);
 
      // Auto-select default address if exists
      const def = list.find(a => a.is_default) || list[0];
      if (def) {
        setSelectedSaved(def.id);
        setAddress(`${def.address}, ${def.city}`);
      } else {
        // No saved addresses — go straight to new address input
        setUseNewAddress(true);
      }
      setLoadingAddresses(false);
    });
  }, [user?.id]);
 
  // ── When user picks a saved address ────────────────────────────────────────
  function handleSelectSaved(addr) {
    setSelectedSaved(addr.id);
    setAddress(`${addr.address}, ${addr.city}`);
    setAddressData(null); // no lat/lng for saved addresses unless stored
    setUseNewAddress(false);
  }
 
  // ── When user switches to typing a new address ──────────────────────────────
  function handleUseNew() {
    setSelectedSaved(null);
    setAddress("");
    setAddressData(null);
    setUseNewAddress(true);
  }
 
  async function placeOrder() {
    if (!address.trim())     return showToast("Select or enter a delivery address", "error");
    if (cardNum.length < 12) return showToast("Enter a valid card number", "error");
    if (!expiry || !cvv)     return showToast("Fill in payment details", "error");
 
    setPlacing(true);
 
    if (addressData && setCustomerLocation) {
      setCustomerLocation({ lat: addressData.lat, lng: addressData.lng, address });
    }
 
    const { order, error } = await checkout({
      deliveryAddress: address,
      paymentRef: null,
    });
 
    setPlacing(false);
 
    if (error) return showToast(error.message || "Order failed", "error");
    go("tracking");
  }
 
  const inp = (extra = {}) => ({
    width: "100%", background: C.card, border: `1.5px solid ${C.border}`,
    borderRadius: 10, padding: "14px 16px", color: C.text,
    fontFamily: "'Syne', sans-serif", fontSize: 15, outline: "none", ...extra,
  });
 
  const lbl = {
    display: "block", fontSize: 11, color: C.muted, fontWeight: 700,
    marginBottom: 10, letterSpacing: 1, fontFamily: "'DM Mono', monospace",
  };
 
  const iconForLabel = (label) => {
    const l = label?.toLowerCase();
    if (l === "home") return "🏠";
    if (l === "work") return "🏢";
    return "📍";
  };
 
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 20px 100px", fontFamily: "'Syne', sans-serif", color: C.text }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 32 }}>Checkout</h1>
 
      {/* ── Delivery Address ─────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, marginBottom: 18 }}>
        <label style={lbl}>📍 DELIVERY ADDRESS</label>
 
        {loadingAddresses ? (
          <div style={{ height: 52, background: C.card, borderRadius: 10, animation: "pulse 1.5s infinite" }} />
        ) : (
          <>
            {/* Saved addresses list */}
            {savedAddresses.length > 0 && !useNewAddress && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {savedAddresses.map(addr => {
                  const isSelected = selectedSaved === addr.id;
                  return (
                    <div key={addr.id} onClick={() => handleSelectSaved(addr)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: isSelected ? `${C.accent}18` : C.card, border: `1.5px solid ${isSelected ? C.accent : C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}>
 
                      {/* Radio dot */}
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}
                      </div>
 
                      {/* Icon */}
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{iconForLabel(addr.label)}</span>
 
                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: isSelected ? C.accent : C.text }}>{addr.label}</span>
                          {addr.is_default && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: `${C.accent}22`, color: C.accent, borderRadius: 5, padding: "2px 6px" }}>DEFAULT</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {addr.address}, {addr.city}
                        </div>
                      </div>
                    </div>
                  );
                })}
 
                {/* Use a different address button */}
                <button onClick={handleUseNew}
                  style={{ background: "none", border: `1.5px dashed ${C.border}`, borderRadius: 12, padding: "11px 16px", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                  + Use a different address
                </button>
              </div>
            )}
 
            {/* New address input — shown when no saved addresses or user clicked "different address" */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <div>
                <AddressInput
                  value={address}
                  onChange={setAddress}
                  onSelect={(data) => {
                    setAddress(data.address);
                    setAddressData(data);
                  }}
                  placeholder="Start typing your address..."
                />
 
                {/* Back to saved addresses */}
                {savedAddresses.length > 0 && (
                  <button onClick={() => {
                    setUseNewAddress(false);
                    const def = savedAddresses.find(a => a.is_default) || savedAddresses[0];
                    if (def) { setSelectedSaved(def.id); setAddress(`${def.address}, ${def.city}`); }
                  }}
                    style={{ background: "none", border: "none", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 10, padding: 0 }}>
                    ← Use a saved address
                  </button>
                )}
 
                {/* Confirmation */}
                {addressData && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: C.success }}>✓ Location confirmed</span>
                    <span style={{ fontSize: 12, color: C.muted }}>— {addressData.neighborhood || addressData.city}</span>
                  </div>
                )}
              </div>
            )}
 
            {/* Selected address confirmation */}
            {!useNewAddress && selectedSaved && address && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: C.success }}>✓ Delivering to:</span>
                <span style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</span>
              </div>
            )}
          </>
        )}
      </div>
 
      {/* ── Payment ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <label style={lbl}>💳 PAYMENT DETAILS</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="Card Number" style={{ ...inp(), fontFamily: "'DM Mono', monospace", letterSpacing: 3 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM / YY" style={{ ...inp(), fontFamily: "'DM Mono', monospace" }} />
            <input value={cvv}    onChange={e => setCvv(e.target.value.slice(0, 4))} placeholder="CVV" style={{ ...inp(), fontFamily: "'DM Mono', monospace" }} />
          </div>
        </div>
      </div>
 
      {/* ── Order Summary ─────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, marginBottom: 18 }}>
        {[
          ["Subtotal",                              `$${cartSubtotal.toFixed(2)}`],
          [`Delivery (${cartRestaurant?.name||""})`, `$${deliveryFee.toFixed(2)}`],
          ["Tax (8%)",                              `$${tax.toFixed(2)}`],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: C.muted }}>
            <span>{l}</span><span style={{ color: C.text }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
          <span>Total</span>
          <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>${total.toFixed(2)}</span>
        </div>
      </div>
 
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
 
      <button onClick={placeOrder} disabled={placing}
        style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", opacity: placing ? 0.7 : 1 }}>
        {placing ? "Placing Order..." : "🔥 Place Order"}
      </button>
    </div>
  );
}

 


// src/pages/Tracking.jsx
// ─── Order tracking with live map + real-time rider location ──────────────────



const STAGES = [
  { key: "confirmed",  label: "Order Confirmed", sub: "We've received your order" },
  { key: "preparing",  label: "Preparing",        sub: "Kitchen is on it" },
  { key: "on_the_way", label: "On the Way",       sub: "Rider heading to you" },
  { key: "delivered",  label: "Delivered",        sub: "Bon appétit!" },
];

const STATUS_INDEX = { confirmed: 0, preparing: 1, on_the_way: 2, delivered: 3 };

export function Tracking({ go, orderId, customerLocation }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [orderStatus, setOrderStatus] = useState("confirmed");
  const [riderLocation, setRiderLocation] = useState(null);
  const [showMap, setShowMap] = useState(true);

  // ── Subscribe to real-time order status via Supabase ──────────────────────
  useEffect(() => {
    if (!orderId) {
      // Demo mode — simulate progression
      [1, 2, 3].forEach((s, i) => {
        setTimeout(() => {
          const statuses = ["preparing", "on_the_way", "delivered"];
          setStageIndex(s);
          setOrderStatus(statuses[s - 1]);
          if (statuses[s - 1] === "on_the_way") {
            // Simulate rider moving toward customer
            simulateRiderMovement(customerLocation);
          }
        }, (i + 1) * 5000);
      });
      return;
    }

    // Real mode — subscribe to Supabase realtime
    const channel = subscribeToOrder(orderId, (updatedOrder) => {
      const idx = STATUS_INDEX[updatedOrder.status] ?? 0;
      setStageIndex(idx);
      setOrderStatus(updatedOrder.status);

      // Update rider location if available
      if (updatedOrder.rider_lat && updatedOrder.rider_lng) {
        setRiderLocation({ lat: updatedOrder.rider_lat, lng: updatedOrder.rider_lng });
      }
    });

    return () => supabase.removeChannel(channel);
  }, [orderId]);

  // Simulate rider movement for demo
  function simulateRiderMovement(dest) {
    if (!dest) return;
    // Start from a point 0.01 degrees away and move toward destination
    let lat = dest.lat + 0.01;
    let lng = dest.lng + 0.01;
    setRiderLocation({ lat, lng });

    const interval = setInterval(() => {
      lat -= 0.001;
      lng -= 0.001;
      setRiderLocation({ lat, lng });
      if (Math.abs(lat - dest.lat) < 0.001) clearInterval(interval);
    }, 2000);
  }

  // Mock restaurant location (Lagos) — replace with real restaurant coords from DB
  const restaurantLocation = { lat: 6.4281, lng: 3.4219, name: "Flames & Smoke" };

  const currentStage = STAGES[stageIndex];
  const isDelivered  = orderStatus === "delivered";

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "32px 20px 100px", fontFamily: "'Syne', sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 8, animation: !isDelivered ? "pulse 2s infinite" : "none" }}>
          {["✅", "👨‍🍳", "🛵", "🏠"][stageIndex]}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 4 }}>
          {isDelivered ? "Delivered!" : "Order Placed!"}
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>
          {isDelivered ? "Enjoy your meal 🎉" : <>Est. delivery: <strong style={{ color: C.text }}>25–35 min</strong></>}
        </p>
      </div>

      {/* Live Map */}
      {showMap && (orderStatus === "on_the_way" || orderStatus === "preparing") && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Live Tracking</span>
            <button onClick={() => setShowMap(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>Hide map</button>
          </div>
          <DeliveryMap
            restaurantLocation={restaurantLocation}
            customerLocation={customerLocation}
            riderLocation={riderLocation}
            orderStatus={orderStatus}
          />
        </div>
      )}

      {/* Progress stages */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
        {STAGES.map(({ key, label, sub }, idx) => {
          const done   = idx < stageIndex;
          const active = idx === stageIndex;
          return (
            <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: done || active ? C.accent : C.surface, border: `2px solid ${done || active ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.5s", flexShrink: 0 }}>
                  {done ? "✓" : active
                    ? <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
                    : "○"}
                </div>
                {idx < STAGES.length - 1 && (
                  <div style={{ width: 2, height: 32, background: done ? C.accent : C.border, transition: "background 0.5s" }} />
                )}
              </div>
              <div style={{ paddingTop: 8, paddingBottom: idx < STAGES.length - 1 ? 0 : 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: done || active ? C.text : C.muted }}>{label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{done ? "Done ✓" : active ? sub : "Pending"}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivered CTA */}
      {isDelivered && (
        <div style={{ background: `${C.success}15`, border: `1px solid ${C.success}44`, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.success, marginBottom: 6 }}>Your order has arrived!</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Rate your experience</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ fontSize: 28, cursor: "pointer" }}>⭐</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => go("restaurants")} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
        {isDelivered ? "Order Again 🔥" : "Back to Restaurants"}
      </button>
    </div>
  );
}