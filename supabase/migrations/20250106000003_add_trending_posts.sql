-- Function to calculate trending score
CREATE OR REPLACE FUNCTION public.calculate_trending_score(
  upvotes INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
RETURNS NUMERIC AS $$
DECLARE
  age_in_hours NUMERIC;
  weighted_score NUMERIC;
BEGIN
  -- Calculate age in hours (minimum 1 to avoid division by zero)
  age_in_hours := GREATEST(
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600,
    1
  );
  
  -- Calculate weighted score: (upvotes*2 + comments*1) / age_in_hours
  weighted_score := (upvotes * 2 + comment_count * 1)::NUMERIC / age_in_hours;
  
  RETURN weighted_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trending_posts view
CREATE OR REPLACE VIEW public.trending_posts AS
SELECT 
  p.*,
  profiles.display_name as author_name,
  profiles.rank as author_rank,
  communities.name as community_name,
  COALESCE(comment_counts.comment_count, 0) as comment_count,
  public.calculate_trending_score(
    p.upvotes, 
    COALESCE(comment_counts.comment_count, 0), 
    p.created_at
  ) as trending_score
FROM public.posts p
LEFT JOIN public.profiles ON p.author_id = profiles.id
LEFT JOIN public.communities ON p.community_id = communities.id
LEFT JOIN (
  SELECT 
    post_id, 
    COUNT(*) as comment_count
  FROM public.comments 
  GROUP BY post_id
) comment_counts ON p.id = comment_counts.post_id
WHERE 
  p.status = 'published'
  AND p.created_at > NOW() - INTERVAL '7 days' -- Only posts from last 7 days
ORDER BY trending_score DESC;

-- Grant access to the view
GRANT SELECT ON public.trending_posts TO authenticated, anon;