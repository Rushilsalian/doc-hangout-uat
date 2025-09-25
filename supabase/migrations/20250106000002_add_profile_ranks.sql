-- Add rank column to profiles
ALTER TABLE public.profiles 
ADD COLUMN rank TEXT NOT NULL DEFAULT 'Recruit';

-- Function to calculate rank based on karma points
CREATE OR REPLACE FUNCTION public.calculate_rank(karma_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF karma_points >= 500 THEN
    RETURN 'General';
  ELSIF karma_points >= 200 THEN
    RETURN 'Captain';
  ELSIF karma_points >= 50 THEN
    RETURN 'Sergeant';
  ELSE
    RETURN 'Recruit';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user rank
CREATE OR REPLACE FUNCTION public.update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET rank = public.calculate_rank(
    COALESCE((
      SELECT SUM(points) 
      FROM public.karma_activities 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ), 0)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on karma_activities
CREATE TRIGGER update_rank_on_karma_change
  AFTER INSERT OR UPDATE OR DELETE ON public.karma_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rank();

-- Update existing user ranks
UPDATE public.profiles 
SET rank = public.calculate_rank(
  COALESCE((
    SELECT SUM(points) 
    FROM public.karma_activities 
    WHERE user_id = profiles.id
  ), 0)
);