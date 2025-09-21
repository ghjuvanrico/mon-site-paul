import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

import portrait from './assets/portrait.jpg';
import spectacleMain from './assets/spectacle-main.jpg';

// Affiches pour l'image principale (prend la plus proche dans le futur si dispo)
const postersModules = import.meta.glob('./assets/spectacle/affiches/*.{jpg,jpeg,png}', { eager: true });

function parseFromFilename(fileBase) {
  let m = fileBase.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})(?:[-_.](.*))?$/);
  if (m) return { date: new Date(`${m[1]}-${m[2]}-${m[3]}`) };
  m = fileBase.match(/^(\d{2})[-_.](\d{2})[-_.](\d{4})(?:[-_.](.*))?$/);
  if (m) return { date: new Date(`${m[3]}-${m[2]}-${m[1]}`) };
  return { date: null };
}

/* =========
   Accueil
   ========= */
function Home() {
  const navigate = useNavigate();

  // choisit une affiche future pour l’image principale (sinon fallback)
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const nextPoster = useMemo(() => {
    const posters = Object.entries(postersModules).map(([p, mod]) => {
      const file = p.split('/').pop();
      const base = file.replace(/\.(jpg|jpeg|png)$/i,'');
      const { date } = parseFromFilename(base);
      const src = typeof mod === 'string' ? mod : mod?.default;
      return { src, date };
    }).filter(p => p.date && !isNaN(p.date));
    const future = posters.filter(p => p.date >= today).sort((a,b)=>a.date-b.date);
    return future[0] || null;
  }, [today]);

  return (
    <>
      {/* NAVBAR : les liens #… scrollent vers les sections */}
      <nav className="navbar">
        <div className="nav-left">L’amitié des veillées</div>
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

      {/* SPECTACLES */}
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
            <button className="main-spectacle-btn" onClick={() => navigate('/affiches')}>
              Nos prochains spectacles
            </button>
          </div>
        </div>
      </section>

      {/* ANIMATIONS */}
      <section id="animations" className="section">
        <h2>Animations forestières</h2>
        <p>À venir...</p>
      </section>

      {/* CONTACT (formulaire simple, sans envoi serveur) */}
      <ContactSection />
    </>
  );
}

/* =================
   Page : AFFICHES
   ================= */
function PostersPage() {
  const today = new Date(); today.setHours(0,0,0,0);

  const posters = Object.entries(postersModules).map(([path, mod]) => {
    const file = path.split('/').pop();
    const base = file.replace(/\.(jpg|jpeg|png)$/i, '');
    const { date } = parseFromFilename(base);
    const src = typeof mod === 'string' ? mod : mod?.default;
    const isPast = !!date && date < today;
    return { src, date, isPast };
  })
  .filter(p => p.date)
  .sort((a, b) => b.date - a.date);

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

        {posters.length === 0 && (
          <p style={{ opacity: 0.9, fontStyle: 'italic' }}>
            Aucun spectacle pour le moment
          </p>
        )}

        <div className="poster-list">
          {posters.map((p, i) => (
            <div className={`poster-item ${p.isPast ? 'past' : 'future'}`} key={i}>
              <img src={p.src} alt={`Affiche ${i + 1}`} />
              {p.isPast && <div className="poster-badge">Date passée</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ================
   Contact Section
   ================ */
function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState({ ok: null, msg: '' });

  function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setState({ ok: false, msg: 'Merci de compléter tous les champs.' });
      return;
    }
    // Pas d’envoi pour l’instant : on affiche juste une confirmation locale
    setState({ ok: true, msg: 'Merci ! Votre message a bien été saisi.' });
    // Optionnel: vider le formulaire
    setForm({ name: '', email: '', message: '' });
  }

  return (
    <section id="contact" className="section contact-section">
      <h2>Contact</h2>

      <form className="contact-card" onSubmit={onSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="name">Nom / Prénom</label>
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
          <label htmlFor="email">E-mail</label>
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
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            placeholder="Votre message…"
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>

        <button className="send-btn" type="submit">
          Envoyer
        </button>

        {state.ok === true && <div className="form-msg ok">{state.msg}</div>}
        {state.ok === false && <div className="form-msg err">{state.msg}</div>}
      </form>
    </section>
  );
}

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
