import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  const hl = cell.highlight ? HL_CLASS[cell.highlight] : '';
  const role = cell.role === 'operator' ? 'text-muted-foreground' : '';
  return `${base} ${hl} ${role}`.trim();
}

/**
 * Assigns 1-indexed CSS grid rows by interleaving content rows and dividers:
 * each content row gets a track; a divider declared for row N gets the track
 * immediately after row N's content. This keeps dividers between operands and
 * results instead of colliding with them.
 */
function buildRowMap(rows: number[], dividerRows: number[]) {
  const contentRow = new Map<number, number>();
  const dividerRow = new Map<number, number>();
  let grid = 1;
  for (const r of rows) {
    contentRow.set(r, grid++);
    if (dividerRows.includes(r)) dividerRow.set(r, grid++);
  }
  return { contentRow, dividerRow };
}

function RegionGrid({
  board,
  region,
  reduced,
}: {
  board: BoardState;
  region: Region;
  reduced: boolean;
}) {
  const all = board.cells.filter((c) => c.region === region);
  if (all.length === 0) return null;
  const visible = all.filter((c) => c.visible);
  const maxPlace = Math.max(...all.map((c) => c.place));
  const rows = [...new Set(all.map((c) => c.row))].sort((a, b) => a - b);
  const dividerRows = board.dividers.filter((d) => d.region === region).map((d) => d.row);
  const { contentRow, dividerRow } = buildRowMap(rows, dividerRows);

  const enter = reduced
    ? { initial: false as const, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: -18, scale: 0.7 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return (
    <div
      className="grid gap-x-1.5 gap-y-0.5 font-mono"
      style={{ gridTemplateColumns: `repeat(${maxPlace + 1}, 2.5rem)` }}
    >
      <AnimatePresence>
        {visible.map((cell) => (
          <motion.div
            key={cell.id}
            layout={!reduced}
            {...enter}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
            data-cell-id={cell.id}
            data-role={cell.role}
            data-superscript={cell.superscript ? 'true' : undefined}
            className={cellClass(cell)}
            style={{
              gridColumnStart: maxPlace - cell.place + 1,
              gridRowStart: contentRow.get(cell.row),
            }}
          >
            {cell.value}
          </motion.div>
        ))}
      </AnimatePresence>
      {board.dividers
        .filter((d) => d.region === region && dividerRow.has(d.row))
        .map((d) => (
          <motion.div
            key={`div-${region}-${d.row}`}
            data-divider="true"
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-0.5 origin-right rounded-full bg-foreground"
            style={{ gridColumn: '1 / -1', gridRowStart: dividerRow.get(d.row) }}
          />
        ))}
    </div>
  );
}

export function WorksheetRenderer({ board }: { board: BoardState }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="flex flex-col items-center gap-2" data-testid="worksheet">
      {board.regions.map((region) => (
        <RegionGrid key={region} board={board} region={region} reduced={reduced} />
      ))}
    </div>
  );
}
