create table if not exists codex_comments (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid references codex_articles(id) on delete cascade not null,
  content     text not null,
  author_id   uuid references operatives(id),
  author_name text not null,
  created_at  timestamptz default now()
);

create index idx_codex_comments_article on codex_comments(article_id);

alter table codex_comments enable row level security;
create policy "codex_comments_select" on codex_comments for select using (true);
create policy "codex_comments_insert" on codex_comments for insert with check (true);
create policy "codex_comments_delete" on codex_comments for delete using (true);
