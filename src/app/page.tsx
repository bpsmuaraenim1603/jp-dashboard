"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EMPLOYEE_NAMES } from "@/constants/employees";

// ⬇️ Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = {
  employee_name: string;
  jp: number | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);

  // --- state untuk chart ---
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Ambil data utk chart (total JP per pegawai)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingChart(true);
      setChartError(null);
      const { data, error } = await supabase
        .from("sertifikat")
        .select("employee_name, jp");
      if (cancelled) return;

      if (error) {
        setChartError(error.message);
        setRows([]);
      } else {
        setRows((data || []) as Row[]);
      }
      setLoadingChart(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Olah data → agregasi per pegawai
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = r.employee_name || "—";
      const jp = Number(r.jp || 0);
      map.set(name, (map.get(name) || 0) + jp);
    }
    // biar rapi: tampilkan hanya pegawai yg ada di EMPLOYEE_NAMES (opsional)
    const result = Array.from(map, ([name, total]) => ({
      name,
      totalJP: total,
    }));

    // urutkan desc
    result.sort((a, b) => b.totalJP - a.totalJP);
    return result;
  }, [rows]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const employeeName = String(fd.get("employeeName") || "");
    const certNumber = String(fd.get("certNumber") || "");
    const trainingName = String(fd.get("trainingName") || "");
    const jp = Number(fd.get("jp") || 0);
    const file = fd.get("file") as File | null;

    if (!employeeName || !certNumber || !trainingName || !jp || !file) {
      alert("Semua field wajib diisi!");
      return;
    }

    setLoading(true);

    // sementara: simpan nama file sbg file_url
    const fileUrl = file.name;

    const { error } = await supabase.from("sertifikat").insert({
      employee_name: employeeName,
      cert_number: certNumber,
      training_name: trainingName,
      jp,
      file_url: fileUrl,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Gagal simpan: " + error.message);
    } else {
      alert("Data berhasil tersimpan!");
      e.currentTarget.reset();

      // refresh data chart biar langsung kelihatan naik
      setLoadingChart(true);
      const { data, error: err2 } = await supabase
        .from("sertifikat")
        .select("employee_name, jp");
      if (err2) {
        setChartError(err2.message);
        setRows([]);
      } else {
        setRows((data || []) as Row[]);
      }
      setLoadingChart(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Upload Sertifikat JP</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border p-4">
        {/* Nama Pegawai */}
        <div className="flex flex-col gap-1">
          <label htmlFor="employeeName" className="text-sm font-medium">
            Nama Pegawai
          </label>
          <select
            id="employeeName"
            name="employeeName"
            defaultValue=""
            className="rounded-md border px-3 py-2"
            required
          >
            <option value="" disabled>
              — Pilih nama pegawai —
            </option>
            {EMPLOYEE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Nomor Sertifikat */}
        <div className="flex flex-col gap-1">
          <label htmlFor="certNumber" className="text-sm font-medium">
            Nomor Sertifikat
          </label>
          <input
            id="certNumber"
            name="certNumber"
            type="text"
            placeholder="contoh: 0003/TEKNIS-SM/237/BPS/P/2025"
            className="rounded-md border px-3 py-2"
            required
          />
        </div>

        {/* Nama Diklat */}
        <div className="flex flex-col gap-1">
          <label htmlFor="trainingName" className="text-sm font-medium">
            Nama Diklat
          </label>
          <input
            id="trainingName"
            name="trainingName"
            type="text"
            placeholder="contoh: Pelatihan SE"
            className="rounded-md border px-3 py-2"
            required
          />
        </div>

        {/* Banyak JP */}
        <div className="flex flex-col gap-1">
          <label htmlFor="jp" className="text-sm font-medium">
            Banyak JP
          </label>
          <input
            id="jp"
            name="jp"
            type="number"
            min="1"
            placeholder="contoh: 6"
            className="rounded-md border px-3 py-2"
            required
          />
        </div>

        {/* Upload File Sertifikat */}
        <div className="flex flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium">
            Upload PDF Sertifikat
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf"
            className="rounded-md border px-3 py-2"
            required
          />
          <p className="text-xs text-gray-500">PDF maksimal 10MB</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan…" : "Simpan & Unggah"}
        </button>
      </form>

      {/* CHART */}
      <section className="mt-10 rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Diagram Batang JP per Pegawai</h2>
          {/* Info kecil */}
          <span className="text-xs text-gray-500">
            Sumber: tabel <code>sertifikat</code> (total JP)
          </span>
        </div>

        {/* Penting: container dengan tinggi tetap */}
        <div className="h-80 w-full">
          {loadingChart ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Memuat chart…
            </div>
          ) : chartError ? (
            <div className="flex h-full items-center justify-center text-red-600">
              Gagal memuat: {chartError}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Belum ada data untuk ditampilkan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="totalJP" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </main>
  );
}
