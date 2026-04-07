-- Add systems_mentioned to confirmed_facts so they appear on galaxy map
ALTER TABLE confirmed_facts ADD COLUMN IF NOT EXISTS systems_mentioned text[] DEFAULT '{}';

-- Populate known system references from existing facts
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Shinrarta Dezhra'] WHERE title LIKE '%Shinrarta Dezhra%';
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Tau Ceti'] WHERE title LIKE '%Tornqvist%';
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Ngurii'] WHERE title LIKE '%Soontill Relics%';
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Syreadiae JX-F c0'] WHERE title LIKE '%Zurara%';
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Teorge'] WHERE title LIKE '%Teorge%';
UPDATE confirmed_facts SET systems_mentioned = ARRAY['Arumclaw', 'Teorge'] WHERE title LIKE '%Salome%';
