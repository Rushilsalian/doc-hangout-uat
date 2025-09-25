import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface PostTag {
  id: string;
  tag: string;
}

export interface PostAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  is_verified: boolean | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string | null;
  category: string | null;
  post_type: string;
  created_at: string;
  updated_at: string;
  is_ai_summary: boolean;
  upvotes: number;
  downvotes: number;
  status: string;
  author: PostAuthor;
  community?: {
    id: string;
    name: string;
  };
  post_tags: PostTag[];
  comments: { id: string }[];
  user_vote?: {
    vote_type: string;
  } | null;
}

const POSTS_PER_PAGE = 10;

export const usePosts = (communityId?: string) => {
  const { user } = useAuth();
  
  const fetchPosts = async ({ pageParam = 0 }) => {
    console.log('Fetching posts with pageParam:', pageParam);
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, display_name, avatar_url, specialization, is_verified),
          community:communities(id, name),
          post_tags(id, tag),
          comments(id)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase posts fetch error:', error);
        throw error;
      }

      console.log('Posts fetched successfully:', data?.length || 0, 'posts');

      // Fetch user votes if logged in
      let userVotes: any[] = [];
      if (user && data && data.length > 0) {
        try {
          const postIds = data.map(post => post.id);
          const { data: votesData, error: votesError } = await supabase
            .from('post_votes')
            .select('post_id, vote_type')
            .eq('user_id', user.id)
            .in('post_id', postIds);
          
          if (votesError) {
            console.error('Error fetching votes:', votesError);
          } else {
            userVotes = votesData || [];
          }
        } catch (votesErr) {
          console.error('Votes fetch failed:', votesErr);
        }
      }

      const processedPosts = data?.map(post => ({
        ...post,
        user_vote: userVotes.find(vote => vote.post_id === post.id) || null
      })) || [];

      console.log('Processed posts:', processedPosts.length);

      return {
        posts: processedPosts,
        nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
      };
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      toast({
        title: "Network Error",
        description: "Failed to load posts. Please check your connection and try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['posts', communityId, user?.id],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];



  const createPost = async (postData: {
    title: string;
    content: string;
    community_id?: string;
    category?: 'exam' | 'second_opinion' | 'non_medical' | 'general';
    post_type?: 'text' | 'image' | 'video' | 'blog' | 'poll';
    tags?: string[];
    attachments?: Array<{
      url: string;
      type: 'image' | 'video';
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>;
  }) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to create posts",
        variant: "destructive" 
      });
      return false;
    }

    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([{
          title: postData.title,
          content: postData.content,
          author_id: user.id,
          community_id: postData.community_id || null,
          category: postData.category || 'general',
          post_type: postData.post_type || 'text'
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Add tags if provided
      if (postData.tags && postData.tags.length > 0) {
        const tagInserts = postData.tags.map(tag => ({
          post_id: post.id,
          tag: tag.trim()
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      // Handle attachments if provided
      if (postData.attachments && postData.attachments.length > 0) {
        const attachmentInserts = postData.attachments.map(attachment => ({
          post_id: post.id,
          file_url: attachment.url,
          file_type: attachment.type,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          mime_type: attachment.mimeType
        }));

        const { error: attachmentsError } = await supabase
          .from('post_attachments')
          .insert(attachmentInserts);

        if (attachmentsError) throw attachmentsError;
      }

      toast({ 
        title: "Post created!", 
        description: "Your post has been published" 
      });
      
      await refetch(); // Refresh posts
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create post",
        variant: "destructive" 
      });
      return false;
    }
  };

  const voteOnPost = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to vote",
        variant: "destructive" 
      });
      return false;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          const { error } = await supabase
            .from('post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Update vote if different type
          const { error } = await supabase
            .from('post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('post_votes')
          .insert([{
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          }]);

        if (error) throw error;
      }

      await refetch(); // Refresh to get updated vote counts
      return true;
    } catch (error) {
      console.error('Error voting on post:', error);
      toast({ 
        title: "Error", 
        description: "Failed to vote on post",
        variant: "destructive" 
      });
      return false;
    }
  };



  return {
    posts,
    loading: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createPost,
    voteOnPost,
    refetch
  };
};