import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const UserSearchDialog = ({ open, onOpenChange, onConversationCreated }: UserSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchUsers, searchResults, isSearching, createOrGetConversation } = useMessages();
  const { sendFriendRequest, checkFriendshipStatus } = useFriends();
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, string>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Check friendship status for search results
  useEffect(() => {
    const checkStatuses = async () => {
      const statuses: Record<string, string> = {};
      
      for (const user of searchResults) {
        const status = await checkFriendshipStatus(user.id);
        statuses[user.id] = status;
      }
      
      setFriendshipStatuses(statuses);
    };

    if (searchResults.length > 0) {
      checkStatuses();
    }
  }, [searchResults, checkFriendshipStatus]);

  const handleSendFriendRequest = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      // Update local status
      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: 'request_sent'
      }));
    }
  };

  const handleStartConversation = async (userId: string) => {
    const conversationId = await createOrGetConversation(userId);
    if (conversationId && onConversationCreated) {
      onConversationCreated(conversationId);
      onOpenChange(false);
    }
  };

  const getFriendshipAction = (userId: string) => {
    const status = friendshipStatuses[userId];
    
    switch (status) {
      case 'friends':
        return (
          <Button size="sm" onClick={() => handleStartConversation(userId)}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
        );
      case 'request_sent':
        return (
          <Button size="sm" variant="outline" disabled>
            Request Sent
          </Button>
        );
      case 'request_received':
        return (
          <Button size="sm" variant="outline" disabled>
            Request Pending
          </Button>
        );
      default:
        return (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleSendFriendRequest(userId)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Friend
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find Users</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-72">
            {isSearching ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-sm text-muted-foreground">Searching...</div>
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-sm text-muted-foreground">No users found</div>
              </div>
            ) : searchQuery === '' ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-sm text-muted-foreground">Type to search for users</div>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || 'User'} />
                      <AvatarFallback>
                        {(user.display_name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {user.display_name || 'Unknown User'}
                        </p>
                        {user.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                        {user.rank && (
                          <Badge variant="outline" className="text-xs">
                            {user.rank}
                          </Badge>
                        )}
                      </div>
                      {user.specialization && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.specialization}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {getFriendshipAction(user.id)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};