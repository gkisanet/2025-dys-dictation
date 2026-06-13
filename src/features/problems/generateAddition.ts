import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** A 2-digit + 2-digit addition that always requires a carry in the ones column. */
export function generateAddition(): Problem {
  const onesA = randInt(1, 9);                 // 1..9 so a ones-carry is always achievable
  const a = randInt(1, 9) * 10 + onesA;        // 2-digit, [11,99]
  const onesB = randInt(10 - onesA, 9);        // forces onesA + onesB >= 10
  const b = randInt(1, 9) * 10 + onesB;        // 2-digit, [10,99]
  return { operation: 'add', operands: [a, b] };
}
