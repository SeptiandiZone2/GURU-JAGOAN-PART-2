"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Target,
  Sparkles,
  Loader2,
  Edit3,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Level, TeacherProfile } from "@/types";
import {
  DIMENSI_PROFIL,
  KELAS_BY_LEVEL,
  TEMA_KOKURIKULER_P5,
} from "@/constants";
import { callGeminiJson } from "@/lib/geminiService";
import { exportElementToPDF, exportHtmlToWordDoc } from "@/lib/exportUtils";

interface Props {
  profile: TeacherProfile;
  onAlert: (msg: string) => void;
}

export default function ProyekModule({ profile, onAlert }: Props) {
  const [formProyek, setFormProyek] = useState({
    namaSekolah: profile.namaSekolah || "SD/SMP/SMA Indonesia",
    namaKoordinator: profile.namaGuru || "",
    namaKepalaSekolah: profile.namaKepalaSekolah || "",
    level: (profile.level || "SD") as Level,
    kelas: profile.kelas || "1",
    fase: profile.fase || "A",
    tema: TEMA_KOKURIKULER_P5[0],
    dimensiFokus: ["Penalaran Kritis", "Kreativitas", "Kolaborasi"],
    permasalahanLokal: "",
    alokasiTotalJP: "36 JP",
  });

  useEffect(() => {
    setFormProyek((prev) => ({
      ...prev,
      namaSekolah: profile.namaSekolah || prev.namaSekolah,
      namaKoordinator: profile.namaGuru || prev.namaKoordinator,
      namaKepalaSekolah: profile.namaKepalaSekolah || prev.namaKepalaSekolah,
      level: profile.level || prev.level,
      kelas: profile.kelas || prev.kelas,
      fase: profile.fase || prev.fase,
    }));
  }, [profile]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProyek, setGeneratedProyek] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const toggleDimensi = (item: string) => {
    setFormProyek((prev) => ({
      ...prev,
      dimensiFokus: prev.dimensiFokus.includes(item)
        ? prev.dimensiFokus.filter((i) => i !== item)
        : [...prev.dimensiFokus, item],
    }));
  };

  const handleGenerateProyek = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        Buatkan Modul Rancang Bangun Projek Kokurikuler Penguatan Profil Lulusan / P5 Kurikulum Nasional yang sangat detail dan siap pakai.
        Satuan Pendidikan: ${formProyek.namaSekolah} (${formProyek.level} Kelas ${formProyek.kelas} / Fase ${formProyek.fase})
        Tema Projek: ${formProyek.tema}
        Dimensi Profil Lulusan yang Disasar: ${formProyek.dimensiFokus.join(", ")}
        Alokasi Waktu: ${formProyek.alokasiTotalJP}
        Konteks / Permasalahan Lokal Sekolah: ${formProyek.permasalahanLokal || "Sesuaikan secara kontekstual dengan lingkungan sekolah di Indonesia"}

        Format output HARUS JSON murni dengan struktur persis berikut:
        {
          "judulProyek": "...",
          "deskripsiProyek": "...",
          "dimensiProfilPelajarPancasila": ["..."],
          "elemenDanSubelemen": [
            { "elemen": "...", "subelemen": "...", "targetPencapaianFase": "..." }
          ],
          "tahapanProyek": [
            {
              "namaTahap": "1. Tahap Pengenalan (Temukan & Kenali)",
              "aktivitas": [
                { "namaKegiatan": "...", "deskripsi": "...", "durasiJP": "..." }
              ]
            },
            {
              "namaTahap": "2. Tahap Kontekstualisasi (Selidiki & Kontekstualkan)",
              "aktivitas": [
                { "namaKegiatan": "...", "deskripsi": "...", "durasiJP": "..." }
              ]
            },
            {
              "namaTahap": "3. Tahap Aksi Nyata (Lakukan & Karya Bersama)",
              "aktivitas": [
                { "namaKegiatan": "...", "deskripsi": "...", "durasiJP": "..." }
              ]
            },
            {
              "namaTahap": "4. Tahap Refleksi & Tindak Lanjut (Bagikan & Evaluasi)",
              "aktivitas": [
                { "namaKegiatan": "...", "deskripsi": "...", "durasiJP": "..." }
              ]
            }
          ],
          "rubrikPenilaianSingkat": [
            {
              "aspek": "...",
              "mulaiBerkembang": "...",
              "sedangBerkembang": "...",
              "berkembangSesuaiHarapan": "...",
              "sangatBerkembang": "..."
            }
          ]
        }
      `;

      const parsed = await callGeminiJson(
        prompt,
        "Kamu adalah pakar Modul Kokurikuler & P5 Kurikulum Nasional. Kembalikan JSON murni."
      );
      setGeneratedProyek(parsed);
    } catch (e: any) {
      onAlert(e.message || "Gagal menyusun Modul Projek.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-orange-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-200">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Modul Projek Kokurikuler & P5 (8 Dimensi Profil Lulusan)
            </h2>
            <p className="text-xs font-semibold text-orange-600">
              7 Kebiasaan Anak Indonesia Hebat • Projek Lintas Disiplin • Rubrik MB-SB-BSH-SAB
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Input */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-orange-100 space-y-4 print:hidden h-fit">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Jenjang
              </label>
              <select
                value={formProyek.level}
                onChange={(e) => {
                  const lvl = e.target.value as Level;
                  const kls = KELAS_BY_LEVEL[lvl]?.[0] || {
                    value: "1",
                    fase: "A",
                  };
                  setFormProyek({
                    ...formProyek,
                    level: lvl,
                    kelas: kls.value,
                    fase: kls.fase,
                  });
                }}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white"
              >
                {(Object.keys(KELAS_BY_LEVEL) as Level[]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Kelas / Fase
              </label>
              <select
                value={formProyek.kelas}
                onChange={(e) => {
                  const found = KELAS_BY_LEVEL[formProyek.level]?.find(
                    (k) => k.value === e.target.value
                  );
                  setFormProyek({
                    ...formProyek,
                    kelas: e.target.value,
                    fase: found ? found.fase : formProyek.fase,
                  });
                }}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white"
              >
                {(KELAS_BY_LEVEL[formProyek.level] || []).map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              Pilih Tema Projek Kokurikuler / P5
            </label>
            <select
              value={formProyek.tema}
              onChange={(e) =>
                setFormProyek({ ...formProyek, tema: e.target.value })
              }
              className="w-full mt-1 p-3 rounded-xl border border-slate-200 font-bold text-xs bg-white"
            >
              {TEMA_KOKURIKULER_P5.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase mb-1.5 block">
              Dimensi Profil Lulusan yang Disasar
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DIMENSI_PROFIL.map((d) => (
                <label
                  key={d}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer",
                    formProyek.dimensiFokus.includes(d)
                      ? "border-orange-500 bg-orange-50 text-orange-950"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formProyek.dimensiFokus.includes(d)}
                    onChange={() => toggleDimensi(d)}
                    className="w-3.5 h-3.5 accent-orange-600 rounded"
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              Permasalahan Lokal / Konteks Sekolah (Opsional)
            </label>
            <textarea
              value={formProyek.permasalahanLokal}
              onChange={(e) =>
                setFormProyek({
                  ...formProyek,
                  permasalahanLokal: e.target.value,
                })
              }
              rows={3}
              placeholder="Contoh: Pengelolaan sampah plastik di kantin sekolah atau pelestarian kuliner tradisional daerah..."
              className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateProyek}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Merancang Modul Projek Kokurikuler...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>RANCANG MODUL PROJEK AI ✨</span>
              </>
            )}
          </button>
        </div>

        {/* Result Preview */}
        <div className="lg:col-span-7">
          {generatedProyek ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-sm flex flex-wrap items-center justify-between gap-2 print:hidden">
                <span className="text-xs font-extrabold text-orange-700">
                  Modul Projek Siap Digunakan
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
                        "printable-proyek",
                        `Modul_Projek_${formProyek.tema}.doc`
                      )
                    }
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                  >
                    <FileText size={14} /> Word (.doc)
                  </button>
                  <button
                    onClick={() =>
                      exportElementToPDF(
                        "printable-proyek",
                        `Modul_Projek_${formProyek.tema}.pdf`
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
                id="printable-proyek"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                className={cn(
                  "bg-white p-8 rounded-3xl shadow-xl border border-orange-100 text-slate-900 text-[11pt] leading-[1.5]",
                  isEditing && "ring-4 ring-amber-400/50"
                )}
              >
                <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
                  <h1 className="text-[14pt] font-black uppercase">
                    MODUL PROJEK KOKURIKULER PENGUATAN PROFIL LULUSAN (P5)
                  </h1>
                  <h2 className="text-[12.5pt] font-bold text-orange-700 mt-1">
                    {generatedProyek.judulProyek}
                  </h2>
                  <p className="text-xs font-semibold mt-1">
                    {formProyek.namaSekolah} • {formProyek.level} Kelas{" "}
                    {formProyek.kelas} (Fase {formProyek.fase}) • Alokasi:{" "}
                    {formProyek.alokasiTotalJP}
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase mb-2">
                      A. DESKRIPSI & RELEVANSI PROJEK
                    </h3>
                    <p className="text-justify">
                      {generatedProyek.deskripsiProyek}
                    </p>
                  </div>

                  <div>
                    <h3 className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase mb-2">
                      B. DIMENSI, ELEMEN & SUB-ELEMEN PROFIL LULUSAN
                    </h3>
                    <p className="font-bold mb-2 flex items-center gap-1.5 text-orange-900">
                      <Target size={16} /> Dimensi Fokus:{" "}
                      {generatedProyek.dimensiProfilPelajarPancasila?.join(", ")}
                    </p>
                    <table className="w-full border-collapse border border-slate-400 text-[10pt]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-400 p-2">Elemen</th>
                          <th className="border border-slate-400 p-2">Sub-elemen</th>
                          <th className="border border-slate-400 p-2">
                            Target Pencapaian di Akhir Fase {formProyek.fase}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedProyek.elemenDanSubelemen?.map(
                          (es: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border border-slate-400 p-2 font-bold">
                                {es.elemen}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {es.subelemen}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {es.targetPencapaianFase}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase mb-2">
                      C. ALUR TAHAPAN KEGIATAN PROJEK
                    </h3>
                    <div className="space-y-3">
                      {generatedProyek.tahapanProyek?.map(
                        (tahap: any, idx: number) => (
                          <div
                            key={idx}
                            className="border border-slate-300 rounded-xl overflow-hidden break-inside-avoid"
                          >
                            <div className="bg-orange-50 px-3 py-2 font-bold border-b border-slate-300 text-orange-950">
                              {tahap.namaTahap}
                            </div>
                            <div className="p-3 space-y-2">
                              {tahap.aktivitas?.map((akt: any, i: number) => (
                                <div key={i} className="pl-3 border-l-2 border-orange-400">
                                  <p className="font-bold">
                                    {akt.namaKegiatan}{" "}
                                    <span className="text-orange-700 font-semibold">
                                      ({akt.durasiJP})
                                    </span>
                                  </p>
                                  <p className="text-xs text-slate-700">
                                    {akt.deskripsi}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="break-inside-avoid">
                    <h3 className="bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase mb-2">
                      D. RUBRIK PENILAIAN KETERCAPAIAN PROJEK
                    </h3>
                    <table className="w-full border-collapse border border-slate-400 text-[9.5pt]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-400 p-2">Aspek</th>
                          <th className="border border-slate-400 p-2">
                            Mulai Berkembang (MB)
                          </th>
                          <th className="border border-slate-400 p-2">
                            Sedang Berkembang (SB)
                          </th>
                          <th className="border border-slate-400 p-2">
                            Berkembang Sesuai Harapan (BSH)
                          </th>
                          <th className="border border-slate-400 p-2">
                            Sangat Berkembang (SAB)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedProyek.rubrikPenilaianSingkat?.map(
                          (r: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border border-slate-400 p-2 font-bold">
                                {r.aspek}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {r.mulaiBerkembang || "-"}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {r.sedangBerkembang || "-"}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {r.berkembangSesuaiHarapan || "-"}
                              </td>
                              <td className="border border-slate-400 p-2">
                                {r.sangatBerkembang || "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10 bg-white/80 rounded-3xl border-2 border-dashed border-orange-200">
              <div className="bg-orange-100 p-6 rounded-full mb-4">
                <Lightbulb className="w-12 h-12 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Rancang Modul Projek Kokurikuler & P5 Kontekstual
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Pilih tema projek dan dimensi profil lulusan di sebelah kiri, lalu klik{" "}
                <strong className="text-orange-600">Rancang Modul Projek AI</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
