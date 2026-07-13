import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fails loudly at build/dev time rather than silently breaking every
  // page at runtime — much easier to diagnose than a blank catalogue.
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env locally, ' +
    'or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.'
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
