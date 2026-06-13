import { useEffect, useMemo, useRef } from 'react';
import { Link } from '@tanstack/react-router';
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
  nextStageId,
}: {
  problem: Problem;
  verbosity?: Verbosity;
  stageId?: string;
  operation?: string;
  /** @deprecated pass nextStageId instead for SPA navigation */
  nextStageHref?: string;
  nextStageId?: string;
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
    <div className="flex flex-col gap-3">
      {/* Step progress + score chip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>단계 {engine.index + 1} / {engine.total}</span>
          <span>⭐ {engine.score.correct}/{engine.score.total}</span>
        </div>
        <ProgressBar value={progressValue} label="단계 진행도" />
      </div>

      {/* Worksheet — plain flex container, no transform/scale so Framer Motion layout animations work */}
      <div className="flex min-h-[7rem] items-center justify-center overflow-x-auto py-1">
        <WorksheetRenderer board={current.board} />
      </div>

      {/* Narration speech bubble */}
      <NarrationPanel text={current.narration} />

      {/* Bottom dock: stable min-height, always renders exactly one panel */}
      <div className="min-h-[15rem]">
        {engine.isDone ? (
          /* Completion card with 다시 풀기 inside */
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 text-center">
              <div className="mb-2 text-3xl">🎉</div>
              <p className="text-lg font-bold text-emerald-800">잘했어요!</p>
              <p className="mt-1 text-sm text-emerald-700">
                점수 {engine.score.correct}/{engine.score.total}
              </p>
              <div className="mx-auto mt-3 max-w-xs">
                <ProgressBar
                  value={engine.score.total > 0 ? engine.score.correct / engine.score.total : 0}
                  color="var(--op-sub)"
                  label="학습 진행도"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-700">오늘도 잘했어요!</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={engine.reset}
                  className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  다시 풀기
                </button>
                {operation && (
                  <>
                    {(nextStageId || nextStageHref) && (
                      <Link
                        to="/solve/$operation/$stageId"
                        params={{ operation, stageId: nextStageId ?? nextStageHref!.split('/').pop()! }}
                        className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        다음 단계 →
                      </Link>
                    )}
                    <Link
                      to="/learn/$operation"
                      params={{ operation }}
                      className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      단계 목록
                    </Link>
                    <Link
                      to="/"
                      className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      홈으로
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Card>
        ) : current.quiz ? (
          /* Quiz panel + 다음 button (appears after correct answer) */
          <div className="flex flex-col gap-2">
            <QuizPanel
              quiz={current.quiz}
              feedback={engine.feedback}
              hint={engine.hint}
              revealedAnswer={engine.revealedAnswer}
              onSubmit={engine.submit}
            />
            <Controls
              canAdvance={engine.canAdvance}
              isDone={engine.isDone}
              onNext={engine.next}
              onReset={engine.reset}
            />
          </div>
        ) : (
          /* Narration/animation step: large 다음 button */
          <div className="flex items-start pt-2">
            <Controls
              canAdvance={engine.canAdvance}
              isDone={engine.isDone}
              onNext={engine.next}
              onReset={engine.reset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// WorksheetScaler has been removed. The scale transform broke Framer Motion's
// layout/layoutId measurements (layout animations compute element positions from
// the DOM, but transform: scale() shifts the rendered position without updating
// offsetTop/getBoundingClientRect proportionally, so Framer Motion misplaces
// animated cells during the gather/glide transition). Instead, WorksheetRenderer
// cells have been made compact enough (2.25rem columns, text-2xl) to fit a 360px
// phone without any scaling, and the container uses overflow-x-auto as a safe
// fallback that does not affect layout measurement.
