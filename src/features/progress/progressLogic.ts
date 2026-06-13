import type { Attempt, StageProgress } from './types';

const ratio = (a: Attempt) => (a.quizTotal > 0 ? a.quizCorrect / a.quizTotal : 0);

/** Mastered once any attempt scores a perfect run with at least one quiz, OR
 *  best ratio >= 0.8 across >= 2 attempts. */
export function foldStage(stageId: string, attempts: Attempt[]): StageProgress {
  const mine = attempts.filter((a) => a.stageId === stageId);
  if (mine.length === 0) return { stageId, attempts: 0, bestScore: 0, lastScore: 0, mastered: false };
  const best = Math.max(...mine.map(ratio));
  const last = ratio(mine[mine.length - 1]);
  const perfect = mine.some((a) => a.quizTotal > 0 && a.quizCorrect === a.quizTotal);
  const mastered = perfect || (best >= 0.8 && mine.length >= 2);
  return { stageId, attempts: mine.length, bestScore: best, lastScore: last, mastered };
}

export function foldAll(stageIds: string[], attempts: Attempt[]): Record<string, StageProgress> {
  return Object.fromEntries(stageIds.map((id) => [id, foldStage(id, attempts)]));
}
