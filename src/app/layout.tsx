import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard JP Pegawai",
  description: "Sistem Monitoring Jam Pelatihan Pegawai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 text-slate-900 antialiased">
        {/* ====== HEADER COLOURFUL ====== */}
        <header className="sticky top-0 z-50">
          {/* Bar gradien penuh */}
          <div className="relative">
            {/* Layer gradien */}
            <div className="h-20 md:h-28 w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
            {/* Aksen gelombang bawah */}
            <svg
              className="absolute bottom-[-1px] left-0 w-full text-white"
              viewBox="0 0 1440 80"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              <path d="M0,64 C240,16 480,16 720,48 C960,80 1200,80 1440,48 L1440,80 L0,80 Z" />
            </svg>
            {/* Grain halus supaya lebih hidup */}
            <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light"
                 style={{
                   backgroundImage:
                     "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' opacity='0.35' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                   backgroundSize: "220px 220px",
                 }}
            />
          </div>

          {/* Konten header (logo & judul) */}
          <div className="relative mx-auto -mt-10 md:-mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-white/40 shadow-xl px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
              {/* Kiri: logo + judul */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Logo: badge gradien */}
                <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-xl shadow-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600" />
                  <div className="absolute inset-[3px] rounded-lg bg-white/90 grid place-items-center text-slate-800 font-extrabold">
                    JP
                  </div>
                </div>

                {/* Judul besar & menarik */}
                <div className="leading-tight">
                  <p className="text-[11px] md:text-xs uppercase tracking-[0.2em] text-slate-500">
                    Sistem Monitoring
                  </p>
                  <h1 className="mt-1 text-[20px] md:text-[28px] lg:text-[32px] font-extrabold tracking-tight">
                    <span className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      Dashboard JP Pegawai
                    </span>
                  </h1>
                </div>
              </div>

              {/* Kanan: (kosong—tombol Upload Sertifikat sudah dihapus) */}
              <div className="h-0 w-0" aria-hidden />
            </div>
          </div>
        </header>

        {/* ====== MAIN ====== */}
        <main className="py-8">{children}</main>

        {/* ====== FOOTER ====== */}
        <footer className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} — Sensus Ekonomi
          </div>
        </footer>
      </body>
    </html>
  );
}
