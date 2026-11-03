import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guru Jagoan AI v2.0 — SuperApp Perangkat Ajar & Administrasi Kurikulum Nasional",
  description:
    "Aplikasi Terpadu Generator RPP Pembelajaran Mendalam (Deep Learning), Insersi Isu Nasional, KKTP Taksonomi SOLO, Racik Soal HOTS, Projek Kokurikuler P5, dan Administrasi Guru.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-200 selection:text-indigo-950">
        {children}
      </body>
    </html>
  );
}
