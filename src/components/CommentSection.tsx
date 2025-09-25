import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Reply } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useComments, Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { UserPopover } from './UserPopover';

interface CommentSectionProps {
  postId: string;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  level?: number;
}

const CommentItem = ({ comment, onReply, level = 0 }: CommentItemProps) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    await onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  const marginLeft = Math.min(level * 20, 60); // Max 3 levels deep

  return (
    <div className="space-y-2" style={{ marginLeft: `${marginLeft}px` }}>
      <Card className="border-l-2 border-l-primary/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <UserPopover
              userId={comment.author.id}
              displayName={comment.author.display_name || 'Anonymous'}
              avatarUrl={comment.author.avatar_url}
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={comment.author.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.author.display_name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </UserPopover>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <UserPopover
                  userId={comment.author.id}
                  displayName={comment.author.display_name || 'Anonymous'}
                  avatarUrl={comment.author.avatar_url}
                >
                  <span className="font-medium text-sm cursor-pointer hover:underline">
                    {comment.author.display_name || 'Anonymous'}
                  </span>
                </UserPopover>
                {comment.author.specialization && (
                  <span className="text-xs text-muted-foreground">
                    • {comment.author.specialization}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at))} ago
                </span>
              </div>
              
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              
              <div className="flex items-center gap-2">
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    className="h-7 px-2 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
              
              {isReplying && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleReply}>
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsReplying(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
  console.log('CommentSection loaded for post:', postId);
  const { user } = useAuth();
  const { comments, loading, createComment } = useComments(postId);
  console.log('Comments data:', comments, 'User:', user?.email);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await createComment(newComment.trim());
    if (success) {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleReply = async (parentCommentId: string, content: string) => {
    await createComment(content, parentCommentId);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded"></div>
        <div className="h-16 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback>
                {user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
};