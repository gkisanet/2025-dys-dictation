import { useParams } from '@tanstack/react-router';

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">풀이: {operation}</h1>
      <div data-testid="worksheet-slot" className="mt-4" />
    </main>
  );
}
