'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@/types/social.types';

interface FollowListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
}

async function fetchFollowers(userId: string, page = 1, limit = 20): Promise<FollowListResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  const response = await fetch(`/api/users/${userId}/followers?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch followers');
  }
  return response.json();
}

async function fetchFollowing(userId: string, page = 1, limit = 20): Promise<FollowListResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  const response = await fetch(`/api/users/${userId}/following?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch following');
  }
  return response.json();
}

async function followUser(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to follow user');
  }
}

async function unfollowUser(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to unfollow user');
  }
}

async function checkFollowing(userId: string): Promise<{ isFollowing: boolean }> {
  const response = await fetch(`/api/users/${userId}/follow`);
  if (!response.ok) {
    throw new Error('Failed to check follow status');
  }
  return response.json();
}

export function useFollowers(userId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['followers', userId, page, limit],
    queryFn: () => fetchFollowers(userId, page, limit),
    staleTime: 60 * 1000,
  });
}

export function useFollowing(userId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['following', userId, page, limit],
    queryFn: () => fetchFollowing(userId, page, limit),
    staleTime: 60 * 1000,
  });
}

export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => checkFollowing(userId),
    staleTime: 60 * 1000,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followUser,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}
