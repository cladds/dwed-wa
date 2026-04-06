-- Dark Wheel Archives: Initial Schema
-- All tables use gen_random_uuid() for primary keys

create table operatives (
  id              uuid primary key default gen_random_uuid(),
  discord_id      text unique not null,
  cmdr_name       text not null,
  rank            text default 'operative' check (rank in ('operative', 'archivist', 'director')),
  bio             text,
  contribution_count integer default 0,
  created_at      timestamptz default now()
);

create table dossiers (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  hypothesis      text not null,
  status          text default 'active' check (status in ('active', 'promising', 'debunked', 'verified')),
  evidence_strength integer default 1 check (evidence_strength between 1 and 5),
  tags            text[] default '{}',
  author_id       uuid references operatives(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table system_tickets (
  id              uuid primary key default gen_random_uuid(),
  system_name     text not null,
  coord_x         float8,
  coord_y         float8,
  coord_z         float8,
  edsm_id         text,
  status          text default 'speculative' check (status in ('speculative', 'investigating', 'promising', 'eliminated', 'verified')),
  score           integer default 0 check (score between 0 and 100),
  what_we_know    text,
  submitted_by    uuid references operatives(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table dossier_systems (
  dossier_id      uuid references dossiers(id) on delete cascade,
  ticket_id       uuid references system_tickets(id) on delete cascade,
  primary key (dossier_id, ticket_id)
);

create table evidence (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('screenshot', 'calculation', 'lore', 'mechanic', 'anomaly', 'video')),
  description     text not null,
  url             text,
  dossier_id      uuid references dossiers(id) on delete set null,
  ticket_id       uuid references system_tickets(id) on delete set null,
  body_name       text,
  coord_lat       float8,
  coord_lon       float8,
  is_location_specific boolean default false,
  spoiler_gated   boolean default false,
  submitted_by    uuid references operatives(id),
  created_at      timestamptz default now()
);

create table intel_threads (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  dossier_id      uuid references dossiers(id) on delete set null,
  ticket_id       uuid references system_tickets(id) on delete set null,
  pinned          boolean default false,
  created_by      uuid references operatives(id),
  created_at      timestamptz default now()
);

create table posts (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid references intel_threads(id) on delete cascade,
  content         text not null,
  author_id       uuid references operatives(id),
  created_at      timestamptz default now()
);

create table map_zones (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('permit-lock', 'naming-cluster', 'investigation', 'debunked')),
  centre_x        float8,
  centre_y        float8,
  centre_z        float8,
  radius_ly       float8,
  colour          text,
  dossier_id      uuid references dossiers(id) on delete set null,
  description     text,
  created_by      uuid references operatives(id)
);

-- Indexes for common queries
create index idx_dossiers_status on dossiers(status);
create index idx_dossiers_updated on dossiers(updated_at desc);
create index idx_system_tickets_status on system_tickets(status);
create index idx_system_tickets_name on system_tickets(system_name);
create index idx_evidence_dossier on evidence(dossier_id);
create index idx_evidence_ticket on evidence(ticket_id);
create index idx_intel_threads_dossier on intel_threads(dossier_id);
create index idx_intel_threads_ticket on intel_threads(ticket_id);
create index idx_posts_thread on posts(thread_id);
