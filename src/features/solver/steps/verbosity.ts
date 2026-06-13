import type { Problem, Quiz, Step } from './types';

const SIGN = { add: '+', sub: '−', mul: '×' } as const;

const finalAnswer = (p: Problem): number => {
  const [a, b] = p.operands;
  return p.operation === 'add' ? a + b : p.operation === 'sub' ? a - b : a * b;
};

/**
 * full    → every checkpoint quiz (unchanged).
 * partial → keep only the FIRST quiz (one checkpoint); other steps auto-advance (quiz removed).
 * answer  → setup + a single "a ∘ b = ?" quiz + result (no process).
 */
export function applyVerbosityFor(
  full: Step[],
  verbosity: 'full' | 'partial' | 'answer',
  problem: Problem,
): Step[] {
  if (verbosity === 'full') return full;

  const [a, b] = problem.operands;
  const quiz: Quiz = {
    prompt: `${a} ${SIGN[problem.operation]} ${b} = ?`,
    answer: finalAnswer(problem),
    hints: [
      '배운 과정을 떠올려 최종 답을 구해보세요.',
      `${a} ${SIGN[problem.operation]} ${b} 를 계산하면?`,
    ],
  };

  if (verbosity === 'partial') {
    let kept = false;
    return full.map((s) => {
      if (s.quiz && !kept) {
        kept = true;
        return s;
      }
      return { ...s, quiz: undefined };
    });
  }

  // answer mode
  const setup: Step = { ...full[0], quiz: undefined };
  const ask: Step = {
    id: 'final-ask',
    kind: 'digit-op',
    narration: '바로 답을 구해보세요.',
    board: setup.board,
    quiz,
  };
  const result: Step = { ...full[full.length - 1] };
  return [setup, ask, result];
}
