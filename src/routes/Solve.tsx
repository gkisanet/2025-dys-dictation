import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { SolveSession } from '@/features/solver/SolveSession';
import { generateAddition } from '@/features/problems/generateAddition';
import { generateSubtraction } from '@/features/problems/generateSubtraction';
import { generateMultiplication } from '@/features/problems/generateMultiplication';

const TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });
  const [problem] = useState(() => {
    switch (operation) {
      case 'sub': return generateSubtraction();
      case 'mul': return generateMultiplication();
      default: return generateAddition();
    }
  });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold">{TITLES[operation] ?? operation}</h1>
      <SolveSession problem={problem} />
    </main>
  );
}
