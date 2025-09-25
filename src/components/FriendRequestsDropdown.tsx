import React from 'react';
import { Bell, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';

export const FriendRequestsDropdown = () => {
  const { user } = useAuth();
  const { incomingRequests, acceptFriendRequest, rejectFriendRequest, loading } = useFriends();

  if (!user || loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {incomingRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {incomingRequests.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Friend Requests</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {incomingRequests.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              No pending requests
            </div>
          </DropdownMenuItem>
        ) : (
          incomingRequests.map((request) => (
            <DropdownMenuItem key={request.id} className="p-3">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={request.requester.avatar_url || undefined} 
                    alt={request.requester.display_name || 'User'} 
                  />
                  <AvatarFallback>
                    {(request.requester.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {request.requester.display_name || 'Unknown User'}
                    </p>
                    {request.requester.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  {request.requester.specialization && (
                    <p className="text-xs text-muted-foreground truncate">
                      {request.requester.specialization}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptFriendRequest(request.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectFriendRequest(request.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};