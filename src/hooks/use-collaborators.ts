'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeckCollaboratorWithUser } from '@/types/social.types';
import type { InviteCollaboratorInput, UpdateCollaboratorInput } from '@/schemas/social.schema';

interface CollaboratorsResponse {
  collaborators: DeckCollaboratorWithUser[];
  total: number;
}

async function fetchCollaborators(deckId: string): Promise<CollaboratorsResponse> {
  const response = await fetch(`/api/decks/${deckId}/collaborators`);
  if (!response.ok) {
    throw new Error('Failed to fetch collaborators');
  }
  return response.json();
}

async function inviteCollaborator(params: {
  deckId: string;
  data: InviteCollaboratorInput;
}): Promise<DeckCollaboratorWithUser> {
  const response = await fetch(`/api/decks/${params.deckId}/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to invite collaborator');
  }
  return response.json();
}

async function updateCollaborator(params: {
  deckId: string;
  collaboratorId: string;
  data: UpdateCollaboratorInput;
}): Promise<DeckCollaboratorWithUser> {
  const response = await fetch(
    `/api/decks/${params.deckId}/collaborators/${params.collaboratorId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to update collaborator');
  }
  return response.json();
}

async function removeCollaborator(params: {
  deckId: string;
  collaboratorId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/decks/${params.deckId}/collaborators/${params.collaboratorId}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to remove collaborator');
  }
}

export function useCollaborators(deckId: string) {
  return useQuery({
    queryKey: ['collaborators', deckId],
    queryFn: () => fetchCollaborators(deckId),
    staleTime: 60 * 1000,
  });
}

export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteCollaborator,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.deckId] });
    },
  });
}

export function useUpdateCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollaborator,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCollaborator,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.deckId] });
    },
  });
}
