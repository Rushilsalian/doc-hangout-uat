import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Friend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  rank: string | null;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  requester: Friend;
  addressee: Friend;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFriends = async () => {
    if (!user) {
      setFriends([]);
      setFriendRequests([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch accepted friendships where user is either requester or addressee
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;

      // Get friend IDs and fetch their profiles
      const friendIds = (friendshipsData || []).map(friendship => 
        friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id
      );

      if (friendIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, specialization, is_verified, rank')
          .in('id', friendIds);

        if (profilesError) throw profilesError;
        setFriends((profilesData || []) as Friend[]);
      } else {
        setFriends([]);
      }

      // Fetch pending friend requests (both sent and received)
      const { data: requestsData, error: requestsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // Get profiles for friend requests
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, specialization, is_verified, rank')
            .eq('id', request.requester_id)
            .single();

          const { data: addresseeProfile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, specialization, is_verified, rank')
            .eq('id', request.addressee_id)
            .single();

          return {
            ...request,
            requester: requesterProfile as Friend,
            addressee: addresseeProfile as Friend
          } as FriendRequest;
        })
      );

      setFriendRequests(requestsWithProfiles);
      
      // Separate incoming and outgoing requests
      const incoming = requestsWithProfiles.filter(req => req.addressee_id === user.id);
      const outgoing = requestsWithProfiles.filter(req => req.requester_id === user.id);
      
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send friend requests",
        variant: "destructive"
      });
      return false;
    }

    if (addresseeId === user.id) {
      toast({
        title: "Invalid request",
        description: "You cannot send a friend request to yourself",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .insert([{
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent"
      });

      await fetchFriends(); // Refresh the lists
      return true;
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.code === '23505') {
        toast({
          title: "Request already exists",
          description: "You've already sent a friend request to this user",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive"
        });
      }
      return false;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('addressee_id', user.id); // Only addressee can accept

      if (error) throw error;

      toast({
        title: "Friend request accepted!",
        description: "You are now friends"
      });

      await fetchFriends(); // Refresh the lists
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)
        .eq('addressee_id', user.id); // Only addressee can reject

      if (error) throw error;

      toast({
        title: "Friend request rejected",
        description: "The friend request has been declined"
      });

      await fetchFriends(); // Refresh the lists
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: "You are no longer friends"
      });

      await fetchFriends(); // Refresh the lists
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive"
      });
      return false;
    }
  };

  const checkFriendshipStatus = async (userId: string) => {
    if (!user || userId === user.id) return 'none';

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('status, requester_id')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return 'none';

      if (data.status === 'accepted') return 'friends';
      if (data.status === 'pending') {
        return data.requester_id === user.id ? 'request_sent' : 'request_received';
      }

      return 'none';
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return 'none';
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  // Set up real-time subscription for friend requests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friendships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(requester_id.eq.${user.id},addressee_id.eq.${user.id})`
        },
        () => {
          fetchFriends(); // Refresh on any friendship change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    friends,
    friendRequests, // Keep for backward compatibility
    incomingRequests, // Only requests where user is addressee
    outgoingRequests, // Only requests where user is requester
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    checkFriendshipStatus,
    refetch: fetchFriends
  };
};