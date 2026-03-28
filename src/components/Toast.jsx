// src/components/Toast.jsx
import { C } from "../constants/Colors";

export function Toast({ msg, type = "info" }) {
  const bg = type === "error" ? C.error : type === "success" ? C.success : C.accent;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, background: bg, color: "#fff",
      padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
      zIndex: 9999, animation: "notifAnim 2.4s ease forwards",
      boxShadow: `0 4px 24px ${bg}44`,
    }}>
      {msg}
    </div>
  );
}

