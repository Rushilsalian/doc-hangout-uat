-- Insert sample trending topics (if they don't exist)
INSERT INTO public.trending_topics (name, description, tag_name, trend_score, trend_type) 
VALUES
('COVID-19 Updates', 'Latest research and treatment updates for COVID-19', 'covid-19', 95.5, 'hot'),
('AI in Diagnostics', 'Artificial Intelligence applications in medical diagnosis', 'ai-diagnostics', 87.2, 'rising'),
('Telemedicine', 'Remote patient care and digital health solutions', 'telemedicine', 78.9, 'popular'),
('Gene Therapy', 'Breakthrough treatments using genetic modification', 'gene-therapy', 72.1, 'rising'),
('Mental Health', 'Addressing mental health in medical practice', 'mental-health', 68.3, 'popular')
ON CONFLICT (name) DO NOTHING;

-- Insert sample platform statistics (if they don't exist)
INSERT INTO public.platform_stats (metric_name, metric_value, metric_type, display_label, is_featured) 
VALUES
('total_users', 15420, 'count', 'Verified Doctors', true),
('total_posts', 8730, 'count', 'Medical Discussions', true),
('total_communities', 47, 'count', 'Specialty Communities', true),
('success_rate', 96, 'percentage', 'Treatment Success Rate', true),
('response_time', 24, 'count', 'Avg Response Time (hours)', false),
('countries_active', 87, 'count', 'Countries Represented', false)
ON CONFLICT (metric_name) DO UPDATE SET
  metric_value = EXCLUDED.metric_value,
  updated_at = now();