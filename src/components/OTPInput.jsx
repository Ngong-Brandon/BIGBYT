
// src/components/OTPInput.jsx  (exported below, same file for brevity)
import { useRef } from "react";
import {C} from "../constants/Colors"

export function OTPInput({ value, onChange }) {

  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();
  const ref4 = useRef();
  const ref5 = useRef();
  const ref6 = useRef();
  const refs = [ref1, ref2, ref3, ref4, ref5, ref6];
  const digits = (value || "").split("");

  function handleKey(i, e) {
    if (e.key === "Backspace") {
      const next = [...digits];
      next[i] = " ";
      onChange(next.join("").trimEnd().padEnd(6, " "));
      if (i > 0) refs[i - 1].current.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = [...digits];
      next[i] = e.key;
      onChange(next.join(""));
      if (i < 5) refs[i + 1].current.focus();
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {refs.map((ref, i) => (
        <input
          key={i} ref={ref} maxLength={1}
          value={digits[i]?.trim() || ""} onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          style={{
            width: 46, height: 56, textAlign: "center", fontSize: 22,
            fontWeight: 800, background: C.surface,
            border: `2px solid ${digits[i]?.trim() ? C.accent : C.border}`,
            borderRadius: 12, color: C.text,
            fontFamily: "'DM Mono', monospace", outline: "none",
            caretColor: C.accent, transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}