'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveValidation,
  deleteValidation,
  renameValidation,
  getValidations,
  getValidation,
  updateValidation,
} from '@/services/db/validation.db';
import { useValidateStore } from '@/stores/validate.store';
import { toast } from 'sonner';
import { validationKeys } from '@/lib/api-keys';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useSaveValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      description: string;
      productType: string;
      result: EnhancedValidationResult;
      competitors: Competitor[];
    }) => {
      if (!userId) return Promise.resolve('');
      return saveValidation({ userId, ...params });
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

export function useRenameValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) => {
      if (!userId) return Promise.resolve();
      return renameValidation(userId, id, description);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

export function useDeleteValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) return Promise.resolve();
      return deleteValidation(userId, id);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
  });
}

export function useUpdateValidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      description,
      result,
      competitors,
    }: {
      id: string;
      description: string;
      result: EnhancedValidationResult;
      competitors: Competitor[];
    }) => {
      if (!userId) return Promise.resolve();
      return updateValidation(userId, id, description, result, competitors);
    },
    onSuccess: () => {
      if (userId)
        queryClient.invalidateQueries({ queryKey: validationKeys.all(userId) });
    },
    onError: () => toast.error('Failed to update validation.'),
  });
}

export function useGetValidations(userId: string | undefined) {
  return useQuery({
    queryKey: validationKeys.all(userId),
    queryFn: () => getValidations(userId!),
    enabled: !!userId,
  });
}

export function useGetValidation(userId: string | undefined, id: string) {
  const localEntry = useValidateStore((s) =>
    s.localValidations.find((v) => v.id === id)
  );
  const isUUID = UUID_RE.test(id);
  return useQuery({
    queryKey: validationKeys.byId(userId ?? '', id),
    queryFn: () => getValidation(userId!, id),
    enabled: !!userId && isUUID,
    placeholderData:
      !isUUID && localEntry
        ? {
            id: localEntry.id,
            description: localEntry.description,
            product_type: localEntry.productType,
            result_json: localEntry.result,
            competitors_json: localEntry.competitors,
            created_at: new Date(localEntry.createdAt).toISOString(),
          }
        : undefined,
  });
}
