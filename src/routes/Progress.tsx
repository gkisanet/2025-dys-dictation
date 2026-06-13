import { Link } from '@tanstack/react-router';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { STAGES } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';
import { useAllProgress } from '@/features/progress/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';

const OP_TITLES: Record<Operation, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };
const OP_ACCENT: Record<Operation, string> = {
  add: 'var(--op-add)',
  sub: 'var(--op-sub)',
  mul: 'var(--op-mul)',
};
const OPS: Operation[] = ['add', 'sub', 'mul'];

export function Progress() {
  const { data: progress, isLoading } = useAllProgress();

  const masteredCount = progress
    ? Object.values(progress).filter((sp) => sp.mastered).length
    : 0;
  const totalCount = STAGES.length;
  const overallRatio = totalCount > 0 ? masteredCount / totalCount : 0;

  // Check if any stage has been attempted
  const hasAnyAttempt = progress
    ? Object.values(progress).some((sp) => sp.attempts > 0)
    : false;

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading — router test asserts this */}
      <h1 className="text-2xl font-bold">학습 진도</h1>

      {/* Summary card */}
      {!isLoading && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">전체 마스터</span>
              <span className="font-semibold">{masteredCount} / {totalCount}</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={overallRatio} />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      )}

      {/* Empty state */}
      {!isLoading && !hasAnyAttempt && (
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-muted-foreground">아직 기록이 없어요. 첫 학습을 시작해요!</p>
            <Link
              to="/"
              className="mt-3 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              학습 시작하기
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Per-operation sections */}
      {OPS.map((op) => {
        const stages = STAGES.filter((s) => s.operation === op);
        const accent = OP_ACCENT[op];
        const opMastered = progress
          ? stages.filter((s) => progress[s.id]?.mastered).length
          : 0;

        return (
          <section key={op} className="flex flex-col gap-2">
            {/* Accented section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: accent }}>
                {OP_TITLES[op]}
              </h2>
              <span className="text-xs text-muted-foreground">
                {opMastered}/{stages.length} 마스터
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {stages.map((s) => {
                const sp = progress?.[s.id];
                const mastered = sp?.mastered ?? false;
                const attempted = sp && sp.attempts > 0;

                return (
                  <Card key={s.id}>
                    <div className="flex items-center gap-3 p-3">
                      {mastered ? (
                        <CheckCircle2 className="size-5 shrink-0" style={{ color: accent }} />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground/30" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">{s.title}</span>
                          {mastered && (
                            <Badge variant="success">마스터</Badge>
                          )}
                        </div>
                        {attempted ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {sp!.attempts}회 · 최고 {Math.round(sp!.bestScore * 100)}%
                          </div>
                        ) : (
                          <div className="mt-0.5 text-xs text-muted-foreground">미시도</div>
                        )}
                      </div>
                      <Link
                        to="/solve/$operation/$stageId"
                        params={{ operation: s.operation, stageId: s.id }}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`${s.title} 풀기`}
                      >
                        <Play className="size-4" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
