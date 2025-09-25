import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  category: string;
  created_at: string;
  author_name: string | null;
  author_rank: string;
  community_name: string | null;
  comment_count: number;
  trending_score: number;
}

export const useTrendingPosts = (limit: number = 5) => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('trending_posts')
          .select('*')
          .limit(limit);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, [limit]);

  return { posts, loading };
};