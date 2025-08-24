"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export type RowChart = { nama: string; totalJP: number };

export default function JPBarChart({ rows }: { rows: RowChart[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="glass-light rounded-2xl p-8 text-center">
        <p className="font-medium">Belum ada data untuk ditampilkan.</p>
        <p className="text-sm text-slate-400">Unggah sertifikat untuk melihat grafik.</p>
      </div>
    );
  }

  const maxJP = Math.max(20, ...rows.map((r) => r.totalJP));
  const yMax = Math.ceil(maxJP / 5) * 5;

  return (
    <div className="glass card-hover p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Progress JP per Pegawai</h3>
        <span className="text-xs text-slate-300">Target: 20 JP</span>
      </div>

      {/* Penting: beri tinggi tertentu agar ResponsiveContainer punya ukuran */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39CCCC" />
                <stop offset="100%" stopColor="#0074D9" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="nama"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              interval={0}
              height={50}
              tickFormatter={(v: string) => trimLabel(v)}
            />
            <YAxis
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              domain={[0, yMax]}
              allowDecimals={false}
            />
            <Tooltip content={<NiceTooltip />} />

            <ReferenceLine
              y={20}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: "Target 20 JP", position: "right", fill: "#22c55e", fontSize: 12 }}
            />

            <Bar dataKey="totalJP" radius={[8, 8, 0, 0]} fill="url(#barFill)">
              {rows.map((d, i) => (
                <Cell key={i} fill={d.totalJP >= 20 ? "#22c55e" : "url(#barFill)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Tipe ringan untuk tooltip agar bebas 'any' & kompatibel lint */
type MinimalTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: RowChart }>;
};

function NiceTooltip({ active, payload }: MinimalTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="glass-light px-3 py-2 rounded-xl shadow">
      <p className="font-medium">{item.nama}</p>
      <p className="text-sm">
        Total: <b>{item.totalJP} JP</b>
      </p>
      <p className="text-xs text-slate-600">Target: 20 JP</p>
    </div>
  );
}

function trimLabel(v: string, max = 10) {
  if (!v) return "-";
  return v.length > max ? v.slice(0, max - 1) + "…" : v;
}
