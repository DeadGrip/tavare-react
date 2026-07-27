import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.js';

const JewelSVG = () => (
  <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <path className="jewel-stroke" d="M30 8 C16 20 16 44 30 54 C44 44 44 20 30 8 Z" />
    <circle className="jewel-fill" cx="30" cy="30" r="3.5" />
  </svg>
);

const BUILT_IN = {
  id: 'builtin-01',
  number: '01',
  title: 'The Convertible Set',
  story: 'Two earrings, one chain, one connector — the design this whole series is built around. Worn earrings, necklace, layered, or bracelet.',
  price: 169,
  image_url: '',
};

export default function Catalogue() {
  const [designs, setDesigns] = useState([BUILT_IN]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('designs').select('*').order('number');
      if (!cancelled && !error && data) setDesigns([BUILT_IN, ...data]);
    })();
    return () => { cancelled = true; };
  }, []);

  const closePlate = () => setOpenIndex(null);
  const navPlate = (dir) => setOpenIndex((i) => (i + dir + designs.length) % designs.length);

  useEffect(() => {
    function onKey(e) {
      if (openIndex === null) return;
      if (e.key === 'Escape') closePlate();
      if (e.key === 'ArrowRight') navPlate(1);
      if (e.key === 'ArrowLeft') navPlate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, designs.length]);

  const active = openIndex !== null ? designs[openIndex] : null;

  return (
    <div className="wrap">
      <div className="section-head">
        <div className="eyebrow">The Catalogue</div>
        <h2>Every design, numbered</h2>
        <p style={{ marginTop: 14 }}>Click a plate to open it — like flipping through the workshop's own photography book.</p>
      </div>

      <div className="cat-grid">
        {designs.map((d, i) => (
          <motion.div
            className="cat-card" key={d.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            onClick={() => setOpenIndex(i)}
          >
            <div className="cat-thumb">
              {d.image_url ? <img src={d.image_url} alt="" /> : (
                <>
                  <JewelSVG />
                  <div className="no-photo">Plate awaiting development</div>
                </>
              )}
            </div>
            <div className="cat-info">
              <div className="no">Design No. {d.number || '—'}</div>
              <h3>{d.title}</h3>
              {d.price && <div className="price">From €{d.price}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="plate-overlay open"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePlate}
          >
            <motion.div
              className="plate-frame"
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="plate-close" onClick={closePlate}>&times;</button>
              <div className="plate-stage">
                <motion.div
                  key={active.id}
                  className="plate-iris open"
                  initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                  animate={{ clipPath: 'circle(75% at 50% 50%)' }}
                  transition={{ duration: 0.8, ease: [0.65, 0, 0.2, 1] }}
                >
                  {active.image_url ? <img src={active.image_url} alt="" /> : <JewelSVG />}
                </motion.div>
                <div className="plate-vignette" />
              </div>
              <div className="plate-caption">
                <div className="plate-no">Plate No. {active.number || '—'}</div>
                <h3>{active.title}</h3>
                <p>{active.story || 'Photography and story for this design are coming soon.'}</p>
                {active.price && <div className="price-row">Series I price: €{active.price} · numbered, limited edition</div>}
              </div>
              <div className="plate-nav">
                <button onClick={() => navPlate(-1)}>&larr; Previous</button>
                <button onClick={() => navPlate(1)}>Next &rarr;</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
