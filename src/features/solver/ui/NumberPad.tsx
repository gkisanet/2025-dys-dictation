import { Delete } from 'lucide-react';

interface NumberPadProps {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export function NumberPad({ onDigit, onDelete, onSubmit, disabled = false }: NumberPadProps) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {DIGIT_ROWS.flat().map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(d)}
          className="h-12 rounded-xl border bg-card text-xl font-bold disabled:opacity-50 disabled:pointer-events-none hover:bg-muted transition-colors"
        >
          {d}
        </button>
      ))}
      {/* Bottom row: delete | 0 | submit */}
      <button
        type="button"
        disabled={disabled}
        aria-label="지우기"
        onClick={onDelete}
        className="h-12 rounded-xl border bg-card flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none hover:bg-muted transition-colors"
      >
        <Delete className="size-5" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('0')}
        className="h-12 rounded-xl border bg-card text-xl font-bold disabled:opacity-50 disabled:pointer-events-none hover:bg-muted transition-colors"
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="h-12 rounded-xl border bg-primary text-primary-foreground text-xl font-bold disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 transition-colors"
      >
        확인
      </button>
    </div>
  );
}
