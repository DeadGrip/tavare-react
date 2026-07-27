# Tavaré — deployment setup

This site is a static front-end (in `public/`) plus one small serverless
function (`api/reserve.js`) for sending email. There's no traditional
backend server — the admin panel talks to Supabase directly, protected by
database security rules (RLS).

Follow these steps in order. None of them require sending me any secret
keys — everything below is done in your own Supabase, Resend, Vercel, and
Cloudflare dashboards.

---

## 1. Supabase — database, storage, and admin login

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine to start).
2. Open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   This creates the `products` table, security policies, the
   `product-images` storage bucket, and seeds it with the six starting
   jewellery lots and four art pieces.
3. Create your admin login: **Authentication → Users → Add user**.
   Use your real email and a strong password — this is what you'll use to
   sign in at `/admin.html`. (Supabase Auth handles password resets, so
   there's no "forgot password" flow to build.)
4. Get your API keys: **Project Settings → API**.
   - Copy **Project URL** and the **anon / public** key.
   - Open [`public/js/supabase-config.js`](public/js/supabase-config.js)
     and paste them in:
     ```js
     window.TAVARE_SUPABASE_URL = "https://xxxxx.supabase.co";
     window.TAVARE_SUPABASE_ANON_KEY = "eyJ...";
     ```
   - The anon key is a **public** key by design (security comes from the
     RLS policies in the SQL file, not from hiding this key) — it's safe
     to commit and ship in browser code. Never put the **service_role**
     key here or anywhere in `public/`.

## 2. Resend — email for the "Reserve" form

1. Create a account at [resend.com](https://resend.com) and grab an API
   key from **API Keys**.
2. Fastest path (works immediately): leave `RESERVE_FROM_EMAIL` as the
   sandbox sender `onboarding@resend.dev` — Resend allows this for any
   account with no setup.
3. Better long-term: **Domains → Add Domain**, add `tavarestudio.com`,
   and add the DNS records Resend gives you (in Cloudflare, see step 4).
   Once verified, change `RESERVE_FROM_EMAIL` to something like
   `Tavaré <reserve@tavarestudio.com>`.
4. You'll set `RESEND_API_KEY`, `RESERVE_TO_EMAIL`, and `RESERVE_FROM_EMAIL`
   as Vercel environment variables in step 3 — see
   [`.env.example`](.env.example) for the shape. `RESERVE_TO_EMAIL` is
   already set to `deadgripgaming@gmail.com` per your earlier answer;
   change it any time in Vercel's dashboard.

## 3. Vercel — hosting

1. Push this project to a GitHub repo (or install the Vercel CLI:
   `npm i -g vercel`).
2. **Import the repo** at [vercel.com/new](https://vercel.com/new), or run
   `vercel` from this folder and follow the prompts. Vercel auto-detects
   the `public/` + `api/` layout — no framework preset needed.
3. **Project → Settings → Environment Variables**, add:
   - `RESEND_API_KEY`
   - `RESERVE_TO_EMAIL`
   - `RESERVE_FROM_EMAIL`
4. Deploy (`vercel --prod`, or push to your main branch if using Git
   integration). You'll get a URL like `tavare.vercel.app` — confirm the
   site loads and the collection renders (pulling live from Supabase).

## 4. Cloudflare — pointing tavarestudio.com at Vercel

1. In **Vercel → Project → Settings → Domains**, add `tavarestudio.com`
   (and `www.tavarestudio.com` if you want both). Vercel will show you
   the DNS records it needs.
2. In **Cloudflare → DNS** for `tavarestudio.com`, add those records
   (typically an `A` record for the apex domain and a `CNAME` for `www`,
   pointing per Vercel's instructions).
3. If Cloudflare's orange-cloud proxy is on, that's fine for a normal
   site — Vercel works behind Cloudflare's proxy. If you see SSL/redirect
   issues, set the Cloudflare SSL mode to **Full**.
4. If you verified a sending domain in Resend (step 2.3), add those DNS
   records in Cloudflare too, in the same DNS tab.

## 5. Test it end to end

- Visit your site → the Collection and Rare Art sections should load
  live data from Supabase (not the hardcoded placeholders).
- Go to `/admin.html` → sign in with the user you created in step 1.3.
- Add a piece with a photo → confirm it appears on the public site,
  inside its frame, in place of the engraved placeholder illustration.
- Toggle a piece to "Sold / Archived" → confirm the public site reflects
  it.
- Submit the "Reserve an introduction" form on the public site → confirm
  the email arrives at your `RESERVE_TO_EMAIL` inbox.

## Local development

`npm run dev` starts a zero-dependency local server (`dev-server.js`) that
serves `public/` and runs `api/reserve.js` locally at
`http://localhost:5173`. It talks to your real Supabase project (via the
values in `supabase-config.js`), so you can test the whole flow — including
adding/editing products — before deploying.

---

### Security notes

- Never commit a real `.env` file — `.gitignore` already excludes it.
- The Supabase **anon key** is safe to expose; the **service_role key**
  (which bypasses all security rules) is not used anywhere in this
  project and should never be added to `public/`.
- Rotate your Resend and Supabase keys immediately if you ever
  accidentally paste them somewhere public (a chat, a public repo, etc).
