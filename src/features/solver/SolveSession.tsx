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
import { ProgressBar } from '@/components/ui/progress-bar';
import { Card } from '@/components/ui/card';

export function SolveSession({
  problem,
  verbosity = 'full',
  stageId,
  operation,
  nextStageHref,
}: {
  problem: Problem;
  verbosity?: Verbosity;
  stageId?: string;
  operation?: string;
  nextStageHref?: string;
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

  const progressValue = engine.total > 0 ? (engine.index + 1) / engine.total : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Step progress + score chip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>단계 {engine.index + 1} / {engine.total}</span>
          <span>⭐ {engine.score.correct}/{engine.score.total}</span>
        </div>
        <ProgressBar value={progressValue} />
      </div>

      {/* Worksheet */}
      <div className="flex min-h-[12rem] items-center justify-center py-2">
        <WorksheetScaler>
          <WorksheetRenderer board={current.board} />
        </WorksheetScaler>
      </div>

      {/* Narration speech bubble */}
      <NarrationPanel text={current.narration} />

      {/* Quiz panel — sticky bottom on mobile */}
      {current.quiz && (
        <div className="sticky bottom-20 sm:static">
          <QuizPanel
            quiz={current.quiz}
            feedback={engine.feedback}
            hint={engine.hint}
            revealedAnswer={engine.revealedAnswer}
            onSubmit={engine.submit}
          />
        </div>
      )}

      {/* Completion card */}
      {engine.isDone && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
            <div className="mb-2 text-3xl">🎉</div>
            <p className="text-lg font-bold text-emerald-800">잘했어요!</p>
            <p className="mt-1 text-sm text-emerald-700">
              점수 {engine.score.correct}/{engine.score.total}
            </p>
            <div className="mx-auto mt-3 max-w-xs">
              <ProgressBar
                value={engine.score.total > 0 ? engine.score.correct / engine.score.total : 0}
                color="var(--op-sub)"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-emerald-700">오늘도 잘했어요!</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {nextStageHref && (
                <a
                  href={nextStageHref}
                  className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  다음 단계 →
                </a>
              )}
              {operation && (
                <a
                  href={`/learn/${operation}`}
                  className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  홈으로
                </a>
              )}
            </div>
          </div>
        </Card>
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

/**
 * Wraps WorksheetRenderer so it never overflows the viewport width.
 * Uses CSS `transform: scale()` with `origin-top` to shrink it on small screens.
 * Falls back gracefully with `overflow-x: auto` so content is always reachable.
 */
function WorksheetScaler({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-center">
        <div
          style={{
            transformOrigin: 'top center',
            maxWidth: '100%',
          }}
          className="worksheet-scaler"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
