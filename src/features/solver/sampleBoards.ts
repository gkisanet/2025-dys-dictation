import type { BoardState } from './steps/types';

/** 18 + 24 just after the "set up vertically" step (no result yet). */
export const sampleAdditionBoard: BoardState = {
  regions: ['main'],
  cells: [
    { id: 'a-t', region: 'main', row: 0, place: 1, value: '1', role: 'operand', visible: true },
    { id: 'a-o', region: 'main', row: 0, place: 0, value: '8', role: 'operand', visible: true },
    { id: 'op',  region: 'main', row: 1, place: 2, value: '+', role: 'operator', visible: true },
    { id: 'b-t', region: 'main', row: 1, place: 1, value: '2', role: 'operand', visible: true },
    { id: 'b-o', region: 'main', row: 1, place: 0, value: '4', role: 'operand', visible: true },
  ],
  dividers: [{ region: 'main', row: 1 }],
};
