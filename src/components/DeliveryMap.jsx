// src/components/DeliveryMap.jsx
// ─── Live delivery tracking map using Google Maps ─────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { C } from "../constants/Colors";

// Dark map style matching Bigbyt theme
const DARK_STYLE = [
  { elementType: "geometry",            stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.stroke",  stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.fill",    stylers: [{ color: "#746855" }] },
  { featureType: "road",                elementType: "geometry",           stylers: [{ color: "#1A1A1A" }] },
  { featureType: "road",                elementType: "geometry.stroke",    stylers: [{ color: "#212121" }] },
  { featureType: "road",                elementType: "labels.text.fill",   stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway",        elementType: "geometry",           stylers: [{ color: "#2A2A2A" }] },
  { featureType: "road.highway",        elementType: "geometry.stroke",    stylers: [{ color: "#1f2835" }] },
  { featureType: "water",               elementType: "geometry",           stylers: [{ color: "#0A0A1A" }] },
  { featureType: "poi",                 elementType: "labels",             stylers: [{ visibility: "off" }] },
  { featureType: "transit",             elementType: "labels",             stylers: [{ visibility: "off" }] },
];

const MAP_OPTIONS = {
  styles: DARK_STYLE,
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
};

const LIBRARIES = ["places"];

export default function DeliveryMap({
  restaurantLocation,    // { lat, lng, name }
  customerLocation,      // { lat, lng, address }
  riderLocation,         // { lat, lng } — updates in real time from Supabase
  orderStatus,           // "confirmed" | "preparing" | "on_the_way" | "delivered"
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap]               = useState(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta]               = useState(null);

  const onLoad = useCallback((map) => setMap(map), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Get route from rider to customer when on_the_way
  useEffect(() => {
    if (!isLoaded || !riderLocation || !customerLocation || orderStatus !== "on_the_way") return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin:      new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng),
        destination: new window.google.maps.LatLng(customerLocation.lat, customerLocation.lng),
        travelMode:  window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) setEta(leg.duration.text);
        }
      }
    );
  }, [isLoaded, riderLocation, customerLocation, orderStatus]);

  // Center map based on order status
  const center = riderLocation || restaurantLocation || customerLocation || { lat: 6.5244, lng: 3.3792 };

  if (!isLoaded) {
    return (
      <div style={{ width: "100%", height: 300, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading map...</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: 300 }}
        center={center}
        zoom={15}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Restaurant marker */}
        {restaurantLocation && (
          <Marker
            position={restaurantLocation}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FF4500" stroke="#fff" stroke-width="2"/><text x="20" y="26" text-anchor="middle" font-size="18">🍽️</text></svg>')}`,
              scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : null,
            }}
            title={restaurantLocation.name || "Restaurant"}
          />
        )}

        {/* Customer marker */}
        {customerLocation && (
          <Marker
            position={customerLocation}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#00C48C" stroke="#fff" stroke-width="2"/><text x="20" y="26" text-anchor="middle" font-size="18">🏠</text></svg>')}`,
              scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : null,
            }}
            title="Delivery Location"
          />
        )}

        {/* Rider marker — only show when on the way */}
        {riderLocation && orderStatus === "on_the_way" && (
          <Marker
            position={riderLocation}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#F5A623" stroke="#fff" stroke-width="2"/><text x="22" y="29" text-anchor="middle" font-size="20">🛵</text></svg>')}`,
              scaledSize: isLoaded ? new window.google.maps.Size(44, 44) : null,
            }}
            title="Your Rider"
          />
        )}

        {/* Route from rider to customer */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: { strokeColor: C.accent, strokeWeight: 4, strokeOpacity: 0.8 },
            }}
          />
        )}
      </GoogleMap>

      {/* ETA overlay */}
      {eta && orderStatus === "on_the_way" && (
        <div style={{ position: "absolute", top: 12, left: 12, background: `${C.bg}ee`, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", backdropFilter: "blur(8px)" }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace" }}>ETA</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{eta}</div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {restaurantLocation && <LegendItem emoji="🍽️" label="Restaurant" color="#FF4500" />}
        {riderLocation && orderStatus === "on_the_way" && <LegendItem emoji="🛵" label="Rider" color="#F5A623" />}
        {customerLocation && <LegendItem emoji="🏠" label="You" color="#00C48C" />}
      </div>
    </div>
  );
}

function LegendItem({ emoji, label, color }) {
  return (
    <div style={{ background: `${C.bg}dd`, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12 }}>{emoji}</span>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</span>
    </div>
  );
}