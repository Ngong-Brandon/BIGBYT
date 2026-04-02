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

// await getProfile('');

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
    
    
    // Add a timeout so it never hangs forever
    const profilePromise = getProfile(session.user.id);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Profile fetch timed out")), 5000)
    );
    
    try {
      const { profile: p } = await Promise.race([profilePromise, timeoutPromise]);
     
      setProfile(p || null);
    } catch (err) {

      setProfile(null); // don't block the app
    }
    
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