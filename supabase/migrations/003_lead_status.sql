-- Unified lead status system for dossiers and system tickets

-- Update dossier statuses
alter table dossiers drop constraint if exists dossiers_status_check;
alter table dossiers add constraint dossiers_status_check
  check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end'));

-- Migrate existing data
update dossiers set status = 'open_lead' where status = 'active';
update dossiers set status = 'disproven' where status = 'debunked';

-- Add audit columns
alter table dossiers add column if not exists status_changed_by uuid references operatives(id);
alter table dossiers add column if not exists status_changed_at timestamptz;

-- Update system ticket statuses
alter table system_tickets drop constraint if exists system_tickets_status_check;
alter table system_tickets add constraint system_tickets_status_check
  check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end'));

-- Migrate existing data
update system_tickets set status = 'open_lead' where status = 'speculative';
update system_tickets set status = 'under_investigation' where status = 'investigating';
update system_tickets set status = 'disproven' where status = 'eliminated';

-- Add audit columns
alter table system_tickets add column if not exists status_changed_by uuid references operatives(id);
alter table system_tickets add column if not exists status_changed_at timestamptz;
