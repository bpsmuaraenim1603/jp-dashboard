"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase"; // pakai alias @/lib, sesuaikan kalau beda

type Row = {
  id: string;
  employee_name: string;
  training_name: string | null;
  cert_number: string | null;
  jp: number | null;
  file_url: string | null;
  created_at: string | null;
};

export default function Sertifikatlist({ employeeName }: { employeeName?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // ====== CONFIG ======
  const BUCKET = "sertifikat";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const query = supabase
        .from("sertifikat")
        .select("*")
        .order("created_at", { ascending: false });

      if (employeeName) query.eq("employee_name", employeeName);

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data || []) as Row[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeName]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter((r) =>
      [
        r.employee_name,
        r.training_name || "",
        r.cert_number || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [rows, q]);

  // ====== Helpers ======
  // Ekstrak storage path dari public URL supabase:
  // contoh URL: .../storage/v1/object/public/sertifikat/<PATH_ASLI>
  function extractStoragePathFromPublicUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      const marker = `/object/public/${BUCKET}/`;
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      const raw = u.pathname.slice(idx + marker.length);
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }

  // ====== Hapus satu baris ======
  async function handleDelete(row: Row) {
    if (busyId) return;
    const ok = confirm(
      `Yakin menghapus sertifikat ini?\n\nPegawai: ${row.employee_name}\nDiklat: ${row.training_name || "-"}`
    );
    if (!ok) return;

    setBusyId(row.id);

    // 1) Hapus file di storage (jika ada URL dan bisa diekstrak pathnya)
    const storagePath = extractStoragePathFromPublicUrl(row.file_url);
    if (storagePath) {
      const { error: delFileErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (delFileErr) {
        // Kalau gagal hapus file, tetap lanjut hapus row DB (opsional: batalkan)
        console.warn("Gagal hapus file storage:", delFileErr.message);
      }
    }

    // 2) Hapus baris di DB
    const { error: delRowErr } = await supabase.from("sertifikat").delete().eq("id", row.id);
    if (delRowErr) {
      alert("Gagal menghapus data: " + delRowErr.message);
      setBusyId(null);
      return;
    }

    // 3) Update UI
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setBusyId(null);
  }

  // Jika belum pilih pegawai (halaman kamu menampilkan tabel hanya setelah pilih pegawai),
  // komponen boleh dikembalikan null supaya ringkas. Hapus blok ini jika ingin tetap tampil.
  if (!employeeName) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sertifikat Pegawai</h2>
          <p className="text-sm text-gray-500">
            Menampilkan sertifikat milik: <b>{employeeName}</b>
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama diklat / nomor sertifikat…"
          className="w-full sm:w-80 rounded-xl border px-3 py-2 outline-none focus:ring-2"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Nama Pegawai</th>
              <th className="px-4 py-3">Nama Diklat</th>
              <th className="px-4 py-3">No. Sertifikat</th>
              <th className="px-4 py-3">JP</th>
              <th className="px-4 py-3">Tanggal Upload</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4" colSpan={6}>Memuat…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={6}>Tidak ada data.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.employee_name}</td>
                  <td className="px-4 py-3">{r.training_name || "—"}</td>
                  <td className="px-4 py-3">{r.cert_number || "—"}</td>
                  <td className="px-4 py-3">{r.jp ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {r.file_url ? (
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        >
                          Buka/Unduh
                        </a>
                      ) : (
                        <span className="rounded-xl border px-3 py-1 text-gray-400">
                          Tidak ada file
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(r)}
                        disabled={busyId === r.id}
                        className="rounded-xl border px-3 py-1 hover:bg-red-50 text-red-600 border-red-300 disabled:opacity-60"
                        title="Hapus baris & file"
                      >
                        {busyId === r.id ? "Menghapus…" : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
