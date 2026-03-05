import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Home, MapPin, Clock, Search, SlidersHorizontal, Star, LogOut, ShoppingBag, X } from "lucide-react";

const FILTERS = ["All", "Veg", "Non-Veg", "Bakery", "Rice & Biryani", "Sweets & Desserts", "Snacks", "Thali & Meals"];

function urgency(expiresAt) {
  const hrs = (new Date(expiresAt) - new Date()) / 36e5;
  if (hrs <= 1)  return { color: "#c0392b", bg: "#fff5f5", label: "Expires soon" };
  if (hrs <= 3)  return { color: "#d35400", bg: "#fff8f0", label: "Expiring today" };
  return          { color: "#27ae60", bg: "#f0faf4", label: "Fresh" };
}

export default function Feed() {
  const { user, profile, signOut } = useAuth();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");
  const [cart, setCart]           = useState([]);
  const [showCart, setShowCart]   = useState(false);
  const [ordering, setOrdering]   = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [address, setAddress]     = useState("");
  const [addressErr, setAddressErr] = useState("");

  useEffect(() => { fetchListings() }, []);

  async function fetchListings() {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*, seller_profiles(shop_name, avg_rating, shop_type), categories(name)")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }

  const filtered = listings.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.seller_profiles?.shop_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ? true :
      filter === "Veg" ? l.is_veg :
      filter === "Non-Veg" ? !l.is_veg :
      l.categories?.name === filter || l.tags?.includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  function addToCart(listing) {
    setCart(prev => prev.find(c => c.id === listing.id) ? prev : [...prev, { ...listing, qty: 1 }]);
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  async function placeOrder() {
    if (!user) { window.location.href = "/login"; return; }
    if (!address.trim()) { setAddressErr("Please enter a delivery address"); return; }
    setAddressErr("");
    setOrdering(true);
    for (const item of cart) {
      await supabase.from("orders").insert({
        buyer_id: user.id,
        seller_id: item.seller_id,
        listing_id: item.id,
        quantity: item.qty,
        unit_price: item.price,
        total_amount: item.price * item.qty,
        delivery_address: address,
        payment_method: "cod",
      });
    }
    setOrdering(false);
    setOrderDone(true);
    setCart([]);
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .listing-card { background: white; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; cursor: pointer; }
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

          {/* Search */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "9px 14px", maxWidth: 400 }}>
            <Search size={14} color="#aaa" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search food or seller..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: "#111" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", flexShrink: 0 }}>
            <MapPin size={13} color="#aaa" />
            <span>Taliparamba, Kerala</span>
          </div>

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
            <button
              onClick={() => setShowCart(true)}
              style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
            >
              <ShoppingBag size={14} />
              Cart {cart.length > 0 && <span style={{ background: "white", color: "#111", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cart.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div style={{ background: "white", borderBottom: "1px solid #f2f2f2", padding: "12px 32px", overflowX: "auto" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 8 }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>
            {loading ? "Loading..." : `${filtered.length} listings near you`}
          </h2>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#555" }}>
            <SlidersHorizontal size={13} /> Sort
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: 140, background: "#f5f5f5" }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 14, background: "#f0f0f0", borderRadius: 4, marginBottom: 8, width: "60%" }} />
                  <div style={{ height: 12, background: "#f5f5f5", borderRadius: 4, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <ShoppingBag size={40} strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, marginBottom: 8 }}>No listings found</p>
            <p style={{ fontSize: 14 }}>Try a different filter or check back later</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtered.map(listing => {
              const u = urgency(listing.expires_at);
              const inCart = cart.find(c => c.id === listing.id);
              return (
                <div key={listing.id} className="listing-card">
                  {/* Image */}
                  <div style={{ height: 140, background: "linear-gradient(135deg, #f5f2ee, #ede8df)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
                  </div>

                  <div style={{ padding: 16 }}>
                    {/* Seller */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{listing.title}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{listing.seller_profiles?.shop_name}</div>
                      </div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>₹{listing.price}</div>
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 10, fontWeight: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {listing.description}
                      </p>
                    )}

                    {/* Expiry */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: u.bg, borderRadius: 7, padding: "6px 10px", marginBottom: 12 }}>
                      <Clock size={11} color={u.color} />
                      <span style={{ fontSize: 11, color: u.color, fontWeight: 500 }}>
                        {new Date(listing.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{listing.available_qty} left</span>
                    </div>

                    {/* Rating + Add */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={11} color="#e8a020" fill="#e8a020" />
                        <span style={{ fontSize: 12, color: "#888" }}>{listing.seller_profiles?.avg_rating || "New"}</span>
                      </div>
                      <button
                        className={`add-btn ${inCart ? "added" : ""}`}
                        onClick={() => addToCart(listing)}
                      >
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

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div className="overlay" onClick={() => setShowCart(false)} />
          <div className="cart-panel">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f2f2f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>Your cart</h2>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#ccc" }}>
                  <ShoppingBag size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 16, padding: 12, background: "#fafafa", borderRadius: 10 }}>
                    <div style={{ width: 44, height: 44, background: "#f0ece6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Home size={18} color="#ccc" strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{item.seller_profiles?.shop_name}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>₹{item.price}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", alignSelf: "flex-start" }}><X size={16} /></button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #f2f2f2" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Delivery address</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address..."
                    rows={2}
                    style={{ width: "100%", border: "1px solid #e8e8e8", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit" }}
                  />
                  {addressErr && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>{addressErr}</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, color: "#888" }}>Total</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>₹{cartTotal}</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60" }} />
                  Cash on delivery
                </div>
                <button
                  onClick={placeOrder}
                  disabled={ordering}
                  style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: ordering ? "not-allowed" : "pointer", opacity: ordering ? 0.7 : 1 }}
                >
                  {ordering ? "Placing order..." : "Place order"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Success Modal */}
      {orderDone && (
        <div className="success-modal">
          <div style={{ background: "white", borderRadius: 16, padding: "40px 32px", textAlign: "center", maxWidth: 340, width: "90%" }}>
            <div style={{ width: 56, height: 56, background: "#f0faf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingBag size={24} color="#27ae60" />
            </div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Order placed</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>Your order is confirmed. Pay cash to the delivery person when your food arrives.</p>
            <button
              onClick={() => setOrderDone(false)}
              style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Back to browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
