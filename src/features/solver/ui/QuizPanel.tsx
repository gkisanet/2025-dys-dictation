import { useEffect, useState } from 'react';
import type { Quiz } from '../steps/types';
import { NumberPad } from './NumberPad';

interface QuizPanelProps {
  quiz: Quiz;
  feedback: 'none' | 'correct' | 'wrong';
  hint: string | null;
  revealedAnswer: number | null;
  onSubmit: (value: number) => void;
}

export function QuizPanel({ quiz, feedback, hint, revealedAnswer, onSubmit }: QuizPanelProps) {
  const [entry, setEntry] = useState('');

  // Clear on new checkpoint (prompt change).
  useEffect(() => setEntry(''), [quiz.prompt]);

  const locked = revealedAnswer !== null || feedback === 'correct';

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
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
      <p className="mb-2 font-bold text-amber-900">🧮 <span>{quiz.prompt}</span></p>

      {/* Read-only answer display */}
      <div
        aria-label="답"
        className="mb-2 flex h-11 w-full items-center justify-center rounded-lg border-2 border-amber-300 bg-white text-center text-xl font-bold text-amber-900 select-none"
      >
        {entry !== '' ? entry : <span className="text-amber-300">?</span>}
      </div>

      <NumberPad
        onDigit={handleDigit}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        disabled={locked}
      />

      {feedback === 'correct' && <p className="mt-2 text-sm font-semibold text-green-700">정답이에요! ✓</p>}
      {feedback === 'wrong' && hint && (
        <p className="mt-2 text-sm text-amber-800">힌트: <span>{hint}</span></p>
      )}
      {revealedAnswer !== null && <p className="mt-2 text-sm font-semibold text-red-600">정답: {revealedAnswer}</p>}
    </div>
  );
}
