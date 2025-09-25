import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Users, Send, UserPlus, UserMinus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { 
    groupConversations, 
    messages, 
    sendGroupMessage, 
    fetchGroupMessages,
    addMember,
    removeMember,
    selectGroupConversation 
  } = useMessages();
  
  const [newMessage, setNewMessage] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState<{userId: string, userName: string} | null>(null);
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

  return (
    <div className="min-h-screen bg-ghibli-sage flex flex-col">
      <Header />
      <div className="flex-1 container py-4 flex flex-col">
        <Card className="flex-1 flex flex-col shadow-ghibli border-ghibli-forest/20">
          <CardHeader className="flex-row items-center justify-between bg-gradient-to-r from-ghibli-forest/5 to-ghibli-nature/5 border-b border-ghibli-forest/10 shrink-0">
            <CardTitle className="flex items-center gap-2 text-ghibli-forest">
              <Users className="h-5 w-5" />
              {currentGroup.name}
              <Badge variant="secondary" className="bg-ghibli-nature/20 text-ghibli-forest border-ghibli-nature/30">
                {currentGroup.members?.length || 0} members
              </Badge>
            </CardTitle>
            <Dialog open={showMembers} onOpenChange={setShowMembers}>
              <DialogTrigger asChild>
                <Button variant="ghibli" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-ghibli-sage to-ghibli-forest/5 border-ghibli-forest/20">
                <DialogHeader>
                  <DialogTitle className="text-ghibli-forest">Group Members</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="User ID to add"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="border-ghibli-forest/20 focus:border-ghibli-nature"
                    />
                    <Button onClick={handleAddMember} size="sm" variant="ghibli">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentGroup.members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-ghibli-forest/10 rounded-lg bg-white/50">
                        <span className="text-ghibli-forest font-medium">{member.display_name || 'Anonymous'}</span>
                        {currentGroup.created_by === user?.id && member.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-ghibli-sunset hover:text-destructive"
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
          </CardHeader>
          
          {/* Chat Messages Area - Scrollable */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/50 to-ghibli-sage/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-ghibli-forest/60">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-ghibli-nature to-ghibli-sky text-white shadow-ghibli/20'
                          : 'bg-white border border-ghibli-forest/10 text-ghibli-forest shadow-ghibli/10'
                      }`}
                    >
                       <p className="text-sm leading-relaxed">{message.content}</p>
                       <div className="flex items-center justify-between mt-2">
                         <p className={`text-xs ${message.sender_id === user?.id ? 'text-white/70' : 'text-ghibli-forest/60'}`}>
                           {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                         {message.sender_id === user?.id && (
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-white/70">
                               {message.read_at ? 'Seen' : 'Sent'}
                             </span>
                             <div className={`w-2 h-2 rounded-full ${message.read_at ? 'bg-green-300' : 'bg-white/50'}`} />
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                ))
              )}
              <TypingIndicator 
                isTyping={!!otherUserTyping} 
                userName={otherUserTyping?.userName}
              />
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input - Fixed at Bottom */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-ghibli-forest/10 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border-ghibli-forest/20 focus:border-ghibli-nature bg-white/90 rounded-full px-4 py-2"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  variant="ghibli"
                  size="icon"
                  className="rounded-full w-10 h-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GroupChat;