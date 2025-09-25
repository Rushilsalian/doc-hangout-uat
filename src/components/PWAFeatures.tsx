import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor,
  Zap,
  Shield,
  Bell
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAFeatures = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: "App Installed!",
        description: "Med-Thread-AI has been installed on your device"
      });
    };

    checkInstalled();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "Installing...",
          description: "Med-Thread-AI is being installed"
        });
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install failed:', error);
      toast({
        title: "Install Failed",
        description: "Could not install the app",
        variant: "destructive"
      });
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive important updates"
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You can enable them later in settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Network</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          {!isOnline && (
            <Alert className="mt-3">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Some features may be limited, but you can still browse cached content.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PWA Installation */}
      {!isInstalled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Install Med-Thread-AI for a better experience with offline access and push notifications.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4" />
                <span>Works on mobile devices</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4" />
                <span>Available on desktop</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                <span>Fast loading</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                <span>Secure and private</span>
              </div>
            </div>

            {isInstallable && (
              <Button onClick={handleInstallClick} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
            
            {!isInstallable && !isInstalled && (
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  To install this app, use the "Add to Home Screen" option in your browser menu.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Installed Status */}
      {isInstalled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              App Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Installation</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Download className="h-3 w-3 mr-1" />
                Installed
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Med-Thread-AI is installed and ready to use offline.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Push Notifications</span>
            <Badge 
              variant={notificationPermission === 'granted' ? "default" : "secondary"}
              className={notificationPermission === 'granted' ? "bg-green-100 text-green-800" : ""}
            >
              {notificationPermission === 'granted' ? 'Enabled' : 
               notificationPermission === 'denied' ? 'Disabled' : 'Not Set'}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Get notified about new messages, comments, and important updates.
          </p>

          {notificationPermission !== 'granted' && (
            <Button 
              onClick={handleEnableNotifications} 
              variant="outline" 
              className="w-full"
              disabled={notificationPermission === 'denied'}
            >
              <Bell className="h-4 w-4 mr-2" />
              {notificationPermission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
            </Button>
          )}

          {notificationPermission === 'denied' && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked. You can enable them in your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};