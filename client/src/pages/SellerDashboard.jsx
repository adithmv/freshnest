import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Home, Plus, X, Clock, ShoppingBag, Check, LogOut, Package, TrendingUp, Upload, Image, MapPin, Camera, Tag, Trash2 } from "lucide-react";
import LocationPicker from "../components/ui/LocationPicker";

const STATUS_FLOW  = { placed: "confirmed", confirmed: "preparing", preparing: "ready", ready: "picked_up", picked_up: "delivered" };
const STATUS_LABEL = { placed: "New", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", picked_up: "With Rider", delivered: "Delivered", cancelled: "Cancelled" };
const STATUS_COLOR = { placed: "#2980b9", confirmed: "#8e44ad", preparing: "#d35400", ready: "#27ae60", picked_up: "#16a085", delivered: "#111", cancelled: "#bbb" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const SHOP_TYPES = [["home_cook","Home Kitchen"],["bakery","Bakery"],["tiffin","Tiffin Service"],["sweet_shop","Sweets & Snacks"],["other","Other"]];
const DEFAULT_HOURS = { mon: "9:00-21:00", tue: "9:00-21:00", wed: "9:00-21:00", thu: "9:00-21:00", fri: "9:00-21:00", sat: "9:00-21:00", sun: "9:00-21:00" };

function urgency(expiresAt) {
  const hrs = (new Date(expiresAt) - new Date()) / 36e5;
  if (hrs <= 0) return { color: "#bbb", bg: "#f5f5f5", expired: true };
  if (hrs <= 1) return { color: "#c0392b", bg: "#fff5f5", expired: false };
  if (hrs <= 3) return { color: "#d35400", bg: "#fff8f0", expired: false };
  return { color: "#27ae60", bg: "#f0faf4", expired: false };
}

export default function SellerDashboard() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [listingLocation, setListingLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "", description: "", price: "", total_quantity: "",
    unit_label: "packet", is_veg: true, expires_at: "", category_id: "",
  });

  const [shopProfile, setShopProfile] = useState(null);
  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("home_cook");
  const [shopDesc, setShopDesc] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopLat, setShopLat] = useState(null);
  const [shopLng, setShopLng] = useState(null);
  const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [showShopLocationPicker, setShowShopLocationPicker] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [shopSaved, setShopSaved] = useState(false);
  const bannerRef = useRef(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    if (user) { fetchOrders(); fetchListings(); fetchShopProfile(); fetchCategories(); }
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`*, listings(id, title, price, images, unit_label), buyer:profiles!buyer_id(full_name, phone)`)
      .eq("seller_id", user.id)
      .order("placed_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function fetchListings() {
    const { data } = await supabase
      .from("listings")
      .select("*, shop_categories(name)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setListings(data || []);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from("shop_categories")
      .select("*")
      .eq("shop_id", user.id)
      .order("sort_order", { ascending: true });
    setCategories(data || []);
  }

  async function fetchShopProfile() {
    const { data } = await supabase.from("seller_profiles").select("*").eq("user_id", user.id).single();
    if (data) {
      setShopProfile(data);
      setShopName(data.shop_name || "");
      setShopType(data.shop_type || "home_cook");
      setShopDesc(data.description || "");
      setShopAddress(data.address || "");
      setShopLat(data.lat || null);
      setShopLng(data.lng || null);
      setOpeningHours(data.opening_hours || DEFAULT_HOURS);
      if (data.banner_image) setBannerPreview(data.banner_image);
    }
  }

  async function saveShopProfile() {
    setSavingShop(true);
    let bannerUrl = shopProfile?.banner_image || null;
    if (bannerFile) {
      const ext = bannerFile.name.split(".").pop();
      const path = `${user.id}/banner.${ext}`;
      const { error } = await supabase.storage.from("shop-images").upload(path, bannerFile, { upsert: true });
      if (!error) { const { data } = supabase.storage.from("shop-images").getPublicUrl(path); bannerUrl = data.publicUrl; }
    }
    await supabase.from("seller_profiles").upsert({
      user_id: user.id, shop_name: shopName, shop_type: shopType, description: shopDesc,
      address: shopAddress, lat: shopLat, lng: shopLng, opening_hours: openingHours, banner_image: bannerUrl,
    }, { onConflict: "user_id" });
    setSavingShop(false); setShopSaved(true); setBannerFile(null);
    setTimeout(() => setShopSaved(false), 3000);
    fetchShopProfile();
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    await supabase.from("shop_categories").insert({ shop_id: user.id, name: newCategoryName.trim(), sort_order: categories.length });
    setNewCategoryName(""); setAddingCategory(false); fetchCategories();
  }

  async function deleteCategory(id) {
    await supabase.from("shop_categories").delete().eq("id", id);
    fetchCategories();
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

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormErr("Image must be under 5MB"); return; }
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(listingId) {
    if (!imageFile) return null;
    setUploadProgress(true);
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${listingId}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, imageFile, { upsert: true });
    setUploadProgress(false);
    if (error) { setFormErr(error.message); return null; }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function submitListing(e) {
    e.preventDefault(); setFormErr("");
    if (!form.title || !form.price || !form.total_quantity || !form.expires_at) return setFormErr("Please fill all required fields");
    setSubmitting(true);
    const { data: listing, error } = await supabase.from("listings").insert({
      seller_id: user.id, title: form.title, description: form.description,
      price: parseFloat(form.price), total_quantity: parseInt(form.total_quantity),
      available_qty: parseInt(form.total_quantity), unit_label: form.unit_label,
      is_veg: form.is_veg, tags: [],
      expires_at: new Date(form.expires_at).toISOString(), status: "active",
      location: listingLocation ? `POINT(${listingLocation.lng} ${listingLocation.lat})` : null,
      address_hint: listingLocation?.address?.slice(0, 100) || null,
      lat: listingLocation?.lat || null, lng: listingLocation?.lng || null,
      category_id: form.category_id || null,
    }).select().single();
    if (error) { setFormErr(error.message); setSubmitting(false); return; }
    if (imageFile) { const url = await uploadImage(listing.id); if (url) await supabase.from("listings").update({ images: [url] }).eq("id", listing.id); }
    setSubmitting(false); setShowForm(false);
    setForm({ title: "", description: "", price: "", total_quantity: "", unit_label: "packet", is_veg: true, expires_at: "", category_id: "" });
    setImageFile(null); setImagePreview(null); setListingLocation(null);
    fetchListings(); setTab("listings");
  }

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total_amount, 0);
  const activeListings = listings.filter(l => l.status === "active").length;
  const pendingOrders = orders.filter(o => o.status === "placed").length;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; font-size: 14px; font-family: inherit; cursor: pointer; color: #aaa; border-bottom: 2px solid transparent; transition: all 0.15s; padding-bottom: 12px; }
        .tab-btn.active { color: #111; border-bottom-color: #111; font-weight: 600; }
        .order-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 20px; margin-bottom: 14px; }
        .listing-card { background: white; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; }
        .stat-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 20px; }
        .form-input { width: 100%; border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
        .form-input:focus { border-color: #111; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .upload-area { border: 2px dashed #e8e8e8; border-radius: 10px; padding: 28px; text-align: center; cursor: pointer; transition: border-color 0.15s; }
        .upload-area:hover { border-color: #494848; }
        @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Home size={13} color="white" /></div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>Home Bite</span>
          </Link>
          <span style={{ fontSize: 13, color: "#ddd" }}>|</span>
          <span style={{ fontSize: 14, color: "#aaa" }}>Seller Dashboard</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#444" }}>{profile?.full_name}</span>
            <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[{ icon: TrendingUp, label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` }, { icon: Package, label: "Active Listings", value: activeListings }, { icon: ShoppingBag, label: "Pending Orders", value: pendingOrders }].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} color="#444" strokeWidth={1.5} /></div>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f2f2f2", marginBottom: 28, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 28 }}>
            {[["orders","Orders"],["listings","My Listings"],["categories","Categories"],["shop","Shop Profile"]].map(([key, label]) => (
              <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)} style={{ whiteSpace: "nowrap" }}>{label}</button>
            ))}
          </div>
          {tab === "listings" && (
            <button onClick={() => setShowForm(true)} style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit", flexShrink: 0, marginLeft: 16 }}>
              <Plus size={14} /> New listing
            </button>
          )}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          loading ? <p style={{ color: "#bbb", fontSize: 14 }}>Loading orders...</p> :
          orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <ShoppingBag size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18 }}>No orders yet</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="order-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{order.listings?.title}</div>
                  <div style={{ fontSize: 13, color: "#494848" }}>{order.buyer?.full_name} · {order.delivery_address}</div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>{new Date(order.placed_at).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>₹{order.total_amount}</div>
                  <div style={{ display: "inline-block", background: STATUS_COLOR[order.status] + "18", color: STATUS_COLOR[order.status], fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{STATUS_LABEL[order.status]}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {STATUS_FLOW[order.status] && (
                  <button onClick={() => updateOrderStatus(order.id, STATUS_FLOW[order.status])} style={{ background: "#111", color: "white", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={12} /> Mark as {STATUS_LABEL[STATUS_FLOW[order.status]]}
                  </button>
                )}
                {order.status === "placed" && (
                  <button onClick={() => updateOrderStatus(order.id, "cancelled")} style={{ background: "none", border: "1px solid #eee", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer", color: "#494848", fontFamily: "inherit" }}>Cancel</button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Listings */}
        {tab === "listings" && (
          listings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <Package size={36} strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, marginBottom: 8 }}>No listings yet</p>
              <p style={{ fontSize: 14 }}>Click New listing to post your first item</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {listings.map(l => {
                const u = urgency(l.expires_at);
                return (
                  <div key={l.id} className="listing-card">
                    <div style={{ height: 130, background: "#f5f2ee", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Image size={28} color="#ccc" strokeWidth={1} />}
                      <button onClick={() => removeListing(l.id)} style={{ position: "absolute", top: 8, right: 8, background: "white", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}><X size={13} color="#444" /></button>
                      {l.shop_categories?.name && (
                        <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{l.shop_categories.name}</div>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>₹{l.price}</div>
                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#aaa", marginBottom: 10 }}>
                        <span>{Math.max(0, l.available_qty)} / {l.total_quantity} left</span><span>·</span><span>{l.unit_label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: u.bg, borderRadius: 7, padding: "6px 10px", marginBottom: 10 }}>
                        <Clock size={11} color={u.color} />
                        <span style={{ fontSize: 11, color: u.color, fontWeight: 500 }}>{u.expired ? "Expired" : new Date(l.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                      </div>
                      <div style={{ display: "inline-block", background: l.status === "active" ? "#f0faf4" : "#f5f5f5", color: l.status === "active" ? "#27ae60" : "#aaa", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{l.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Categories */}
        {tab === "categories" && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Menu Categories</h2>
              <p style={{ fontSize: 13, color: "#aaa" }}>Create categories to organise your menu. Buyers can filter by category on your shop page.</p>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input className="form-input" placeholder="e.g. Breakfast, Rice Items, Snacks..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} style={{ flex: 1 }} />
              <button onClick={addCategory} disabled={addingCategory || !newCategoryName.trim()} style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: !newCategoryName.trim() ? 0.5 : 1, display: "flex", alignItems: "center" }}>
                <Plus size={15} />
              </button>
            </div>
            {categories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                <Tag size={32} strokeWidth={1} style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 14 }}>No categories yet. Add your first one above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.map((cat, i) => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #efefef", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: "#f5f5f5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#aaa", fontWeight: 600 }}>{i + 1}</div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", display: "flex", padding: 4 }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 12, color: "#bbb", marginTop: 20 }}>{categories.length} categor{categories.length !== 1 ? "ies" : "y"} · These appear as filter buttons on your shop page</p>
          </div>
        )}

        {/* Shop Profile */}
        {tab === "shop" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>Shop Profile</h2>
              {shopSaved && <div style={{ fontSize: 13, color: "#27ae60", display: "flex", alignItems: "center", gap: 5 }}><Check size={13} /> Saved</div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Shop banner photo</label>
              <div onClick={() => bannerRef.current.click()} style={{ width: "100%", height: 150, border: "1.5px dashed #e8e8e8", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#fafafa", position: "relative" }}>
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}><Camera size={24} color="white" /></div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "#bbb" }}><Camera size={24} style={{ marginBottom: 6 }} /><div style={{ fontSize: 13 }}>Upload banner photo</div></div>
                )}
              </div>
              <input ref={bannerRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); } }} style={{ display: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Shop name</label>
              <input className="form-input" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Meena's Kitchen" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Shop type</label>
              <select className="form-input" value={shopType} onChange={e => setShopType(e.target.value)} style={{ background: "white" }}>
                {SHOP_TYPES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Description</label>
              <textarea className="form-input" value={shopDesc} onChange={e => setShopDesc(e.target.value)} rows={3} placeholder="Tell customers what makes your food special..." style={{ resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Shop location</label>
              <button type="button" onClick={() => setShowShopLocationPicker(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${shopLat ? "#27ae60" : "#e8e8e8"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, cursor: "pointer", background: shopLat ? "#f0faf4" : "white", color: shopLat ? "#27ae60" : "#bbb", fontFamily: "inherit", marginBottom: 8 }}>
                <MapPin size={14} color={shopLat ? "#27ae60" : "#bbb"} />{shopLat ? "Location pinned ✓" : "Pin your shop on the map"}
              </button>
              <input className="form-input" value={shopAddress} onChange={e => setShopAddress(e.target.value)} placeholder="Shop address (optional text)" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 12 }}>Opening hours</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAYS.map(day => (
                  <div key={day} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#494848", width: 36, flexShrink: 0 }}>{DAY_LABELS[day]}</span>
                    <input className="form-input" value={openingHours[day] || ""} onChange={e => setOpeningHours(h => ({ ...h, [day]: e.target.value }))} placeholder="9:00-21:00 or Closed" style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={saveShopProfile} disabled={savingShop} style={{ background: "#111", color: "white", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 600, cursor: savingShop ? "not-allowed" : "pointer", opacity: savingShop ? 0.7 : 1, fontFamily: "inherit" }}>
              {savingShop ? "Saving..." : "Save shop profile"}
            </button>
          </div>
        )}
      </div>

      {/* New Listing Modal */}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #f2f2f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>New listing</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#494848" }}><X size={20} /></button>
            </div>
            <form onSubmit={submitListing} style={{ padding: "24px 28px" }}>
              {formErr && <div style={{ background: "#fff0f0", border: "1px solid #fdd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 18 }}>{formErr}</div>}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Food photo</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                {imagePreview ? (
                  <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", height: 160 }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: 8, right: 8, background: "white", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="#444" /></button>
                  </div>
                ) : (
                  <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                    <Upload size={24} color="#ccc" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: "#494848", marginBottom: 4 }}>Click to upload a photo</p>
                    <p style={{ fontSize: 11, color: "#ccc" }}>JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>

              {categories.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Category</label>
                  <select className="form-input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} style={{ background: "white" }}>
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {[
                { label: "Title *", key: "title", type: "text", placeholder: "e.g. Homemade Biryani" },
                { label: "Price (₹) *", key: "price", type: "number", placeholder: "120" },
                { label: "Quantity *", key: "total_quantity", type: "number", placeholder: "5" },
                { label: "Unit label", key: "unit_label", type: "text", placeholder: "packet, box, kg..." },
                
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="form-input" />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Description</label>
                <textarea placeholder="Tell buyers what makes this special..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="form-input" style={{ resize: "none" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Expires at *</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} min={new Date().toISOString().slice(0, 16)} max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} className="form-input" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Pickup location</label>
                <button type="button" onClick={() => setShowLocationPicker(true)} style={{ width: "100%", border: `1.5px solid ${listingLocation ? "#27ae60" : "#e8e8e8"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", background: listingLocation ? "#f0faf4" : "white", display: "flex", alignItems: "center", gap: 8, color: listingLocation ? "#27ae60" : "#bbb" }}>
                  <MapPin size={14} color={listingLocation ? "#27ae60" : "#bbb"} />
                  {listingLocation ? listingLocation.address?.slice(0, 50) || "Location set" : "Set pickup location on map"}
                </button>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10 }}>Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["Veg", true], ["Non-Veg", false]].map(([label, val]) => (
                    <div key={label} onClick={() => setForm(p => ({ ...p, is_veg: val }))} style={{ flex: 1, border: `1.5px solid ${form.is_veg === val ? "#111" : "#e8e8e8"}`, borderRadius: 8, padding: "9px", cursor: "pointer", textAlign: "center", background: form.is_veg === val ? "#111" : "white", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: form.is_veg === val ? "white" : "#111" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submitting || uploadProgress} style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}>
                {uploadProgress ? "Uploading image..." : submitting ? "Posting..." : "Post listing"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLocationPicker && <LocationPicker value={listingLocation} onChange={loc => { setListingLocation(loc); setShowLocationPicker(false); }} onClose={() => setShowLocationPicker(false)} />}
      {showShopLocationPicker && <LocationPicker value={shopLat ? { lat: shopLat, lng: shopLng } : null} onChange={loc => { setShopLat(loc.lat); setShopLng(loc.lng); setShopAddress(loc.address || shopAddress); setShowShopLocationPicker(false); }} onClose={() => setShowShopLocationPicker(false)} />}
    </div>
  );
}
