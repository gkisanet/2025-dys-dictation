import { useEffect, useState } from 'react';
import type { Quiz } from '../steps/types';
import { Button } from '@/components/ui/button';

interface QuizPanelProps {
  quiz: Quiz;
  feedback: 'none' | 'correct' | 'wrong';
  hint: string | null;
  revealedAnswer: number | null;
  onSubmit: (value: number) => void;
}

export function QuizPanel({ quiz, feedback, hint, revealedAnswer, onSubmit }: QuizPanelProps) {
  const [value, setValue] = useState('');

  // Clear the input when the prompt changes (new checkpoint).
  useEffect(() => setValue(''), [quiz.prompt]);

  const submit = () => {
    if (value.trim() === '') return;
    onSubmit(Number(value));
  };

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
      <p className="mb-2 font-bold text-amber-900">🧮 <span>{quiz.prompt}</span></p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          aria-label="답"
          className="w-24 rounded-lg border-2 border-amber-300 px-2 py-1.5 text-center text-xl"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={revealedAnswer !== null || feedback === 'correct'}
        />
        <Button size="sm" onClick={submit}>확인</Button>
      </div>
      {feedback === 'correct' && <p className="mt-2 text-sm font-semibold text-green-700">정답이에요! ✓</p>}
      {feedback === 'wrong' && hint && (
        <p className="mt-2 text-sm text-amber-800">힌트: <span>{hint}</span></p>
      )}
      {revealedAnswer !== null && <p className="mt-2 text-sm font-semibold text-red-600">정답: {revealedAnswer}</p>}
    </div>
  );
}
