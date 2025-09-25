import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

const AVATAR_OPTIONS = [
  { id: 1, emoji: "👨‍⚕️", name: "Male Doctor" },
  { id: 2, emoji: "👩‍⚕️", name: "Female Doctor" },
  { id: 3, emoji: "🧑‍⚕️", name: "Doctor" },
  { id: 4, emoji: "👨‍🔬", name: "Male Scientist" },
  { id: 5, emoji: "👩‍🔬", name: "Female Scientist" },
  { id: 6, emoji: "🧑‍🔬", name: "Scientist" },
  { id: 7, emoji: "🩺", name: "Stethoscope" },
  { id: 8, emoji: "💊", name: "Medicine" },
  { id: 9, emoji: "🏥", name: "Hospital" },
  { id: 10, emoji: "🔬", name: "Microscope" },
  { id: 11, emoji: "🧬", name: "DNA" },
  { id: 12, emoji: "❤️", name: "Heart" }
];

interface AvatarSelectorProps {
  currentAvatar?: string;
  onSelect: (avatar: string) => void;
}

const AvatarSelector = ({ currentAvatar, onSelect }: AvatarSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto">
          Change Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3 p-4">
          {AVATAR_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className={`h-16 w-16 text-2xl ${currentAvatar === option.emoji ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleSelect(option.emoji)}
            >
              {option.emoji}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;