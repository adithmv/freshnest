import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Home, Navigation, Package, CheckCircle, Clock,
  MapPin, Phone, TrendingUp, LogOut, RefreshCw,
  ChevronRight, Bike, IndianRupee
} from "lucide-react";
import LocationPicker from "../components/ui/LocationPicker";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const sellerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const buyerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const riderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1 });
  }, [position]);
  return null;
}

function DeliveryMap({ riderPos, sellerName, buyerName }) {
  const center = riderPos || [12.3375, 75.7985];
  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {riderPos && (
        <Marker position={riderPos} icon={riderIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      <FlyTo position={riderPos} />
    </MapContainer>
  );
}

export default function RiderDashboard() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab]             = useState("available");
  const [available, setAvailable] = useState([]);
  const [active, setActive]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [riderPos, setRiderPos]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [accepting, setAccepting] = useState(null);
  const watchRef = useRef(null);
  const [riderLocation, setRiderLocation]       = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);





function startLocationWatch() {
  if (!navigator.geolocation) return;
  watchRef.current = navigator.geolocation.watchPosition(
    pos => {
      const loc = [pos.coords.latitude, pos.coords.longitude];
      setRiderPos(loc);
      if (!riderLocation) {
        setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
    },
    () => {},
    { enableHighAccuracy: true }
  );
}

async function fetchAvailable() {
  setLoading(true);
    const { data } = await supabase
    .from("orders")
      .select(`
        *,
        listings(title, images, price, unit_label),
        buyer:profiles!buyer_id(full_name, phone),
        seller:profiles!seller_id(full_name, phone)
        `)
      .eq("status", "ready")
      .is("rider_id", null)
      .order("placed_at", { ascending: true });
    setAvailable(data || []);
    setLoading(false);
  }

    async function fetchActive() {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        listings(title, images, price, unit_label),
        buyer:profiles!buyer_id(full_name, phone),
        seller:profiles!seller_id(full_name, phone)
      `)
      .eq("rider_id", user.id)
      .eq("status", "picked_up")
      .maybeSingle();
    setActive(data || null);
  }

  async function fetchHistory() {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, listings(title, images, price)")
      .eq("rider_id", user.id)
      .eq("status", "delivered")
      .order("delivered_at", { ascending: false });
    setHistory(data || []);
  }

  async function acceptOrder(order) {
    setAccepting(order.id);
    const { error } = await supabase
      .from("orders")
      .update({
        rider_id:     user.id,
        status:       "picked_up",
        picked_up_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .is("rider_id", null);
    if (!error) {
      await fetchActive();
      await fetchAvailable();
      setTab("active");
    }
    setAccepting(null);
  }

  async function markDelivered() {
    if (!active) return;
    await supabase
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", active.id);
    setActive(null);
    fetchHistory();
    setTab("history");
  }
  useEffect(() => {
  if (!user) return;
  const channel = supabase
    .channel("rider-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      fetchAvailable();
      fetchActive();
      fetchHistory();
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
  }, [user]);


  

  const totalEarnings   = history.reduce((s, o) => s + Math.round(o.total_amount * 0.1), 0);
  const totalDeliveries = history.length;
  const todayDeliveries = history.filter(o =>
    new Date(o.delivered_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; font-size: 14px; font-family: inherit; cursor: pointer; color: #494848; border-bottom: 2px solid transparent; padding-bottom: 12px; transition: all 0.15s; }
        .tab-btn.active { color: #111; border-bottom-color: #111; font-weight: 600; }
        .card { background: white; border: 1px solid #efefef; border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
        .stat-card { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 18px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
          <button
  onClick={() => setShowLocationPicker(true)}
  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", color: riderLocation ? "#27ae60" : "#aaa", fontFamily: "inherit" }}
>
  <MapPin size={12} color={riderLocation ? "#27ae60" : "#aaa"} />
  {riderLocation ? "Location set" : "Set location"}
</button>
          <span style={{ color: "#e8e8e8" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Bike size={15} color="#444343" />
            <span style={{ fontSize: 14, color: "#444343" }}>Rider Portal</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: riderPos ? "#f0faf4" : "#f5f5f5", border: `1px solid ${riderPos ? "#c8e6c9" : "#e8e8e8"}`, borderRadius: 20, padding: "5px 12px" }}>
              <div className={riderPos ? "pulse" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: riderPos ? "#27ae60" : "#ccc" }} />
              <span style={{ fontSize: 12, color: riderPos ? "#27ae60" : "#494848", fontWeight: 500 }}>
                {riderPos ? "Online" : "Locating..."}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#444343" }}>{profile?.full_name}</span>
            <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", color: "#494848", display: "flex" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { icon: IndianRupee, label: "Total Earned",     value: `₹${totalEarnings}`,  sub: "10% per delivery" },
            { icon: CheckCircle, label: "Total Deliveries", value: totalDeliveries,        sub: "all time" },
            { icon: Bike,        label: "Today",            value: todayDeliveries,        sub: "deliveries today" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} color="#444343" strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: 12, color: "#494848" }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Active delivery banner */}
        {active && (
          <div style={{ background: "#111", color: "white", borderRadius: 14, padding: "18px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#27ae60", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Active delivery in progress</div>
                <div style={{ fontSize: 12, color: "#494848" }}>{active.listings?.title} → {active.buyer?.full_name}</div>
              </div>
            </div>
            <button
              onClick={() => setTab("active")}
              style={{ background: "white", color: "#111", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
            >
              View <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 28, borderBottom: "1px solid #f2f2f2", marginBottom: 24 }}>
          {[
            ["available", `Available (${available.length})`],
            ["active",    "Active delivery"],
            ["history",   `History (${history.length})`],
          ].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── AVAILABLE ── */}
        {tab === "available" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#494848" }}>Orders ready for pickup near you</p>
              <button
                onClick={fetchAvailable}
                style={{ background: "none", border: "1px solid #e8e8e8", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#444343", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 20, marginBottom: 14 }}>
                  <div style={{ height: 14, background: "#f5f5f5", borderRadius: 4, width: "50%", marginBottom: 10 }} />
                  <div style={{ height: 12, background: "#f5f5f5", borderRadius: 4, width: "70%" }} />
                </div>
              ))
            ) : available.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
                <Package size={40} strokeWidth={1} style={{ marginBottom: 14 }} />
                <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, color: "#bbb", marginBottom: 6 }}>No deliveries available</p>
                <p style={{ fontSize: 14 }}>Check back soon — new orders come in frequently</p>
              </div>
            ) : available.map(order => {
              const earn = Math.round(order.total_amount * 0.1);
              return (
                <div key={order.id} className="card">
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: "#f5f2ee", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {order.listings?.images?.[0]
                            ? <img src={order.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            : <Package size={20} color="#ccc" strokeWidth={1} />
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{order.listings?.title}</div>
                          <div style={{ fontSize: 12, color: "#494848" }}>Qty: {order.quantity} · ₹{order.total_amount}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: "#27ae60" }}>₹{earn}</div>
                        <div style={{ fontSize: 11, color: "#bbb" }}>your earning</div>
                      </div>
                    </div>

                    {/* Pickup & delivery info */}
                    <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60", flexShrink: 0, marginTop: 4 }} />
                          <div>
                            <div style={{ fontSize: 11, color: "#494848", marginBottom: 1 }}>PICKUP FROM</div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{order.seller?.full_name}</div>
                          </div>
                        </div>
                        <a
                          href={`tel:${order.seller?.phone}`}
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#111", textDecoration: "none", border: "1px solid #e8e8e8", borderRadius: 6, padding: "4px 10px" }}
                        >
                          <Phone size={11} /> Call
                        </a>
                      </div>

                      <div style={{ width: 1, height: 12, background: "#e8e8e8", marginLeft: 4, marginBottom: 10 }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", flexShrink: 0, marginTop: 4 }} />
                          <div>
                            <div style={{ fontSize: 11, color: "#494848", marginBottom: 1 }}>DELIVER TO</div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{order.buyer?.full_name}</div>
                            <div style={{ fontSize: 12, color: "#444343", marginTop: 2 }}>{order.delivery_address}</div>
                          </div>
                        </div>
                        <a
                          href={`tel:${order.buyer?.phone}`}
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#111", textDecoration: "none", border: "1px solid #e8e8e8", borderRadius: 6, padding: "4px 10px", flexShrink: 0 }}
                        >
                          <Phone size={11} /> Call
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptOrder(order)}
                      disabled={!!active || accepting === order.id}
                      style={{ width: "100%", background: active ? "#f5f5f5" : "#111", color: active ? "#494848" : "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: active ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <Bike size={15} />
                      {accepting === order.id ? "Accepting..." : active ? "Finish current delivery first" : "Accept delivery"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ACTIVE ── */}
        {tab === "active" && (
          !active ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <Bike size={40} strokeWidth={1} style={{ marginBottom: 14 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, color: "#bbb", marginBottom: 6 }}>No active delivery</p>
              <p style={{ fontSize: 14, marginBottom: 20 }}>Accept a delivery from the available tab</p>
              <button
                onClick={() => setTab("available")}
                style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                View available
              </button>
            </div>
          ) : (
            <div>
              {/* Map */}
              <div style={{ height: 280, borderRadius: 14, overflow: "hidden", border: "1px solid #efefef", marginBottom: 20 }}>
                <DeliveryMap
                  riderPos={riderPos}
                  sellerName={active.seller?.full_name}
                  buyerName={active.buyer?.full_name}
                />
              </div>

              <div className="card">
                <div style={{ padding: "18px 20px" }}>
                  {/* Status banner */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, background: "#f0faf4", border: "1px solid #c8e6c9", borderRadius: 10, padding: "12px 16px" }}>
                    <div className="pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#27ae60", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#27ae60" }}>Delivery in progress</div>
                      <div style={{ fontSize: 12, color: "#444343" }}>Navigate to the delivery address below</div>
                    </div>
                  </div>

                  {/* Order info */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f5f2ee", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {active.listings?.images?.[0]
                        ? <img src={active.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <Package size={20} color="#ccc" strokeWidth={1} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{active.listings?.title}</div>
                      <div style={{ fontSize: 12, color: "#494848" }}>Qty: {active.quantity} · ₹{active.total_amount}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#494848", marginBottom: 2 }}>Your earning</div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, color: "#27ae60" }}>
                        ₹{Math.round(active.total_amount * 0.1)}
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#494848", marginBottom: 2 }}>PICKUP FROM</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{active.seller?.full_name}</div>
                      </div>
                      <a
                        href={`tel:${active.seller?.phone}`}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "#111", color: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
                      >
                        <Phone size={13} /> Call seller
                      </a>
                    </div>

                    <div style={{ borderTop: "1px solid #efefef", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#494848", marginBottom: 2 }}>DELIVER TO</div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{active.buyer?.full_name}</div>
                        <div style={{ fontSize: 13, color: "#444343", display: "flex", alignItems: "flex-start", gap: 5, maxWidth: 200 }}>
                          <MapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} color="#494848" />
                          {active.delivery_address}
                        </div>
                      </div>
                      <a
                        href={`tel:${active.buyer?.phone}`}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "#111", color: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, textDecoration: "none", flexShrink: 0 }}
                      >
                        <Phone size={13} /> Call buyer
                      </a>
                    </div>
                  </div>

                  {/* Google Maps link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(active.delivery_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1a73e8", color: "white", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}
                  >
                    <Navigation size={15} /> Open in Google Maps
                  </a>

                  {/* Mark delivered */}
                  <button
                    onClick={markDelivered}
                    style={{ width: "100%", background: "#27ae60", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <CheckCircle size={16} /> Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#ccc" }}>
              <Clock size={40} strokeWidth={1} style={{ marginBottom: 14 }} />
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, color: "#bbb" }}>No deliveries yet</p>
            </div>
          ) : (
            <div>
              {/* Earnings summary */}
              <div style={{ background: "#111", color: "white", borderRadius: 14, padding: "18px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#444343", marginBottom: 4 }}>TOTAL EARNINGS</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700 }}>₹{totalEarnings}</div>
                  <div style={{ fontSize: 12, color: "#444343", marginTop: 2 }}>{totalDeliveries} deliveries completed</div>
                </div>
                <TrendingUp size={40} color="#333" strokeWidth={1} />
              </div>

              {history.map(order => (
                <div key={order.id} className="card">
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f5f2ee", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {order.listings?.images?.[0]
                          ? <img src={order.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          : <Package size={18} color="#ccc" strokeWidth={1} />
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{order.listings?.title}</div>
                        <div style={{ fontSize: 12, color: "#494848" }}>
                          {new Date(order.delivered_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, color: "#27ae60" }}>
                        +₹{Math.round(order.total_amount * 0.1)}
                      </div>
                      <div style={{ fontSize: 11, color: "#bbb" }}>earned</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
      {showLocationPicker && (
  <LocationPicker
    value={riderLocation}
    onChange={loc => {
      setRiderLocation(loc);
      setRiderPos([loc.lat, loc.lng]);
      setShowLocationPicker(false);
    }}
    onClose={() => setShowLocationPicker(false)}
  />
)}
    </div>
  );
}
