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

export interface UserKarma {
  totalKarma: number;
  rank: string;
  recentActivities: KarmaActivity[];
}

const KARMA_LEVELS = [
  { min: 0, max: 9, level: "Rookie", color: "text-gray-500" },
  { min: 10, max: 49, level: "Private", color: "text-blue-500" },
  { min: 50, max: 99, level: "Corporal", color: "text-green-500" },
  { min: 100, max: 499, level: "Sergeant", color: "text-purple-500" },
  { min: 500, max: 999, level: "Lieutenant", color: "text-orange-500" },
  { min: 1000, max: 2499, level: "Captain", color: "text-red-500" },
  { min: 2500, max: 4999, level: "Major", color: "text-pink-500" },
  { min: 5000, max: 9999, level: "Colonel", color: "text-indigo-500" },
  { min: 10000, max: Infinity, level: "General", color: "text-yellow-500" }
];

export const useKarma = () => {
  const [karma, setKarma] = useState<UserKarma>({
    totalKarma: 0,
    rank: "Rookie",
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchKarma = async () => {
    if (!user) {
      setKarma({ totalKarma: 0, rank: "Rookie", recentActivities: [] });
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
        .limit(10);

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

      setKarma({
        totalKarma,
        rank: profile.rank || "Rookie",
        recentActivities: activities || []
      });
    } catch (error) {
      console.error('Error fetching karma:', error);
      toast({
        title: "Error",
        description: "Failed to load karma data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKarma();
  }, [user]);

  // Set up real-time subscription for karma updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('karma_activities')
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
          setKarma(prev => ({
            ...prev,
            totalKarma: prev.totalKarma + newActivity.points,
            recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)]
          }));
          
          // Show toast for positive karma
          if (newActivity.points > 0) {
            toast({
              title: `+${newActivity.points} Karma!`,
              description: newActivity.description || `${newActivity.activity_type.replace('_', ' ')}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getLevelColor = (rank: string) => {
    const levelData = KARMA_LEVELS.find(l => l.level === rank);
    return levelData?.color || "text-gray-500";
  };

  const getNextLevelProgress = (totalKarma: number, currentRank: string) => {
    const currentLevel = KARMA_LEVELS.find(l => l.level === currentRank);
    const nextLevel = KARMA_LEVELS.find(l => l.min > (currentLevel?.min || 0));
    
    if (!nextLevel) return { progress: 100, nextLevel: "Max Level", pointsNeeded: 0 };
    
    const progress = ((totalKarma - (currentLevel?.min || 0)) / (nextLevel.min - (currentLevel?.min || 0))) * 100;
    const pointsNeeded = nextLevel.min - totalKarma;
    
    return { 
      progress: Math.min(progress, 100), 
      nextLevel: nextLevel.level, 
      pointsNeeded: Math.max(pointsNeeded, 0) 
    };
  };

  return { 
    karma, 
    loading, 
    getLevelColor, 
    getNextLevelProgress,
    refetch: fetchKarma 
  };
};