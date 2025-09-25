-- Fix Security Definer View issue by recreating views without SECURITY DEFINER

-- Drop existing views that may have SECURITY DEFINER
DROP VIEW IF EXISTS public.featured_stats;
DROP VIEW IF EXISTS public.leaderboard;  
DROP VIEW IF EXISTS public.trending_posts;

-- Recreate featured_stats view without SECURITY DEFINER
CREATE VIEW public.featured_stats AS
SELECT 
  ps.metric_name,
  ps.display_label,
  ps.metric_value,
  ps.metric_type,
  ps.updated_at
FROM public.platform_stats ps
WHERE ps.is_featured = true
ORDER BY ps.metric_name;

-- Recreate leaderboard view without SECURITY DEFINER
CREATE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.rank,
  p.institution,
  COALESCE(SUM(ka.points), 0) as total_karma
FROM public.profiles p
LEFT JOIN public.karma_activities ka ON p.id = ka.user_id
GROUP BY p.id, p.display_name, p.avatar_url, p.rank, p.institution
ORDER BY total_karma DESC;

-- Recreate trending_posts view without SECURITY DEFINER
CREATE VIEW public.trending_posts AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.created_at,
  p.upvotes,
  p.category,
  prof.display_name as author_name,
  prof.rank as author_rank,
  c.name as community_name,
  COALESCE(comment_counts.comment_count, 0) as comment_count,
  -- Calculate trending score based on upvotes, recency, and engagement
  (
    p.upvotes * 0.5 + 
    COALESCE(comment_counts.comment_count, 0) * 0.3 +
    (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600)::numeric * -0.1
  ) as trending_score
FROM public.posts p
LEFT JOIN public.profiles prof ON p.author_id = prof.id
LEFT JOIN public.communities c ON p.community_id = c.id
LEFT JOIN (
  SELECT 
    post_id, 
    COUNT(*) as comment_count
  FROM public.comments 
  GROUP BY post_id
) comment_counts ON p.id = comment_counts.post_id
WHERE p.status = 'published'
  AND p.created_at > (now() - interval '7 days')
ORDER BY trending_score DESC;

-- Grant appropriate permissions for the views
GRANT SELECT ON public.featured_stats TO authenticated, anon;
GRANT SELECT ON public.leaderboard TO authenticated, anon;
GRANT SELECT ON public.trending_posts TO authenticated, anon;