import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_GUIDES = [
  { id: 1, fullName: "Nimal Perera", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", description: "Award-winning cultural heritage guide with 12 years leading tours across the Cultural Triangle. Specialising in Sigiriya, Polonnaruwa, and Dambulla cave temples.", licenseNumber: "SLG-0042", yearsExperience: 12, languages: ["English", "Sinhala", "German"], destinations: ["Sigiriya", "Polonnaruwa", "Dambulla", "Kandy"], averageRating: 4.9, totalRatings: 87, status: "APPROVED" },
  { id: 2, fullName: "Priya Dharmaratne", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", description: "Passionate tea country expert born and raised in Ella. I offer immersive hiking, tea factory tours, and sunset experiences along the famous Nine Arch Bridge.", licenseNumber: "SLG-0117", yearsExperience: 7, languages: ["English", "Sinhala", "Japanese"], destinations: ["Ella", "Nuwara Eliya", "Haputale"], averageRating: 4.8, totalRatings: 64, status: "APPROVED" },
  { id: 3, fullName: "Chamara Jayasinghe", photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", description: "Marine biologist turned whale-watching and coastal guide. Specialise in Mirissa whale watching, Galle Fort Dutch colonial history, and seafood experiences.", licenseNumber: "SLG-0089", yearsExperience: 9, languages: ["English", "French", "Sinhala"], destinations: ["Galle", "Mirissa", "Unawatuna", "Tangalle"], averageRating: 4.7, totalRatings: 52, status: "APPROVED" },
  { id: 4, fullName: "Amara Silva", photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", description: "Wildlife enthusiast and certified safari guide at Yala and Udawalawe national parks. Expert in leopard tracking, elephant photography, and bird watching.", licenseNumber: "SLG-0203", yearsExperience: 5, languages: ["English", "Sinhala", "Tamil"], destinations: ["Yala", "Udawalawe", "Bundala"], averageRating: 4.6, totalRatings: 41, status: "APPROVED" },
  { id: 5, fullName: "Ranjith Fernando", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", description: "Colombo food and street tour specialist. Discover hidden gems, colonial architecture, and the real Colombo through local eyes. Night market tours available.", licenseNumber: "SLG-0156", yearsExperience: 6, languages: ["English", "Sinhala", "Mandarin"], destinations: ["Colombo", "Negombo"], averageRating: 4.5, totalRatings: 38, status: "APPROVED" },
  { id: 6, fullName: "Tharini Wickramasinghe", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80", description: "Adventure and trekking guide specialising in Adam's Peak, Knuckles Mountain Range, and Horton Plains. Certified first-aid provider and wilderness guide.", licenseNumber: "SLG-0271", yearsExperience: 8, languages: ["English", "Sinhala", "Italian"], destinations: ["Adam's Peak", "Knuckles Range", "Horton Plains"], averageRating: 4.8, totalRatings: 59, status: "APPROVED" },
];

const MOCK_REVIEWS = {
  1: [
    { id: 1, touristName: "Emma R.", stars: 5, comment: "Nimal was absolutely phenomenal. His knowledge of Sigiriya is unparalleled!", createdAt: "2025-11-15" },
    { id: 2, touristName: "Daniel M.", stars: 5, comment: "Best guide in Sri Lanka, hands down. Booked twice!", createdAt: "2025-10-03" },
  ],
  2: [
    { id: 3, touristName: "Sophie L.", stars: 5, comment: "Priya made Ella magical. The tea factory visit was incredible.", createdAt: "2025-12-01" },
  ],
};

// ── Design tokens ──────────────────────────────────────────────────────────
const DESTINATIONS = ["Sigiriya", "Kandy", "Ella", "Galle", "Colombo", "Yala", "Nuwara Eliya", "Mirissa", "Dambulla", "Adam's Peak"];
const LANGUAGES = ["English", "Sinhala", "Tamil", "French", "German", "Japanese", "Mandarin", "Italian"];

// ── Helpers ────────────────────────────────────────────────────────────────
const Stars = ({ rating, size = "sm", interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "text-sm" : "text-xl";
  return (
    <span className={`flex gap-0.5 ${sz}`}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          className={`cursor-${interactive?"pointer":"default"} transition-colors ${n <= (interactive ? (hover || rating) : rating) ? "text-amber-400" : "text-slate-300"}`}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(n)}
        >★</span>
      ))}
    </span>
  );
};

const Badge = ({ children, color = "emerald" }) => {
  const map = { emerald: "bg-emerald-100 text-emerald-800", blue: "bg-blue-100 text-blue-800", amber: "bg-amber-100 text-amber-800", slate: "bg-slate-100 text-slate-600" };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[color]}`}>{children}</span>;
};

const Input = ({ label, type = "text", value, onChange, required, placeholder, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
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
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-2.5 text-sm", lg: "px-8 py-3 text-base" };
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 active:scale-95",
    emerald: "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95",
    outline: "border-2 border-blue-700 text-blue-700 hover:bg-blue-50 active:scale-95",
    ghost: "text-slate-600 hover:bg-slate-100 rounded-xl active:scale-95",
    danger: "bg-red-500 text-white hover:bg-red-600 active:scale-95",
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
    ? <img src={photo} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    : <div className="rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials}</div>;
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

// ══════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════

// ── Landing Page ──────────────────────────────────────────────────────────
function LandingPage({ onNav, onLogin, onRegister }) {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #071b40 0%, #0d4a6b 50%, #0f6e56 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://www.travelvoice.lk/wp-content/uploads/2024/05/1588843579185.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm mb-6">
              <span className="text-emerald-400">✓</span> Trusted Sri Lankan local guides
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">Explore the<br /><span className="text-emerald-400">Real Sri Lanka</span><br />with Locals</h1>
            <p className="mt-5 text-lg text-blue-100 max-w-lg leading-relaxed">Connect directly with verified local guides for personalised, authentic travel experiences across the Pearl of the Indian Ocean.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Btn size="lg" variant="emerald" onClick={() => onNav("browse")}>Find a Guide</Btn>
              <Btn size="lg" variant="outline" onClick={() => onRegister("GUIDE")} className="border-white text-white hover:bg-white hover:text-blue-900">Become a Guide</Btn>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-white/80 text-sm">
              <span>★ 4.8 avg. rating</span>
              <span>✓ Verified guides</span>
              <span>🌍 50+ destinations</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-4 max-w-sm ml-auto shadow-2xl">
              <div className="bg-white rounded-[1.5rem] p-5">
                <div className="aspect-video rounded-xl bg-cover bg-center mb-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588598198321-9735fd52455b?w=600&q=80')" }} />
                <p className="text-xs font-bold text-emerald-600 mb-1">⭐ Top Rated Guide</p>
                <h3 className="text-lg font-black text-blue-950">Sigiriya Sunrise Walk</h3>
                <p className="text-sm text-slate-500 mt-1">Private tour · 6 hours · Cultural Triangle</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-blue-800 text-lg">$35 <span className="text-sm font-normal text-slate-500">/ person</span></span>
                  <Badge color="amber">★ 4.9 (87)</Badge>
                </div>
              </div>
            </div>
          </motion.div>
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
              { icon: "👤", step: "02", title: "Connect & Chat", desc: "View profiles, read reviews, then message your guide directly." },
              { icon: "📅", step: "03", title: "Book & Explore", desc: "Confirm your date, pay securely, and explore Sri Lanka authentically." },
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

      {/* Featured Guides */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Featured guides</p>
              <h2 className="text-4xl font-black text-blue-950">Top rated this month</h2>
            </div>
            <Btn variant="outline" onClick={() => onNav("browse")}>View all</Btn>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {MOCK_GUIDES.slice(0, 3).map(g => (
              <GuideCard key={g.id} guide={g} onView={() => onNav("guide", g)} />
            ))}
          </div>
        </div>
      </section>

      {/* For tourists / For guides */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-950 rounded-[2rem] p-10 text-white">
            <p className="text-emerald-300 font-bold mb-3">For tourists</p>
            <h2 className="text-3xl font-black mb-5">Discover hidden gems with local experts</h2>
            {["Travel like a local, not just a visitor.", "Filter by language, destination, and rating.", "Chat directly before you commit."].map(t => (
              <p key={t} className="flex items-start gap-3 text-blue-100 mb-3"><span className="text-emerald-400 font-bold mt-0.5">✓</span>{t}</p>
            ))}
            <Btn variant="emerald" size="lg" className="mt-6" onClick={() => onNav("browse")}>Start Exploring</Btn>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-blue-700 rounded-[2rem] p-10 text-white">
            <p className="text-emerald-100 font-bold mb-3">For tour guides</p>
            <h2 className="text-3xl font-black mb-5">Earn income sharing your local knowledge</h2>
            {["Reach international travellers instantly.", "Manage bookings and messages in one place.", "Build your reputation through verified ratings."].map(t => (
              <p key={t} className="flex items-start gap-3 text-emerald-50 mb-3"><span className="text-white font-bold mt-0.5">✓</span>{t}</p>
            ))}
            <Btn className="mt-6 bg-white text-blue-800 hover:bg-blue-50 px-7 py-3 rounded-full font-semibold" onClick={() => onRegister("GUIDE")}>Join as a Guide</Btn>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-blue-950">What travellers say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Emma R.", country: "United Kingdom", text: "Xplorica LK made my Sri Lanka trip feel personal and safe. My guide showed me places I'd never find online.", stars: 5 },
              { name: "Daniel M.", country: "Australia", text: "The booking was simple and the guide was professional. Perfect for authentic local experiences.", stars: 5 },
              { name: "Nadeesha P.", country: "Sri Lanka", text: "As a local guide, this platform helps me reach international travellers and manage my bookings easily.", stars: 5 },
            ].map(r => (
              <div key={r.name} className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <Stars rating={r.stars} />
                <p className="mt-4 text-slate-700 leading-relaxed italic">"{r.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar name={r.name} size={40} />
                  <div><p className="font-bold text-blue-950">{r.name}</p><p className="text-sm text-slate-500">{r.country}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-950 py-20 text-center">
        <h2 className="text-4xl font-black text-white mb-4">Ready to explore Sri Lanka?</h2>
        <p className="text-blue-200 mb-8">Join thousands of travellers who discovered the real Sri Lanka.</p>
        <div className="flex justify-center gap-4">
          <Btn size="lg" variant="emerald" onClick={() => onNav("browse")}>Find a Guide Now</Btn>
          <Btn size="lg" onClick={() => onRegister("TOURIST")} className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3 rounded-full font-semibold">Sign Up Free</Btn>
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
      <div className="h-48 bg-gradient-to-br from-blue-100 to-emerald-50 relative overflow-hidden">
        {guide.photoUrl
          ? <img src={guide.photoUrl} alt={guide.fullName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Avatar name={guide.fullName} size={80} /></div>}
        <div className="absolute top-3 right-3">
          <Badge color="amber">★ {guide.averageRating}</Badge>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-blue-950 text-lg">{guide.fullName}</h3>
          <span className="text-xs text-slate-400">{guide.yearsExperience}y exp</span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{guide.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {guide.destinations.slice(0, 3).map(d => <Badge key={d} color="blue">{d}</Badge>)}
          {guide.destinations.length > 3 && <Badge color="slate">+{guide.destinations.length - 3}</Badge>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {guide.languages.slice(0, 2).map(l => <Badge key={l} color="emerald">{l}</Badge>)}
          </div>
          <Stars rating={Math.round(guide.averageRating)} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Browse / Tourist Home ─────────────────────────────────────────────────
function BrowsePage({ onSelectGuide, user }) {
  const [lang, setLang] = useState("");
  const [dest, setDest] = useState("");
  const [minRating, setMinRating] = useState(0);
  const filtered = MOCK_GUIDES.filter(g =>
    (!lang || g.languages.some(l => l.toLowerCase().includes(lang.toLowerCase()))) &&
    (!dest || g.destinations.some(d => d.toLowerCase().includes(dest.toLowerCase()))) &&
    (g.averageRating >= minRating)
  );

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
          <Btn full variant="primary" onClick={() => { setLang(""); setDest(""); setMinRating(0); }}>
            Clear Filters
          </Btn>
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-5">{filtered.length} guide{filtered.length !== 1 ? "s" : ""} found</p>
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map(g => <GuideCard key={g.id} guide={g} onView={() => onSelectGuide(g)} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-semibold">No guides match your filters</p>
          <p className="mt-2">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}

// ── Guide Detail Page ─────────────────────────────────────────────────────
function GuideDetailPage({ guide, user, onBack, onChat, onBook }) {
  const [showRateModal, setShowRateModal] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState(MOCK_REVIEWS[guide.id] || []);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDate, setBookDate] = useState("");
  const [bookPeople, setBookPeople] = useState(1);
  const [bookMsg, setBookMsg] = useState("");

  const submitRating = () => {
    if (!stars) return;
    setReviews(prev => [...prev, { id: Date.now(), touristName: user?.fullName || "You", stars, comment, createdAt: new Date().toISOString().slice(0,10) }]);
    setShowRateModal(false);
    setStars(0); setComment("");
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
            <div className="h-64 bg-gradient-to-br from-blue-100 to-emerald-50 flex items-center justify-center">
              {guide.photoUrl
                ? <img src={guide.photoUrl} alt={guide.fullName} className="w-full h-full object-cover" />
                : <Avatar name={guide.fullName} size={100} />}
            </div>
            <div className="p-5">
              <h1 className="text-2xl font-black text-blue-950">{guide.fullName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={Math.round(guide.averageRating)} />
                <span className="text-sm text-slate-500">{guide.averageRating} ({guide.totalRatings} reviews)</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>🪪 License: {guide.licenseNumber}</p>
                <p>📅 {guide.yearsExperience} years experience</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {guide.languages.map(l => <Badge key={l} color="emerald">{l}</Badge>)}
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="space-y-3">
            <Btn full variant="primary" onClick={() => setShowBookModal(true)}>📅 Book This Guide</Btn>
            {user && <Btn full variant="outline" onClick={() => onChat(guide)}>💬 Chat with Guide</Btn>}
            {user && user.role === "TOURIST" && (
              <Btn full variant="ghost" onClick={() => setShowRateModal(true)}>⭐ Leave a Review</Btn>
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
              {guide.destinations.map(d => (
                <span key={d} className="bg-blue-50 text-blue-800 font-semibold text-sm px-4 py-2 rounded-full">📍 {d}</span>
              ))}
            </div>
          </div>
          {/* Share Location */}
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-3xl p-7 border border-blue-100">
            <h2 className="text-lg font-bold text-blue-950 mb-3">📍 Location Sharing</h2>
            <p className="text-slate-600 text-sm mb-4">Share your live location with your guide for seamless meetups.</p>
            <Btn variant="primary" size="sm" onClick={() => alert("Location sharing enabled! Your guide will receive your coordinates.")}>
              Enable Location Sharing
            </Btn>
          </div>
          {/* Reviews */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-blue-950 mb-5">Reviews ({reviews.length})</h2>
            {reviews.length === 0
              ? <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
              : <div className="space-y-5">
                  {reviews.map(r => (
                    <div key={r.id} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.touristName} size={36} />
                          <div>
                            <p className="font-semibold text-blue-950 text-sm">{r.touristName}</p>
                            <p className="text-xs text-slate-400">{r.createdAt}</p>
                          </div>
                        </div>
                        <Stars rating={r.stars} />
                      </div>
                      {r.comment && <p className="text-sm text-slate-600 ml-12">{r.comment}</p>}
                    </div>
                  ))}
                </div>}
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
          <Textarea label="Comment (optional)" value={comment} onChange={setComment} placeholder="Share your experience..." rows={4} />
          <Btn full variant="primary" onClick={submitRating} disabled={!stars}>Submit Review</Btn>
        </div>
      </Modal>

      {/* Book Modal */}
      <Modal open={showBookModal} onClose={() => setShowBookModal(false)} title={`Book ${guide.fullName}`}>
        <div className="space-y-5">
          <Input label="Tour Date" type="date" value={bookDate} onChange={setBookDate} required />
          <Input label="Number of People" type="number" value={bookPeople} onChange={v => setBookPeople(Number(v))} required />
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>Rate per person</span><span>$35</span>
            </div>
            <div className="flex justify-between font-bold text-blue-950">
              <span>Total</span><span>${35 * bookPeople}</span>
            </div>
          </div>
          {bookMsg
            ? <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-sm font-medium text-center">{bookMsg}</div>
            : <Btn full variant="emerald" disabled={!bookDate} onClick={() => setBookMsg("🎉 Booking confirmed! Proceed to payment to complete.")}>Confirm Booking</Btn>
          }
          {bookMsg && <Btn full variant="primary" onClick={() => onBook({ guide, date: bookDate, people: bookPeople, total: 35 * bookPeople })}>Proceed to Payment →</Btn>}
        </div>
      </Modal>
    </div>
  );
}

// ── Auth Pages ─────────────────────────────────────────────────────────────
function AuthPage({ mode, defaultRole, onSuccess, onSwitch }) {
  const isLogin = mode === "login";
  // step: 1 = basic info, 2 = guide-specific profile
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", role: defaultRole || "TOURIST",
    // Guide-only fields
    description: "", licenseNumber: "", yearsExperience: "",
    photoFile: null, photoPreview: null, photoUrl: "",
    languages: [], destinations: [],
  });
  const [error, setError] = useState("");
  const isGuideRegister = !isLogin && form.role === "GUIDE";

  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const toggle = (key, val) => setForm(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(i => i !== val) : [...p[key], val]
  }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(p => ({ ...p, photoFile: file, photoPreview: reader.result, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const nextStep = (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (isGuideRegister && step === 1) { nextStep(e); return; }
    // Validate guide step 2
    if (isGuideRegister) {
      if (!form.description.trim()) { setError("Please add a description about yourself."); return; }
      if (form.languages.length === 0) { setError("Please select at least one language."); return; }
      if (form.destinations.length === 0) { setError("Please select at least one destination."); return; }
    }
    if (!isLogin && !form.email) { setError("Please fill in all required fields."); return; }
    const user = {
      id: 1, email: form.email,
      fullName: isLogin ? "Returning User" : form.fullName,
      role: form.role,
      photoUrl: form.photoPreview || null,
    };
    onSuccess(user);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900 p-4 py-12">
      <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">

        {/* Logo + title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-700 to-emerald-500 rounded-2xl text-white text-2xl font-black shadow-lg mb-4">X</div>
          <h1 className="text-2xl font-black text-blue-950">
            {isLogin ? "Welcome back" : step === 1 ? "Create account" : "Complete your guide profile"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Sign in to Xplorica LK" : step === 1 ? "Join Xplorica LK today" : "Tell travellers about yourself"}
          </p>
        </div>

        {stepIndicator}

        {/* Role selector — step 1 register only */}
        {!isLogin && step === 1 && (
          <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
            {["TOURIST", "GUIDE"].map(r => (
              <button key={r} type="button" onClick={() => set("role")(r)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${form.role === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {r === "TOURIST" ? "🌍 Tourist" : "🗺 Tour Guide"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">

          {/* ── STEP 1: Basic account info ── */}
          {(isLogin || step === 1) && (
            <>
              {!isLogin && <Input label="Full Name" value={form.fullName} onChange={set("fullName")} required placeholder="Your full name" />}
              <Input label="Email" type="email" value={form.email} onChange={set("email")} required placeholder="your@email.com" />
              <Input label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="Min. 6 characters" />
            </>
          )}

          {/* ── STEP 2: Guide profile fields ── */}
          {isGuideRegister && step === 2 && (
            <>
              {/* Photo upload */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.photoPreview
                      ? <img src={form.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      : <span className="text-3xl">📷</span>}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition">
                      <span>📂</span> Choose Photo
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">JPG, PNG or WEBP · Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Textarea label="About You" value={form.description} onChange={set("description")}
                placeholder="Describe your experience, specialities, and what makes your tours unique..." rows={3} />

              {/* License + Experience */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Licence Number" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="SLG-0000" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
                  <select value={form.yearsExperience} onChange={e => set("yearsExperience")(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8,9,"10+","15+","20+"].map(n => <option key={n} value={n}>{n} year{n === 1 ? "" : "s"}</option>)}
                  </select>
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Languages Spoken <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">({form.languages.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => toggle("languages", l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.languages.includes(l)
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105"
                          : "border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destinations */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Destinations You Offer <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">({form.destinations.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map(d => (
                    <button key={d} type="button" onClick={() => toggle("destinations", d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.destinations.includes(d)
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm scale-105"
                          : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700"}`}>
                      📍 {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            {isGuideRegister && step === 2 && (
              <Btn type="button" variant="outline" onClick={() => { setStep(1); setError(""); }}>← Back</Btn>
            )}
            <Btn full type="submit" variant="primary" size="lg">
              {isLogin ? "Sign In" :
               isGuideRegister && step === 1 ? "Next: Guide Profile →" :
               "Create Guide Account"}
            </Btn>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { onSwitch(); setStep(1); setError(""); }} className="text-blue-700 font-semibold hover:underline">
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
  const [form, setForm] = useState({
    description: "", licenseNumber: "", yearsExperience: "", photoUrl: "",
    languages: [], destinations: [],
  });
  const [saved, setSaved] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const toggleItem = (key, val) => setForm(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(i => i !== val) : [...p[key], val]
  }));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-blue-950">Guide Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user.fullName}</p>
        </div>
        <Badge color="amber">⏳ Pending Approval</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        {[["profile","Profile"], ["bookings","Bookings"], ["messages","Messages"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${tab === k ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl p-7 shadow-sm border border-slate-100 space-y-5">
            <h2 className="font-bold text-blue-950 text-lg">Profile Information</h2>
            <Textarea label="Description" value={form.description} onChange={set("description")}
              placeholder="Describe your experience and specialties..." rows={4} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="License Number" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="SLG-0000" />
              <Input label="Years of Experience" type="number" value={form.yearsExperience} onChange={set("yearsExperience")} placeholder="5" />
            </div>
            <Input label="Photo URL" value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://..." />
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => toggleItem("languages", l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.languages.includes(l) ? "bg-emerald-500 text-white border-emerald-500" : "border-slate-200 text-slate-600 hover:border-emerald-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Destinations</label>
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.map(d => (
                  <button key={d} onClick={() => toggleItem("destinations", d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.destinations.includes(d) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-400"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {saved && <p className="text-emerald-600 text-sm font-medium bg-emerald-50 rounded-xl px-4 py-2">✓ Profile saved successfully!</p>}
            <Btn variant="primary" full onClick={save}>Save Profile</Btn>
          </div>
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 flex items-center justify-center text-white text-3xl font-black mb-3">
                {user.fullName?.[0]}
              </div>
              <p className="font-bold text-blue-950">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
              <p className="text-amber-800 text-sm font-semibold mb-2">⏳ Awaiting Approval</p>
              <p className="text-amber-700 text-xs">Your profile is under review. You'll be notified once approved.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
          <h2 className="font-bold text-blue-950 text-lg mb-5">Your Bookings</h2>
          <div className="space-y-4">
            {[{ tourist: "Emma Rodriguez", date: "2026-06-15", people: 2, dest: "Sigiriya", status: "CONFIRMED", amount: 70 },
              { tourist: "James Wilson", date: "2026-06-22", people: 3, dest: "Kandy", status: "PENDING", amount: 105 }].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-blue-950">{b.tourist}</p>
                  <p className="text-sm text-slate-500">📅 {b.date} · 👥 {b.people} people · 📍 {b.dest}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-950">${b.amount}</p>
                  <Badge color={b.status === "CONFIRMED" ? "emerald" : "amber"}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
          <h2 className="font-bold text-blue-950 text-lg mb-5">Messages</h2>
          {[{ name: "Emma R.", msg: "What time do we start?", time: "2h ago" },
            { name: "James W.", msg: "Can we add Dambulla to the itinerary?", time: "Yesterday" }].map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition" onClick={() => onNav("chat", { id: i+10, fullName: m.name })}>
              <Avatar name={m.name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-950">{m.name}</p>
                <p className="text-sm text-slate-500 truncate">{m.msg}</p>
              </div>
              <span className="text-xs text-slate-400">{m.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chat Page ──────────────────────────────────────────────────────────────
function ChatPage({ user, guide, onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, from: "guide", text: "Hello! I'm excited to show you Sri Lanka. Do you have any specific interests?" },
    { id: 2, from: "tourist", text: "Hi! I love ancient temples and local food. Can you arrange both?" },
    { id: 3, from: "guide", text: "Absolutely! I'll plan a full day at Dambulla cave temples followed by a local rice & curry lunch." },
  ]);
  const [input, setInput] = useState("");
  const [locationShared, setLocationShared] = useState(false);
  const endRef = useRef(null);

  const send = () => {
    if (!input.trim()) return;
    setMessages(p => [...p, { id: Date.now(), from: "tourist", text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now() + 1, from: "guide", text: "Thanks for your message! I'll get back to you shortly." }]);
    }, 1200);
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition font-bold text-lg">←</button>
        <Avatar name={guide?.fullName || "Guide"} photo={guide?.photoUrl} size={44} />
        <div>
          <p className="font-bold text-blue-950">{guide?.fullName || "Your Guide"}</p>
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
            <p className="text-xs text-emerald-600">Your guide can see your current position</p>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ minHeight: 0 }}>
        {messages.map(m => {
          const isMe = m.from === "tourist";
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"} gap-3 items-end`}>
              {!isMe && <Avatar name={guide?.fullName || "G"} size={32} />}
              <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isMe ? "bg-blue-700 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"}`}>
                {m.text}
              </div>
              {isMe && <Avatar name={user?.fullName || "You"} size={32} />}
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type a message..."
              className="flex-1 text-sm focus:outline-none bg-transparent" />
          </div>
          <Btn variant="primary" onClick={send} disabled={!input.trim()}>
            Send →
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Payment Page ───────────────────────────────────────────────────────────
function PaymentPage({ booking, onBack, onComplete }) {
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [paid, setPaid] = useState(false);
  const set = k => v => setCard(p => ({ ...p, [k]: v }));

  const pay = (e) => {
    e.preventDefault();
    setPaid(true);
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
      <Btn full variant="primary" onClick={onBack}>Back to Guides</Btn>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-700 mb-8 text-sm font-medium transition">← Back</button>
      <h1 className="text-2xl font-black text-blue-950 mb-2">Secure Payment</h1>
      <p className="text-slate-500 text-sm mb-8">Complete your booking with {booking?.guide?.fullName || "your guide"}</p>

      {/* Order summary */}
      <div className="bg-slate-50 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-blue-950 mb-3">Booking Summary</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600"><span>Tour with {booking?.guide?.fullName || "guide"}</span><span>$35/person</span></div>
          <div className="flex justify-between text-slate-600"><span>× {booking?.people || 1} people</span><span>${(booking?.total || 35)}</span></div>
          <div className="flex justify-between font-bold text-blue-950 border-t pt-2 mt-2"><span>Total</span><span>${booking?.total || 35}</span></div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex gap-2 mb-6">
        {[["card","💳 Credit Card"], ["paypal","🔵 PayPal"], ["bank","🏦 Bank Transfer"]].map(([m, label]) => (
          <button key={m} onClick={() => setMethod(m)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition ${method === m ? "bg-blue-700 text-white border-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {method === "card" && (
        <form onSubmit={pay} className="space-y-4">
          <Input label="Card Number" value={card.number} onChange={set("number")} placeholder="1234 5678 9012 3456" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry" value={card.expiry} onChange={set("expiry")} placeholder="MM/YY" required />
            <Input label="CVV" value={card.cvv} onChange={set("cvv")} placeholder="123" required />
          </div>
          <Input label="Name on Card" value={card.name} onChange={set("name")} placeholder="Full name" required />
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <span>🔒</span> Your payment is encrypted and secure. SSL protected.
          </div>
          <Btn full type="submit" variant="emerald" size="lg">Pay ${booking?.total || 35} Now</Btn>
        </form>
      )}
      {method === "paypal" && (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-6">You'll be redirected to PayPal to complete payment.</p>
          <Btn full variant="primary" onClick={() => setPaid(true)}>Continue to PayPal →</Btn>
        </div>
      )}
      {method === "bank" && (
        <div className="bg-slate-50 rounded-2xl p-5 space-y-2 text-sm">
          <p className="font-bold text-blue-950 mb-3">Bank Transfer Details</p>
          <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-semibold">Commercial Bank of Ceylon</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-semibold">8001-2345-6789</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-semibold text-blue-600">XPL-{Date.now().toString().slice(-6)}</span></div>
          <Btn full variant="primary" className="mt-4" onClick={() => setPaid(true)}>I've Completed the Transfer</Btn>
        </div>
      )}
    </div>
  );
}

// ── Privacy Policy ─────────────────────────────────────────────────────────
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
        <button onClick={() => onNav("home")} className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow">X</div>
          <div>
            <p className="text-sm font-black text-blue-950 leading-none">Xplorica LK</p>
            <p className="text-xs text-emerald-700 leading-none">Explore Sri Lanka</p>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => onNav("browse")} className={`hover:text-blue-700 transition ${page==="browse"?"text-blue-700":""}`}>Find Guides</button>
          <button onClick={() => onNav("privacy")} className="hover:text-blue-700 transition">Privacy</button>
          {user?.role === "GUIDE" && <button onClick={() => onNav("dashboard")} className={`hover:text-blue-700 transition ${page==="dashboard"?"text-blue-700":""}`}>Dashboard</button>}
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
                <Btn variant="ghost" size="sm" onClick={() => onLogin("login")}>Sign in</Btn>
                <Btn variant="primary" size="sm" onClick={() => onLogin("register")}>Sign up</Btn>
              </>}
        </div>

        <button className="md:hidden text-xl text-slate-600" onClick={() => setMobileOpen(p => !p)}>☰</button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
          <button onClick={() => { onNav("browse"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">Find Guides</button>
          <button onClick={() => { onNav("privacy"); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-slate-700">Privacy Policy</button>
          {!user
            ? <><Btn full variant="outline" onClick={() => { onLogin("login"); setMobileOpen(false); }}>Sign in</Btn>
                <Btn full variant="primary" onClick={() => { onLogin("register"); setMobileOpen(false); }}>Sign up</Btn></>
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
          <h3 className="text-xl font-black text-white mb-3">Xplorica LK</h3>
          <p className="text-sm leading-relaxed">Connecting travellers with verified Sri Lankan local guides.</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Navigate</h4>
          <div className="space-y-2 text-sm">
            <button onClick={() => onNav("browse")} className="block hover:text-white transition">Find Guides</button>
            <button onClick={() => onNav("home")} className="block hover:text-white transition">Home</button>
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
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);     // "login" | "register"
  const [defaultRole, setDefaultRole] = useState("TOURIST");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  const nav = (p, data) => {
    setPage(p);
    if (p === "guide") setSelectedGuide(data);
    if (p === "chat") setChatPartner(data);
  };

  const login = (mode, role) => { setAuthMode(mode); setDefaultRole(role || "TOURIST"); setPage("auth"); };
  const logout = () => { setUser(null); setPage("home"); };

  const authSuccess = (u) => {
    setUser(u);
    setAuthMode(null);
    setPage(u.role === "GUIDE" ? "dashboard" : "home");
  };

  const needsAuth = (action) => {
    if (!user) { login("login"); return false; }
    action();
    return true;
  };

  const showFooter = !["auth", "chat", "payment"].includes(page);
  const showNav = page !== "auth";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {showNav && (
        <Navbar user={user} page={page} onNav={nav}
          onLogin={login} onLogout={logout} />
      )}

      <div className={showNav ? "pt-16" : ""}>
        <AnimatePresence mode="wait">
          {page === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthPage mode={authMode} defaultRole={defaultRole}
                onSuccess={authSuccess}
                onSwitch={() => setAuthMode(m => m === "login" ? "register" : "login")} />
            </motion.div>
          )}

          {page === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage onNav={nav} onLogin={login}
                onRegister={(role) => { setDefaultRole(role); login("register"); }} />
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
                onBook={(b) => { if (!user) { login("login"); return; } setPendingBooking(b); nav("payment"); }} />
            </motion.div>
          )}

          {page === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatPage user={user} guide={chatPartner}
                onBack={() => nav(selectedGuide ? "guide" : "browse")} />
            </motion.div>
          )}

          {page === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentPage booking={pendingBooking}
                onBack={() => nav("browse")}
                onComplete={() => { setPendingBooking(null); nav("browse"); }} />
            </motion.div>
          )}

          {page === "dashboard" && user?.role === "GUIDE" && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GuideDashboard user={user} onNav={nav} />
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