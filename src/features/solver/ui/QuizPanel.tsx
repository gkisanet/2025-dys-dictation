import { useEffect, useState } from 'react';
import type { Quiz } from '../steps/types';
import { NumberPad } from './NumberPad';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface QuizPanelProps {
  quiz: Quiz | null;
  feedback: 'none' | 'correct' | 'wrong';
  hint: string | null;
  revealedAnswer: number | null;
  onSubmit: (value: number) => void;
  narration: string;
  canAdvance: boolean;
  onNext: () => void;
}

export function QuizPanel({
  quiz,
  feedback,
  hint,
  revealedAnswer,
  onSubmit,
  narration,
  canAdvance,
  onNext,
}: QuizPanelProps) {
  const [entry, setEntry] = useState('');

  // Clear on new checkpoint (prompt change).
  useEffect(() => setEntry(''), [quiz?.prompt]);

  const hasQuiz = quiz !== null;
  const locked = !hasQuiz || revealedAnswer !== null || feedback === 'correct';

  const handleDigit = (d: string) => {
    if (locked) return;
    setEntry((prev) => (prev.length < 6 ? prev + d : prev));
  };

  const handleDelete = () => {
    if (locked) return;
    setEntry((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (entry === '') return;
    onSubmit(Number(entry));
    setEntry('');
  };

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2 text-amber-950">
      {/* Left Column: quiz prompt, compact narration scrollbox, dynamic feedback, next button */}
      <div className="flex flex-col justify-between gap-1.5 min-w-0">
        <div className="flex flex-col gap-1.5">
          {/* Prompt header & Answer input display */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-amber-900 truncate">
              {hasQuiz ? `🧮 ${quiz.prompt}` : '💡 단계 진행 중'}
            </span>
            {hasQuiz && (
              <div
                aria-label="답"
                className="flex h-8 w-18 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white text-center text-sm font-bold text-amber-900 select-none"
              >
                {entry !== '' ? entry : <span className="text-amber-300">?</span>}
              </div>
            )}
          </div>

          {/* Mini Narration Box */}
          <div className="flex items-start gap-1 rounded-lg bg-white/60 p-1.5 text-[11px] leading-relaxed text-amber-950 border border-amber-100 max-h-[75px] overflow-y-auto">
            <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-500" aria-hidden="true" />
            <span>{narration}</span>
          </div>

          {/* Micro Feedback line */}
          <div className="min-h-[14px] text-[11px]">
            {hasQuiz ? (
              <>
                {feedback === 'correct' && (
                  <span className="font-semibold text-green-700">정답이에요! ✓</span>
                )}
                {feedback === 'wrong' && hint && (
                  <span className="text-amber-800">💡 {hint}</span>
                )}
                {revealedAnswer !== null && (
                  <span className="font-semibold text-red-600">정답: {revealedAnswer}</span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-[10px]">설명을 읽고 다음 버튼을 누르세요.</span>
            )}
          </div>
        </div>

        {/* Action Controls: Next Button */}
        <Button
          className="w-full h-9 text-xs font-semibold"
          onClick={onNext}
          disabled={!canAdvance}
        >
          다음
        </Button>
      </div>

      {/* Right Column: Keypad (w-full width of the 1/3 grid cell) */}
      <div className="border-l border-amber-200/50 pl-2 flex items-center justify-center">
        <div className="w-full">
          <NumberPad
            onDigit={handleDigit}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            disabled={locked}
          />
        </div>
      </div>
    </div>
  );
}
