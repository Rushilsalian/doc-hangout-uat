import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Function to update platform statistics dynamically
export const updatePlatformStats = async () => {
  try {
    // Get actual counts from database
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: communityCount } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Update statistics in database
    const updates = [
      { metric_name: 'total_users', metric_value: userCount || 0 },
      { metric_name: 'total_posts', metric_value: postCount || 0 },
      { metric_name: 'total_communities', metric_value: communityCount || 0 }
    ];

    for (const update of updates) {
      await supabase
        .from('platform_stats')
        .update({ 
          metric_value: update.metric_value,
          updated_at: new Date().toISOString()
        })
        .eq('metric_name', update.metric_name);
    }

    console.log('Platform statistics updated successfully');
  } catch (error) {
    console.error('Error updating platform stats:', error);
  }
};

// Hook to automatically update stats when data changes
export const useStatsUpdater = () => {
  useEffect(() => {
    // Update stats on mount
    updatePlatformStats();

    // Set up real-time listeners for data changes
    const postsChannel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => updatePlatformStats()
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => updatePlatformStats()
      )
      .subscribe();

    const communitiesChannel = supabase
      .channel('communities-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'communities' },
        () => updatePlatformStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(communitiesChannel);
    };
  }, []);
};