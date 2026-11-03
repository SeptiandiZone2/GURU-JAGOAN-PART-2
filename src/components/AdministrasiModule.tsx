"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Sparkles,
  Loader2,
  Edit3,
  FileText,
  Download,
  Printer,
  Calendar,
  BookCheck,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Level, TeacherProfile } from "@/types";
import { KELAS_BY_LEVEL, SUBJECTS } from "@/constants";
import { callGeminiJson } from "@/lib/geminiService";
import { exportElementToPDF, exportHtmlToWordDoc } from "@/lib/exportUtils";

interface Props {
  profile: TeacherProfile;
  onAlert: (msg: string) => void;
}

type AdminDocType = "atp" | "prota" | "promes" | "jurnal" | "diagnostik";

export default function AdministrasiModule({ profile, onAlert }: Props) {
  const [selectedType, setSelectedType] = useState<AdminDocType>("atp");
  const [formAdmin, setFormAdmin] = useState({
    namaSekolah: profile.namaSekolah || "SMP NEGERI 1 INDONESIA",
    namaGuru: profile.namaGuru || "",
    nipGuru: profile.nipGuru || "",
    namaKepalaSekolah: profile.namaKepalaSekolah || "",
    nipKepalaSekolah: profile.nipKepalaSekolah || "",
    level: (profile.level || "SD") as Level,
    kelas: profile.kelas || "1",
    fase: profile.fase || "A",
    mataPelajaran: profile.mataPelajaran || "Bahasa Indonesia",
    tahunPelajaran: profile.tahunPelajaran || "2026/2027",
    semester: profile.semester || "Ganjil",
    catatanKhusus: "",
  });

  useEffect(() => {
    setFormAdmin((prev) => ({
      ...prev,
      namaSekolah: profile.namaSekolah || prev.namaSekolah,
      namaGuru: profile.namaGuru || prev.namaGuru,
      nipGuru: profile.nipGuru || prev.nipGuru,
      namaKepalaSekolah: profile.namaKepalaSekolah || prev.namaKepalaSekolah,
      nipKepalaSekolah: profile.nipKepalaSekolah || prev.nipKepalaSekolah,
      level: profile.level || prev.level,
      kelas: profile.kelas || prev.kelas,
      fase: profile.fase || prev.fase,
      mataPelajaran: profile.mataPelajaran || prev.mataPelajaran,
      tahunPelajaran: profile.tahunPelajaran || prev.tahunPelajaran,
      semester: profile.semester || prev.semester,
    }));
  }, [profile]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [docs, setDocs] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);

  const adminCatalog: {
    id: AdminDocType;
    title: string;
    subtitle: string;
    icon: any;
  }[] = [
    {
      id: "atp",
      title: "Alur Tujuan Pembelajaran (ATP)",
      subtitle: "Pemetaan Elemen CP, TP, Materi Esensial, JP & Profil Lulusan",
      icon: Layers,
    },
    {
      id: "prota",
      title: "Program Tahunan (PROTA)",
      subtitle: "Distribusi Tujuan Pembelajaran & Alokasi JP Semester 1 & 2",
      icon: Calendar,
    },
    {
      id: "promes",
      title: "Program Semester (PROMES)",
      subtitle: "Rincian Pekan Efektif & Distribusi Materi Bulanan",
      icon: BookCheck,
    },
    {
      id: "diagnostik",
      title: "Asesmen Diagnostik Awal",
      subtitle: "Instrumen Pemetaan Kognitif & Non-Kognitif (Gaya Belajar & Minat)",
      icon: Users,
    },
    {
      id: "jurnal",
      title: "Jurnal Agenda & Refleksi Guru",
      subtitle: "Format Jurnal Mengajar Harian, Absensi & Tindak Lanjut Supervisi",
      icon: ClipboardList,
    },
  ];

  const handleGenerateAdmin = async () => {
    setIsGenerating(true);
    try {
      let prompt = "";
      const ctx = `Sekolah: ${formAdmin.namaSekolah}, Jenjang ${formAdmin.level} Kelas ${formAdmin.kelas} (Fase ${formAdmin.fase}), Mata Pelajaran: ${formAdmin.mataPelajaran}, Tahun Pelajaran: ${formAdmin.tahunPelajaran}, Semester: ${formAdmin.semester}. Catatan: ${formAdmin.catatanKhusus || "Sesuai Kurikulum Nasional terbaru"}`;

      if (selectedType === "atp") {
        prompt = `Buatkan dokumen Alur Tujuan Pembelajaran (ATP) lengkap untuk ${ctx}. Kembalikan JSON murni:
        {
          "judul": "ALUR TUJUAN PEMBELAJARAN (ATP)",
          "capaianUmumFase": "...",
          "barisATP": [
            {
              "no": "1.1",
              "elemen": "...",
              "capaianPembelajaran": "...",
              "tujuanPembelajaran": "...",
              "materiPokok": "...",
              "alokasiJP": "6 JP",
              "dimensiProfil": "..."
            }
          ]
        }`;
      } else if (selectedType === "prota") {
        prompt = `Buatkan dokumen Program Tahunan (PROTA) lengkap (Semester Ganjil dan Genap) untuk ${ctx}. Kembalikan JSON murni:
        {
          "judul": "PROGRAM TAHUNAN (PROTA)",
          "barisProta": [
            {
              "semester": "1 (Ganjil)",
              "noUnit": "Bab 1",
              "topikMateri": "...",
              "tujuanPembelajaran": "...",
              "alokasiJP": "12 JP",
              "keterangan": "..."
            }
          ],
          "totalJPGanjil": "54 JP",
          "totalJPGenap": "54 JP"
        }`;
      } else if (selectedType === "promes") {
        prompt = `Buatkan dokumen Program Semester (PROMES) lengkap untuk ${ctx}. Kembalikan JSON murni:
        {
          "judul": "PROGRAM SEMESTER (PROMES)",
          "barisPromes": [
            {
              "no": 1,
              "kompDasarTP": "...",
              "materiPokok": "...",
              "alokasiJP": "6 JP",
              "bulanMinggu": "Juli Minggu ke-3 & 4",
              "metodeAsesmen": "..."
            }
          ]
        }`;
      } else if (selectedType === "diagnostik") {
        prompt = `Buatkan Instrumen Asesmen Diagnostik Non-Kognitif (Kesejahteraan psikososial, gaya belajar, minat) dan Diagnostik Kognitif Awal untuk ${ctx}. Kembalikan JSON murni:
        {
          "judul": "INSTRUMEN ASESMEN DIAGNOSTIK AWAL PEMBELAJARAN",
          "tujuanPemetaan": "...",
          "pertanyaanNonKognitif": [
            { "no": 1, "aspek": "Gaya Belajar / Minat / Emosi", "pertanyaan": "...", "tindakLanjutGuru": "..." }
          ],
          "pertanyaanKognitif": [
            { "no": 1, "kompetensiPrasyarat": "...", "soalSingkat": "...", "kunciJawaban": "...", "intervensiJikaSalah": "..." }
          ]
        }`;
      } else if (selectedType === "jurnal") {
        prompt = `Buatkan draf terisi Jurnal Agenda Mengajar Guru & Refleksi Pembelajaran (contoh 6 pertemuan berurutan) untuk ${ctx}. Kembalikan JSON murni:
        {
          "judul": "JURNAL AGENDA MENGAJAR & REFLEKSI GURU",
          "barisJurnal": [
            {
              "pertemuanKe": 1,
              "topikMateri": "...",
              "tujuanPembelajaran": "...",
              "aktivitasDeepLearning": "...",
              "ketercapaianKKTP": "88% Tuntas",
              "refleksiTindakLanjut": "..."
            }
          ]
        }`;
      }

      const parsed = await callGeminiJson(
        prompt,
        "Kamu adalah pengawas sekolah dan pakar administrasi guru Kurikulum Nasional. Kembalikan JSON murni yang lengkap dan rapi."
      );
      setDocs((prev) => ({ ...prev, [selectedType]: parsed }));
    } catch (e: any) {
      onAlert(e.message || "Gagal menyusun dokumen administrasi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDoc = docs[selectedType];

  return (
    <div className="space-y-6">
      {/* Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
        {adminCatalog.map((item) => {
          const Icon = item.icon;
          const active = selectedType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between",
                active
                  ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-lg shadow-emerald-200"
                  : "bg-white border-slate-200 hover:border-emerald-300 text-slate-800"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-600"
                )}
              >
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black leading-snug">
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "text-[10px] mt-1 leading-relaxed",
                    active ? "text-emerald-100" : "text-slate-500"
                  )}
                >
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4 print:hidden h-fit">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Parameter{" "}
            {adminCatalog.find((x) => x.id === selectedType)?.title}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Satuan Pendidikan
              </label>
              <input
                type="text"
                value={formAdmin.namaSekolah}
                onChange={(e) =>
                  setFormAdmin({ ...formAdmin, namaSekolah: e.target.value })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Jenjang
                </label>
                <select
                  value={formAdmin.level}
                  onChange={(e) => {
                    const lvl = e.target.value as Level;
                    const kls = KELAS_BY_LEVEL[lvl]?.[0] || {
                      value: "1",
                      fase: "A",
                    };
                    setFormAdmin({
                      ...formAdmin,
                      level: lvl,
                      kelas: kls.value,
                      fase: kls.fase,
                      mataPelajaran: SUBJECTS[lvl]?.[0] || "",
                    });
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {(Object.keys(SUBJECTS) as Level[]).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Kelas & Fase
                </label>
                <select
                  value={formAdmin.kelas}
                  onChange={(e) => {
                    const found = KELAS_BY_LEVEL[formAdmin.level]?.find(
                      (k) => k.value === e.target.value
                    );
                    setFormAdmin({
                      ...formAdmin,
                      kelas: e.target.value,
                      fase: found ? found.fase : formAdmin.fase,
                    });
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {(KELAS_BY_LEVEL[formAdmin.level] || []).map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={formAdmin.mataPelajaran}
                onChange={(e) =>
                  setFormAdmin({ ...formAdmin, mataPelajaran: e.target.value })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Semester
                </label>
                <select
                  value={formAdmin.semester}
                  onChange={(e) =>
                    setFormAdmin({
                      ...formAdmin,
                      semester: e.target.value as any,
                    })
                  }
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  value={formAdmin.tahunPelajaran}
                  onChange={(e) =>
                    setFormAdmin({
                      ...formAdmin,
                      tahunPelajaran: e.target.value,
                    })
                  }
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Fokus Materi / Catatan Tambahan (Opsional)
              </label>
              <textarea
                value={formAdmin.catatanKhusus}
                onChange={(e) =>
                  setFormAdmin({ ...formAdmin, catatanKhusus: e.target.value })
                }
                rows={3}
                placeholder="Kosongkan untuk generate otomatis seluruh bab semester ini, atau tulis bab tertentu..."
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateAdmin}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Menyusun Dokumen Administrasi...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>GENERATE {selectedType.toUpperCase()} AI ✨</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-8">
          {currentDoc ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-2 print:hidden">
                <span className="text-xs font-extrabold text-emerald-700">
                  Dokumen {selectedType.toUpperCase()} Siap Cetak / Unduh
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1",
                      isEditing
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-100 text-amber-900"
                    )}
                  >
                    <Edit3 size={14} />
                    {isEditing ? "Selesai Edit" : "Edit Manual"}
                  </button>
                  <button
                    onClick={() =>
                      exportHtmlToWordDoc(
                        "printable-admin",
                        `${selectedType.toUpperCase()}_${formAdmin.mataPelajaran}_Kelas_${formAdmin.kelas}.doc`
                      )
                    }
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                  >
                    <FileText size={14} /> Word (.doc)
                  </button>
                  <button
                    onClick={() =>
                      exportElementToPDF(
                        "printable-admin",
                        `${selectedType.toUpperCase()}_${formAdmin.mataPelajaran}_Kelas_${formAdmin.kelas}.pdf`
                      )
                    }
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                  >
                    <Download size={14} /> PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                  >
                    <Printer size={14} /> Cetak
                  </button>
                </div>
              </div>

              <div
                id="printable-admin"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                className={cn(
                  "bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 text-slate-900 text-[10.5pt] leading-[1.45]",
                  isEditing && "ring-4 ring-amber-400/50"
                )}
              >
                <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
                  <h1 className="text-[14pt] font-black uppercase">
                    {currentDoc.judul}
                  </h1>
                  <h2 className="text-[12pt] font-bold uppercase mt-0.5">
                    {formAdmin.namaSekolah}
                  </h2>
                  <p className="text-xs mt-1">
                    Mata Pelajaran: <strong>{formAdmin.mataPelajaran}</strong>{" "}
                    &nbsp;|&nbsp; Kelas / Fase:{" "}
                    <strong>
                      {formAdmin.kelas} / Fase {formAdmin.fase}
                    </strong>{" "}
                    &nbsp;|&nbsp; Semester:{" "}
                    <strong>
                      {formAdmin.semester} ({formAdmin.tahunPelajaran})
                    </strong>
                  </p>
                </div>

                {/* RENDER ATP */}
                {selectedType === "atp" && (
                  <div className="space-y-4">
                    {currentDoc.capaianUmumFase && (
                      <div className="p-3 bg-slate-50 border border-slate-300">
                        <strong>Capaian Pembelajaran Umum Fase {formAdmin.fase}:</strong>{" "}
                        {currentDoc.capaianUmumFase}
                      </div>
                    )}
                    <table className="w-full border-collapse border border-black text-[9.5pt]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-black p-2 w-10">Kode</th>
                          <th className="border border-black p-2">Elemen</th>
                          <th className="border border-black p-2">Capaian Pembelajaran</th>
                          <th className="border border-black p-2">Tujuan Pembelajaran (TP)</th>
                          <th className="border border-black p-2">Materi Pokok</th>
                          <th className="border border-black p-2 w-16">JP</th>
                          <th className="border border-black p-2">Dimensi Profil Lulusan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDoc.barisATP?.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="border border-black p-2 text-center font-bold">
                              {r.no}
                            </td>
                            <td className="border border-black p-2 font-bold">
                              {r.elemen}
                            </td>
                            <td className="border border-black p-2">
                              {r.capaianPembelajaran}
                            </td>
                            <td className="border border-black p-2">
                              {r.tujuanPembelajaran}
                            </td>
                            <td className="border border-black p-2">
                              {r.materiPokok}
                            </td>
                            <td className="border border-black p-2 text-center">
                              {r.alokasiJP}
                            </td>
                            <td className="border border-black p-2">
                              {r.dimensiProfil}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* RENDER PROTA */}
                {selectedType === "prota" && (
                  <table className="w-full border-collapse border border-black text-[10pt]">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-2">Semester</th>
                        <th className="border border-black p-2">Unit / Bab</th>
                        <th className="border border-black p-2">Topik / Materi Pokok</th>
                        <th className="border border-black p-2">Tujuan Pembelajaran (TP)</th>
                        <th className="border border-black p-2 w-20">Alokasi JP</th>
                        <th className="border border-black p-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDoc.barisProta?.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center font-bold">
                            {r.semester}
                          </td>
                          <td className="border border-black p-2 font-bold">
                            {r.noUnit}
                          </td>
                          <td className="border border-black p-2">
                            {r.topikMateri}
                          </td>
                          <td className="border border-black p-2">
                            {r.tujuanPembelajaran}
                          </td>
                          <td className="border border-black p-2 text-center font-bold">
                            {r.alokasiJP}
                          </td>
                          <td className="border border-black p-2">
                            {r.keterangan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* RENDER PROMES */}
                {selectedType === "promes" && (
                  <table className="w-full border-collapse border border-black text-[10pt]">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-2 w-10">No</th>
                        <th className="border border-black p-2">Tujuan Pembelajaran (TP)</th>
                        <th className="border border-black p-2">Materi Pokok</th>
                        <th className="border border-black p-2 w-20">Alokasi JP</th>
                        <th className="border border-black p-2">Distribusi Bulan & Minggu Efektif</th>
                        <th className="border border-black p-2">Metode & Asesmen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDoc.barisPromes?.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center">
                            {r.no || i + 1}
                          </td>
                          <td className="border border-black p-2">
                            {r.kompDasarTP}
                          </td>
                          <td className="border border-black p-2 font-bold">
                            {r.materiPokok}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {r.alokasiJP}
                          </td>
                          <td className="border border-black p-2">
                            {r.bulanMinggu}
                          </td>
                          <td className="border border-black p-2">
                            {r.metodeAsesmen}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* RENDER DIAGNOSTIK */}
                {selectedType === "diagnostik" && (
                  <div className="space-y-5">
                    <p>
                      <strong>Tujuan Pemetaan:</strong>{" "}
                      {currentDoc.tujuanPemetaan}
                    </p>
                    <div>
                      <h4 className="font-bold underline mb-2">
                        A. Instrumen Diagnostik Non-Kognitif (Gaya Belajar, Minat & Psikososial)
                      </h4>
                      <table className="w-full border-collapse border border-black text-[10pt]">
                        <thead>
                          <tr className="bg-slate-200">
                            <th className="border border-black p-2 w-10">No</th>
                            <th className="border border-black p-2 w-1/4">Aspek</th>
                            <th className="border border-black p-2">Pertanyaan Pemantik Siswa</th>
                            <th className="border border-black p-2">Tindak Lanjut Diferensiasi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentDoc.pertanyaanNonKognitif?.map(
                            (q: any, i: number) => (
                              <tr key={i}>
                                <td className="border border-black p-2 text-center">
                                  {q.no || i + 1}
                                </td>
                                <td className="border border-black p-2 font-bold">
                                  {q.aspek}
                                </td>
                                <td className="border border-black p-2">
                                  {q.pertanyaan}
                                </td>
                                <td className="border border-black p-2">
                                  {q.tindakLanjutGuru}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="font-bold underline mb-2">
                        B. Instrumen Diagnostik Kognitif Awal (Kompetensi Prasyarat)
                      </h4>
                      <table className="w-full border-collapse border border-black text-[10pt]">
                        <thead>
                          <tr className="bg-slate-200">
                            <th className="border border-black p-2 w-10">No</th>
                            <th className="border border-black p-2">Kompetensi Prasyarat</th>
                            <th className="border border-black p-2">Pertanyaan / Soal Diagnostik</th>
                            <th className="border border-black p-2">Kunci Jawaban</th>
                            <th className="border border-black p-2">Intervensi / Scaffolding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentDoc.pertanyaanKognitif?.map(
                            (q: any, i: number) => (
                              <tr key={i}>
                                <td className="border border-black p-2 text-center">
                                  {q.no || i + 1}
                                </td>
                                <td className="border border-black p-2">
                                  {q.kompetensiPrasyarat}
                                </td>
                                <td className="border border-black p-2 font-bold">
                                  {q.soalSingkat}
                                </td>
                                <td className="border border-black p-2">
                                  {q.kunciJawaban}
                                </td>
                                <td className="border border-black p-2">
                                  {q.intervensiJikaSalah}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* RENDER JURNAL */}
                {selectedType === "jurnal" && (
                  <table className="w-full border-collapse border border-black text-[10pt]">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-2 w-14">Pert. Ke</th>
                        <th className="border border-black p-2">Topik / Materi</th>
                        <th className="border border-black p-2">Tujuan Pembelajaran</th>
                        <th className="border border-black p-2">Aktivitas Deep Learning</th>
                        <th className="border border-black p-2 w-24">Ketercapaian KKTP</th>
                        <th className="border border-black p-2">Refleksi & Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDoc.barisJurnal?.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center font-bold">
                            {r.pertemuanKe}
                          </td>
                          <td className="border border-black p-2 font-bold">
                            {r.topikMateri}
                          </td>
                          <td className="border border-black p-2">
                            {r.tujuanPembelajaran}
                          </td>
                          <td className="border border-black p-2">
                            {r.aktivitasDeepLearning}
                          </td>
                          <td className="border border-black p-2 text-center font-bold">
                            {r.ketercapaianKKTP}
                          </td>
                          <td className="border border-black p-2">
                            {r.refleksiTindakLanjut}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Tanda Tangan */}
                <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
                  <div className="space-y-16">
                    <p>
                      Mengetahui,
                      <br />
                      <strong>Kepala {formAdmin.namaSekolah}</strong>
                    </p>
                    <div>
                      <p className="font-black underline">
                        {formAdmin.namaKepalaSekolah ||
                          ".............................................."}
                      </p>
                      <p>
                        NIP.{" "}
                        {formAdmin.nipKepalaSekolah ||
                          "......................................"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-16">
                    <p>
                      {profile.kota || "Jakarta"},{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      <br />
                      <strong>Guru Mata Pelajaran</strong>
                    </p>
                    <div>
                      <p className="font-black underline">
                        {formAdmin.namaGuru ||
                          ".............................................."}
                      </p>
                      <p>
                        NIP.{" "}
                        {formAdmin.nipGuru ||
                          "......................................"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10 bg-white/80 rounded-3xl border-2 border-dashed border-emerald-200">
              <div className="bg-emerald-100 p-6 rounded-full mb-4">
                <ClipboardList className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Generator{" "}
                {adminCatalog.find((x) => x.id === selectedType)?.title}
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Pilih jenis administrasi guru di bagian atas (ATP, PROTA, PROMES, Asesmen Diagnostik, atau Jurnal Guru), lalu klik tombol{" "}
                <strong className="text-emerald-700">
                  Generate {selectedType.toUpperCase()} AI
                </strong>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
