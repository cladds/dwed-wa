-- System data cache for EDSM and Spansh API responses

create table system_cache (
  id            uuid primary key default gen_random_uuid(),
  system_name   text not null,
  edsm_id       text,
  id64          text,
  coord_x       float8,
  coord_y       float8,
  coord_z       float8,
  edsm_data     jsonb,
  spansh_data   jsonb,
  allegiance    text,
  government    text,
  population    bigint,
  security      text,
  economy       text,
  needs_permit  boolean default false,
  fetched_at    timestamptz default now(),
  unique(system_name)
);

create index idx_system_cache_name on system_cache(system_name);
create index idx_system_cache_coords on system_cache(coord_x, coord_y, coord_z);
create index idx_system_cache_fetched on system_cache(fetched_at);

-- Allow public reads, only service role writes
alter table system_cache enable row level security;
create policy "system_cache_select" on system_cache for select using (true);
