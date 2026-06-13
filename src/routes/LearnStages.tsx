import { Link, useParams } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { stagesFor } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';

const OP_TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function LearnStages() {
  const { operation } = useParams({ from: '/learn/$operation' });
  const stages = stagesFor(operation as Operation);

  return (
    <main className="mx-auto max-w-md p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mb-6 text-2xl font-bold">
        {OP_TITLES[operation] ?? operation} 단계 선택
      </h1>
      <ul className="flex flex-col gap-3">
        {stages.map((s) => (
          <li key={s.id}>
            <Link
              to="/solve/$operation/$stageId"
              params={{ operation: s.operation, stageId: s.id }}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.subtitle}</div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
