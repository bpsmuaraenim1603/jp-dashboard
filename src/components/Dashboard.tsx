'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TARGET = 20;

// tipe untuk baris sertifikat di tabel Supabase
interface CertificateRow {
  employee_name: string;
  jp: number;
  file_url: string;
  cert_number: string;
  training_name: string;
  created_at: string;
}

// tipe untuk agregasi per pegawai
interface EmployeeProgress {
  name: string;
  totalJP: number;
  count: number;
  progress: number;
}

export default function Dashboard() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('certificates')
      .select('employee_name,jp,file_url,cert_number,training_name,created_at')
      .order('created_at', { ascending: false });

    if (!error) {
      setRows((data as CertificateRow[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const byEmployee: EmployeeProgress[] = useMemo(() => {
    const map = new Map<string, { totalJP: number; count: number }>();
    for (const r of rows) {
      const cur = map.get(r.employee_name) || { totalJP: 0, count: 0 };
      map.set(r.employee_name, {
        totalJP: cur.totalJP + Number(r.jp || 0),
        count: cur.count + 1,
      });
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        totalJP: v.totalJP,
        count: v.count,
        progress: Math.min(100, Math.round((v.totalJP / TARGET) * 100)),
      }))
      .sort((a, b) => b.totalJP - a.totalJP);
  }, [rows]);

  const totalJP = rows.reduce((s, r) => s + Number(r.jp || 0), 0);
  const totalCert = rows.length;
  const totalPegawai = byEmployee.length;

  return (
    <div className="space-y-6">
      {/* Kartu ringkasan */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total JP</p>
          <p className="text-3xl font-bold">{totalJP}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Sertifikat</p>
          <p className="text-3xl font-bold">{totalCert}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">
            Jumlah Pegawai (yang sudah upload)
          </p>
          <p className="text-3xl font-bold">{totalPegawai}</p>
        </div>
      </div>

      {/* Grafik batang per pegawai */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Progress JP per Pegawai (Target 20 JP)
          </h3>
          <span className="text-xs text-gray-500">
            *geser/zoom dengan pinch di HP
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byEmployee}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalJP" name="Total JP" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daftar sertifikat terbaru */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3">Sertifikat Terbaru</h3>
        {loading ? (
          <p>Memuat...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Pegawai</th>
                  <th className="py-2 pr-3">Nomor</th>
                  <th className="py-2 pr-3">Diklat</th>
                  <th className="py-2 pr-3">JP</th>
                  <th className="py-2 pr-3">File</th>
                  <th className="py-2 pr-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.employee_name}</td>
                    <td className="py-2 pr-3">{r.cert_number}</td>
                    <td className="py-2 pr-3">{r.training_name}</td>
                    <td className="py-2 pr-3 font-semibold">{r.jp}</td>
                    <td className="py-2 pr-3">
                      <a
                        href={r.file_url}
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lihat PDF
                      </a>
                    </td>
                    <td className="py-2 pr-3">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
