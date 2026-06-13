import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Two 2-digit operands for multiplication. b always has a non-zero ones digit
 *  so both partial products are non-degenerate two-branch trees. */
export function generateMultiplication(): Problem {
  const a = randInt(10, 99);
  const b = randInt(1, 9) * 10 + randInt(1, 9); // ones digit 1..9 -> always a real two-branch tree
  return { operation: 'mul', operands: [a, b] };
}
