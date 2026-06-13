import { useCallback, useMemo, useReducer } from 'react';
import type { Step } from './steps/types';

const MAX_ATTEMPTS = 3;

export interface EngineState {
  steps: Step[];
  index: number;
  attempts: number;
  hintIndex: number; // -1 = none shown
  revealed: boolean;
  resolved: boolean; // current step ready to advance
  feedback: 'none' | 'correct' | 'wrong';
  score: { correct: number; total: number };
}

type Action =
  | { type: 'SUBMIT'; value: number }
  | { type: 'NEXT' }
  | { type: 'RESET' };

function init(steps: Step[]): EngineState {
  return {
    steps,
    index: 0,
    attempts: 0,
    hintIndex: -1,
    revealed: false,
    resolved: !steps[0]?.quiz,
    feedback: 'none',
    score: { correct: 0, total: steps[0]?.quiz ? 1 : 0 },
  };
}

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SUBMIT': {
      const step = state.steps[state.index];
      if (!step.quiz || state.resolved) return state;
      if (action.value === step.quiz.answer) {
        return {
          ...state,
          resolved: true,
          feedback: 'correct',
          score: { ...state.score, correct: state.score.correct + (state.revealed ? 0 : 1) },
        };
      }
      const attempts = state.attempts + 1;
      const revealed = attempts >= MAX_ATTEMPTS;
      return {
        ...state,
        attempts,
        revealed,
        resolved: revealed,
        feedback: 'wrong',
        hintIndex: Math.min(state.hintIndex + 1, step.quiz.hints.length - 1),
      };
    }
    case 'NEXT': {
      if (!state.resolved) return state;
      const index = Math.min(state.index + 1, state.steps.length - 1);
      if (index === state.index) return state;
      const next = state.steps[index];
      const hasQuiz = !!next.quiz;
      return {
        ...state,
        index,
        attempts: 0,
        hintIndex: -1,
        revealed: false,
        resolved: !hasQuiz,
        feedback: 'none',
        score: hasQuiz ? { ...state.score, total: state.score.total + 1 } : state.score,
      };
    }
    case 'RESET':
      return init(state.steps);
    default:
      return state;
  }
}

export function useSolveEngine(steps: Step[]) {
  const [state, dispatch] = useReducer(reducer, steps, init);

  const submit = useCallback((value: number) => dispatch({ type: 'SUBMIT', value }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const current = state.steps[state.index];
  const isLast = state.index === state.steps.length - 1;

  return useMemo(
    () => ({
      current,
      index: state.index,
      total: state.steps.length,
      feedback: state.feedback,
      score: state.score,
      hint: state.hintIndex >= 0 ? (current.quiz?.hints[state.hintIndex] ?? null) : null,
      revealedAnswer: state.revealed ? (current.quiz?.answer ?? null) : null,
      canAdvance: state.resolved && !isLast,
      isDone: isLast && state.resolved,
      submit,
      next,
      reset,
    }),
    [current, state, isLast, submit, next, reset],
  );
}
