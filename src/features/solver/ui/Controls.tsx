import { Button } from '@/components/ui/button';

interface ControlsProps {
  canAdvance: boolean;
  isDone: boolean;
  onNext: () => void;
  onReset: () => void;
}

export function Controls({ canAdvance, isDone, onNext, onReset: _onReset }: ControlsProps) {
  if (isDone) return null;
  return (
    <div className="flex justify-center">
      <Button className="w-full" onClick={onNext} disabled={!canAdvance}>다음</Button>
    </div>
  );
}
