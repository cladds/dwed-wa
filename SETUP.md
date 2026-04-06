# darkwheel.space -- Setup Guide

## 1. Supabase: Run Migrations

Your project is live at `lbxioliuyvjpenocljff.supabase.co`. Now you need to create the tables.

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it
3. Paste the contents of `supabase/migrations/002_rls_policies.sql` and run it
4. (Optional) Paste `supabase/seed.sql` to add test data

Verify: go to **Table Editor** and confirm you see these tables:
- operatives
- dossiers
- system_tickets
- dossier_systems
- evidence
- intel_threads
- posts
- map_zones

## 2. Supabase: Enable Realtime

The Live Intel Feed needs realtime subscriptions. Run this in the **SQL Editor**:

```sql
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table evidence;
alter publication supabase_realtime add table dossiers;
alter publication supabase_realtime add table system_tickets;
```

To verify it worked, run:
```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

## 3. Supabase: Discord Auth

1. Go to **Authentication > Providers**
2. Enable **Discord**
3. You'll need a Discord application:
   - Go to https://discord.com/developers/applications
   - Click **New Application**, name it "The Dark Wheel Archives"
   - Go to **OAuth2** in the sidebar
   - Copy the **Client ID** and **Client Secret**
   - Add redirect URL: `https://lbxioliuyvjpenocljff.supabase.co/auth/v1/callback`
   - Also add: `http://localhost:3000/auth/callback` (for local dev)
4. Back in Supabase, paste the Client ID and Client Secret
5. Save

## 4. Netlify: Connect Repo

1. Go to your Netlify dashboard
2. **Add new site > Import an existing project**
3. Connect to GitHub and select `cladds/dwed-wa`
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 20 (set in Environment variables as `NODE_VERSION=20`)
5. Deploy

## 5. Netlify: Environment Variables

Go to **Site settings > Environment variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lbxioliuyvjpenocljff.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | (your publishable key from .env.local) |
| `NEXTAUTH_URL` | `https://darkwheel.space` (or your Netlify URL until domain is set) |
| `NEXTAUTH_SECRET` | Generate one: run `openssl rand -base64 32` in terminal |
| `DISCORD_CLIENT_ID` | (from step 3) |
| `DISCORD_CLIENT_SECRET` | (from step 3) |

If Netlify already injected the Supabase vars via the integration, you can skip those two.

## 6. Netlify: Next.js Runtime

Netlify needs the Next.js runtime plugin to handle server components and middleware.

1. Go to **Site settings > Build & deploy > Plugins**
2. Search for **@netlify/plugin-nextjs** and install it
3. Or add to `netlify.toml` (create this file in project root):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## 7. Custom Domain (when ready)

1. In Netlify: **Domain management > Add custom domain** > `darkwheel.space`
2. Update DNS records at your registrar:
   - Point `darkwheel.space` to Netlify (they'll give you the DNS target)
   - Or use Netlify DNS
3. Netlify auto-provisions HTTPS via Let's Encrypt
4. Update `NEXTAUTH_URL` env var to `https://darkwheel.space`
5. Add `https://darkwheel.space/auth/callback` to your Discord OAuth redirect URLs

## 8. Supabase: Update Redirect URLs

Once your domain is live, go to **Authentication > URL Configuration** in Supabase:
- **Site URL:** `https://darkwheel.space`
- **Redirect URLs:** add `https://darkwheel.space/auth/callback`

## Quick Verification Checklist

After setup, confirm:

- [ ] `npm run dev` loads the landing page at localhost:3000
- [ ] Tables visible in Supabase Table Editor
- [ ] Netlify deploys successfully from GitHub
- [ ] Site loads at your Netlify URL
- [ ] Discord login redirects correctly (once auth is wired up)
