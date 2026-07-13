import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.js';

const TOTAL_SERIES = 50;
const pad = (n) => String(n).padStart(3, '0');

export default function Reserve() {
  const [count, setCount] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', finish: 'Polished', hp: '' });

  async function refreshCount() {
    const { data, error } = await supabase.rpc('get_reservation_count');
    if (!error) setCount(data ?? 0);
    return data ?? 0;
  }

  useEffect(() => { refreshCount(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!form.name.trim() || !emailOk) {
      setError('Please enter your name and a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('reserve_set', {
        p_name: form.name.trim(),
        p_email: form.email.trim(),
        p_finish: form.finish,
        p_honeypot: form.hp,
      });
      if (error) throw error;
      if (data === -1 || data === null) {
        // Honeypot tripped — pretend success, don't tip off the bot.
        setSubmitted(1);
        return;
      }
      setSubmitted(data);
      refreshCount();
    } catch (err) {
      setError(err.message?.includes('already reserved')
        ? 'This email has already reserved a set.'
        : 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap reserve">
      <div className="section-head">
        <div className="eyebrow">Reserve Your Set</div>
        <h2>Be first when the series opens</h2>
      </div>

      <motion.div className="reserve-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {!submitted && (
          <div className="counter">
            <strong>{count === null ? '—' : count}</strong> <span>of {TOTAL_SERIES} numbered sets already reserved</span>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="row2">
              <div>
                <label htmlFor="fname">Name</label>
                <input id="fname" type="text" placeholder="Your name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="femail">Email</label>
                <input id="femail" type="email" placeholder="you@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label htmlFor="ffinish">Preferred finish <span className="hint">(925 sterling silver — Series I–III)</span></label>
              <select id="ffinish" value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })}>
                <option value="Polished">Polished</option>
                <option value="Brushed">Brushed</option>
                <option value="No preference">No preference</option>
              </select>
            </div>

            {/* Honeypot — invisible to real visitors, bots fill every field they find. */}
            <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
              <label htmlFor="company">Company</label>
              <input id="company" type="text" tabIndex="-1" autoComplete="off"
                value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} />
            </div>

            {error && <div className="err" style={{ display: 'block' }}>{error}</div>}

            <div className="submit-row">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Reserving…' : 'Reserve My Set'}
              </button>
            </div>
            <div className="form-note">Reserving costs nothing today. It only tells us there's demand — it isn't an order or a payment.</div>
          </form>
        ) : (
          <motion.div className="success" style={{ display: 'block' }}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <h3>You're on the list — No. {pad(submitted)}</h3>
            <p>That's your number in Series I, fixed by reservation order. We'll email you the moment the series is ready to order — including price in EUR and sizing details.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
