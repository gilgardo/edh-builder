'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage } from '@/hooks/use-messages';
import { useToast } from '@/components/ui/toast';

interface NewMessageDialogProps {
  recipientId?: string;
  recipientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMessageDialog({
  recipientId,
  recipientName,
  open,
  onOpenChange,
}: NewMessageDialogProps) {
  const router = useRouter();
  const [userId, setUserId] = useState(recipientId ?? '');
  const [content, setContent] = useState('');
  const sendMessage = useSendMessage();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !content.trim()) return;

    sendMessage.mutate(
      {
        recipientId: userId,
        content: content.trim(),
      },
      {
        onSuccess: (message) => {
          // Navigate to the conversation
          const conversationId = message.conversationId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.push(`/messages/${conversationId}` as any);
          onOpenChange(false);
          setContent('');
          setUserId('');
        },
        onError: () => toast('Failed to send message', 'error'),
      }
    );
  };

  const handleClose = () => {
    setContent('');
    if (!recipientId) setUserId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            {recipientName
              ? `Send a message to ${recipientName}`
              : 'Start a new conversation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!recipientId && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient User ID</Label>
              <Input
                id="recipient"
                placeholder="Enter user ID..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendMessage.isPending || !userId.trim() || !content.trim()}
            >
              {sendMessage.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
