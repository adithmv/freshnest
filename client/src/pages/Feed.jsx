import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation, formatDistance } from "../lib/location";
import { useCart } from "../context/CartContext";
import LocationPicker from "../components/ui/LocationPicker";
import { Home, MapPin, Clock, Search, SlidersHorizontal, Star, LogOut, ShoppingBag, X, Navigation, Package } from "lucide-react";

const FILTERS = ["All", "Veg", "Non-Veg", "Bakery", "Rice & Biryani", "Sweets & Desserts", "Snacks", "Thali & Meals"];

function urgency(expiresAt) {
  const hrs = (new Date(expiresAt) - new Date()) / 36e5;
  if (hrs <= 0)  return { color: "#bbb",    bg: "#f5f5f5",  label: "Expired",   expired: true };
  if (hrs <= 1)  return { color: "#c0392b", bg: "#fff5f5",  label: "< 1 hr left", expired: false };
  if (hrs <= 3)  return { color: "#d35400", bg: "#fff8f0",  label: "< 3 hrs left", expired: false };
  return           { color: "#27ae60", bg: "#f0faf4",  label: "Fresh",      expired: false };
}

export default function Feed() {
  const { user, profile, signOut } = useAuth();
  const { cart, addToCart, itemCount } = useCart();
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const [locationErr, setLocationErr]   = useState("");
  // eslint-disable-next-line no-unused-vars
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState(3000);

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  
  useEffect(() => { askLocation() }, []);

  async function askLocation() {
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      fetchListings(loc);
    } catch (err) {
      setLocationErr(err.message);
      fetchListings(null);
    }
    setLocationLoading(false);
  }

async function fetchListings(loc) {
  console.log("fetchListings called with loc:", loc);
  setLoading(true);
  try {
    const { data: allListings, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    console.log("listings result:", allListings, "error:", error);

    if (error || !allListings) {
      setListings([]);
      setLoading(false);
      return;
    }

    // Fetch seller profiles separately
    const sellerIds = [...new Set(allListings.map(l => l.seller_id))];
    const { data: sellers } = await supabase
      .from("seller_profiles")
      .select("user_id, shop_name, avg_rating, shop_type")
      .in("user_id", sellerIds);

    // Merge seller data into listings
    const merged = allListings.map(l => ({
      ...l,
      seller_profiles: sellers?.find(s => s.user_id === l.seller_id) || null,
      distance_meters: null,
    }));

    if (loc) {
      merged.sort((a, b) => a.distance_meters - b.distance_meters);
    }

    setListings(merged);
  } catch (err) {
    console.error(err);
    setListings([]);
  }
  setLoading(false);
}

  const filtered = listings.filter(l => {
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.seller_profiles?.shop_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"     ? true :
      filter === "Veg"     ? l.is_veg :
      filter === "Non-Veg" ? !l.is_veg :
      l.categories?.name === filter || l.tags?.includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });




  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .listing-card { background: white; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; }
        .listing-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.08); }
        .filter-btn { border: 1px solid #e8e8e8; border-radius: 20px; padding: 7px 16px; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 0.15s; background: white; color: #555; white-space: nowrap; }
        .filter-btn.active { background: #111; color: white; border-color: #111; }
        .filter-btn:hover:not(.active) { border-color: #aaa; }
        .add-btn { background: #111; color: white; border: none; border-radius: 7px; padding: 8px 16px; font-size: 13px; font-family: inherit; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .add-btn:hover { background: #333; }
        .add-btn.added { background: #27ae60; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
        .cart-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 380px; background: white; z-index: 201; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.1); animation: slideIn 0.25s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .success-modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 300; background: rgba(0,0,0,0.5); }
        .skeleton { background: linear-gradient(90deg, #f5f5f5 25%, #ececec 50%, #f5f5f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 20 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111", flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "9px 14px", maxWidth: 400 }}>
            <Search size={14} color="#aaa" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search food or seller..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "#111" }}
            />
          </div>

          {/* Location indicator */}
          <button
  onClick={() => setShowLocationPicker(true)}
  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", color: userLocation ? "#27ae60" : "#aaa", fontFamily: "inherit", flexShrink: 0 }}
>
  <Navigation size={12} color={userLocation ? "#27ae60" : "#aaa"} />
  {userLocation ? "Location on" : "Set location"}
</button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {user ? (
              <>
                <span style={{ fontSize: 13, color: "#888" }}>{profile?.full_name}</span>
                <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: "#111", textDecoration: "none" }}>Log in</Link>
            )}
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <Link
    to="/orders"
    style={{ border: "1px solid #e8e8e8", color: "#111", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "white" }}
  >
    <Package size={14} />
    My Orders
  </Link>
  <Link
    to="/cart"
    style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}
  >
    <ShoppingBag size={14} />
    Cart {itemCount > 0 && <span style={{ background: "white", color: "#111", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>}
  </Link>
</div>
          </div>
        </div>
      </nav>

      {/* Location error banner */}
      {locationErr && (
        <div style={{ background: "#fff8f0", borderBottom: "1px solid #f0e0cc", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#d35400" }}>
            <MapPin size={13} />
            {locationErr} — showing all listings instead.
          </div>
          <button onClick={askLocation} style={{ fontSize: 12, color: "#d35400", background: "none", border: "1px solid #f0c8a0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
            Try again
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "white", borderBottom: "1px solid #f2f2f2", padding: "12px 32px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 8 }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
          {userLocation && (
            <select
              value={radius}
              onChange={e => { setRadius(parseInt(e.target.value)); fetchListings(userLocation); }}
              style={{ border: "1px solid #e8e8e8", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", background: "white", color: "#555", marginLeft: "auto" }}
            >
              <option value={1000}>Within 1 km</option>
              <option value={3000}>Within 3 km</option>
              <option value={5000}>Within 5 km</option>
              <option value={10000}>Within 10 km</option>
            </select>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>
            {loading ? "Finding food near you..." : userLocation ? `${filtered.length} listings within ${radius / 1000}km` : `${filtered.length} listings`}
          </h2>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#555" }}>
            <SlidersHorizontal size={13} /> Sort
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 12, overflow: "hidden" }}>
                <div className="skeleton" style={{ height: 140 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <ShoppingBag size={40} strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, marginBottom: 8 }}>No listings found nearby</p>
            <p style={{ fontSize: 14, marginBottom: 20 }}>Try increasing the radius or check back later</p>
            {userLocation && (
              <button
                onClick={() => { setRadius(10000); fetchListings(userLocation); }}
                style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                Expand to 10km
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtered.map(listing => {
              const u = urgency(listing.expires_at);
              const inCart = cart.find(c => c.id === listing.id);
              return (
                <div key={listing.id} className="listing-card">
                  <div style={{ height: 140, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Home size={36} color="#ccc" strokeWidth={1} />
                    )}
                    {listing.is_veg !== null && (
                      <div style={{ position: "absolute", top: 10, left: 10, width: 20, height: 20, border: `2px solid ${listing.is_veg ? "#27ae60" : "#c0392b"}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: listing.is_veg ? "#27ae60" : "#c0392b" }} />
                      </div>
                    )}
                    {listing.distance_meters > 0 && (
                      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={9} color="white" />
                        {formatDistance(listing.distance_meters)}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{listing.title}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{listing.seller_profiles?.shop_name}</div>
                      </div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>₹{listing.price}</div>
                    </div>

                    {listing.description && (
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 10, fontWeight: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {listing.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: u.bg, borderRadius: 7, padding: "6px 10px", marginBottom: 12 }}>
                      <Clock size={11} color={u.color} />
                      <span style={{ fontSize: 11, color: u.color, fontWeight: 500 }}>
                        {new Date(listing.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{listing.available_qty} left</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={11} color="#e8a020" fill="#e8a020" />
                        <span style={{ fontSize: 12, color: "#888" }}>{listing.seller_profiles?.avg_rating || "New"}</span>
                      </div>
                      <button className={`add-btn ${inCart ? "added" : ""}`} onClick={() => addToCart(listing)}>
                        {inCart ? "Added" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

 
   
      {showLocationPicker && (
  <LocationPicker
    value={userLocation}
    onChange={loc => {
      setUserLocation(loc);
      fetchListings(loc);
      setShowLocationPicker(false);
    }}
    onClose={() => setShowLocationPicker(false)}
  />
)}
    </div>
  );
}
