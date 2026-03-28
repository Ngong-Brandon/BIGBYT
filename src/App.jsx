// src/App.jsx
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Toast } from "./components/Toast";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Register from "./pages/Auth";
import { VerifyOTP, Login } from "./pages/Auth";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import { Cart }     from "./pages/Pages";
import { Checkout } from "./pages/Pages";
import { Tracking } from "./pages/Pages";

const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #FF4500; border-radius: 2px; }
  @keyframes up    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin  { to{transform:rotate(360deg)} }
  @keyframes notifAnim { 0%{opacity:0;transform:translateX(40px)} 8%,80%{opacity:1;transform:translateX(0)} 100%{opacity:0;transform:translateX(40px)} }
  .anim  { animation: up 0.32s cubic-bezier(.22,.68,0,1.15) forwards; }
  .card:hover { border-color: #FF450055 !important; transform: translateY(-2px); transition: all 0.18s; }
  input:focus { border-color: #FF4500 !important; }
`;

function Inner() {
  const { user } = useAuth();
  const [screen, setScreen]                     = useState("landing");
  const [animKey, setAnimKey]                   = useState(0);
  const [toast, setToast]                       = useState(null);
  const [activeRestaurant, setActiveRestaurant] = useState(null);

  function go(s) {
    setAnimKey(k => k + 1);
    setScreen(s);
    window.scrollTo(0, 0);
  }

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div style={{ fontFamily: "sans-serif", background: "#080808", minHeight: "100vh", color: "#F0EBE1" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{GLOBAL_CSS}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Navbar screen={screen} go={go} />

      <div key={animKey} className="anim">
        {screen === "landing"     && <Landing go={go} />}
        {screen === "register"    && <Register go={go} showToast={showToast} />}
        {screen === "verify-otp"  && <VerifyOTP go={go} showToast={showToast} />}
        {screen === "login"       && <Login go={go} showToast={showToast} />}
        {screen === "restaurants" && (
          <Restaurants go={go} setActiveRestaurant={setActiveRestaurant} />
        )}
        {screen === "restaurant" && activeRestaurant && (
          <RestaurantMenu restaurant={activeRestaurant} go={go} />
        )}
        {screen === "cart"     && <Cart go={go} />}
        {screen === "checkout" && <Checkout go={go} showToast={showToast} />}
        {screen === "tracking" && <Tracking go={go} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Inner />
      </CartProvider>
    </AuthProvider>
  );
}


