import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Home, ArrowLeft, Package, Clock, Check, X, ChevronRight, MapPin, Phone, RefreshCw } from "lucide-react";

const STATUS_STEPS = ["placed", "confirmed", "preparing", "ready", "picked_up", "delivered"];

const STATUS_META = {
  placed:    { label: "Order Placed",       desc: "Waiting for seller to confirm",     color: "#2980b9", bg: "#eef6fd" },
  confirmed: { label: "Confirmed",          desc: "Seller has confirmed your order",   color: "#8e44ad", bg: "#f5eefb" },
  preparing: { label: "Being Prepared",     desc: "Your food is being prepared",       color: "#d35400", bg: "#fef5ec" },
  ready:     { label: "Ready for Pickup",   desc: "Food is ready, rider coming soon",  color: "#27ae60", bg: "#eafaf1" },
  picked_up: { label: "Out for Delivery",   desc: "Rider is on the way to you",        color: "#16a085", bg: "#e8f8f5" },
  delivered: { label: "Delivered",          desc: "Enjoy your meal!",                  color: "#111",    bg: "#f5f5f5" },
  cancelled: { label: "Cancelled",          desc: "This order was cancelled",          color: "#bbb",    bg: "#fafafa" },
};

function TrackOrder({ order, onClose }) {
  const meta      = STATUS_META[order.status];
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "28px 28px 40px" }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "#e8e8e8", borderRadius: 2, margin: "0 auto 24px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Track Order</h2>
            <div style={{ fontSize: 12, color: "#bbb" }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* Current status banner */}
        <div style={{ background: meta.bg, border: `1px solid ${meta.color}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: meta.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: meta.color }}>{meta.label}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{meta.desc}</div>
          </div>
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div style={{ marginBottom: 28 }}>
            {STATUS_STEPS.map((step, i) => {
              const done    = i <= stepIndex;
              const current = i === stepIndex;
              const sm      = STATUS_META[step];
              return (
                <div key={step} style={{ display: "flex", gap: 16, marginBottom: i < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                  {/* Line + dot */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width: current ? 16 : 12,
                      height: current ? 16 : 12,
                      borderRadius: "50%",
                      background: done ? "#111" : "#e8e8e8",
                      border: current ? "3px solid #111" : "none",
                      boxShadow: current ? "0 0 0 4px #11111115" : "none",
                      transition: "all 0.3s",
                      marginTop: 2,
                    }} />
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 28, background: i < stepIndex ? "#111" : "#e8e8e8", margin: "4px 0", transition: "background 0.3s" }} />
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                    <div style={{ fontSize: 14, fontWeight: current ? 700 : done ? 500 : 400, color: done ? "#111" : "#ccc", marginBottom: 2 }}>
                      {sm.label}
                    </div>
                    {current && (
                      <div style={{ fontSize: 12, color: "#888" }}>{sm.desc}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order details */}
        <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#888" }}>ORDER DETAILS</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f0ece6", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {order.listings?.images?.[0]
                ? <img src={order.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Package size={20} color="#ccc" strokeWidth={1} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{order.listings?.title}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Qty: {order.quantity} {order.listings?.unit_label || "packet"}</div>
            </div>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>₹{order.total_amount}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 13, color: "#888" }}>
            <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{order.delivery_address}</span>
          </div>
        </div>

        {/* Seller info */}
        {order.seller && (
          <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#888" }}>SELLER</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{order.seller.full_name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{order.seller_profiles?.shop_name}</div>
              </div>
              {order.seller.phone && (
                <a href={`tel:${order.seller.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, background: "#111", color: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, textDecoration: "none" }}>
                  <Phone size={13} /> Call seller
                </a>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ fontSize: 12, color: "#bbb" }}>
          <div>Placed: {new Date(order.placed_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          {order.delivered_at && <div style={{ marginTop: 4 }}>Delivered: {new Date(order.delivered_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tracking, setTracking]     = useState(null);
  const [activeTab, setActiveTab]   = useState("active");

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("orders-buyer")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `buyer_id=eq.${user.id}`,
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        if (tracking?.id === payload.new.id) setTracking(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, tracking]);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        listings(id, title, price, images, unit_label),
        seller:profiles!seller_id(full_name, phone),
        seller_profiles!seller_id(shop_name)
      `)
      .eq("buyer_id", user.id)
      .order("placed_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function cancelOrder(orderId) {
    await supabase.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
  }

  const activeOrders    = orders.filter(o => !["delivered","cancelled"].includes(o.status));
  const pastOrders      = orders.filter(o =>  ["delivered","cancelled"].includes(o.status));
  const displayed       = activeTab === "active" ? activeOrders : pastOrders;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .order-card { background: white; border: 1px solid #efefef; border-radius: 14px; overflow: hidden; margin-bottom: 14px; transition: box-shadow 0.2s; }
        .order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .tab-btn { background: none; border: none; font-size: 14px; font-family: inherit; cursor: pointer; color: #aaa; border-bottom: 2px solid transparent; padding-bottom: 12px; transition: all 0.15s; }
        .tab-btn.active { color: #111; border-bottom-color: #111; font-weight: 600; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
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

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>My Orders</h1>
          <button onClick={fetchOrders} style={{ background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #f2f2f2", marginBottom: 24 }}>
          <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
            Active {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button className={`tab-btn ${activeTab === "past" ? "active" : ""}`} onClick={() => setActiveTab("past")}>
            Past orders {pastOrders.length > 0 && `(${pastOrders.length})`}
          </button>
        </div>

        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 20, marginBottom: 14 }}>
              <div style={{ height: 14, background: "#f5f5f5", borderRadius: 4, width: "40%", marginBottom: 10 }} />
              <div style={{ height: 12, background: "#f5f5f5", borderRadius: 4, width: "60%" }} />
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 0", color: "#ccc" }}>
            <Package size={44} strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, marginBottom: 8, color: "#bbb" }}>
              {activeTab === "active" ? "No active orders" : "No past orders"}
            </p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              {activeTab === "active" ? "Your active orders will appear here" : "Completed orders will appear here"}
            </p>
            <Link to="/browse" style={{ background: "#111", color: "white", padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Browse food
            </Link>
          </div>
        ) : (
          displayed.map(order => {
            const meta = STATUS_META[order.status];
            const stepIndex = STATUS_STEPS.indexOf(order.status);
            const isCancelled = order.status === "cancelled";
            const isDelivered = order.status === "delivered";

            return (
              <div key={order.id} className="order-card">

                {/* Top */}
                <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f5f2ee", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {order.listings?.images?.[0]
                        ? <img src={order.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Package size={22} color="#ccc" strokeWidth={1} />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{order.listings?.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>
                        {order.seller?.full_name} · Qty {order.quantity}
                      </div>
                      <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>
                        {new Date(order.placed_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>₹{order.total_amount}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
                      {meta.label}
                    </div>
                  </div>
                </div>

                {/* Mini progress bar */}
                {!isCancelled && !isDelivered && (
                  <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? "#111" : "#e8e8e8", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{meta.desc}</div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#bbb", display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={11} />
                    <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.delivery_address}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {order.status === "placed" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        style={{ fontSize: 12, color: "#c0392b", background: "none", border: "1px solid #fdd", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Cancel
                      </button>
                    )}
                    {isDelivered && (
                      <Link to={`/listing/${order.listings?.id}`} style={{ fontSize: 12, color: "#111", border: "1px solid #e8e8e8", borderRadius: 7, padding: "6px 12px", textDecoration: "none" }}>
                        Reorder
                      </Link>
                    )}
                    <button
                      onClick={() => setTracking(order)}
                      style={{ fontSize: 12, color: "white", background: "#111", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {isDelivered || isCancelled ? "View details" : "Track order"} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Track order sheet */}
      {tracking && <TrackOrder order={tracking} onClose={() => setTracking(null)} />}
    </div>
  );
}
