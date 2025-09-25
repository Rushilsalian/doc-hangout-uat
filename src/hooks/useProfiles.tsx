import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  institution: string | null;
  rank: string | null;
  is_verified: boolean;
  email: string;
  bio: string | null;
  years_experience: number | null;
  created_at: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const captureAvatar = async (videoElement: HTMLVideoElement): Promise<string | null> => {
    if (!user) return null;

    try {
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to capture image'));
            return;
          }

          try {
            const fileName = `${user.id}/${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                upsert: true
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            // Update profile with new avatar URL
            await updateProfile({ avatar_url: publicUrl });

            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error capturing avatar:', error);
      toast({
        title: "Error",
        description: "Failed to capture avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const addFriend = async (userId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add friends",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent"
      });
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
      return false;
    }
  };

  const checkFriendStatus = async (userId: string): Promise<'none' | 'pending' | 'accepted' | 'rejected'> => {
    if (!user) return 'none';

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .maybeSingle();

      if (error) {
        console.error('Error checking friend status:', error);
        return 'none';
      }
      return (data?.status as 'none' | 'pending' | 'accepted' | 'rejected') || 'none';
    } catch (error) {
      console.error('Error checking friend status:', error);
      return 'none';
    }
  };

  return {
    profiles,
    loading,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    captureAvatar,
    addFriend,
    checkFriendStatus
  };
};