import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { BoardState, Cell, Highlight, Region } from './steps/types';

const HL_CLASS: Record<NonNullable<Highlight>, string> = {
  now: 'bg-amber-200 text-amber-800 rounded-md',
  pair: 'bg-blue-100 text-blue-700 rounded-md',
  zero: 'bg-orange-200 text-orange-800 rounded-md',
};

function cellClass(cell: Cell): string {
  let base: string;
  if (cell.superscript) {
    if (cell.role === 'borrow') {
      base = 'flex items-start justify-center text-sm text-blue-600 h-4';
    } else {
      base = 'flex items-start justify-center text-sm text-red-600 h-4';
    }
  } else {
    base = 'flex items-end justify-center text-2xl font-bold h-10';
  }
  const hl = cell.highlight ? HL_CLASS[cell.highlight] : '';
  const role = cell.role === 'operator' ? 'text-muted-foreground' : '';
  return `${base} ${hl} ${role}`.trim();
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
  // Don't render a region (or its divider) until at least one cell is visible.
  if (visible.length === 0) return null;
  const maxPlace = Math.max(...all.map((c) => c.place));
  const rows = [...new Set(all.map((c) => c.row))].sort((a, b) => a - b);
  const dividerRows = board.dividers.filter((d) => d.region === region).map((d) => d.row);
  // Build row maps with explicit gridTemplateRows so carry rows always reserve
  // their height even when empty (avoids left/right branch misalignment).
  const isCarryRow = (r: number) => all.some((c) => c.row === r && c.superscript);
  const contentRow = new Map<number, number>();
  const dividerRow = new Map<number, number>();
  const templateRows: string[] = [];
  let grid = 1;
  for (const r of rows) {
    contentRow.set(r, grid++);
    templateRows.push(isCarryRow(r) ? '1.25rem' : '2.5rem');
    if (dividerRows.includes(r)) { dividerRow.set(r, grid++); templateRows.push('0.5rem'); }
  }

  return (
    <div
      data-region={region}
      className="grid gap-x-1 gap-y-0 font-mono"
      style={{
        gridTemplateColumns: `repeat(${maxPlace + 1}, 2.25rem)`,
        gridTemplateRows: templateRows.join(' '),
      }}
    >
      <AnimatePresence>
        {visible.map((cell) => {
          let initial: boolean | TargetAndTransition;
          let animate: TargetAndTransition;
          if (reduced) {
            initial = false;
            animate = { opacity: 1 };
          } else if (cell.enterFrom === 'left') {
            initial = { opacity: 0, x: -36, y: -12 };
            animate = { opacity: 1, x: 0, y: 0 };
          } else if (cell.enterFrom === 'right') {
            initial = { opacity: 0, x: 36, y: -12 };
            animate = { opacity: 1, x: 0, y: 0 };
          } else {
            initial = { opacity: 0, y: -18, scale: 0.7 };
            animate = { opacity: 1, y: 0, scale: 1 };
          }

          return (
            <motion.div
              key={cell.id}
              layout={!reduced}
              layoutId={cell.layoutId}
              initial={initial}
              animate={animate}
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
          );
        })}
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
  const has = (r: Region) => board.regions.includes(r);

  // Dim left/right when merge has any visible cell (focus moves to center)
  const mergeHasVisible = board.cells.some(c => c.region === 'merge' && c.visible);
  const branchDimClass = mergeHasVisible ? 'opacity-40 transition-opacity' : 'transition-opacity';

  return (
    <LayoutGroup>
      <div className="flex flex-col items-center gap-2" data-testid="worksheet">
        {has('top') && <RegionGrid region="top" board={board} reduced={reduced} />}
        {has('main') && <RegionGrid region="main" board={board} reduced={reduced} />}
        {(has('left') || has('right')) && (
          <div className={`flex items-start justify-center gap-3 ${branchDimClass}`} data-region-row>
            {has('left') && <RegionGrid region="left" board={board} reduced={reduced} />}
            {board.cells.some(c => c.region === 'left' && c.visible) &&
             board.cells.some(c => c.region === 'right' && c.visible) && (
              <div className="self-center px-1 text-2xl font-bold text-muted-foreground" aria-hidden="true">+</div>
            )}
            {has('right') && <RegionGrid region="right" board={board} reduced={reduced} />}
          </div>
        )}
        {has('merge') && <RegionGrid region="merge" board={board} reduced={reduced} />}
      </div>
    </LayoutGroup>
  );
}
