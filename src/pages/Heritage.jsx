import { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary.jsx';

const BrassSeal3D = lazy(() => import('../components/BrassSeal3D.jsx'));

const MOTIFS = [
  { title: 'Meenakari', tag: 'Enamel work · Rajasthan', body: 'The old technique of firing colour into metal, usually hidden on the reverse of a piece. We use it as a small hidden detail on the inside of the connector.' },
  { title: 'Kundan', tag: 'Stone setting · North India', body: 'Stones set flush rather than raised on prongs, so the setting reads as one smooth surface — the basis for how our centre stone sits.' },
  { title: 'Jali Lattice', tag: 'Stone screens · Mughal architecture', body: 'The pierced stone lattices found in Mughal-era windows and screens, translated into the fine openwork line running along the chain.' },
  { title: 'Jhumka Silhouette', tag: 'Drop earring · Pan-India', body: 'The bell-shaped drop earring worn across India for generations. Our earrings soften that silhouette into the shape that also has to close into a pendant.' },
];

function MotifCard({ motif, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={'motif-card' + (open ? ' open' : '')}
      onClick={() => setOpen(!open)}
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <div className="motif-top">
        <svg viewBox="0 0 60 60"><path className="jewel-stroke" d="M30 10 C18 20 18 40 30 50 C42 40 42 20 30 10 Z" /><circle className="jewel-fill" cx="30" cy="30" r="3" /></svg>
        <span className="motif-plus">+</span>
      </div>
      <h4>{motif.title}</h4>
      <span className="motif-tag">{motif.tag}</span>
      <div className="motif-body">{motif.body}</div>
    </motion.div>
  );
}

export default function Heritage() {
  return (
    <>
      <div className="craft">
        <div className="wrap">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="eyebrow">Made In Small Batches</div>
            <h2>Handmade by our jewellers in India, one series at a time</h2>
            <p>Every piece in the first series is made to order by our own design and production team — not mass-produced in advance. Series I through III are crafted in 925 sterling silver only.</p>
            <div className="craft-marks">
              <div>Made to Order</div><div>Small Batch</div><div>Design-Led</div>
            </div>
          </motion.div>
          <motion.div className="craft-visual" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" className="jewel-stroke" />
              <path className="jewel-stroke" d="M 100 40 C 80 60, 80 90, 100 110 C 120 90, 120 60, 100 40 Z" />
              <circle className="jewel-fill" cx="100" cy="80" r="3.5" />
            </svg>
          </motion.div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 96 }}>
        <div className="section-head">
          <div className="eyebrow">Where The Design Comes From</div>
          <h2>Four ideas from Indian craft, inside one set</h2>
        </div>
        <div className="heritage-grid">
          {MOTIFS.map((m, i) => <MotifCard motif={m} index={i} key={m.title} />)}
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 96 }}>
        <div className="section-head"><div className="eyebrow">Series I — Numbered &amp; Limited</div><h2>Every set carries its own number</h2></div>
        <div className="edition">
          <div className="edition-card">
            <ErrorBoundary fallback={null}>
              <Suspense fallback={<div style={{ width: 130, height: 130, margin: '0 auto' }} />}>
                <BrassSeal3D />
              </Suspense>
            </ErrorBoundary>
            <div className="of">Set</div>
            <div className="num">No. 001</div>
            <div className="series-name">of 50 · Series I, Tavaré</div>
          </div>
          <ul>
            <li>Series I is capped at 50 sets. Once it's fully reserved, this exact design isn't repeated in the same form.</li>
            <li>Your number is fixed the moment you reserve, in the order reservations come in.</li>
            <li>Each set ships with a small card noting its number and the date it was made.</li>
          </ul>
        </div>
      </div>

      <div className="delivery-strip" style={{ marginTop: 96 }}>
        <div className="deliv-item"><span className="eyebrow">Handcrafted in India</span><p>Made after the series closes, by the same small team of jewellers.</p></div>
        <div className="deliv-item"><span className="eyebrow">Shipped to Europe</span><p>Tracked delivery to any EU address, estimated 10–14 days.</p></div>
        <div className="deliv-item"><span className="eyebrow">Priced in EUR</span><p>Final pricing shown before you're ever asked to pay.</p></div>
      </div>
    </>
  );
}
