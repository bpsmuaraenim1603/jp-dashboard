"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  employee_name: string;
  created_at: string;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("jp_entries")
        .select("id, employee_name, created_at")
        .order("created_at", { ascending: false });

      if (!ignore) {
        if (error) console.error(error);
        setRows(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <main className="p-6">Memuat…</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Daftar Entri (Client)</h1>
      {rows.length === 0 ? (
        <p>Belum ada data.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded border px-3 py-2">
              {r.employee_name} —{" "}
              <span className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
