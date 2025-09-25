import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Post } from '@/hooks/usePosts';

export const useSavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSavedPosts = async () => {
    if (!user) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          created_at,
          post:posts (
            *,
            author:profiles!posts_author_id_fkey(id, display_name, avatar_url, specialization, is_verified),
            community:communities(id, name),
            post_tags(id, tag),
            comments(id)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posts = data?.map(item => item.post).filter(Boolean) as Post[] || [];
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      toast({
        title: "Error",
        description: "Failed to load saved posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save posts",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_posts')
        .insert([{
          user_id: user.id,
          post_id: postId
        }]);

      if (error) throw error;

      toast({
        title: "Post saved!",
        description: "Added to your saved posts"
      });

      await fetchSavedPosts(); // Refresh saved posts
      return true;
    } catch (error: any) {
      console.error('Error saving post:', error);
      if (error.code === '23505') {
        toast({
          title: "Already saved",
          description: "This post is already in your saved posts"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save post",
          variant: "destructive"
        });
      }
      return false;
    }
  };

  const unsavePost = async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      toast({
        title: "Post unsaved",
        description: "Removed from your saved posts"
      });

      setSavedPosts(prev => prev.filter(post => post.id !== postId));
      return true;
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast({
        title: "Error",
        description: "Failed to unsave post",
        variant: "destructive"
      });
      return false;
    }
  };

  const checkIfSaved = async (postId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if post is saved:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [user]);

  return {
    savedPosts,
    loading,
    savePost,
    unsavePost,
    checkIfSaved,
    refetch: fetchSavedPosts
  };
};