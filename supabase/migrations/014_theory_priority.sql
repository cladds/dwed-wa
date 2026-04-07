-- Add priority field to theories for corkboard filtering
ALTER TABLE theories ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- Index for quick corkboard queries
CREATE INDEX IF NOT EXISTS idx_theories_priority ON theories(priority DESC);
