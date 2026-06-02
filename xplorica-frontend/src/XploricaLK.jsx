import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "./api.js";

// ── Design tokens ──────────────────────────────────────────────────────────
const DESTINATIONS = ["Sigiriya", "Kandy", "Ella", "Galle", "Colombo", "Yala", "Nuwara Eliya", "Mirissa", "Jaffna", "Dambulla", "Adam's Peak", "Anuradhapura", "Polonnaruwa", "Trincomalee", "Horton Plains", "Arugam Bay", "Bentota", "Negombo", "Udawalawe", "Kitulgala", "Kalpitiya"];
const LANGUAGES    = ["English", "Sinhala", "Tamil", "French", "German", "Japanese", "Mandarin", "Italian", "Hindi", "Spanish", "Russian", "Arabic", "Portuguese"];
const DESTINATIONS_DATA = [
  { name: "Sigiriya",     tagline: "Ancient Lion Rock Fortress",       image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413291/sigiriya_hj1dpi.webp", tag: "UNESCO Heritage" },
  { name: "Kandy",        tagline: "Temple of the Sacred Tooth Relic", image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413290/kandy_xvjfjx.jpg", tag: "Cultural Capital" },
  { name: "Ella",         tagline: "Nine Arch Bridge & Tea Trails",    image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413290/galle_a95kax.jpg", tag: "Hill Country" },
  { name: "Galle",        tagline: "Dutch Colonial Fort by the Sea",   image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413290/galle_a95kax.jpg", tag: "Historic Fort" },
  { name: "Mirissa",      tagline: "Whale Watching & Sunset Beaches",  image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413291/mirissa_wz12my.webp", tag: "Beach Paradise" },
  { name: "Yala",         tagline: "Leopards & Wildlife Safari",       image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413292/yala_rimytw.jpg", tag: "National Park" },
  { name: "Nuwara Eliya", tagline: "Tea Plantations & Cool Climate",   image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413291/nuwarae_pyqz7t.webp", tag: "Tea Country" },
  { name: "Trincomalee",  tagline: "Crystal Bays & Whale Sharks",      image: "https://res.cloudinary.com/de6869utj/image/upload/v1780413485/trincom_d76dzo.webp", tag: "East Coast" },
];

/** Prefix /uploads/... paths with the backend base URL; absolute URLs pass through unchanged. */
const API_BASE = import.meta.env.VITE_API_URL || 'https://xplorica-production.up.railway.app';
const mediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE}${path}`;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const Stars = ({ rating, size = "sm", interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "text-sm" : "text-xl";
  return (
    <span className={`flex gap-0.5 ${sz}`}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          className={`cursor-${interactive ? "pointer" : "default"} transition-colors ${
            n <= (interactive ? (hover || rating) : rating) ? "text-amber-400" : "text-slate-300"
          }`}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(n)}
        >★</span>
      ))}
    </span>
  );
};

const Badge = ({ children, color = "emerald" }) => {
  const map = {
    emerald: "bg-emerald-100 text-emerald-800",
    blue:    "bg-blue-100 text-blue-800",
    amber:   "bg-amber-100 text-amber-800",
    slate:   "bg-slate-100 text-slate-600",
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[color]}`}>{children}</span>;
};

const Input = ({ label, type = "text", value, onChange, required, placeholder, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
      placeholder={placeholder}
      className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition" />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none transition" />
  </div>
);

const Btn = ({ children, onClick, type = "button", variant = "primary", size = "md", full = false, disabled = false, className = "" }) => {
  const base = "font-semibold rounded-full transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes    = { sm: "px-4 py-2 text-sm", md: "px-6 py-2.5 text-sm", lg: "px-8 py-3 text-base" };
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 active:scale-95",
    emerald: "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95",
    outline: "border-2 border-blue-700 text-blue-700 hover:bg-blue-50 active:scale-95",
    ghost:   "text-slate-600 hover:bg-slate-100 rounded-xl active:scale-95",
    danger:  "bg-red-500 text-white hover:bg-red-600 active:scale-95",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}>
      {children}
    </button>
  );
};

const Avatar = ({ name, photo, size = 48 }) => {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return photo
    ? <img src={photo} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    : <div className="rounded-full bg-linear-to-br from-blue-600 to-emerald-400 flex items-center justify-center text-white font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials}</div>;
};

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-950">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none transition">×</button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

// ── Chart components ──────────────────────────────────────────────────────
const BarChart = ({ data = {}, prefix = "", color = "#2563eb" }) => {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-1.5 h-36 pt-2 w-full">
      {entries.map(([label, value]) => {
        const pct = Math.max((value / max) * 100, value > 0 ? 4 : 1);
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
            {value > 0 && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-950 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {prefix}{typeof value === "number" && prefix === "$" ? value.toFixed(0) : value}
              </span>
            )}
            <div className="w-full rounded-t-md transition-all duration-700"
              style={{ height: `${pct}%`, background: color, minHeight: value > 0 ? 4 : 2, opacity: value > 0 ? 1 : 0.2 }} />
            <span className="text-slate-400 text-center leading-tight w-full truncate text-center"
              style={{ fontSize: "0.6rem" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

const HorizBarChart = ({ data = {}, color = "#2563eb" }) => {
  const entries = Object.entries(data).slice(0, 8);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2.5">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-700 w-28 truncate shrink-0 text-right">{label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
            <div className="h-full rounded-full flex items-center justify-end pr-2.5 transition-all duration-700"
              style={{ width: `${Math.max((value / max) * 100, 10)}%`, background: color }}>
              <span className="text-xs text-white font-bold">{value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════

// ── Landing Page ──────────────────────────────────────────────────────────
function LandingPage({ onNav, onLogin, onRegister }) {
  const [allGuides, setAllGuides]           = useState([]);
  const [reviews, setReviews]               = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [heroSlide, setHeroSlide]           = useState(0);

  useEffect(() => {
    api.listGuides().then(data => setAllGuides(data || [])).catch(() => {});
    api.getLatestReviews()
      .then(data => setReviews(data || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => s + 1), 5500);
    return () => clearInterval(t);
  }, []);

  const premiumGuides = allGuides.filter(g => g.premium);
  const topRatedGuides = [...allGuides]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #071b40 0%, #0d4a6b 50%, #0f6e56 100%)" }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('https://www.travelvoice.lk/wp-content/uploads/2024/05/1588843579185.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm mb-6">
              <span className="text-emerald-400">✓</span> Trusted Sri Lankan local guides
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
              Explore the<br /><span className="text-emerald-400">Real Sri Lanka</span><br />with Locals
            </h1>
            <p className="mt-5 text-lg text-blue-100 max-w-lg leading-relaxed">
              Connect directly with verified local guides for personalised, authentic travel experiences across the Pearl of the Indian Ocean.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Btn size="lg" variant="emerald" onClick={() => onNav("browse")}>Find a Guide</Btn>
              <Btn size="lg" variant="outline" onClick={() => onRegister("GUIDE")}
                className="border-white text-white hover:bg-white hover:text-blue-900">Become a Guide</Btn>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-white/80 text-sm">
              <span>★ 4.8 avg. rating</span>
              <span>✓ Verified guides</span>
              <span>🌍 50+ destinations</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.9 }}
            className="hidden md:block">
            {(() => {
              const TESTIMONIALS = [
                {
                  name: "Emily Hartwell", country: "United Kingdom",
                  photo: "https://res.cloudinary.com/de6869utj/image/upload/v1780412300/emilyheartwell_a5wnql.jpg",
                  comment: "Xplorica completely transformed how I travel. Finding a trusted local guide used to take days of research — here it took minutes. The whole platform is beautifully designed and genuinely trustworthy.",
                },
                {
                  name: "Marcus Lindström", country: "Sweden",
                  photo: "https://res.cloudinary.com/de6869utj/image/upload/v1780412299/MarcusLindstr%C3%B6m_xbvboz.jpg",
                  comment: "I was sceptical about using a booking platform for something as personal as a guided tour. Xplorica proved me completely wrong. The verified profiles, direct messaging, and seamless payment gave me total confidence.",
                },
                {
                  name: "Yuki Nakamura", country: "Japan",
                  photo: "https://res.cloudinary.com/de6869utj/image/upload/v1780412299/YukiNakamura_qblncd.jpg",
                  comment: "What makes Xplorica stand out is how human it feels. Real guides, real reviews, real conversations. It connected me with experiences I could never have arranged on my own. I will use it every time I visit Sri Lanka.",
                },
                {
                  name: "Amira El-Sayed", country: "Germany",
                  photo: "https://res.cloudinary.com/de6869utj/image/upload/v1780412299/AmiraEl-Sayed_y6kops.jpg",
                  comment: "As a solo traveller, safety matters most to me. Xplorica's verification process and honest review system gave me complete peace of mind. The platform handled everything — booking, communication, payment — flawlessly.",
                },
                {
                  name: "David Okafor", country: "Australia",
                  photo: "https://res.cloudinary.com/de6869utj/image/upload/v1780412299/DavidOkafor_srsw1t.jpg",
                  comment: "I used Xplorica to plan a two-week Sri Lanka itinerary and it exceeded every expectation. The service is intuitive, the guides are exceptional, and the support throughout was outstanding. Already recommending it to everyone.",
                },
              ];
              const r   = TESTIMONIALS[heroSlide % TESTIMONIALS.length];
              const idx = heroSlide % TESTIMONIALS.length;
              return (
                <div className="max-w-sm ml-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={idx}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-7 shadow-2xl">

                      {/* Quote mark */}
                      <div className="text-6xl font-black text-emerald-400 leading-none mb-3 select-none" style={{ fontFamily: "Georgia, serif" }}>"</div>

                      {/* Testimonial text */}
                      <p className="text-white text-base leading-relaxed italic">{r.comment}</p>

                      {/* Reviewer */}
                      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/15">
                        <img src={r.photo} alt={r.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white/30" />
                        <div>
                          <p className="text-white font-bold text-sm">{r.name}</p>
                          <p className="text-white/60 text-xs mt-0.5">🌍 {r.country}</p>
                        </div>
                      </div>

                      {/* Dot indicators */}
                      <div className="flex gap-1.5 mt-5">
                        {TESTIMONIALS.map((_, i) => (
                          <button key={i} onClick={() => setHeroSlide(i)}
                            className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white" : "w-2 bg-white/30"}`} />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}
          </motion.div>
        </div>
      </section>

      {/* ── Recommended Destinations ── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">Explore Sri Lanka</p>
              <h2 className="text-4xl font-black text-white">Recommended Destinations</h2>
              <p className="text-slate-400 mt-2 max-w-lg">From ancient kingdoms to golden beaches — find the perfect guide for every corner of the island.</p>
            </div>
            <Btn variant="emerald" onClick={() => onNav("browse")}>Find a Guide</Btn>
          </div>

          {/* Top section: CSS grid so all cells share the same row heights */}
          <div className="grid gap-4 mb-4" style={{
            gridTemplateColumns: "2fr 1fr",
            gridTemplateRows: "220px 220px",
          }}>
            {/* Sigiriya — spans both rows */}
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}
              className="relative rounded-3xl overflow-hidden group"
              style={{ gridRow: "1 / 3" }}>
              <img src={DESTINATIONS_DATA[0].image} alt={DESTINATIONS_DATA[0].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute top-5 left-5 bg-white/90 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
                {DESTINATIONS_DATA[0].tag}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-white font-black text-4xl leading-tight">{DESTINATIONS_DATA[0].name}</h3>
                <p className="text-slate-300 text-base mt-2">{DESTINATIONS_DATA[0].tagline}</p>
              </div>
            </motion.div>

            {/* Kandy + Ella — each occupies one row in the right column */}
            {DESTINATIONS_DATA.slice(1, 3).map(d => (
              <motion.div key={d.name} whileHover={{ scale: 1.02 }} transition={{ duration: 0.25 }}
                className="relative rounded-3xl overflow-hidden group">
                <img src={d.image} alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute top-3 left-3 bg-white/90 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {d.tag}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-xl">{d.name}</h3>
                  <p className="text-slate-300 text-xs mt-1">{d.tagline}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom row: 5 equal cards */}
          <div className="grid grid-cols-5 gap-4">
            {DESTINATIONS_DATA.slice(3).map(d => (
              <motion.div key={d.name} whileHover={{ scale: 1.03, y: -4 }} transition={{ duration: 0.25 }}
                className="relative rounded-2xl overflow-hidden group"
                style={{ height: 220 }}>
                <img src={d.image} alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-white/85 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {d.tag}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-base leading-tight">{d.name}</h3>
                  <p className="text-slate-300 text-xs mt-0.5 line-clamp-1">{d.tagline}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-4xl font-black text-blue-950">Book your experience in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔎", step: "01", title: "Search & Filter", desc: "Browse verified guides by destination, language, and star rating." },
              { icon: "👤", step: "02", title: "Connect & Chat",  desc: "View profiles, read reviews, then message your guide directly." },
              { icon: "📅", step: "03", title: "Book & Explore",  desc: "Confirm your date, pay securely, and explore Sri Lanka authentically." },
            ].map(s => (
              <motion.div key={s.step} whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all border border-slate-100 text-center">
                <div className="text-5xl mb-4">{s.icon}</div>
                <span className="text-xs font-black text-emerald-500 tracking-widest">STEP {s.step}</span>
                <h3 className="text-xl font-bold text-blue-950 mt-2">{s.title}</h3>
                <p className="text-slate-500 mt-3 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Guides Carousel */}
      {premiumGuides.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-amber-50 to-yellow-50 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full mb-3">⭐ PREMIUM GUIDES</span>
                <h2 className="text-3xl font-black text-blue-950">Featured & Verified Experts</h2>
                <p className="text-slate-500 text-sm mt-1">Hand-picked guides with exclusive visibility and verified credentials</p>
              </div>
              <Btn variant="outline" onClick={() => onNav("browse")}>View all guides</Btn>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {premiumGuides.map(g => (
                <GuideCard key={g.id} guide={g} onView={() => onNav("guide", g)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Guides — top rated (premium + regular mixed) */}
      {topRatedGuides.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Our guides</p>
                <h2 className="text-4xl font-black text-blue-950">Top rated this month</h2>
              </div>
              <Btn variant="outline" onClick={() => onNav("browse")}>View all</Btn>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topRatedGuides.map(g => (
                <GuideCard key={g.id} guide={g} onView={() => onNav("guide", g)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* For tourists / For guides */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-950 rounded-4xl p-10 text-white">
            <p className="text-emerald-300 font-bold mb-3">For tourists</p>
            <h2 className="text-3xl font-black mb-5">Discover hidden gems with local experts</h2>
            {["Travel like a local, not just a visitor.", "Filter by language, destination, and rating.", "Chat directly before you commit."].map(t => (
              <p key={t} className="flex items-start gap-3 text-blue-100 mb-3">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>{t}
              </p>
            ))}
            <Btn variant="emerald" size="lg" className="mt-6" onClick={() => onNav("browse")}>Start Exploring</Btn>
          </div>
          <div className="bg-linear-to-br from-emerald-600 to-blue-700 rounded-4xl p-10 text-white">
            <p className="text-emerald-100 font-bold mb-3">For tour guides</p>
            <h2 className="text-3xl font-black mb-5">Earn income sharing your local knowledge</h2>
            {["Reach international travellers instantly.", "Manage bookings and messages in one place.", "Build your reputation through verified ratings."].map(t => (
              <p key={t} className="flex items-start gap-3 text-emerald-50 mb-3">
                <span className="text-white font-bold mt-0.5">✓</span>{t}
              </p>
            ))}
            <Btn className="mt-6 bg-blue-60 text-white hover:bg-blue-50 px-7 py-3 rounded-full font-semibold shadow-lg"
              onClick={() => onRegister("GUIDE")}>Join as a Guide</Btn>
          </div>
        </div>
      </section>

      {/* Testimonials — live from DB */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-950">What travellers say</h2>
          </div>
          {reviewsLoading ? (
            <Spinner />
          ) : reviews.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No reviews yet. Be the first to explore!</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col">
                  <Stars rating={r.stars} />
                  {r.comment && (
                    <p className="mt-4 text-slate-700 leading-relaxed italic flex-1">"{r.comment}"</p>
                  )}
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar name={r.touristName} size={40} />
                    <div>
                      <p className="font-bold text-blue-950">{r.touristName}</p>
                      <p className="text-sm text-slate-500">Guide: {r.guideName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-950 py-20 text-center">
        <h2 className="text-4xl font-black text-white mb-4">Ready to explore Sri Lanka?</h2>
        <p className="text-blue-200 mb-8">Join thousands of travellers who discovered the real Sri Lanka.</p>
        <div className="flex justify-center gap-4">
          <Btn size="lg" variant="emerald" onClick={() => onNav("browse")}>Find a Guide Now</Btn>
          <Btn size="lg" onClick={() => onRegister("TOURIST")}
            className="bg-blue-60 text-blue-900 hover:bg-blue-50 px-8 py-3 rounded-full font-semibold">Sign Up Free</Btn>
        </div>
      </section>
    </div>
  );
}

// ── Guide Card ─────────────────────────────────────────────────────────────
function GuideCard({ guide, onView }) {
  return (
    <motion.div whileHover={{ y: -4 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 cursor-pointer"
      onClick={onView}>
      <div className="h-48 bg-linear-to-br from-blue-100 to-emerald-50 relative overflow-hidden">
        {guide.photoUrl
          ? <img src={mediaUrl(guide.photoUrl)} alt={guide.fullName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Avatar name={guide.fullName} size={80} /></div>}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {guide.premium && <span className="bg-amber-400 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">⭐ Premium</span>}
          <Badge color="amber">★ {guide.averageRating ?? "—"}</Badge>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-blue-950 text-lg">{guide.fullName}</h3>
          <span className="text-xs text-slate-400">{guide.yearsExperience}y exp</span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{guide.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(guide.destinations || []).slice(0, 3).map(d => <Badge key={d} color="blue">{d}</Badge>)}
          {(guide.destinations || []).length > 3 && <Badge color="slate">+{guide.destinations.length - 3}</Badge>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {(guide.languages || []).slice(0, 2).map(l => <Badge key={l} color="emerald">{l}</Badge>)}
          </div>
          <Stars rating={Math.round(guide.averageRating ?? 0)} />
        </div>
        {guide.dailyRate && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Daily rate</span>
            <span className="font-bold text-blue-800 text-sm">${guide.dailyRate} <span className="font-normal text-slate-400 text-xs">/ person</span></span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Browse Page ───────────────────────────────────────────────────────────
function BrowsePage({ onSelectGuide }) {
  const [lang, setLang]           = useState("");
  const [dest, setDest]           = useState("");
  const [minRating, setMinRating] = useState(0);
  const [guides, setGuides]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Fetch from DB whenever a filter changes
  useEffect(() => {
    setLoading(true);
    setError("");
    api.listGuides({
      language:    lang    || undefined,
      destination: dest    || undefined,
      minRating:   minRating || undefined,
    })
      .then(data => setGuides(
        [...(data || [])].sort((a, b) => {
          if (a.premium !== b.premium) return a.premium ? -1 : 1;
          return (b.averageRating || 0) - (a.averageRating || 0);
        })
      ))
      .catch(err => setError(err.message || "Failed to load guides"))
      .finally(() => setLoading(false));
  }, [lang, dest, minRating]);

  const clearFilters = () => { setLang(""); setDest(""); setMinRating(0); };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-blue-950 mb-8">Find Your Perfect Guide</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 grid md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1.5">Destination</label>
          <select value={dest} onChange={e => setDest(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All destinations</option>
            {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1.5">Language</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All languages</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1.5">Min. Rating</label>
          <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value={0}>Any rating</option>
            <option value={4}>4+ stars</option>
            <option value={4.5}>4.5+ stars</option>
            <option value={4.8}>4.8+ stars</option>
          </select>
        </div>
        <div className="flex items-end">
          <Btn full variant="primary" onClick={clearFilters}>Clear Filters</Btn>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && error && (
        <div className="text-center py-12 text-red-500 bg-red-50 rounded-2xl">
          <p className="text-lg font-semibold">⚠ {error}</p>
          <p className="text-sm mt-1">Make sure the backend is running on port 8080.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-slate-500 text-sm mb-5">
            {guides.length} guide{guides.length !== 1 ? "s" : ""} found
            {/* {guides.some(g => g.premium) && <span className="ml-2 text-amber-600 font-semibold">· ⭐ Premium guides shown first</span>} */}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {guides.map(g => <GuideCard key={g.id} guide={g} onView={() => onSelectGuide(g)} />)}
          </div>
          {guides.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-semibold">No approved guides match your filters</p>
              <p className="mt-2">Try adjusting your search criteria or check back later.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Guide Detail Page ─────────────────────────────────────────────────────
function GuideDetailPage({ guide, user, onBack, onChat, onNav, onLogin }) {
  const [showRateModal, setShowRateModal] = useState(false);
  const [stars, setStars]                 = useState(0);
  const [comment, setComment]             = useState("");
  const [rateError, setRateError]         = useState("");
  const [rateLoading, setRateLoading]     = useState(false);

  const [reviews, setReviews]             = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [showBookModal, setShowBookModal]     = useState(false);
  const [bookStartDate, setBookStartDate]     = useState("");
  const [bookEndDate, setBookEndDate]         = useState("");
  const [bookPeople, setBookPeople]           = useState(1);
  const [bookDestinations, setBookDestinations] = useState([]);
  const [bookMsg, setBookMsg]                 = useState("");
  const [bookLoading, setBookLoading]         = useState(false);
  const [bookingId, setBookingId]             = useState(null);

  // Load ratings from DB
  useEffect(() => {
    api.getGuideRatings(guide.id)
      .then(data => setReviews(data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [guide.id]);

  const openBookModal = () => {
    if (!user) { onLogin("login"); return; }
    setBookStartDate(""); setBookEndDate(""); setBookPeople(1); setBookDestinations([]); setBookMsg(""); setBookingId(null);
    setShowBookModal(true);
  };

  // Submit rating to DB
  const submitRating = async () => {
    if (!stars) return;
    setRateLoading(true);
    setRateError("");
    try {
      await api.rateGuide(guide.id, { stars, comment });
      // Append optimistically
      setReviews(prev => [{
        id: Date.now(),
        touristName: user?.fullName || "You",
        stars,
        comment,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setShowRateModal(false);
      setStars(0); setComment("");
    } catch (err) {
      setRateError(err.message || "Failed to submit review.");
    } finally {
      setRateLoading(false);
    }
  };

  // Create booking in DB
  const createBooking = async () => {
    if (!bookStartDate || !bookEndDate || bookDestinations.length === 0) return;
    if (bookEndDate < bookStartDate) { setBookMsg("❌ End date must be on or after the start date"); return; }
    setBookLoading(true);
    try {
      const rate = guide.dailyRate || 0;
      const days = Math.round((new Date(bookEndDate) - new Date(bookStartDate)) / 86400000) + 1;
      const booking = await api.createBooking({
        guideId:        guide.id,
        startDate:      bookStartDate,
        endDate:        bookEndDate,
        numberOfPeople: bookPeople,
        totalAmount:    rate * bookPeople * days,
        destination:    bookDestinations.join(", "),
      });
      setBookingId(booking.id);
      setBookMsg("⏳ Booking request sent! Your guide will review and confirm. You can make payment once the guide accepts your booking.");
    } catch (err) {
      setBookMsg("❌ " + (err.message || "Booking failed. Please try again."));
    } finally {
      setBookLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-700 mb-8 text-sm font-medium transition">
        ← Back to guides
      </button>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="h-64 bg-linear-to-br from-blue-100 to-emerald-50 flex items-center justify-center">
              {guide.photoUrl
                ? <img src={mediaUrl(guide.photoUrl)} alt={guide.fullName} className="w-full h-full object-cover" />
                : <Avatar name={guide.fullName} size={100} />}
            </div>
            <div className="p-5">
              <h1 className="text-2xl font-black text-blue-950">{guide.fullName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={Math.round(guide.averageRating ?? 0)} />
                <span className="text-sm text-slate-500">
                  {guide.averageRating ?? "—"} ({guide.totalRatings ?? 0} reviews)
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {guide.licenseNumber && <p>🪪 License: {guide.licenseNumber}</p>}
                {guide.yearsExperience && <p>📅 {guide.yearsExperience} years experience</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(guide.languages || []).map(l => <Badge key={l} color="emerald">{l}</Badge>)}
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="space-y-3">
            <Btn full variant="primary" onClick={openBookModal}>📅 Book This Guide</Btn>
            {user && <Btn full variant="outline" onClick={() => onChat(guide)}>💬 Chat with Guide</Btn>}
            {user?.role === "TOURIST" && (
              <Btn full variant="ghost" onClick={() => { setRateError(""); setStars(0); setComment(""); setShowRateModal(true); }}>
                ⭐ Leave a Review
              </Btn>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-blue-950 mb-3">About</h2>
            <p className="text-slate-600 leading-relaxed">{guide.description}</p>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-blue-950 mb-4">Destinations</h2>
            <div className="flex flex-wrap gap-2">
              {(guide.destinations || []).map(d => (
                <span key={d} className="bg-blue-50 text-blue-800 font-semibold text-sm px-4 py-2 rounded-full">📍 {d}</span>
              ))}
            </div>
          </div>

          {/* Reviews from DB */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-blue-950 mb-5">Reviews ({reviews.length})</h2>
            {reviewsLoading
              ? <Spinner />
              : reviews.length === 0
                ? <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
                : (
                  <div className="space-y-5">
                    {reviews.map(r => (
                      <div key={r.id} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.touristName} size={36} />
                            <div>
                              <p className="font-semibold text-blue-950 text-sm">{r.touristName}</p>
                              <p className="text-xs text-slate-400">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                              </p>
                            </div>
                          </div>
                          <Stars rating={r.stars} />
                        </div>
                        {r.comment && <p className="text-sm text-slate-600 ml-12">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
          </div>
        </div>
      </div>

      {/* Rate Modal */}
      <Modal open={showRateModal} onClose={() => setShowRateModal(false)} title="Leave a Review">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Your Rating</p>
            <Stars rating={stars} size="lg" interactive onRate={setStars} />
          </div>
          <Textarea label="Comment (optional)" value={comment} onChange={setComment}
            placeholder="Share your experience..." rows={4} />
          {rateError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{rateError}</p>}
          <Btn full variant="primary" onClick={submitRating} disabled={!stars || rateLoading}>
            {rateLoading ? "Submitting…" : "Submit Review"}
          </Btn>
        </div>
      </Modal>

      {/* Book Modal */}
      <Modal open={showBookModal} onClose={() => setShowBookModal(false)} title={`Book ${guide.fullName}`}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={bookStartDate} onChange={setBookStartDate} required />
            <Input label="End Date" type="date" value={bookEndDate} onChange={v => { if (v >= bookStartDate) setBookEndDate(v); }} required />
          </div>
          <Input label="Number of People" type="number" value={bookPeople}
            onChange={v => setBookPeople(Math.max(1, Number(v)))} required />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Destinations <span className="text-red-500">*</span> <span className="text-slate-400 font-normal text-xs">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {(guide.destinations || []).map(d => {
                const selected = bookDestinations.includes(d);
                return (
                  <button key={d} type="button"
                    onClick={() => setBookDestinations(prev =>
                      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                    )}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
                      ${selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"}`}>
                    📍 {d}
                  </button>
                );
              })}
            </div>
            {bookDestinations.length === 0 && <p className="text-xs text-slate-400">Pick at least one destination</p>}
          </div>
          {(() => {
            const days              = bookStartDate && bookEndDate && bookEndDate >= bookStartDate
              ? Math.round((new Date(bookEndDate) - new Date(bookStartDate)) / 86400000) + 1 : null;
            const subtotal          = guide.dailyRate && days ? guide.dailyRate * bookPeople * days : null;
            const rawFee            = subtotal ? subtotal * 0.15 : null;
            const serviceFee        = rawFee != null ? Math.max(2, Math.min(5, Math.round(rawFee * 100) / 100)) : null;
            const platformCommission = subtotal != null ? Math.round(subtotal * 0.15 * 100) / 100 : null;
            const grandTotal        = subtotal != null && serviceFee != null ? (subtotal + serviceFee).toFixed(2) : null;
            const guideReceives     = subtotal != null && platformCommission != null ? (subtotal - platformCommission).toFixed(2) : null;
            return (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Daily rate × {bookPeople} {bookPeople === 1 ? "person" : "people"} × {days ?? "—"} {days === 1 ? "day" : "days"}</span>
                  <span>{subtotal != null ? `$${subtotal.toFixed(2)}` : "—"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tourist service fee <span className="text-xs text-slate-400">($2–$5)</span></span>
                  <span>{serviceFee != null ? `+$${serviceFee.toFixed(2)}` : "—"}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-blue-950">
                  <span>Total you pay</span>
                  <span>{grandTotal != null ? `$${grandTotal}` : "—"}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Platform commission <span>(15%)</span></span>
                    <span>{platformCommission != null ? `$${platformCommission.toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guide receives</span>
                    <span>{guideReceives != null ? `$${guideReceives}` : "—"}</span>
                  </div>
                </div>
              </div>
            );
          })()}
          {bookMsg && (
            <div className={`${bookMsg.startsWith("❌") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"} rounded-xl p-3 text-sm font-medium`}>
              {bookMsg}
            </div>
          )}
          {!bookingId && (
            <Btn full variant="emerald" disabled={!bookStartDate || !bookEndDate || bookDestinations.length === 0 || bookLoading} onClick={createBooking}>
              {bookLoading ? "Creating Booking…" : "Send Booking Request"}
            </Btn>
          )}
          {bookingId && user && (
            <Btn full variant="outline"
              onClick={() => { setShowBookModal(false); if (user.role === "TOURIST") onNav("my-bookings"); }}>
              View My Bookings
            </Btn>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────
// ── Tourist Dashboard ──────────────────────────────────────────────────────
function TouristDashboard({ user, onNav }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    setLoading(true);
    api.getMyBookings().then(setBookings).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handlePayment = (booking) => {
    if (booking.status !== "CONFIRMED") {
      alert("Payment is only available after the guide confirms your booking.");
      return;
    }
    if (booking.paymentStatus === "PAID") {
      alert("This booking has already been paid.");
      return;
    }
    // Navigate to payment page
    onNav("payment", { bookingId: booking.id, total: booking.totalAmount });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-blue-950">My Bookings</h1>
        <p className="text-slate-500">View and manage your tour bookings</p>
      </div>

      <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-blue-950 text-lg">Your Bookings</h2>
          <button
            onClick={loadBookings}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            🔄 Refresh
          </button>
        </div>
        {loading ? <Spinner /> : bookings.length === 0
          ? <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">No bookings yet.</p>
              <Btn variant="primary" onClick={() => onNav("browse")}>Find Guides</Btn>
            </div>
          : (
            <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-blue-950">{b.guideName}</p>
                      <p className="text-sm text-slate-500">
                        📅 {b.startDate} → {b.endDate} · 👥 {b.numberOfPeople} people{b.destination ? ` · 📍 ${b.destination}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-950">${(b.totalAmount + (b.serviceFee || 0)).toFixed(2)}</p>
                      <p className="text-xs text-slate-400">incl. ${(b.serviceFee || 0).toFixed(2)} fee</p>
                      <Badge color={b.status === "CONFIRMED" ? "emerald" : b.status === "CANCELLED" ? "slate" : b.status === "COMPLETED" ? "blue" : "amber"}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Status-specific messages and actions */}
                  {b.status === "PENDING" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                      <p className="text-amber-800 text-sm font-medium">⏳ Waiting for guide confirmation</p>
                      <p className="text-amber-700 text-xs mt-1">Your guide will review this booking soon. You'll be able to make payment once confirmed.</p>
                    </div>
                  )}
                  
                  {b.status === "CONFIRMED" && b.paymentStatus !== "PAID" && (
                    <div className="flex gap-2 pt-3 border-t border-slate-200 mt-3">
                      <button
                        onClick={() => handlePayment(b)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2 px-3 rounded-xl transition">
                        💳 Make Payment
                      </button>
                    </div>
                  )}
                  
                  {b.paymentStatus === "PAID" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-3">
                      <p className="text-emerald-800 text-sm font-medium">✓ Payment completed</p>
                      <p className="text-emerald-700 text-xs mt-1">Your booking is confirmed and paid. Enjoy your tour!</p>
                    </div>
                  )}
                  
                  {b.status === "CANCELLED" && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mt-3">
                      <p className="text-slate-700 text-sm font-medium">✕ Booking cancelled</p>
                    </div>
                  )}
                  
                  {b.status === "COMPLETED" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
                      <p className="text-blue-800 text-sm font-medium">✓ Tour completed</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────
function AuthPage({ mode, defaultRole, onSuccess, onSwitch, onClose }) {
  const isLogin = mode === "login";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", role: defaultRole || "TOURIST",
    description: "", licenseNumber: "", yearsExperience: "", dailyRate: "",
    photoFile: null, photoPreview: null,
    languages: [], destinations: [],
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const isGuideRegister = !isLogin && form.role === "GUIDE";

  const set    = k => v => setForm(p => ({ ...p, [k]: v }));
  const toggle = (key, val) => setForm(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(i => i !== val) : [...p[key], val],
  }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(p => ({ ...p, photoFile: file, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const nextStep = (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim())    { setError("Full name is required."); return; }
    if (!form.email.trim())       { setError("Email is required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (isGuideRegister && step === 1) { nextStep(e); return; }
    if (isGuideRegister) {
      if (!form.description.trim())         { setError("Please add a description about yourself."); return; }
      if (!form.dailyRate || Number(form.dailyRate) <= 0) { setError("Please enter your daily rate."); return; }
      if (!form.licenseNumber.trim())       { setError("Please enter your licence number."); return; }
      if (!form.yearsExperience || Number(form.yearsExperience) < 0) { setError("Please enter your years of experience."); return; }
      if (!form.photoFile)                  { setError("Please upload a profile photo."); return; }
      if (form.languages.length === 0)      { setError("Please select at least one language."); return; }
      if (form.destinations.length === 0)   { setError("Please select at least one destination."); return; }
    }

    setLoading(true);
    try {
      let authData;
      if (isLogin) {
        authData = await api.login({ email: form.email, password: form.password });
      } else {
        const expRaw = form.role === "GUIDE" && form.yearsExperience 
          ? String(form.yearsExperience).replace("+", "").trim() 
          : "";
        
        authData = await api.register({
          email:     form.email,
          password:  form.password,
          fullName:  form.fullName,
          role:      form.role,
          dailyRate: form.role === "GUIDE" ? Number(form.dailyRate) : undefined,
          description: form.role === "GUIDE" ? form.description : undefined,
          licenseNumber: form.role === "GUIDE" ? form.licenseNumber : undefined,
          yearsExperience: form.role === "GUIDE" && expRaw ? parseInt(expRaw, 10) : undefined,
          languages: form.role === "GUIDE" ? form.languages : undefined,
          destinations: form.role === "GUIDE" ? form.destinations : undefined,
        });
      }

      api.setToken(authData.token);

      // Upload photo if guide provided one
      if (!isLogin && form.role === "GUIDE" && form.photoFile) {
        try {
          await api.uploadGuidePhoto(form.photoFile);
        } catch (photoErr) {
          // Photo upload failed but registration succeeded - continue
          console.error("Photo upload failed:", photoErr);
        }
      }

      const user = {
        id:             authData.userId,
        email:          form.email,
        fullName:       authData.fullName,
        role:           authData.role,
        guideProfileId: authData.guideProfileId,
      };
      api.saveUser(user);
      onSuccess(user);
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = isGuideRegister && !isLogin && (
    <div className="flex items-center gap-3 mb-6">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
            ${step >= n ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400"}`}>{n}</div>
          {n === 1 && <span className={`text-xs font-medium ${step >= 1 ? "text-blue-700" : "text-slate-400"}`}>Account</span>}
          {n === 1 && <div className={`h-0.5 w-8 rounded ${step >= 2 ? "bg-blue-700" : "bg-slate-200"}`} />}
          {n === 2 && <span className={`text-xs font-medium ${step >= 2 ? "text-blue-700" : "text-slate-400"}`}>Guide Profile</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-950 via-blue-900 to-emerald-900 p-4 py-12">
      <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition font-bold text-xl"
          type="button"
          aria-label="Close">
          ×
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-blue-700 to-emerald-500 rounded-2xl text-white text-2xl font-black shadow-lg mb-4">X</div>
          <h1 className="text-2xl font-black text-blue-950">
            {isLogin ? "Welcome back" : step === 1 ? "Create account" : "Complete your guide profile"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Sign in to Xplorica LK" : step === 1 ? "Join Xplorica LK today" : "Tell travellers about yourself"}
          </p>
        </div>

        {stepIndicator}

        {/* Role selector */}
        {!isLogin && step === 1 && (
          <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
            {["TOURIST", "GUIDE"].map(r => (
              <button key={r} type="button" onClick={() => set("role")(r)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition
                  ${form.role === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {r === "TOURIST" ? "🌍 Tourist" : "🗺 Tour Guide"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Step 1: basic account */}
          {(isLogin || step === 1) && (
            <>
              {!isLogin && <Input label="Full Name" value={form.fullName} onChange={set("fullName")} required placeholder="Your full name" />}
              <Input label="Email"    type="email"    value={form.email}    onChange={set("email")}    required placeholder="your@email.com" />
              <Input label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="Min. 6 characters" />
            </>
          )}

          {/* Step 2: guide profile */}
          {isGuideRegister && step === 2 && (
            <>
              {/* Photo */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {form.photoPreview
                      ? <img src={mediaUrl(form.photoPreview)} alt="Preview" className="w-full h-full object-cover" />
                      : <span className="text-3xl">📷</span>}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition">
                      <span>📂</span> Choose Photo
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">JPG, PNG or WEBP · Max 5 MB</p>
                  </div>
                </div>
              </div>

              <Textarea label="About You *" value={form.description} onChange={set("description")}
                placeholder="Describe your experience, specialities, and what makes your tours unique..." rows={3} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Licence Number *" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="SLG-0000" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Years of Experience <span className="text-red-500">*</span></label>
                  <select value={form.yearsExperience} onChange={e => set("yearsExperience")(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8,9,"10+","15+","20+"].map(n => <option key={n} value={n}>{n} year{n === 1 ? "" : "s"}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Daily Rate (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                  <input
                    type="number" min="1" step="1" value={form.dailyRate}
                    onChange={e => set("dailyRate")(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-400">This is the amount tourists will be charged per day</p>
              </div>

              {/* Languages */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Languages Spoken * <span className="text-slate-400 font-normal">({form.languages.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => toggle("languages", l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.languages.includes(l)
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105"
                          : "border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Destinations — capped at 5 for non-premium (registration is always non-premium) */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Destinations You Offer * <span className="text-slate-400 font-normal">({form.destinations.length}/5 selected · upgrade to Premium for unlimited)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map(d => {
                    const selected = form.destinations.includes(d);
                    const atLimit = !selected && form.destinations.length >= 5;
                    return (
                      <button key={d} type="button"
                        onClick={() => !atLimit && toggle("destinations", d)}
                        disabled={atLimit}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                          selected
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm scale-105"
                            : atLimit
                            ? "border-slate-100 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700"
                        }`}>📍 {d}</button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            {isGuideRegister && step === 2 && (
              <Btn type="button" variant="outline" onClick={() => { setStep(1); setError(""); }}>← Back</Btn>
            )}
            <Btn full type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? "Please wait…" :
               isLogin ? "Sign In" :
               isGuideRegister && step === 1 ? "Next: Guide Profile →" :
               "Create Account"}
            </Btn>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { onSwitch(); setStep(1); setError(""); }}
            className="text-blue-700 font-semibold hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// ── Guide Dashboard ────────────────────────────────────────────────────────
function GuideDashboard({ user, onNav }) {
  const [tab, setTab] = useState("profile");

  // Profile form state
  const [form, setForm] = useState({
    description: "", licenseNumber: "", yearsExperience: "", dailyRate: "",
    photoFile: null, photoPreview: null,
    languages: [], destinations: [],
  });
  const [profileStatus, setProfileStatus]   = useState("PENDING");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saved, setSaved]                   = useState(false);
  const [saveError, setSaveError]           = useState("");
  const [saving, setSaving]                 = useState(false);

  // Bookings
  const [bookings, setBookings]       = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Premium
  const [isPremium, setIsPremium]             = useState(false);
  const [premiumExpiry, setPremiumExpiry]     = useState(null);
  const [subscribing, setSubscribing]         = useState(false);
  const [analytics, setAnalytics]             = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chartMode, setChartMode]             = useState("revenue"); // "revenue" | "tours"

  const setF = k => v => setForm(p => ({ ...p, [k]: v }));
  const toggleItem = (key, val) => setForm(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(i => i !== val) : [...p[key], val],
  }));

  // Load guide profile from DB on mount
  useEffect(() => {
    if (!user.guideProfileId) { setProfileLoading(false); return; }
    api.getGuide(user.guideProfileId)
      .then(g => {
        setForm({
          description:     g.description    || "",
          licenseNumber:   g.licenseNumber  || "",
          yearsExperience: g.yearsExperience != null ? String(g.yearsExperience) : "",
          dailyRate:       g.dailyRate != null ? String(g.dailyRate) : "",
          photoFile:       null,
          photoPreview:    g.photoUrl || null,
          languages:       g.languages    || [],
          destinations:    g.destinations || [],
        });
        setProfileStatus(g.status || "PENDING");
        setIsPremium(g.premium || false);
        setPremiumExpiry(g.premiumExpiresAt || null);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user.guideProfileId]);

  // Load bookings / analytics when tab changes
  useEffect(() => {
    if (tab === "bookings") {
      setDataLoading(true);
      api.getMyBookings().then(setBookings).catch(() => {}).finally(() => setDataLoading(false));
    } else if (tab === "analytics" && isPremium) {
      setAnalyticsLoading(true);
      api.getGuideAnalytics().then(setAnalytics).catch(() => {}).finally(() => setAnalyticsLoading(false));
    }
  }, [tab, isPremium]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(p => ({ ...p, photoFile: file, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaveError("");
    if (!form.description.trim())                                      { setSaveError("Description is required."); return; }
    if (!form.dailyRate || Number(form.dailyRate) <= 0)                { setSaveError("Please enter a valid daily rate."); return; }
    if (!form.licenseNumber.trim())                                    { setSaveError("Licence number is required."); return; }
    if (!form.yearsExperience || Number(form.yearsExperience) < 0)     { setSaveError("Years of experience is required."); return; }
    if (!form.photoPreview && !form.photoFile)                         { setSaveError("Please upload a profile photo."); return; }
    if (form.languages.length === 0)                                   { setSaveError("Please select at least one language."); return; }
    if (form.destinations.length === 0)                                { setSaveError("Please select at least one destination."); return; }

    setSaving(true);
    try {
      const expRaw = String(form.yearsExperience).replace("+", "").trim();
      await api.upsertGuideProfile({
        description:     form.description,
        licenseNumber:   form.licenseNumber || null,
        yearsExperience: expRaw ? parseInt(expRaw, 10) : null,
        dailyRate:       Number(form.dailyRate),
        languages:       form.languages,
        destinations:    form.destinations,
      });
      if (form.photoFile) {
        const url = await api.uploadGuidePhoto(form.photoFile);
        setForm(p => ({ ...p, photoPreview: url, photoFile: null }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-blue-950">Guide Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user.fullName}</p>
        </div>
        <Badge color={profileStatus === "APPROVED" ? "emerald" : "amber"}>
          {profileStatus === "APPROVED" ? "✓ Approved" : "⏳ Pending Approval"}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        {[["profile","Profile"],["bookings","Bookings"],["analytics", isPremium ? "Analytics" : "Analytics ⭐"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition
              ${tab === k ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === "profile" && (
        profileLoading ? <Spinner /> : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl p-7 shadow-sm border border-slate-100 space-y-5">
              <h2 className="font-bold text-blue-950 text-lg">Profile Information</h2>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Profile Photo <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {form.photoPreview
                      ? <img src={mediaUrl(form.photoPreview)} alt="Preview" className="w-full h-full object-cover" />
                      : <Avatar name={user.fullName} size={60} />}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition">
                    <span>📂</span> Change Photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              <Textarea label="Description *" value={form.description} onChange={setF("description")}
                placeholder="Describe your experience and specialties..." rows={4} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="License Number *" value={form.licenseNumber} onChange={setF("licenseNumber")} placeholder="SLG-0000" />
                <Input label="Years of Experience *" type="number" value={form.yearsExperience} onChange={setF("yearsExperience")} placeholder="5" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Daily Rate (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                  <input
                    type="number" min="1" step="1" value={form.dailyRate}
                    onChange={e => setF("dailyRate")(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-400">Amount tourists are charged per day per person</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Languages *</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => toggleItem("languages", l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                        ${form.languages.includes(l) ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-200 text-slate-600 hover:border-emerald-400"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Destinations *{" "}
                  {isPremium
                    ? <span className="text-amber-500 font-normal text-xs">⭐ Unlimited (Premium)</span>
                    : <span className="text-slate-400 font-normal text-xs">({form.destinations.length}/5 · upgrade for unlimited)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map(d => {
                    const selected = form.destinations.includes(d);
                    const atLimit = !isPremium && !selected && form.destinations.length >= 5;
                    return (
                      <button key={d} type="button"
                        onClick={() => !atLimit && toggleItem("destinations", d)}
                        disabled={atLimit}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                          ${selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : atLimit
                            ? "border-slate-100 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 text-slate-600 hover:border-blue-400"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {saveError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{saveError}</p>}
              {saved && <p className="text-emerald-600 text-sm font-medium bg-emerald-50 rounded-xl px-4 py-2">✓ Profile saved successfully!</p>}
              <Btn variant="primary" full onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </Btn>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden">
                  {form.photoPreview
                    ? <img src={mediaUrl(form.photoPreview)} alt={user.fullName} className="w-full h-full object-cover" />
                    : <Avatar name={user.fullName} size={80} />}
                </div>
                <p className="font-bold text-blue-950">{user.fullName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              {profileStatus !== "APPROVED" && (
                <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
                  <p className="text-amber-800 text-sm font-semibold mb-2">⏳ Awaiting Approval</p>
                  <p className="text-amber-700 text-xs">Your profile is under review. You'll be notified once approved.</p>
                </div>
              )}
              {/* Premium status card */}
              {isPremium ? (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-5 border border-amber-200">
                  <p className="text-amber-800 font-bold text-sm mb-1">⭐ Premium Active</p>
                  <p className="text-amber-700 text-xs">Unlimited destinations · Analytics · Featured visibility</p>
                  {premiumExpiry && (
                    <p className="text-amber-600 text-xs mt-2">Expires: {new Date(premiumExpiry).toLocaleDateString()}</p>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100">
                  <p className="text-blue-950 font-bold text-sm mb-1">⭐ Go Premium — $10/month</p>
                  <ul className="text-slate-600 text-xs space-y-1 mb-3 mt-2">
                    <li>✓ Featured carousel on home page</li>
                    <li>✓ Unlimited destinations</li>
                    <li>✓ Analytics dashboard</li>
                  </ul>
                  <button
                    onClick={async () => {
                      setSubscribing(true);
                      try {
                        const g = await api.subscribePremium();
                        setIsPremium(g.premium);
                        setPremiumExpiry(g.premiumExpiresAt);
                      } catch (e) { alert(e.message || "Subscription failed"); }
                      finally { setSubscribing(false); }
                    }}
                    disabled={subscribing}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold text-sm py-2 rounded-xl transition disabled:opacity-60">
                    {subscribing ? "Processing…" : "Subscribe for $10"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Bookings Tab ── */}
      {tab === "bookings" && (
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
          <h2 className="font-bold text-blue-950 text-lg mb-5">Your Bookings</h2>
          {dataLoading ? <Spinner /> : bookings.length === 0
            ? <p className="text-slate-400 text-sm">No bookings yet.</p>
            : (
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-blue-950">{b.touristName || b.guideName}</p>
                        <p className="text-sm text-slate-500">
                          📅 {b.startDate} → {b.endDate} · 👥 {b.numberOfPeople} people{b.destination ? ` · 📍 ${b.destination}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-950">${(b.totalAmount - (b.platformCommission || 0)).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">after ${(b.platformCommission || 0).toFixed(2)} commission</p>
                        <Badge color={b.status === "CONFIRMED" ? "emerald" : b.status === "CANCELLED" ? "slate" : "amber"}>
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                    {/* Chat + Status Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-200 mt-3">
                      <button
                        onClick={() => onNav("chat", { userId: b.touristId, fullName: b.touristName })}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold py-2 px-4 rounded-xl transition">
                        💬 Chat
                      </button>
                    </div>
                    {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                      <div className="flex gap-2 pt-2">
                        {b.status === "PENDING" && (
                          <button
                            onClick={async () => {
                              try {
                                await api.updateBookingStatus(b.id, "CONFIRMED");
                                setBookings(prev => prev.map(item => 
                                  item.id === b.id ? { ...item, status: "CONFIRMED" } : item
                                ));
                              } catch (err) {
                                alert("Failed to confirm booking: " + err.message);
                              }
                            }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2 px-3 rounded-xl transition">
                            ✓ Confirm
                          </button>
                        )}
                        {b.status === "CONFIRMED" && (
                          <button
                            onClick={async () => {
                              try {
                                await api.updateBookingStatus(b.id, "COMPLETED");
                                setBookings(prev => prev.map(item => 
                                  item.id === b.id ? { ...item, status: "COMPLETED" } : item
                                ));
                              } catch (err) {
                                alert("Failed to mark as completed: " + err.message);
                              }
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-xl transition">
                            ✓ Complete
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to cancel this booking?")) return;
                            try {
                              await api.updateBookingStatus(b.id, "CANCELLED");
                              setBookings(prev => prev.map(item => 
                                item.id === b.id ? { ...item, status: "CANCELLED" } : item
                              ));
                            } catch (err) {
                              alert("Failed to cancel booking: " + err.message);
                            }
                          }}
                          className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 text-sm font-semibold py-2 px-3 rounded-xl transition">
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <div>
          {!isPremium ? (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-10 border border-amber-200 text-center">
              <h3 className="text-xl font-bold text-blue-950 mb-2">Analytics is a Premium Feature</h3>
              <p className="text-slate-500 text-sm mb-6">Upgrade to Premium to unlock detailed insights about your bookings, revenue, and tourists.</p>
              <button
                onClick={async () => {
                  setSubscribing(true);
                  try {
                    const g = await api.subscribePremium();
                    setIsPremium(g.premium); setPremiumExpiry(g.premiumExpiresAt);
                    setTab("analytics");
                  } catch (e) { alert(e.message || "Subscription failed"); }
                  finally { setSubscribing(false); }
                }}
                disabled={subscribing}
                className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-8 py-3 rounded-xl transition disabled:opacity-60">
                {subscribing ? "Processing…" : "Subscribe for $10/month"}
              </button>
            </div>
          ) : analyticsLoading ? <Spinner /> : !analytics ? (
            <p className="text-slate-400 text-sm">Could not load analytics.</p>
          ) : (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Total Bookings",   value: analytics.totalBookings,      bg: "from-blue-50 to-blue-100",      num: "text-blue-800" },
                  { label: "Completed",        value: analytics.completedTours,     bg: "from-emerald-50 to-emerald-100", num: "text-emerald-700" },
                  { label: "Confirmed",        value: analytics.confirmedBookings,  bg: "from-indigo-50 to-indigo-100",  num: "text-indigo-700" },
                  { label: "Pending",          value: analytics.pendingBookings,    bg: "from-amber-50 to-amber-100",    num: "text-amber-700" },
                  { label: "Cancelled",        value: analytics.cancelledBookings,  bg: "from-slate-50 to-slate-100",    num: "text-slate-600" },
                ].map(m => (
                  <div key={m.label} className={`bg-gradient-to-br ${m.bg} rounded-2xl p-5 border border-white shadow-sm text-center`}>
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <p className={`text-3xl font-black ${m.num}`}>{m.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Monthly chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-blue-950">Monthly Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Last 6 months — hover bars for exact values</p>
                  </div>
                  <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {[["revenue","💰 Revenue"],["tours","🗺 Tours"]].map(([k, lbl]) => (
                      <button key={k} onClick={() => setChartMode(k)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${chartMode === k ? "bg-white shadow text-blue-800" : "text-slate-500 hover:text-slate-700"}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChart
                  data={chartMode === "revenue" ? analytics.monthlyRevenue : analytics.monthlyTours}
                  prefix={chartMode === "revenue" ? "$" : ""}
                  color={chartMode === "revenue" ? "#10b981" : "#2563eb"}
                />
                {chartMode === "revenue" && (
                  <p className="text-right text-xs text-slate-400 mt-2">
                    Total earned: <span className="font-bold text-emerald-600">${analytics.totalRevenue.toFixed(2)}</span>
                    &nbsp;·&nbsp; People served: <span className="font-semibold">{analytics.totalPeopleServed}</span>
                    &nbsp;·&nbsp; Unique tourists: <span className="font-semibold">{analytics.uniqueTourists}</span>
                  </p>
                )}
              </div>

              {/* Destination bookings chart */}
              {analytics.destinationBookings && Object.keys(analytics.destinationBookings).length > 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="mb-5">
                    <h3 className="font-bold text-blue-950">Bookings by Destination</h3>
                    <p className="text-xs text-slate-400 mt-0.5">How many tours each location has received</p>
                  </div>
                  <HorizBarChart data={analytics.destinationBookings} color="#6366f1" />
                </div>
              ) : null}

              {/* Performance summary */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-blue-950 mb-4">Rating & Reviews</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-black text-amber-500">{analytics.averageRating.toFixed(1)}</span>
                    <div>
                      <Stars rating={Math.round(analytics.averageRating)} size="sm" />
                      <p className="text-xs text-slate-400 mt-1">{analytics.totalReviews} review{analytics.totalReviews !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Confirmed Bookings</span>
                    <span className="font-semibold">{analytics.confirmedBookings}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-blue-950 mb-4">Top Destinations</h3>
                  {analytics.topDestinations?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topDestinations.map((d, i) => (
                        <div key={d} className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400 w-5">#{i + 1}</span>
                          <span className="flex-1 text-sm font-medium text-slate-700">{d}</span>
                          <Badge color={i === 0 ? "amber" : i === 1 ? "blue" : "slate"}>{i === 0 ? "🏆 Top" : i === 1 ? "🥈" : "🥉"}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-slate-400 text-sm">No bookings with destinations yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Messages Page ──────────────────────────────────────────────────────────
function MessagesPage({ user, onNav }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChatPartners().then(setPartners).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      api.getChatPartners().then(setPartners).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-blue-950">Messages</h1>
        <p className="text-slate-500">Your conversations</p>
      </div>

      <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-blue-950 text-lg">Conversations</h2>
          <button
            onClick={() => {
              setLoading(true);
              api.getChatPartners().then(setPartners).catch(() => {}).finally(() => setLoading(false));
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            🔄 Refresh
          </button>
        </div>
        {loading ? <Spinner /> : partners.length === 0
          ? <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">No conversations yet.</p>
              <Btn variant="primary" onClick={() => onNav("browse")}>Find Guides</Btn>
            </div>
          : partners.map(p => (
              <div key={p.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition mb-2"
                onClick={() => onNav("chat", { userId: p.id, fullName: p.fullName })}>
                <Avatar name={p.fullName} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-blue-950">{p.fullName}</p>
                  <p className="text-sm text-slate-500">Tap to open conversation</p>
                </div>
                <span className="text-slate-400 text-lg">›</span>
              </div>
            ))}
      </div>
    </div>
  );
}

// ── Chat Page ──────────────────────────────────────────────────────────────
function ChatPage({ user, guide, onBack }) {
  const [messages, setMessages]             = useState([]);
  const [input, setInput]                   = useState("");
  const [sendError, setSendError]           = useState("");
  const [loadError, setLoadError]           = useState("");
  const [locationShared, setLocationShared] = useState(false);
  const [loading, setLoading]               = useState(true);
  const endRef  = useRef(null);
  const pollRef = useRef(null);

  // partnerId is the user-ID of the person we're chatting with
  const partnerId = guide?.userId;
  // current user's ID (stored as `id` in the session object)
  const myId = user?.id;
  const partnerName = guide?.fullName || (user?.role === "GUIDE" ? "Tourist" : "Guide");
  const partnerPhoto = mediaUrl(guide?.photoUrl);

  const loadMessages = async () => {
    if (!partnerId) return;
    try {
      const data = await api.getConversation(partnerId);
      setMessages(data);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Could not load messages");
    }
  };

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    loadMessages().then(() => setLoading(false));
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [partnerId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !partnerId) return;
    const text = input;
    setSendError("");
    setInput("");
    try {
      const msg = await api.sendMessage(partnerId, text);
      setMessages(p => [...p, msg]);
    } catch (err) {
      setInput(text); // restore text so the user can retry
      setSendError(err.message || "Failed to send message");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition font-bold text-lg">←</button>
        <Avatar name={partnerName} photo={partnerPhoto} size={44} />
        <div>
          <p className="font-bold text-blue-950">{partnerName}</p>
          <p className="text-xs text-emerald-500 font-medium">● Online</p>
        </div>
        <div className="ml-auto flex gap-2">
          {locationShared
            ? <Badge color="emerald">📍 Location Shared</Badge>
            : <Btn size="sm" variant="outline" onClick={() => setLocationShared(true)}>Share Location</Btn>}
        </div>
      </div>

      {/* Location banner */}
      {locationShared && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">📍 Live location active</p>
            <p className="text-xs text-emerald-600">
              {user?.role === "GUIDE" 
                ? "You can see the tourist's current position" 
                : `${partnerName} can see your current position`}
            </p>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => setLocationShared(false)}>Stop</Btn>
        </div>
      )}

      {/* Mock map */}
      {locationShared && (
        <div className="bg-blue-50 rounded-2xl h-32 mb-4 flex items-center justify-center border border-blue-100">
          <div className="text-center text-blue-600">
            <p className="text-3xl mb-1">🗺</p>
            <p className="text-sm font-semibold">Live map · Colombo, Sri Lanka</p>
            <p className="text-xs text-blue-400">6.9271° N, 79.8612° E</p>
          </div>
        </div>
      )}

      {/* Messages from DB */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ minHeight: 0 }}>
        {loading && <Spinner />}
        {!loading && loadError && (
          <p className="text-center text-red-500 text-sm py-4 bg-red-50 rounded-2xl px-4">{loadError}</p>
        )}
        {!loading && !loadError && messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No messages yet. Say hi! 👋</p>
        )}
        {messages.map(m => {
          const isMe = m.senderId === myId;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"} gap-3 items-end`}>
              {!isMe && <Avatar name={guide?.fullName || "G"} photo={guide?.photoUrl} size={32} />}
              <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                ${isMe
                  ? "bg-blue-700 text-white rounded-br-sm"
                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"}`}>
                {m.content}
              </div>
              {isMe && <Avatar name={user?.fullName || "You"} size={32} />}
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-slate-100">
        {sendError && (
          <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2 mb-2">{sendError}</p>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type a message…"
              className="flex-1 text-sm focus:outline-none bg-transparent" />
          </div>
          <Btn variant="primary" onClick={send} disabled={!input.trim()}>Send →</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Payment Page ───────────────────────────────────────────────────────────
function PaymentPage({ booking, onBack, onComplete }) {
  const [method, setMethod] = useState("card");
  const [card, setCard]     = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [paid, setPaid]     = useState(false);
  const [paying, setPaying] = useState(false);
  const setC = k => v => setCard(p => ({ ...p, [k]: v }));

  const pay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      if (booking?.bookingId) {
        await api.confirmPayment(booking.bookingId);
        setPaid(true);
      } else {
        throw new Error("Invalid booking");
      }
    } catch (err) {
      alert("Payment failed: " + (err.message || "Please try again"));
    } finally {
      setPaying(false);
    }
  };

  if (paid) return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl mb-6">🎉</motion.div>
      <h1 className="text-3xl font-black text-blue-950 mb-3">Booking Confirmed!</h1>
      <p className="text-slate-500 mb-8">Your tour has been booked successfully. Check your email for confirmation details.</p>
      <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">Guide</span><span className="font-bold text-blue-950">{booking?.guide?.fullName || "Your Guide"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold">{booking?.date || "—"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">People</span><span className="font-bold">{booking?.people || 1}</span></div>
        <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold">Total Paid</span><span className="font-black text-emerald-600">${booking?.total || 35}</span></div>
      </div>
      <Btn full variant="primary" onClick={onComplete}>Back to My Bookings</Btn>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-700 mb-8 text-sm font-medium transition">← Back</button>
      <h1 className="text-2xl font-black text-blue-950 mb-2">Secure Payment</h1>
      <p className="text-slate-500 text-sm mb-8">Complete your booking with {booking?.guide?.fullName || "your guide"}</p>

      {/* Summary */}
      <div className="bg-slate-50 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-blue-950 mb-3">Booking Summary</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600"><span>Tour with {booking?.guide?.fullName || "guide"}</span><span>$35/person</span></div>
          <div className="flex justify-between text-slate-600"><span>× {booking?.people || 1} people</span><span>${booking?.total || 35}</span></div>
          <div className="flex justify-between font-bold text-blue-950 border-t pt-2 mt-2"><span>Total</span><span>${booking?.total || 35}</span></div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex gap-2 mb-6">
        {[["card","💳 Credit Card"],["paypal","🔵 PayPal"],["bank","🏦 Bank Transfer"]].map(([m, label]) => (
          <button key={m} onClick={() => setMethod(m)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition
              ${method === m ? "bg-blue-700 text-white border-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {method === "card" && (
        <form onSubmit={pay} className="space-y-4">
          <Input label="Card Number" value={card.number} onChange={setC("number")} placeholder="1234 5678 9012 3456" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry" value={card.expiry} onChange={setC("expiry")} placeholder="MM/YY" required />
            <Input label="CVV"    value={card.cvv}    onChange={setC("cvv")}    placeholder="123"   required />
          </div>
          <Input label="Name on Card" value={card.name} onChange={setC("name")} placeholder="Full name" required />
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <span>🔒</span> Your payment is encrypted and secure. SSL protected.
          </div>
          <Btn full type="submit" variant="emerald" size="lg" disabled={paying}>
            {paying ? "Processing…" : `Pay $${booking?.total || 35} Now`}
          </Btn>
        </form>
      )}
      {method === "paypal" && (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-6">You'll be redirected to PayPal to complete payment.</p>
          <Btn full variant="primary" onClick={async () => { await pay({ preventDefault: () => {} }); }}>Continue to PayPal →</Btn>
        </div>
      )}
      {method === "bank" && (
        <div className="bg-slate-50 rounded-2xl p-5 space-y-2 text-sm">
          <p className="font-bold text-blue-950 mb-3">Bank Transfer Details</p>
          <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-semibold">Commercial Bank of Ceylon</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-semibold">8001-2345-6789</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-semibold text-blue-600">XPL-{booking?.bookingId || "000000"}</span></div>
          <Btn full variant="primary" className="mt-4"
            onClick={async () => { await pay({ preventDefault: () => {} }); }}>
            I've Completed the Transfer
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── Privacy Page ───────────────────────────────────────────────────────────
function PrivacyPage({ onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-700 mb-8 text-sm font-medium">← Back</button>
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 prose prose-slate max-w-none">
        <h1 className="text-3xl font-black text-blue-950 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: January 2026</p>
        {[
          { title: "1. Information We Collect", content: "We collect information you provide directly: name, email address, profile photo, tour guide licence number, and payment details for bookings. We also collect usage data such as pages visited, searches performed, and interactions with guide profiles to improve our service." },
          { title: "2. How We Use Your Information", content: "We use your information to facilitate connections between tourists and tour guides, process bookings and payments, send booking confirmations and notifications, improve the Xplorica LK platform, comply with applicable laws and regulations, and verify tour guide identity and licence credentials." },
          { title: "3. Location Data", content: "With your explicit consent, we collect and share your real-time location with your tour guide to facilitate meetups. Location sharing is entirely voluntary and can be stopped at any time from the chat interface. We do not store location history beyond 24 hours." },
          { title: "4. Data Sharing", content: "We share your name and contact details with tour guides only after a confirmed booking. We share pseudonymised usage data with analytics partners. We never sell your personal data. Payment processing is handled by PCI-DSS certified third-party processors." },
          { title: "5. Data Retention", content: "We retain your account data for as long as your account is active. Booking records are kept for 7 years for tax and legal compliance. Chat messages are retained for 1 year. You may request deletion of your personal data at any time." },
          { title: "6. Your Rights", content: "Under applicable data protection laws you have the right to access your personal data, correct inaccurate data, request deletion ('right to be forgotten'), object to processing, data portability, and withdraw consent at any time." },
          { title: "7. Cookies", content: "We use essential cookies for authentication and session management, and optional analytics cookies to understand how our platform is used. You can manage cookie preferences in your browser settings." },
          { title: "8. Security", content: "We implement industry-standard security measures including TLS encryption for data in transit, AES-256 encryption for sensitive data at rest, JWT-based authentication with 24-hour token expiry, and regular security audits." },
          { title: "9. Contact Us", content: "For any privacy-related queries, please contact our Data Protection Officer at privacy@xploricalk.com or write to Xplorica LK Pvt Ltd, 42 Galle Road, Colombo 03, Sri Lanka." },
        ].map(s => (
          <div key={s.title} className="mb-6">
            <h2 className="text-lg font-bold text-blue-950 mb-2">{s.title}</h2>
            <p className="text-slate-600 leading-relaxed text-sm">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NAV BAR
// ══════════════════════════════════════════════════════════════════════════
function Navbar({ user, page, onNav, onLogin, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <button onClick={() => onNav("home")} className="flex items-center">
          <img src="https://res.cloudinary.com/de6869utj/image/upload/v1780316235/X_PLORICA_LK_a6wxka.png"
            alt="Xplorica LK" className="h-10 w-auto object-contain" />
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => onNav("browse")} className={`hover:text-blue-700 transition ${page === "browse" ? "text-blue-700" : ""}`}>Find Guides</button>
          {user?.role === "TOURIST" && (
            <button onClick={() => onNav("my-bookings")} className={`hover:text-blue-700 transition ${page === "my-bookings" ? "text-blue-700" : ""}`}>My Bookings</button>
          )}
          <button onClick={() => onNav("privacy")} className="hover:text-blue-700 transition">Privacy</button>
          {user?.role === "GUIDE" && (
            <button onClick={() => onNav("dashboard")} className={`hover:text-blue-700 transition ${page === "dashboard" ? "text-blue-700" : ""}`}>Dashboard</button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user
            ? <>
                <div className="flex items-center gap-2">
                  <Avatar name={user.fullName} size={32} />
                  <span className="text-sm font-semibold text-blue-950">{user.fullName}</span>
                </div>
                <Btn variant="ghost" size="sm" onClick={onLogout}>Sign out</Btn>
              </>
            : <>
                <Btn variant="ghost"   size="sm" onClick={() => onLogin("login")}>Sign in</Btn>
                <Btn variant="primary" size="sm" onClick={() => onLogin("register")}>Sign up</Btn>
              </>}
        </div>

        <button className="md:hidden text-xl text-slate-600" onClick={() => setMobileOpen(p => !p)}>☰</button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
          <button onClick={() => { onNav("browse"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">Find Guides</button>
          {user?.role === "TOURIST" && (
            <button onClick={() => { onNav("my-bookings"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">My Bookings</button>
          )}
          <button onClick={() => { onNav("privacy"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">Privacy Policy</button>
          {user?.role === "GUIDE" && (
            <button onClick={() => { onNav("dashboard"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">Dashboard</button>
          )}
          {!user
            ? <>
                <Btn full variant="outline" onClick={() => { onLogin("login");    setMobileOpen(false); }}>Sign in</Btn>
                <Btn full variant="primary" onClick={() => { onLogin("register"); setMobileOpen(false); }}>Sign up</Btn>
              </>
            : <Btn full variant="ghost" onClick={() => { onLogout(); setMobileOpen(false); }}>Sign out</Btn>}
        </div>
      )}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════
function Footer({ onNav }) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <img src="https://res.cloudinary.com/de6869utj/image/upload/v1780316235/X_PLORICA_LK_a6wxka.png"
            alt="Xplorica LK" className="h-10 w-auto object-contain mb-3 brightness-0 invert" />
          <p className="text-sm leading-relaxed">Connecting travellers with verified Sri Lankan local guides.</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Navigate</h4>
          <div className="space-y-2 text-sm">
            <button onClick={() => onNav("browse")}  className="block hover:text-white transition">Find Guides</button>
            <button onClick={() => onNav("home")}    className="block hover:text-white transition">Home</button>
            <button onClick={() => onNav("privacy")} className="block hover:text-white transition">Privacy Policy</button>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Contact</h4>
          <p className="text-sm">✉ hello@xploricalk.com</p>
          <p className="text-sm mt-1">📍 Colombo, Sri Lanka</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Commission</h4>
          <p className="text-sm">10–25% per booking</p>
          <p className="text-sm mt-1">$2–5 tourist service fee</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm">
        <p>© 2026 Xplorica LK. All rights reserved.</p>
        <button onClick={() => onNav("privacy")} className="hover:text-white transition mt-2 md:mt-0">Privacy Policy</button>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]                   = useState("home");
  const [user, setUser]                   = useState(null);
  const [authMode, setAuthMode]           = useState(null);   // "login" | "register"
  const [defaultRole, setDefaultRole]     = useState("TOURIST");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [chatPartner, setChatPartner]     = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [previousPage, setPreviousPage]   = useState("home");

  // Restore session from localStorage on first load
  useEffect(() => {
    const token  = api.getToken();
    const stored = api.loadUser();
    if (token && stored) setUser(stored);
  }, []);

  const nav = (p, data) => {
    setPreviousPage(page);
    setPage(p);
    if (p === "guide") setSelectedGuide(data);
    if (p === "chat")  setChatPartner(data);
  };

  const login  = (mode, role) => { setAuthMode(mode); setDefaultRole(role || "TOURIST"); setPage("auth"); };
  const logout = () => {
    setUser(null);
    api.clearToken();
    api.clearUser();
    setPage("home");
  };

  const authSuccess = (u) => {
    setUser(u);
    setAuthMode(null);
    if (u.role === "GUIDE") { setPage("dashboard"); return; }
    setPage(previousPage === "guide" && selectedGuide ? "guide" : "home");
  };

  const showFooter = !["auth", "chat", "payment"].includes(page);
  const showNav    = page !== "auth";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {showNav && (
        <Navbar user={user} page={page} onNav={nav} onLogin={login} onLogout={logout} />
      )}

      <div className={showNav ? "pt-16" : ""}>
        <AnimatePresence mode="wait">

          {page === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthPage mode={authMode} defaultRole={defaultRole}
                onSuccess={authSuccess}
                onSwitch={() => setAuthMode(m => m === "login" ? "register" : "login")}
                onClose={() => nav("home")} />
            </motion.div>
          )}

          {page === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage onNav={nav} onLogin={login}
                onRegister={(role) => login("register", role)} />
            </motion.div>
          )}

          {page === "browse" && (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BrowsePage user={user} onSelectGuide={g => nav("guide", g)} />
            </motion.div>
          )}

          {page === "guide" && selectedGuide && (
            <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GuideDetailPage guide={selectedGuide} user={user}
                onBack={() => nav("browse")}
                onChat={(g) => { if (!user) { login("login"); return; } nav("chat", g); }}
                onNav={nav} onLogin={login} />
            </motion.div>
          )}

          {page === "messages" && user && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MessagesPage user={user} onNav={nav} />
            </motion.div>
          )}

          {page === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatPage user={user} guide={chatPartner}
                onBack={() => {
                  // Go back to where we came from, or dashboard/home as fallback
                  if (previousPage === "messages") {
                    nav("messages");
                  } else if (previousPage === "dashboard") {
                    nav("dashboard");
                  } else if (selectedGuide) {
                    nav("guide", selectedGuide);
                  } else if (user?.role === "GUIDE") {
                    nav("dashboard");
                  } else {
                    nav("messages");
                  }
                }} />
            </motion.div>
          )}

          {page === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentPage booking={pendingBooking}
                onBack={() => nav(user?.role === "TOURIST" ? "my-bookings" : "browse")}
                onComplete={() => { setPendingBooking(null); nav(user?.role === "TOURIST" ? "my-bookings" : "browse"); }} />
            </motion.div>
          )}

          {page === "dashboard" && user?.role === "GUIDE" && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GuideDashboard user={user} onNav={nav} />
            </motion.div>
          )}

          {page === "my-bookings" && user && (
            <motion.div key="my-bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TouristDashboard user={user} onNav={(p, data) => {
                if (p === "payment") {
                  setPendingBooking(data);
                  nav("payment");
                } else {
                  nav(p, data);
                }
              }} />
            </motion.div>
          )}

          {page === "privacy" && (
            <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PrivacyPage onBack={() => nav("home")} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {showFooter && <Footer onNav={nav} />}
    </div>
  );
}
