// Custom storage adapter for tab-isolated sessions
class TabSessionStorage {
  constructor() {
    // Generate a unique tab ID if it doesn't exist
    if (!sessionStorage.getItem('tab_id')) {
      sessionStorage.setItem('tab_id', `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }

  private getTabId(): string {
    return sessionStorage.getItem('tab_id') || 'default_tab';
  }

  private getKey(key: string): string {
    return `${this.getTabId()}_${key}`;
  }

  getItem(key: string): string | null {
    return sessionStorage.getItem(this.getKey(key));
  }

  setItem(key: string, value: string): void {
    sessionStorage.setItem(this.getKey(key), value);
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(this.getKey(key));
  }

  // Clear all items for this tab
  clear(): void {
    const tabId = this.getTabId();
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(`${tabId}_`)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Get all tab sessions (for debugging/management)
  getAllTabSessions(): string[] {
    const keys = Object.keys(sessionStorage);
    const tabIds = new Set<string>();
    
    keys.forEach(key => {
      if (key.includes('_sb-') && key.includes('_auth-token')) {
        const tabId = key.split('_')[0];
        if (tabId.startsWith('tab_')) {
          tabIds.add(tabId);
        }
      }
    });
    
    return Array.from(tabIds);
  }

  // Get current tab info
  getCurrentTabInfo(): { tabId: string; hasSession: boolean } {
    const tabId = this.getTabId();
    const hasSession = this.getItem('sb-quuayvprtbwwvfkufyqc-auth-token') !== null;
    
    return { tabId, hasSession };
  }
}

export const tabSessionStorage = new TabSessionStorage();