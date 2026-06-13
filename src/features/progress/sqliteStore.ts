import { asc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { attempts as attemptsTable } from '@/db/schema';
import type { Attempt, ProgressStore } from './types';
import type { Operation } from '@/features/solver/steps/types';

export function createSqliteStore(): ProgressStore {
  return {
    async recordAttempt(a: Attempt): Promise<void> {
      const db = await getDb();
      await db.insert(attemptsTable).values({
        stageId: a.stageId,
        operation: a.operation,
        operandA: a.operandA,
        operandB: a.operandB,
        quizCorrect: a.quizCorrect,
        quizTotal: a.quizTotal,
        createdAt: a.createdAt,
      });
    },

    async getAllAttempts(): Promise<Attempt[]> {
      const db = await getDb();
      const rows = await db.select().from(attemptsTable).orderBy(asc(attemptsTable.id));
      return rows.map((r) => ({
        id: r.id,
        stageId: r.stageId,
        operation: r.operation as Operation,
        operandA: r.operandA,
        operandB: r.operandB,
        quizCorrect: r.quizCorrect,
        quizTotal: r.quizTotal,
        createdAt: r.createdAt,
      }));
    },
  };
}
