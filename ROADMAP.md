# darkwheel.space Roadmap

## Current State (April 2026)

### Working Features
- Live at darkwheel.space with Discord OAuth
- Dashboard with live stats from Supabase
- Forum scraper: 2000+ posts from the 10-year Raxxla thread (pages 1-100 done)
- AI classifier: extracts theories, systems, evidence from scraped posts
- Theory grouper: clusters related leads into umbrella theories
- Theories page with All/Open/Forum tabs + system search
- Theory detail: summary, linked forum evidence, comments, status controls
- Theory merge for Directors
- Galaxy map with EDSM system data (pan, zoom, hover tooltips, click to filter)
- Codex article generator from source links (Claude API)
- EDSM autocomplete on submit forms
- Contribution-based ranking (Recruit through Director)
- Profile page with rank, points, bio editing
- GitHub Actions for scheduled scraping + classification

### Data Pipeline
```
Frontier Forum -> Scraper (Playwright) -> forum_posts
                                            -> Classifier (Claude Haiku) -> extracted_leads
                                                                              -> Admin review -> imported leads
                                                                                                  -> Grouper (Claude) -> theories
```

---

## Refinements Needed

### High Priority
- [ ] Scraper backlog: 100 of ~2000 pages scraped, keep running batches
- [ ] Theory grouping: re-run grouper on all imported leads with broader merging
- [ ] Galaxy map: needs more systems, better default zoom, zoom-to-fit
- [ ] Mobile responsive: sidebar doesn't collapse, needs hamburger menu
- [ ] Profanity filter on comments (word list check before insert)
- [ ] Codex article editor (edit existing articles, not just create new)

### Medium Priority
- [ ] Bulk archive actions: "Import all high confidence" button
- [ ] Theory original forum dates on list cards (not just detail page)
- [ ] Codex preview should render markdown, not show raw `##`
- [ ] Dashboard should show real contribution count for logged-in user
- [ ] System detail page needs real data (currently placeholder)
- [ ] Forum post text cleanup: strip "Click to expand", "Spoiler" artifacts

### Low Priority
- [ ] Dark/light theme toggle (probably never, the dark is the brand)
- [ ] Notification system for theory status changes
- [ ] RSS feed for new theories
- [ ] API documentation for community tools

---

## Planned Features

### Corkboard View
Conspiracy board linking theories with red string. Canvas-based, draggable theory cards connected by lines. Click a line to see the link reason. Directors/Lead Investigators can create links.

Tables needed: `theory_links (theory_a_id, theory_b_id, reason, created_by)`

### Discord Integration
- Webhook: post to a Discord channel when a new theory is created or status changes
- Bot command: `/theory search <term>` to query darkwheel.space from Discord
- Embed cards for theory links shared in Discord

### Ko-fi Integration
- Ko-fi button in sidebar footer
- Ko-fi page: https://ko-fi.com/cladds
- Supporter badge on operative profiles
- Monthly supporter tier for early access to features

### Advanced Map Features
- 3D view with Three.js (toggle from 2D Canvas)
- Trade route overlays
- Permit zone highlighting
- Theory heat map (density of investigated systems)
- System info panel on click (instead of navigating away)

### Community Features
- Operative leaderboard (top contributors)
- Theory voting (upvote/downvote for prioritisation)
- Evidence attachments (Supabase Storage for screenshots)
- Activity feed with real-time updates via Supabase subscriptions

---

## Promotion Strategy

### Approach
Internal, community-driven promotion through known people, not cold posting.

### Phase 1: Soft Launch (Current)
- Get the tool stable and populated with forum data
- Scrape all 2000 pages, classify, group into theories
- Write 5-10 Codex articles covering the major Raxxla topics
- Have a solid base of content before sharing

### Phase 2: Trusted CMDRs
- Share with 3-5 trusted commanders who are active in Raxxla research
- Get their feedback, fix pain points
- Ask them to add their own theories and evidence
- They become the first Investigators/Analysts via contribution points

### Phase 3: Community Introduction
- Share in the IRH Discord via a trusted member, not as a cold post
- Post in the Raxxla forum thread as a tool update, not self-promotion
- Frame as "here's a tool I built for the community" not "check out my website"
- Let word spread organically from the people using it

### Phase 4: Broader Reach
- Canonn Research Group: allied community, offer API integration
- Elite Dangerous subreddits: only if organic demand exists
- Frontier Forums general: only after established community use
- Content creators: if any ED YouTubers/streamers cover Raxxla research

### What NOT to do
- Don't spam subreddits or Discord servers
- Don't post in unrelated ED channels
- Don't make it sound like a product launch
- Don't pay for promotion
- Let the tool speak for itself through the people using it

---

## Technical Debt
- [ ] Supabase types file is manually maintained, should auto-generate
- [ ] Migration files need consolidation (12 files, some with workarounds)
- [ ] Rate limiter is per-instance, doesn't persist across serverless invocations
- [ ] Scraper cookies need manual refresh when they expire
- [ ] Some RLS policies are overly permissive (set during debugging)
- [ ] No error boundaries on route segments
- [ ] No loading skeletons (spec requirement, not implemented)
