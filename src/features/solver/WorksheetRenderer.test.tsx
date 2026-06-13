import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorksheetRenderer } from './WorksheetRenderer';
import { sampleAdditionBoard } from './sampleBoards';
import type { BoardState } from './steps/types';

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

const boardWithResult: BoardState = {
  regions: ['main'],
  cells: [
    { id: 'a-1', region: 'main', row: 1, place: 1, value: '1', role: 'operand', visible: true },
    { id: 'a-0', region: 'main', row: 1, place: 0, value: '8', role: 'operand', visible: true },
    { id: 'op',  region: 'main', row: 2, place: 2, value: '+', role: 'operator', visible: true },
    { id: 'b-1', region: 'main', row: 2, place: 1, value: '2', role: 'operand', visible: true },
    { id: 'b-0', region: 'main', row: 2, place: 0, value: '4', role: 'operand', visible: true },
    { id: 'r-1', region: 'main', row: 3, place: 1, value: '4', role: 'result', visible: true },
    { id: 'r-0', region: 'main', row: 3, place: 0, value: '2', role: 'result', visible: false },
    { id: 'c-1', region: 'main', row: 0, place: 1, value: '1', role: 'carry', superscript: true, visible: true },
  ],
  dividers: [{ region: 'main', row: 2 }],
};

describe('WorksheetRenderer layout', () => {
  it('renders the carry superscript and result row, hides invisible result cell', () => {
    render(<WorksheetRenderer board={boardWithResult} />);
    expect(screen.getByText('4', { selector: '[data-role="result"]' })).toBeInTheDocument();
    // hidden r-0 ('2') not rendered; the '2' of operand 24 is visible (1 occurrence)
    expect(screen.getAllByText('2')).toHaveLength(1);
    // carry superscript present and marked
    expect(screen.getByText('1', { selector: '[data-superscript="true"]' })).toBeInTheDocument();
  });

  it('places the divider on its own grid row below the second operand', () => {
    const { container } = render(<WorksheetRenderer board={boardWithResult} />);
    const divider = container.querySelector('[data-divider="true"]') as HTMLElement;
    const opCell = container.querySelector('[data-cell-id="op"]') as HTMLElement;
    const resultCell = container.querySelector('[data-cell-id="r-1"]') as HTMLElement;
    const gr = (el: HTMLElement) => Number(el.style.gridRowStart);
    expect(gr(divider)).toBeGreaterThan(gr(opCell));       // divider below operand B row
    expect(gr(resultCell)).toBeGreaterThan(gr(divider));   // result below divider
  });
});
