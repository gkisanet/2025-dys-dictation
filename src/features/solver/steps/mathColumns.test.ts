import { describe, it, expect } from 'vitest';
import { onesFirst, multiplyByDigit, placeName } from './mathColumns';

describe('mathColumns', () => {
  it('onesFirst(360) returns [0, 6, 3]', () => {
    expect(onesFirst(360)).toEqual([0, 6, 3]);
  });

  it('onesFirst(18) returns [8, 1]', () => {
    expect(onesFirst(18)).toEqual([8, 1]);
  });

  it('multiplyByDigit(18, 4) -> resultDigit:[2,7], carryInto:[0,3], product:72', () => {
    const { resultDigit, carryInto, product } = multiplyByDigit(18, 4);
    expect(resultDigit).toEqual([2, 7]);
    expect(carryInto).toEqual([0, 3]);
    expect(product).toBe(72);
  });

  it('multiplyByDigit(18, 2) -> resultDigit:[6,3], carryInto:[0,1], product:36', () => {
    const { resultDigit, carryInto, product } = multiplyByDigit(18, 2);
    expect(resultDigit).toEqual([6, 3]);
    expect(carryInto).toEqual([0, 1]);
    expect(product).toBe(36);
  });

  it('placeName returns Korean place names', () => {
    expect(placeName(0)).toBe('일');
    expect(placeName(1)).toBe('십');
    expect(placeName(2)).toBe('백');
  });
});
