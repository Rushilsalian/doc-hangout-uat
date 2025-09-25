import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, TrendingUp, MessageCircle, ThumbsUp } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { AvatarUpload } from '@/components/AvatarUpload';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  display_name: string | null;
  institution: string | null;
  specialization: string | null;
  rank: string;
  is_verified: boolean | null;
  avatar_url: string | null;
}

interface KarmaData {
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  voteKarma: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [karma, setKarma] = useState<KarmaData>({ totalKarma: 0, postKarma: 0, commentKarma: 0, voteKarma: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      // Use userId from params if available, otherwise use current user's id
      const targetUserId = userId || user.id;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, institution, specialization, rank, is_verified, avatar_url')
          .eq('id', targetUserId)
          .maybeSingle();

        // Fetch karma activities
        const { data: karmaData } = await supabase
          .from('karma_activities')
          .select('activity_type, points')
          .eq('user_id', targetUserId);

        if (profileData) setProfile(profileData);

        if (karmaData) {
          const totalKarma = karmaData.reduce((sum, activity) => sum + activity.points, 0);
          const postKarma = karmaData
            .filter(a => a.activity_type === 'CREATE_POST')
            .reduce((sum, activity) => sum + activity.points, 0);
          const commentKarma = karmaData
            .filter(a => a.activity_type === 'CREATE_COMMENT')
            .reduce((sum, activity) => sum + activity.points, 0);
          const voteKarma = karmaData
            .filter(a => a.activity_type.includes('VOTE'))
            .reduce((sum, activity) => sum + activity.points, 0);

          setKarma({ totalKarma, postKarma, commentKarma, voteKarma });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userId]);

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? {...prev, avatar_url: url} : null);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'text-yellow-600 bg-yellow-100';
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Sergeant': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNextRankThreshold = (rank: string) => {
    switch (rank) {
      case 'Recruit': return { next: 'Sergeant', threshold: 50 };
      case 'Sergeant': return { next: 'Captain', threshold: 200 };
      case 'Captain': return { next: 'General', threshold: 500 };
      default: return { next: 'Max Rank', threshold: 500 };
    }
  };

  const calculateProgress = () => {
    const { threshold } = getNextRankThreshold(profile?.rank || 'Recruit');
    const currentRankMin = profile?.rank === 'Sergeant' ? 50 : 
                          profile?.rank === 'Captain' ? 200 : 0;
    
    if (profile?.rank === 'General') {
      return 100;
    }
    
    const progress = ((karma.totalKarma - currentRankMin) / (threshold - currentRankMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Please sign in to view your profile.</div>
        </div>
      </div>
    );
  }

  const nextRank = getNextRankThreshold(profile.rank);
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                {!userId || userId === user.id ? (
                  <AvatarUpload 
                    currentAvatar={profile.avatar_url}
                    displayName={profile.display_name || user.email || 'User'}
                    onAvatarUpdate={(url) => setProfile(prev => prev ? {...prev, avatar_url: url} : null)}
                    size="lg"
                  />
                ) : (
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {(profile.display_name || 'A').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {profile.display_name || 'Anonymous'}
                    </h1>
                    <Badge className={`${getRankColor(profile.rank)} flex items-center gap-1`}>
                      <Star className="h-3 w-3" />
                      {profile.rank}
                    </Badge>
                    {profile.is_verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {profile.specialization || 'Medical Professional'}
                    {profile.institution && ` • ${profile.institution}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Karma Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Karma Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{karma.totalKarma}</div>
                  <p className="text-sm text-muted-foreground">Total Karma Points</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {nextRank.next}</span>
                    <span>{karma.totalKarma}/{nextRank.threshold}</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {profile.rank === 'General' 
                      ? 'Maximum rank achieved!' 
                      : `${nextRank.threshold - karma.totalKarma} points to next rank`
                    }
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Posts
                    </span>
                    <span className="font-medium">{karma.postKarma}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                    </span>
                    <span className="font-medium">{karma.commentKarma}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Votes
                    </span>
                    <span className="font-medium">{karma.voteKarma}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rank Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Rank System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border-2 ${profile.rank === 'General' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">General</span>
                      <span className="text-sm text-muted-foreground">500+ points</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${profile.rank === 'Captain' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Captain</span>
                      <span className="text-sm text-muted-foreground">200-499 points</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${profile.rank === 'Sergeant' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Sergeant</span>
                      <span className="text-sm text-muted-foreground">50-199 points</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${profile.rank === 'Recruit' ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Recruit</span>
                      <span className="text-sm text-muted-foreground">0-49 points</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;