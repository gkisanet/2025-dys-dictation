import { describe, it, expect } from 'vitest';
import type { BoardState, Step } from './types';

describe('type model', () => {
  it('builds a minimal one-cell board and a step using it', () => {
    const board: BoardState = {
      regions: ['main'],
      cells: [
        { id: 'a-o', region: 'main', row: 0, place: 0, value: '8', role: 'operand', visible: true },
      ],
      dividers: [],
    };
    const step: Step = { id: 's1', kind: 'setup', narration: '세로로 써요', board };
    expect(step.board.cells[0].value).toBe('8');
    expect(step.kind).toBe('setup');
  });
});
