-- Create trending topics table
CREATE TABLE public.trending_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  tag_name TEXT NOT NULL,
  trend_score DECIMAL NOT NULL DEFAULT 0,
  trend_type TEXT NOT NULL DEFAULT 'hot', -- 'hot', 'rising', 'popular'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for trending topics
CREATE POLICY "Anyone can view active trending topics" 
ON public.trending_topics 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can suggest trending topics" 
ON public.trending_topics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create platform statistics table
CREATE TABLE public.platform_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL UNIQUE,
  metric_value BIGINT NOT NULL DEFAULT 0,
  metric_type TEXT NOT NULL DEFAULT 'count', -- 'count', 'percentage', 'currency'
  display_label TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for platform stats
CREATE POLICY "Anyone can view platform stats" 
ON public.platform_stats 
FOR SELECT 
USING (true);

-- Insert initial trending topics
INSERT INTO public.trending_topics (name, description, tag_name, trend_score, trend_type) VALUES
('COVID-19 Updates', 'Latest research and treatment updates for COVID-19', 'covid-19', 95.5, 'hot'),
('AI in Diagnostics', 'Artificial Intelligence applications in medical diagnosis', 'ai-diagnostics', 87.2, 'rising'),
('Telemedicine', 'Remote patient care and digital health solutions', 'telemedicine', 78.9, 'popular'),
('Gene Therapy', 'Breakthrough treatments using genetic modification', 'gene-therapy', 72.1, 'rising'),
('Mental Health', 'Addressing mental health in medical practice', 'mental-health', 68.3, 'popular');

-- Insert initial platform statistics  
INSERT INTO public.platform_stats (metric_name, metric_value, metric_type, display_label, is_featured) VALUES
('total_users', 15420, 'count', 'Verified Doctors', true),
('total_posts', 8730, 'count', 'Medical Discussions', true),
('total_communities', 47, 'count', 'Specialty Communities', true),
('success_rate', 96, 'percentage', 'Treatment Success Rate', true),
('response_time', 24, 'count', 'Avg Response Time (hours)', false),
('countries_active', 87, 'count', 'Countries Represented', false);

-- Create trigger for updating trending topics timestamps
CREATE TRIGGER update_trending_topics_updated_at
BEFORE UPDATE ON public.trending_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for featured stats
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