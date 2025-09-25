import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, MessageCircle, ArrowUp, Star } from "lucide-react";
import { useTrendingPosts } from "@/hooks/useTrendingPosts";

const TrendingPosts = () => {
  const { posts, loading } = useTrendingPosts(5);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Now
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
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Sergeant': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exam': return 'bg-blue-100 text-blue-800';
      case 'second_opinion': return 'bg-green-100 text-green-800';
      case 'non_medical': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground">No trending posts</div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className="space-y-2 pb-4 border-b last:border-b-0">
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium text-sm leading-tight hover:text-primary cursor-pointer">
                    {post.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className={getCategoryColor(post.category)}>
                      {post.category.replace('_', ' ')}
                    </Badge>
                    {post.community_name && (
                      <span className="text-muted-foreground">{post.community_name}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {post.author_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {post.author_name || 'Anonymous'}
                      </span>
                      <Badge className={`${getRankColor(post.author_rank)} text-xs`}>
                        <Star className="h-2 w-2 mr-1" />
                        {post.author_rank}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        {post.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comment_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingPosts;