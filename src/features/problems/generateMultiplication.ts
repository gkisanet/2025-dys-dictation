import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Two 2-digit operands for multiplication, each in [10, 99]. */
export function generateMultiplication(): Problem {
  const a = randInt(10, 99);
  const b = randInt(10, 99);
  return { operation: 'mul', operands: [a, b] };
}
