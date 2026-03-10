import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Home, Plus, Minus, X, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, updateQty, total, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleCheckout() {
    if (!user) return navigate("/login?redirect=/checkout");
    navigate("/checkout");
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cart-item { background: white; border: 1px solid #efefef; border-radius: 12px; padding: 16px; display: flex; gap: 14px; align-items: flex-start; }
        .qty-btn { width: 30px; height: 30px; border: 1px solid #e8e8e8; border-radius: 6px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .qty-btn:hover { border-color: #111; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <Link to="/browse" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
          <span style={{ color: "#e8e8e8" }}>|</span>
          <span style={{ fontSize: 14, color: "#444343" }}>Your Cart</span>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700 }}>
            Your Cart {itemCount > 0 && <span style={{ fontSize: 16, color: "#494848", fontWeight: 400 }}>({itemCount} items)</span>}
          </h1>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#494848", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              <Trash2 size={14} /> Clear cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <ShoppingBag size={48} color="#e8e8e8" strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: "#bbb", marginBottom: 8 }}>Your cart is empty</p>
            <p style={{ fontSize: 14, color: "#ccc", marginBottom: 28 }}>Browse food near you and add something delicious</p>
            <Link to="/browse" style={{ background: "#111", color: "white", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Browse food <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>

            {/* Cart items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  {/* Image */}
                  <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: "#f5f2ee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.images?.[0]
                      ? <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <ShoppingBag size={24} color="#ccc" strokeWidth={1} />
                    }
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#494848", marginBottom: 10 }}>{item.seller_profiles?.shop_name}</div>

                    {/* Qty controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button 
  className="qty-btn" 
  onClick={() => updateQty(item.id, item.qty - 1)}
  disabled={item.qty <= 1}
  style={{ opacity: item.qty <= 1 ? 0.3 : 1, cursor: item.qty <= 1 ? "not-allowed" : "pointer" }}
>
  <Minus size={12} />
</button>
<span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
<button 
  className="qty-btn" 
  onClick={() => updateQty(item.id, item.qty + 1)}
  disabled={item.qty >= item.available_qty}
  style={{ opacity: item.qty >= item.available_qty ? 0.3 : 1, cursor: item.qty >= item.available_qty ? "not-allowed" : "pointer" }}
>
  <Plus size={12} />
</button>
                      <span style={{ fontSize: 12, color: "#bbb", marginLeft: 4 }}>of {item.available_qty} available</span>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc" }}>
                      <X size={16} />
                    </button>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>₹{item.price * item.qty}</div>
                    {item.qty > 1 && <div style={{ fontSize: 11, color: "#bbb" }}>₹{item.price} each</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary box */}
            <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 24, position: "sticky", top: 80 }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order summary</h3>

              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                  <span style={{ color: "#444343" }}>{item.title} x{item.qty}</span>
                  <span style={{ fontWeight: 500 }}>₹{item.price * item.qty}</span>
                </div>
              ))}

              <div style={{ borderTop: "1px solid #f2f2f2", marginTop: 14, paddingTop: 14, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#444343" }}>
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#444343" }}>
                  <span>Delivery</span>
                  <span style={{ color: "#27ae60" }}>Free</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f2f2f2", paddingTop: 14, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700 }}>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                Proceed to checkout <ArrowRight size={15} />
              </button>

              <Link to="/browse" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 13, color: "#494848", textDecoration: "none" }}>
                Continue browsing
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
