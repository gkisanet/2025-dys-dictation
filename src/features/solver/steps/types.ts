export type Operation = 'add' | 'sub' | 'mul';

/** 0 = ones, 1 = tens, 2 = hundreds … (place value, used as a column index) */
export type Place = number;

/** Layout regions. 'main' for +/−; tree regions for × decomposition. */
export type Region = 'main' | 'top' | 'left' | 'right' | 'merge';

export type CellRole =
  | 'operand'
  | 'operator'
  | 'partial'
  | 'carry'
  | 'result'
  | 'zero-placeholder';

export type Highlight = 'now' | 'pair' | 'zero' | null;

export interface Cell {
  id: string;
  region: Region;
  row: number;          // row within its region (0 = top)
  place: Place;         // column by place value (0 = ones, increasing leftward)
  value: string;        // '0'..'9' or an operator glyph '+', '−', '×'
  role: CellRole;
  visible: boolean;
  highlight?: Highlight;
  superscript?: boolean; // carry digit drawn small, above the column
}

export interface BoardState {
  regions: Region[];
  cells: Cell[];
  dividers: { region: Region; row: number }[];
}

export interface Quiz {
  prompt: string;
  answer: number;
  hints: string[];
}

export type StepKind =
  | 'setup'
  | 'decompose'
  | 'digit-op'
  | 'carry'
  | 'borrow'
  | 'place-zero'
  | 'partial'
  | 'gather'
  | 'sum'
  | 'result';

export interface Step {
  id: string;
  kind: StepKind;
  narration: string;
  board: BoardState;
  quiz?: Quiz;
}

export type Verbosity = 'full' | 'partial' | 'answer';
export interface Level {
  verbosity: Verbosity;
}
export interface Problem {
  operation: Operation;
  operands: [number, number];
}
