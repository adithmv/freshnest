import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Home, Clock, MapPin, Star, ArrowLeft, ShoppingBag, Plus, Minus, X } from "lucide-react";

function urgency(expiresAt) {
  const hrs = (new Date(expiresAt) - new Date()) / 36e5;
  if (hrs <= 1) return { color: "#c0392b", bg: "#fff5f5" };
  if (hrs <= 3) return { color: "#d35400", bg: "#fff8f0" };
  return { color: "#27ae60", bg: "#f0faf4" };
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [qty, setQty]           = useState(1);
  const [address, setAddress]   = useState("");
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered]   = useState(false);
  const [err, setErr]           = useState("");

  useEffect(() => { fetchListing() }, [id]);

  async function fetchListing() {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*, seller_profiles(shop_name, avg_rating, shop_type, description), categories(name), reviews(rating, comment, created_at, profiles(full_name))")
      .eq("id", id)
      .single();
    setListing(data);
    setLoading(false);
  }

  async function placeOrder() {
    if (!user) return navigate("/login");
    if (!address.trim()) return setErr("Please enter a delivery address");
    setErr("");
    setOrdering(true);
    const { error } = await supabase.from("orders").insert({
      buyer_id:         user.id,
      seller_id:        listing.seller_id,
      listing_id:       listing.id,
      quantity:         qty,
      unit_price:       listing.price,
      total_amount:     listing.price * qty,
      delivery_address: address,
      payment_method:   "cod",
    });
    setOrdering(false);
    if (error) return setErr(error.message);
    setOrdered(true);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", color: "#bbb" }}>
      Loading...
    </div>
  );

  if (!listing) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", color: "#bbb", gap: 16 }}>
      <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22 }}>Listing not found</p>
      <Link to="/browse" style={{ fontSize: 14, color: "#111", textDecoration: "none", borderBottom: "1px solid #111" }}>Back to browse</Link>
    </div>
  );

  const u = urgency(listing.expires_at);
  const total = listing.price * qty;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .form-input { width: 100%; border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; background: white; }
        .form-input:focus { border-color: #111; }
        .success-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontFamily: "inherit" }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: "#e8e8e8" }}>|</span>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>

          {/* Left */}
          <div>
            {/* Image */}
            <div style={{ height: 320, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, overflow: "hidden", border: "1px solid #efefef" }}>
              {listing.images?.[0] ? (
                <img src={listing.images[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: "#ccc" }}>
                  <Home size={52} strokeWidth={1} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13 }}>No photo yet</p>
                </div>
              )}
            </div>

            {/* Title & seller */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, lineHeight: 1.2 }}>{listing.title}</h1>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, flexShrink: 0, marginLeft: 16 }}>₹{listing.price}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: "#888" }}>{listing.seller_profiles?.shop_name}</span>
              {listing.seller_profiles?.avg_rating > 0 && (
                <>
                  <span style={{ color: "#e8e8e8" }}>·</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={13} color="#e8a020" fill="#e8a020" />
                    <span style={{ fontSize: 13, color: "#888" }}>{listing.seller_profiles.avg_rating}</span>
                  </div>
                </>
              )}
              {listing.categories?.name && (
                <>
                  <span style={{ color: "#e8e8e8" }}>·</span>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{listing.categories.name}</span>
                </>
              )}
            </div>

            {/* Expiry */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: u.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 24, border: `1px solid ${u.color}22` }}>
              <Clock size={13} color={u.color} />
              <span style={{ fontSize: 13, color: u.color, fontWeight: 500 }}>
                Expires {new Date(listing.expires_at).toLocaleString("en-IN", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "#aaa" }}>{listing.available_qty} of {listing.total_quantity} left</span>
            </div>

            {/* Description */}
            {listing.description && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>About this listing</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.75, fontWeight: 300 }}>{listing.description}</p>
              </div>
            )}

            {/* Tags */}
            {listing.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                {listing.tags.map(tag => (
                  <span key={tag} style={{ background: "#f5f5f5", color: "#666", fontSize: 12, padding: "4px 12px", borderRadius: 20, border: "1px solid #efefef" }}>{tag}</span>
                ))}
                <span style={{ background: listing.is_veg ? "#f0faf4" : "#fff5f5", color: listing.is_veg ? "#27ae60" : "#c0392b", fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>
                  {listing.is_veg ? "Veg" : "Non-Veg"}
                </span>
              </div>
            )}

            {/* Seller info */}
            {listing.seller_profiles?.description && (
              <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 12, padding: 20, marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>About the seller</h3>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontWeight: 300 }}>{listing.seller_profiles.description}</p>
              </div>
            )}

            {/* Reviews */}
            {listing.reviews?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Reviews ({listing.reviews.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {listing.reviews.map((r, i) => (
                    <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{r.profiles?.full_name}</span>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} color="#e8a020" fill={i < r.rating ? "#e8a020" : "none"} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, fontWeight: 300 }}>{r.comment}</p>}
                      <p style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Order box */}
          <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 24, position: "sticky", top: 80 }}>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Place order</h3>

            {/* Qty selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10 }}>Quantity</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 36, height: 36, border: "1px solid #e8e8e8", borderRadius: 8, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(listing.available_qty, q + 1))}
                  style={{ width: 36, height: 36, border: "1px solid #e8e8e8", borderRadius: 8, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Plus size={14} />
                </button>
                <span style={{ fontSize: 13, color: "#bbb" }}>of {listing.available_qty} available</span>
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Delivery address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter your full delivery address..."
                rows={3}
                className="form-input"
                style={{ resize: "none" }}
              />
              {err && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>{err}</p>}
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid #f2f2f2", borderBottom: "1px solid #f2f2f2", marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: "#888" }}>Total</span>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700 }}>₹{total}</span>
            </div>

            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#27ae60" }} />
              Cash on delivery
            </div>

            <button
              onClick={placeOrder}
              disabled={ordering || listing.available_qty === 0}
              style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: (ordering || listing.available_qty === 0) ? "not-allowed" : "pointer", opacity: (ordering || listing.available_qty === 0) ? 0.6 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ShoppingBag size={15} />
              {listing.available_qty === 0 ? "Sold out" : ordering ? "Placing order..." : "Place order"}
            </button>

            {!user && (
              <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 12 }}>
                <Link to="/login" style={{ color: "#111", fontWeight: 500 }}>Log in</Link> to place an order
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success */}
      {ordered && (
        <div className="success-overlay">
          <div style={{ background: "white", borderRadius: 16, padding: "40px 32px", textAlign: "center", maxWidth: 340, width: "100%" }}>
            <div style={{ width: 52, height: 52, background: "#f0faf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <ShoppingBag size={22} color="#27ae60" />
            </div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Order placed</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>
              Your order for {qty} {listing.unit_label} of {listing.title} is confirmed. Pay ₹{total} cash on delivery.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/browse")} style={{ flex: 1, background: "#111", color: "white", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Browse more
              </button>
              <button onClick={() => navigate("/orders")} style={{ flex: 1, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "11px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                My orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
