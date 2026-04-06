-- Contribution-based ranking system

-- Update rank options
alter table operatives drop constraint if exists operatives_rank_check;
alter table operatives add constraint operatives_rank_check
  check (rank in ('recruit', 'investigator', 'senior_investigator', 'analyst', 'lead_investigator', 'director'));

-- Migrate existing data
update operatives set rank = 'recruit' where rank = 'operative';
update operatives set rank = 'analyst' where rank = 'archivist';

-- Rename contribution_count to contribution_points for clarity
alter table operatives rename column contribution_count to contribution_points;

-- Function to auto-promote based on points
create or replace function update_operative_rank()
returns trigger as $$
declare
  current_rank text;
  current_points integer;
begin
  select rank, contribution_points into current_rank, current_points
  from operatives where id = new.id;

  -- Directors are manually assigned, never auto-changed
  if current_rank = 'director' then
    return new;
  end if;

  -- Auto-promote based on thresholds
  if current_points >= 500 then
    new.rank := 'lead_investigator';
  elsif current_points >= 150 then
    new.rank := 'analyst';
  elsif current_points >= 50 then
    new.rank := 'senior_investigator';
  elsif current_points >= 10 then
    new.rank := 'investigator';
  else
    new.rank := 'recruit';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_rank
  before update of contribution_points on operatives
  for each row
  execute function update_operative_rank();

-- Function to increment contribution points
create or replace function increment_contribution(operative_uuid uuid, points integer)
returns void as $$
begin
  update operatives
  set contribution_points = contribution_points + points
  where id = operative_uuid;
end;
$$ language plpgsql security definer;

-- Triggers on content tables to auto-increment points

-- Dossier submission: +3
create or replace function on_dossier_insert()
returns trigger as $$
begin
  if new.author_id is not null then
    perform increment_contribution(new.author_id, 3);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_dossier_contribution
  after insert on dossiers
  for each row
  execute function on_dossier_insert();

-- System ticket submission: +3
create or replace function on_ticket_insert()
returns trigger as $$
begin
  if new.submitted_by is not null then
    perform increment_contribution(new.submitted_by, 3);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_ticket_contribution
  after insert on system_tickets
  for each row
  execute function on_ticket_insert();

-- Evidence submission: +2
create or replace function on_evidence_insert()
returns trigger as $$
begin
  if new.submitted_by is not null then
    perform increment_contribution(new.submitted_by, 2);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_evidence_contribution
  after insert on evidence
  for each row
  execute function on_evidence_insert();

-- Intel thread: +1
create or replace function on_thread_insert()
returns trigger as $$
begin
  if new.created_by is not null then
    perform increment_contribution(new.created_by, 1);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_thread_contribution
  after insert on intel_threads
  for each row
  execute function on_thread_insert();

-- Post: +1
create or replace function on_post_insert()
returns trigger as $$
begin
  if new.author_id is not null then
    perform increment_contribution(new.author_id, 1);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_post_contribution
  after insert on posts
  for each row
  execute function on_post_insert();

-- Update RLS helper functions for new ranks

create or replace function get_operative_rank(operative_uuid uuid)
returns text as $$
  select rank from operatives where id = operative_uuid;
$$ language sql security definer stable;

create or replace function is_senior_or_above(operative_uuid uuid)
returns boolean as $$
  select rank in ('senior_investigator', 'analyst', 'lead_investigator', 'director')
  from operatives where id = operative_uuid;
$$ language sql security definer stable;

create or replace function is_analyst_or_above(operative_uuid uuid)
returns boolean as $$
  select rank in ('analyst', 'lead_investigator', 'director')
  from operatives where id = operative_uuid;
$$ language sql security definer stable;

create or replace function is_lead_or_above(operative_uuid uuid)
returns boolean as $$
  select rank in ('lead_investigator', 'director')
  from operatives where id = operative_uuid;
$$ language sql security definer stable;

-- Drop old helper
drop function if exists is_archivist_or_above(uuid);
