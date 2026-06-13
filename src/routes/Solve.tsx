import { useParams } from '@tanstack/react-router';
import { WorksheetRenderer } from '@/features/solver/WorksheetRenderer';
import { sampleAdditionBoard } from '@/features/solver/sampleBoards';

const TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold">{TITLES[operation] ?? operation}</h1>
      <div data-testid="worksheet-slot">
        <WorksheetRenderer board={sampleAdditionBoard} />
      </div>
    </main>
  );
}
