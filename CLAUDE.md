# darkwheel.space

## What this is
A Raxxla investigation platform by CMDR Cladds. A living operations desk for tracking leads, coordinates, and evidence related to the Raxxla mystery in Elite Dangerous.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + real-time) via Netlify integration
- Hosted on Netlify
- Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
- Auth: Supabase Auth with Discord OAuth (not NextAuth)

## Key conventions
- TypeScript everywhere, no `any`
- Server components by default, `use client` only for interactivity/real-time
- Supabase queries via `lib/supabase/server.ts` in server components
- Tailwind only, no CSS modules or styled-components
- No inline styles except dynamic values from DB
- Skeleton loaders, not spinners
- No m-dashes in user-facing text (house style)

## Branding
- Brand: "darkwheel.space"
- Subtitle: "Raxxla Investigation Platform"
- NOT "Independent Raxxla Hunters" -- this is CMDR Cladds' independent work

## In-universe language
- Users = **Operatives**
- Theories = **Leads** (not dossiers/posts)
- Systems = **Coordinates**
- Debunked = **Disproven**
- Login = **Identify** / **CMDR Designation**
- Knowledge base = **The Codex**

## Lead statuses
open_lead -> under_investigation -> promising -> verified | disproven | dead_end

## Ranks (contribution-based)
- Recruit (0 pts) -- submit leads, evidence, post
- Investigator (10 pts) -- edit own leads
- Senior Investigator (50 pts) -- mark "under investigation"
- Analyst (150 pts) -- mark "promising" or "dead end"
- Lead Investigator (500 pts) -- mark "verified" or "disproven", pin threads
- Director (manual) -- full admin

## Points
- Submit lead: +3, Evidence: +2, Thread: +1, Post: +1

## External APIs
- EDSM: 5 req/min max, cache 24hr in system_cache table
- Spansh: 30 req/min max, cache in system_cache table
- Rate limiter at lib/api/rate-limiter.ts

## Aesthetic
Dark, aged, archival. Sharp edges. Not sci-fi clean, not generic dark mode.
- Headings: Cinzel Decorative
- System data: Courier Prime
- Body: EB Garamond
- UI labels: Cinzel (caps, spaced)
- Primary accent: gold (#c4923a)

## Do not
- Use purple gradients or Inter/Roboto fonts
- Use generic SaaS UI patterns
- Fetch data in client components unless real-time
- Store sensitive data beyond discord_id, cmdr_name
- Reference "IRH" or "Independent Raxxla Hunters"
