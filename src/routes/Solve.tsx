import { useParams } from '@tanstack/react-router';
import { SolveSession } from '@/features/solver/SolveSession';
import { generateAddition } from '@/features/problems/generateAddition';

const TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold">{TITLES[operation] ?? operation}</h1>
      {operation === 'add' ? (
        <SolveSession problem={generateAddition()} />
      ) : (
        <p className="text-muted-foreground">곧 추가됩니다 (Plan 3).</p>
      )}
    </main>
  );
}
