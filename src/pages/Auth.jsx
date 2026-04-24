// src/pages/Auth.jsx
// ─── Register, VerifyOTP, Login — all wired to AuthContext ───────────────────
import { useState, useEffect, useRef } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "#111", border: `1.5px solid #222`,
  borderRadius: 12, padding: "13px 16px", color: "#F0EBE1",
  fontFamily: " sans-serif", fontSize: 15, outline: "none",
};

const labelStyle = {
  display: "block", fontSize: 11, color: "#6B6860", fontWeight: 700,
  marginBottom: 6, letterSpacing: 1, fontFamily: "'DM Mono', monospace",
};

const btnPrimary = {
  width: "100%", background: C.accent, color: "#fff", border: "none",
  padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800,
  cursor: "pointer", fontFamily: "sans-serif", marginTop: 24,
};

function calcAge(dob) {
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
export default function Register({ go, showToast }) {
  const { register } = useAuth();
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [dob, setDob]       = useState("");
  const [pass, setPass]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name || !email || !dob || !pass) return showToast("Please fill all fields", "error");
    const age = calcAge(dob);
    if (age < 18) return showToast(`You must be 18+ (you are ${age})`, "error");
    if (pass.length < 6) return showToast("Password must be at least 6 characters", "error");

    setLoading(true);
    const { error } = await register({ fullName: name, email, password: pass, dateOfBirth: dob });
    setLoading(false);

    if (error) return showToast(error.message, "error");

    showToast(`Verification code sent to ${email} ✓`, "success");
    go("verify-otp");
  }

  const age = dob ? calcAge(dob) : null;

  return (
    <div style={{ maxWidth: 440, margin: "48px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 6, color: C.text }}>Create Account</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>You must be 18+ to order on Bigbyt</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStyle}>FULL NAME</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Adewale" style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>EMAIL ADDRESS</span>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>
              DATE OF BIRTH <span style={{ color: C.accent }}>· Must be 18+</span>
            </span>
            <input value={dob} onChange={e => setDob(e.target.value)} type="date"
              style={{ ...inputStyle, colorScheme: "dark" }} />
            {age !== null && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: age >= 18 ? C.success : C.error }}>
                {age >= 18 ? `✓ Age verified: ${age} years old` : `✗ Must be 18+ (you are ${age})`}
              </div>
            )}
          </div>
          <div>
            <span style={labelStyle}>PASSWORD</span>
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Min 6 characters" type="password" style={inputStyle} />
            {pass.length > 0 && pass.length < 6 && (
              <div style={{ marginTop: 5, fontSize: 11, color: C.error }}>Too short</div>
            )}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Sending code..." : "Continue — Verify Email →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, color: C.muted, fontSize: 13 }}>
          Already have an account?{" "}
          <span onClick={() => go("login")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Log In</span>
        </div>
      </div>
    </div>
  );
}

// ─── OTP INPUT WIDGET ─────────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const refs  = Array.from({ length: 6 }, () => useRef(null));
  const digits = (value + "      ").slice(0, 6).split("");

  function handleKey(i, e) {
    if (e.key === "Backspace") {
      const next = [...digits];
      next[i] = " ";
      onChange(next.join("").trimEnd().padEnd(6, " "));
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = [...digits];
      next[i] = e.key;
      onChange(next.join(""));
      if (i < 5) refs[i + 1].current?.focus();
    }
    e.preventDefault();
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {refs.map((ref, i) => (
        <input key={i} ref={ref} maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          style={{
            width: 46, height: 56, textAlign: "center", fontSize: 22,
            fontWeight: 800, background: C.surface,
            border: `2px solid ${digits[i]?.trim() ? C.accent : C.border}`,
            borderRadius: 12, color: C.text,
            fontFamily: "'DM Mono', monospace", outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
export function VerifyOTP({ go, showToast }) {
  const { verifyOtp, resendCode, pendingEmail } = useAuth();
  const [otp, setOtp]         = useState("      ");
  const [timer, setTimer]     = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setTimer(60);
    const t = setInterval(() => setTimer(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleVerify() {
    const code = otp.trim();
    if (code.length !== 6) return showToast("Enter the full 6-digit code", "error");

    setLoading(true);
    const { error } = await verifyOtp(code);
    setLoading(false);

    if (error) {
      showToast(error.message || "Invalid code. Please try again.", "error");
      setOtp("      "); // clear OTP on error
      return;
    }

    showToast("Email verified! Welcome to Bigbyt 🔥", "success");
    go("home");
  }

  async function handleResend() {
    setResending(true);
    const { error } = await resendCode();
    setResending(false);
    if (error) return showToast("Could not resend code. Try again.", "error");
    setTimer(60);
    setOtp("      ");
    showToast("New code sent ✓", "success");
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>📬</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 8, color: C.text }}>
        Check Your Email
      </h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
        We sent a 6-digit verification code to
      </p>
      <p style={{ fontWeight: 800, color: C.text, fontSize: 15, marginBottom: 28 }}>
        {pendingEmail || "your email"}
      </p>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
        <OTPInput value={otp} onChange={setOtp} />

        <button onClick={handleVerify} disabled={loading || otp.trim().length !== 6}
          style={{ ...btnPrimary, marginTop: 28, opacity: (loading || otp.trim().length !== 6) ? 0.6 : 1 }}>
          {loading ? "Verifying..." : "Verify & Create Account"}
        </button>

        <div style={{ marginTop: 20, fontSize: 13, color: C.muted }}>
          {timer > 0 ? (
            <>Code expires in{" "}
              <strong style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}>{timer}s</strong>
            </>
          ) : (
            <span onClick={handleResend} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>
              {resending ? "Sending..." : "Resend Code"}
            </span>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: C.muted }}>
          Wrong email?{" "}
          <span onClick={() => go("register")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>
            Go back
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function Login({ go, showToast }) {
  const { login } = useAuth();
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !pass) return showToast("Fill in your credentials", "error");

    setLoading(true);
    const { error } = await login(email, pass);
    setLoading(false);

    if (error) {
      // If email not confirmed — redirect to OTP screen
      if (error.redirect === "verify-otp") {
        showToast(error.message, "error");
        go("verify-otp");
        return;
      }
      showToast(error.message || "Invalid credentials", "error");
      return;
    }

    showToast("Welcome back! 🔥", "success");
    go("home");
  }

  return (
    <div style={{ maxWidth: 420, margin: "56px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔑</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 6, color: C.text }}>
          Welcome Back
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Log in to order from your city's best spots</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStyle}>EMAIL</span>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" type="email" style={inputStyle}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div>
            <span style={labelStyle}>PASSWORD</span>
            <input value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" type="password" style={inputStyle}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Logging in..." : "Log In →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, color: C.muted, fontSize: 13 }}>
          New here?{" "}
          <span onClick={() => go("register")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>
            Create Account
          </span>
        </div>
      </div>
    </div>
  );
}