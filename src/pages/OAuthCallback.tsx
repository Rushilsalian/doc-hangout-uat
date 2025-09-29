import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          navigate('/auth', { replace: true });
          return;
        }

        if (data.session) {
          // Check if user has completed medical verification
          const { data: profile } = await supabase
            .from('profiles')
            .select('medical_verification_completed')
            .eq('id', data.session.user.id)
            .single();

          if (profile?.medical_verification_completed) {
            // Already verified, go to profile completion
            navigate('/profile-completion', { replace: true });
          } else {
            // Need to complete mandatory questions first
            navigate('/oauth-questions', { replace: true });
          }
        } else {
          // No session found, redirect to auth
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingScreen />;
};

export default OAuthCallback;