-- Forum post archive and AI extraction tables

create table forum_posts (
  id              uuid primary key default gen_random_uuid(),
  forum_post_id   text unique not null,
  thread_id       text not null default '168253',
  page_number     integer not null,
  post_number     integer,
  author_name     text not null,
  author_id       text,
  content_html    text not null,
  content_text    text not null,
  posted_at       timestamptz,
  scraped_at      timestamptz default now(),
  ai_processed    boolean default false,
  ai_processed_at timestamptz
);

create index idx_forum_posts_thread on forum_posts(thread_id);
create index idx_forum_posts_page on forum_posts(page_number);
create index idx_forum_posts_processed on forum_posts(ai_processed);
create index idx_forum_posts_posted on forum_posts(posted_at);

create table extracted_leads (
  id              uuid primary key default gen_random_uuid(),
  forum_post_id   uuid references forum_posts(id) on delete cascade,
  lead_type       text not null check (lead_type in ('theory', 'system', 'evidence', 'lore', 'mechanic')),
  title           text not null,
  summary         text not null,
  systems_mentioned text[] default '{}',
  coordinates     jsonb,
  confidence      text default 'low' check (confidence in ('low', 'medium', 'high')),
  status          text default 'unreviewed' check (status in ('unreviewed', 'imported', 'dismissed')),
  original_author text,                   -- forum username for credit
  source_url      text,                   -- direct link to forum post
  linked_dossier_id uuid references dossiers(id) on delete set null,
  linked_ticket_id  uuid references system_tickets(id) on delete set null,
  created_at      timestamptz default now()
);

create index idx_extracted_leads_status on extracted_leads(status);
create index idx_extracted_leads_type on extracted_leads(lead_type);
create index idx_extracted_leads_confidence on extracted_leads(confidence);
create index idx_extracted_leads_post on extracted_leads(forum_post_id);

-- RLS
alter table forum_posts enable row level security;
alter table extracted_leads enable row level security;

create policy "forum_posts_select" on forum_posts for select using (true);
create policy "extracted_leads_select" on extracted_leads for select using (true);

-- Only directors can modify extracted leads status
create policy "extracted_leads_update" on extracted_leads for update using (
  is_lead_or_above(auth.uid())
);
