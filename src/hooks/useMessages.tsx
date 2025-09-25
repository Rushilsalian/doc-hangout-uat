import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string | null;
  group_conversation_id: string | null;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_moderated: boolean;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    specialization: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

export interface GroupConversation {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  members: {
    id: string;
    display_name: string | null;
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:profiles!conversations_participant_1_fkey(id, display_name, avatar_url, specialization),
          participant_2_profile:profiles!conversations_participant_2_fkey(id, display_name, avatar_url, specialization)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get messages for conversations separately
      const conversationIds = conversationsData?.map(c => c.id) || [];
      let messagesData = [];
      if (conversationIds.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        
        if (!msgsError) messagesData = msgs || [];
      }

      const processedConversations = conversationsData?.map(conv => {
        const otherParticipant = conv.participant_1 === user.id 
          ? conv.participant_2_profile 
          : conv.participant_1_profile;
        
        const convMessages = messagesData.filter(msg => msg.conversation_id === conv.id);
        const lastMessage = convMessages.length > 0 ? convMessages[0] : null;
        const unreadCount = convMessages.filter(msg => 
          msg.sender_id !== user.id && !msg.read_at
        ).length;

        return {
          ...conv,
          other_participant: otherParticipant,
          last_message: lastMessage,
          unread_count: unreadCount
        };
      }) || [];

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch conversations",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupConversations = async () => {
    if (!user) return;

    try {
      // Get groups where user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setGroupConversations([]);
        return;
      }

      const groupIds = membershipData.map(m => m.group_id);

      // Get group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_conversations')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get members for each group
      const { data: allMembersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles(id, display_name)
        `)
        .in('group_id', groupIds);

      if (membersError) throw membersError;

      // Get messages for groups
      const { data: groupMessagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('group_conversation_id', groupIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const processedGroups = groupsData?.map(group => {
        const groupMembers = allMembersData?.filter(m => m.group_id === group.id) || [];
        const groupMessages = groupMessagesData?.filter(msg => msg.group_conversation_id === group.id) || [];
        const lastMessage = groupMessages.length > 0 ? groupMessages[0] : null;
        const unreadCount = groupMessages.filter(msg => 
          msg.sender_id !== user.id && !msg.read_at
        ).length;

        return {
          ...group,
          members: groupMembers.map(m => m.profiles).filter(Boolean),
          last_message: lastMessage,
          unread_count: unreadCount
        };
      }) || [];

      setGroupConversations(processedGroups);
    } catch (error) {
      console.error('Error fetching group conversations:', error);
    }
  };

  const fetchMessages = async (conversationId?: string, groupId?: string) => {
    if (!user) return;

    try {
      setMessagesLoading(true);
      
      let query = supabase.from('messages').select('*');
      
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (groupId) {
        query = query.eq('group_conversation_id', groupId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read for the current user
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          msg.sender_id !== user.id && !msg.read_at
        );
        
        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
          
          if (!updateError) {
            console.log(`Marked ${unreadMessages.length} messages as read`);
            // Update local state immediately to reflect read status
            const updatedMessages = data.map(msg => 
              unreadMessages.some(um => um.id === msg.id) 
                ? { ...msg, read_at: new Date().toISOString() } 
                : msg
            );
            setMessages(updatedMessages);

            // Also mark related message notifications as read for this user
            try {
              const messageIds = unreadMessages.map(m => m.id);

              if (messageIds.length > 0) {
                await supabase
                  .from('notifications')
                  .update({ is_read: true })
                  .eq('user_id', user.id)
                  .eq('type', 'message')
                  .eq('is_read', false)
                  .eq('reference_type', 'message')
                  .in('reference_id', messageIds);
              }

              if (conversationId) {
                await supabase
                  .from('notifications')
                  .update({ is_read: true })
                  .eq('user_id', user.id)
                  .eq('type', 'message')
                  .eq('is_read', false)
                  .eq('reference_type', 'conversation')
                  .eq('reference_id', conversationId);
              }

              if (groupId) {
                await supabase
                  .from('notifications')
                  .update({ is_read: true })
                  .eq('user_id', user.id)
                  .eq('type', 'message')
                  .eq('is_read', false)
                  .eq('reference_type', 'group')
                  .eq('reference_id', groupId);
              }
            } catch (e) {
              console.warn('Failed to mark message notifications as read:', e);
            }
          } else {
            setMessages(data || []);
          }
        } else {
          setMessages(data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch messages",
        variant: "destructive" 
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const createOrGetConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([{
          participant_1: user.id,
          participant_2: otherUserId
        }])
        .select('id')
        .single();

      if (error) throw error;

      await fetchConversations(); // Refresh conversations
      return newConv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create conversation",
        variant: "destructive" 
      });
      return null;
    }
  };

  const createGroupConversation = async (name: string, description: string, memberIds: string[]) => {
    if (!user) {
      console.error('No user found for group creation');
      return null;
    }

    try {
      console.log('Creating group with:', { name, description, created_by: user.id });
      
      const { data: group, error: groupError } = await supabase
        .from('group_conversations')
        .insert([{
          name,
          description,
          created_by: user.id
        }])
        .select('id')
        .single();

      if (groupError) {
        console.error('Group creation error:', groupError);
        throw groupError;
      }

      console.log('Group created:', group);

      // Add creator and members
      const members = [user.id, ...memberIds].map(userId => ({
        group_id: group.id,
        user_id: userId
      }));

      console.log('Adding members:', members);

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(members);

      if (membersError) {
        console.error('Members insertion error:', membersError);
        throw membersError;
      }

      await fetchGroupConversations();
      return group.id;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive"
      });
      return null;
    }
  };

  const addMember = async (groupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: userId }]);

      if (error) throw error;
      await fetchGroupConversations();
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      return false;
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchGroupConversations();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  const sendGroupMessage = async (groupId: string, content: string) => {
    return await sendMessage(content, undefined, groupId);
  };

  const fetchGroupMessages = async (groupId: string) => {
    return await fetchMessages(undefined, groupId);
  };

  const sendMessage = async (content: string, conversationId?: string, groupId?: string) => {
    if (!user) return false;

    try {
      const messageData: any = {
        sender_id: user.id,
        content: content
      };

      if (conversationId) {
        messageData.conversation_id = conversationId;
      } else if (groupId) {
        messageData.group_conversation_id = groupId;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      if (conversationId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        await fetchMessages(conversationId);
      } else if (groupId) {
        await fetchMessages(undefined, groupId);
      }
      
      await fetchConversations();
      await fetchGroupConversations();
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const selectConversation = async (conversationId: string) => {
    if (!conversationId) {
      setSelectedConversationId(null);
      setSelectedGroupId(null);
      setMessages([]);
      return;
    }
    setSelectedConversationId(conversationId);
    setSelectedGroupId(null);
    await fetchMessages(conversationId);
    // Also mark any conversation-level message notifications as read
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id as string)
        .eq('type', 'message')
        .eq('is_read', false)
        .eq('reference_id', conversationId);
    } catch (e) {
      console.warn('Failed to mark conversation notifications as read:', e);
    }
    // Refresh conversations to update unread counts after reading
    setTimeout(() => {
      fetchConversations();
    }, 500);
  };
  
  const selectGroupConversation = async (groupId: string) => {
    if (!groupId) {
      setSelectedGroupId(null);
      setSelectedConversationId(null);
      setMessages([]);
      return;
    }
    setSelectedGroupId(groupId);
    setSelectedConversationId(null);
    await fetchMessages(undefined, groupId);
    // Also mark any group-level message notifications as read
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id as string)
        .eq('type', 'message')
        .eq('is_read', false)
        .eq('reference_id', groupId);
    } catch (e) {
      console.warn('Failed to mark group notifications as read:', e);
    }
    // Refresh group conversations to update unread counts after reading
    setTimeout(() => {
      fetchGroupConversations();
    }, 500);
  };
  const searchUsers = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url, specialization, is_verified, rank')
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const createGroupInviteLink = async (groupId: string, expiresIn24Hours = true) => {
    if (!user) return null;

    try {
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      const expiresAt = expiresIn24Hours 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('invite_links')
        .insert([{
          group_id: groupId,
          token,
          created_by: user.id,
          expires_at: expiresAt
        }])
        .select('token')
        .single();

      if (error) throw error;
      return data.token;
    } catch (error) {
      console.error('Error creating invite link:', error);
      return null;
    }
  };

  const joinGroupWithLink = async (token: string) => {
    if (!user) return false;

    try {
      // Find the invite link
      const { data: invite, error: inviteError } = await supabase
        .from('invite_links')
        .select('group_id, is_active, expires_at, uses_count, max_uses')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (inviteError || !invite) {
        toast({
          title: "Invalid invite",
          description: "This invite link is invalid or expired",
          variant: "destructive"
        });
        return false;
      }

      // Check if expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast({
          title: "Expired invite",
          description: "This invite link has expired",
          variant: "destructive"
        });
        return false;
      }

      // Check if max uses reached
      if (invite.max_uses && invite.uses_count >= invite.max_uses) {
        toast({
          title: "Invite limit reached",
          description: "This invite link has reached its usage limit",
          variant: "destructive"
        });
        return false;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this group",
          variant: "destructive"
        });
        return false;
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: invite.group_id,
          user_id: user.id
        }]);

      if (memberError) throw memberError;

      // Update invite usage count
      await supabase
        .from('invite_links')
        .update({ uses_count: invite.uses_count + 1 })
        .eq('token', token);

      toast({
        title: "Joined group!",
        description: "You have successfully joined the group"
      });

      await fetchGroupConversations();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchGroupConversations();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message received:', payload);
          if (selectedConversationId) {
            fetchMessages(selectedConversationId);
          } else if (selectedGroupId) {
            fetchMessages(undefined, selectedGroupId);
          }
          // Always refresh conversation lists to update unread counts
          setTimeout(() => {
            fetchConversations();
            fetchGroupConversations();
          }, 100);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Message updated (read status):', payload);
          // Handle read status updates
          if (selectedConversationId) {
            fetchMessages(selectedConversationId);
          } else if (selectedGroupId) {
            fetchMessages(undefined, selectedGroupId);
          }
          // Refresh conversation lists to update unread counts
          setTimeout(() => {
            fetchConversations();
            fetchGroupConversations();
          }, 100);
        }
      )
      .subscribe();

    const groupMembersSubscription = supabase
      .channel('group_members')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        () => {
          fetchGroupConversations();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      groupMembersSubscription.unsubscribe();
    };
  }, [user, selectedConversationId, selectedGroupId]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0) + 
                           groupConversations.reduce((total, group) => total + group.unread_count, 0);

  // Manual refresh function to update counts
  const refreshCounts = async () => {
    await Promise.all([fetchConversations(), fetchGroupConversations()]);
  };

  return {
    conversations,
    groupConversations,
    messages,
    selectedConversationId,
    selectedGroupId,
    loading,
    messagesLoading,
    searchResults,
    isSearching,
    totalUnreadCount,
    createOrGetConversation,
    createGroupConversation,
    addMember,
    removeMember,
    sendMessage,
    sendGroupMessage,
    fetchGroupMessages,
    selectConversation,
    selectGroupConversation,
    searchUsers,
    createGroupInviteLink,
    joinGroupWithLink,
    refreshCounts,
    refetch: () => {
      fetchConversations();
      fetchGroupConversations();
    }
  };
};