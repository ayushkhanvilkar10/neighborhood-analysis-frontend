# Neighborhood Analysis — Frontend

A Next.js frontend for a neighborhood analysis application focused on Boston. Users can sign up, sign in, save neighborhood searches, and manage them from a protected dashboard. The app triggers a LangGraph AI agent that analyzes Boston neighborhood data across eight datasets and returns a structured, buyer-personalized report. A streaming chat interface allows users to have multi-turn conversations with an AI assistant about Boston neighborhoods.

**Live:** [neighborhood-analysis-frontend.vercel.app](https://neighborhood-analysis-frontend.vercel.app/)

**Backend repo:** [ayushkhanvilkar10/neighborhood-analysis-backend](https://github.com/ayushkhanvilkar10/neighborhood-analysis-backend)
— FastAPI, deployed on Railway at [neighborhood-analysis-backend-production.up.railway.app](https://neighborhood-analysis-backend-production.up.railway.app)

## Tech Stack

| Layer         | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) + TypeScript                              |
| Styling       | Tailwind CSS v4                                                   |
| UI Components | shadcn/ui + Headless UI v2 (`@headlessui/react`)                  |
| Auth          | Supabase (`@supabase/supabase-js` + `@supabase/ssr`)              |
| Realtime      | WebSocket (streaming chat responses from FastAPI backend)         |
| Maps          | Mapbox GL JS via `react-map-gl`                                   |
| Animation     | Framer Motion                                                     |
| Deployment    | Vercel (auto-deploy on push to `main`)                            |

## Pages

| Route        | Description                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| `/`          | Checks auth state and redirects to `/login` or `/dashboard`                  |
| `/login`     | Email/password sign in and sign up via Supabase auth                         |
| `/dashboard` | Protected — neighborhood search form, buyer preferences, saved searches list |
| `/chat`      | Protected — streaming multi-turn chat with the Boston neighborhood AI agent  |

## Auth Flow

1. Authentication is handled by Supabase using ECC (P-256) JWT tokens.
2. The Supabase client is initialized with `createBrowserClient` from `@supabase/ssr`.
3. On login, Supabase issues a JWT access token stored in the browser session.
4. Both the dashboard and chat pages extract `session.access_token` and send it as `Authorization: Bearer <token>` on every API request to the FastAPI backend.
5. On sign out, `supabase.auth.signOut()` is called and the user is redirected to `/login`.

## Features

### Navigation
- Persistent left sidebar on desktop (`lg:w-56`) — always visible, shows Analysis and Chat links with active state highlighting
- On the `/chat` page, the sidebar also displays all chat sessions with a New Chat button
- On mobile, a fixed top bar with a hamburger button opens a full-screen shadcn `Sheet` with the same nav content
- Navigation is hidden on the `/login` page
- Built as a shared `AppNav` component in `components/app-nav.tsx`, rendered once in `layout.tsx`

### Neighborhood Analysis (Dashboard)
- Search form using Headless UI components: `Listbox` for neighborhood selection, `Combobox` for street autocomplete (queries Boston Open Data live with 300ms debounce), `Select` for zip code and household type
- Property preferences as pill-shaped shadcn `Button` toggles (max 2, `rounded-full`)
- The backend runs a parallel 8-node LangGraph agent across Boston Open Data APIs (311, crime, property, permits, entertainment, traffic safety, gun violence, green space)
- The agent returns a 9-field structured report personalized to the buyer's household type and property preferences
- The response also includes `raw_stats` (crime counts, property breakdown, 311 breakdown) and `neighborhood_tiers` (crime and 311 tier: High / Moderate / Low) pre-computed from `agent/neighborhood_tiers.json`
- Crime stats displayed as a stat card grid (`Stats03`), property mix as a donut/progress bar card (`CardStatPropertyMix`), 311 requests as a ranked list card (`CardStat311`)
- Crime & Safety and 311 Service Requests analysis cards show a tier badge (red/yellow/green) in the section title
- Reports are saved to Supabase and listed in the saved searches panel
- Saved searches can be deleted individually
- Mapbox crime map modal overlaid on the current neighborhood

### Streaming Chat (`/chat`)
- Multi-turn conversational interface with a ReAct agent
- Agent has access to seven tools: `fetch_311`, `fetch_crime`, `fetch_property`, `fetch_permits`, `fetch_entertainment`, `fetch_traffic_safety`, `fetch_gun_violence`
- Responses stream token-by-token via WebSocket — tokens are batched via `requestAnimationFrame` (~60fps) rather than triggering a React re-render on every token
- During streaming, content renders as plain text (no markdown parsing on incomplete strings); markdown is parsed once after `[DONE]` fires
- Active session is driven by `?session=<id>` URL param — the sidebar in `AppNav` handles session creation and selection by pushing to the router
- Conversation history is maintained within the session

## Design System

The UI uses a consistent glass aesthetic derived from the `login-hero.svg` background palette (`#FDF2ED` cream + `#016B51` deep forest green → `#64A59C` teal gradient).

Key design tokens in `globals.css`:
- `--color-verdict: #F7E1D8` — warm cream used as the background for all stat cards, the verdict card, and the "Add a Search" section
- `--color-forest: #016B51` — deep forest green used as the border color across all cards and form inputs

Glass card pattern used throughout:
```
rounded-xl bg-verdict/40 border border-[#016B51]/20 backdrop-blur-md
```

Section wrapper pattern:
```
rounded-xl bg-verdict/40 border border-[#016B51]/20 backdrop-blur-2xl
```

Property mix chart colors step through a distinct 5-color green palette: `#D4E8A0` (yellow-green), `#4AADA8` (teal), `#2E8B72` (mid green), `#016B51` (deep forest), `#A3B842` (olive).

## Project Structure

```
neighborhood-analysis-frontend/
├── app/
│   ├── layout.tsx           # Root layout — renders AppNav + AppShell
│   ├── globals.css          # Tailwind CSS v4 + custom color tokens + streaming animation
│   ├── page.tsx             # Root redirect
│   ├── login/
│   │   └── page.tsx         # Sign in / Sign up
│   ├── dashboard/
│   │   └── page.tsx         # Search form, analysis report, saved searches
│   └── chat/
│       └── page.tsx         # Streaming chat interface (session via URL param)
├── components/
│   ├── app-nav.tsx          # Shared sidebar (desktop) + Sheet (mobile) navigation
│   ├── app-shell.tsx        # Client wrapper — applies sidebar/topbar offset except on /login
│   ├── stats-03.tsx         # Crime stat card grid
│   ├── stat-cards-02.tsx    # Property mix card with progress bars
│   ├── stat-cards-03.tsx    # 311 service requests card
│   └── ui/
│       ├── button.tsx       # shadcn Button
│       ├── sheet.tsx        # shadcn Sheet (mobile nav drawer)
│       ├── skeleton.tsx     # shadcn Skeleton
│       ├── spinner.tsx      # Loading spinner
│       ├── loader.tsx       # TextShimmerLoader for chat thinking state
│       └── ...              # Other shadcn primitives
├── docs/
│   └── chat-streaming-overhaul.md  # Documents rAF batching + streaming UI improvements
├── lib/
│   └── supabase.ts          # Supabase browser client
├── public/
│   └── images/
│       └── login-hero.svg   # Background SVG (cream + forest green/teal gradient)
├── .env.local               # Local environment variables (gitignored)
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
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable                        | Description                          |
| ------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key        |
| `NEXT_PUBLIC_API_URL`           | The Railway backend base URL         |
| `NEXT_PUBLIC_MAPBOX_TOKEN`      | Mapbox public access token for maps  |

## Deployment

- Deployed on **Vercel** via GitHub integration.
- Auto-deploys on every push to the `main` branch.
- Environment variables are configured in Vercel's project settings.
- `.env.local` is gitignored and never committed.
- CORS on the backend is locked to the Vercel deployment URL only.

## Roadmap

- Comparison view between multiple saved neighborhoods
- Buyer preferences profile page — store household type and property preferences per user so the agent always has context without re-entering the form (requires `user_preferences` Supabase table — see backend roadmap)
- Map visualization with crime and 311 data overlays on the Mapbox map (coordinates are available in both datasets)
- Scoring/rating badges per analysis section derived from the neighborhood tier data
