// src/components/ImageUpload.jsx
// ─── Drag-drop / click image uploader with preview ───────────────────────────
import { useState, useRef } from "react";
import { C } from "../constants/Colors";
import { uploadImage } from "../services/imageService";

export default function ImageUpload({
  bucket,           // "restaurants" | "menu-items"
  folder = "",      // subfolder inside bucket
  currentUrl = "",  // existing image URL to show as preview
  onUpload,         // callback(url) called after successful upload
  size = 120,       // preview size in px
  shape = "rounded",// "rounded" | "circle" | "wide"
  label = "Upload Image",
}) {
  const [preview,   setPreview]   = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const inputRef = useRef(null);

  const borderRadius = shape === "circle"  ? "50%"
                     : shape === "wide"    ? 12
                     : 14;

  const containerStyle = shape === "wide"
    ? { width: "100%", height: 160, borderRadius: 14 }
    : { width: size, height: size, borderRadius };

  async function handleFile(file) {
    if (!file) return;

    // Validate
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);

    const { url, error: uploadError } = await uploadImage(bucket, file, folder);
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message || "Upload failed");
      setPreview(currentUrl || "");
      return;
    }

    setPreview(url);
    if (onUpload) onUpload(url);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          ...containerStyle,
          background:   preview ? "transparent" : C.card,
          border:       `2px dashed ${preview ? "transparent" : C.border}`,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          cursor:       uploading ? "not-allowed" : "pointer",
          overflow:     "hidden",
          position:     "relative",
          transition:   "border-color 0.15s",
          flexShrink:   0,
        }}
        onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = C.accent; }}
        onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = C.border; }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Hover overlay to change image */}
            <div style={{
              position:   "absolute", inset: 0,
              background: "rgba(0,0,0,0.5)",
              display:    "flex", alignItems: "center", justifyContent: "center",
              opacity:    0, transition: "opacity 0.2s",
              borderRadius,
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center", padding: "0 8px" }}>
                {uploading ? "Uploading..." : "Change"}
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 12 }}>
            {uploading ? (
              <div style={{ fontSize: 24, marginBottom: 6 }}>⏳</div>
            ) : (
              <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            )}
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
              {uploading ? "Uploading..." : label}
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {uploading && (
        <div style={{ marginTop: 6, fontSize: 11, color: C.accent, fontWeight: 700 }}>
          Uploading...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: C.error }}>{error}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}