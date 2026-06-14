import { Lightbulb } from 'lucide-react';

export function NarrationPanel({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-r-xl border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-blue-400" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
