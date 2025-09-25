import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserPlus, MessageCircle, ShieldCheck } from "lucide-react";
import { useProfiles, UserProfile } from '@/hooks/useProfiles';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

interface UserPopoverProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  children: React.ReactNode;
}

export const UserPopover = ({ 
  userId, 
  displayName, 
  avatarUrl, 
  isVerified,
  children 
}: UserPopoverProps) => {
  const { user } = useAuth();
  const { fetchProfile, addFriend, checkFriendStatus } = useProfiles();
  const { createOrGetConversation } = useMessages();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      try {
        const profileData = await fetchProfile(userId);
        setProfile(profileData);
        
        if (user && user.id !== userId) {
          const status = await checkFriendStatus(userId);
          setFriendStatus(status);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [userId, user, fetchProfile, checkFriendStatus]);

  const handleAddFriend = async () => {
    setLoading(true);
    const success = await addFriend(userId);
    if (success) {
      setFriendStatus('pending');
    }
    setLoading(false);
  };

  const handleMessage = async () => {
    setLoading(true);
    await createOrGetConversation(userId);
    setLoading(false);
  };

  const isOwnProfile = user?.id === userId;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || avatarUrl || undefined} />
              <AvatarFallback>
                {displayName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{displayName}</h3>
                {isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile?.specialization || 'Medical Professional'}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          {profile && (
            <div className="space-y-2">
              {profile.institution && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Institution:</span>
                  <span className="ml-1">{profile.institution}</span>
                </div>
              )}
              {profile.rank && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Rank:</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {profile.rank}
                  </Badge>
                </div>
              )}
              {profile.bio && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Bio:</span>
                  <p className="mt-1 text-sm">{profile.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isOwnProfile && user && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleAddFriend}
                disabled={loading || friendStatus === 'accepted' || friendStatus === 'pending'}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {friendStatus === 'accepted' ? 'Friends' : 
                 friendStatus === 'pending' ? 'Pending' : 'Add Friend'}
              </Button>
              
              <Button
                size="sm"
                className="flex-1"
                onClick={handleMessage}
                disabled={loading}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};