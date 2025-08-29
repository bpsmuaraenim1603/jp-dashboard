"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EMPLOYEE_NAMES } from "@/constants/employees";
import JPBarChart from "@/components/ui/JPBarChart";
import Sertifikatlist from "@/components/Sertifikatlist";

type Row = {
  employee_name: string;
  jp: number | null;
  created_at?: string | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingChart(true);
      setChartError(null);
      const { data, error } = await supabase
        .from("sertifikat")
        .select("employee_name, jp, created_at");

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

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = r.employee_name || "—";
      const jp = Number(r.jp || 0);
      map.set(name, (map.get(name) || 0) + jp);
    }
    const result = Array.from(map, ([nama, total]) => ({ nama, totalJP: total }));
    result.sort((a, b) => b.totalJP - a.totalJP);
    return result;
  }, [rows]);

  const TARGET_JP = 20;
  const summary = useMemo(() => {
    const totalCerts = rows.length;
    const totalJP = rows.reduce((acc, r) => acc + Number(r.jp || 0), 0);

    const perEmp = new Map<string, number>();
    rows.forEach((r) => {
      const name = r.employee_name || "—";
      perEmp.set(name, (perEmp.get(name) || 0) + Number(r.jp || 0));
    });

    const uniqueEmployees = Math.max(perEmp.size, 1);
    const avgJP = totalJP / uniqueEmployees;

    let top: { name: string; jp: number } | null = null;
    for (const [name, jp] of perEmp) {
      if (!top || jp > top.jp) top = { name, jp };
    }

    const reachedTargetCount = Array.from(perEmp.values()).filter((v) => v >= TARGET_JP).length;

    const today = new Date().toDateString();
    const uploadsToday = rows.filter((r) =>
      r.created_at ? new Date(r.created_at).toDateString() === today : false
    ).length;

    return {
      totalCerts,
      totalJP,
      avgJP,
      topEmployee: top,
      reachedTargetCount,
      totalEmployees: EMPLOYEE_NAMES.length,
      uploadsToday,
    };
  }, [rows]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const employeeName = String(fd.get("employeeName") || "").trim();
    const certNumberRaw = String(fd.get("certNumber") || "").trim();
    const trainingName = String(fd.get("trainingName") || "").trim();
    const jp = Number(fd.get("jp") || 0);
    const file = fd.get("file") as File | null;

    const certNumber = certNumberRaw === "" ? "-" : certNumberRaw;

    if (!employeeName || !trainingName || !jp || !file) {
      alert("Nama pegawai, nama diklat, JP, dan PDF wajib diisi!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file melebihi 10MB");
      return;
    }

    setLoading(true);

    const BUCKET = "sertifikat";
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const folder = employeeName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/pdf",
    });
    if (upErr) {
      setLoading(false);
      alert("Gagal mengunggah PDF: " + upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: dbErr } = await supabase.from("sertifikat").insert({
      employee_name: employeeName,
      cert_number: certNumber,
      training_name: trainingName,
      jp,
      file_url: publicUrl,
    });

    setLoading(false);
    if (dbErr) {
      alert("Gagal simpan ke database: " + dbErr.message);
      return;
    }

    alert("Data berhasil tersimpan!");
    form.reset();
    setSelectedEmployee(employeeName);

    setLoadingChart(true);
    const { data, error: err2 } = await supabase
      .from("sertifikat")
      .select("employee_name, jp, created_at");
    if (err2) {
      setChartError(err2.message);
      setRows([]);
    } else {
      setRows((data || []) as Row[]);
    }
    setLoadingChart(false);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-10">
        {/* ===== RINGKASAN (di atas chart) ===== */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  <div className="rounded-xl bg-[#00AEEF]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Total Sertifikat</p>
    <p className="mt-1 text-2xl font-bold">{summary.totalCerts}</p>
  </div>
  <div className="rounded-xl bg-[#0077C8]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Total JP</p>
    <p className="mt-1 text-2xl font-bold">{summary.totalJP}</p>
  </div>
  <div className="rounded-xl bg-[#FF6F20]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Rata-rata JP</p>
    <p className="mt-1 text-2xl font-bold">{summary.avgJP.toFixed(1)}</p>
  </div>
  <div className="rounded-xl bg-[#00A99D]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Capai Target (≥20 JP)</p>
    <p className="mt-1 text-2xl font-bold">
      {summary.reachedTargetCount}/{summary.totalEmployees}
    </p>
  </div>
  <div className="rounded-xl bg-[#00558C]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Pegawai Teraktif</p>
    <p className="mt-1 text-sm font-semibold">
      {summary.topEmployee?.name ?? "—"}
    </p>
    <p className="text-xs opacity-80">{summary.topEmployee?.jp ?? 0} JP</p>
  </div>
  <div className="rounded-xl bg-[#29ABE2]/90 text-white p-4 shadow-md">
    <p className="text-xs opacity-80">Upload Hari Ini</p>
    <p className="mt-1 text-2xl font-bold">{summary.uploadsToday}</p>
  </div>
</div>


        {/* === CHART === */}
        <section className="rounded-xl border bg-white shadow-sm p-4">
          <div className="h-[360px] w-full">
            {loadingChart ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                Memuat chart…
              </div>
            ) : chartError ? (
              <div className="flex h-full items-center justify-center text-red-600">
                Gagal memuat: {chartError}
              </div>
            ) : (
              <JPBarChart rows={chartData} />
            )}
          </div>
        </section>

        {/* === FORM === */}
        <section className="rounded-xl border bg-white shadow-sm p-6">
          <h2 className="mb-4 text-lg font-semibold">Upload Sertifikat JP</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama Pegawai */}
            <div className="flex flex-col gap-1">
              <label htmlFor="employeeName" className="text-sm font-medium">
                Nama Pegawai
              </label>
              <select
                id="employeeName"
                name="employeeName"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
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

            {/* Nomor Sertifikat (opsional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="certNumber" className="text-sm font-medium">
                Nomor Sertifikat (opsional)
              </label>
              <input
                id="certNumber"
                name="certNumber"
                type="text"
                placeholder="isi nomor, atau kosongkan / '-'"
                className="rounded-md border px-3 py-2"
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
        </section>

        {/* === TABEL SERTIFIKAT === */}
        {selectedEmployee && (
          <section className="rounded-xl border bg-white shadow-sm p-4">
            <Sertifikatlist employeeName={selectedEmployee} />
          </section>
        )}
      </div>
    </main>
  );
}
