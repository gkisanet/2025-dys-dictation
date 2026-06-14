import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STAGES } from '@/features/curriculum/curriculum';
import { getProgressStore } from './store';
import { foldAll } from './progressLogic';
import type { Attempt } from './types';

const PROGRESS_KEY = ['progress'] as const;
const ALL_STAGE_IDS = STAGES.map((s) => s.id);

/** Folded progress for EVERY stage, keyed by stage id. Components index the ones they need. */
export function useAllProgress() {
  return useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: async () => foldAll(ALL_STAGE_IDS, await getProgressStore().getAllAttempts()),
  });
}

export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Attempt) => getProgressStore().recordAttempt(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROGRESS_KEY }),
  });
}
