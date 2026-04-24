// src/pages/Restaurants.jsx
// ─── Pulls live restaurant data from Supabase ─────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants/Colors";
import { getRestaurants, searchRestaurants } from "../services/restaurantService";
import RestaurantCard from "../components/RestaurantCard";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";

export default function Restaurants({ go, setActiveRestaurant }) {
  const { user, profile } = useAuth();
  
  

  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [search, setSearch]                 = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);

  // ── Detect user neighborhood from profile or fallback ─────────────────────
  // !! REPLACE with real geolocation or user profile neighborhood later !!
 const { city, neighborhood } = useGeolocation();
const userCity         = city         || import.meta.env.VITE_DEFAULT_CITY;
const userNeighborhood = neighborhood || import.meta.env.VITE_DEFAULT_NEIGHBORHOOD;







  // ── Load all restaurants on mount ─────────────────────────────────────────
  useEffect(() => {
  
    async function load() {
      setLoading(true);
      
      const { restaurants, error } = await getRestaurants();
    
      
      
      
      if (error) {
        setError("Could not load restaurants. Please try again.");
        // console.error(error);
      } else {
        // Sort: nearby first, then featured, then by rating
        const nearby = restaurants.filter(r => r.neighborhood && r.neighborhood?.toLowerCase() === userNeighborhood?.toLowerCase());
        const others  = restaurants.filter(r => r.neighborhood && r.neighborhood?.toLowerCase() !== userNeighborhood?.toLowerCase());
       
        
        setAllRestaurants([...nearby, ...others]);
      }
      setLoading(false);
    }

    load();
  }, [userCity, userNeighborhood]);

  // ── Live search with debounce ──────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { results } = await searchRestaurants(search);
      setSearchResults(results);
      setSearching(false);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [search]);

  function enter(r) {
    setActiveRestaurant(r);
    go("restaurant");
  }

  const nearby = allRestaurants.filter(r => r.neighborhood && r.neighborhood?.toLowerCase() === userNeighborhood?.toLowerCase());
  const others  = allRestaurants.filter(r => r.neighborhood && r.neighborhood?.toLowerCase() !== userNeighborhood?.toLowerCase());
  const showNearby = nearby.length > 0;
  const displayList = showNearby ? others : allRestaurants;
  const isSearching = search.trim().length > 0;

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "36px 20px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 220, height: 38, background: C.surface, borderRadius: 10, marginBottom: 10 }} />
          <div style={{ width: 160, height: 18, background: C.surface, borderRadius: 6 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 20, height: 200, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ color: C.text, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: C.muted, marginBottom: 24 }}>{error}</p>
        <button onClick={() => window.location.reload()}
          style={{ background: C.accent, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 700 }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto", padding: "36px 20px" }}>

      
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 36 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.muted }}>
          {searching ? "⏳" : "🔍"}
        </span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search restaurants, cuisines, neighborhoods…"
          style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px 16px 13px 44px", color: C.text, fontFamily: " sans-serif", fontSize: 15, outline: "none" }}
        />
        {search && (
          <span onClick={() => setSearch("")}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, fontSize: 18 }}>
            ×
          </span>
        )}
      </div>

      {/* Search results */}
      {isSearching ? (
        <>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            {searching ? "Searching…" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for `}
            {!searching && <strong style={{ color: C.text }}>"{search}"</strong>}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {searchResults.filter(Boolean).map(r => (
              <RestaurantCard key={r.id} restaurant={r} onClick={() => enter(r)} />
            ))}
          </div>
          {!searching && searchResults.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No restaurants found</div>
              <div style={{ fontSize: 14 }}>Try a different name or neighborhood</div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Nearby section */}
          {nearby.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>📍 Near You</h2>
                <span style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 100, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  {userNeighborhood}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 40 }}>
                {showNearby &&nearby.filter(Boolean).map(r => <RestaurantCard key={r.id} restaurant={r} onClick={() => enter(r)} />)}
              </div>
            </>
          )}

          {/* Other restaurants */}
          {others.length > 0 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18, color: C.text }}>🌆 More in {userCity}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                {others.filter(Boolean).map(r =><RestaurantCard key={r.id} restaurant={r} onClick={() => enter(r)} /> )}
              </div>
            </>
          )}

          {/* Empty state — no restaurants at all */}
          {allRestaurants.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>No restaurants yet</div>
              <div style={{ fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
                Add restaurants to your Supabase database to see them here.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


