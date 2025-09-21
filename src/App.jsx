import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import portrait from './assets/portrait.jpg';
import spectacleMain from './assets/spectacle-main.jpg';

// Galerie "spectacles" (home)
const spectacleModules = import.meta.glob('./assets/spectacles/*.{jpg,jpeg,png}', { eager: true });
const spectacleImages = Object.entries(spectacleModules).map(([path, mod]) => {
  const file = path.split('/').pop();
  const base = file.split('.')[0];
  return { src: typeof mod === 'string' ? mod : mod?.default, name: base };
});

// AFFICHES (servira pour “/affiches” ET pour “prochain spectacle” dans le hero)
const postersModules = import.meta.glob('./assets/spectacle/affiches/*.{jpg,jpeg,png}', { eager: true });

/* --------- util date depuis nom de fichier ---------
   Accepte:
   - 2025-12-05_titre.jpg
   - 05-12-2025_titre.jpg
   Renvoie { date, title }
----------------------------------------------------*/
function parseFromFilename(fileBase) {
  // YYYY-MM-DD
  let m = fileBase.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})(?:[-_.](.*))?$/);
  if (m) {
    const date = new Date(`${m[1]}-${m[2]}-${m[3]}`);
    const title = (m[4] || '').replace(/[-_.]/g, ' ').trim();
    return { date: isNaN(date) ? null : date, title };
  }
  // DD-MM-YYYY
  m = fileBase.match(/^(\d{2})[-_.](\d{2})[-_.](\d{4})(?:[-_.](.*))?$/);
  if (m) {
    const date = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    const title = (m[4] || '').replace(/[-_.]/g, ' ').trim();
    return { date: isNaN(date) ? null : date, title };
  }
  return { date: null, title: '' };
}

function formatDateFR(date) {
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* =========
   Home Page
   ========= */
function Home() {
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const [currentDoc, setCurrentDoc] = useState(null);

  // Construire la liste des affiches pour trouver le “prochain”
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const posters = Object.entries(postersModules).map(([path, mod]) => {
    const file = path.split('/').pop();                 // ex: 2025-12-05_mon-event.png
    const base = file.replace(/\.(jpg|jpeg|png)$/i, '');
    const { date, title } = parseFromFilename(base);
    const src = typeof mod === 'string' ? mod : mod?.default;
    return { src, date, title };
  }).filter(p => p.date);

  const nextPoster = posters
    .filter(p => p.date >= today)
    .sort((a, b) => a.date - b.date)[0] || null;

  function showDescription(name, index) {
    setCurrentDoc(null);
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideToLoop(index, 400, false);
      swiperRef.current.swiper.autoplay.stop();
    }
    const pdfUrl = `/spectacle_descriptions/${name}.pdf`;
    const docxUrl = `/spectacle_descriptions/${name}.docx`;

    fetch(pdfUrl, { method: 'HEAD' }).then(res => {
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
    if (swiperRef.current?.swiper) {
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

      {/* SPECTACLES : image principale = prochain spectacle si dispo */}
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

      {/* GALERIE (optionnel) */}
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
  function parseDateFromName(base) {
    return parseFromFilename(base).date;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

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

export default function RootApp() {
  // Mot de passe : si tu as gardé la gate, conserve ton code précédent.
  // Ici on affiche directement le site (tu peux remettre la gate si besoin).
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/affiches" element={<PostersPage/>} />
      </Routes>
    </Router>
  );
}
