import React, { useState } from 'react';
import { Plus, Users, Link as LinkIcon, Copy, Check, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useMessages } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { toast } from '@/hooks/use-toast';

interface GroupCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (groupId: string) => void;
}

export const GroupCreationDialog = ({ open, onOpenChange, onGroupCreated }: GroupCreationDialogProps) => {
  const [step, setStep] = useState<'create' | 'invite'>('create');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  const { createGroupConversation, createGroupInviteLink } = useMessages();
  const { friends, loading: friendsLoading } = useFriends();

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const groupId = await createGroupConversation(
        groupName.trim(),
        groupDescription.trim(),
        selectedFriends
      );

      if (groupId) {
        setCreatedGroupId(groupId);
        
        // Generate invite link
        const token = await createGroupInviteLink(groupId);
        if (token) {
          const link = `${window.location.origin}/group-invite/${token}`;
          setInviteLink(link);
        }

        setStep('invite');
        toast({
          title: "Group created!",
          description: "Your group has been created successfully"
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Invite link copied to clipboard"
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (createdGroupId && onGroupCreated) {
      onGroupCreated(createdGroupId);
    }
    
    // Reset form
    setStep('create');
    setGroupName('');
    setGroupDescription('');
    setSelectedFriends([]);
    setInviteLink('');
    setCreatedGroupId(null);
    setLinkCopied(false);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'create' ? 'Create Group Chat' : 'Group Created Successfully!'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'create' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="What's this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Add Friends ({selectedFriends.length} selected)</Label>
              
              {friendsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="text-sm text-muted-foreground">Loading friends...</div>
                </div>
              ) : friends.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <div className="text-sm text-muted-foreground">No friends to add</div>
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={() => handleFriendToggle(friend.id)}
                        />
                        
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name || 'Friend'} />
                          <AvatarFallback>
                            {(friend.display_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {friend.display_name || 'Unknown User'}
                            </p>
                            {friend.is_verified && (
                              <Badge variant="secondary" className="text-xs">
                                ✓
                              </Badge>
                            )}
                          </div>
                          {friend.specialization && (
                            <p className="text-xs text-muted-foreground truncate">
                              {friend.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={isCreating || !groupName.trim()}
                className="flex-1"
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your group "{groupName}" has been created with {selectedFriends.length + 1} member{selectedFriends.length !== 0 ? 's' : ''}.
              </p>
            </div>

            {inviteLink && (
              <div className="space-y-3">
                <Label>Share Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    variant={linkCopied ? "default" : "outline"}
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join your group (expires in 24 hours)
                </p>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              <MessageCircle className="h-4 w-4 mr-1" />
              Go to Group Chat
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};