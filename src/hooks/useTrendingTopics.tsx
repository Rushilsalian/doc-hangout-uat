import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingTopic {
  id: string;
  name: string;
  description: string | null;
  tag_name: string;
  trend_score: number;
  trend_type: 'hot' | 'rising' | 'popular';
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useTrendingTopics = (limit: number = 5) => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const { data, error } = await supabase
          .from('trending_topics')
          .select('*')
          .eq('is_active', true)
          .order('trend_score', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setTopics((data || []) as TrendingTopic[]);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, [limit]);

  const getTrendTypeLabel = (type: string) => {
    switch (type) {
      case 'hot': return 'Hot';
      case 'rising': return 'Rising';
      case 'popular': return 'Popular';
      default: return 'Trending';
    }
  };

  const getTrendTypeVariant = (type: string) => {
    switch (type) {
      case 'hot': return 'destructive';
      case 'rising': return 'default';
      case 'popular': return 'secondary';
      default: return 'outline';
    }
  };

  return { 
    topics, 
    loading, 
    getTrendTypeLabel, 
    getTrendTypeVariant 
  };
};