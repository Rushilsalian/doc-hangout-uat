import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, MessageCircle, ThumbsUp, Star } from "lucide-react";
import { useKarmaSystem } from "@/hooks/useKarmaSystem";
import { useAuth } from "@/hooks/useAuth";

const KarmaDisplay = () => {
  const { karmaStats, loading } = useKarmaSystem();
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Karma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Sign in to view your karma
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Karma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'text-yellow-600 bg-yellow-100';
      case 'Colonel': return 'text-purple-600 bg-purple-100';
      case 'Major': return 'text-red-600 bg-red-100';
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Lieutenant': return 'text-green-600 bg-green-100';
      case 'Sergeant': return 'text-orange-600 bg-orange-100';
      case 'Corporal': return 'text-gray-600 bg-gray-100';
      case 'Private': return 'text-slate-600 bg-slate-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level: string) => {
    return 'text-primary';
  };

  // Calculate karma breakdown with null safety
  const activities = karmaStats.recentActivities || [];
  const postKarma = activities.filter(a => a.activity_type === 'CREATE_POST').reduce((sum, a) => sum + a.points, 0);
  const commentKarma = activities.filter(a => a.activity_type === 'CREATE_COMMENT').reduce((sum, a) => sum + a.points, 0);
  const voteKarma = activities.filter(a => a.activity_type.includes('VOTE')).reduce((sum, a) => sum + a.points, 0);

  return (
    <Card className="border-0 shadow-ghibli bg-gradient-to-br from-ghibli-nature/10 to-ghibli-sky/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-ghibli-nature flex items-center gap-2">
          <Trophy className="h-4 w-4 text-ghibli-magic" />
          Your Magical Power
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-ghibli-nature">{karmaStats.totalKarma}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className="bg-ghibli-nature text-white border-0 font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              {karmaStats.rank}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 rounded-lg bg-ghibli-nature/10">
            <span className="flex items-center gap-2 text-ghibli-nature">
              <TrendingUp className="h-3 w-3" />
              Healing Posts
            </span>
            <span className="font-medium text-ghibli-nature">{postKarma}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-ghibli-sky/10">
            <span className="flex items-center gap-2 text-ghibli-sky">
              <MessageCircle className="h-3 w-3" />
              Wise Comments
            </span>
            <span className="font-medium text-ghibli-sky">{commentKarma}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-ghibli-magic/10">
            <span className="flex items-center gap-2 text-ghibli-magic">
              <ThumbsUp className="h-3 w-3" />
              Magic Votes
            </span>
            <span className="font-medium text-ghibli-magic">{voteKarma}</span>
          </div>
        </div>
        
        {activities.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-ghibli-nature/5 to-ghibli-sky/5">
            <h4 className="text-sm font-medium mb-2 text-ghibli-nature">Recent Magical Deeds</h4>
            <div className="space-y-1 text-xs">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-1 rounded bg-white/50">
                  <span className="text-muted-foreground">
                    {activity.description || activity.activity_type.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-ghibli-nature">+{activity.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KarmaDisplay;