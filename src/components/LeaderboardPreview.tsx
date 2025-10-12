import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { fetchLeaderboard } from '@/api/leaderboard';
import { Link } from 'react-router-dom';

interface LeaderboardUser {
  id: string;
  display_name: string | null;
  institution: string | null;
  rank: string;
  avatar_url: string | null;
  totalKarma: number;
}

const LeaderboardPreview = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const data = await fetchLeaderboard();
      setUsers(data.slice(0, 5)); // Show only top 5
      setLoading(false);
    };
    loadLeaderboard();
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Top Contributors
          <Link to="/leaderboard" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user, index) => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6">
              {getRankIcon(index + 1)}
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{user.display_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm truncate">
                  {user.display_name || 'Anonymous'}
                </p>
                {user.rank && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    <Star className="h-2 w-2 mr-1" />
                    {user.rank}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-primary">
                {user.totalKarma.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LeaderboardPreview;