import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.js';

function getRemaining(revealAt) {
  const diff = new Date(revealAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function DropCountdown() {
  const [drop, setDrop] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('drops')
        .select('*')
        .gt('reveal_at', new Date().toISOString())
        .order('reveal_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) setDrop(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!drop) return;
    setRemaining(getRemaining(drop.reveal_at));
    const id = setInterval(() => setRemaining(getRemaining(drop.reveal_at)), 1000);
    return () => clearInterval(id);
  }, [drop]);

  if (loading || !drop) return null;

  const revealed = !remaining;

  return (
    <div className={'drop-teaser' + (revealed ? ' revealed' : '')}>
      <div className="eyebrow">Next Drop</div>
      <h3>{drop.teaser_title}</h3>
      {drop.teaser_copy && <p>{drop.teaser_copy}</p>}

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="clock"
            className="drop-clock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            {[['days', 'Days'], ['hours', 'Hrs'], ['minutes', 'Min'], ['seconds', 'Sec']].map(([key, label]) => (
              <div className="unit" key={key}>
                <motion.div
                  key={remaining[key]}
                  className="n"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {String(remaining[key]).padStart(2, '0')}
                </motion.div>
                <div className="l">{label}</div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
          >
            <span className="drop-revealed-badge">Just revealed — check the catalogue</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
