/**
 * TAVARÉ — Supabase connection config.
 *
 * These two values come from Supabase → Project Settings → API.
 * The "anon" key is safe to expose in browser code — it is a PUBLIC key.
 * Never put your service_role key or Resend API key here; those stay
 * server-side only (Vercel project environment variables).
 *
 * Fill these in after creating your Supabase project and running
 * supabase/schema.sql — see SETUP.md.
 */
window.TAVARE_SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.TAVARE_SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
