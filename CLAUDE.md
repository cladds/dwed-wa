# darkwheel.space

## What this is
The Dark Wheel Archives - a collaborative investigation platform for the Independent Raxxla Hunters (IRH), an Elite Dangerous community investigating Raxxla and related mysteries.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + real-time) via Netlify integration, NextAuth with Discord OAuth
- Hosted on Netlify
- Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

## Key conventions
- TypeScript everywhere, no `any`
- Server components by default, `use client` only for interactivity/real-time
- Supabase queries via `lib/supabase/server.ts` in server components
- Tailwind only, no CSS modules or styled-components
- No inline styles except dynamic values from DB
- Skeleton loaders, not spinners
- No m-dashes in user-facing text (house style)

## In-universe language
- Users = **Operatives** (not members)
- Theories = **Dossiers** (not posts)
- Systems = **Coordinates** (not locations)
- Debunked = **REDACTED**
- Login = **CMDR Designation**
- Activity feed = **Live Intel Feed**
- Knowledge base = **The Codex**

## Aesthetic
Dark, aged, archival. Not sci-fi clean. Not generic dark mode.
- Headings: Cinzel Decorative
- System data: Courier Prime
- Body: EB Garamond
- UI labels: Cinzel (caps, spaced)
- Primary accent: gold (#c4923a)

## Roles
- operative: create content, edit own
- archivist: update statuses, pin threads, manage codex
- director: full admin

## Do not
- Use purple gradients or Inter/Roboto fonts
- Use generic SaaS UI patterns
- Fetch data in client components unless real-time
- Store sensitive data beyond discord_id, cmdr_name
