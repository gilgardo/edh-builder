'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInviteCollaborator } from '@/hooks/use-collaborators';
import { useToast } from '@/components/ui/toast';
import { InviteCollaboratorSchema, type InviteCollaboratorInput } from '@/schemas/social.schema';

interface InviteCollaboratorDialogProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteCollaboratorDialog({
  deckId,
  open,
  onOpenChange,
}: InviteCollaboratorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inviteCollaborator = useInviteCollaborator();
  const { toast } = useToast();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteCollaboratorInput>({
    resolver: zodResolver(InviteCollaboratorSchema),
    defaultValues: {
      userId: '',
      role: 'VIEWER',
    },
  });

  const selectedRole = watch('role');
  const selectedUserId = watch('userId');

  const onSubmit = (data: InviteCollaboratorInput) => {
    inviteCollaborator.mutate(
      { deckId, data },
      {
        onSuccess: () => {
          reset();
          setSearchQuery('');
          onOpenChange(false);
        },
        onError: () => toast('Failed to send invite', 'error'),
      }
    );
  };

  const handleClose = () => {
    reset();
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this deck. They will receive a notification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">User ID or Username</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Enter user ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setValue('userId', e.target.value);
                }}
                className="pl-9"
              />
            </div>
            {errors.userId && (
              <p className="text-sm text-destructive">{errors.userId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the user ID of the person you want to invite.
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as 'VIEWER' | 'EDITOR' | 'ADMIN')}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col items-start">
                    <span>Viewer</span>
                    <span className="text-xs text-muted-foreground">Can view the deck</span>
                  </div>
                </SelectItem>
                <SelectItem value="EDITOR">
                  <div className="flex flex-col items-start">
                    <span>Editor</span>
                    <span className="text-xs text-muted-foreground">Can add and remove cards</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col items-start">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">Can manage collaborators</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteCollaborator.isPending || !selectedUserId}>
              {inviteCollaborator.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
