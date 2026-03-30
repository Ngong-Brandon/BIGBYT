// src/context/AuthContext.jsx
// ─── Auth state powered by Supabase ──────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from "react";
import {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  getProfile,
  resendOtp,
  onAuthStateChange,
} from "../services/AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);   // Supabase auth user
  const [profile, setProfile]     = useState(null);   // profiles table row
  const [loading, setLoading]     = useState(true);   // initial session check
  const [pendingEmail, setPendingEmail] = useState(null); // for OTP screen

  // ── Listen to Supabase auth state changes ─────────────────────────────────
  useEffect(() => {
   
    const timeout = setTimeout(() => {
      setLoading(false);
      
    }, 2000);
    const subscription = onAuthStateChange(async (event, session) => {
      
      

      if (session?.user) {
        setUser(session.user);
        const { profile } = await getProfile(session.user.id);
        setProfile(profile);
       
        
      } else {
        setUser(null);
        setProfile(null);
     
        
      }
      
      setLoading(false);
      clearTimeout(timeout);

      
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  async function register(formData) {
    const { data, error } = await registerUser(formData);
    if (!error) {
      setPendingEmail(formData.email);
    }
    return { data, error };
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  async function verifyEmail(token) {
    const { data, error } = await verifyOtp({ email: pendingEmail, token });
    if (!error && data?.user) {
      setUser(data.user);
      const { profile } = await getProfile(data.user.id);
      setProfile(profile);
      setPendingEmail(null);
    }
    return { data, error };
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  async function resendCode() {
    if (!pendingEmail) return { error: { message: "No pending email" } };
    return resendOtp(pendingEmail);
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await loginUser({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
      const { profile } = await getProfile(data.user.id);
      setProfile(profile);
    }
    return { data, error };
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function logout() {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        pendingEmail,
        register,
        verifyEmail,
        resendCode,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >

      
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}