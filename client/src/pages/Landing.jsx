import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, MapPin, Star, ArrowRight, Utensils, Bike } from "lucide-react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === "seller") navigate("/dashboard");
      else if (profile.role === "rider") navigate("/rider");
      else navigate("/browse");
    }
  }, [user, profile]);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", color: "#111", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .btn-dark { background: #111; color: #fff; border: none; border-radius: 10px; padding: 13px 26px; font-size: 15px; font-weight: 500; font-family: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.15s; }
        .btn-dark:hover { background: #333; }
        .btn-ghost { background: transparent; color: #111; border: 1.5px solid #ddd; border-radius: 10px; padding: 12px 24px; font-size: 15px; font-family: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.15s; }
        .btn-ghost:hover { border-color: #111; }
        @media (max-width: 600px) {
          .hero-title { font-size: 36px !important; }
          .hero-btns { flex-direction: column !important; }
          .hero-btns a { width: 100%; justify-content: center; }
          .cards-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .footer-links { display: none !important; }
          .split-grid { grid-template-columns: 1fr !important; }
          .split-left { border-right: none !important; border-bottom: 1px solid #f2f2f2 !important; }
        }
          html { scroll-behavior: smooth; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${scrolled ? "#efefef" : "transparent"}`, transition: "border-color 0.2s", padding: "0 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 58, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
            <div style={{ width: 28, height: 28, background: "#111", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={14} color="white" strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>Home Bite</span>
          </div>
 
          <div className="nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#how-it-works" style={{ fontSize: 14, color: "#666", cursor: "pointer", textDecoration: "none" }}>How it works</a>
<a href="#for-sellers" style={{ fontSize: 14, color: "#666", cursor: "pointer", textDecoration: "none" }}>For Sellers</a>
          </div>
 
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/login" className="btn-ghost" style={{ padding: "8px 16px", fontSize: 14 }}>Log in</Link>
            <Link to="/signup" className="btn-dark" style={{ padding: "8px 16px", fontSize: 14 }}>Sign up</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 58, minHeight: "85vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 64px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #efefef", borderRadius: 20, padding: "5px 12px", marginBottom: 24 }}>
            <MapPin size={11} color="#494848" />
            <span style={{ fontSize: 12, color: "#494848" }}>Hyperlocal food marketplace</span>
          </div>

          <h1 className="hero-title" style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-1.5px", marginBottom: 20, maxWidth: 620 }}>
            Food made at home,<br />
            <span style={{ fontStyle: "italic", color: "#aaa" }}>delivered to yours.</span>
          </h1>

          <p style={{ fontSize: 16, fontWeight: 300, color: "#777", lineHeight: 1.8, maxWidth: 440, marginBottom: 36 }}>
            Discover home cooks and small food shops near you. Real food, made with care, delivered to your door.
          </p>

          <div className="hero-btns" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/browse" className="btn-dark">Browse shops near me <ArrowRight size={15} /></Link>
            <Link to="/signup" className="btn-ghost">Start selling</Link>
          </div>

          {/* Stats */}
          <div style={{ marginTop: 56, display: "flex", gap: 40, flexWrap: "wrap" }}>
            {[["", "Home sellers"], ["", "Orders delivered"], ["", "Avg. rating"]].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#bbb", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>How it works</p>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, marginBottom: 48 }}>Three simple steps.</h2>

          <div className="cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { icon: Utensils, step: "01", title: "Sellers open their shop", desc: "Set up your shop with a photo, menu, and location. Customers find you nearby." },
              { icon: MapPin, step: "02", title: "Buyers browse nearby shops", desc: "See home kitchens and small sellers around you. Browse their menu and order." },
              { icon: Bike, step: "03", title: "Delivered to your door", desc: "A local rider picks up and delivers. Pay cash when it arrives or Pay using the app." },
            // eslint-disable-next-line no-unused-vars
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step}>
                <div style={{ width: 42, height: 42, border: "1px solid #e8e8e8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={18} color="#111" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 11, color: "#ddd", letterSpacing: 1, marginBottom: 8 }}>{step}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#999", lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* CTA split */}
      <section id="for-sellers" style={{ padding: "0 24px" }}>
        <div className="split-grid" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div className="split-left" style={{ padding: "64px 48px 64px 0", borderRight: "1px solid #f2f2f2" }}>
            <div style={{ width: 38, height: 38, border: "1px solid #e8e8e8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Home size={16} color="#111" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Open your online shop</h3>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, fontWeight: 300, marginBottom: 24, maxWidth: 300 }}>
              Set up your shop page, add your menu, and start getting orders from people nearby. Free to start.
            </p>
            <Link to="/signup" className="btn-dark" style={{ fontSize: 14, padding: "11px 22px" }}>Start selling</Link>
          </div>
          <div style={{ padding: "64px 0 64px 48px" }}>
            <div style={{ width: 38, height: 38, border: "1px solid #e8e8e8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <MapPin size={16} color="#111" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Order from neighbours</h3>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.8, fontWeight: 300, marginBottom: 24, maxWidth: 300 }}>
              Browse home kitchens and small food shops near you. Pay cash on delivery or Pay using the app.
            </p>
            <Link to="/browse" className="btn-dark" style={{ fontSize: 14, padding: "11px 22px" }}>Browse near me</Link>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f2f2f2" }} />

      {/* Footer */}
      <footer style={{ padding: "24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, background: "#111", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={11} color="white" />
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 700 }}>Home Bite</span>
          </div>
          <div className="footer-links" style={{ display: "flex", gap: 24 }}>
            {["About", "For Sellers", "Contact", "Privacy"].map(l => (
              <span key={l} style={{ fontSize: 13, color: "#bbb", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#ddd" }}>© 2025 Home Bite</span>
        </div>
      </footer>
    </div>
  );
}