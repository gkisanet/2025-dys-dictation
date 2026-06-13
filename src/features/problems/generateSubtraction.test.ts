import { describe, it, expect } from 'vitest';
import { generateSubtraction } from './generateSubtraction';

describe('generateSubtraction', () => {
  it('returns a sub problem with two 2-digit operands where a >= b', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateSubtraction();
      expect(p.operation).toBe('sub');
      expect(p.operands[0]).toBeGreaterThanOrEqual(10);
      expect(p.operands[0]).toBeLessThanOrEqual(99);
      expect(p.operands[1]).toBeGreaterThanOrEqual(10);
      expect(p.operands[1]).toBeLessThanOrEqual(99);
      expect(p.operands[0]).toBeGreaterThanOrEqual(p.operands[1]);
    }
  });
});
