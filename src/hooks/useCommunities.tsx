import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type PostCategory = 'exam' | 'second_opinion' | 'non_medical' | 'general';

export interface Community {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  member_count?: number;
  post_count?: number;
  is_member?: boolean;
  user_role?: string | null;
  category_counts?: Record<PostCategory, number>;
}

export const useCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      // Fetch communities with member counts only
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select(`
          *,
          community_memberships(count)
        `);

      if (communitiesError) throw communitiesError;

      // Fetch post counts separately for each community
      const processedCommunities = await Promise.all(
        (communitiesData || []).map(async (community) => {
          // Get total post count
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)
            .eq('status', 'published');

          // Get posts by category for this community
          const { data: categoryPosts } = await supabase
            .from('posts')
            .select('category')
            .eq('community_id', community.id)
            .eq('status', 'published');

          const categoryCounts = {
            exam: categoryPosts?.filter(p => p.category === 'exam').length || 0,
            second_opinion: categoryPosts?.filter(p => p.category === 'second_opinion').length || 0,
            non_medical: categoryPosts?.filter(p => p.category === 'non_medical').length || 0,
            general: categoryPosts?.filter(p => p.category === 'general').length || 0
          };

          // Check if user is logged in and get membership status
          let is_member = false;
          let user_role = null;
          if (user) {
            const { data: membership } = await supabase
              .from('community_memberships')
              .select('id, role')
              .eq('community_id', community.id)
              .eq('user_id', user.id)
              .single();
            
            is_member = !!membership;
            user_role = membership?.role || null;
          }
          
          return {
            ...community,
            member_count: community.community_memberships?.[0]?.count || 0,
            post_count: postCount || 0,
            category_counts: categoryCounts,
            is_member,
            user_role
          };
        })
      );

      setCommunities(processedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch communities",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to join communities",
        variant: "destructive" 
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert([{
          community_id: communityId,
          user_id: user.id
        }]);

      if (error) throw error;

      // Update local state
      setCommunities(prev => prev.map(community => 
        community.id === communityId 
          ? { ...community, is_member: true, member_count: (community.member_count || 0) + 1 }
          : community
      ));

      toast({ 
        title: "Joined community!", 
        description: "Welcome to the community" 
      });
      return true;
    } catch (error: any) {
      console.error('Error joining community:', error);
      if (error.code === '23505') {
        toast({ 
          title: "Already a member", 
          description: "You're already part of this community" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to join community",
          variant: "destructive" 
        });
      }
      return false;
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCommunities(prev => prev.map(community => 
        community.id === communityId 
          ? { ...community, is_member: false, member_count: Math.max(0, (community.member_count || 0) - 1) }
          : community
      ));

      toast({ 
        title: "Left community", 
        description: "You've left the community" 
      });
      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      toast({ 
        title: "Error", 
        description: "Failed to leave community",
        variant: "destructive" 
      });
      return false;
    }
  };

  const createCommunity = async (communityData: { name: string; description: string }) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to create communities",
        variant: "destructive" 
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          name: communityData.name,
          description: communityData.description,
          icon_name: 'Users',
          color: 'text-blue-500',
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator to the community
      await supabase
        .from('community_memberships')
        .insert([{
          community_id: data.id,
          user_id: user.id,
          role: 'admin'
        }]);

      // Add to local state
      const newCommunity = {
        ...data,
        member_count: 1,
        post_count: 0,
        is_member: true
      };
      setCommunities(prev => [...prev, newCommunity]);

      toast({ 
        title: "Community created!", 
        description: "Your new community is ready" 
      });
      return true;
    } catch (error: any) {
      console.error('Error creating community:', error);
      if (error.code === '23505') {
        toast({ 
          title: "Name taken", 
          description: "A community with this name already exists",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to create community",
          variant: "destructive" 
        });
      }
      return false;
    }
  };

  const deleteCommunity = async (communityId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to delete communities",
        variant: "destructive" 
      });
      return false;
    }

    try {
      // Check if user is the creator or admin
      const community = communities.find(c => c.id === communityId);
      if (!community) {
        toast({ 
          title: "Community not found", 
          variant: "destructive" 
        });
        return false;
      }

      const { data: membership } = await supabase
        .from('community_memberships')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      const isCreator = community.created_by === user.id;
      const isAdmin = membership?.role === 'admin';

      if (!isCreator && !isAdmin) {
        toast({ 
          title: "Permission denied", 
          description: "Only community creators and admins can delete communities",
          variant: "destructive" 
        });
        return false;
      }

      // Delete the community (cascade will handle related data)
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      // Remove from local state
      setCommunities(prev => prev.filter(c => c.id !== communityId));

      toast({ 
        title: "Community deleted", 
        description: "The community has been permanently deleted" 
      });
      return true;
    } catch (error) {
      console.error('Error deleting community:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete community",
        variant: "destructive" 
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const getPostsByCategory = async (communityId: string, category: PostCategory) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(display_name, avatar_url)
        `)
        .eq('community_id', communityId)
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }
  };

  return {
    communities,
    loading,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    deleteCommunity,
    getPostsByCategory,
    refetch: fetchCommunities
  };
};