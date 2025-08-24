"use client";
export function ProgressDonut({ value, target = 20, size = 120 }:{
  value: number; target?: number; size?: number;
}){
  const pct = Math.min(100, Math.round((value / target) * 100));
  const stroke = `conic-gradient(#39CCCC ${pct*3.6}deg, rgba(255,255,255,0.1) 0)`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ background: stroke }} />
      <div className="absolute inset-[10%] rounded-full bg-black/30 backdrop-blur-md border border-white/10" />
      <div className="relative text-center">
        <div className="text-2xl font-semibold">{pct}%</div>
        <div className="text-[11px] text-slate-300">{value} / {target} JP</div>
      </div>
    </div>
  );
}
