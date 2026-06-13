import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { SolveSession } from '@/features/solver/SolveSession';
import { generateProblem } from '@/features/problems/generateProblem';
import { getStage } from '@/features/curriculum/curriculum';

export function Solve() {
  const { operation, stageId } = useParams({ from: '/solve/$operation/$stageId' });
  const stage = getStage(stageId);

  const [problem] = useState(() => {
    if (!stage) return null;
    return generateProblem(stage.pattern);
  });

  if (!stage || !problem) {
    return (
      <main className="mx-auto max-w-md p-6">
        <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
          ← 홈으로
        </Link>
        <p className="text-destructive">알 수 없는 단계: {stageId}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <Link
        to="/learn/$operation"
        params={{ operation }}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← 단계 목록
      </Link>
      <h1 className="mb-6 text-xl font-bold">{stage.title}</h1>
      <SolveSession problem={problem} verbosity={stage.verbosity} stageId={stage.id} />
    </main>
  );
}
