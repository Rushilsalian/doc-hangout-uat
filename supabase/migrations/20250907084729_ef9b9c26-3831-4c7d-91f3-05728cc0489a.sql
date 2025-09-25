-- Create missing storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('post-attachments', 'post-attachments', true);

-- Create storage policies for post attachments
CREATE POLICY "Anyone can view post attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-attachments');

CREATE POLICY "Authenticated users can upload post attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own post attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'post-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'post-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix search_path issues in functions
CREATE OR REPLACE FUNCTION public.update_user_rank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_karma INTEGER;
  new_rank TEXT;
BEGIN
  -- Calculate total karma for user
  SELECT COALESCE(SUM(points), 0) INTO user_karma
  FROM public.karma_activities 
  WHERE user_id = NEW.user_id;
  
  -- Calculate new rank
  new_rank := public.calculate_user_rank(user_karma);
  
  -- Update user rank
  UPDATE public.profiles 
  SET rank = new_rank 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for karma updates on posts
CREATE OR REPLACE FUNCTION public.award_karma_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Award karma for creating a post
    INSERT INTO public.karma_activities (user_id, activity_type, points, description)
    VALUES (NEW.author_id, 'post_created', 10, 'Created a new post: ' || NEW.title);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for karma on post creation
CREATE TRIGGER award_karma_on_post_creation
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.award_karma_on_post();

-- Create trigger for karma on comments
CREATE OR REPLACE FUNCTION public.award_karma_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Award karma for creating a comment
    INSERT INTO public.karma_activities (user_id, activity_type, points, description)
    VALUES (NEW.author_id, 'comment_created', 3, 'Created a comment');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for karma on comment creation
CREATE TRIGGER award_karma_on_comment_creation
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.award_karma_on_comment();

-- Create trigger for karma on votes
CREATE OR REPLACE FUNCTION public.award_karma_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get post author
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Award karma to post author for upvotes
    IF NEW.vote_type = 'upvote' THEN
      INSERT INTO public.karma_activities (user_id, activity_type, points, description)
      VALUES (post_author_id, 'upvote_received', 5, 'Received an upvote');
    ELSIF NEW.vote_type = 'downvote' THEN
      INSERT INTO public.karma_activities (user_id, activity_type, points, description)
      VALUES (post_author_id, 'downvote_received', -2, 'Received a downvote');
    END IF;
    
    -- Award karma to voter for participating
    INSERT INTO public.karma_activities (user_id, activity_type, points, description)
    VALUES (NEW.user_id, 'vote_cast', 1, 'Cast a vote');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for karma on votes
CREATE TRIGGER award_karma_on_vote_creation
AFTER INSERT ON public.post_votes
FOR EACH ROW
EXECUTE FUNCTION public.award_karma_on_vote();