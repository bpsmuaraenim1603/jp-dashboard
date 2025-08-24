"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

const BUCKET_NAME = "sertifikat";   // GANTI jika nama bucket Storage kamu beda
const TABLE_NAME  = "sertifikat";   // Nama tabel di screenshot kamu

type Props = { onUploaded?: () => void };

export function UploadForm({ onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [trainingName, setTrainingName] = useState("");
  const [jp, setJp] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!file) throw new Error("Pilih file PDF dulu.");
      if (file.type !== "application/pdf") throw new Error("File harus PDF.");

      // === 1) Upload ke STORAGE ===
      const safe = (s: string) =>
        s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_.]/g, "");
      const path = `pdf/${Date.now()}-${safe(certNumber || "no-number")}.pdf`;

      const up = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(path, file, { upsert: false, contentType: "application/pdf" });

      if (up.error) {
        console.error("STORAGE UPLOAD ERROR:", up.error);
        alert(`Upload gagal (storage): ${up.error.message}`);
        return;
      }

      const pub = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      const fileUrl = pub.data.publicUrl;

      // === 2) Insert ke DB === (kolom selaras dgn tabel kamu)
      const ins = await supabase
        .from(TABLE_NAME)
        .insert({
          employee_name: employeeName,
          cert_number: certNumber,
          training_name: trainingName,
          jp: Number(jp),
          file_url: fileUrl,
        })
        .select()
        .single();

      if (ins.error) {
        console.error("DB INSERT ERROR raw:", ins);
        const { code, message, details, hint } = ins.error;
        alert(
          `Simpan ke database gagal:\n` +
          `code: ${code ?? "-"}\n` +
          `message: ${message ?? "-"}\n` +
          `details: ${details ?? "-"}\n` +
          `hint: ${hint ?? "-"}`
        );
        return;
      }

      alert("Sertifikat diunggah. Terima kasih!");
      // reset form
      setEmployeeName(""); setCertNumber(""); setTrainingName(""); setJp(""); setFile(null);
      onUploaded?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("GENERAL ERROR:", err);
      alert(`Gagal mengunggah: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass card-hover p-6">
      <h3 className="text-lg font-semibold mb-1">Upload Sertifikat JP</h3>
      <p className="text-sm text-slate-300 mb-4">PDF maksimal ±10MB</p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nama Pegawai</label>
            <Input
              className="focus-ring"
              placeholder="mis. Amran Pratama Putra"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Nomor Sertifikat</label>
            <Input
              className="focus-ring"
              placeholder="0003/TEKNIS-SM/237/BPS/P/2025"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nama Diklat</label>
            <Input
              className="focus-ring"
              placeholder="Pelatihan SE"
              value={trainingName}
              onChange={(e) => setTrainingName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Banyak JP</label>
            <Input
              className="focus-ring"
              type="number"
              min={1}
              max={100}
              placeholder="6"
              value={jp}
              onChange={(e) => setJp(e.target.value ? Number(e.target.value) : "")}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Upload PDF Sertifikat</label>
          <input
            className="focus-ring block w-full rounded-md border border-white/20 bg-white/10 file:mr-4 file:rounded-md file:border-0 file:bg-[#39CCCC] file:px-3 file:py-2 file:text-sm file:font-medium file:text-black hover:file:brightness-110"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={loading || !employeeName || !certNumber || !trainingName || !jp || !file}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#39CCCC] px-5 py-2.5 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />} Simpan & Unggah
          </button>
          <p className="text-xs text-slate-400">* Tanpa login — semua pegawai bisa akses.</p>
        </div>
      </form>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
