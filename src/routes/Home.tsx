import { Link } from '@tanstack/react-router';
import { Plus, Minus, X, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OPS = [
  { op: 'add', label: '덧셈', icon: Plus },
  { op: 'sub', label: '뺄셈', icon: Minus },
  { op: 'mul', label: '곱셈', icon: X },
] as const;

export function Home() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">암산 학습</h1>
      <div className="grid grid-cols-3 gap-3">
        {OPS.map(({ op, label, icon: Icon }) => (
          <Link key={op} to="/learn/$operation" params={{ operation: op }}>
            <Button variant="outline" className="h-24 w-full flex-col">
              <Icon className="size-7" />
              <span>{label}</span>
            </Button>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/progress">
          <Button variant="ghost" className="w-full gap-2">
            <BarChart2 className="size-5" />
            학습 진도 보기
          </Button>
        </Link>
      </div>
    </main>
  );
}
