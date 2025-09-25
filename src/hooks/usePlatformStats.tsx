import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStat {
  metric_name: string;
  metric_value: number;
  metric_type: 'count' | 'percentage' | 'currency';
  display_label: string;
  updated_at: string;
}

export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('featured_stats')
          .select('*');

        if (error) throw error;
        setStats((data || []) as PlatformStat[]);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatStatValue = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'count':
      default:
        return value.toLocaleString();
    }
  };

  return { 
    stats, 
    loading, 
    formatStatValue 
  };
};