import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { Users, LogOut, RefreshCw, Monitor } from 'lucide-react';

export const TabSessionManager = () => {
  const { user, signOut } = useAuth();
  const [tabInfo, setTabInfo] = useState<{ tabId: string; hasSession: boolean }>({ tabId: '', hasSession: false });
  const [allTabs, setAllTabs] = useState<string[]>([]);

  useEffect(() => {
    const updateTabInfo = () => {
      // Get current tab ID
      const tabId = sessionStorage.getItem('tab_id') || 'no-tab';
      const hasSession = user !== null;
      
      setTabInfo({ tabId, hasSession });

      // Get all tab sessions
      const keys = Object.keys(sessionStorage);
      const tabIds = new Set<string>();
      
      keys.forEach(key => {
        if (key.includes('_sb-') && key.includes('_auth-token')) {
          const extractedTabId = key.split('_')[0];
          if (extractedTabId.startsWith('tab_')) {
            tabIds.add(extractedTabId);
          }
        }
      });
      
      setAllTabs(Array.from(tabIds));
    };

    updateTabInfo();
    
    // Update when session changes
    const interval = setInterval(updateTabInfo, 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const clearCurrentTab = async () => {
    await signOut();
    const tabId = sessionStorage.getItem('tab_id');
    if (tabId) {
      // Clear all session storage for this tab
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(`${tabId}_`)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  };

  const clearAllTabs = () => {
    // Clear all tab sessions
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.includes('_sb-') || key.startsWith('tab_')) {
        sessionStorage.removeItem(key);
      }
    });
    setAllTabs([]);
    window.location.reload();
  };

  const shortTabId = tabInfo.tabId.replace('tab_', '').substring(0, 8);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Tab Session Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tab:</span>
            <Badge variant="outline">{shortTabId}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Session Status:</span>
            <Badge variant={tabInfo.hasSession ? "default" : "secondary"}>
              {tabInfo.hasSession ? 'Logged In' : 'Logged Out'}
            </Badge>
          </div>
          
          {user && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User:</span>
              <span className="text-sm truncate max-w-[200px]">{user.email}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Active Tab Sessions: {allTabs.length}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-20 overflow-y-auto">
            {allTabs.map((tabId) => (
              <Badge key={tabId} variant="outline" className="text-xs">
                {tabId.replace('tab_', '').substring(0, 6)}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCurrentTab}
            className="w-full"
            disabled={!tabInfo.hasSession}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clear This Tab
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAllTabs}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear All Tabs
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Each browser tab has its own session</p>
          <p>• You can login with different accounts in different tabs</p>
          <p>• Sessions are isolated per tab</p>
        </div>
      </CardContent>
    </Card>
  );
};