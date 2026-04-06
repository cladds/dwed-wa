-- Row Level Security policies for Dark Wheel Archives
-- Three roles: operative, archivist, director

-- Enable RLS on all tables
alter table operatives enable row level security;
alter table dossiers enable row level security;
alter table system_tickets enable row level security;
alter table dossier_systems enable row level security;
alter table evidence enable row level security;
alter table intel_threads enable row level security;
alter table posts enable row level security;
alter table map_zones enable row level security;

-- Helper function: get current operative's rank
create or replace function get_operative_rank(operative_uuid uuid)
returns text as $$
  select rank from operatives where id = operative_uuid;
$$ language sql security definer;

-- Helper function: check if current user is at least archivist
create or replace function is_archivist_or_above(operative_uuid uuid)
returns boolean as $$
  select rank in ('archivist', 'director') from operatives where id = operative_uuid;
$$ language sql security definer;

-- Helper function: check if current user is director
create or replace function is_director(operative_uuid uuid)
returns boolean as $$
  select rank = 'director' from operatives where id = operative_uuid;
$$ language sql security definer;

-- OPERATIVES
-- Everyone can read all operatives
create policy "operatives_select" on operatives for select using (true);
-- Only directors can update operative records
create policy "operatives_update" on operatives for update using (
  is_director(auth.uid())
);

-- DOSSIERS
-- Everyone can read
create policy "dossiers_select" on dossiers for select using (true);
-- Authenticated users can create
create policy "dossiers_insert" on dossiers for insert with check (auth.uid() is not null);
-- Authors can update their own; archivists+ can update any
create policy "dossiers_update" on dossiers for update using (
  author_id = auth.uid() or is_archivist_or_above(auth.uid())
);
-- Directors can delete
create policy "dossiers_delete" on dossiers for delete using (
  is_director(auth.uid())
);

-- SYSTEM TICKETS
create policy "tickets_select" on system_tickets for select using (true);
create policy "tickets_insert" on system_tickets for insert with check (auth.uid() is not null);
create policy "tickets_update" on system_tickets for update using (
  submitted_by = auth.uid() or is_archivist_or_above(auth.uid())
);
create policy "tickets_delete" on system_tickets for delete using (
  is_director(auth.uid())
);

-- DOSSIER_SYSTEMS (junction)
create policy "dossier_systems_select" on dossier_systems for select using (true);
create policy "dossier_systems_insert" on dossier_systems for insert with check (auth.uid() is not null);
create policy "dossier_systems_delete" on dossier_systems for delete using (
  is_archivist_or_above(auth.uid())
);

-- EVIDENCE
create policy "evidence_select" on evidence for select using (true);
create policy "evidence_insert" on evidence for insert with check (auth.uid() is not null);
create policy "evidence_update" on evidence for update using (
  submitted_by = auth.uid() or is_archivist_or_above(auth.uid())
);
create policy "evidence_delete" on evidence for delete using (
  is_director(auth.uid())
);

-- INTEL THREADS
create policy "threads_select" on intel_threads for select using (true);
create policy "threads_insert" on intel_threads for insert with check (auth.uid() is not null);
create policy "threads_update" on intel_threads for update using (
  created_by = auth.uid() or is_archivist_or_above(auth.uid())
);
create policy "threads_delete" on intel_threads for delete using (
  is_director(auth.uid())
);

-- POSTS
create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() is not null);
create policy "posts_update" on posts for update using (
  author_id = auth.uid()
);
create policy "posts_delete" on posts for delete using (
  author_id = auth.uid() or is_director(auth.uid())
);

-- MAP ZONES
create policy "zones_select" on map_zones for select using (true);
create policy "zones_insert" on map_zones for insert with check (
  is_director(auth.uid())
);
create policy "zones_update" on map_zones for update using (
  is_director(auth.uid())
);
create policy "zones_delete" on map_zones for delete using (
  is_director(auth.uid())
);
