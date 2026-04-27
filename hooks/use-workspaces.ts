'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listWorkspacesFromDB,
  loadWorkspaceFromDB,
  upsertWorkspaceToDB,
  deleteWorkspaceFromDB,
} from '@/services/db.service';
import { workspaceKeys } from '@/lib/api-keys';
import type { Idea } from '@/types';
import type { WorkspaceTask, ContentItem } from '@/types/workspace.types';

export function useWorkspaces(userId: string | undefined) {
  return useQuery({
    queryKey: workspaceKeys.all(userId),
    queryFn: () => listWorkspacesFromDB(userId!),
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useWorkspace(
  userId: string | undefined,
  slug: string | undefined
) {
  return useQuery({
    queryKey: workspaceKeys.bySlug(userId!, slug!),
    queryFn: () => loadWorkspaceFromDB(userId!, slug!),
    enabled: !!userId && !!slug,
    staleTime: 0,
  });
}

export function useUpsertWorkspace(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      slug: string;
      title: string;
      idea: Idea;
      tasks: WorkspaceTask[];
      content: ContentItem[];
    }) => {
      if (!userId) return Promise.resolve();
      return upsertWorkspaceToDB({ userId, ...params });
    },
    onSuccess: (_data, vars) => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all(userId) });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.bySlug(userId, vars.slug),
      });
    },
  });
}

export function useDeleteWorkspace(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => {
      if (!userId) return Promise.resolve();
      return deleteWorkspaceFromDB(userId, slug);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: workspaceKeys.all(userId) });
    },
  });
}
