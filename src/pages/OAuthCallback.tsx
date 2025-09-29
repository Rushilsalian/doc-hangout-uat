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
          // Successfully authenticated, redirect to profile completion
          navigate('/profile-completion', { replace: true });
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