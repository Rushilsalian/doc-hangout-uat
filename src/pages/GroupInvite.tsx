import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const GroupInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinGroupWithLink } = useMessages();
  
  const [inviteData, setInviteData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteData = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        // Fetch invite data
        const { data: invite, error: inviteError } = await supabase
          .from('invite_links')
          .select(`
            *,
            group_conversations (
              id,
              name,
              description,
              created_at
            ),
            profiles:created_by (
              display_name,
              avatar_url
            )
          `)
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (inviteError || !invite) {
          setError('Invalid or expired invite link');
          setLoading(false);
          return;
        }

        // Check if expired
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          setError('This invite link has expired');
          setLoading(false);
          return;
        }

        // Check if max uses reached
        if (invite.max_uses && invite.uses_count >= invite.max_uses) {
          setError('This invite link has reached its usage limit');
          setLoading(false);
          return;
        }

        setInviteData(invite);
        setGroupData(invite.group_conversations);

        // Get group member count
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', invite.group_id);

        if (!membersError && members) {
          setGroupData(prev => ({ ...prev, memberCount: members.length }));
        }

      } catch (error) {
        console.error('Error fetching invite data:', error);
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInviteData();
  }, [token]);

  const handleJoinGroup = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!token) return;

    setJoining(true);
    try {
      const success = await joinGroupWithLink(token);
      if (success) {
        navigate(`/group-chat/${inviteData.group_id}`);
      }
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">Loading invite...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>You're Invited to Join</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">{groupData?.name}</h2>
            {groupData?.description && (
              <p className="text-muted-foreground text-sm">{groupData.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {groupData?.memberCount || 0} members
              </div>
              {inviteData?.expires_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Expires {new Date(inviteData.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Invited by */}
          {inviteData?.profiles && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={inviteData.profiles.avatar_url || undefined} 
                  alt={inviteData.profiles.display_name || 'User'} 
                />
                <AvatarFallback>
                  {(inviteData.profiles.display_name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  Invited by {inviteData.profiles.display_name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(inviteData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  You need to sign in to join this group
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Sign In to Join
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleJoinGroup}
                disabled={joining}
                className="w-full"
              >
                {joining ? (
                  "Joining..."
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupInvite;