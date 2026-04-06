-- Codex articles: curated knowledge base pages

create table codex_articles (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  content         text not null,            -- markdown content
  excerpt         text,                     -- short description for cards
  category        text not null check (category in ('mystery', 'lore', 'faction', 'location', 'mechanic', 'history', 'guide')),
  cover_image     text,                     -- optional image URL
  sources         jsonb default '[]',       -- array of {url, title, type} source links
  tags            text[] default '{}',
  published       boolean default false,
  created_by      uuid references operatives(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_codex_slug on codex_articles(slug);
create index idx_codex_category on codex_articles(category);
create index idx_codex_published on codex_articles(published);

alter table codex_articles enable row level security;
create policy "codex_select" on codex_articles for select using (published = true);
create policy "codex_select_drafts" on codex_articles for select using (
  is_senior_or_above(auth.uid())
);
create policy "codex_insert" on codex_articles for insert with check (
  is_lead_or_above(auth.uid())
);
create policy "codex_update" on codex_articles for update using (
  is_lead_or_above(auth.uid())
);
create policy "codex_delete" on codex_articles for delete using (
  is_lead_or_above(auth.uid())
);
