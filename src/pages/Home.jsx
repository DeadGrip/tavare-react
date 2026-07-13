import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroDiagram from '../components/HeroDiagram.jsx';
import DropCountdown from '../components/DropCountdown.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.9, 0.3, 1] } },
};

export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="eyebrow">A Numbered Series, Handcrafted in India for Europe</div>
        <h1>One set of jewellery.<br /><span className="thin">Worn four different ways.</span></h1>
        <p className="hero-sub">
          Two earrings and a single chain — designed to separate, join, and re-form into a pendant
          necklace, a layered look, or a bracelet. Made by hand in India in 925 sterling silver, in a
          series of only 50, each set carrying its own number.
        </p>

        <HeroDiagram />

        <div className="hero-links">
          <Link to="/catalogue" className="btn-primary">View the catalogue</Link>
          <Link to="/reserve" className="btn-ghost">Reserve Series I</Link>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
          <DropCountdown />
        </motion.div>
      </div>

      <hr className="divider" style={{ marginTop: 40 }} />

      <div className="wrap" style={{ paddingTop: 96 }}>
        <motion.div className="section-head" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeUp}>
          <div className="eyebrow">The Set</div>
          <h2>Three parts. Four outcomes.</h2>
        </motion.div>
        <div className="set-grid">
          {[
            { qty: '×2', title: 'Drop earrings', body: 'Each earring closes into a small interlocking hook, so the pair can be worn on their own or joined together.' },
            { qty: '×1', title: 'Convertible chain', body: 'One length of chain that sits as a necklace, wraps as a bracelet, or holds the joined earrings as a pendant.' },
            { qty: '×1', title: 'Connector fitting', body: 'A single hidden clasp point where the earrings attach to the chain — the mechanism behind all four looks.' },
          ].map((item, i) => (
            <motion.div
              className="set-card" key={item.title}
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
              variants={fadeUp} transition={{ delay: i * 0.1 }}
            >
              <div className="set-qty">{item.qty}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
