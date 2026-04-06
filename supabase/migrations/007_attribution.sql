-- Add attribution fields to dossiers and system_tickets
-- so imported forum leads credit the original theorist

alter table dossiers add column if not exists original_author text;
alter table dossiers add column if not exists source_url text;

alter table system_tickets add column if not exists original_author text;
alter table system_tickets add column if not exists source_url text;
