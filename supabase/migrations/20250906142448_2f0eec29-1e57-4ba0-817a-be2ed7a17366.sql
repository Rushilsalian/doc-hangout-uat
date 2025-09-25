-- Add functions for core functionality
CREATE OR REPLACE FUNCTION public.create_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  content_param TEXT DEFAULT NULL,
  reference_id_param UUID DEFAULT NULL,
  reference_type_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO notifications (user_id, type, title, content, reference_id, reference_type)
  VALUES (user_id_param, type_param, title_param, content_param, reference_id_param, reference_type_param)
  RETURNING id;
$$;

-- Trigger function for automatic notifications on new comments
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
BEGIN
  -- Get the post author and title
  SELECT author_id, title INTO post_author_id, post_title
  FROM posts WHERE id = NEW.post_id;
  
  -- Only notify if comment author is different from post author
  IF NEW.author_id != post_author_id THEN
    -- Create notification for post author
    INSERT INTO notifications (user_id, type, title, content, reference_id, reference_type)
    VALUES (
      post_author_id,
      'comment',
      'New comment on your post',
      'Someone commented on "' || post_title || '"',
      NEW.post_id,
      'post'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS comment_notification_trigger ON public.comments;
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- Trigger function for automatic notifications on upvotes
CREATE OR REPLACE FUNCTION public.notify_on_upvote()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
BEGIN
  -- Only notify on upvotes, not downvotes
  IF NEW.vote_type = 'upvote' THEN
    -- Get the post author and title
    SELECT author_id, title INTO post_author_id, post_title
    FROM posts WHERE id = NEW.post_id;
    
    -- Only notify if voter is different from post author
    IF NEW.user_id != post_author_id THEN
      -- Create notification for post author
      INSERT INTO notifications (user_id, type, title, content, reference_id, reference_type)
      VALUES (
        post_author_id,
        'upvote',
        'Your post received an upvote',
        '"' || post_title || '" was upvoted',
        NEW.post_id,
        'post'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for upvote notifications
DROP TRIGGER IF EXISTS upvote_notification_trigger ON public.post_votes;
CREATE TRIGGER upvote_notification_trigger
  AFTER INSERT ON public.post_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_upvote();

-- Enhanced search function
CREATE OR REPLACE FUNCTION public.search_content(
  search_term TEXT,
  content_type TEXT DEFAULT 'all' -- 'posts', 'communities', 'users', 'all'
)
RETURNS TABLE (
  result_type TEXT,
  id UUID,
  title TEXT,
  content TEXT,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_score FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH post_search AS (
    SELECT 
      'post' as result_type,
      p.id,
      p.title,
      p.content,
      prof.display_name as author_name,
      p.created_at,
      -- Simple relevance scoring based on title vs content matches
      CASE 
        WHEN p.title ILIKE '%' || search_term || '%' THEN 1.0
        WHEN p.content ILIKE '%' || search_term || '%' THEN 0.7
        ELSE 0.0
      END as relevance_score
    FROM posts p
    JOIN profiles prof ON p.author_id = prof.id
    WHERE p.status = 'published' 
    AND (p.title ILIKE '%' || search_term || '%' OR p.content ILIKE '%' || search_term || '%')
    AND (content_type = 'all' OR content_type = 'posts')
  ),
  community_search AS (
    SELECT 
      'community' as result_type,
      c.id,
      c.name as title,
      c.description as content,
      prof.display_name as author_name,
      c.created_at,
      CASE 
        WHEN c.name ILIKE '%' || search_term || '%' THEN 1.0
        WHEN c.description ILIKE '%' || search_term || '%' THEN 0.8
        ELSE 0.0
      END as relevance_score
    FROM communities c
    LEFT JOIN profiles prof ON c.created_by = prof.id
    WHERE c.is_active = true
    AND (c.name ILIKE '%' || search_term || '%' OR c.description ILIKE '%' || search_term || '%')
    AND (content_type = 'all' OR content_type = 'communities')
  ),
  user_search AS (
    SELECT 
      'user' as result_type,
      prof.id,
      prof.display_name as title,
      prof.specialization as content,
      prof.display_name as author_name,
      prof.created_at,
      CASE 
        WHEN prof.display_name ILIKE '%' || search_term || '%' THEN 1.0
        WHEN prof.specialization ILIKE '%' || search_term || '%' THEN 0.8
        ELSE 0.0
      END as relevance_score
    FROM profiles prof
    WHERE prof.display_name ILIKE '%' || search_term || '%' 
    OR prof.specialization ILIKE '%' || search_term || '%'
    AND (content_type = 'all' OR content_type = 'users')
  )
  SELECT * FROM post_search
  UNION ALL
  SELECT * FROM community_search  
  UNION ALL
  SELECT * FROM user_search
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT 50;
$$;