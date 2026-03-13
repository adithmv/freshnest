import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation, formatDistance } from "../lib/location";
import { useCart } from "../context/CartContext";
import LocationPicker from "../components/ui/LocationPicker";
import { Home, MapPin, Star, Search, LogOut, ShoppingBag, Navigation, Package } from "lucide-react";

const SHOP_TYPES = [
  ["All", "All"],
  ["home_cook", "Home Kitchen"],
  ["bakery", "Bakery"],
  ["tiffin", "Tiffin"],
  ["sweet_shop", "Sweets"],
  ["other", "Other"],
];

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isShopOpen(openingHours) {
  if (!openingHours) return true;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const day = days[now.getDay()];
  const hours = openingHours[day];
  if (!hours || hours.toLowerCase() === "closed") return false;
  const [open, close] = hours.split("-");
  if (!open || !close) return true;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= oh * 60 + om && current <= ch * 60 + cm;
}

export default function Feed() {
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5000);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => { askLocation(); }, []);

  async function askLocation() {
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      fetchShops(loc);
    } catch {
      fetchShops(null);
    }
  }

  async function fetchShops(loc) {
    setLoading(true);
    try {
      const { data: sellers, error } = await supabase
        .from("seller_profiles")
        .select("*")
        .order("avg_rating", { ascending: false });

      if (error || !sellers) { setShops([]); setLoading(false); return; }

      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());

      const listingCounts = {};
      listings?.forEach(l => {
        listingCounts[l.seller_id] = (listingCounts[l.seller_id] || 0) + 1;
      });

      const withMeta = sellers.map(s => ({
        ...s,
        distance_meters: loc && s.lat && s.lng
          ? calcDistance(loc.lat, loc.lng, s.lat, s.lng)
          : null,
        active_listings: listingCounts[s.user_id] || 0,
        open_now: isShopOpen(s.opening_hours),
      }));

      let result = withMeta;
      if (loc) {
        result = withMeta.filter(s => s.distance_meters === null || s.distance_meters <= radius);
        result.sort((a, b) => (a.distance_meters ?? 99999) - (b.distance_meters ?? 99999));
      }

      setShops(result);
    } catch (err) {
      console.error(err);
      setShops([]);
    }
    setLoading(false);
  }

  const filtered = shops.filter(s => {
    const matchSearch =
      s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.shop_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .shop-card { background: white; border: 1px solid #efefef; border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform 0.18s, box-shadow 0.18s; }
        .shop-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.09); }
        .filter-btn { border: 1px solid #e8e8e8; border-radius: 20px; padding: 7px 16px; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 0.15s; background: white; color: #555; white-space: nowrap; }
        .filter-btn.active { background: #111; color: white; border-color: #111; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 600px) {
          .shops-grid { grid-template-columns: 1fr !important; }
          .nav-search { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111", flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>Home Bite</span>
          </Link>

          <div className="nav-search" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "9px 14px", maxWidth: 380 }}>
            <Search size={14} color="#aaa" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shops..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", fontFamily: "inherit" }}
            />
          </div>

          <button
            onClick={() => setShowLocationPicker(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", color: userLocation ? "#27ae60" : "#494848", fontFamily: "inherit", flexShrink: 0 }}
          >
            <Navigation size={12} color={userLocation ? "#27ae60" : "#aaa"} />
            {userLocation ? "Location on" : "Set location"}
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {user ? (
              <>
                <span style={{ fontSize: 13, color: "#444" }}>{profile?.full_name}</span>
                <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: "#111", textDecoration: "none" }}>Log in</Link>
            )}
            <Link to="/orders" style={{ border: "1px solid #e8e8e8", color: "#111", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, textDecoration: "none", background: "white" }}>
              <Package size={14} /> Orders
            </Link>
            <Link to="/cart" style={{ background: "#111", color: "white", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <ShoppingBag size={14} />
              Cart {itemCount > 0 && <span style={{ background: "white", color: "#111", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Filter bar */}
      <div style={{ background: "white", borderBottom: "1px solid #f2f2f2", padding: "10px 24px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 8, alignItems: "center" }}>
          {SHOP_TYPES.map(([val, label]) => (
            <button key={val} className={`filter-btn ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
          {userLocation && (
            <select
              value={radius}
              onChange={e => { setRadius(parseInt(e.target.value)); fetchShops(userLocation); }}
              style={{ border: "1px solid #e8e8e8", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", background: "white", color: "#555", marginLeft: "auto", flexShrink: 0 }}
            >
              <option value={1000}>1 km</option>
              <option value={3000}>3 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
            </select>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>
            {loading ? "Finding shops..." : `${filtered.length} shop${filtered.length !== 1 ? "s" : ""}${userLocation ? " near you" : ""}`}
          </h2>
        </div>

        {loading ? (
          <div className="shops-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, overflow: "hidden" }}>
                <div className="skeleton" style={{ height: 160 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 16, width: "55%", marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 12, width: "35%" }} />
                </div>
              </div>
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <ShoppingBag size={40} strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, marginBottom: 8 }}>No shops found</p>
            <p style={{ fontSize: 14 }}>Try a different filter or expand your radius</p>
          </div>

        ) : (
          <div className="shops-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filtered.map(shop => (
              <div key={shop.user_id} className="shop-card" onClick={() => navigate(`/shop/${shop.user_id}`)}>
                <div style={{ height: 160, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", position: "relative", overflow: "hidden" }}>
                  {shop.banner_image ? (
                    <img src={shop.banner_image} alt={shop.shop_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Home size={40} color="#ddd" strokeWidth={1} />
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 12, left: 12, background: shop.open_now ? "#27ae60" : "#aaa", color: "white", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                    {shop.open_now ? "Open" : "Closed"}
                  </div>
                  {shop.distance_meters !== null && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 11, padding: "3px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={9} color="white" />
                      {formatDistance(shop.distance_meters)}
                    </div>
                  )}
                  {shop.active_listings > 0 && (
                    <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 11, padding: "3px 9px", borderRadius: 20 }}>
                      {shop.active_listings} item{shop.active_listings !== 1 ? "s" : ""} available
                    </div>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{shop.shop_name}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>
                        {SHOP_TYPES.find(([v]) => v === shop.shop_type)?.[1] || shop.shop_type}
                      </div>
                    </div>
                    {shop.avg_rating > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fdf8f0", border: "1px solid #f5e8cc", borderRadius: 8, padding: "4px 9px", flexShrink: 0 }}>
                        <Star size={11} color="#e8a020" fill="#e8a020" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{shop.avg_rating}</span>
                      </div>
                    )}
                  </div>

                  {shop.description && (
                    <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, fontWeight: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
                      {shop.description}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#bbb" }}>
                    {shop.address ? (
                      <>
                        <MapPin size={11} color="#ddd" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.address}</span>
                      </>
                    ) : shop.active_listings === 0 ? (
                      <span style={{ color: "#e8a020" }}>No items available right now</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLocationPicker && (
        <LocationPicker
          value={userLocation}
          onChange={loc => { setUserLocation(loc); fetchShops(loc); setShowLocationPicker(false); }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}