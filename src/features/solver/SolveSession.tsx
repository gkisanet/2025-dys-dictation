import { useMemo } from 'react';
import type { Problem } from './steps/types';
import { buildAddition } from './steps/buildAddition';
import { useSolveEngine } from './useSolveEngine';
import { WorksheetRenderer } from './WorksheetRenderer';
import { NarrationPanel } from './ui/NarrationPanel';
import { QuizPanel } from './ui/QuizPanel';
import { Controls } from './ui/Controls';

export function SolveSession({ problem }: { problem: Problem }) {
  const steps = useMemo(() => buildAddition(problem), [problem]);
  const engine = useSolveEngine(steps);
  const { current } = engine;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-xs text-muted-foreground">
        단계 {engine.index + 1} / {engine.total} · 점수 {engine.score.correct}/{engine.score.total}
      </div>

      <div className="min-h-[12rem] py-2">
        <WorksheetRenderer board={current.board} />
      </div>

      <NarrationPanel text={current.narration} />

      {current.quiz && (
        <QuizPanel
          quiz={current.quiz}
          feedback={engine.feedback}
          hint={engine.hint}
          revealedAnswer={engine.revealedAnswer}
          onSubmit={engine.submit}
        />
      )}

      <Controls
        canAdvance={engine.canAdvance}
        isDone={engine.isDone}
        onNext={engine.next}
        onReset={engine.reset}
      />
    </div>
  );
}
