"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

type Row = { nama: string; totalJP: number };

type Props = {
  rows: Row[];
  height?: number;
};

function JPBarChartBase({ rows, height = 360 }: Props) {
  // palet gradien lembayung pastel-modern
  const GRADIENTS = [
    { id: "grad1", from: "#a78bfa", to: "#f472b6" }, // ungu → pink
    { id: "grad2", from: "#60a5fa", to: "#c084fc" }, // biru → ungu
    { id: "grad3", from: "#34d399", to: "#a78bfa" }, // hijau → ungu
    { id: "grad4", from: "#f9a8d4", to: "#f472b6" }, // pink → rose
    { id: "grad5", from: "#c084fc", to: "#60a5fa" }, // ungu → biru
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 10, right: 24, bottom: 24, left: 0 }}
          barCategoryGap={18}
        >
          <defs>
            {GRADIENTS.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.9} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0.9} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="nama"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={0}
            height={40}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number) => [v, "JP"]}
            labelFormatter={(label) => `Pegawai: ${label}`}
          />
          <ReferenceLine y={20} stroke="#9ca3af" strokeDasharray="4 4" />

          <Bar dataKey="totalJP">
            {rows.map((_, i) => (
              <Cell key={`cell-${i}`} fill={`url(#${GRADIENTS[i % GRADIENTS.length].id})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(JPBarChartBase);
