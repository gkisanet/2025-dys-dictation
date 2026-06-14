/** Digits of n, ones-first: 360 -> [0, 6, 3]. */
export const onesFirst = (n: number): number[] => String(n).split('').map(Number).reverse();

export const PLACE_NAMES = ['일', '십', '백', '천', '만'];
export const placeName = (i: number): string => PLACE_NAMES[i] ?? `10^${i}`;

/** Multiply a multi-digit number by a single digit, column by column.
 *  Returns ones-first result digits and the carry written above each column. */
export function multiplyByDigit(a: number, d: number) {
  const aD = onesFirst(a);
  const resultDigit: number[] = [];
  const carryInto: number[] = []; // carry written above column i (carryInto[0] always 0)
  let carry = 0;
  for (let i = 0; i < aD.length; i++) {
    carryInto[i] = carry;
    const s = aD[i] * d + carry;
    resultDigit[i] = s % 10;
    carry = Math.floor(s / 10);
  }
  if (carry > 0) resultDigit[aD.length] = carry; // leading digit
  return { resultDigit, carryInto, product: a * d };
}
