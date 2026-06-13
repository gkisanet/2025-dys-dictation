import { Link } from '@tanstack/react-router';
import { CheckCircle2, Circle } from 'lucide-react';
import { STAGES } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';
import { useAllProgress } from '@/features/progress/queries';

const OP_TITLES: Record<Operation, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };
const OPS: Operation[] = ['add', 'sub', 'mul'];

export function Progress() {
  const allStageIds = STAGES.map((s) => s.id);
  const { data: progress, isLoading } = useAllProgress(allStageIds);

  const masteredCount = progress
    ? Object.values(progress).filter((sp) => sp.mastered).length
    : 0;
  const totalCount = STAGES.length;

  return (
    <main className="mx-auto max-w-md p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mb-2 text-2xl font-bold">학습 진도</h1>
      {!isLoading && (
        <p className="mb-6 text-sm text-muted-foreground">
          마스터 {masteredCount} / 전체 {totalCount}
        </p>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      )}

      {OPS.map((op) => {
        const stages = STAGES.filter((s) => s.operation === op);
        return (
          <section key={op} className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">{OP_TITLES[op]}</h2>
            <ul className="flex flex-col gap-2">
              {stages.map((s) => {
                const sp = progress?.[s.id];
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {sp?.mastered ? (
                        <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground/30 shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{s.title}</div>
                        {sp && sp.attempts > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {sp.attempts}회 · 최고 {Math.round(sp.bestScore * 100)}%
                            {sp.mastered && ' · 마스터 ✓'}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">미시도</div>
                        )}
                      </div>
                    </div>
                    <Link
                      to="/solve/$operation/$stageId"
                      params={{ operation: s.operation, stageId: s.id }}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      풀기
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
