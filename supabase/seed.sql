-- Seed data for development
-- Note: In production, operatives are created via Discord OAuth

insert into operatives (discord_id, cmdr_name, rank, bio) values
  ('dev-001', 'CMDR TestPilot', 'director', 'Development account'),
  ('dev-002', 'CMDR Archivist', 'archivist', 'Test archivist account'),
  ('dev-003', 'CMDR Operative', 'operative', 'Test operative account');

-- Sample dossier
insert into dossiers (slug, title, hypothesis, status, evidence_strength, tags, author_id) values
  (
    'raxxla-witchspace',
    'Raxxla via Witchspace Anomaly',
    'Raxxla may be accessible through a specific witchspace tunnel triggered by an as-yet-unknown condition during hyperspace jumps.',
    'active',
    2,
    '{"raxxla", "witchspace", "hyperspace"}',
    (select id from operatives where discord_id = 'dev-001')
  );

-- Sample system ticket
insert into system_tickets (system_name, coord_x, coord_y, coord_z, status, score, what_we_know, submitted_by) values
  (
    'Achenar',
    67.5,
    -119.47,
    24.84,
    'investigating',
    35,
    E'CONFIRMED\n- Empire capital system\n- Permit required\n\nACTIVE THEORY\n- Historical significance may link to Dark Wheel origins\n\nRULED OUT\n- Surface scan of all landable bodies (no anomalies)\n\nOPEN QUESTIONS\n- Relationship to original Dark Wheel lore',
    (select id from operatives where discord_id = 'dev-001')
  );
