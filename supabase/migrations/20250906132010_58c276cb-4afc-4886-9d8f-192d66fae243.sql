-- Fix security issues with views and functions

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.trending_posts;
DROP VIEW IF EXISTS public.leaderboard;

-- Create trending posts view (non-security definer)
CREATE VIEW public.trending_posts AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.upvotes,
  p.category,
  p.created_at,
  pr.display_name as author_name,
  pr.rank as author_rank,
  c.name as community_name,
  (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id) as comment_count,
  -- Simple trending score calculation
  (p.upvotes * 2 + (SELECT COUNT(*) FROM public.comments WHERE post_id = p.id) * 1.5) as trending_score
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
LEFT JOIN public.communities c ON p.community_id = c.id
WHERE p.status = 'published';

-- Create leaderboard view (non-security definer)
CREATE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.display_name,
  p.institution,
  p.rank,
  p.avatar_url,
  COALESCE(SUM(ka.points), 0) as total_karma
FROM public.profiles p
LEFT JOIN public.karma_activities ka ON p.id = ka.user_id
GROUP BY p.id, p.display_name, p.institution, p.rank, p.avatar_url;

-- Update function search path (fix warning)
CREATE OR REPLACE FUNCTION public.calculate_user_rank(user_karma INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN user_karma >= 10000 THEN RETURN 'General';
    WHEN user_karma >= 5000 THEN RETURN 'Colonel';
    WHEN user_karma >= 2500 THEN RETURN 'Major';
    WHEN user_karma >= 1000 THEN RETURN 'Captain';
    WHEN user_karma >= 500 THEN RETURN 'Lieutenant';
    WHEN user_karma >= 100 THEN RETURN 'Sergeant';
    WHEN user_karma >= 50 THEN RETURN 'Corporal';
    WHEN user_karma >= 10 THEN RETURN 'Private';
    ELSE RETURN 'Rookie';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;