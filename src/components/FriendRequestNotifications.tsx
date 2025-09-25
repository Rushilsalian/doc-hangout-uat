import { Bell, Check, X, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriends } from '@/hooks/useFriends';
import { formatDistanceToNow } from 'date-fns';

export const FriendRequestNotifications = () => {
  const { incomingRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();

  if (incomingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Friend Requests
          <Badge variant="secondary" className="text-xs">
            {incomingRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-60">
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.requester.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {request.requester.display_name || 'Unknown User'}
                      </span>
                      {request.requester.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {request.requester.specialization && (
                        <span>{request.requester.specialization} • </span>
                      )}
                      {formatDistanceToNow(new Date(request.created_at))} ago
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => acceptFriendRequest(request.id)}
                    className="h-8 px-3"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectFriendRequest(request.id)}
                    className="h-8 px-3"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};