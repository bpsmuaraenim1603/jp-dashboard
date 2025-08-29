"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EMPLOYEE_NAMES } from "@/constants/employees";
import JPBarChart from "@/components/ui/JPBarChart";
import Sertifikatlist from "@/components/Sertifikatlist"; // pakai nama file-mu

type Row = {
  employee_name: string;
  jp: number | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // >>> NEW: pegawai yang dipilih (untuk memunculkan & memfilter tabel)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Ambil data untuk chart
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

  // Agregasi JP per pegawai untuk chart
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

  // Submit form (upload ke Storage + simpan URL ke DB)
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

    // >>> NEW: setelah submit, otomatis set filter ke pegawai tersebut
    setSelectedEmployee(employeeName);

    // refresh chart (opsional)
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
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Spasi vertikal antar section */}
      <div className="space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Dashboard & Upload Sertifikat JP</h1>
          <p className="text-sm text-gray-500">
            Rekap JP per pegawai + Form unggah sertifikat
          </p>
        </header>

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
                value={selectedEmployee} // <<< controlled
                onChange={(e) => setSelectedEmployee(e.target.value)} // <<< set state
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

        {/* === TABEL SERTIFIKAT ===
            Hanya muncul setelah pegawai dipilih */}
        {selectedEmployee && (
          <section className="rounded-xl border bg-white shadow-sm p-4">
            <Sertifikatlist employeeName={selectedEmployee} />
          </section>
        )}
      </div>
    </main>
  );
}
