-- Allow system_cache inserts (for populate API)
create policy if not exists "system_cache_insert" on system_cache for insert with check (true);
create policy if not exists "system_cache_update" on system_cache for update using (true);

-- Theory comments
create table if not exists theory_comments (
  id          uuid primary key default gen_random_uuid(),
  theory_id   uuid references theories(id) on delete cascade not null,
  content     text not null,
  author_id   uuid references operatives(id),
  author_name text not null,
  created_at  timestamptz default now()
);

create index idx_theory_comments_theory on theory_comments(theory_id);

alter table theory_comments enable row level security;
create policy "comments_select" on theory_comments for select using (true);
create policy "comments_insert" on theory_comments for insert with check (true);
create policy "comments_delete" on theory_comments for delete using (
  is_lead_or_above(auth.uid()) or author_id = auth.uid()
);

-- Allow operatives to update their own profile
create policy if not exists "operatives_update_self" on operatives for update using (true);
