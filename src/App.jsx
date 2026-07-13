import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Catalogue from './pages/Catalogue.jsx';
import Heritage from './pages/Heritage.jsx';
import Reserve from './pages/Reserve.jsx';
import Contact from './pages/Contact.jsx';
import Studio from './pages/Studio.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      className="page-transition-wrap"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.22, 0.9, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <div className="util-bar">
        Shipping to Europe · <strong>Series I–III: 925 sterling silver</strong> · Numbered, limited editions
      </div>
      <Header />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/catalogue" element={<AnimatedPage><Catalogue /></AnimatedPage>} />
            <Route path="/heritage" element={<AnimatedPage><Heritage /></AnimatedPage>} />
            <Route path="/reserve" element={<AnimatedPage><Reserve /></AnimatedPage>} />
            <Route path="/contact" element={<AnimatedPage><Contact /></AnimatedPage>} />
            <Route path="/studio" element={<AnimatedPage><Studio /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
      <section className="cta-band">
        <div className="wrap">
          <div className="eyebrow">Series I — 50 Sets Only</div>
          <h2 style={{ marginTop: 14 }}>Fifty sets. Each one numbered.</h2>
          <p>Reserve now to hold your place before the series closes — no payment today.</p>
          <a href="/reserve" className="btn-primary" style={{ display: 'inline-block', marginTop: 28 }}>Reserve your set</a>
        </div>
      </section>
      <Footer />
    </>
  );
}
