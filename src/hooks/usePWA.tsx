import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('New service worker version found');
          });
        })
        .catch((registrationError) => {
          console.error('SW registration failed:', registrationError);
        });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({ title: 'App installed successfully!' });
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installApp };
};