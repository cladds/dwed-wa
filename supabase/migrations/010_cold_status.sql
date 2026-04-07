-- Add "cold" status for theories with no activity

alter table theories drop constraint if exists theories_status_check;
alter table theories add constraint theories_status_check
  check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end', 'cold'));

alter table dossiers drop constraint if exists dossiers_status_check;
alter table dossiers add constraint dossiers_status_check
  check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end', 'cold'));

alter table system_tickets drop constraint if exists system_tickets_status_check;
alter table system_tickets add constraint system_tickets_status_check
  check (status in ('open_lead', 'under_investigation', 'promising', 'verified', 'disproven', 'dead_end', 'cold'));
