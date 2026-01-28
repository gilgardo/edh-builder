'use client';

import { useState } from 'react';
import { Loader2, MoreVertical, UserX, Shield, ShieldCheck, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CollaborationBadge } from './collaboration-badge';
import { InviteCollaboratorDialog } from './invite-collaborator-dialog';
import { useCollaborators, useUpdateCollaborator, useRemoveCollaborator } from '@/hooks/use-collaborators';
import { useToast } from '@/components/ui/toast';
import type { DeckCollaboratorWithUser } from '@/types/social.types';
import type { CollaboratorRole } from '@prisma/client';

interface CollaboratorListProps {
  deckId: string;
  isOwner: boolean;
}

export function CollaboratorList({ deckId, isOwner }: CollaboratorListProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<DeckCollaboratorWithUser | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useCollaborators(deckId);
  const updateCollaborator = useUpdateCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const collaborators = data?.collaborators ?? [];

  const handleRoleChange = (collaborator: DeckCollaboratorWithUser, newRole: CollaboratorRole) => {
    updateCollaborator.mutate(
      {
        deckId,
        collaboratorId: collaborator.id,
        data: { role: newRole },
      },
      {
        onError: () => toast('Failed to update collaborator role', 'error'),
      }
    );
  };

  const handleRemove = () => {
    if (!collaboratorToRemove) return;
    removeCollaborator.mutate(
      {
        deckId,
        collaboratorId: collaboratorToRemove.id,
      },
      {
        onSuccess: () => setCollaboratorToRemove(null),
        onError: () => toast('Failed to remove collaborator', 'error'),
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Collaborators</CardTitle>
          {isOwner && (
            <Button size="sm" onClick={() => setShowInviteDialog(true)}>
              Invite
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collaborators yet
            </p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <CollaboratorItem
                  key={collaborator.id}
                  collaborator={collaborator}
                  isOwner={isOwner}
                  onRoleChange={handleRoleChange}
                  onRemove={() => setCollaboratorToRemove(collaborator)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <InviteCollaboratorDialog
        deckId={deckId}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!collaboratorToRemove}
        onOpenChange={(open: boolean) => !open && setCollaboratorToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium">
                {collaboratorToRemove?.user.name ?? collaboratorToRemove?.user.username}
              </span>{' '}
              as a collaborator? They will lose access to this deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface CollaboratorItemProps {
  collaborator: DeckCollaboratorWithUser;
  isOwner: boolean;
  onRoleChange: (collaborator: DeckCollaboratorWithUser, role: CollaboratorRole) => void;
  onRemove: () => void;
}

function CollaboratorItem({ collaborator, isOwner, onRoleChange, onRemove }: CollaboratorItemProps) {
  const initials = collaborator.user.name
    ? collaborator.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : collaborator.user.username?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        <Link href={`/users/${collaborator.userId}` as Route}>
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={collaborator.user.image ?? undefined}
              alt={collaborator.user.name ?? collaborator.user.username ?? 'User'}
            />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link href={`/users/${collaborator.userId}` as Route} className="font-medium hover:underline text-sm">
            {collaborator.user.name ?? collaborator.user.username}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <CollaborationBadge role={collaborator.role} status={collaborator.status} />
          </div>
        </div>
      </div>

      {isOwner && collaborator.status === 'ACCEPTED' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onRoleChange(collaborator, 'VIEWER')}
              disabled={collaborator.role === 'VIEWER'}
            >
              <Eye className="mr-2 h-4 w-4" />
              Set as Viewer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRoleChange(collaborator, 'EDITOR')}
              disabled={collaborator.role === 'EDITOR'}
            >
              <Shield className="mr-2 h-4 w-4" />
              Set as Editor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRoleChange(collaborator, 'ADMIN')}
              disabled={collaborator.role === 'ADMIN'}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Set as Admin
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
              <UserX className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
