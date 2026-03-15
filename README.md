# Neighborhood Analysis — Frontend

A Next.js frontend for a neighborhood analysis application focused on Boston. Users can sign up, sign in, save neighborhood searches, and manage them from a protected dashboard. The app triggers a LangGraph AI agent that analyzes Boston neighborhood data across eight datasets and returns a structured, buyer-personalized report. A streaming chat interface allows users to have multi-turn conversations with an AI assistant about Boston neighborhoods.

**Live:** [neighborhood-analysis-frontend.vercel.app](https://neighborhood-analysis-frontend.vercel.app/)

**Backend repo:** [ayushkhanvilkar10/neighborhood-analysis-backend](https://github.com/ayushkhanvilkar10/neighborhood-analysis-backend)
— FastAPI, deployed on Railway at [neighborhood-analysis-backend-production.up.railway.app](https://neighborhood-analysis-backend-production.up.railway.app)

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) + TypeScript                        |
| Styling       | Tailwind CSS v4                                             |
| Auth          | Supabase (`@supabase/supabase-js` + `@supabase/ssr`)        |
| Realtime      | WebSocket (streaming chat responses from FastAPI backend)   |
| Deployment    | Vercel (auto-deploy on push to `main`)                      |

## Pages

| Route        | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `/`          | Checks auth state and redirects to `/login` or `/dashboard`                 |
| `/login`     | Email/password sign in and sign up via Supabase auth                        |
| `/dashboard` | Protected — neighborhood search form, buyer preferences, saved searches list |
| `/chat`      | Protected — streaming multi-turn chat with the Boston neighborhood AI agent  |

## Auth Flow

1. Authentication is handled by Supabase using ECC (P-256) JWT tokens.
2. The Supabase client is initialized with `createBrowserClient` from `@supabase/ssr`.
3. On login, Supabase issues a JWT access token stored in the browser session.
4. Both the dashboard and chat pages extract `session.access_token` and send it as `Authorization: Bearer <token>` on every API request to the FastAPI backend.
5. On sign out, `supabase.auth.signOut()` is called and the user is redirected to `/login`.

## Features

### Neighborhood Analysis (Dashboard)
- Submit a search form with neighborhood, street, zip code, household type, and property preferences
- The backend runs a parallel 8-node LangGraph agent that hits Boston Open Data APIs (311, crime, property, permits, entertainment, traffic safety, gun violence, green space)
- The agent returns a structured 9-field report personalized to the buyer's household type and property preferences
- Reports are saved to Supabase and listed in the saved searches panel
- Saved searches can be deleted individually

### Streaming Chat (`/chat`)
- Multi-turn conversational interface with a ReAct agent
- Agent has access to three tools: `fetch_311`, `fetch_crime`, `fetch_property`
- Responses stream token-by-token via WebSocket connection to the FastAPI backend
- Conversation history is maintained within the session so the agent can reference earlier turns

## Project Structure

```
neighborhood-analysis-frontend/
├── app/
│   ├── layout.tsx          # Root layout with Geist font and global styles
│   ├── globals.css         # Tailwind CSS v4 import
│   ├── page.tsx            # Root redirect — sends users to /login or /dashboard
│   ├── login/
│   │   └── page.tsx        # Sign in / Sign up page with Supabase auth
│   ├── dashboard/
│   │   └── page.tsx        # Protected page with search form and saved searches list
│   └── chat/
│       └── page.tsx        # Protected streaming chat interface
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

| Variable                      | Description                          |
| ----------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`    | Your Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key      |
| `NEXT_PUBLIC_API_URL`         | The Railway backend base URL         |

## Deployment

- Deployed on **Vercel** via GitHub integration.
- Auto-deploys on every push to the `main` branch.
- Environment variables are configured in Vercel's project settings.
- `.env.local` is gitignored and never committed.
- CORS on the backend is locked to the Vercel deployment URL only.

## Roadmap

- Comparison view between multiple saved neighborhoods
- Persistent chat sessions — save and revisit past conversations from Supabase
- Buyer preferences profile page — store household type and property preferences per user so the agent always has context without re-entering the form
- Map visualization of neighborhood data overlays

---

## UI Component Research — SQL Data Display

The backend will soon return raw SQL query results alongside the agent analysis in the `POST /searches` response. The following React components were researched for displaying those numbers on the UI.

**Search query used:** `React stats card components numbers data display shadcn tailwind 2024 2025`

### Starting Points (from 21st.dev)
| Component | URL |
| --------- | --- |
| Stats Section | https://21st.dev/community/components/tommyjepsen/stats-section/default |
| Animated Gradient with SVG | https://21st.dev/community/components/danielpetho/animated-gradient-with-svg/default |

### Animated Number Components
| Component | URL | Notes |
| --------- | --- | ----- |
| Magic UI — Number Ticker | https://magicui.design/docs/components/number-ticker | Counts up/down to a target number with smooth animation. Supports decimals and custom start values. Install: `pnpm dlx shadcn@latest add @magicui/number-ticker` |
| Magic UI — Animated Circular Progress Bar | https://magicui.design/docs/components/animated-circular-progress-bar | Circular ring that fills to a percentage on mount. Good for property type share or safety scores |
| Bundui — Counter Animation | https://bundui.io/motion/components/counter-animation | Framer Motion-based counter with configurable easing |
| Bundui — Sliding Number | https://bundui.io/motion/components/sliding-number | Digits slide in like an odometer — good for headline counts |

### Stat Card Grids
| Component | URL | Notes |
| --------- | --- | ----- |
| blocks.so — Stats with Trending | https://blocks.so/stats/stats-01 | Number + up/down trend arrow |
| blocks.so — Stats with Badges | https://blocks.so/stats/stats-04 | Label + colored badge, good for crime severity |
| blocks.so — Stats with Area Chart | https://blocks.so/stats/stats-10 | Number + inline mini sparkline chart |
| blocks.so — Stats Dashboard with Progress Bars | https://blocks.so/stats/stats-11 | Category breakdown with progress bars — ideal for property type mix |
| blocks.so — Stats with Value Breakdown | https://blocks.so/stats/stats-15 | Total split into sub-values — ideal for 311 complaint type breakdown |
| blocks.so — Full Stats Collection (15 variants) | https://blocks.so/stats | All 15 free shadcn/ui stat block variants |
| Bundui — 8 Stats Card Blocks | https://bundui.io/blocks/dashboard-ui/stat-cards | Dashboard-style stat cards with icons and metric labels |
| shadcnblocks.com — Stats10 | https://www.shadcnblocks.com/block/stats10 | Grid of cards with bold metric, avatar/logo, and description |

### Interactive / Animated Cards
| Component | URL | Notes |
| --------- | --- | ----- |
| Interactive Shadcn Flip Cards | https://github.com/Shadcn-Widgets/Interactive-Shadcn-Flip-Cards | Gradient front shows the count; Recharts bar chart revealed on hover. Uses `@react-spring/web`. Great for showing count on front and distribution on back |
