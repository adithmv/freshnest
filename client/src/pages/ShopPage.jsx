import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Home, MapPin, Star, Clock, Phone, ShoppingBag, ArrowLeft, Package, Send } from "lucide-react";

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

function StarRating({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} color="#e8a020" fill={(hovered || value) >= n ? "#e8a020" : "none"}
          style={{ cursor: onChange ? "pointer" : "default", transition: "fill 0.1s" }}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
        />
      ))}
    </div>
  );
}

export default function ShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, addToCart, itemCount } = useCart();

  const [shop, setShop] = useState(null);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");
  const [activeCategory, setActiveCategory] = useState("all");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewErr, setReviewErr] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => { fetchShop(); fetchListings(); fetchCategories(); }, [id]);

  useEffect(() => {
    if (activeTab === "reviews") { fetchReviews(); if (user) fetchEligibleOrders(); }
  }, [activeTab, id, user]);

  async function fetchShop() {
    const { data } = await supabase.from("seller_profiles").select("*, profiles!user_id(full_name, phone)").eq("user_id", id).single();
    setShop(data);
  }

  async function fetchListings() {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*, category:shop_categories(id, name)").eq("seller_id", id).eq("status", "active").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase.from("shop_categories").select("*").eq("shop_id", id).order("sort_order", { ascending: true });
    setCategories(data || []);
  }

  async function fetchReviews() {
    setReviewsLoading(true);
    const { data } = await supabase.from("reviews").select("*, buyer:profiles!buyer_id(full_name)").eq("shop_id", id).order("created_at", { ascending: false });
    setReviews(data || []);
    setReviewsLoading(false);
  }

  async function fetchEligibleOrders() {
    const { data: reviewed } = await supabase.from("reviews").select("order_id").eq("shop_id", id).eq("buyer_id", user.id);
    const reviewedIds = reviewed?.map(r => r.order_id) || [];
    const { data: orders } = await supabase.from("orders").select("id, listings(title), placed_at").eq("buyer_id", user.id).eq("seller_id", id).eq("status", "delivered");
    const eligible = (orders || []).filter(o => !reviewedIds.includes(o.id));
    setEligibleOrders(eligible);
    if (eligible.length > 0) setSelectedOrder(eligible[0].id);
  }

  async function submitReview() {
    setReviewErr("");
    if (!rating) return setReviewErr("Please select a star rating");
    if (!selectedOrder) return setReviewErr("No eligible order found");
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({ shop_id: id, buyer_id: user.id, order_id: selectedOrder, rating, comment: comment.trim() || null });
    if (error) { setReviewErr(error.message); } else { setReviewSuccess(true); setRating(0); setComment(""); fetchReviews(); fetchEligibleOrders(); fetchShop(); }
    setSubmitting(false);
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
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const filteredListings = activeCategory === "all"
    ? listings
    : listings.filter(l => l.shop_categories?.id === activeCategory);

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
        .cat-btn { border: 1px solid #e8e8e8; border-radius: 20px; padding: 6px 16px; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 0.15s; background: white; color: #555; white-space: nowrap; }
        .cat-btn.active { background: #111; color: white; border-color: #111; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .review-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 18px; margin-bottom: 12px; }
        .form-input { width: 100%; border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
        .form-input:focus { border-color: #111; }
        @media (max-width: 600px) {
          .menu-grid { grid-template-columns: 1fr !important; }
          .shop-meta { flex-direction: column !important; gap: 12px !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 58, gap: 16 }}>
          <button onClick={() => navigate("/browse")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#494848", fontFamily: "inherit", fontSize: 14, padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111", margin: "0 auto" }}>
            <div style={{ width: 24, height: 24, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Home size={12} color="white" /></div>
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

      {/* Banner */}
      <div style={{ width: "100%", height: 220, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", position: "relative", overflow: "hidden" }}>
        {shop?.banner_image ? <img src={shop.banner_image} alt={shop.shop_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Home size={60} color="#ddd" strokeWidth={1} /></div>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
      </div>

      {/* Shop Info */}
      <div style={{ background: "white", borderBottom: "1px solid #efefef" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 0" }}>
          <div className="shop-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>{shop?.shop_name || "..."}</h1>
                <span style={{ background: openNow ? "#f0faf4" : "#f5f5f5", color: openNow ? "#27ae60" : "#bbb", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{openNow ? "Open now" : "Closed"}</span>
              </div>
              <div style={{ fontSize: 14, color: "#aaa", marginBottom: 10 }}>{shop?.shop_type}</div>
              {shop?.description && <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, fontWeight: 300, maxWidth: 560, marginBottom: 14 }}>{shop.description}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#888" }}>
                {shop?.address && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} color="#bbb" />{shop.address}</div>}
                {shop?.profiles?.phone && <a href={`tel:${shop.profiles.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, color: "#888", textDecoration: "none" }}><Phone size={13} color="#bbb" />{shop.profiles.phone}</a>}
                {avgRating && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Star size={13} color="#e8a020" fill="#e8a020" />{avgRating} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})</div>}
              </div>
            </div>
            {shop?.opening_hours && (
              <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 12, padding: "14px 18px", minWidth: 200, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#494848", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Clock size={12} /> Opening Hours</div>
                {DAYS.map(day => {
                  const hours = shop.opening_hours[day];
                  const days2 = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                  const isToday = days2[new Date().getDay()] === day;
                  return (
                    <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: isToday ? "#111" : "#aaa", fontWeight: isToday ? 600 : 400 }}>
                      <span>{DAY_LABELS[day]}</span><span>{hours || "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderTop: "1px solid #f2f2f2", marginTop: 4 }}>
            {["menu", "reviews"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "14px 20px", fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#111" : "#aaa", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent", fontFamily: "inherit", textTransform: "capitalize" }}>
                {tab === "menu" ? `Menu (${listings.length})` : `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>

        {activeTab === "menu" && (
          <>
            {/* Category filter bar */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
                <button className={`cat-btn ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>
                  All ({listings.length})
                </button>
                {categories.map(cat => {
                  const count = listings.filter(l => l.shop_categories?.id === cat.id).length;
                  return (
                    <button key={cat.id} className={`cat-btn ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}

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
            ) : filteredListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
                <Package size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 6 }}>
                  {activeCategory === "all" ? "No items available right now" : "No items in this category"}
                </p>
                <p style={{ fontSize: 14 }}>Check back later for fresh listings</p>
              </div>
            ) : (
              <div className="menu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filteredListings.map(listing => {
                  const u = urgency(listing.expires_at);
                  const inCart = cart.find(c => c.id === listing.id);
                  return (
                    <div key={listing.id} className="item-card">
                      <div style={{ height: 130, background: "#f5f2ee", position: "relative", overflow: "hidden" }}>
                        {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Home size={28} color="#ddd" strokeWidth={1} /></div>}
                        {listing.is_veg !== null && (
                          <div style={{ position: "absolute", top: 8, left: 8, width: 18, height: 18, border: `2px solid ${listing.is_veg ? "#27ae60" : "#c0392b"}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: listing.is_veg ? "#27ae60" : "#c0392b" }} />
                          </div>
                        )}
                        {listing.shop_categories?.name && (
                          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{listing.shop_categories.name}</div>
                        )}
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{listing.title}</div>
                          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>₹{listing.price}</div>
                        </div>
                        {listing.description && <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5, fontWeight: 300, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{listing.description}</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: u.bg, borderRadius: 6, padding: "5px 8px", marginBottom: 12 }}>
                          <Clock size={10} color={u.color} />
                          <span style={{ fontSize: 11, color: u.color, fontWeight: 500 }}>{new Date(listing.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{Math.max(0, listing.available_qty)} left</span>
                        </div>
                        <button className={`add-btn ${inCart ? "added" : ""}`} onClick={() => addToCart(listing)} style={{ width: "100%" }}>
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

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div style={{ maxWidth: 640 }}>
            {user && eligibleOrders.length > 0 && !reviewSuccess && (
              <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Leave a review</h3>
                {eligibleOrders.length > 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Order</label>
                    <select className="form-input" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} style={{ background: "white" }}>
                      {eligibleOrders.map(o => <option key={o.id} value={o.id}>{o.listings?.title} — {new Date(o.placed_at).toLocaleDateString("en-IN")}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10 }}>Rating</label>
                  <StarRating value={rating} onChange={setRating} size={28} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Comment (optional)</label>
                  <textarea className="form-input" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Share your experience..." style={{ resize: "none" }} />
                </div>
                {reviewErr && <div style={{ background: "#fff0f0", border: "1px solid #fdd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 14 }}>{reviewErr}</div>}
                <button onClick={submitReview} disabled={submitting} style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                  <Send size={14} /> {submitting ? "Submitting..." : "Submit review"}
                </button>
              </div>
            )}

            {reviewSuccess && <div style={{ background: "#f0faf4", border: "1px solid #c8e6c9", borderRadius: 12, padding: 18, marginBottom: 24, fontSize: 14, color: "#27ae60", fontWeight: 500 }}>✓ Thank you for your review!</div>}

            {!user && <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 12, padding: 18, marginBottom: 24, fontSize: 14, color: "#888" }}><Link to="/login" style={{ color: "#111", fontWeight: 600 }}>Log in</Link> to leave a review after your order is delivered.</div>}

            {reviewsLoading ? <div style={{ color: "#bbb", fontSize: 14 }}>Loading reviews...</div> :
            reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
                <Star size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 6 }}>No reviews yet</p>
                <p style={{ fontSize: 14 }}>Be the first to review this shop</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 20 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{avgRating}</div>
                    <StarRating value={Math.round(avgRating)} size={14} />
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(n => {
                      const count = reviews.filter(r => r.rating === n).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#aaa", width: 8 }}>{n}</span>
                          <Star size={10} color="#e8a020" fill="#e8a020" />
                          <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#e8a020", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#aaa", width: 20 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{review.buyer?.full_name || "Customer"}</div>
                        <StarRating value={review.rating} size={14} />
                      </div>
                      <div style={{ fontSize: 12, color: "#bbb" }}>{new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    {review.comment && <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, fontWeight: 300 }}>{review.comment}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
