// src/components/AppImage.jsx
// ─── Image with graceful emoji fallback if no image URL ──────────────────────
import { useState } from "react";

export default function AppImage({
  src,
  fallback = "🍽️",
  alt = "",
  width,
  height,
  style = {},
  borderRadius = 12,
}) {
  const [failed, setFailed] = useState(false);

  const base = {
    width:        width  || "100%",
    height:       height || "100%",
    borderRadius,
    objectFit:    "cover",
    display:      "block",
    ...style,
  };

  if (!src || failed) {
    return (
      <div style={{
        ...base,
        background:     "#1A1A1A",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       Math.min((height || 60) * 0.5, 48),
        flexShrink:     0,
      }}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={base}
      onError={() => setFailed(true)}
    />
  );
}