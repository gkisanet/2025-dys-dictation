import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { SolveSession } from '@/features/solver/SolveSession';
import { generateProblem } from '@/features/problems/generateProblem';
import { getStage, stagesFor } from '@/features/curriculum/curriculum';
import type { Operation } from '@/features/solver/steps/types';

export function Solve() {
  const { operation, stageId } = useParams({ from: '/solve/$operation/$stageId' });
  // Key by stageId so navigating to a new stage (same route) REMOUNTS the
  // player — otherwise `problem`/engine state would persist and the screen
  // would not change when pressing "다음 단계".
  return <StagePlayer key={stageId} operation={operation} stageId={stageId} />;
}

function StagePlayer({ operation, stageId }: { operation: string; stageId: string }) {
  const stage = getStage(stageId);

  const [problem] = useState(() => {
    if (!stage) return null;
    return generateProblem(stage.pattern);
  });

  if (!stage || !problem) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" />
          홈으로
        </Link>
        <p className="text-destructive">알 수 없는 단계: {stageId}</p>
      </div>
    );
  }

  // Compute next stage for the completion screen
  const stages = stagesFor(stage.operation as Operation);
  const currentIdx = stages.findIndex((s) => s.id === stage.id);
  const nextStage = currentIdx >= 0 && currentIdx + 1 < stages.length ? stages[currentIdx + 1] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        to="/learn/$operation"
        params={{ operation }}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        단계 목록
      </Link>

      {/* Stage title — the router test asserts this heading */}
      <h1 className="text-xl font-bold">{stage.title}</h1>

      <SolveSession
        problem={problem}
        verbosity={stage.verbosity}
        stageId={stage.id}
        operation={operation}
        nextStageId={nextStage?.id}
      />
    </div>
  );
}
