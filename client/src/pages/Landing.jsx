import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, MapPin, Clock, Truck, ChevronRight, Star, ArrowRight } from "lucide-react";

const HOW_IT_WORKS = [
  { icon: Home, title: "Sellers post what they made", desc: "Set a price, quantity, and freshness deadline. The listing removes itself when time's up." },
  { icon: MapPin, title: "Buyers browse nearby", desc: "See what's available within a few kilometres, right now." },
  { icon: Truck, title: "Delivered to your door", desc: "A local rider picks up and delivers. Pay cash when it arrives." },
];

const TESTIMONIALS = [
  { name: "Ananya R.", role: "Home Cook, Koramangala", text: "I started listing my weekend biryani batches. Within two weeks I had regulars. FreshNest turned my hobby into an income." },
  { name: "Karthik M.", role: "Buyer, HSR Layout", text: "The food here actually tastes like someone made it with care. And it costs half the price of any app." },
  { name: "Fatima Bakery", role: "Small Bakery, Frazer Town", text: "We used to throw away unsold cakes. Now we list them at 6 PM and they are gone by 8." },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", color: "#111", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { font-size: 14px; color: #666; cursor: pointer; transition: color 0.15s; text-decoration: none; }
        .nav-link:hover { color: #111; }
        .btn-dark { background: #111; color: #fff; border: none; border-radius: 6px; padding: 11px 22px; font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
        .btn-dark:hover { background: #2a2a2a; }
        .btn-ghost { background: transparent; color: #111; border: 1px solid #ddd; border-radius: 6px; padding: 10px 20px; font-size: 14px; font-family: inherit; cursor: pointer; transition: border-color 0.15s; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
        .btn-ghost:hover { border-color: #111; }
        .step-card:hover .step-icon { background: #111 !important; border-color: #111 !important; }
        .step-card:hover .step-icon svg { stroke: #fff !important; }
        .t-card { border: 1px solid #efefef; border-radius: 12px; padding: 28px; transition: border-color 0.2s; }
        .t-card:hover { border-color: #ccc; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .f1 { animation: fadeUp 0.5s ease both 0.05s; }
        .f2 { animation: fadeUp 0.5s ease both 0.15s; }
        .f3 { animation: fadeUp 0.5s ease both 0.25s; }
        .f4 { animation: fadeUp 0.5s ease both 0.35s; }
        .f5 { animation: fadeUp 0.5s ease both 0.45s; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${scrolled ? "#efefef" : "transparent"}`, transition: "border-color 0.2s", padding: "0 40px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
            <div style={{ width: 26, height: 26, background: "#111", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={13} color="white" strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>FreshNest</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center", marginRight: 32 }}>
            {["How it works", "For Sellers", "Delivery"].map(l => <span key={l} className="nav-link">{l}</span>)}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/login" className="btn-ghost" style={{ padding: "7px 16px" }}>Log in</Link>
            <Link to="/signup" className="btn-dark" style={{ padding: "7px 16px" }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 60, minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 40px" }}>
          <div style={{ maxWidth: 580 }}>
            <div className="f1" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #efefef", borderRadius: 20, padding: "5px 12px", marginBottom: 28 }}>
              <MapPin size={11} color="#aaa" />
              <span style={{ fontSize: 12, color: "#aaa" }}>Hyperlocal food marketplace</span>
            </div>
            <h1 className="f2" style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 22 }}>
              Food made at home,<br />
              <span style={{ fontStyle: "italic", color: "#999" }}>delivered to yours.</span>
            </h1>
            <p className="f3" style={{ fontSize: 16, fontWeight: 300, color: "#777", lineHeight: 1.8, maxWidth: 460, marginBottom: 34 }}>
              FreshNest connects home cooks and small food sellers with the neighbourhood around them. Real food, cash on delivery, listings that expire with the food.
            </p>
            <div className="f4" style={{ display: "flex", gap: 10 }}>
              <Link to="/browse" className="btn-dark">Browse food near me <ArrowRight size={14} /></Link>
              <Link to="/signup" className="btn-ghost">Start selling</Link>
            </div>
            <div className="f5" style={{ marginTop: 48, display: "flex", gap: 40 }}>
              {[["2,400+", "Home sellers"], ["18,000+", "Orders delivered"], ["4.9", "Avg. rating"]].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* How it works */}
      <section style={{ padding: "88px 40px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#bbb", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px, 2.8vw, 30px)", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 56 }}>Three simple steps.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 52 }}>
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="step-card" style={{ cursor: "default" }}>
                  <div className="step-icon" style={{ width: 42, height: 42, border: "1px solid #e8e8e8", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, transition: "background 0.18s, border-color 0.18s" }}>
                    <Icon size={18} color="#111" strokeWidth={1.5} />
                  </div>
                  <div style={{ fontSize: 11, color: "#ccc", letterSpacing: 1, marginBottom: 10 }}>0{i + 1}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 9, lineHeight: 1.4 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: "#999", lineHeight: 1.7, fontWeight: 300 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* Listing mockup */}
      <section style={{ padding: "88px 40px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#bbb", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Freshness built in</p>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(20px, 2.6vw, 28px)", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.35, marginBottom: 18 }}>
              Every listing has a deadline.<br />When the food is gone,<br />so is the listing.
            </h2>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, fontWeight: 300, marginBottom: 28, maxWidth: 380 }}>
              Sellers set an expiry time when they post. Listings disappear automatically — no stale posts, no false availability.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[[Clock, "Auto-expiring listings"], [MapPin, "Proximity-based feed"], [Truck, "Cash on delivery only"]].map(([Icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Icon size={14} color="#ccc" strokeWidth={1.5} />
                  <span style={{ fontSize: 14, color: "#666" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ background: "white", border: "1px solid #efefef", borderRadius: 12, overflow: "hidden", maxWidth: 300 }}>
              <div style={{ height: 148, background: "#f5f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, background: "#ede9e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Home size={20} color="#bbb" strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: 11, color: "#ccc" }}>Food photo</span>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Sunday Biryani</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>Meena's Kitchen · 0.8 km</div>
                  </div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>₹120</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fdf9f5", border: "1px solid #f0e8dc", borderRadius: 6, padding: "7px 9px", marginBottom: 12 }}>
                  <Clock size={11} color="#c97b3a" />
                  <span style={{ fontSize: 11, color: "#c97b3a", fontWeight: 500 }}>Expires today, 8:00 PM</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#ccc" }}>4 left</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} color="#e8a020" fill="#e8a020" />)}
                    <span style={{ fontSize: 11, color: "#ccc", marginLeft: 4 }}>4.8</span>
                  </div>
                  <Link to="/browse" className="btn-dark" style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6 }}>Order</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* Testimonials */}
      <section style={{ padding: "88px 40px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#bbb", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Community</p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px, 2.8vw, 30px)", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 48 }}>What people say.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="t-card">
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} color="#e8a020" fill="#e8a020" />)}
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, fontWeight: 300, marginBottom: 20 }}>"{t.text}"</p>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* CTA split */}
      <section style={{ padding: "0 40px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "72px 64px 72px 0", borderRight: "1px solid #f2f2f2" }}>
            <div style={{ width: 38, height: 38, border: "1px solid #e8e8e8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
              <Home size={16} color="#111" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Sell what you cook</h3>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.75, fontWeight: 300, marginBottom: 24, maxWidth: 300 }}>Post what you have made, set your price and expiry. We handle discovery, orders, and delivery. No fees to start.</p>
            <Link to="/signup" className="btn-dark">Start selling <ChevronRight size={14} /></Link>
          </div>
          <div style={{ padding: "72px 0 72px 64px" }}>
            <div style={{ width: 38, height: 38, border: "1px solid #e8e8e8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
              <MapPin size={16} color="#111" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Order from neighbours</h3>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.75, fontWeight: 300, marginBottom: 24, maxWidth: 300 }}>Browse what is fresh near you right now. Pay cash on delivery. No app, no subscription, no friction.</p>
            <Link to="/browse" className="btn-dark">Browse near me <ChevronRight size={14} /></Link>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* Footer */}
      <footer style={{ padding: "28px 40px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, background: "#111", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={11} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 700 }}>FreshNest</span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {["About", "How it works", "For Sellers", "Contact", "Privacy"].map(l => (
              <span key={l} className="nav-link" style={{ fontSize: 13 }}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#ddd" }}>© 2025 FreshNest</span>
        </div>
      </footer>
    </div>
  );
}
