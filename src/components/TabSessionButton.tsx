import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TabSessionManager } from './TabSessionManager';
import { Monitor } from 'lucide-react';

export const TabSessionButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tab Session Manager</DialogTitle>
        </DialogHeader>
        <TabSessionManager />
      </DialogContent>
    </Dialog>
  );
};