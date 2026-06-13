export function NarrationPanel({ text }: { text: string }) {
  return (
    <div className="rounded-r-xl border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
      {text}
    </div>
  );
}
