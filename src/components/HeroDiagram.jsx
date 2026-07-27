import { useState } from 'react';
import { motion } from 'framer-motion';

const MODES = ['earrings', 'necklace', 'layered', 'bracelet'];
const LABELS = { earrings: 'Earrings', necklace: 'Necklace', layered: 'Chain + Earrings', bracelet: 'Bracelet' };
const CAPTIONS = {
  earrings: 'Worn separately, as a simple pair of drop earrings. The chain rests, unused.',
  necklace: 'Both earrings interlock at the centre of the chain, forming a single pendant necklace.',
  layered: 'The chain sits as a necklace on its own, while the earrings are worn as usual — a layered look from one set.',
  bracelet: 'The chain wraps twice to sit as a bracelet. Earrings rest until you switch it back.',
};

// Target transform per mode, per part — the actual "convertible" motion.
const POSITIONS = {
  earrings: {
    earL: { x: 200, y: 64, rotate: 0, scale: 1, opacity: 1 },
    earR: { x: 400, y: 64, rotate: 0, scale: 1, opacity: 1 },
    chain: { x: 96, y: 368, rotate: 18, scale: 0.34, opacity: 0.55 },
    earAnchors: 1, neckGuide: 0, wristGuide: 0,
  },
  necklace: {
    earL: { x: 282, y: 238, rotate: -14, scale: 0.92, opacity: 1 },
    earR: { x: 318, y: 238, rotate: 14, scale: 0.92, opacity: 1 },
    chain: { x: 300, y: 150, rotate: 0, scale: 1, opacity: 1 },
    earAnchors: 0, neckGuide: 1, wristGuide: 0,
  },
  layered: {
    earL: { x: 200, y: 64, rotate: 0, scale: 1, opacity: 1 },
    earR: { x: 400, y: 64, rotate: 0, scale: 1, opacity: 1 },
    chain: { x: 300, y: 150, rotate: 0, scale: 1, opacity: 1 },
    earAnchors: 1, neckGuide: 1, wristGuide: 0,
  },
  bracelet: {
    earL: { x: 150, y: 60, rotate: -8, scale: 0.42, opacity: 0.4 },
    earR: { x: 184, y: 60, rotate: 8, scale: 0.42, opacity: 0.4 },
    chain: { x: 300, y: 392, rotate: 0, scaleX: 0.5, scaleY: 0.62, opacity: 1 },
    earAnchors: 0, neckGuide: 0, wristGuide: 1,
  },
};

const spring = { type: 'spring', stiffness: 120, damping: 16 };

function Earring({ pos }) {
  const { scaleX, scaleY, scale, ...rest } = pos;
  return (
    <motion.g
      className="jewel-group"
      animate={{ x: pos.x, y: pos.y, rotate: pos.rotate, scale: pos.scale, opacity: pos.opacity }}
      transition={spring}
    >
      <circle className="jewel-stroke" cx="0" cy="-6" r="6" />
      <path className="jewel-stroke" d="M 0 0 C -16 18, -16 42, 0 55 C 16 42, 16 18, 0 0 Z" />
      <circle className="jewel-fill" cx="0" cy="30" r="3" />
    </motion.g>
  );
}

export default function HeroDiagram() {
  const [mode, setMode] = useState('earrings');
  const p = POSITIONS[mode];

  return (
    <>
      <div className="switcher">
        {MODES.map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {LABELS[m]}
          </button>
        ))}
      </div>

      <div className="stage-wrap">
        <div className="stage">
          <svg viewBox="0 0 600 460" xmlns="http://www.w3.org/2000/svg">
            <motion.g animate={{ opacity: p.earAnchors }} transition={{ duration: 0.4 }}>
              <circle className="guide" cx="200" cy="40" r="10" />
              <circle className="guide" cx="400" cy="40" r="10" />
            </motion.g>
            <motion.path className="guide" d="M 150 90 Q 300 190 450 90" animate={{ opacity: p.neckGuide }} transition={{ duration: 0.4 }} />
            <motion.ellipse className="guide" cx="300" cy="392" rx="110" ry="46" animate={{ opacity: p.wristGuide }} transition={{ duration: 0.4 }} />

            <motion.g
              className="jewel-group"
              animate={{
                x: p.chain.x, y: p.chain.y, rotate: p.chain.rotate, opacity: p.chain.opacity,
                scaleX: p.chain.scaleX ?? p.chain.scale, scaleY: p.chain.scaleY ?? p.chain.scale,
              }}
              transition={spring}
            >
              <path className="jewel-stroke" d="M -150 -10 Q 0 90 150 -10" strokeDasharray="1 14" />
              <path className="jewel-stroke" d="M -150 -10 Q 0 90 150 -10" opacity="0.35" />
              <circle className="jewel-fill" cx="0" cy="78" r="4.5" />
            </motion.g>

            <Earring pos={p.earL} />
            <Earring pos={p.earR} />
          </svg>
        </div>
        <div className="caption">
          <motion.p key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {CAPTIONS[mode]}
          </motion.p>
        </div>
      </div>
    </>
  );
}
