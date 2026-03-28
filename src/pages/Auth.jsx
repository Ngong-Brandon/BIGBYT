// src/pages/Register.jsx
import { useState } from "react";
import { C } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { OTPInput } from "../components/OTPInput";


function calcAge(dob) {
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() - birth.getMonth() < 0 ||
     (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

const input = {
  width: "100%", background: "#111", border: `1.5px solid #222`, borderRadius: 12,
  padding: "13px 16px", color: "#F0EBE1", fontFamily: "'Syne', sans-serif",
  fontSize: 15, outline: "none",
};
const label = { display: "block", fontSize: 11, color: "#6B6860", fontWeight: 700, marginBottom: 6, letterSpacing: 1, fontFamily: "'DM Mono', monospace" };

export default function Register({ go, showToast }) {
  const { register } = useAuth();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob]     = useState("");
  const [pass, setPass]   = useState("");

  function handleSubmit() {
    if (!name || !email || !dob || !pass) return showToast("Please fill all fields", "error");
    const age = calcAge(dob);
    if (age < 18) return showToast(`You must be 18+ to use Bigbyt (you are ${age})`, "error");
    if (pass.length < 6) return showToast("Password must be at least 6 characters", "error");
    register({ name, email, dob, password: pass });
    showToast(`OTP sent to ${email}`, "success");
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
          <div><span style={label}>FULL NAME</span><input value={name} onChange={e => setName(e.target.value)} placeholder="John Adewale" style={input} /></div>
          <div><span style={label}>EMAIL ADDRESS</span><input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={input} /></div>
          <div>
            <span style={label}>DATE OF BIRTH <span style={{ color: C.accent }}>· Must be 18+</span></span>
            <input value={dob} onChange={e => setDob(e.target.value)} type="date" style={{ ...input, colorScheme: "dark" }} />
            {age !== null && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: age >= 18 ? C.success : C.error }}>
                {age >= 18 ? `✓ Age verified: ${age} years old` : `✗ Must be 18+ (you are ${age})`}
              </div>
            )}
          </div>
          <div><span style={label}>PASSWORD</span><input value={pass} onChange={e => setPass(e.target.value)} placeholder="Min 6 characters" type="password" style={input} /></div>
        </div>

        <button onClick={handleSubmit} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 24 }}>
          Continue — Verify Email →
        </button>

        <div style={{ textAlign: "center", marginTop: 18, color: C.muted, fontSize: 13 }}>
          Already have an account?{" "}
          <span onClick={() => go("login")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Log In</span>
        </div>
      </div>
    </div>
  );
}






export function VerifyOTP({ go, showToast }) {
  const { pendingUser, confirmOtp } = useAuth();
  const DEMO_OTP = "847291";
  const [otp, setOtp]         = useState("      ");
  const [timer, setTimer]     = useState(60);

  useEffect(() => {
    const t = setInterval(() => setTimer(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  function handleVerify() {
    const ok = confirmOtp(otp, DEMO_OTP);
    if (!ok) return showToast("Incorrect OTP. Try: 847291", "error");
    showToast(`Welcome to Bigbyt, ${pendingUser?.name}! 🔥`, "success");
    go("restaurants");
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>📬</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 8, color: C.text }}>Check Your Email</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>
        We sent a 6-digit code to<br /><strong style={{ color: C.text }}>{pendingUser?.email}</strong>
      </p>
      <div style={{ display: "inline-block", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 8, padding: "5px 14px", fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 32, fontFamily: "'DM Mono',monospace" }}>
        DEMO: use code 847291
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
        <OTPInput value={otp} onChange={setOtp} />
        <button onClick={handleVerify} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 28 }}>
          Verify & Create Account
        </button>
        <div style={{ marginTop: 20, fontSize: 13, color: C.muted }}>
          {timer > 0
            ? <>Code expires in <strong style={{ color: C.text, fontFamily: "'DM Mono',monospace" }}>{timer}s</strong></>
            : <span onClick={() => setTimer(60)} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Resend Code</span>}
        </div>
      </div>
    </div>
  );
}





// src/pages/Login.jsx
export function Login({ go, showToast }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");

  function handleLogin() {
    const ok = login(email, pass);
    if (!ok) return showToast("Invalid credentials", "error");
    showToast("Welcome back! 🔥", "success");
    go("restaurants");
  }

  const inputStyle = { width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontFamily: "'Syne', sans-serif", fontSize: 15, outline: "none" };

  return (
    <div style={{ maxWidth: 420, margin: "56px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔑</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 6, color: C.text }}>Welcome Back</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Log in to order from your city's best spots</p>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: 1, fontFamily: "'DM Mono',monospace" }}>EMAIL</span>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={inputStyle} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: 1, fontFamily: "'DM Mono',monospace" }}>PASSWORD</span>
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" type="password" style={inputStyle} />
          </div>
        </div>
        <button onClick={handleLogin} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", padding: "15px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 24 }}>
          Log In →
        </button>
        <div style={{ textAlign: "center", marginTop: 18, color: C.muted, fontSize: 13 }}>
          New here?{" "}
          <span onClick={() => go("register")} style={{ color: C.accent, cursor: "pointer", fontWeight: 700 }}>Create Account</span>
        </div>
      </div>
    </div>
  );
}
