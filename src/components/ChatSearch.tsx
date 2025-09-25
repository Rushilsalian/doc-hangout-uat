import { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMessages } from '@/hooks/useMessages';

interface ChatSearchProps {
  onConversationSelect: (conversationId: string) => void;
  onGroupSelect: (groupId: string) => void;
}

export const ChatSearch = ({ onConversationSelect, onGroupSelect }: ChatSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, groupConversations } = useMessages();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { conversations: [], groups: [] };

    const query = searchQuery.toLowerCase();
    
    const filteredConversations = conversations.filter(conv =>
      conv.other_participant.display_name?.toLowerCase().includes(query) ||
      conv.last_message?.content?.toLowerCase().includes(query)
    );

    const filteredGroups = groupConversations.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.last_message?.content?.toLowerCase().includes(query)
    );

    return { 
      conversations: filteredConversations, 
      groups: filteredGroups 
    };
  }, [searchQuery, conversations, groupConversations]);

  const handleSelect = useCallback((type: 'conversation' | 'group', id: string) => {
    if (type === 'conversation') {
      onConversationSelect(id);
    } else {
      onGroupSelect(id);
    }
    setIsOpen(false);
    setSearchQuery('');
  }, [onConversationSelect, onGroupSelect]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Search Chats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations and messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {searchQuery && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.conversations.length === 0 && searchResults.groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations found
                </p>
              ) : (
                <>
                  {searchResults.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-2 rounded-lg hover:bg-secondary cursor-pointer"
                      onClick={() => handleSelect('conversation', conv.id)}
                    >
                      <div className="font-medium text-sm">
                        {conv.other_participant.display_name || 'Anonymous'}
                      </div>
                      {conv.last_message && (
                        <div className="text-xs text-muted-foreground truncate">
                          {conv.last_message.content}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {searchResults.groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-2 rounded-lg hover:bg-secondary cursor-pointer"
                      onClick={() => handleSelect('group', group.id)}
                    >
                      <div className="font-medium text-sm flex items-center gap-2">
                        <span>🏥</span> {group.name}
                      </div>
                      {group.last_message && (
                        <div className="text-xs text-muted-foreground truncate">
                          {group.last_message.content}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSearch;