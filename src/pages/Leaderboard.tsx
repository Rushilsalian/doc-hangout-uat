import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { fetchLeaderboard } from '@/api/leaderboard';

interface LeaderboardUser {
  id: string;
  display_name: string | null;
  institution: string | null;
  rank: string;
  avatar_url: string | null;
  totalKarma: number;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const data = await fetchLeaderboard();
      setUsers(data);
      setLoading(false);
    };
    loadLeaderboard();
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'bg-yellow-100 text-yellow-800';
      case 'Captain': return 'bg-blue-100 text-blue-800';
      case 'Sergeant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Karma Leaderboard</h1>
          <p className="text-muted-foreground">Top contributors to the medical community</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {users.map((user, index) => (
            <Card key={user.id} className={`${index < 3 ? 'border-2' : ''} ${
              index === 0 ? 'border-yellow-200 bg-yellow-50/50' :
              index === 1 ? 'border-gray-200 bg-gray-50/50' :
              index === 2 ? 'border-amber-200 bg-amber-50/50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {user.display_name || 'Anonymous'}
                      </h3>
                      <Badge className={`${getRankColor(user.rank)} flex items-center gap-1`}>
                        <Star className="h-3 w-3" />
                        {user.rank}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.institution || 'Institution not specified'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {user.totalKarma.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">karma points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;