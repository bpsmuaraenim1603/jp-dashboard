"use client";
export function SertifikatTable({ rows }:{ rows: { nomor:string; namaDiklat:string; jp:number; pdfUrl:string; }[] }){
  return (
    <div className="glass card-hover overflow-hidden">
      <div className="overflow-auto max-h-[420px]">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white/10 backdrop-blur-md">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-slate-200">
              <th>Nomor Sertifikat</th><th>Nama Diklat</th><th>JP</th><th>File</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-white/5">
            {rows.map((r,i)=>(
              <tr key={i} className="[&>td]:px-4 [&>td]:py-3">
                <td className="font-medium">{r.nomor}</td>
                <td>{r.namaDiklat}</td>
                <td>
                  <span className="inline-flex items-center rounded-md bg-[#39CCCC]/20 px-2 py-0.5 text-xs text-[#39CCCC]">{r.jp} JP</span>
                </td>
                <td><a className="underline decoration-dotted hover:opacity-80" href={r.pdfUrl} target="_blank">Lihat PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
