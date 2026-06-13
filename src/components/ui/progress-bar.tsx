import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0..1
  color?: string; // tailwind bg-* class or CSS color
  label?: string; // accessible name for aria-label
}

export function ProgressBar({ value, color, label, className, ...props }: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? '진행도'}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: color ?? 'var(--primary)',
        }}
      />
    </div>
  );
}
