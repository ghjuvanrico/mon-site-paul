import React, { useMemo, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import portrait from "./assets/portrait.jpg";
import spectacleMain from "./assets/spectacle-main.jpg";

/* ====== Import dynamique des affiches (src/assets/spectacle/affiches) ====== */
const afficheModules = import.meta.glob(
  "./assets/spectacle/affiches/*.{png,jpg,jpeg}",
  { eager: true }
);

function parseDateFromFilename(base) {
  // YYYY-MM-DD
  let m = base.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}`);
  // DD-MM-YYYY
  m = base.match(/^(\d{2})[-_.](\d{2})[-_.](\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}

const AFFICHES = Object.entries(afficheModules)
  .map(([path, mod]) => {
    const file = path.split("/").pop() || "";
    const base = file.replace(/\.(png|jpe?g)$/i, "");
    const date = parseDateFromFilename(base);
    const title = base.replace(/^\d{2,4}[-_.]\d{2}[-_.]\d{2,4}[-_.]?/, "").replace(/[-_.]/g, " ").trim();
    const src = typeof mod === "string" ? mod : mod?.default;
    return { src, date, title };
  })
  .filter(a => a.date && !isNaN(a.date))
  .sort((a, b) => b.date - a.date);

/* =========================
   Page d'accueil (Home)
   ========================= */
function Home() {
  const navigate = useNavigate();

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const nextPoster = useMemo(() => {
    const future = AFFICHES.filter(a => a.date >= today).sort((a,b)=>a.date-b.date);
    return future[0] || null;
  }, [today]);

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">L’amitié des veillades</div>
        <ul className="nav-right">
          <li><a href="#accueil">Accueil</a></li>
          <li><a href="#spectacles">Spectacles</a></li>
          <li><a href="#animations">Animations forestières</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* ACCUEIL */}
      <section id="accueil" className="section accueil">
        <img src={portrait} alt="Portrait" className="portrait" />
        <div className="content">
          <h1>Paul Roy</h1>
          <p>Forestier Musicien Conteur</p>
          <span className="note">(Site en construction)</span>
        </div>
      </section>

      {/* SPECTACLES – Hero */}
      <section id="spectacles" className="section section-spectacle-hero">
        <div className="spectacle-hero">
          <div className="spectacle-hero-img-wrap">
            <img
              src={nextPoster?.src || spectacleMain}
              alt="Spectacle"
              className="spectacle-hero-img"
            />
          </div>

          <div className="spectacle-hero-content">
            <h2>Spectacles</h2>
            <p>
              Bienvenue dans l’univers de Paul Roy.<br />
              Découvrez des spectacles vivants, contés et musicaux, inspirés par la forêt, la tradition et l’amitié des veillées.
            </p>
            {/* ➜ Change de page vers /affiches */}
            <button className="main-spectacle-btn" onClick={() => navigate("/affiches")}>
              Nos prochains spectacles
            </button>
          </div>
        </div>
      </section>

      {/* ANIMATIONS */}
      <section id="animations" className="section">
        <h2>Animations forestières</h2>
        <p>À venir…</p>
      </section>

      {/* CONTACT */}
      <ContactSection />
    </div>
  );
}

/* =========================
   Page /affiches
   ========================= */
function PostersPage() {
  const [selectedPoster, setSelectedPoster] = useState(null);
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">L’amitié des veillées</div>
        <ul className="nav-right">
          <li><Link to="/">Accueil</Link></li>
          <li><a href="/#spectacles">Spectacles</a></li>
          <li><a href="/#animations">Animations forestières</a></li>
          <li><a href="/#contact">Contact</a></li>
        </ul>
      </nav>

      <section className="section posters-page">
        <h2>Affiches (du plus récent au plus ancien)</h2>

        {AFFICHES.length === 0 && (
          <p style={{ opacity: 0.9, fontStyle: "italic" }}>Aucun spectacle pour le moment</p>
        )}

        <div className="poster-list">
          {AFFICHES.map((p, i) => {
            const isPast = p.date < today;
            return (
              <div
                key={i}
                className={`poster-item ${isPast ? "past" : "future"}`}
                onClick={() => setSelectedPoster(p.src)}
                role="button"
                title="Clique pour agrandir"
              >
                <img src={p.src} alt={p.title || `Affiche ${i + 1}`} />
                {isPast && <div className="poster-badge">Date passée</div>}
              </div>
            );
          })}
        </div>

        {/* Lightbox plus petite (pas de scroll) */}
        {selectedPoster && (
          <div className="lightbox" onClick={() => setSelectedPoster(null)}>
            <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
              <img src={selectedPoster} alt="Affiche en grand" />
              <button className="lightbox-close" onClick={() => setSelectedPoster(null)}>✕</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/* =========================
   Section Contact
   ========================= */
function ContactSection() {
  // anti-bot
  const [hp, setHp] = useState(""); // honeypot (reste vide)
  const [a] = useState(() => Math.floor(2 + Math.random() * 7));
  const [b] = useState(() => Math.floor(2 + Math.random() * 7));
  const [answer, setAnswer] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState({ sending: false, ok: null, msg: "" });

  async function onSubmit(e) {
    e.preventDefault();

    if (hp) { setState({ sending: false, ok: false, msg: "Échec validation anti-bot." }); return; }
    if (Number(answer) !== a + b) { setState({ sending: false, ok: false, msg: "Réponse anti-bot incorrecte." }); return; }
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setState({ sending: false, ok: false, msg: "Merci de compléter les champs obligatoires." }); return;
    }

    try {
      setState({ sending: true, ok: null, msg: "" });
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          antibot: { a, b, answer },
          hp,
        }),
      });
      const data = await res.json().catch(()=>({}));
      if (res.ok && data?.ok) {
        setState({ sending: false, ok: true, msg: "Message envoyé. Merci !" });
        setForm({ name: "", email: "", phone: "", message: "" });
        setAnswer("");
      } else {
        setState({ sending: false, ok: false, msg: data?.error || "Erreur lors de l’envoi." });
      }
    } catch {
      setState({ sending: false, ok: false, msg: "Erreur réseau." });
    }
  }

  return (
    <section id="contact" className="section contact-section">
      <h2>Contact</h2>

      <form className="contact-card" onSubmit={onSubmit} noValidate>
        {/* honeypot (caché) */}
        <input
          type="text"
          className="hp-field"
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="form-row">
          <label htmlFor="name">Nom / Prénom *</label>
          <input
            id="name"
            type="text"
            placeholder="Votre nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="email">E-mail *</label>
          <input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="phone">Téléphone</label>
          <input
            id="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            inputMode="tel"
          />
        </div>

        <div className="form-row">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            placeholder="Votre message…"
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>

        <div className="form-row antibot-row">
          <label htmlFor="antibot">Anti-bot : {a} + {b} = ? *</label>
          <input
            id="antibot"
            type="number"
            inputMode="numeric"
            placeholder="Votre réponse"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
        </div>

        <button className="send-btn" type="submit" disabled={state.sending}>
          {state.sending ? "Envoi…" : "Envoyer"}
        </button>

        {state.ok === true && <div className="form-msg ok">{state.msg}</div>}
        {state.ok === false && <div className="form-msg err">{state.msg}</div>}
      </form>
    </section>
  );
}

/* =========================
   Root (routes)
   ========================= */
export default function RootApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/affiches" element={<PostersPage/>} />
      </Routes>
    </Router>
  );
}
