import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LocationPicker from "../components/ui/LocationPicker";
import { Home, MapPin, CreditCard, Smartphone, Banknote, ChevronRight, Lock, ArrowLeft } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "cod",  label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Banknote },
  { id: "upi",  label: "UPI",              desc: "Pay via any UPI app",          icon: Smartphone },
  { id: "card", label: "Card",             desc: "Credit or debit card",          icon: CreditCard },
];

// Fake UPI apps
const UPI_APPS = ["GPay", "PhonePe", "Paytm", "BHIM"];

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user, profile }          = useAuth();
  const navigate                   = useNavigate();

  const [step, setStep]             = useState(1); // 1=address, 2=payment, 3=processing
  const [address, setAddress]       = useState("");
  const [location, setLocation]     = useState(null);
  const [showMap, setShowMap]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [upiApp, setUpiApp]         = useState("GPay");
  const [upiId, setUpiId]           = useState("");
  const [cardNum, setCardNum]       = useState("");
  const [cardName, setCardName]     = useState("");
  const [cardExp, setCardExp]       = useState("");
  const [cardCvv, setCardCvv]       = useState("");
  const [err, setErr]               = useState("");
  const [processing, setProcessing] = useState(false);

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
        <p style={{ fontSize: 18, color: "#bbb", marginBottom: 16 }}>Your cart is empty</p>
        <Link to="/browse" style={{ background: "#111", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14 }}>Browse food</Link>
      </div>
    );
  }

  async function handlePlaceOrder() {
    setErr("");
    if (!address.trim()) { setErr("Please enter a delivery address"); return; }
    if (paymentMethod === "upi" && !upiId.trim()) { setErr("Please enter your UPI ID"); return; }
    if (paymentMethod === "card" && (!cardNum || !cardName || !cardExp || !cardCvv)) { setErr("Please fill in all card details"); return; }

    setProcessing(true);
    setStep(3);

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));

    // Place all orders
    const orderPromises = cart.map(item =>
      supabase.from("orders").insert({
        buyer_id:         user.id,
        seller_id:        item.seller_id,
        listing_id:       item.id,
        quantity:         item.qty,
        unit_price:       item.price,
        total_amount:     item.price * item.qty,
        delivery_address: address,
        payment_method:   paymentMethod === "cod" ? "cod" : "upi",
        payment_status:   paymentMethod === "cod" ? "pending" : "paid",
      })
    );

    await Promise.all(orderPromises);
    clearCart();
    setProcessing(false);
    navigate("/order-success");
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .form-input { width: 100%; border: 1px solid #e8e8e8; border-radius: 8px; padding: 11px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; background: white; }
        .form-input:focus { border-color: #111; }
        .pay-option { border: 1.5px solid #e8e8e8; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 12px; }
        .pay-option.selected { border-color: #111; background: #fafafa; }
        .pay-option:hover:not(.selected) { border-color: #ccc; }
        .upi-app { border: 1px solid #e8e8e8; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.15s; background: white; }
        .upi-app.selected { background: #111; color: white; border-color: #111; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #efefef", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <Link to="/cart" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "#444343", fontSize: 14 }}>
            <ArrowLeft size={16} /> Cart
          </Link>
          <span style={{ color: "#e8e8e8" }}>|</span>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#111" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>FreshNest</span>
          </Link>
          <span style={{ color: "#e8e8e8" }}>|</span>
          <span style={{ fontSize: 14, color: "#444343" }}>Checkout</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#bbb" }}>
            <Lock size={11} /> Secure checkout
          </div>
        </div>
      </nav>

      {/* Processing overlay */}
      {step === 3 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.95)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div className="spinner" />
          <p style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>Processing your order...</p>
          <p style={{ fontSize: 14, color: "#494848" }}>Please do not close this page</p>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px" }}>

        {/* Progress steps */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          {[["1", "Delivery"], ["2", "Payment"]].map(([num, label], i) => (
            <div key={num} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= parseInt(num) ? "#111" : "#e8e8e8", color: step >= parseInt(num) ? "white" : "#494848", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{num}</div>
                <span style={{ fontSize: 13, fontWeight: step === parseInt(num) ? 600 : 400, color: step >= parseInt(num) ? "#111" : "#494848" }}>{label}</span>
              </div>
              {i < 1 && <div style={{ width: 40, height: 1, background: "#e8e8e8" }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>

          {/* Left — steps */}
          <div>

            {/* Step 1 — Delivery address */}
            {step === 1 && (
              <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 28 }}>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 22 }}>Delivery address</h2>

                {err && <div style={{ background: "#fff0f0", border: "1px solid #fdd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 18 }}>{err}</div>}

                {/* Map location */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Pin your location on map</label>
                  <button
                    onClick={() => setShowMap(true)}
                    style={{ width: "100%", border: `1.5px solid ${location ? "#27ae60" : "#e8e8e8"}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", background: location ? "#f0faf4" : "white", display: "flex", alignItems: "center", gap: 8, color: location ? "#27ae60" : "#494848", transition: "all 0.15s" }}
                  >
                    <MapPin size={15} color={location ? "#27ae60" : "#494848"} />
                    {location ? location.address?.slice(0, 55) + "..." : "Set delivery location on map"}
                  </button>
                </div>

                {/* Manual address */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Full delivery address</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="House / flat number, street, landmark, area..."
                    rows={3}
                    className="form-input"
                    style={{ resize: "none" }}
                  />
                </div>

                {/* Name + phone prefilled */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Name</label>
                    <input className="form-input" defaultValue={profile?.full_name} readOnly style={{ background: "#fafafa", color: "#444343" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Phone</label>
                    <input className="form-input" defaultValue={profile?.phone} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <button
                  onClick={() => { if (!address.trim()) { setErr("Please enter a delivery address"); return; } setErr(""); setStep(2); }}
                  style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  Continue to payment <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* Step 2 — Payment */}
            {step === 2 && (
              <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                  <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444343", display: "flex" }}><ArrowLeft size={18} /></button>
                  <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>Payment method</h2>
                </div>

                {err && <div style={{ background: "#fff0f0", border: "1px solid #fdd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 18 }}>{err}</div>}

                {/* Payment options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    return (
                      <div key={pm.id} className={`pay-option ${paymentMethod === pm.id ? "selected" : ""}`} onClick={() => setPaymentMethod(pm.id)}>
                        <div style={{ width: 38, height: 38, background: paymentMethod === pm.id ? "#111" : "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                          <Icon size={18} color={paymentMethod === pm.id ? "white" : "#444343"} strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{pm.label}</div>
                          <div style={{ fontSize: 12, color: "#494848" }}>{pm.desc}</div>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${paymentMethod === pm.id ? "#111" : "#ddd"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {paymentMethod === pm.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#111" }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* UPI details */}
                {paymentMethod === "upi" && (
                  <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 10, padding: 18, marginBottom: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Select UPI app</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {UPI_APPS.map(app => (
                          <button key={app} className={`upi-app ${upiApp === app ? "selected" : ""}`} onClick={() => setUpiApp(app)}>{app}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>UPI ID</label>
                      <input className="form-input" placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff8e8", border: "1px solid #f0e0a0", borderRadius: 8, fontSize: 12, color: "#444343" }}>
                      A payment request of ₹{total} will be sent to your {upiApp} app
                    </div>
                  </div>
                )}

                {/* Card details */}
                {paymentMethod === "card" && (
                  <div style={{ background: "#fafafa", border: "1px solid #efefef", borderRadius: 10, padding: 18, marginBottom: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Card number</label>
                      <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim())} maxLength={19} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Cardholder name</label>
                      <input className="form-input" placeholder="Name on card" value={cardName} onChange={e => setCardName(e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Expiry</label>
                        <input className="form-input" placeholder="MM/YY" value={cardExp} onChange={e => setCardExp(e.target.value)} maxLength={5} />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>CVV</label>
                        <input className="form-input" placeholder="•••" type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} maxLength={3} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0faf4", border: "1px solid #c8e6c9", borderRadius: 8, fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 6 }}>
                      <Lock size={11} color="#27ae60" /> This is a demo — no real payment is processed
                    </div>
                  </div>
                )}

                {/* COD note */}
                {paymentMethod === "cod" && (
                  <div style={{ background: "#f0faf4", border: "1px solid #c8e6c9", borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                    Pay <strong>₹{total}</strong> in cash to the delivery person when your order arrives. No advance payment needed.
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.7 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Lock size={14} />
                  {processing ? "Processing..." : `Pay ₹${total}`}
                </button>
              </div>
            )}
          </div>

          {/* Right — order summary */}
          <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 14, padding: 22, position: "sticky", top: 80 }}>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order summary</h3>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 7, overflow: "hidden", background: "#f5f2ee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.images?.[0] ? <img src={item.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Home size={16} color="#ccc" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "#494848" }}>x{item.qty}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>₹{item.price * item.qty}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #f2f2f2", paddingTop: 14, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444343", marginBottom: 6 }}>
                <span>Subtotal</span><span>₹{total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#27ae60", marginBottom: 14 }}>
                <span>Delivery</span><span>Free</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location picker modal */}
      {showMap && (
        <LocationPicker
          value={location}
          onChange={loc => { setLocation(loc); if (!address) setAddress(loc.address || ""); setShowMap(false); }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
