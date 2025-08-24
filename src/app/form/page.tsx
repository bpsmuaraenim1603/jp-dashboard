"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { EMPLOYEE_NAMES } from "@/constants/employees";

export default function FormPage() {
  const [loading, setLoading] = useState(false);

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

    // sementara: simpan nama file saja ke kolom file_url
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
    }
  };

  // ❗️DIBUNGKUS SATU PARENT <main> BIAR TIDAK ERROR JSX
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Form Upload Sertifikat JP</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="0003/TEKNIS-SM/237/BPS/P/2025"
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
            placeholder="Pelatihan SE"
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
            min={1}
            placeholder="6"
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
    </main>
  );
}
