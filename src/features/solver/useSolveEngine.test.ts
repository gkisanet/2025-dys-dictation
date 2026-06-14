import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSolveEngine } from './useSolveEngine';
import type { Step } from './steps/types';

const board = { regions: ['main' as const], cells: [], dividers: [] };
const steps: Step[] = [
  { id: 'setup', kind: 'setup', narration: 's', board },
  { id: 'ask-0', kind: 'digit-op', narration: 'a', board, quiz: { prompt: '8 + 4 = ?', answer: 12, hints: ['h1', 'h2'] } },
  { id: 'write-0', kind: 'sum', narration: 'w', board },
];

describe('useSolveEngine', () => {
  it('starts at the first step; non-quiz steps can advance immediately', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    expect(result.current.current.id).toBe('setup');
    expect(result.current.canAdvance).toBe(true);
    act(() => result.current.next());
    expect(result.current.current.id).toBe('ask-0');
  });

  it('blocks advancing on a quiz step until answered correctly', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next()); // -> ask-0
    expect(result.current.canAdvance).toBe(false);
    act(() => result.current.next()); // ignored while unresolved
    expect(result.current.current.id).toBe('ask-0');
    act(() => result.current.submit(12));
    expect(result.current.feedback).toBe('correct');
    expect(result.current.canAdvance).toBe(true);
    expect(result.current.score).toEqual({ correct: 1, total: 1 });
  });

  it('shows staged hints on wrong answers and reveals after 3 tries', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next());
    act(() => result.current.submit(11));
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.hint).toBe('h1');
    act(() => result.current.submit(13));
    expect(result.current.hint).toBe('h2');
    act(() => result.current.submit(99));
    expect(result.current.revealedAnswer).toBe(12);
    expect(result.current.canAdvance).toBe(true);
    expect(result.current.score).toEqual({ correct: 0, total: 1 }); // revealed != correct
  });

  it('reports done on the last step and reset returns to start', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next());
    act(() => result.current.submit(12));
    act(() => result.current.next()); // -> write-0 (last)
    expect(result.current.isDone).toBe(true);
    act(() => result.current.reset());
    expect(result.current.current.id).toBe('setup');
    expect(result.current.score).toEqual({ correct: 0, total: 0 });
  });
});
