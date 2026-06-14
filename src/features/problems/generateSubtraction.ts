import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** A 2-digit − 2-digit subtraction with a >= b; biased to require a borrow (a%10 < b%10). */
export function generateSubtraction(): Problem {
  // Bias to require a borrow: onesA < onesB
  const onesA = randInt(0, 8);           // 0..8
  const onesB = randInt(onesA + 1, 9);   // onesB > onesA → borrow required
  const tensA = randInt(2, 9);           // ensure a >= b overall: tensA*10 + onesA >= tensB*10 + onesB
  // tensB can be 1 .. tensA  (so that a >= b even with onesA < onesB)
  const tensB = randInt(1, tensA);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  // In the rare case a < b (tensA === tensB and onesA < onesB), swap or retry.
  if (a < b) return generateSubtraction();
  return { operation: 'sub', operands: [a, b] };
}
