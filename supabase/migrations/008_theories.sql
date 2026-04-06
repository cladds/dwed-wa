-- Theories table: groups extracted leads and evidence into coherent theories

create table theories (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  summary         text not null,
  status          text default 'open_lead' check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end')),
  category        text not null check (category in ('theory', 'system', 'lore', 'mechanic', 'evidence')),
  source          text default 'open' check (source in ('open', 'forum')),
  systems_mentioned text[] default '{}',
  evidence_count  integer default 0,
  source_post_count integer default 0,
  created_by      uuid references operatives(id),
  original_author text,
  source_url      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_theories_status on theories(status);
create index idx_theories_category on theories(category);
create index idx_theories_source on theories(source);
create index idx_theories_slug on theories(slug);

-- Link extracted leads to theories
alter table extracted_leads add column if not exists theory_id uuid references theories(id) on delete set null;
create index idx_extracted_leads_theory on extracted_leads(theory_id);

-- RLS
alter table theories enable row level security;
create policy "theories_select" on theories for select using (true);
create policy "theories_insert" on theories for insert with check (true);
create policy "theories_update" on theories for update using (
  is_senior_or_above(auth.uid()) or created_by = auth.uid()
);
create policy "theories_delete" on theories for delete using (
  is_lead_or_above(auth.uid())
);
