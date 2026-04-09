// src/hooks/useGeolocation.js
// ─── Detects user location and resolves to a readable address ─────────────────
import { useState, useEffect } from "react";

export function useGeolocation() {
  const [location, setLocation]     = useState(null);   // { lat, lng }
  const [address, setAddress]       = useState(null);   // "12 Admiralty Way, Lekki..."
  const [neighborhood, setNeighborhood] = useState(null); // "Lekki Phase 1"
  const [city, setCity]             = useState(null);   // "Lagos"
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        // Reverse geocode using Google Maps Geocoding API
        try {
          const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
          );
          const data = await res.json();

          if (data.results?.length > 0) {
            const result = data.results[0];
            setAddress(result.formatted_address);

            // Extract neighborhood and city from address components
            for (const component of result.address_components) {
              if (component.types.includes("neighborhood") ||
                  component.types.includes("sublocality_level_1")) {
                setNeighborhood(component.long_name);
              }
              if (component.types.includes("locality")) {
                setCity(component.long_name);
              }
            }
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          // Fallback — still have lat/lng even if address fails
        }

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Fallback to default city from env
        setCity(import.meta.env.VITE_DEFAULT_CITY || "Lagos");
        setNeighborhood(import.meta.env.VITE_DEFAULT_NEIGHBORHOOD || "Lekki Phase 1");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, address, neighborhood, city, loading, error };
}