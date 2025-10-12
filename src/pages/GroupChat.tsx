import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Users, Send, UserPlus, UserMinus, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';
import { UserSearchDialog } from '@/components/UserSearchDialog';
import { GroupCreationDialog } from '@/components/GroupCreationDialog';
import ChatSearch from '@/components/ChatSearch';

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    conversations,
    groupConversations, 
    messages, 
    selectedConversationId,
    selectedGroupId,
    sendMessage,
    sendGroupMessage, 
    fetchGroupMessages,
    addMember,
    removeMember,
    selectConversation,
    selectGroupConversation,
    refreshCounts
  } = useMessages();
  
  const [newMessage, setNewMessage] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState<{userId: string, userName: string} | null>(null);
  const [activeTab, setActiveTab] = useState('groups');
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentGroup = groupConversations.find(g => g.id === groupId);

  useEffect(() => {
    if (groupId) {
      selectGroupConversation(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up typing indicator subscription for group chat
  useEffect(() => {
    if (!user || !groupId) {
      setOtherUserTyping(null);
      return;
    }

    const channel = `typing_group_${groupId}`;
    
    const subscription = supabase
      .channel(channel)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, isTyping } = payload.payload;
        
        // Don't show typing indicator for current user
        if (userId === user.id) return;
        
        if (isTyping) {
          setOtherUserTyping({ userId, userName });
        } else {
          setOtherUserTyping(null);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      setOtherUserTyping(null);
    };
  }, [user, groupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !groupId) return;

    const success = await sendGroupMessage(groupId, newMessage);
    if (success) {
      setNewMessage('');
      setIsTyping(false);
      broadcastTypingStatus(false);
      if (typingTimer) {
        clearTimeout(typingTimer);
        setTypingTimer(null);
      }
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      broadcastTypingStatus(true);
    }

    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    const timer = setTimeout(() => {
      setIsTyping(false);
      broadcastTypingStatus(false);
    }, 2000);
    
    setTypingTimer(timer);
  };

  const broadcastTypingStatus = async (typing: boolean) => {
    if (!user || !groupId) return;
    
    const channelName = `typing_group_${groupId}`;
    const channel = supabase.channel(channelName);
    
    if (typing) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          userName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Someone',
          isTyping: true
        }
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          isTyping: false
        }
      });
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !groupId) return;
    
    // In a real app, you'd look up user by email
    // For now, assuming you have the user ID
    const success = await addMember(groupId, newMemberEmail);
    if (success) {
      setNewMemberEmail('');
      toast({ title: "Member added successfully" });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!groupId) return;
    
    const success = await removeMember(groupId, userId);
    if (success) {
      toast({ title: "Member removed" });
    }
  };

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Group not found</div>
        </div>
      </div>
    );
  }

  const handleSendDirectMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedConversationId) return;

    const success = await sendMessage(newMessage, selectedConversationId);
    if (success) {
      setNewMessage('');
      setIsTyping(false);
      broadcastTypingStatus(false);
      if (typingTimer) {
        clearTimeout(typingTimer);
        setTypingTimer(null);
      }
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversationId);
  const isDirectChat = !!selectedConversationId;
  const hasSelection = selectedConversationId || selectedGroupId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-2 sm:py-4 lg:py-8 px-2 sm:px-4">
        <div className="grid lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 h-[calc(100vh-120px)] max-h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">Messages</CardTitle>
              <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="direct" className="mt-0">
                  <div className="p-3 border-b space-y-2">
                    <ChatSearch 
                      onConversationSelect={selectConversation}
                      onGroupSelect={selectGroupConversation}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsUserSearchOpen(true)}
                      className="w-full"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find Users
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 border-b ${
                          selectedConversationId === conv.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => selectConversation(conv.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{conv.other_participant.display_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conv.other_participant.display_name || 'Anonymous'}</p>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="groups" className="mt-0">
                  <div className="p-3 border-b">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsGroupDialogOpen(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {groupConversations.map((group) => (
                      <div
                        key={group.id}
                        className={`p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 border-b ${
                          selectedGroupId === group.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => selectGroupConversation(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{group.name}</p>
                              <div className="flex items-center gap-2">
                                {group.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {group.unread_count}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {group.members?.length || 0}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {group.last_message?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {hasSelection ? (
              <>
                <CardHeader className="border-b p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedGroupId ? (
                        <>
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-base sm:text-lg truncate">{currentGroup?.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {currentGroup?.members?.length || 0} members
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{selectedConv?.other_participant.display_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-base sm:text-lg truncate">{selectedConv?.other_participant.display_name || 'Anonymous'}</CardTitle>
                        </>
                      )}
                    </div>
                    {selectedGroupId && (
                      <Dialog open={showMembers} onOpenChange={setShowMembers}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Members
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Group Members</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="User ID to add"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                              />
                              <Button onClick={handleAddMember} size="sm">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {currentGroup?.members?.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <span>{member.display_name || 'Anonymous'}</span>
                                  {currentGroup.created_by === user?.id && member.id !== user?.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(member.id)}
                                    >
                                      <UserMinus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex flex-col h-[calc(100vh-220px)] min-h-0 p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary border'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{message.content}</p>
                              <div className={`flex items-center justify-between mt-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                <p className="text-xs opacity-70">
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {isOwnMessage && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs opacity-70">
                                      {message.read_at ? 'Seen' : 'Sent'}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${message.read_at ? 'bg-green-400' : 'bg-gray-400'}`} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <TypingIndicator 
                      isTyping={!!otherUserTyping} 
                      userName={otherUserTyping?.userName}
                    />
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input - Fixed at Bottom */}
                  <div className="border-t p-3 sm:p-4 bg-background/95 backdrop-blur-sm shrink-0">
                    <div className="flex gap-2 sm:gap-3">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (selectedGroupId ? handleSendMessage(e) : handleSendDirectMessage())}
                        className="flex-1 rounded-full px-4 py-2 text-sm sm:text-base"
                      />
                      <Button 
                        onClick={selectedGroupId ? (e) => handleSendMessage(e) : handleSendDirectMessage}
                        size="icon" 
                        className="rounded-full w-10 h-10 shrink-0"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center px-4">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* User Search Dialog */}
      <UserSearchDialog 
        open={isUserSearchOpen}
        onOpenChange={setIsUserSearchOpen}
        onConversationCreated={(conversationId) => {
          selectConversation(conversationId);
          setActiveTab('direct');
        }}
      />

      {/* Group Creation Dialog */}
      <GroupCreationDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        onGroupCreated={(groupId) => {
          selectGroupConversation(groupId);
          setActiveTab('groups');
        }}
      />
    </div>
  );
};

export default GroupChat;