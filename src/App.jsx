import React, { useMemo, useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import portrait from "./assets/portrait.jpg";
import spectacleMain from "./assets/spectacle-main.jpg";

/* ===== Import images d’affiches ===== */
const imageModules = import.meta.glob(
  "./assets/spectacle/affiches/*.{png,jpg,jpeg}",
  { eager: true }
);

/* ===== Import documents liés (en URL) ===== */
const docModulesSameDir = import.meta.glob(
  "./assets/spectacle/affiches/*.{pdf,odt,docx,txt}",
  { eager: true, as: "url" }
);
const docModulesSubDir = import.meta.glob(
  "./assets/spectacle/affiches/details/*.{pdf,odt,docx,txt}",
  { eager: true, as: "url" }
);

/* ===== Helpers ===== */
function parseDateFromFilename(base) {
  let m = base.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}`);
  m = base.match(/^(\d{2})[-_.](\d{2})[-_.](\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}
function stripExt(filename) {
  return filename.replace(/\.(png|jpe?g|pdf|odt|docx|txt)$/i, "");
}
function toUrl(mod) {
  return typeof mod === "string" ? mod : mod?.default;
}

/* Liste des affiches triées */
const AFFICHES = Object.entries(imageModules)
  .map(([path, mod]) => {
    const file = path.split("/").pop() || "";
    const base = stripExt(file);
    const date = parseDateFromFilename(base);
    const title = base
      .replace(/^\d{2,4}[-_.]\d{2}[-_.]\d{2,4}[-_.]?/, "")
      .replace(/[-_.]/g, " ")
      .trim();
    const src = toUrl(mod);
    return { src, date, title, base };
  })
  .filter((a) => a.date && !isNaN(a.date))
  .sort((a, b) => b.date - a.date);

/* Map base -> meilleur doc */
const DOC_PRIORITY = ["pdf", "odt", "docx", "txt"];
function buildDocsMap() {
  const all = { ...docModulesSameDir, ...docModulesSubDir };
  const byBase = new Map();
  Object.entries(all).forEach(([path, url]) => {
    const file = path.split("/").pop() || "";
    const base = stripExt(file);
    const ext = (file.split(".").pop() || "").toLowerCase();
    const existing = byBase.get(base) || {};
    existing[ext] = url;
    byBase.set(base, existing);
  });
  const best = new Map();
  for (const [base, obj] of byBase.entries()) {
    for (const ext of DOC_PRIORITY) {
      if (obj[ext]) { best.set(base, { url: obj[ext], ext }); break; }
    }
  }
  return best;
}
const DOCS_MAP = buildDocsMap();

/* =========================
   Navbar (réutilisable)
   ========================= */
function Navbar({ variant = "home" }) {
  const [open, setOpen] = useState(false);

  // Fermer avec Echap
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Empêche le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ferme au resize si on repasse en desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 860 && open) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const linksHome = (
    <>
      <li><a onClick={() => setOpen(false)} href="#accueil">Accueil</a></li>
      <li><a onClick={() => setOpen(false)} href="#spectacles">Spectacles</a></li>
      <li><a onClick={() => setOpen(false)} href="#animations">Animations forestières</a></li>
      <li><a onClick={() => setOpen(false)} href="#contact">Contact</a></li>
    </>
  );

  const linksPosters = (
    <>
      <li><Link onClick={() => setOpen(false)} to="/">Accueil</Link></li>
      <li><a onClick={() => setOpen(false)} href="/#spectacles">Spectacles</a></li>
      <li><a onClick={() => setOpen(false)} href="/#animations">Animations forestières</a></li>
      <li><a onClick={() => setOpen(false)} href="/#contact">Contact</a></li>
    </>
  );

  return (
    <>
      <nav className={`navbar ${open ? "is-open" : ""}`}>
        <div className="nav-left">L’amitié des veillées</div>

        <ul className="nav-right desktop-menu">
          {variant === "home" ? linksHome : linksPosters}
        </ul>

        {/* Burger */}
        <button
          className={`burger ${open ? "open" : ""}`}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </nav>

      {/* Menu mobile plein écran */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${open ? "show" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileMenuTitle"
        onClick={() => setOpen(false)}
      >
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-menu-header">
            <div id="mobileMenuTitle" className="mobile-title">Menu</div>
            <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          </div>
          <ul className="mobile-links">
            {variant === "home" ? linksHome : linksPosters}
          </ul>
        </div>
      </div>
    </>
  );
}

/* =========================
   Accueil / Home
   ========================= */
function Home() {
  const navigate = useNavigate();
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const nextPoster = useMemo(() => {
    const future = AFFICHES.filter(a => a.date >= today).sort((a,b)=>a.date-b.date);
    return future[0] || null;
  }, [today]);

  return (
    <div className="app">
      <Navbar variant="home" />

      <section id="accueil" className="section accueil">
        <img src={portrait} alt="Portrait" className="portrait" />
        <div className="content">
          <h1>Paul Roy</h1>
          <p>Forestier Musicien Conteur</p>
          <span className="note">(Site en construction)</span>
        </div>
      </section>

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
            <button className="main-spectacle-btn" onClick={() => navigate("/affiches")}>
              Nos prochains spectacles
            </button>
          </div>
        </div>
      </section>

      <section id="animations" className="section">
        <h2>Animations forestières</h2>
        <p>À venir…</p>
      </section>

      <ContactSection />
    </div>
  );
}

/* =========================
   Page /affiches
   ========================= */
function PostersPage() {
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [docViewer, setDocViewer] = useState(null); // { url, ext, title }
  const [docText, setDocText] = useState("");
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Charger TXT si besoin
  useEffect(() => {
    if (docViewer?.ext === "txt" && docViewer?.url) {
      fetch(docViewer.url)
        .then(r => r.ok ? r.text() : Promise.reject(new Error("load txt")))
        .then(setDocText)
        .catch(() => setDocText("Impossible de charger le texte."));
    } else {
      setDocText("");
    }
  }, [docViewer]);

  function openDetails(base, title) {
    const found = DOCS_MAP.get(base);
    if (!found) return;
    setDocViewer({ url: found.url, ext: found.ext, title: title || base });
  }

  return (
    <>
      <Navbar variant="posters" />

      <section className="section posters-page">
        <h2>Affiches (du plus récent au plus ancien)</h2>

        {AFFICHES.length === 0 && (
          <p style={{ opacity: 0.9, fontStyle: "italic" }}>Aucun spectacle pour le moment</p>
        )}

        <div className="poster-list">
          {AFFICHES.map((p, i) => {
            const isPast = p.date < today;
            const doc = DOCS_MAP.get(p.base) || null;

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

                <div className="poster-actions" onClick={(e)=>e.stopPropagation()}>
                  {doc ? (
                    <button
                      className="poster-details-btn"
                      onClick={() => openDetails(p.base, p.title)}
                      title="Voir les détails"
                    >
                      Détails
                    </button>
                  ) : (
                    <button className="poster-details-btn disabled" disabled>
                      Détails
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lightbox image */}
        {selectedPoster && (
          <div className="lightbox" onClick={() => setSelectedPoster(null)}>
            <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
              <img src={selectedPoster} alt="Affiche en grand" />
              <button className="lightbox-close" onClick={() => setSelectedPoster(null)}>✕</button>
            </div>
          </div>
        )}

        {/* Lightbox document */}
        {docViewer && (
          <div className="docbox" onClick={() => setDocViewer(null)}>
            <div className="docbox-content" onClick={(e)=>e.stopPropagation()}>
              <div className="docbox-header">
                <div className="docbox-title">{docViewer.title || "Détails"}</div>
                <button className="docbox-close" onClick={() => setDocViewer(null)}>✕</button>
              </div>

              <div className="docbox-body">
                {docViewer.ext === "pdf" && (
                  <iframe className="doc-frame" src={docViewer.url} title="Détails PDF" />
                )}
                {docViewer.ext === "txt" && (
                  <pre className="doc-text">{docText}</pre>
                )}
                {(docViewer.ext === "docx" || docViewer.ext === "odt") && (
                  <div className="doc-fallback">
                    <p>
                      Ce fichier <b>{docViewer.ext.toUpperCase()}</b> ne peut pas être affiché directement dans le navigateur.
                      Ajoute une version <b>PDF</b> avec le même nom pour un affichage intégré.
                    </p>
                    <a className="doc-open-link" href={docViewer.url} target="_blank" rel="noopener">
                      Ouvrir dans un onglet
                    </a>
                  </div>
                )}
              </div>
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
  const [hp, setHp] = useState(""); // honeypot
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
   Root
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
