import { Link, useParams } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { stagesFor } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';
import { useAllProgress } from '@/features/progress/queries';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const OP_TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };
const OP_ACCENT: Record<string, string> = {
  add: 'var(--op-add)',
  sub: 'var(--op-sub)',
  mul: 'var(--op-mul)',
};

export function LearnStages() {
  const { operation } = useParams({ from: '/learn/$operation' });
  const stages = stagesFor(operation as Operation);
  const { data: progress } = useAllProgress();

  if (stages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" />
          홈으로
        </Link>
        <p className="text-muted-foreground">알 수 없는 연산: {operation}</p>
      </div>
    );
  }

  const accent = OP_ACCENT[operation] ?? 'var(--primary)';

  return (
    <div className="flex flex-col gap-5">
      {/* Back affordance */}
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="size-4" />
        홈으로
      </Link>

      {/* Accented header */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: `${accent}18` }}
      >
        <h1 className="text-xl font-bold" style={{ color: accent }}>
          {OP_TITLES[operation] ?? operation} 단계 선택
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: accent, opacity: 0.75 }}>
          단계를 선택해서 시작하세요
        </p>
      </div>

      {/* Stage cards */}
      <ul className="flex flex-col gap-3">
        {stages.map((s) => {
          const sp = progress?.[s.id];
          const mastered = sp?.mastered ?? false;
          const attempted = sp && sp.attempts > 0;

          return (
            <li key={s.id}>
              <Link
                to="/solve/$operation/$stageId"
                params={{ operation: s.operation, stageId: s.id }}
                className="block"
              >
                <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
                  <div className="flex items-center gap-3 p-4">
                    {/* Mastery icon */}
                    {mastered ? (
                      <CheckCircle2 className="size-6 shrink-0" style={{ color: accent }} />
                    ) : (
                      <Circle className="size-6 shrink-0 text-muted-foreground/30" />
                    )}

                    {/* Stage info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{s.title}</span>
                        {mastered && (
                          <Badge variant="success">마스터 ✓</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">{s.subtitle}</div>
                      {attempted && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          최고 {Math.round(sp!.bestScore * 100)}%
                        </div>
                      )}
                    </div>

                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
