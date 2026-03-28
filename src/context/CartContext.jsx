// src/context/CartContext.jsx 
// ─── Cart state + order placement via Supabase 

import { createContext, useContext, useState } from "react"; 
import { placeOrder } from "../services/orderService"; 
import { useAuth } from "./AuthContext"; 
 
const CartContext = createContext(null); 
 
export function CartProvider({ children }) { 
  const { user } = useAuth(); 
  const [cart, setCart]                     = useState([]); 
  const [cartRestaurant, setCartRestaurant] = useState(null); 
  const [lastOrderId, setLastOrderId]       = useState(null); 
 
  const cartCount    = cart.reduce((s, i) => s + i.qty, 0); 
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0); 
 
  // ── Add to cart 

  function addToCart(item, restaurant) { 
    // Warn if user switches restaurants mid-cart 
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) { 
      // !! You can show a confirmation dialog here instead of auto-clearing !! 
      clearCart(); 
    } 
 
    setCartRestaurant(restaurant); 
    const key = `${restaurant.id}-${item.id}`; 
    setCart(prev => { 
      const existing = prev.find(i => i._key === key); 
      if (existing) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i); 
      return [...prev, { ...item, _key: key, restaurantId: restaurant.id, restaurantName: 
restaurant.name, qty: 1 }]; 
    }); 
  } 
 
  // ── Remove from cart 

  function removeFromCart(key) { 
    setCart(prev => { 
      const updated = prev.map(i => i._key === key ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0); 
      if (updated.length === 0) setCartRestaurant(null); 
      return updated; 
    }); 
  } 
 
  // ── Get item in cart 
 
  function getItemInCart(restaurantId, itemId) { 
    return cart.find(i => i._key === `${restaurantId}-${itemId}`) || null; 
  } 
 
  // ── Clear cart 
 
  function clearCart() { 
    setCart([]); 
    setCartRestaurant(null); 
  } 
 
  // ── Checkout 

  // deliveryAddress: string 
  // paymentRef: string from Paystack/Stripe (pass null for now if not yet integrated) 
  async function checkout({ deliveryAddress, paymentRef = null }) { 
    if (!user)            return { error: { message: "You must be logged in to order." } }; 
    if (cart.length === 0) return { error: { message: "Your cart is empty." } }; 
 
    const { order, error } = await placeOrder({ 
      userId:          user.id, 
      restaurantId:    cartRestaurant.id, 
      items:           cart.map(i => ({ 
        id:    i.id, 
        name:  i.name, 
        price: i.price, 
        qty:   i.qty, 
        emoji: i.emoji, 
      })), 
      deliveryAddress, 
      deliveryFee: cartRestaurant.delivery_fee || 2.99, 
      paymentRef, 
    }); 
 
    if (!error) { 
      setLastOrderId(order.id); 
      clearCart(); 
    } 
 
    return { order, error }; 
  } 
 
  return ( 
    <CartContext.Provider value={{ 
      cart, cartCount, cartSubtotal, cartRestaurant, 
      lastOrderId, addToCart, removeFromCart, 
      getItemInCart, clearCart, checkout, 
    }}> 
      {children} 
    </CartContext.Provider> 
  ); 
} 
 
export function useCart() { 
  return useContext(CartContext); 
} 
 
