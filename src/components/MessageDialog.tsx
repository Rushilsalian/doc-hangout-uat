import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useModerationSystem } from "@/hooks/useModerationSystem";

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientAvatar: string;
}

const MessageDialog = ({ open, onOpenChange, recipientName, recipientAvatar }: MessageDialogProps) => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { moderateContent } = useModerationSystem();

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }

    // Check for profanity
    if (!moderateContent(message)) {
      return;
    }

    // Save message to localStorage for demo
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const newConversation = {
      id: Date.now().toString(),
      userId: recipientName.toLowerCase().replace(/\s+/g, '-'),
      userName: recipientName,
      userAvatar: recipientAvatar,
      lastMessage: message,
      timestamp: "Just now",
      unreadCount: 0
    };

    const existingIndex = conversations.findIndex((c: any) => c.userName === recipientName);
    if (existingIndex >= 0) {
      conversations[existingIndex] = newConversation;
    } else {
      conversations.unshift(newConversation);
    }

    localStorage.setItem('conversations', JSON.stringify(conversations));

    toast({ title: "Message sent!", description: `Your message to ${recipientName} has been sent.` });
    setMessage("");
    onOpenChange(false);
    
    // Navigate to messages page
    navigate('/messages');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{recipientAvatar}</AvatarFallback>
            </Avatar>
            Message {recipientName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          
          <div className="flex gap-2">
            <Button onClick={handleSendMessage} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;