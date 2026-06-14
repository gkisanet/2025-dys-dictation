import { Link } from '@tanstack/react-router';
import { Plus, Minus, X, ChartBar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { stagesFor } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';
import { useAllProgress } from '@/features/progress/queries';

const OPS: { op: Operation; label: string; icon: typeof Plus; accent: string; color: string }[] = [
  { op: 'add', label: '덧셈', icon: Plus,  accent: 'var(--op-add)', color: 'text-sky-600' },
  { op: 'sub', label: '뺄셈', icon: Minus, accent: 'var(--op-sub)', color: 'text-emerald-600' },
  { op: 'mul', label: '곱셈', icon: X,     accent: 'var(--op-mul)', color: 'text-violet-600' },
];

export function Home() {
  const { data: progress } = useAllProgress();

  return (
    <div className="flex flex-col gap-6">
      {/* Visually rendered heading — the router test asserts this exists */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">암산 학습</h1>
        <p className="mt-1 text-muted-foreground">오늘도 암산 연습해요 👋</p>
      </div>

      {/* Operation cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPS.map(({ op, label, icon: Icon, accent, color }) => {
          const stages = stagesFor(op);
          const masteredCount = progress
            ? stages.filter((s) => progress[s.id]?.mastered).length
            : 0;
          const ratio = stages.length > 0 ? masteredCount / stages.length : 0;

          return (
            <Link key={op} to="/learn/$operation" params={{ operation: op }}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
                <CardContent className="flex flex-col gap-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent}20` }}
                    >
                      <Icon className={`size-5 ${color}`} />
                    </div>
                    <span className="text-lg font-semibold">{label}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>마스터</span>
                      <span>{masteredCount} / {stages.length}</span>
                    </div>
                    <ProgressBar value={ratio} color={accent} label="학습 진행도" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Progress link card */}
      <Link to="/progress">
        <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
          <CardContent className="flex items-center justify-between pt-5">
            <div className="flex items-center gap-3">
              <ChartBar className="size-5 text-muted-foreground" />
              <span className="font-medium">학습 진도 보기</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
