import type { Operation, Problem } from '@/features/solver/steps/types';

export type Pattern =
  | 'add-nocarry'
  | 'add-carry'
  | 'add-3digit'
  | 'sub-noborrow'
  | 'sub-borrow'
  | 'sub-3digit'
  | 'mul-byten'
  | 'mul-2x2';

const r = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateProblem(pattern: Pattern): Problem {
  switch (pattern) {
    case 'add-nocarry': {
      // Construct two 2-digit numbers where NEITHER column (ones nor tens) carries.
      // Pick ones digits first so oa + ob < 10, then tens digits so ta + tb < 10.
      const oa = r(1, 8);
      const ob = r(0, 9 - oa - 1); // ob <= 9 - oa - 1, so oa + ob <= 8 < 10
      const ta = r(1, 4);           // 1..4 so ta + tb can fit in 1..9
      const tb = r(1, 9 - ta);      // tb <= 9 - ta, so ta + tb <= 9 < 10
      return { operation: 'add', operands: [ta * 10 + oa, tb * 10 + ob] };
    }

    case 'add-carry': {
      // Ones digits must sum >= 10.
      const oa = r(1, 9);
      const ob = r(10 - oa, 9); // oa + ob >= 10
      return {
        operation: 'add',
        operands: [r(1, 9) * 10 + oa, r(1, 9) * 10 + ob],
      };
    }

    case 'add-3digit': {
      return { operation: 'add', operands: [r(100, 999), r(100, 999)] };
    }

    case 'sub-noborrow': {
      // a >= b, and the ones column does NOT borrow (a%10 >= b%10).
      const oa = r(1, 9);        // a's ones digit >= 1 so there's room for b's ones
      const ob = r(0, oa);       // ob <= oa, so no borrow
      const ta = r(2, 9);        // a has tens digit 2..9
      const tb = r(1, ta);       // tb <= ta so a > b (given oa >= ob already)
      return { operation: 'sub', operands: [ta * 10 + oa, tb * 10 + ob] };
    }

    case 'sub-borrow': {
      // a >= b, but a%10 < b%10 (ones column borrows).
      const oa = r(0, 8);                          // a's ones 0..8 (allows b's ones to exceed it)
      const ob = r(oa + 1, 9);                     // b's ones > a's ones → borrow
      const ta = r(2, 9);                          // a tens digit 2..9
      const tb = r(1, ta - 1);                     // b tens digit strictly less than a's → a > b overall
      return { operation: 'sub', operands: [ta * 10 + oa, tb * 10 + ob] };
    }

    case 'sub-3digit': {
      const a = r(300, 999);
      const b = r(100, a);
      return { operation: 'sub', operands: [a, b] };
    }

    case 'mul-byten': {
      // b must be a multiple of 10 (ones digit 0).
      return { operation: 'mul', operands: [r(11, 99), r(1, 9) * 10] };
    }

    case 'mul-2x2': {
      // b must NOT be a multiple of 10 (ones digit 1..9).
      return { operation: 'mul', operands: [r(11, 99), r(1, 9) * 10 + r(1, 9)] };
    }
  }
}
