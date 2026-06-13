import { describe, it, expect } from 'vitest';
import { generateMultiplication } from './generateMultiplication';

describe('generateMultiplication', () => {
  it('returns a mul problem with two 2-digit operands in [10, 99]', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateMultiplication();
      expect(p.operation).toBe('mul');
      expect(p.operands[0]).toBeGreaterThanOrEqual(10);
      expect(p.operands[0]).toBeLessThanOrEqual(99);
      expect(p.operands[1]).toBeGreaterThanOrEqual(10);
      expect(p.operands[1]).toBeLessThanOrEqual(99);
    }
  });
});
