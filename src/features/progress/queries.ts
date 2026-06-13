import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProgressStore } from './store';
import { foldAll } from './progressLogic';
import type { Attempt } from './types';

export const PROGRESS_KEY = ['progress'] as const;

export function useAllProgress(stageIds: string[]) {
  return useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: async () => {
      const store = getProgressStore();
      return foldAll(stageIds, await store.getAllAttempts());
    },
  });
}

export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Attempt) => getProgressStore().recordAttempt(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROGRESS_KEY }),
  });
}
