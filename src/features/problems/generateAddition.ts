import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** A 2-digit + 2-digit addition that requires a carry in the ones column (more instructive). */
export function generateAddition(): Problem {
  const a = randInt(10, 99);
  const onesA = a % 10;
  const onesB = randInt(10 - onesA === 10 ? 0 : 10 - onesA, 9); // force ones sum >= 10
  const b = randInt(1, 9) * 10 + onesB;
  return { operation: 'add', operands: [a, Math.min(b, 99)] };
}
