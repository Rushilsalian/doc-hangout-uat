UPDATE featured_stats 
SET display_label = 'Active Engagement Rate', 
    metric_value = 96,
    updated_at = now()
WHERE metric_name = 'success_rate';