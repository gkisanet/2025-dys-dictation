import { describe, it, expect } from 'vitest';
import { generateAddition } from './generateAddition';

describe('generateAddition', () => {
  it('returns an add problem with two 2-digit operands', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateAddition();
      expect(p.operation).toBe('add');
      expect(p.operands).toHaveLength(2);
      for (const n of p.operands) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
      expect((p.operands[0] % 10) + (p.operands[1] % 10)).toBeGreaterThanOrEqual(10);
    }
  });
});
