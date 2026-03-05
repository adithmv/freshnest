import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Home, Plus, X, Clock, ShoppingBag, Check, ChevronDown, LogOut, Package, Star, TrendingUp } from "lucide-react";

const STATUS_FLOW = { placed: "confirmed", confirmed: "preparing", preparing: "ready", ready: "picked_up", picked_up: "delivered" };
const STATUS_LABEL = { placed: "New", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", picked_up: "With Rider", delivered: "Delivered", cancelled: "Cancelled" };
const STATUS_COLOR = { placed: "#2980b9", confirmed: "#8e44ad", preparing: "#d35400", ready: "#27ae60", picked_up: "#16a085", delivered: "#111", cancelled: "#bbb" };

export default function SellerDashboard() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab]               = useState("orders");
  const [orders, setOrders]         = useState([]);
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr]       = useState("");
  const [form, setForm]             = useState({
    title: "", description: "", price: "", total_quantity: "",
    unit_label: "packet", is_veg: true, tags: "", expires_at: "",
  });

  useEffect(() => { if (user) { fetchOrders(); fetchListings(); } }, [user]);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, listings(title, price), profiles!buyer_id(full_name, phone)")
      .eq("seller_id", user.id)
      .order("placed_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function fetchListings() {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setListings(data || []);
  }

  async function updateOrderStatus(orderId, nextStatus) {
    const update = { status: nextStatus };
    const tsMap = { confirmed: "confirmed_at", ready: "ready_at", picked_up: "picked_up_at", delivered: "delivered_at", cancelled: "cancelled_at" };
    if (tsMap[nextStatus]) update[tsMap[nextStatus]] = new Date().toISOString();
    await supabase.from("orders").update(update).eq("id", orderId);
    fetchOrders();
  }

  async function removeListing(id) {
    await supabase.from("listings").update({ status: "removed" }).eq("id", id);
    fetchListings();
  }

  async function submitListing(e) {
    e.preventDefault();
    setFormErr("");
    if (!form.title || !form.price || !form.total_quantity || !form.expires_at) {
      return setFormErr("Please fill all required fields");
    }
    setSubmitting(true);
    const { error } = await supabase.from("listings").insert({
      seller_id:      user.id,
      title:          form.title,
      description:    form.description,
      price:          parseFloat(form.price),
      total_quantity: parseInt(form.total_quantity),
      available_qty:  parseInt(form.total_quantity),
      unit_label:     form.unit_label,
      is_veg:         form.is_veg,
      tags:           form.tags.split(",").map(t => t.trim()).filter(Boolean),
      expires_at:     new Date(form.expires_at).toISOString(),
      status:         "active",
    });
    setSubmitting(false);
    if (error) return setFormErr(error.message);
    setShowForm(false);
    setForm({ title: "", description: "", price: "", total_quantity: "", unit_label: "packet", is_veg: true, tags: "", expires_at: "" });
    fetchListings();
    setTab("listings");
  }

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total_amount, 0);
  const activeListings = listings.filter(l => l.status === "active").length;
  const pendingOrders = orders.filter(o => o.status === "placed").length;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; padding: "10px 0"; font-size: 14px; font-family: inherit; cursor: pointer; color: #aaa; border-bottom: 2px solid transparent; transition: all 0.15s; padding-bottom: 12px; }
        .tab-btn.active { color: #111; border-bottom-color: #111; }
        .order-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 20px; margin-bottom: 14px; }
        .listing-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 18px; }
        .stat-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 20px; }
        .form-input { width: 100%; border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
        .form-input:focus { border-color: #111; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 20 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
          <span style={{ fontSize: 13, color: "#ccc" }}>|</span>
          <span style={{ fontSize: 14, color: "#888" }}>Seller Dashboard</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#888" }}>{profile?.full_name}</span>
            <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { icon: TrendingUp, label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` },
            { icon: Package,    label: "Active Listings", value: activeListings },
            { icon: ShoppingBag, label: "Pending Orders", value: pendingOrders },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color="#888" strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs + action */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f2f2f2", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 28 }}>
            {[["orders", "Orders"], ["listings", "My Listings"]].map(([key, label]) => (
              <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>
          {tab === "listings" && (
            <button
              onClick={() => setShowForm(true)}
              style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}
            >
              <Plus size={14} /> New listing
            </button>
          )}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          loading ? <p style={{ color: "#bbb", fontSize: 14 }}>Loading orders...</p> :
          orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <ShoppingBag size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18 }}>No orders yet</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{order.listings?.title}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>
                      {order.profiles?.full_name} · {order.delivery_address}
                    </div>
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
                      {new Date(order.placed_at).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>₹{order.total_amount}</div>
                    <div style={{ display: "inline-block", background: STATUS_COLOR[order.status] + "18", color: STATUS_COLOR[order.status], fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                      {STATUS_LABEL[order.status]}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {STATUS_FLOW[order.status] && (
                    <button
                      onClick={() => updateOrderStatus(order.id, STATUS_FLOW[order.status])}
                      style={{ background: "#111", color: "white", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Check size={12} /> Mark as {STATUS_LABEL[STATUS_FLOW[order.status]]}
                    </button>
                  )}
                  {order.status === "placed" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      style={{ background: "none", border: "1px solid #eee", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer", color: "#aaa", fontFamily: "inherit" }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {/* Listings tab */}
        {tab === "listings" && (
          listings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <Package size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 8 }}>No listings yet</p>
              <p style={{ fontSize: 14 }}>Click New listing to post your first item</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {listings.map(l => (
                <div key={l.id} className="listing-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</div>
                    <button onClick={() => removeListing(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}><X size={15} /></button>
                  </div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>₹{l.price}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#aaa", marginBottom: 10 }}>
                    <span>{l.available_qty} / {l.total_quantity} left</span>
                    <span>·</span>
                    <span>{l.unit_label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fdf9f5", border: "1px solid #f0e8dc", borderRadius: 6, padding: "6px 9px", marginBottom: 10 }}>
                    <Clock size={11} color="#c97b3a" />
                    <span style={{ fontSize: 11, color: "#c97b3a", fontWeight: 500 }}>
                      Expires {new Date(l.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div style={{ display: "inline-block", background: l.status === "active" ? "#f0faf4" : "#f5f5f5", color: l.status === "active" ? "#27ae60" : "#aaa", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                    {l.status}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* New Listing Modal */}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #f2f2f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>New listing</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><X size={20} /></button>
            </div>

            <form onSubmit={submitListing} style={{ padding: "24px 28px" }}>
              {formErr && (
                <div style={{ background: "#fff0f0", border: "1px solid #fdd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 18 }}>
                  {formErr}
                </div>
              )}

              {[
                { label: "Title *", key: "title", type: "text", placeholder: "e.g. Homemade Biryani" },
                { label: "Price (₹) *", key: "price", type: "number", placeholder: "120" },
                { label: "Quantity *", key: "total_quantity", type: "number", placeholder: "5" },
                { label: "Unit label", key: "unit_label", type: "text", placeholder: "packet, box, kg..." },
                { label: "Tags (comma separated)", key: "tags", type: "text", placeholder: "spicy, homemade, veg" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="form-input"
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  placeholder="Tell buyers what makes this special..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="form-input"
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Expires at *</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10 }}>Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["veg", true], ["non-veg", false]].map(([label, val]) => (
                    <div
                      key={label}
                      onClick={() => setForm(p => ({ ...p, is_veg: val }))}
                      style={{ flex: 1, border: `1.5px solid ${form.is_veg === val ? "#111" : "#e8e8e8"}`, borderRadius: 8, padding: "9px", cursor: "pointer", textAlign: "center", background: form.is_veg === val ? "#111" : "white", transition: "all 0.15s" }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: form.is_veg === val ? "white" : "#111" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}
              >
                {submitting ? "Posting..." : "Post listing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
