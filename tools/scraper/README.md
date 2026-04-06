# Raxxla Thread Scraper

Scrapes the "Quest to Find Raxxla" thread from Frontier Forums and stores posts in Supabase.

## Setup

```bash
cd tools/scraper
npm install
npx playwright install chromium
```

## Cookie Setup

The scraper needs your Frontier Forums session cookies to bypass Cloudflare.

1. Open your browser and log into https://forums.frontier.co.uk
2. Navigate to the Raxxla thread to confirm access
3. Use a cookie export extension (Cookie-Editor, EditThisCookie)
4. Export cookies for `forums.frontier.co.uk`
5. Save as `tools/scraper/cookies.json`

Format:
```json
[
  { "name": "xf_session", "value": "your_session_value", "domain": ".frontier.co.uk", "path": "/" },
  { "name": "xf_user", "value": "your_user_value", "domain": ".frontier.co.uk", "path": "/" }
]
```

## Environment Variables

```bash
export SUPABASE_URL="https://lbxioliuyvjpenocljff.supabase.co"
export SUPABASE_SERVICE_KEY="your_service_role_key"
```

Use the service role key (not the publishable key) so the scraper can write to the forum_posts table.

## Running

```bash
# Scrape 50 pages (resumes from last scraped page)
npm run scrape

# Run again to continue
npm run scrape
```

The scraper:
- Resumes from where it left off (checks DB for last page)
- Processes 50 pages per run (~8-10 minutes)
- Waits 8-12 seconds between pages
- Retries failed pages up to 3 times
- Stops if it hits 3 consecutive empty pages (end of thread)

Full thread (~2000 pages) takes ~40 runs.

## Monitor (after initial scrape)

```bash
npm run monitor
```

Checks for new pages added since last scrape.
