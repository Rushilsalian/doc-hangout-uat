-- Remove the featured_stats view that has security definer issues and recreate it properly
DROP VIEW IF EXISTS public.featured_stats;

-- Create the view without security definer (it will use the calling user's permissions)
CREATE VIEW public.featured_stats AS
SELECT 
  metric_name,
  metric_value,
  metric_type,
  display_label,
  updated_at
FROM public.platform_stats
WHERE is_featured = true
ORDER BY metric_value DESC;

-- Add RLS policy for the view if needed (views inherit table policies)
-- No additional action needed for RLS on views