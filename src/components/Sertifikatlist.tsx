"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  // === Edit state (ganti PDF) ===
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ====== CONFIG ======
  const BUCKET = "sertifikat";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("sertifikat")
        .select("*")
        .order("created_at", { ascending: false });

      if (employeeName) query = query.eq("employee_name", employeeName);

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
      [r.employee_name, r.training_name || "", r.cert_number || ""]
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [rows, q]);

  // ===== Helpers =====
  const safe = (s: string) =>
    s.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");

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

  async function refresh() {
    let query = supabase
      .from("sertifikat")
      .select("*")
      .order("created_at", { ascending: false });
    if (employeeName) query = query.eq("employee_name", employeeName);
    const { data } = await query;
    setRows((data || []) as Row[]);
  }

  // ====== Hapus satu baris ======
  async function handleDelete(row: Row) {
    if (busyId) return;
    const ok = confirm(
      `Yakin menghapus sertifikat ini?\n\nPegawai: ${row.employee_name}\nDiklat: ${row.training_name || "-"}`
    );
    if (!ok) return;

    setBusyId(row.id);

    // 1) Hapus file di storage (jika bisa)
    const storagePath = extractStoragePathFromPublicUrl(row.file_url);
    if (storagePath) {
      const { error: delFileErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (delFileErr) {
        console.warn("Gagal hapus file storage:", delFileErr.message);
      }
    }

    // 2) Hapus baris DB
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

  // ====== Simpan PDF baru (Edit) ======
  async function handleSaveNewFile() {
    if (!editRow || !newFile) return;
    if (newFile.size > 10 * 1024 * 1024) {
      alert("Ukuran PDF melebihi 10MB");
      return;
    }

    setSaving(true);

    // 1) Upload file baru
    const folder = safe(editRow.employee_name || "pegawai");
    const filename = `${Date.now()}-${safe(newFile.name)}`;
    const path = `${folder}/${filename}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, newFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    if (upErr) {
      setSaving(false);
      alert("Gagal mengunggah PDF baru: " + upErr.message);
      return;
    }

    // 2) Public URL baru
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const newUrl = pub.publicUrl;

    // 3) Update baris DB
    const { error: dbErr } = await supabase
      .from("sertifikat")
      .update({ file_url: newUrl })
      .eq("id", editRow.id);

    if (dbErr) {
      setSaving(false);
      alert("Gagal menyimpan URL baru: " + dbErr.message);
      return;
    }

    // 4) Hapus file lama (opsional)
    const oldPath = extractStoragePathFromPublicUrl(editRow.file_url);
    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    setSaving(false);
    setEditRow(null);
    setNewFile(null);
    await refresh();
  }

  // Tabel hanya muncul saat sudah pilih pegawai (sesuai behavior-mu)
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
                        onClick={() => setEditRow(r)}
                        className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        title="Ganti PDF"
                      >
                        Edit
                      </button>

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

      {/* ===== Modal Edit PDF ===== */}
      {editRow && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Ganti PDF Sertifikat</h3>
              <p className="text-xs text-gray-500">
                {editRow.employee_name} — {editRow.training_name || "—"}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border px-3 py-2"
              />
              <p className="text-xs text-gray-500">PDF maksimal 10MB</p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { if (!saving) { setEditRow(null); setNewFile(null); } }}
                className="rounded-xl border px-3 py-2 hover:bg-gray-50"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleSaveNewFile}
                disabled={!newFile || saving}
                className="rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
