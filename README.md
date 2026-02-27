# Neighborhood Analysis — Frontend

A Next.js frontend for a neighborhood analysis application focused on Boston. Users can sign up, sign in, save neighborhood searches (name, street, zip code), and manage them from a protected dashboard. The app is designed to eventually trigger a LangGraph AI agent that analyzes Boston neighborhood data and returns structured reports.

**Live:** [neighborhood-analysis-frontend.vercel.app](https://neighborhood-analysis-frontend.vercel.app/)

**Backend repo:** [ayushkhanvilkar10/neighborhood-analysis-backend](https://github.com/ayushkhanvilkar10/neighborhood-analysis-backend)
— FastAPI, deployed on Railway at [neighborhood-analysis-backend-production.up.railway.app](https://neighborhood-analysis-backend-production.up.railway.app)

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) for authentication
- **Vercel** for deployment

## Pages

| Route | Description |
|---|---|
| `/` | Checks auth state and redirects to `/login` or `/dashboard` |
| `/login` | Email/password sign in and sign up with Supabase auth |
| `/dashboard` | Protected page — search form, saved searches list, sign out |

## Auth Flow

1. Authentication is handled by Supabase using ECC (P-256) JWT tokens.
2. The Supabase client is initialized with `createBrowserClient` from `@supabase/ssr`.
3. On login, Supabase issues a JWT access token stored in the browser session.
4. The dashboard extracts `session.access_token` and sends it as `Authorization: Bearer <token>` on every API request to the FastAPI backend.
5. On sign out, `supabase.auth.signOut()` is called and the user is redirected to `/login`.

## Project Structure

```
neighborhood-analysis-frontend/
├── app/
│   ├── layout.tsx          # Root layout with Geist font and global styles
│   ├── globals.css         # Tailwind CSS v4 import
│   ├── page.tsx            # Root redirect — sends users to /login or /dashboard
│   ├── login/
│   │   └── page.tsx        # Sign in / Sign up page with Supabase auth
│   └── dashboard/
│       └── page.tsx        # Protected page with form and saved searches list
├── lib/
│   └── supabase.ts         # Supabase browser client using createBrowserClient
├── .env.local              # Local environment variables (gitignored)
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Local Setup

1. Clone the repo:

```bash
git clone https://github.com/ayushkhanvilkar10/neighborhood-analysis-frontend.git
cd neighborhood-analysis-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_railway_backend_url
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | The Railway backend base URL |

## Deployment

- Deployed on **Vercel** via GitHub integration.
- Auto-deploys on every push to the `main` branch.
- Environment variables are configured in Vercel's project settings.
- `.env.local` is gitignored and never committed.

## Roadmap

- Display AI-generated neighborhood analysis reports on form submission
- Streaming LangGraph agent responses to the frontend
- Chat interface for conversational follow-up on neighborhood reports
- Comparison view between multiple saved neighborhoods
