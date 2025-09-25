import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, Stethoscope, LogOut, User, MessageCircle, Menu, Download, Users, Trophy, Search, Bookmark } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { useProfiles } from '@/hooks/useProfiles';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FriendRequestsDropdown } from './FriendRequestsDropdown';
import { useMessages } from '@/hooks/useMessages';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { user, signOut } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const { fetchProfile } = useProfiles();
  const { totalUnreadCount } = useMessages();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setUserProfile);
    }
  }, [user, fetchProfile]);

  const handleAvatarUpdate = (url: string) => {
    setUserProfile(prev => prev ? {...prev, avatar_url: url} : null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ghibli-nature/20 bg-ghibli-gradient/95 backdrop-blur supports-[backdrop-filter]:bg-ghibli-gradient/80 shadow-ghibli">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
          <Stethoscope className="h-6 w-6 text-ghibli-nature" />
           <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-ghibli-nature to-ghibli-sky bg-clip-text text-transparent">
             Doc Hangout
           </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/communities" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors font-medium">
                Communities
              </Link>
              <Link to="/collaborate" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors font-medium">
                Collaborate
              </Link>
              <Link to="/messages" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors flex items-center gap-2 font-medium">
                <MessageCircle className="h-4 w-4" />
                Messages
                {totalUnreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1.5 rounded-full bg-ghibli-magic text-white">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Link>
              <Link to="/leaderboard" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors flex items-center gap-1 font-medium">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link to="/search" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors flex items-center gap-1 font-medium">
                <Search className="h-4 w-4" />
                Search
              </Link>
              <Link to="/saved-posts" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors flex items-center gap-1 font-medium">
                <Bookmark className="h-4 w-4" />
                Saved
              </Link>
              <Link to="/profile-completion" className="text-ghibli-nature/80 hover:text-ghibli-nature transition-colors flex items-center gap-1 font-medium">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/about" className="text-foreground/80 hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/safety" className="text-foreground/80 hover:text-foreground transition-colors">
                Safety
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <Button variant="outline" size="sm" onClick={installApp} className="hidden sm:flex">
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          )}
          
          {user ? (
            <div className="flex items-center gap-2">
              {/* Friend Requests Dropdown */}
              <FriendRequestsDropdown />
              
              {/* Desktop user info */}
              <div className="hidden sm:flex items-center gap-3">
                <AvatarUpload 
                  currentAvatar={userProfile?.avatar_url}
                  displayName={userProfile?.display_name || user.user_metadata?.display_name || user.email || 'User'}
                  onAvatarUpdate={handleAvatarUpdate}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-32">
                    {userProfile?.display_name || user.user_metadata?.display_name || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">Click avatar to upload</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              
              {/* Mobile Avatar */}
              <div className="sm:hidden">
                <AvatarUpload 
                  currentAvatar={userProfile?.avatar_url}
                  displayName={userProfile?.display_name || user.user_metadata?.display_name || user.email || 'User'}
                  onAvatarUpdate={handleAvatarUpdate}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghibli" size="sm" className="hover:scale-105 transition-transform">
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Join Hangout</span>
                </Button>
              </Link>
            </>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <AvatarUpload 
                      currentAvatar={userProfile?.avatar_url}
                      displayName={userProfile?.display_name || user.user_metadata?.display_name || user.email || 'User'}
                      onAvatarUpdate={handleAvatarUpdate}
                      size="md"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {userProfile?.display_name || user.user_metadata?.display_name || user.email}
                      </span>
                    </div>
                  </div>
                )}
                
                {user ? (
                  <>
                    <Link to="/communities" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Users className="h-5 w-5" />
                      Communities
                    </Link>
                    <Link to="/collaborate" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <MessageCircle className="h-5 w-5" />
                      Collaborate
                    </Link>
                    <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5" />
                        Messages
                      </div>
                      {totalUnreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1.5 rounded-full">
                          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                        </Badge>
                      )}
                    </Link>
                    <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Trophy className="h-5 w-5" />
                      Leaderboard
                    </Link>
                    <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Search className="h-5 w-5" />
                      Search
                    </Link>
                    <Link to="/saved-posts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Bookmark className="h-5 w-5" />
                      Saved Posts
                    </Link>
                    <Link to="/profile-completion" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <User className="h-5 w-5" />
                      About
                    </Link>
                  </>
                )}
                <Link to="/safety" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                  <Stethoscope className="h-5 w-5" />
                  Safety
                </Link>
                
                {isInstallable && (
                  <Button onClick={installApp} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Button>
                )}
                
                {user ? (
                  <Button variant="outline" onClick={signOut} className="mt-4">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="mt-4 w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;