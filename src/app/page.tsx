"use client";

import { useEffect, useMemo, useState } from "react";
import JPBarChart from "@/components/JPBarChart";
import { StatCard } from "@/components/StatCard";
import { UploadForm } from "@/components/UploadForm";
import { supabase } from "@/lib/supabaseClient";

type RowDB = {
  id: string;
  employee_name: string | null;
  cert_number: string;
  training_name: string;
  jp: number | null;
  file_url: string | null;
  created_at: string;
};

type RowChart = { nama: string; totalJP: number };

const TABLE_NAME = "sertifikat";
const TARGET = 20;

export default function Page() {
  const [rows, setRows] = useState<RowDB[]>([]);

  async function loadData() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id, employee_name, cert_number, training_name, jp, file_url, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setRows(data as RowDB[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  // agregasi per pegawai -> { nama, totalJP }
  const byPegawai: RowChart[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = (r.employee_name ?? "-").trim() || "-";
      map.set(name, (map.get(name) ?? 0) + Number(r.jp ?? 0));
    }
    return Array.from(map.entries())
      .map(([nama, totalJP]) => ({ nama, totalJP }))
      .sort((a, b) => b.totalJP - a.totalJP);
  }, [rows]);

  const totalJP = useMemo(
    () => rows.reduce((s, r) => s + Number(r.jp ?? 0), 0),
    [rows]
  );
  const totalPegawai = byPegawai.length;
  const selesai = byPegawai.filter((x) => x.totalJP >= TARGET).length;
  const isEmpty = rows.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Kartu ringkasan */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total JP Terhimpun" value={totalJP} subtitle="Akumulasi seluruh sertifikat" />
        <StatCard title="Target per Pegawai" value={TARGET} subtitle="Batas tuntas individu" />
        <StatCard title="Pegawai Terekam" value={totalPegawai} subtitle={`Tuntas: ${selesai}`} />
      </section>

      {/* Chart atau Empty State */}
      <section>
        {isEmpty ? (
          <div className="glass-light rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Mulai dari Nol</h2>
            <p className="text-slate-300">
              Belum ada data JP. Silakan unggah sertifikat pertama untuk memulai rekap.
            </p>
          </div>
        ) : (
          <JPBarChart rows={byPegawai} />
        )}
      </section>

      {/* Form Upload */}
      <section id="upload">
        <UploadForm onUploaded={loadData} />
      </section>
    </div>
  );
}
