import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  timeRange?: '24h' | 'week' | 'month' | 'all';
  sortBy?: 'recent' | 'popular';
  category?: 'exam' | 'second_opinion' | 'non_medical' | 'general' | 'all';
}

export const globalSearch = async (query: string, filters: SearchFilters = {}) => {
  const { timeRange = 'all', sortBy = 'recent', category = 'all' } = filters;
  
  // Calculate time filter
  let timeFilter = '';
  if (timeRange !== 'all') {
    const now = new Date();
    const timeMap = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      'week': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      'month': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    timeFilter = timeMap[timeRange].toISOString();
  }

  // Search posts
  let postsQuery = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(display_name, rank),
      community:communities(name),
      post_tags(tag)
    `)
    .eq('status', 'published')
    .textSearch('title', query, { type: 'websearch' });

  if (timeFilter) {
    postsQuery = postsQuery.gte('created_at', timeFilter);
  }
  
  if (category !== 'all') {
    postsQuery = postsQuery.eq('category', category);
  }

  if (sortBy === 'popular') {
    postsQuery = postsQuery.order('upvotes', { ascending: false });
  } else {
    postsQuery = postsQuery.order('created_at', { ascending: false });
  }

  // Search communities
  const communitiesQuery = supabase
    .from('communities')
    .select('*')
    .eq('is_active', true)
    .textSearch('name', query, { type: 'websearch' });

  // Search users
  const usersQuery = supabase
    .from('profiles')
    .select('id, display_name, institution, rank, specialization')
    .textSearch('display_name', query, { type: 'websearch' });

  const [postsResult, communitiesResult, usersResult] = await Promise.all([
    postsQuery.limit(20),
    communitiesQuery.limit(10),
    usersQuery.limit(10)
  ]);

  return {
    posts: postsResult.data || [],
    communities: communitiesResult.data || [],
    users: usersResult.data || [],
    errors: {
      posts: postsResult.error,
      communities: communitiesResult.error,
      users: usersResult.error
    }
  };
};