import { supabase } from '@/integrations/supabase/client';

export const fetchLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(10);

    if (error) throw error;

    return data?.map(user => ({
      id: user.id,
      display_name: user.display_name,
      institution: user.institution,
      rank: user.rank,
      avatar_url: user.avatar_url,
      totalKarma: user.total_karma
    })) || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};