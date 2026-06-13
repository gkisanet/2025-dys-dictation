import { useEffect, useMemo, useRef } from 'react';
import type { Problem, Verbosity } from './steps/types';
import { buildAddition } from './steps/buildAddition';
import { buildSubtraction } from './steps/buildSubtraction';
import { buildMultiplication } from './steps/buildMultiplication';
import { applyVerbosityFor } from './steps/verbosity';
import { useSolveEngine } from './useSolveEngine';
import { WorksheetRenderer } from './WorksheetRenderer';
import { NarrationPanel } from './ui/NarrationPanel';
import { QuizPanel } from './ui/QuizPanel';
import { Controls } from './ui/Controls';
import { useRecordAttempt } from '@/features/progress/queries';

export function SolveSession({
  problem,
  verbosity = 'full',
  stageId,
}: {
  problem: Problem;
  verbosity?: Verbosity;
  stageId?: string;
}) {
  const steps = useMemo(() => {
    const full = (() => {
      switch (problem.operation) {
        case 'add': return buildAddition(problem);
        case 'sub': return buildSubtraction(problem);
        case 'mul': return buildMultiplication(problem);
      }
    })();
    return applyVerbosityFor(full, verbosity, problem);
  }, [problem, verbosity]);
  const engine = useSolveEngine(steps);
  const { current } = engine;

  const recordAttempt = useRecordAttempt();
  // Guard: record exactly once per run. After reset, engine.isDone cycles
  // true→false→true which re-arms this effect naturally.
  const recordedRef = useRef(false);
  const resetCountRef = useRef(0);

  // Track resets: when engine.score resets to {correct:0,total:0} and we were done
  const prevIsDoneRef = useRef(false);
  useEffect(() => {
    if (prevIsDoneRef.current && !engine.isDone) {
      // A reset happened
      resetCountRef.current += 1;
      recordedRef.current = false;
    }
    prevIsDoneRef.current = engine.isDone;
  });

  useEffect(() => {
    if (engine.isDone && !recordedRef.current && stageId) {
      recordedRef.current = true;
      recordAttempt.mutate({
        stageId,
        operation: problem.operation,
        operandA: problem.operands[0],
        operandB: problem.operands[1],
        quizCorrect: engine.score.correct,
        quizTotal: engine.score.total,
        createdAt: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isDone, stageId]);

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

      {engine.isDone && (
        <div className="rounded-lg bg-green-50 p-4 text-center text-sm dark:bg-green-950">
          <p className="font-semibold text-green-700 dark:text-green-300">오늘도 잘했어요!</p>
          <p className="text-green-600 dark:text-green-400">
            점수 {engine.score.correct}/{engine.score.total}
          </p>
        </div>
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
