// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import {
  registerUser,
  verifyEmailOtp,
  loginUser,
  logoutUser,
  getProfile,
  resendOtp,
  onAuthStateChange,
} from "../services/AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [pendingEmail, setPendingEmail] = useState(null);

  // ── Fetch profile with retry ───────────────────────────────────────────────
  // Profile row may not exist yet if trigger hasn't fired
  async function fetchProfile(userId) {
    for (let i = 0; i < 4; i++) {
      const { profile: p } = await getProfile(userId);
      if (p) return p;
      // Wait before retrying (500ms, 1s, 2s)
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }
    return null;
  }

  // ── Listen to Supabase auth events ────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    const subscription = onAuthStateChange(async (event, session) => {
   

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setUser(session.user);

          // Fetch profile with timeout so it never blocks the app
          const profilePromise = fetchProfile(session.user.id);
          const timeoutPromise = new Promise(r => setTimeout(() => r(null), 6000));
          const p = await Promise.race([profilePromise, timeoutPromise]);
          setProfile(p);
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }

      // Always unblock loading
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ── Register — sends OTP email ────────────────────────────────────────────
  async function register(formData) {
    const { data, error } = await registerUser(formData);
    if (!error) setPendingEmail(formData.email);
    return { data, error };
  }

  // ── Verify OTP — confirms email, signs user in ────────────────────────────
  async function verifyOtp(token) {
    if (!pendingEmail) return { error: { message: "No pending email. Please register again." } };

    const { data, error } = await verifyEmailOtp({ email: pendingEmail, token });

    if (!error && data?.user) {
      setUser(data.user);

      // Profile created by DB trigger — fetch it
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setPendingEmail(null);
    }

    return { data, error };
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  async function resendCode() {
    if (!pendingEmail) return { error: { message: "No pending email." } };
    return resendOtp(pendingEmail);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await loginUser({ email, password });

    // Handle unconfirmed email — send them back to OTP screen
    if (error?.message === "EMAIL_NOT_CONFIRMED") {
      setPendingEmail(error.email);
      await resendOtp(email);
      return {
        data: null,
        error: { message: "Your email isn't verified yet. We've resent the code.", redirect: "verify-otp" },
      };
    }

    if (!error && data?.user) {
      setUser(data.user);
      const p = await fetchProfile(data.user.id);
      setProfile(p);
    }

    return { data, error };
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setPendingEmail(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      pendingEmail,
      isLoggedIn: !!user,
      register,
      verifyOtp,
      resendCode,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}