import { Button } from '@/components/ui/button';

interface ControlsProps {
  canAdvance: boolean;
  isDone: boolean;
  onNext: () => void;
  onReset: () => void;
}

export function Controls({ canAdvance, isDone, onNext, onReset }: ControlsProps) {
  return (
    <div className="flex justify-center gap-2">
      {isDone ? (
        <Button variant="ghost" onClick={onReset}>다시 풀기</Button>
      ) : (
        <Button onClick={onNext} disabled={!canAdvance}>다음</Button>
      )}
    </div>
  );
}
