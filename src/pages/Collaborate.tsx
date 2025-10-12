import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { useCommunities } from "@/hooks/useCommunities";
import { useKarmaSystem } from "@/hooks/useKarmaSystem";
import { useModerationSystem } from "@/hooks/useModerationSystem";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import KarmaDisplay from "@/components/KarmaDisplay";
import TrendingTopicsManager from "@/components/TrendingTopicsManager";
import { PostCard } from "@/components/enhanced/PostCard";
import { PostCreate } from "@/components/PostCreate";
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  Share2, 
  Plus,
  Search,
  TrendingUp,
  Clock,
  Sparkles,
  Filter,
  X,
  Image as ImageIcon,
  Copy,
  Home,
  Flame,
  Star,
  Bookmark,
  Menu,
  ChevronLeft,
  Brain
} from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import * as htmlToImage from 'html-to-image';
import ghibliCollaboration from "@/assets/ghibli-collaboration.jpg";
import ghibliEmptyState from "@/assets/ghibli-empty-state.jpg";

const Collaborate = () => {
  const navigate = useNavigate();
  const { 
    posts, 
    loading: postsLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    createPost, 
    voteOnPost,
    deletePost
  } = usePosts();
  const { communities, loading: communitiesLoading } = useCommunities();
  const { updateKarma } = useKarmaSystem();
  const { moderateContent } = useModerationSystem();
  const { topics: trendingTopics, loading: topicsLoading, getTrendTypeLabel, getTrendTypeVariant } = useTrendingTopics();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community_id: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const shareCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Please fill in title and content", variant: "destructive" });
      return;
    }

    if (!moderateContent(newPost.title) || !moderateContent(newPost.content)) {
      return;
    }

    const success = await createPost({
      title: newPost.title,
      content: newPost.content,
      community_id: newPost.community_id === 'none' ? undefined : newPost.community_id,
      tags: newPost.tags
    });

    if (success) {
      setNewPost({ title: '', content: '', community_id: '', tags: [] });
      setShowCreatePost(false);
      updateKarma('CREATE_POST', 'Created a new post');
    }
  };

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    const success = await voteOnPost(postId, voteType);
    if (success && voteType === 'upvote') {
      updateKarma('GIVE_UPVOTE', 'Gave an upvote');
    }
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
  };

  const addTag = () => {
    if (newTag.trim() && !newPost.tags.includes(newTag.trim())) {
      setNewPost(prev => ({ 
        ...prev, 
        tags: [...prev.tags, newTag.trim()] 
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewPost(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const generateShareableImage = async (post: any) => {
    const shareCardRef = shareCardRefs.current[post.id];
    if (!shareCardRef) return;

    setGeneratingImage(post.id);
    
    try {
      const dataUrl = await htmlToImage.toPng(shareCardRef, {
        backgroundColor: '#ffffff',
        width: 600,
        height: 400,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `doc-hangout-${post.title.slice(0, 30)}.png`;
      link.href = dataUrl;
      link.click();
      
      // Copy shareable link
      const shareableLink = `${window.location.origin}/collaborate?post=${post.id}`;
      await navigator.clipboard.writeText(shareableLink);
      
      toast({ 
        title: "Image generated and link copied!", 
        description: "Share the link to let others view this post" 
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ 
        title: "Error generating image", 
        variant: "destructive" 
      });
    } finally {
      setGeneratingImage(null);
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

  const filteredAndSortedPosts = posts
    .filter(post => {
      if (!searchTerm) return true;
      return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.post_tags.some(tag => tag.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .filter(post => {
      if (filterBy === 'all') return true;
      return post.community?.name?.toLowerCase() === filterBy.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'popular') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 0;
    });

  if (postsLoading || communitiesLoading) {
    return (
      <div className="min-h-screen bg-ghibli-gradient">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading magical discussions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghibli-gradient flex flex-col">
      <Header />
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden flex-shrink-0">
        <div 
          className="h-32 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${ghibliCollaboration})`,
            filter: 'brightness(0.8)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ghibli-nature/80 to-ghibli-sky/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Medical Collaboration Hub</h1>
            <p className="text-sm sm:text-base opacity-90">Where healing knowledge flows like magic</p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Sidebar - Fixed */}
        {sidebarOpen && (
          <div className="w-80 lg:w-80 md:w-72 sm:w-64 bg-background border-r border-border flex-shrink-0 overflow-y-auto">
            <div className="p-2 sm:p-4 space-y-3">
              {/* Quick Navigation */}
              <Card className="border-0 shadow-ghibli">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button 
                      variant="reddit" 
                      className="w-full justify-start"
                      onClick={() => setSortBy("recent")}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                    <Button 
                      variant="reddit" 
                      className="w-full justify-start"
                      onClick={() => setSortBy("popular")}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      Popular
                    </Button>
                    <Button 
                      variant="reddit" 
                      className="w-full justify-start"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Best
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Create Post */}
              <Card className="border-0 shadow-ghibli">
                <CardContent className="p-4">
                  <PostCreate />
                </CardContent>
              </Card>

              {/* Search */}
              <Card className="border-0 shadow-ghibli">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search discussions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-0 bg-muted/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <TrendingTopicsManager />

              {/* AI Dashboard Navigation */}
              <Card className="border-0 shadow-ghibli">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-ghibli-magic flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="ghibli" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/ai-dashboard')}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-4 space-y-4">
            {/* Sort Bar */}
            <Card className="border-0 shadow-ghibli">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    {/* Hamburger Menu Toggle */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="p-1 h-8 w-8"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={sortBy === "recent" ? "ghibli" : "reddit"} 
                      size="sm"
                      onClick={() => setSortBy("recent")}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      New
                    </Button>
                    <Button 
                      variant={sortBy === "popular" ? "ghibli" : "reddit"} 
                      size="sm"
                      onClick={() => setSortBy("popular")}
                    >
                      <Flame className="h-3 w-3 mr-1" />
                      Hot
                    </Button>
                    <Button variant="reddit" size="sm">
                      <Star className="h-3 w-3 mr-1" />
                      Top
                    </Button>
                  </div>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-[140px] sm:w-[140px] w-[100px] border-0 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-0 shadow-ghibli">
                      <SelectItem value="all">All Communities</SelectItem>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.name}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-3">
              {filteredAndSortedPosts.length === 0 ? (
                <Card className="border-0 shadow-ghibli">
                  <CardContent className="text-center py-12">
                    <div 
                      className="w-48 h-36 mx-auto mb-6 bg-cover bg-center rounded-lg opacity-80"
                      style={{ backgroundImage: `url(${ghibliEmptyState})` }}
                    />
                    <h3 className="text-lg font-semibold text-ghibli-nature mb-2">
                      No discussions yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to start a magical conversation!
                    </p>
                    <Button variant="ghibli" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedPosts.map((post) => (
                  <div key={post.id} className="hover:scale-[1.01] transition-transform duration-200">
                    <PostCard
                      post={post}
                      onVote={handleVote}
                      onDelete={handleDelete}
                      onShare={(post) => {
                        navigator.clipboard.writeText(`${post.title} - ${window.location.origin}/collaborate`);
                        toast({ title: "Link copied to clipboard!" });
                      }}
                      showCommunity={true}
                    />
                  </div>
                ))
              )}
              
              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isFetchingNextPage && (
                  <Card className="border-0 shadow-ghibli">
                    <CardContent className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghibli-nature mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading magical discussions...</p>
                    </CardContent>
                  </Card>
                )}
                {!hasNextPage && posts.length > 0 && (
                  <Card className="border-0 shadow-ghibli">
                    <CardContent className="text-center py-6">
                      <Sparkles className="h-6 w-6 text-ghibli-magic mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">You've reached the end of this magical journey!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="w-80 lg:w-80 md:w-72 bg-background border-l border-border flex-shrink-0 h-full overflow-y-auto hidden lg:block">
          <div className="p-2 sm:p-4 space-y-3 pb-8">
            <Card className="border-0 shadow-ghibli">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ghibli-nature flex items-center gap-2">
                  <div className="w-4 h-4 bg-ghibli-nature rounded-full"></div>
                  Popular Communities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {communities.slice(0, 5).map((community, index) => (
                  <div key={community.id} className="flex items-center justify-between p-2 hover:bg-ghibli-sky/10 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <div className="w-6 h-6 bg-ghibli-nature rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {community.name[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium">r/{community.name}</span>
                    </div>
                    <Button variant="ghibli" size="sm" className="h-6 px-2 text-xs">
                      Join
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-ghibli-nature/30 text-ghibli-nature hover:bg-ghibli-nature hover:text-white"
                  onClick={() => navigate('/communities')}
                >
                  View All Communities
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard Widget */}
            <Card className="border-0 shadow-ghibli">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ghibli-sky flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghibli" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/leaderboard')}
                >
                  View Leaderboard
                </Button>
              </CardContent>
            </Card>

            {/* Saved Posts Widget */}
            <Card className="border-0 shadow-ghibli">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ghibli-magic flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Your Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghibli" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/saved-posts')}
                >
                  View Saved Posts
                </Button>
              </CardContent>
            </Card>

            <KarmaDisplay />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaborate;