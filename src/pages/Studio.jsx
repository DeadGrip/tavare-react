import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.js';

const pad = (n) => String(n).padStart(3, '0');

function LoginGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.session) setErr('Incorrect email or password.');
  }

  return (
    <div className="studio-gate">
      <p>Sign in with your studio account to manage the catalogue, drops, and reservations.</p>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="you@studio.com" value={email}
          onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <div style={{ marginTop: 16 }}>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        {err && <p className="studio-note" style={{ color: 'var(--error)' }}>{err}</p>}
      </form>
    </div>
  );
}

function DesignsPanel() {
  const [designs, setDesigns] = useState([]);
  const [form, setForm] = useState({ title: '', number: '', price: '', story: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [okMsg, setOkMsg] = useState(false);

  async function load() {
    const { data } = await supabase.from('designs').select('*').order('number');
    setDesigns(data || []);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setUploading(true);
    try {
      let image_url = '';
      if (file) {
        const path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const { error: upErr } = await supabase.storage.from('catalogue-images').upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('catalogue-images').getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      const { error } = await supabase.from('designs').insert({
        title: form.title.trim(),
        number: form.number.trim(),
        price: form.price.trim() || null,
        story: form.story.trim(),
        image_url,
      });
      if (error) throw error;
      setForm({ title: '', number: '', price: '', story: '' });
      setFile(null);
      setOkMsg(true);
      setTimeout(() => setOkMsg(false), 2500);
      load();
    } catch (err) {
      alert('Could not add design: ' + (err.message || 'unknown error'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    await supabase.from('designs').delete().eq('id', id);
    load();
  }

  return (
    <div className="studio-grid">
      <div className="admin-card">
        <h3>Add a design to the catalogue</h3>
        <form onSubmit={handleAdd} style={{ gap: 14 }}>
          <div>
            <label>Title</label>
            <input type="text" placeholder="The Convertible Set" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="row2">
            <div>
              <label>Design No.</label>
              <input type="text" placeholder="02" value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div>
              <label>Price (EUR)</label>
              <input type="number" placeholder="169" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div>
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div>
            <label>Short story</label>
            <textarea rows="3" placeholder="A line or two about this design." value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })} />
          </div>
          <div className="submit-row">
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Add to catalogue'}
            </button>
          </div>
          {okMsg && <p className="ok-msg" style={{ display: 'block' }}>Added to the catalogue.</p>}
        </form>
      </div>

      <div className="admin-card">
        <h3>Current catalogue entries</h3>
        {designs.length === 0 ? (
          <p className="empty-note">No designs added yet — the catalogue is showing the built-in demo design only.</p>
        ) : (
          designs.map((d) => (
            <div className="admin-list-item" key={d.id}>
              <div>
                <div className="il-title">{d.title}</div>
                <div className="il-sub">No. {d.number || '—'}{d.price ? ` · €${d.price}` : ''}</div>
              </div>
              <button className="del-btn" onClick={() => handleDelete(d.id)}>Remove</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DropsPanel() {
  const [drops, setDrops] = useState([]);
  const [form, setForm] = useState({ teaser_title: '', teaser_copy: '', reveal_at: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from('drops').select('*').order('reveal_at', { ascending: false });
    setDrops(data || []);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.teaser_title.trim() || !form.reveal_at) return;
    setBusy(true);
    const { error } = await supabase.from('drops').insert({
      teaser_title: form.teaser_title.trim(),
      teaser_copy: form.teaser_copy.trim(),
      reveal_at: new Date(form.reveal_at).toISOString(),
    });
    setBusy(false);
    if (error) { alert('Could not create drop: ' + error.message); return; }
    setForm({ teaser_title: '', teaser_copy: '', reveal_at: '' });
    load();
  }

  return (
    <div className="admin-card" style={{ marginTop: 32 }}>
      <h3>Monthly drops — the countdown teaser on the homepage</h3>
      <form onSubmit={handleAdd} className="row2" style={{ alignItems: 'end', marginBottom: 24 }}>
        <div>
          <label>Teaser title</label>
          <input type="text" placeholder="Series II — Teaser" value={form.teaser_title}
            onChange={(e) => setForm({ ...form, teaser_title: e.target.value })} />
        </div>
        <div>
          <label>Reveal date &amp; time</label>
          <input type="datetime-local" value={form.reveal_at}
            onChange={(e) => setForm({ ...form, reveal_at: e.target.value })} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Teaser copy (optional)</label>
          <input type="text" placeholder="Something new is coming…" value={form.teaser_copy}
            onChange={(e) => setForm({ ...form, teaser_copy: e.target.value })} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-primary" disabled={busy}>Schedule drop</button>
        </div>
      </form>

      {drops.length === 0 ? (
        <p className="empty-note">No drops scheduled yet.</p>
      ) : (
        drops.map((d) => (
          <div className="admin-list-item" key={d.id}>
            <div>
              <div className="il-title">{d.teaser_title}</div>
              <div className="il-sub">{new Date(d.reveal_at).toLocaleString()}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ReservationsPanel() {
  const [reservations, setReservations] = useState([]);

  async function load() {
    const { data } = await supabase.from('reservations').select('*').order('edition_number');
    setReservations(data || []);
  }
  useEffect(() => { load(); }, []);

  function exportCsv() {
    let csv = 'Edition Number,Name,Email,Finish,Date\n';
    reservations.forEach((r) => {
      csv += [pad(r.edition_number || 0), r.name, r.email, r.finish || '', r.created_at || '']
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tavare-reservations.csv';
    a.click();
  }

  return (
    <div className="admin-card" style={{ marginTop: 32 }}>
      <h3>Reservations <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>({reservations.length} so far)</span></h3>
      {reservations.length === 0 ? (
        <p className="empty-note">No reservations yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead><tr><th>No.</th><th>Name</th><th>Email</th><th>Finish</th><th>Date</th></tr></thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{pad(r.edition_number || 0)}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.finish || '—'}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <button className="btn-ghost" onClick={exportCsv}>Export as CSV</button>
      </div>
    </div>
  );
}

export default function Studio() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // avoid a login-form flash while checking

  return (
    <div className="wrap">
      <div className="section-head">
        <div className="eyebrow">Studio</div>
        <h2>Catalogue, drops &amp; reservations admin</h2>
      </div>

      {!session ? (
        <LoginGate />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
          <DesignsPanel />
          <DropsPanel />
          <ReservationsPanel />
        </motion.div>
      )}
    </div>
  );
}
