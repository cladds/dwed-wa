-- Theory links for the corkboard view

create table theory_links (
  id          uuid primary key default gen_random_uuid(),
  theory_a_id uuid references theories(id) on delete cascade not null,
  theory_b_id uuid references theories(id) on delete cascade not null,
  reason      text not null,
  created_by  uuid references operatives(id),
  created_at  timestamptz default now(),
  constraint different_theories check (theory_a_id != theory_b_id),
  constraint unique_link unique (theory_a_id, theory_b_id)
);

create index idx_theory_links_a on theory_links(theory_a_id);
create index idx_theory_links_b on theory_links(theory_b_id);

alter table theory_links enable row level security;
create policy "links_select" on theory_links for select using (true);
create policy "links_insert" on theory_links for insert with check (true);
create policy "links_delete" on theory_links for delete using (true);
