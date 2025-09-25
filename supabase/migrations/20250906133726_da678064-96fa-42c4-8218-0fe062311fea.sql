-- Fix remaining Security Definer Views by removing SECURITY DEFINER property
-- Drop and recreate the views without SECURITY DEFINER

-- Fix featured_stats view
DROP VIEW IF EXISTS public.featured_stats;
CREATE VIEW public.featured_stats AS
SELECT 
    metric_name,
    metric_type,
    metric_value,
    display_label,
    updated_at
FROM public.platform_stats
WHERE is_featured = true
ORDER BY metric_name;

-- Fix leaderboard view
DROP VIEW IF EXISTS public.leaderboard;
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

-- Fix trending_posts view
DROP VIEW IF EXISTS public.trending_posts;
CREATE VIEW public.trending_posts AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.upvotes,
    p.created_at,
    p.category,
    pr.display_name as author_name,
    pr.rank as author_rank,
    c.name as community_name,
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    -- Calculate trending score based on upvotes, recency, and comments
    (p.upvotes * 2 + COALESCE(comment_counts.comment_count, 0)) * 
    EXP(-EXTRACT(epoch FROM (NOW() - p.created_at)) / 86400.0) as trending_score
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
LEFT JOIN public.communities c ON p.community_id = c.id
LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM public.comments
    GROUP BY post_id
) comment_counts ON p.id = comment_counts.post_id
WHERE p.status = 'published'
ORDER BY trending_score DESC;

-- Fix function search paths for the encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_license_number(license_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple obfuscation - in production, use proper encryption
  -- This is a placeholder that hashes the license number
  RETURN encode(digest(license_text || current_setting('app.settings.salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.encrypt_profile_license()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_number IS NOT NULL AND NEW.license_number != OLD.license_number THEN
    -- Store the encrypted version
    NEW.license_number = public.encrypt_license_number(NEW.license_number);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;