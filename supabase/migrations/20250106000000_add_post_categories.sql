-- Add category column to posts table with ENUM values
CREATE TYPE post_category AS ENUM ('exam', 'second_opinion', 'non_medical', 'general');

ALTER TABLE public.posts 
ADD COLUMN category post_category NOT NULL DEFAULT 'general';

-- Add index for better performance when filtering by category
CREATE INDEX idx_posts_category ON public.posts(category);

-- Update existing posts to have 'general' category (already set by default)
-- No need to update existing data as default handles it