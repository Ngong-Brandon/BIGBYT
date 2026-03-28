//  src/pages/RestaurantMenu.jsx 
import { useState } from "react"; 
import { C } from "../constants/Colors"; 
import { useCart } from "../context/CartContext";  
import { useEffect } from "react"; 


 
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

export function Checkout({ go, showToast }) { 
  const { cartSubtotal, cartRestaurant, clearCart } = useCart(); 
  const [address, setAddress] = useState(""); 
  const [cardNum, setCardNum] = useState(""); 
  const [expiry, setExpiry]   = useState(""); 
  const [cvv, setCvv]         = useState(""); 
 
  const deliveryFee = cartRestaurant?.deliveryFee || 2.99; 
  const total       = cartSubtotal + deliveryFee + cartSubtotal * 0.08; 
 
  const inputStyle = { width: "100%", background: C.card, border: `1.5px solid ${C.border}`, 
borderRadius: 10, padding: "14px 16px", color: C.text, fontFamily: "'Syne', sans-serif", fontSize: 
15, outline: "none" }; 
 
  function placeOrder() { 
    if (!address.trim())    return showToast("Enter a delivery address", "error"); 
    if (cardNum.length < 12) return showToast("Enter a valid card number", "error"); 
    if (!expiry || !cvv)    return showToast("Fill in payment details", "error"); 
    clearCart(); 
    go("tracking"); 
  } 
 
  return ( 
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 20px" }}> 
      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 32, color: 
C.text }}>Checkout</h1> 
 
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, 
padding: 28, marginBottom: 18 }}> 
        <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, 
marginBottom: 14, letterSpacing: 1, fontFamily: "'DM Mono',monospace" }}>
📍
 DELIVERY 
ADDRESS</label> 
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, 
City, State" style={inputStyle} /> 
      </div> 
 
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, 
padding: 28, marginBottom: 24 }}> 
        <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, 
marginBottom: 14, letterSpacing: 1, fontFamily: "'DM Mono',monospace" }}>
💳
 PAYMENT 
DETAILS</label> 
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}> 
          <input value={cardNum} onChange={e => 
setCardNum(e.target.value.replace(/\D/,"").slice(0,16))} placeholder="Card Number" style={{ 
...inputStyle, fontFamily: "'DM Mono',monospace", letterSpacing: 3 }} /> 
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}> 
            <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM / YY" 
style={{ ...inputStyle, fontFamily: "'DM Mono',monospace" }} /> 
            <input value={cvv} onChange={e => setCvv(e.target.value.slice(0,4))} 
placeholder="CVV" style={{ ...inputStyle, fontFamily: "'DM Mono',monospace" }} /> 
          </div> 
        </div> 
      </div> 
 
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, 
padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", 
alignItems: "center" }}> 
        <span style={{ color: C.muted, fontSize: 14 }}>Order Total</span> 
        <span style={{ fontWeight: 800, fontSize: 22, color: C.accent, fontFamily: "'DM Mono',monospace" }}>${total.toFixed(2)}</span> 
      </div> 
 
      <button onClick={placeOrder} style={{ width: "100%", background: C.accent, color: "#fff", 
border: "none", padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 
"pointer", fontFamily: "'Syne', sans-serif" }}> 
        

 Place Order 
      </button> 
    </div> 
  ); 
} 









 
// src/pages/Tracking.jsx 

const STAGES = [ 
  { label: "Order Confirmed", sub: "We've received your order" }, 
  { label: "Preparing",       sub: "Kitchen is on it" }, 
  { label: "On the Way",      sub: "Rider heading to you" }, 
  { label: "Delivered",       sub: "Bon appétit!" }, 
]; 
 
export function Tracking({ go }) { 
  const [stage, setStage] = useState(0); 
 
  useEffect(() => { 
    [1, 2, 3].forEach((s, i) => { 
      setTimeout(() => setStage(s), (i + 1) * 4500); 
    }); 
  }, []); 
 
  return ( <div style={{ maxWidth: 520, margin: "0 auto", padding: "52px 20px", textAlign: "center" }}> 
      <div style={{ fontSize: 60, marginBottom: 10, animation: stage < 3 ? "pulse 2s infinite" : 
"none" }}> 

        { ["✅","󰞽","🛵","🏠"][stage]} 

       </div> 
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8, color: 
C.text }}> 
        {stage === 3 ? "Delivered!" : "Order Placed!"} 
      </h1> 
      <p style={{ color: C.muted, marginBottom: 48 }}> 
        {stage === 3 ? "Enjoy your meal " : <>Estimated delivery: <strong style={{ color: C.text 
}}>25–35 min</strong></>} 
      </p> 
 
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 48, textAlign: 
"left" }}> 
        {STAGES.map(({ label, sub }, idx) => { 
          const done   = idx < stage; 
          const active = idx === stage; 
          return ( 
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 18 }}> 
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}> 
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: done || active ? 
C.accent : C.surface, border: `2px solid ${done || active ? C.accent : C.border}`, display: "flex", 
alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.5s", flexShrink: 0 }}> 
                  {done ? "✓" : active ? <div style={{ width: 14, height: 14, border: "2px solid #fff", 
borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} /> : 
"○"} 
                </div> 
                {idx < 3 && <div style={{ width: 2, height: 36, background: done ? C.accent : C.border, 
transition: "background 0.5s" }} />} 
              </div> 
              <div style={{ paddingTop: 9 }}> 
                <div style={{ fontWeight: 700, fontSize: 15, color: done || active ? C.text : C.muted 
}}>{label}</div> 
                <div style={{ fontSize: 12, color: C.muted }}>{done ? "Done ✓" : active ? sub : 
"Pending"}</div> 
              </div> 
            </div> 
          ); 
        })} 
      </div> 
 
      {stage === 3 && ( 
        <button onClick={() => go("restaurants")} style={{ background: C.accent, color: "#fff", 
border: "none", padding: "15px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 
"pointer", fontFamily: "'Syne', sans-serif" }}> 
          Order Again 
 
        </button> 
      )} 
    </div> 
  ); 
} 
 
 