# Byron Bay Experience — Operations Dashboard

## Stack
- **Frontend**: Vite + React
- **Database + Auth**: Supabase (Postgres, realtime, Google OAuth)
- **Hosting**: Vercel (auto-deploys from GitHub)
- **Editor**: VS Code

---

## Setup — follow these steps in order

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/bbe-dashboard.git
cd bbe-dashboard
npm install
```

---

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `bbe-dashboard`, choose a region close to Australia
3. Copy your **Project URL** and **anon public key** from Settings → API

---

### 3. Run the database schema

1. In Supabase → SQL Editor
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run** — this creates all tables, RLS policies, and realtime subscriptions

---

### 4. Enable Google OAuth in Supabase

1. Go to Supabase → Authentication → Providers → Google
2. Enable it
3. Go to [console.cloud.google.com](https://console.cloud.google.com)
4. Create a new project → APIs & Services → Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorised redirect URIs: add `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret** back into Supabase Google provider settings
8. Save

---

### 5. Create your .env.local file

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign in with your Google account.

---

### 7. Push to GitHub

```bash
git init
git add .
git commit -m "Initial BBE dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bbe-dashboard.git
git push -u origin main
```

---

### 8. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your `bbe-dashboard` GitHub repo
3. Framework: **Vite** (auto-detected)
4. Add Environment Variables (same as your `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_CLIENT_ID`
5. Click **Deploy**
6. Copy your Vercel URL (e.g. `https://bbe-dashboard.vercel.app`)

---

### 9. Add Vercel URL to Google OAuth

1. Go back to Google Cloud Console → your OAuth Client
2. Add to **Authorised JavaScript origins**: `https://bbe-dashboard.vercel.app`
3. Add to **Authorised redirect URIs**: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. Save

Your team can now log in at your Vercel URL using their Google accounts.

---

## Gmail integration (optional, Phase 2)

To sync Gmail enquiries into the Inbox tab:

1. Enable the **Gmail API** in Google Cloud Console
2. Create a Supabase Edge Function: `supabase/functions/sync-gmail/index.ts`
3. Use OAuth2 to call the Gmail API and write threads to the `email_threads` table
4. Schedule it with `pg_cron` or a Vercel cron job

This is a separate setup — the dashboard works fully without it.

---

## Day-to-day workflow

1. **Email arrives** → go to Inbox tab → fill in Quick Intake → Create booking
2. **New booking** → fill in Event Brief, add Performers with YES/NO/NR status
3. **Track missing info** → Green room section has the checklist — tick items off as they arrive
4. **Run sheet** → add rows in order, set times
5. **Call sheet** → click "Download call sheet" — generates a formatted .txt you can email or paste
6. **Progress bar** → click stages to advance the booking through the pipeline

---

## Team access

Anyone with a Google account you approve can log in. To restrict to specific emails, add a Supabase Auth Hook or check `session.user.email` in the app.
