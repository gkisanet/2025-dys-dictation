import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorksheetRenderer } from './WorksheetRenderer';
import { sampleAdditionBoard } from './sampleBoards';

describe('WorksheetRenderer', () => {
  it('renders only visible cells with their values', () => {
    render(<WorksheetRenderer board={sampleAdditionBoard} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('does not render invisible cells', () => {
    const board = {
      ...sampleAdditionBoard,
      cells: [
        ...sampleAdditionBoard.cells,
        { id: 'res', region: 'main' as const, row: 2, place: 0, value: '2', role: 'result' as const, visible: false },
      ],
    };
    render(<WorksheetRenderer board={board} />);
    // '2' from the hidden result must not appear (operand '2' lives in tens of 24)
    expect(screen.queryByText('2')).toBeInTheDocument(); // the '2' of 24 is visible
    expect(screen.getAllByText('2')).toHaveLength(1);     // hidden result '2' not rendered
  });
});
