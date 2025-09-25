import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from '@/hooks/use-toast';

const PWAInstallBanner = () => {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(() => 
    localStorage.getItem('pwa-install-dismissed') === 'true'
  );
  const [showFallback, setShowFallback] = useState(false);

  // Show fallback after 3 seconds if not installable
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInstallable) setShowFallback(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInstallable]);

  if (dismissed) return null;
  if (!isInstallable && !showFallback) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Doc Hangout</h3>
          <p className="text-xs text-muted-foreground">Get the app for quick access</p>
        </div>
        <Button size="sm" onClick={isInstallable ? installApp : () => {
          navigator.clipboard.writeText(window.location.href);
          toast({ 
            title: "URL Copied!", 
            description: "Add this page to your home screen manually" 
          });
        }}>
          <Download className="h-4 w-4 mr-1" />
          {isInstallable ? 'Install' : 'Add to Home'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setDismissed(true);
            localStorage.setItem('pwa-install-dismissed', 'true');
          }} 
          className="p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default PWAInstallBanner;