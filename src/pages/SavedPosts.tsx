import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/enhanced/PostCard";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useAuth } from "@/hooks/useAuth";
import { Bookmark, BookmarkX } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SavedPosts = () => {
  const { user } = useAuth();
  const { savedPosts, loading, unsavePost } = useSavedPosts();
  const navigate = useNavigate();

  const handleUnsave = async (postId: string) => {
    const success = await unsavePost(postId);
    if (success) {
      toast({
        title: "Post unsaved",
        description: "Removed from your saved posts"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Card className="text-center">
            <CardContent className="py-16">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view saved posts</h2>
              <p className="text-muted-foreground">
                You need to be signed in to access your saved posts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Saved Posts</h1>
              <p className="text-muted-foreground mt-2">
                Your bookmarked posts and discussions
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              {savedPosts.length} saved
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : savedPosts.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-16">
                <BookmarkX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
                <p className="text-muted-foreground mb-4">
                  Start exploring and save posts you want to read later.
                </p>
                <Button onClick={() => navigate('/')}>
                  Explore Posts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {savedPosts.map((post) => (
                <div key={post.id} className="relative">
                  <PostCard
                    post={post}
                    showCommunity={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => handleUnsave(post.id)}
                  >
                    <BookmarkX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;