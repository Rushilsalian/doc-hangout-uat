-- Create AI summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  summary_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  model_used TEXT DEFAULT 'medical-gpt-v1'
);

-- Create analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  label TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 1),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_summaries_post_id ON ai_summaries(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_label ON analyses(label);

-- Enable RLS
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_summaries
CREATE POLICY "AI summaries are viewable by everyone" 
ON ai_summaries FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create AI summaries" 
ON ai_summaries FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS Policies for analyses
CREATE POLICY "Analyses are viewable by everyone" 
ON analyses FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create analyses" 
ON analyses FOR INSERT TO authenticated
WITH CHECK (true);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_content(TEXT, TEXT);

-- Add search function for content
CREATE FUNCTION search_content(
  search_term TEXT,
  content_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
  result_type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  author_name TEXT,
  created_at TIMESTAMPTZ,
  relevance_score NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Search posts
  IF content_type = 'all' OR content_type = 'posts' THEN
    RETURN QUERY
    SELECT 
      'post'::TEXT as result_type,
      p.id,
      p.title,
      p.content,
      pr.display_name as author_name,
      p.created_at,
      CASE 
        WHEN p.title ILIKE '%' || search_term || '%' THEN 0.9
        WHEN p.content ILIKE '%' || search_term || '%' THEN 0.7
        ELSE 0.5
      END as relevance_score
    FROM posts p
    LEFT JOIN profiles pr ON p.author_id = pr.id
    WHERE p.status = 'published'
      AND (p.title ILIKE '%' || search_term || '%' OR p.content ILIKE '%' || search_term || '%')
    ORDER BY relevance_score DESC, p.created_at DESC
    LIMIT 20;
  END IF;

  -- Search communities
  IF content_type = 'all' OR content_type = 'communities' THEN
    RETURN QUERY
    SELECT 
      'community'::TEXT as result_type,
      c.id,
      c.name as title,
      c.description as content,
      pr.display_name as author_name,
      c.created_at,
      CASE 
        WHEN c.name ILIKE '%' || search_term || '%' THEN 0.9
        WHEN c.description ILIKE '%' || search_term || '%' THEN 0.7
        ELSE 0.5
      END as relevance_score
    FROM communities c
    LEFT JOIN profiles pr ON c.created_by = pr.id
    WHERE c.is_active = true
      AND (c.name ILIKE '%' || search_term || '%' OR c.description ILIKE '%' || search_term || '%')
    ORDER BY relevance_score DESC, c.created_at DESC
    LIMIT 10;
  END IF;

  -- Search users
  IF content_type = 'all' OR content_type = 'users' THEN
    RETURN QUERY
    SELECT 
      'user'::TEXT as result_type,
      pr.id,
      pr.display_name as title,
      COALESCE(pr.specialization || ' • ' || pr.institution, pr.specialization, pr.institution, '') as content,
      pr.display_name as author_name,
      pr.created_at,
      CASE 
        WHEN pr.display_name ILIKE '%' || search_term || '%' THEN 0.9
        WHEN pr.specialization ILIKE '%' || search_term || '%' THEN 0.8
        WHEN pr.institution ILIKE '%' || search_term || '%' THEN 0.7
        ELSE 0.5
      END as relevance_score
    FROM profiles pr
    WHERE pr.display_name ILIKE '%' || search_term || '%' 
       OR pr.specialization ILIKE '%' || search_term || '%'
       OR pr.institution ILIKE '%' || search_term || '%'
    ORDER BY relevance_score DESC, pr.created_at DESC
    LIMIT 10;
  END IF;
END;
$$;