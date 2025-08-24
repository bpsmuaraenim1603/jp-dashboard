// src/components/ProgressRing.tsx
export function ProgressRing({ current, target = 20 }:{ current: number; target?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100 || 0)));
  return (
    <div className="grid place-items-center rounded-2xl bg-white/5 p-6">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
          <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                fill="none" stroke="currentColor" strokeWidth="4"
                strokeDasharray={`${pct}, 100`} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-xl font-semibold">{pct}%</div>
      </div>
      <p className="mt-2 text-sm text-slate-300">Progress dari 20 JP</p>
    </div>
  );
}
