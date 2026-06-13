import { Link, useParams } from '@tanstack/react-router';
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { stagesFor } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';
import { useAllProgress } from '@/features/progress/queries';

const OP_TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function LearnStages() {
  const { operation } = useParams({ from: '/learn/$operation' });
  const stages = stagesFor(operation as Operation);
  const { data: progress } = useAllProgress();

  return (
    <main className="mx-auto max-w-md p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mb-6 text-2xl font-bold">
        {OP_TITLES[operation] ?? operation} 단계 선택
      </h1>
      <ul className="flex flex-col gap-3">
        {stages.map((s) => {
          const sp = progress?.[s.id];
          return (
            <li key={s.id}>
              <Link
                to="/solve/$operation/$stageId"
                params={{ operation: s.operation, stageId: s.id }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  {sp?.mastered ? (
                    <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/30 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{s.subtitle}</div>
                    {sp && sp.attempts > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        최고 {Math.round(sp.bestScore * 100)}%
                        {sp.mastered && ' · 마스터'}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
