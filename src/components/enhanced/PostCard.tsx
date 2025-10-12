import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  Share, 
  Bookmark, 
  BookmarkCheck,
  Award,
  MoreVertical,
  Play,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Sparkles,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { CommentSection } from '@/components/CommentSection';
import type { Post } from '@/hooks/usePosts';
import { cn } from "@/lib/utils";
import { UserPopover } from '@/components/UserPopover';
import { supabase } from '@/integrations/supabase/client';
import AISummary from '@/components/AISummary';
import { VideoPlayer } from '@/components/VideoPlayer';

interface PostAttachment {
  id: string;
  file_url: string;
  file_type: string;
  file_name?: string;
}

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onComment?: (postId: string) => void;
  onShare?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  showCommunity?: boolean;
  compact?: boolean;
}

export const PostCard = ({ 
  post, 
  onVote, 
  onComment, 
  onShare, 
  onDelete,
  showCommunity = false,
  compact = false 
}: PostCardProps) => {
  const { user } = useAuth();
  const { savePost, unsavePost, checkIfSaved } = useSavedPosts();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [localVote, setLocalVote] = useState<'upvote' | 'downvote' | null>(
    post.user_vote?.vote_type as 'upvote' | 'downvote' || null
  );
  const [showComments, setShowComments] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);

  useEffect(() => {
    if (user) {
      checkIfSaved(post.id).then(setIsSaved);
    }
    
    // Fetch post attachments
    const fetchAttachments = async () => {
      const { data } = await supabase
        .from('post_attachments')
        .select('*')
        .eq('post_id', post.id);
      
      if (data) {
        setAttachments(data);
      }
    };
    
    fetchAttachments();
  }, [post.id, user, checkIfSaved]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive"
      });
      return;
    }

    // Optimistic update
    const newVote = localVote === voteType ? null : voteType;
    setLocalVote(newVote);

    if (onVote) {
      onVote(post.id, voteType);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save posts",
        variant: "destructive"
      });
      return;
    }

    if (isSaved) {
      const success = await unsavePost(post.id);
      if (success) setIsSaved(false);
    } else {
      const success = await savePost(post.id);
      if (success) setIsSaved(true);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id) {
      return;
    }

    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      onDelete?.(post.id);
    }
  };

  const isAuthor = user?.id === post.author_id;
  
  // Debug logging
  console.log('PostCard Debug:', {
    userId: user?.id,
    authorId: post.author_id,
    isAuthor,
    onDelete: !!onDelete
  });

  const getPostTypeIcon = () => {
    switch (post.post_type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'poll':
        return <BarChart3 className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

  return (
    <Card className={cn(
      "border-0 shadow-ghibli transition-all duration-300 hover:shadow-strong hover:-translate-y-1 bg-white/95 backdrop-blur-sm",
      compact && "py-2"
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Reddit-style Vote Column */}
          <div className="flex flex-col items-center p-1 sm:p-2 bg-muted/30 min-w-[40px] sm:min-w-[48px]">
            <Button
              variant={localVote === 'upvote' ? 'ghibli' : 'ghost'}
              size="icon"
              onClick={() => handleVote('upvote')}
              className="h-5 w-5 sm:h-6 sm:w-6 mb-1 hover:scale-110 transition-transform"
            >
              <ArrowUp className="h-2 w-2 sm:h-3 sm:w-3" />
            </Button>
            <span className={cn(
              "text-xs font-medium px-1 text-center",
              localVote === 'upvote' && "text-ghibli-nature",
              localVote === 'downvote' && "text-destructive"
            )}>
              {post.upvotes - post.downvotes}
            </span>
            <Button
              variant={localVote === 'downvote' ? 'destructive' : 'ghost'}
              size="icon"
              onClick={() => handleVote('downvote')}
              className="h-5 w-5 sm:h-6 sm:w-6 mt-1 hover:scale-110 transition-transform"
            >
              <ArrowDown className="h-2 w-2 sm:h-3 sm:w-3" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-2 sm:p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-1 sm:mb-2">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                {showCommunity && post.community && (
                  <>
                    <span className="font-medium text-ghibli-nature">r/{post.community.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>Posted by</span>
                <UserPopover
                  userId={post.author?.id || ''}
                  displayName={post.author?.display_name || 'Anonymous'}
                  avatarUrl={post.author?.avatar_url}
                  isVerified={post.author?.is_verified}
                >
                  <span 
                    className="font-medium hover:underline cursor-pointer text-ghibli-sky"
                    onClick={() => navigate(`/profile/${post.author?.id}`)}
                  >
                    u/{post.author?.display_name || 'Anonymous'}
                  </span>
                </UserPopover>
                {post.author?.is_verified && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 bg-ghibli-nature text-white">
                    ✓
                  </Badge>
                )}
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>

            {/* Title */}
            <h3 className={cn(
              "font-semibold leading-tight mb-1 sm:mb-2 hover:text-ghibli-nature cursor-pointer transition-colors",
              compact ? "text-sm" : "text-sm sm:text-base"
            )}>
              {post.title}
            </h3>

            {/* Content */}
            {!compact && (
              <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                <p className="line-clamp-3">{post.content}</p>
              </div>
            )}

            {/* Tags */}
            {post.post_tags && post.post_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                {post.post_tags.slice(0, 4).map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs border-ghibli-nature/30 text-ghibli-nature hover:bg-ghibli-nature hover:text-white transition-colors cursor-pointer">
                    #{tag.tag}
                  </Badge>
                ))}
                {post.post_tags.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{post.post_tags.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Post Attachments */}
            {attachments.length > 0 && (
              <div className="mb-2 sm:mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative">
                      {attachment.file_type === 'image' ? (
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name || 'Post attachment'}
                          className="w-full h-32 sm:h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        />
                      ) : attachment.file_type === 'video' ? (
                        <VideoPlayer
                          src={attachment.file_url}
                          className="w-full h-32 sm:h-48 shadow-md hover:shadow-lg transition-shadow"
                          autoPlay={true}
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            {attachment.file_name || 'File attachment'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reddit-style Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowComments(!showComments);
                    onComment?.(post.id);
                  }}
                  className="h-6 sm:h-7 px-1 sm:px-2 hover:bg-ghibli-sky/20 rounded-full text-xs"
                >
                  <MessageCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span>{commentCount} comments</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare?.(post)}
                  className="h-6 sm:h-7 px-1 sm:px-2 hover:bg-ghibli-sky/20 rounded-full text-xs"
                >
                  <Share className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span>Share</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="h-6 sm:h-7 px-1 sm:px-2 hover:bg-ghibli-sky/20 rounded-full text-xs"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-2 w-2 sm:h-3 sm:w-3 mr-1 text-ghibli-nature" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span>Save</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAISummary(!showAISummary)}
                  className="h-6 sm:h-7 px-1 sm:px-2 hover:bg-primary/20 rounded-full text-xs"
                >
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span>AI Summary</span>
                </Button>

                <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-1 sm:px-2 hover:bg-ghibli-sky/20 rounded-full text-xs">
                  <Award className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span>Award</span>
                </Button>
              </div>
              
              {isAuthor && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 sm:h-7 px-2 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* AI Summary Section */}
        <Collapsible open={showAISummary} onOpenChange={setShowAISummary}>
          <CollapsibleContent>
            <div className="border-t border-border/50 mt-2 sm:mt-3 pt-2 sm:pt-3 px-2 sm:px-3">
              <AISummary 
                postId={post.id}
                content={post.content}
                autoGenerate={false}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Comments Section */}
        <Collapsible open={showComments} onOpenChange={setShowComments}>
          <CollapsibleContent>
            <div className="border-t border-border/50 mt-2 sm:mt-3 pt-2 sm:pt-3 px-2 sm:px-3">
              <CommentSection postId={post.id} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};