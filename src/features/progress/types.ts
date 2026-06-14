import type { Operation } from '@/features/solver/steps/types';

export interface Attempt {
  id?: number;
  stageId: string;
  operation: Operation;
  operandA: number;
  operandB: number;
  quizCorrect: number;
  quizTotal: number;
  createdAt: number; // epoch ms
}

export interface StageProgress {
  stageId: string;
  attempts: number;
  bestScore: number;   // best quizCorrect/quizTotal as 0..1 (0 if quizTotal 0)
  lastScore: number;
  mastered: boolean;
}

export interface ProgressStore {
  recordAttempt(a: Attempt): Promise<void>;
  getAllAttempts(): Promise<Attempt[]>;
}
