import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import portrait from './assets/portrait.jpg';
import spectacleMain from './assets/spectacle-main.jpg';

/* =======================
   Password Gate (client)
   ======================= */

const FALLBACK_PASSWORD = 'mon-mdp-ici'; // ← change-moi si tu veux un mdp en dur
const ENV_PASSWORD = import.meta.env.VITE_SITE_PASSWORD; // ← ou mets VITE_SITE_PASSWORD=xxx dans .env

function PasswordGate({ onUnlock }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const realPassword = (ENV_PASSWORD && String(ENV_PASSWORD)) || FALLBACK_PASSWORD;

  function tryUnlock() {
    if (!pwd) {
      setError('Veuillez saisir le mot de passe.');
      return;
    }
    if (pwd === realPassword) {
      sessionStorage.setItem('site_authed', '1');
      onUnlock();
    } else {
      setError('Mot de passe incorrect.');
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') tryUnlock();
  }

  return (
    <div className="gate-overlay">
      <div className="gate-modal" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <h2 id="gate-title">Accès protégé</h2>
        <p className="gate-subtitle">Entrez le mot de passe pour accéder au site.</p>

        <div className="gate-input-row">
          <input
            type={show ? 'text' : 'password'}
            className="gate-input"
            placeholder="Mot de passe"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
          <button
            type="button"
            className="gate-toggle"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <div className="gate-error">{error}</div>}

        <button type="button" className="gate-submit" onClick={tryUnlock}>
          Entrer
        </button>

        <div className="gate-hint">
          Astuce : définis <code>VITE_SITE_PASSWORD</code> dans un fichier <code>.env</code> à la racine.
        </div>
      </div>
    </div>
  );
}

function usePasswordGate() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const ok = sessionStorage.getItem('site_authed') === '1';
    setAuthed(ok);
  }, []);

  return { authed, unlock: () => setAuthed(true) };
}

/* ==============
   Données médias
   ============== */

// Galerie "spectacles" (carrousel facultatif de la home)
const spectacleModules = import.meta.glob('./assets/spectacles/*.{jpg,jpeg,png}', { eager: true });
const spectacleImages = Object.entries(spectacleModules).map(([path, mod]) => {
  const parts = path.split('/');
  const file = parts[parts.length - 1];
  const base = file.split('.')[0];
  return {
    src: typeof mod === 'string' ? mod : mod?.default,
    name: base,
  };
});

// AFFICHES : dans src/assets/spectacle/affiches
const postersModules = import.meta.glob('./assets/spectacle/affiches/*.{jpg,jpeg,png}', { eager: true });

/* =========
   Home Page
   ========= */

function Home() {
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const [currentDoc, setCurrentDoc] = useState(null);

  function showDescription(name, index) {
    setCurrentDoc(null);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideToLoop(index, 400, false);
      swiperRef.current.swiper.autoplay.stop();
    }
    const pdfUrl = `/spectacle_descriptions/${name}.pdf`;
    const docxUrl = `/spectacle_descriptions/${name}.docx`;

    fetch(pdfUrl, { method: 'HEAD' })
      .then(res => {
        if (res.ok) setCurrentDoc({ type: 'pdf', url: pdfUrl });
        else {
          fetch(docxUrl, { method: 'HEAD' }).then(res2 => {
            if (res2.ok) setCurrentDoc({ type: 'docx', url: docxUrl });
            else setCurrentDoc({ type: 'none' });
          });
        }
      });
  }

  function closeDescription() {
    setCurrentDoc(null);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.start();
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">L’amitié des veillées</div>
        <ul className="nav-right">
          <li><a href="#accueil">Accueil</a></li>
          <li><a href="#spectacles">Spectacles</a></li>
          <li><a href="#animations">Animations forestières</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <section id="accueil" className="section accueil">
        <img src={portrait} alt="Portrait" className="portrait" />
        <div className="content">
          <h1>Paul Roy</h1>
          <p>Forestier Musicien Conteur</p>
          <span className="note">(Site en construction)</span>
        </div>
      </section>

      {/* SPECTACLES : image gauche + texte + bouton */}
      <section id="spectacles" className="section section-spectacle-hero">
        <div className="spectacle-hero">
          <img src={spectacleMain} alt="Spectacle" className="spectacle-hero-img" />
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

      {/* GALERIE carrousel de la home (optionnel) */}
      <section className="section">
        <h2>Galerie spectacles</h2>
        <div className="carousel-wrapper">
          <Swiper
            modules={[Pagination, Autoplay]}
            ref={swiperRef}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            spaceBetween={36}
            className="mySwiper"
          >
            {spectacleImages.map(({ src, name }, index) => (
              <SwiperSlide key={index} className="peek-slide">
                <div className="slide-img-wrapper">
                  <img src={src} alt={`Spectacle ${index + 1}`} />
                  <button className="more-button" onClick={() => showDescription(name, index)}>
                    En savoir plus
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {currentDoc && (
          <div className="veillee-description noselect">
            <button className="close-desc" onClick={closeDescription} aria-label="Fermer">×</button>
            {currentDoc.type === 'pdf' && (
              <iframe
                src={currentDoc.url}
                title="Description PDF"
                className="veillee-pdf-iframe"
                allow="clipboard-write"
              ></iframe>
            )}
            {currentDoc.type === 'docx' && (
              <div className="desc-word">
                <p>
                  <b>Description Word :</b><br />
                  <a href={currentDoc.url} target="_blank" rel="noopener noreferrer">
                    Télécharger / Ouvrir dans Word
                  </a>
                </p>
              </div>
            )}
            {currentDoc.type === 'none' && (
              <div className="desc-missing"><em>Description indisponible.</em></div>
            )}
          </div>
        )}
      </section>

      <section id="contact" className="section">
        <h2>Contact</h2>
        <p>Formulaire ici...</p>
      </section>
    </>
  );
}

/* =================
   Page : AFFICHES
   ================= */
function PostersPage() {
  // parse YYYY-MM-DD or DD-MM-YYYY
  function parseDateFromName(base) {
    const m1 = base.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})/);
    if (m1) return new Date(`${m1[1]}-${m1[2]}-${m1[3]}`);
    const m2 = base.match(/^(\d{2})[-_.](\d{2})[-_.](\d{4})/);
    if (m2) return new Date(`${m2[3]}-${m2[2]}-${m2[1]}`);
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const posters = Object.entries(postersModules).map(([path, mod]) => {
    const file = path.split('/').pop();
    const base = file.replace(/\.(jpg|jpeg|png)$/i, '');
    const date = parseDateFromName(base);
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

/* ==========================
   App racine + PasswordGate
   ========================== */
export default function RootApp() {
  const { authed, unlock } = usePasswordGate();

  if (!authed) {
    return <PasswordGate onUnlock={unlock} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/affiches" element={<PostersPage/>} />
      </Routes>
    </Router>
  );
}
