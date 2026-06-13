import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorksheetRenderer } from './WorksheetRenderer';
import { sampleAdditionBoard } from './sampleBoards';
import type { BoardState } from './steps/types';

// Multi-region board: top, left, right, merge with one visible cell each
const multiRegionBoard: BoardState = {
  regions: ['top', 'left', 'right', 'merge'],
  cells: [
    { id: 'top-0', region: 'top',   row: 0, place: 0, value: '8', role: 'operand',  visible: true },
    { id: 'lft-0', region: 'left',  row: 0, place: 0, value: '2', role: 'result',   visible: true, layoutId: 'p1-0' },
    { id: 'rgt-0', region: 'right', row: 0, place: 0, value: '4', role: 'result',   visible: true, layoutId: 'p2-0' },
    { id: 'mrg-0', region: 'merge', row: 0, place: 0, value: '6', role: 'operand',  visible: true },
  ],
  dividers: [],
};

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

describe('WorksheetRenderer multi-region', () => {
  it('renders left and right cells side-by-side in a row wrapper', () => {
    const { container } = render(<WorksheetRenderer board={multiRegionBoard} />);
    const rowWrapper = container.querySelector('[data-region-row]') as HTMLElement;
    expect(rowWrapper).toBeInTheDocument();
    // Both left and right grids should be descendants of the row wrapper
    const leftGrid  = rowWrapper.querySelector('[data-region="left"]');
    const rightGrid = rowWrapper.querySelector('[data-region="right"]');
    expect(leftGrid).toBeInTheDocument();
    expect(rightGrid).toBeInTheDocument();
    // top and merge are NOT inside the row wrapper
    const topGrid   = container.querySelector('[data-region="top"]');
    const mergeGrid = container.querySelector('[data-region="merge"]');
    expect(rowWrapper.contains(topGrid)).toBe(false);
    expect(rowWrapper.contains(mergeGrid)).toBe(false);
  });

  it('renders cell values from all four regions', () => {
    render(<WorksheetRenderer board={multiRegionBoard} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('cell with layoutId still renders its value', () => {
    render(<WorksheetRenderer board={multiRegionBoard} />);
    // The '2' in left region has layoutId='p1-0'; it must still render
    const cell = screen.getByText('2', { selector: '[data-cell-id="lft-0"]' });
    expect(cell).toBeInTheDocument();
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
