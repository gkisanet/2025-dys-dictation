import { describe, it, expect } from 'vitest';
import { generateProblem } from './generateProblem';

const N = 100;

function times(n: number, fn: () => void) {
  for (let i = 0; i < n; i++) fn();
}

describe('generateProblem — add-nocarry', () => {
  it('no ones carry and no tens carry over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('add-nocarry');
      const [a, b] = operands;
      const oa = a % 10, ob = b % 10;
      const ta = Math.floor(a / 10), tb = Math.floor(b / 10);
      expect(oa + ob).toBeLessThan(10); // no ones carry
      expect(ta + tb).toBeLessThan(10); // no tens carry
    });
  });

  it('both operands are 2-digit numbers', () => {
    times(N, () => {
      const { operands } = generateProblem('add-nocarry');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
      expect(operands[1]).toBeGreaterThanOrEqual(10);
      expect(operands[1]).toBeLessThanOrEqual(99);
    });
  });
});

describe('generateProblem — add-carry', () => {
  it('ones column always carries (sum >= 10) over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('add-carry');
      const [a, b] = operands;
      expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
    });
  });

  it('both operands are 2-digit numbers', () => {
    times(N, () => {
      const { operands } = generateProblem('add-carry');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
      expect(operands[1]).toBeGreaterThanOrEqual(10);
      expect(operands[1]).toBeLessThanOrEqual(99);
    });
  });
});

describe('generateProblem — add-3digit', () => {
  it('both operands are 3-digit numbers', () => {
    times(N, () => {
      const { operands } = generateProblem('add-3digit');
      expect(operands[0]).toBeGreaterThanOrEqual(100);
      expect(operands[0]).toBeLessThanOrEqual(999);
      expect(operands[1]).toBeGreaterThanOrEqual(100);
      expect(operands[1]).toBeLessThanOrEqual(999);
    });
  });
});

describe('generateProblem — sub-noborrow', () => {
  it('a >= b over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-noborrow');
      expect(operands[0]).toBeGreaterThanOrEqual(operands[1]);
    });
  });

  it('both operands are 2-digit numbers', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-noborrow');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
      expect(operands[1]).toBeGreaterThanOrEqual(10);
      expect(operands[1]).toBeLessThanOrEqual(99);
    });
  });
});

describe('generateProblem — sub-borrow', () => {
  it('a >= b over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-borrow');
      expect(operands[0]).toBeGreaterThanOrEqual(operands[1]);
    });
  });

  it('ones digit of a < ones digit of b (borrow required) over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-borrow');
      const [a, b] = operands;
      expect(a % 10).toBeLessThan(b % 10);
    });
  });

  it('both operands are 2-digit numbers', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-borrow');
      expect(operands[0]).toBeGreaterThanOrEqual(20);
      expect(operands[0]).toBeLessThanOrEqual(99);
      expect(operands[1]).toBeGreaterThanOrEqual(11);
      expect(operands[1]).toBeLessThanOrEqual(99);
    });
  });
});

describe('generateProblem — sub-3digit', () => {
  it('a >= b over 100 iterations', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-3digit');
      expect(operands[0]).toBeGreaterThanOrEqual(operands[1]);
    });
  });

  it('a is 3-digit (300..999), b is 3-digit (100..a)', () => {
    times(N, () => {
      const { operands } = generateProblem('sub-3digit');
      expect(operands[0]).toBeGreaterThanOrEqual(300);
      expect(operands[0]).toBeLessThanOrEqual(999);
      expect(operands[1]).toBeGreaterThanOrEqual(100);
      expect(operands[1]).toBeLessThanOrEqual(operands[0]);
    });
  });
});

describe('generateProblem — mul-2x1', () => {
  it('first operand is 2-digit (11..99)', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-2x1');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
    });
  });

  it('second operand is in range 2..9', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-2x1');
      expect(operands[1]).toBeGreaterThanOrEqual(2);
      expect(operands[1]).toBeLessThanOrEqual(9);
    });
  });
});

describe('generateProblem — mul-byten', () => {
  it('second operand is always a multiple of 10', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-byten');
      expect(operands[1] % 10).toBe(0);
    });
  });

  it('first operand is 2-digit (11..99)', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-byten');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
    });
  });

  it('second operand is in range 10..90', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-byten');
      expect(operands[1]).toBeGreaterThanOrEqual(10);
      expect(operands[1]).toBeLessThanOrEqual(90);
    });
  });
});

describe('generateProblem — mul-2x2', () => {
  it('second operand ones digit is never 0', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-2x2');
      expect(operands[1] % 10).not.toBe(0);
    });
  });

  it('first operand is 2-digit (11..99)', () => {
    times(N, () => {
      const { operands } = generateProblem('mul-2x2');
      expect(operands[0]).toBeGreaterThanOrEqual(11);
      expect(operands[0]).toBeLessThanOrEqual(99);
    });
  });
});
