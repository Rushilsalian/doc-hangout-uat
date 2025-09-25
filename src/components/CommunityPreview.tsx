import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useKarma } from "@/hooks/useKarma";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { 
  Heart, 
  Brain, 
  Eye, 
  Bone, 
  Users, 
  MessageCircle, 
  ArrowUp, 
  Clock,
  Sparkles 
} from "lucide-react";

// Icon mapping for dynamic communities
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Heart,
    Brain, 
    Eye,
    Bone,
    Users
  };
  return iconMap[iconName] || Users;
};

const CommunityPreview = () => {
  const navigate = useNavigate();
  
  const { communities, loading: communitiesLoading, joinCommunity } = useCommunities();
  const { posts, loading: postsLoading } = usePosts();

  const handleJoinCommunity = async (communityId: string) => {
    const success = await joinCommunity(communityId);
    if (success) {
      toast({ title: "Joined community!", description: "Welcome to the community!" });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (communitiesLoading || postsLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container">
          <div className="text-center">Loading communities...</div>
        </div>
      </section>
    );
  }

  // Get top 4 communities by member count
  const topCommunities = communities
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    .slice(0, 4);

  // Get recent posts for preview
  const recentPosts = posts
    .filter(post => post.status === 'published')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Specialty Hangout Rooms
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your tribe! Connect with docs in your specialty, share interesting cases, and learn from each other.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {topCommunities.map((community) => {
            const IconComponent = getIconComponent(community.icon_name);
            return (
              <Card key={community.id} className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10`}>
                    <IconComponent className={`h-6 w-6 ${community.color}`} />
                  </div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.member_count?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {community.post_count || 0}
                    </span>
                  </div>
                  <Button 
                    variant={community.is_member ? "default" : "outline"} 
                    size="sm" 
                    className="w-full" 
                    onClick={() => community.is_member ? navigate('/communities') : handleJoinCommunity(community.id)}
                  >
                    {community.is_member ? 'View Hangout' : 'Join Hangout'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">What's Happening in the Hangout</h3>
          <div className="space-y-4 sm:space-y-6">
            {recentPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No recent posts to display</p>
                </CardContent>
              </Card>
            ) : (
              recentPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="text-xs sm:text-sm font-medium">{post.upvotes - post.downvotes}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h4 className="text-base sm:text-lg font-semibold leading-tight hover:text-primary cursor-pointer" onClick={() => navigate('/collaborate')}>
                            {post.title}
                          </h4>
                          {post.is_ai_summary && (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Sparkles className="h-3 w-3" />
                              <span className="text-xs">AI Summary</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                              <AvatarFallback className="text-xs">
                                {post.author.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{post.author.display_name || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span>{post.author.specialization || 'Medical Professional'}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(post.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex gap-1 flex-wrap">
                            {post.post_tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{post.comments?.length || 0} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;