-- Allow updating forum_posts (needed for pipeline to mark posts as ai_processed)
DROP POLICY IF EXISTS "forum_posts_update" ON forum_posts;
CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE USING (true);

-- Also allow insert for scraper
DROP POLICY IF EXISTS "forum_posts_insert" ON forum_posts;
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT WITH CHECK (true);

-- Allow insert/update on extracted_leads for pipeline
DROP POLICY IF EXISTS "extracted_leads_insert" ON extracted_leads;
CREATE POLICY "extracted_leads_insert" ON extracted_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "extracted_leads_update" ON extracted_leads;
CREATE POLICY "extracted_leads_update" ON extracted_leads FOR UPDATE USING (true);
