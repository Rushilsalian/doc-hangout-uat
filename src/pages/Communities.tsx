import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useCommunities, PostCategory } from "@/hooks/useCommunities";
import { useKarmaSystem } from "@/hooks/useKarmaSystem";
import { useState } from "react";
import { Heart, Brain, Eye, Bone, Users, MessageCircle, Plus, Check, GraduationCap, Stethoscope, Coffee } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Icon mapping for dynamic icons
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Users;
};

const categoryConfig = {
  exam: { label: 'Exams', icon: GraduationCap, color: 'text-blue-600' },
  second_opinion: { label: 'Second Opinion', icon: Stethoscope, color: 'text-green-600' },
  non_medical: { label: 'Non-Medical', icon: Coffee, color: 'text-orange-600' },
  general: { label: 'General', icon: MessageCircle, color: 'text-gray-600' }
};

const Communities = () => {
  const { updateKarma } = useKarmaSystem();
  const { communities, loading, joinCommunity, createCommunity, getPostsByCategory } = useCommunities();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '' });
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('general');
  const [categoryPosts, setCategoryPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const handleJoinCommunity = async (communityId: string) => {
    const success = await joinCommunity(communityId);
    if (success) {
      updateKarma('JOIN_COMMUNITY', 'Joined a new community');
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    const success = await createCommunity(newCommunity);
    if (success) {
      setNewCommunity({ name: '', description: '' });
      setShowCreateDialog(false);
      updateKarma('CREATE_COMMUNITY', 'Created a new community');
    }
  };

  const handleViewCommunity = (communityId: string) => {
    setSelectedCommunity(communityId);
    loadCategoryPosts(communityId, selectedCategory);
  };

  const loadCategoryPosts = async (communityId: string, category: PostCategory) => {
    setLoadingPosts(true);
    const posts = await getPostsByCategory(communityId, category);
    setCategoryPosts(posts);
    setLoadingPosts(false);
  };

  const handleCategoryChange = (category: PostCategory) => {
    setSelectedCategory(category);
    if (selectedCommunity) {
      loadCategoryPosts(selectedCommunity, category);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading communities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Specialty Hangout Rooms</h1>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Community name (e.g., Pediatrics)"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Describe your community..."
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateCommunity}>Create</Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => {
            const IconComponent = getIconComponent(community.icon_name);
            
            return (
              <Card key={community.id} className="hover:shadow-medium transition-all">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className={`h-6 w-6 ${community.color}`} />
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2">
                    {community.name}
                    {community.is_member && <Badge variant="secondary" className="text-xs">Joined</Badge>}
                  </CardTitle>
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
                  
                  {/* Sub-sections */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    {Object.entries(categoryConfig).map(([key, config]) => {
                      const count = community.category_counts?.[key as PostCategory] || 0;
                      const Icon = config.icon;
                      return (
                        <div key={key} className="flex items-center gap-1 p-1 rounded bg-muted/50">
                          <Icon className={`h-3 w-3 ${config.color}`} />
                          <span className="truncate">{config.label}</span>
                          <Badge variant="secondary" className="text-xs">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant={community.is_member ? "outline" : "default"}
                      onClick={() => handleJoinCommunity(community.id)}
                      disabled={community.is_member}
                    >
                      {community.is_member ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Joined
                        </>
                      ) : (
                        'Join Hangout'
                      )}
                    </Button>
                    
                    {community.is_member && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewCommunity(community.id)}
                      >
                        View Posts
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Community Posts Dialog */}
        {selectedCommunity && (
          <Dialog open={!!selectedCommunity} onOpenChange={() => setSelectedCommunity(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {communities.find(c => c.id === selectedCommunity)?.name} Posts
                </DialogTitle>
              </DialogHeader>
              
              <Tabs value={selectedCategory} onValueChange={(value) => handleCategoryChange(value as PostCategory)}>
                <TabsList className="grid w-full grid-cols-4">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const count = communities.find(c => c.id === selectedCommunity)?.category_counts?.[key as PostCategory] || 0;
                    return (
                      <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label} ({count})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {Object.keys(categoryConfig).map((category) => (
                  <TabsContent key={category} value={category} className="mt-4">
                    {loadingPosts ? (
                      <div className="text-center py-8">Loading posts...</div>
                    ) : categoryPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No posts in this category yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {categoryPosts.map((post) => (
                          <Card key={post.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                By {post.profiles?.display_name || 'Anonymous'} • {new Date(post.created_at).toLocaleDateString()}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{post.content.substring(0, 200)}...</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Communities;