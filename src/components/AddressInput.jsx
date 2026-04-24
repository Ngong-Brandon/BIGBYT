// src/components/AddressInput.jsx
// ─── Google Places autocomplete for delivery address input ────────────────────
import { useRef, useEffect, useState } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { C } from "../constants/Colors";

const LIBRARIES = ["places"];

export default function AddressInput({ value, onChange, onSelect, placeholder = "Enter delivery address" }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const autocompleteRef = useRef(null);

  function onPlaceChanged() {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return;

    const address  = place.formatted_address;
    const lat      = place.geometry.location.lat();
    const lng      = place.geometry.location.lng();

    // Extract neighborhood and city
    let neighborhood = "";
    let city = "";
    for (const comp of place.address_components || []) {
      if (comp.types.includes("sublocality_level_1") || comp.types.includes("neighborhood")) {
        neighborhood = comp.long_name;
      }
      if (comp.types.includes("locality")) {
        city = comp.long_name;
      }
    }

    onChange(address);
    if (onSelect) onSelect({ address, lat, lng, neighborhood, city });
  }

  const inputStyle = {
    width: "100%",
    background: C.card,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: C.text,
    fontFamily: " sans-serif",
    fontSize: 15,
    outline: "none",
  };

  if (!isLoaded) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    );
  }

  return (
    <Autocomplete
      onLoad={ref => (autocompleteRef.current = ref)}
      onPlaceChanged={onPlaceChanged}
      restrictions={{ country: "ng" }} // !! REPLACE "ng" with your country code !!
    >
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </Autocomplete>
  );
}