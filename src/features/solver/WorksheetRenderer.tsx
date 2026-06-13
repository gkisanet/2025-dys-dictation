import type { BoardState, Cell, Highlight, Region } from './steps/types';

const HL_CLASS: Record<NonNullable<Highlight>, string> = {
  now: 'bg-amber-200 text-amber-800 rounded-md',
  pair: 'bg-blue-100 text-blue-700 rounded-md',
  zero: 'bg-orange-200 text-orange-800 rounded-md',
};

function cellClass(cell: Cell): string {
  const base = cell.superscript
    ? 'flex items-start justify-center text-sm text-red-600 h-4'
    : 'flex items-end justify-center text-3xl font-bold h-12';
  const hl = cell.highlight ? HL_CLASS[cell.highlight] ?? '' : '';
  const role = cell.role === 'operator' ? 'text-muted-foreground' : '';
  return `${base} ${hl} ${role}`.trim();
}

/** Renders one region as a place-value grid (ones column on the right). */
function RegionGrid({ board, region }: { board: BoardState; region: Region }) {
  const cells = board.cells.filter((c) => c.region === region && c.visible);
  if (cells.length === 0) return null;

  const maxPlace = Math.max(...cells.map((c) => c.place), 0);
  const maxRow = Math.max(...cells.map((c) => c.row), 0);
  const cols = maxPlace + 1; // place 0..maxPlace, rendered right→left

  return (
    <div
      className="inline-grid gap-x-1.5 gap-y-0.5 font-mono"
      style={{ gridTemplateColumns: `repeat(${cols}, 2.5rem)` }}
    >
      {Array.from({ length: maxRow + 1 }).flatMap((_, row) =>
        Array.from({ length: cols }).map((__, colFromLeft) => {
          const place = maxPlace - colFromLeft; // leftmost col = highest place
          const cell = cells.find((c) => c.row === row && c.place === place);
          const key = `${region}-${row}-${place}`;
          return (
            <div key={key} className={cell ? cellClass(cell) : 'h-12'}>
              {cell?.value ?? ''}
            </div>
          );
        }),
      )}
      {board.dividers
        .filter((d) => d.region === region)
        .map((d) => (
          <div
            key={`div-${region}-${d.row}`}
            className="col-span-full h-0.5 bg-foreground rounded-full"
            // +2: divider sits BELOW its content row (row index is 0-based, CSS grid rows are 1-based).
            // TODO: generalize this layout model once result rows are introduced.
            style={{ gridRow: d.row + 2 }}
          />
        ))}
    </div>
  );
}

export function WorksheetRenderer({ board }: { board: BoardState }) {
  return (
    <div className="flex flex-col items-center gap-2" data-testid="worksheet">
      {board.regions.map((region) => (
        <RegionGrid key={region} board={board} region={region} />
      ))}
    </div>
  );
}
