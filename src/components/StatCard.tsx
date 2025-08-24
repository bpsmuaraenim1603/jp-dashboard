import { cn } from "@/lib/utils";

export function StatCard({
  title, value, subtitle, className,
}: {
  title: string;
  value: number | string;          // <= izinkan string
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass card-hover p-5", className)}>
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {subtitle && <p className="mt-2 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
