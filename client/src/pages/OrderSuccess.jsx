import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Home, Check, Package, ArrowRight } from "lucide-react";

export default function OrderSuccess() {
  const { user } = useAuth();
  const [latestOrders, setLatestOrders] = useState([]);

  useEffect(() => {
    if (user) fetchLatestOrders();
  }, [user]);

  async function fetchLatestOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, listings(title, images)")
      .eq("buyer_id", user.id)
      .order("placed_at", { ascending: false })
      .limit(5);
    setLatestOrders(data || []);
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .check-circle { animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", height: 60 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 32px", textAlign: "center" }}>

        {/* Success icon */}
        <div className="check-circle" style={{ width: 72, height: 72, background: "#f0faf4", border: "2px solid #c8e6c9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Check size={32} color="#27ae60" strokeWidth={2.5} />
        </div>

        <h1 className="fade-up" style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 700, marginBottom: 12, animationDelay: "0.1s" }}>
          Order placed!
        </h1>
        <p className="fade-up" style={{ fontSize: 15, color: "#888", lineHeight: 1.7, marginBottom: 36, animationDelay: "0.2s" }}>
          Your order has been confirmed. A delivery person will pick it up and bring it to your door shortly.
        </p>

        {/* Latest orders */}
        {latestOrders.length > 0 && (
          <div className="fade-up" style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 20, marginBottom: 28, textAlign: "left", animationDelay: "0.3s" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#888" }}>Items ordered</h3>
            {latestOrders.map(order => (
              <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 7, background: "#f5f2ee", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {order.listings?.images?.[0]
                      ? <img src={order.listings.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Package size={16} color="#ccc" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{order.listings?.title}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>Qty: {order.quantity}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>₹{order.total_amount}</div>
              </div>
            ))}
          </div>
        )}

        <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", animationDelay: "0.4s" }}>
          <Link to="/orders" style={{ background: "#111", color: "white", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Track my order <ArrowRight size={15} />
          </Link>
          <Link to="/browse" style={{ border: "1px solid #e8e8e8", color: "#111", padding: "12px 24px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}>
            Browse more
          </Link>
        </div>
      </div>
    </div>
  );
}
