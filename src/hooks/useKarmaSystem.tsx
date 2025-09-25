import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface KarmaActivity {
  id: string;
  user_id: string;
  activity_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export interface UserKarmaStats {
  totalKarma: number;
  rank: string;
  recentActivities: KarmaActivity[];
  rankProgress: {
    current: number;
    next: number;
    progress: number;
    nextRank: string;
  };
}

export type KarmaActivityType = 
  | 'CREATE_POST'
  | 'CREATE_COMMENT' 
  | 'GIVE_UPVOTE'
  | 'JOIN_COMMUNITY'
  | 'CREATE_COMMUNITY'
  | 'RECEIVE_UPVOTE'
  | 'RECEIVE_DOWNVOTE'
  | 'MODERATION_PENALTY';

const KARMA_POINTS: Record<KarmaActivityType, number> = {
  CREATE_POST: 10,
  CREATE_COMMENT: 3,
  GIVE_UPVOTE: 1,
  JOIN_COMMUNITY: 5,
  CREATE_COMMUNITY: 15,
  RECEIVE_UPVOTE: 5,
  RECEIVE_DOWNVOTE: -2,
  MODERATION_PENALTY: -20
};

const RANK_THRESHOLDS = [
  { min: 0, rank: "Rookie" },
  { min: 10, rank: "Private" },
  { min: 50, rank: "Corporal" },
  { min: 100, rank: "Sergeant" },
  { min: 500, rank: "Lieutenant" },
  { min: 1000, rank: "Captain" },
  { min: 2500, rank: "Major" },
  { min: 5000, rank: "Colonel" },
  { min: 10000, rank: "General" }
];

export const useKarmaSystem = () => {
  const [karmaStats, setKarmaStats] = useState<UserKarmaStats>({
    totalKarma: 0,
    rank: "Rookie",
    recentActivities: [],
    rankProgress: { current: 0, next: 10, progress: 0, nextRank: "Private" }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const calculateRankProgress = (totalKarma: number, currentRank: string) => {
    const currentRankIndex = RANK_THRESHOLDS.findIndex(r => r.rank === currentRank);
    const nextRankIndex = currentRankIndex + 1;
    
    if (nextRankIndex >= RANK_THRESHOLDS.length) {
      return { current: totalKarma, next: totalKarma, progress: 100, nextRank: "Max Level" };
    }
    
    const currentThreshold = RANK_THRESHOLDS[currentRankIndex].min;
    const nextThreshold = RANK_THRESHOLDS[nextRankIndex].min;
    const progress = ((totalKarma - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return {
      current: currentThreshold,
      next: nextThreshold,
      progress: Math.min(progress, 100),
      nextRank: RANK_THRESHOLDS[nextRankIndex].rank
    };
  };

  const fetchKarmaStats = async () => {
    if (!user) {
      setKarmaStats({
        totalKarma: 0,
        rank: "Rookie",
        recentActivities: [],
        rankProgress: { current: 0, next: 10, progress: 0, nextRank: "Private" }
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch karma activities
      const { data: activities, error: activitiesError } = await supabase
        .from('karma_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) throw activitiesError;

      // Calculate total karma
      const totalKarma = activities?.reduce((sum, activity) => sum + activity.points, 0) || 0;
      
      // Get current rank from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rank')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentRank = profile.rank || "Rookie";
      const rankProgress = calculateRankProgress(totalKarma, currentRank);

      setKarmaStats({
        totalKarma,
        rank: currentRank,
        recentActivities: activities || [],
        rankProgress
      });
    } catch (error) {
      console.error('Error fetching karma stats:', error);
      toast({
        title: "Error",
        description: "Failed to load karma statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKarma = async (activityType: KarmaActivityType, description?: string) => {
    if (!user) return false;

    const points = KARMA_POINTS[activityType];
    
    try {
      const { error } = await supabase
        .from('karma_activities')
        .insert([{
          user_id: user.id,
          activity_type: activityType,
          points,
          description: description || null
        }]);

      if (error) throw error;

      // The database trigger will update the user's rank automatically
      // Real-time subscription will update the UI
      return true;
    } catch (error) {
      console.error('Error awarding karma:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchKarmaStats();
  }, [user]);

  // Set up real-time subscription for karma updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('karma_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'karma_activities',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newActivity = payload.new as KarmaActivity;
          setKarmaStats(prev => {
            const newTotalKarma = prev.totalKarma + newActivity.points;
            const rankProgress = calculateRankProgress(newTotalKarma, prev.rank);
            
            return {
              ...prev,
              totalKarma: newTotalKarma,
              recentActivities: [newActivity, ...prev.recentActivities.slice(0, 19)],
              rankProgress
            };
          });
          
          // Show toast for positive karma
          if (newActivity.points > 0) {
            toast({
              title: `+${newActivity.points} Karma!`,
              description: newActivity.description || `${newActivity.activity_type.replace('_', ' ')}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile.rank !== karmaStats.rank) {
            setKarmaStats(prev => ({
              ...prev,
              rank: updatedProfile.rank,
              rankProgress: calculateRankProgress(prev.totalKarma, updatedProfile.rank)
            }));
            
            toast({
              title: "🎉 Rank Up!",
              description: `You've been promoted to ${updatedProfile.rank}!`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, karmaStats.rank]);

  return {
    karmaStats,
    loading,
    updateKarma,
    refetch: fetchKarmaStats
  };
};