import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Home, MapPin, Star, Clock, Phone, ShoppingBag, ArrowLeft, Package } from "lucide-react";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function urgency(expiresAt) {
  const hrs = (new Date(expiresAt) - new Date()) / 36e5;
  if (hrs <= 0)  return { color: "#bbb",    bg: "#f5f5f5", expired: true };
  if (hrs <= 1)  return { color: "#c0392b", bg: "#fff5f5", expired: false };
  if (hrs <= 3)  return { color: "#d35400", bg: "#fff8f0", expired: false };
  return           { color: "#27ae60", bg: "#f0faf4", expired: false };
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

export default function ShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cart, addToCart, itemCount } = useCart();

  const [shop, setShop] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    fetchShop();
    fetchListings();
  }, [id]);

  async function fetchShop() {
    const { data } = await supabase
      .from("seller_profiles")
      .select("*, profiles!user_id(full_name, phone)")
      .eq("user_id", id)
      .single();
    setShop(data);
  }

  async function fetchListings() {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }

  if (!shop && !loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, marginBottom: 12 }}>Shop not found</p>
        <button onClick={() => navigate("/browse")} style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>Browse shops</button>
      </div>
    </div>
  );

  const openNow = shop ? isShopOpen(shop.opening_hours) : false;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .item-card { background: white; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; }
        .item-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .add-btn { background: #111; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-family: inherit; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .add-btn:hover { background: #333; }
        .add-btn.added { background: #27ae60; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 600px) {
          .menu-grid { grid-template-columns: 1fr !important; }
          .shop-meta { flex-direction: column !important; gap: 12px !important; }
        }
      `}</style>

      {/* Sticky Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 58, gap: 16 }}>
          <button onClick={() => navigate("/browse")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#494848", fontFamily: "inherit", fontSize: 14, padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>

          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111", margin: "0 auto" }}>
            <div style={{ width: 24, height: 24, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={12} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700 }}>Home Bite</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <Link to="/orders" style={{ border: "1px solid #e8e8e8", color: "#111", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                <Package size={14} /> Orders
              </Link>
            ) : (
              <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: "#111", textDecoration: "none" }}>Log in</Link>
            )}
            <Link to="/cart" style={{ background: "#111", color: "white", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <ShoppingBag size={14} />
              Cart {itemCount > 0 && <span style={{ background: "white", color: "#111", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Shop Banner */}
      <div style={{ width: "100%", height: 220, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", position: "relative", overflow: "hidden" }}>
        {shop?.banner_image ? (
          <img src={shop.banner_image} alt={shop.shop_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={60} color="#ddd" strokeWidth={1} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
      </div>

      {/* Shop Info */}
      <div style={{ background: "white", borderBottom: "1px solid #efefef" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 0" }}>
          
          <div className="shop-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>{shop?.shop_name || "..."}</h1>
                <span style={{ background: openNow ? "#f0faf4" : "#f5f5f5", color: openNow ? "#27ae60" : "#bbb", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                  {openNow ? "Open now" : "Closed"}
                </span>
              </div>
              <div style={{ fontSize: 14, color: "#aaa", marginBottom: 10 }}>{shop?.shop_type}</div>

              {shop?.description && (
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, fontWeight: 300, maxWidth: 560, marginBottom: 14 }}>
                  {shop.description}
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#888" }}>
                {shop?.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={13} color="#bbb" />
                    {shop.address}
                  </div>
                )}
                {shop?.profiles?.phone && (
                  <a href={`tel:${shop.profiles.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, color: "#888", textDecoration: "none" }}>
                    <Phone size={13} color="#bbb" />
                    {shop.profiles.phone}
                  </a>
                )}
                {shop?.avg_rating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Star size={13} color="#e8a020" fill="#e8a020" />
                    {shop.avg_rating} rating
                  </div>
                )}
              </div>
            </div>

            {/* Opening hours */}
            {shop?.opening_hours && (
              <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 12, padding: "14px 18px", minWidth: 200, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#494848", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} /> Opening Hours
                </div>
                {DAYS.map(day => {
                  const hours = shop.opening_hours[day];
                  const days2 = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                  const isToday = days2[new Date().getDay()] === day;
                  return (
                    <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: isToday ? "#111" : "#aaa", fontWeight: isToday ? 600 : 400 }}>
                      <span>{DAY_LABELS[day]}</span>
                      <span>{hours || "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderTop: "1px solid #f2f2f2", marginTop: 4 }}>
            {["menu", "reviews"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ padding: "14px 20px", fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#111" : "#aaa", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent", fontFamily: "inherit", textTransform: "capitalize" }}
              >
                {tab === "menu" ? `Menu (${listings.length})` : "Reviews"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>

        {activeTab === "menu" && (
          <>
            {loading ? (
              <div className="menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 12, overflow: "hidden" }}>
                    <div className="skeleton" style={{ height: 130 }} />
                    <div style={{ padding: 14 }}>
                      <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: "35%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
                <Package size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 6 }}>No items available right now</p>
                <p style={{ fontSize: 14 }}>Check back later for fresh listings</p>
              </div>
            ) : (
              <div className="menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {listings.map(listing => {
                  const u = urgency(listing.expires_at);
                  const inCart = cart.find(c => c.id === listing.id);
                  return (
                    <div key={listing.id} className="item-card">
                      {/* Image */}
                      <div style={{ height: 130, background: "#f5f2ee", position: "relative", overflow: "hidden" }}>
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Home size={28} color="#ddd" strokeWidth={1} />
                          </div>
                        )}
                        {listing.is_veg !== null && (
                          <div style={{ position: "absolute", top: 8, left: 8, width: 18, height: 18, border: `2px solid ${listing.is_veg ? "#27ae60" : "#c0392b"}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: listing.is_veg ? "#27ae60" : "#c0392b" }} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{listing.title}</div>
                          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>₹{listing.price}</div>
                        </div>

                        {listing.description && (
                          <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5, fontWeight: 300, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {listing.description}
                          </p>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: u.bg, borderRadius: 6, padding: "5px 8px", marginBottom: 12 }}>
                          <Clock size={10} color={u.color} />
                          <span style={{ fontSize: 11, color: u.color, fontWeight: 500 }}>
                            {new Date(listing.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{Math.max(0, listing.available_qty)} left</span>
                        </div>

                        <button
                          className={`add-btn ${inCart ? "added" : ""}`}
                          onClick={() => addToCart(listing)}
                          style={{ width: "100%" }}
                        >
                          {inCart ? "Added to cart" : "Add to cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "reviews" && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
            <Star size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 6 }}>No reviews yet</p>
            <p style={{ fontSize: 14 }}>Reviews will appear here after orders are delivered</p>
          </div>
        )}
      </div>
    </div>
  );
}