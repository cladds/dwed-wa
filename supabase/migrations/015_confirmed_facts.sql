-- Confirmed facts: verified statements about Raxxla from official sources
-- These form the foundation that all theories are measured against

CREATE TABLE confirmed_facts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text NOT NULL,
  source_person   text,                    -- who said/confirmed it (David Braben, Michael Brookes, Drew Wagar, etc.)
  source_type     text NOT NULL DEFAULT 'developer' CHECK (source_type IN ('developer', 'in_game', 'novel', 'community', 'debunked')),
  source_url      text,
  source_date     text,                    -- when it was said/confirmed
  status          text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'unconfirmed', 'debunked', 'rumour')),
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Link theories to confirmed facts (consistent or contradicts)
CREATE TABLE theory_fact_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theory_id       uuid NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  fact_id         uuid NOT NULL REFERENCES confirmed_facts(id) ON DELETE CASCADE,
  relationship    text NOT NULL CHECK (relationship IN ('supports', 'contradicts', 'neutral')),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(theory_id, fact_id)
);

CREATE INDEX idx_confirmed_facts_status ON confirmed_facts(status);
CREATE INDEX idx_theory_fact_links_theory ON theory_fact_links(theory_id);
CREATE INDEX idx_theory_fact_links_fact ON theory_fact_links(fact_id);

ALTER TABLE confirmed_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_fact_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read facts
CREATE POLICY "facts_select" ON confirmed_facts FOR SELECT USING (true);
CREATE POLICY "fact_links_select" ON theory_fact_links FOR SELECT USING (true);

-- Lead investigators+ can manage
CREATE POLICY "facts_insert" ON confirmed_facts FOR INSERT WITH CHECK (true);
CREATE POLICY "facts_update" ON confirmed_facts FOR UPDATE USING (true);
CREATE POLICY "facts_delete" ON confirmed_facts FOR DELETE USING (true);
CREATE POLICY "fact_links_insert" ON theory_fact_links FOR INSERT WITH CHECK (true);
CREATE POLICY "fact_links_update" ON theory_fact_links FOR UPDATE USING (true);
CREATE POLICY "fact_links_delete" ON theory_fact_links FOR DELETE USING (true);
