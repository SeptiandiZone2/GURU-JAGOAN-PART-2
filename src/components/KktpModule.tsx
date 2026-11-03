"use client";

import React, { useState, useEffect } from "react";
import {
  School,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileDown,
  Printer,
  Sparkles,
  Edit3,
} from "lucide-react";
import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { KKTPResult, TeacherProfile } from "@/types";
import { callGeminiJson } from "@/lib/geminiService";
import { exportElementToPDF, exportHtmlToWordDoc } from "@/lib/exportUtils";

interface Props {
  profile: TeacherProfile;
  onAlert: (msg: string) => void;
}

export default function KktpModule({ profile, onAlert }: Props) {
  const [metadata, setMetadata] = useState({
    schoolName: profile.namaSekolah || "SMP NEGERI 1 INDONESIA",
    teacherName: profile.namaGuru || "",
    nipGuru: profile.nipGuru || "",
    headmasterName: profile.namaKepalaSekolah || "",
    nipKepalaSekolah: profile.nipKepalaSekolah || "",
    academicYear: profile.tahunPelajaran || "2026/2027",
    phase: `Fase ${profile.fase || "D"}`,
    semester: profile.semester || "Ganjil",
    classLevel: profile.kelas || "7",
    mataPelajaran: profile.mataPelajaran || "Bahasa Indonesia",
    jpPerYear: "108 JP",
    topikManual: "",
  });

  useEffect(() => {
    setMetadata((prev) => ({
      ...prev,
      schoolName: profile.namaSekolah || prev.schoolName,
      teacherName: profile.namaGuru || prev.teacherName,
      nipGuru: profile.nipGuru || prev.nipGuru,
      headmasterName: profile.namaKepalaSekolah || prev.headmasterName,
      nipKepalaSekolah: profile.nipKepalaSekolah || prev.nipKepalaSekolah,
      academicYear: profile.tahunPelajaran || prev.academicYear,
      phase: profile.fase ? `Fase ${profile.fase}` : prev.phase,
      semester: profile.semester || prev.semester,
      classLevel: profile.kelas || prev.classLevel,
      mataPelajaran: profile.mataPelajaran || prev.mataPelajaran,
    }));
  }, [profile]);

  const [inputMode, setInputMode] = useState<"manual" | "upload">("manual");
  const [files, setFiles] = useState<{ cp?: File; atp?: File }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<KKTPResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (
      file.name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer });
      return res.value;
    }
    // For txt or general text-readable files
    const text = await file.text();
    return text.substring(0, 8000);
  };

  const analyzeWithAI = async () => {
    if (inputMode === "upload" && !files.atp && !files.cp) {
      onAlert(
        "Silakan unggah minimal dokumen ATP atau CP terlebih dahulu, atau gunakan Mode Input Cepat AI."
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      let cpText = "Gunakan standar Capaian Pembelajaran Kurikulum Nasional terbaru.";
      let atpText = metadata.topikManual || `Susun Tujuan Pembelajaran utama mata pelajaran ${metadata.mataPelajaran} Kelas ${metadata.classLevel} (${metadata.phase}) Semester ${metadata.semester}.`;

      if (inputMode === "upload") {
        if (files.cp) cpText = await extractTextFromFile(files.cp);
        if (files.atp) atpText = await extractTextFromFile(files.atp);
      }

      const prompt = `
        Analisis Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) / Topik berdasarkan Kurikulum Nasional terbaru untuk membuat Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) yang profesional dan terukur.
        
        Metadata:
        Sekolah: ${metadata.schoolName}
        Mata Pelajaran: ${metadata.mataPelajaran}
        Guru: ${metadata.teacherName}
        Fase / Kelas: ${metadata.phase} / Kelas ${metadata.classLevel}
        Semester: ${metadata.semester}
        JP per Tahun: ${metadata.jpPerYear}
        
        Referensi CP:
        ${cpText.substring(0, 4500)}
        
        Referensi ATP / Materi Pokok:
        ${atpText.substring(0, 4500)}
        
        Instruksi:
        1. Susun 4 sampai 5 Tujuan Pembelajaran (TP) utama yang sistematis dan operasional.
        2. Untuk setiap TP, buatlah kriteria ketercapaian (KKTP) yang spesifik sesuai standar Kurikulum Nasional.
        3. Gunakan pendekatan Taksonomi SOLO (Uni-structural, Multi-structural, Relational, Extended Abstract).
        4. Integrasikan prinsip Pembelajaran Mendalam (Memahami, Mengaplikasi, Merefleksi).
        5. Berikan indikator ketercapaian yang terukur serta deskripsi 4 interval nilai (Perlu Bimbingan 0-40%, Cukup 41-65%, Baik 66-85%, Sangat Baik 86-100%).
        
        Format output HARUS JSON murni sesuai skema berikut:
        {
          "learningObjectives": [
            {
              "objective": "string",
              "criteria": ["string"],
              "soloLevel": "string (misal: Relational / Multi-structural)",
              "deepLearningAspect": "string (misal: Memahami & Mengaplikasi)",
              "indicators": ["string"],
              "intervalDeskripsi": {
                "perluBimbingan": "string (0-40%)",
                "cukup": "string (41-65%)",
                "baik": "string (66-85%)",
                "sangatBaik": "string (86-100%)"
              }
            }
          ],
          "summary": "string (Kesimpulan strategis & rekomendasi tindak lanjut asesmen)"
        }
      `;

      const parsed = await callGeminiJson<KKTPResult>(
        prompt,
        "Kamu adalah pakar Asesmen Kurikulum Nasional & Taksonomi SOLO. Kembalikan HANYA JSON murni yang valid."
      );
      setResult(parsed);
    } catch (err: any) {
      onAlert(
        "Terjadi kesalahan saat menganalisis KKTP: " +
          (err.message || "Coba lagi.")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToDocx = async () => {
    if (!result) return;
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `${metadata.schoolName} - Tahun Pelajaran ${metadata.academicYear}`,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph("Mata Pelajaran")],
                      }),
                      new TableCell({
                        children: [new Paragraph(metadata.mataPelajaran)],
                      }),
                      new TableCell({
                        children: [new Paragraph("Fase / Kelas")],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            `${metadata.phase} / Kelas ${metadata.classLevel}`
                          ),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph("Guru Pengampu")],
                      }),
                      new TableCell({
                        children: [new Paragraph(metadata.teacherName || "-")],
                      }),
                      new TableCell({ children: [new Paragraph("Semester")] }),
                      new TableCell({
                        children: [new Paragraph(metadata.semester)],
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ text: "" }),
              ...result.learningObjectives.flatMap((tp, idx) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Tujuan Pembelajaran ${idx + 1}: `,
                      bold: true,
                    }),
                    new TextRun(tp.objective),
                  ],
                  spacing: { before: 300 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Level Taksonomi SOLO: ${tp.soloLevel} | Fokus Deep Learning: ${tp.deepLearningAspect}`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Kriteria Ketercapaian:", bold: true }),
                  ],
                }),
                ...tp.criteria.map(
                  (c) => new Paragraph({ text: `• ${c}`, indent: { left: 400 } })
                ),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Indikator Asesmen:", bold: true }),
                  ],
                }),
                ...tp.indicators.map(
                  (ind) =>
                    new Paragraph({ text: `- ${ind}`, indent: { left: 400 } })
                ),
              ]),
              new Paragraph({ text: "" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Kesimpulan Strategis: ", bold: true }),
                  new TextRun({ text: result.summary, italics: true }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `KKTP_${metadata.mataPelajaran}_Kelas_${metadata.classLevel}.docx`
      );
    } catch (err) {
      console.error(err);
      onAlert("Gagal mengekspor ke Word (.docx).");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-amber-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-200">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Generator KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
            </h2>
            <p className="text-xs font-semibold text-amber-700">
              Berbasis Taksonomi SOLO • Deep Learning (Memahami, Mengaplikasi, Merefleksi) • Skala Interval Rapor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> SOLO Taxonomy
          </span>
          <span className="px-3 py-1.5 bg-orange-50 text-orange-800 rounded-full border border-orange-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Deep Learning
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Upload */}
        <div className="lg:col-span-4 space-y-5 print:hidden">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-amber-600" />
              Identitas & Mata Pelajaran
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nama Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={metadata.schoolName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  name="mataPelajaran"
                  value={metadata.mataPelajaran}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nama Guru
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={metadata.teacherName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    name="headmasterName"
                    value={metadata.headmasterName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Fase
                  </label>
                  <select
                    name="phase"
                    value={metadata.phase}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {[
                      "Fase Fondasi",
                      "Fase A",
                      "Fase B",
                      "Fase C",
                      "Fase D",
                      "Fase E",
                      "Fase F",
                    ].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    name="classLevel"
                    value={metadata.classLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={metadata.semester}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    name="academicYear"
                    value={metadata.academicYear}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    JP per Tahun
                  </label>
                  <input
                    type="text"
                    name="jpPerYear"
                    value={metadata.jpPerYear}
                    onChange={handleInputChange}
                    placeholder="Contoh: 108 JP"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sumber Data CP / ATP */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Sumber CP / ATP
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    inputMode === "manual"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-slate-500"
                  )}
                >
                  Ketik / AI Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    inputMode === "upload"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-slate-500"
                  )}
                >
                  Upload File
                </button>
              </div>
            </div>

            {inputMode === "manual" ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">
                  Topik / Materi Pokok / Ringkasan ATP (Opsional)
                </label>
                <textarea
                  name="topikManual"
                  value={metadata.topikManual}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Ketik topik/TP yang ingin dibuatkan KKTP-nya, atau biarkan kosong agar AI menyusun seluruh TP & KKTP semester ini secara otomatis..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={(e) =>
                      setFiles((prev) => ({ ...prev, cp: e.target.files?.[0] }))
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-4 text-center transition-all",
                      files.cp
                        ? "border-amber-400 bg-amber-50/50"
                        : "border-slate-200 hover:border-amber-400"
                    )}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-xs font-bold text-slate-700">
                      {files.cp ? files.cp.name : "Upload Dokumen CP (Opsional)"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Format .DOCX atau .TXT
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={(e) =>
                      setFiles((prev) => ({
                        ...prev,
                        atp: e.target.files?.[0],
                      }))
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-4 text-center transition-all",
                      files.atp
                        ? "border-amber-400 bg-amber-50/50"
                        : "border-slate-200 hover:border-amber-400"
                    )}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-xs font-bold text-slate-700">
                      {files.atp ? files.atp.name : "Upload Dokumen ATP"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Format .DOCX atau .TXT
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Menganalisis Taksonomi SOLO & KKTP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>GENERATE KKTP KURIKULUM NASIONAL ✨</span>
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {result ? (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
                <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Dokumen KKTP Siap Cetak / Unduh
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5",
                      isEditing
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-100 text-amber-900"
                    )}
                  >
                    <Edit3 size={14} />
                    {isEditing ? "Selesai Edit" : "Edit Manual"}
                  </button>
                  <button
                    onClick={exportToDocx}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  >
                    <FileText className="w-4 h-4" /> Word (.docx)
                  </button>
                  <button
                    onClick={() =>
                      exportHtmlToWordDoc(
                        "kktp-result-content",
                        `KKTP_${metadata.mataPelajaran}_Kelas_${metadata.classLevel}.doc`
                      )
                    }
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  >
                    <FileText className="w-4 h-4" /> Word (.doc)
                  </button>
                  <button
                    onClick={() =>
                      exportElementToPDF(
                        "kktp-result-content",
                        `KKTP_${metadata.mataPelajaran}_Kelas_${metadata.classLevel}.pdf`
                      )
                    }
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  >
                    <FileDown className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak
                  </button>
                </div>
              </div>

              {/* Printable Sheet */}
              <div
                id="kktp-result-content"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                className={cn(
                  "bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-amber-100 text-slate-900",
                  isEditing && "ring-4 ring-amber-400/50"
                )}
              >
                <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
                  </h2>
                  <p className="text-xs font-extrabold text-amber-700 uppercase tracking-widest mt-0.5">
                    BERBASIS TAKSONOMI SOLO & PEMBELAJARAN MENDALAM (DEEP LEARNING)
                  </p>
                  <p className="text-sm font-bold mt-1 text-slate-800">
                    {metadata.schoolName} • Tahun Pelajaran {metadata.academicYear}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/70 mb-6 text-xs">
                  <div>
                    <p className="font-bold text-amber-800 uppercase">
                      Mata Pelajaran
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {metadata.mataPelajaran}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 uppercase">
                      Guru Pengampu
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {metadata.teacherName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 uppercase">
                      Fase / Kelas
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {metadata.phase} / Kelas {metadata.classLevel}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 uppercase">
                      Semester / JP
                    </p>
                    <p className="font-extrabold text-slate-900">
                      {metadata.semester} ({metadata.jpPerYear})
                    </p>
                  </div>
                </div>

                {/* Daftar TP & KKTP */}
                <div className="space-y-6">
                  {result.learningObjectives.map((tp, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-300 rounded-2xl overflow-hidden break-inside-avoid"
                    >
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-black text-xs uppercase tracking-wider">
                          TUJUAN PEMBELAJARAN (TP {idx + 1})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            SOLO: {tp.soloLevel}
                          </span>
                          <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            {tp.deepLearningAspect}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <p className="font-bold text-sm text-slate-900">
                          {tp.objective}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="font-black text-slate-700 uppercase mb-2">
                              Kriteria Ketercapaian (KKTP):
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {tp.criteria.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
                            <p className="font-black text-amber-900 uppercase mb-2">
                              Indikator Asesmen & Bukti Belajar:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {tp.indicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {tp.intervalDeskripsi && (
                          <table className="w-full text-[10pt] border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-1.5 w-1/4">
                                  Perlu Bimbingan (0 - 40%)
                                </th>
                                <th className="border border-slate-300 p-1.5 w-1/4">
                                  Cukup (41 - 65%)
                                </th>
                                <th className="border border-slate-300 p-1.5 w-1/4">
                                  Baik (66 - 85%)
                                </th>
                                <th className="border border-slate-300 p-1.5 w-1/4">
                                  Sangat Baik (86 - 100%)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-300 p-2">
                                  {tp.intervalDeskripsi.perluBimbingan}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {tp.intervalDeskripsi.cukup}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {tp.intervalDeskripsi.baik}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {tp.intervalDeskripsi.sangatBaik}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kesimpulan Strategis */}
                <div className="mt-6 p-4 bg-slate-100 border-l-4 border-amber-600 rounded-r-xl text-xs">
                  <p className="font-black uppercase text-amber-900 mb-1">
                    Kesimpulan & Tindak Lanjut Interval KKTP:
                  </p>
                  <p className="italic text-slate-700">{result.summary}</p>
                </div>

                {/* Tanda Tangan */}
                <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
                  <div className="space-y-16">
                    <p>
                      Mengetahui,
                      <br />
                      <strong>Kepala {metadata.schoolName}</strong>
                    </p>
                    <div>
                      <p className="font-black underline">
                        {metadata.headmasterName ||
                          ".............................................."}
                      </p>
                      <p>
                        NIP.{" "}
                        {metadata.nipKepalaSekolah ||
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
                        {metadata.teacherName ||
                          ".............................................."}
                      </p>
                      <p>
                        NIP.{" "}
                        {metadata.nipGuru ||
                          "......................................"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10 bg-white/80 rounded-3xl border-2 border-dashed border-amber-200">
              <div className="bg-amber-100 p-6 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Siap Menyusun KKTP Berbasis Taksonomi SOLO & Deep Learning
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Anda dapat langsung menekan tombol{" "}
                <strong className="text-amber-700">
                  Generate KKTP Kurikulum Nasional
                </strong>{" "}
                (tanpa harus upload file) atau mengunggah dokumen CP/ATP (.docx) Anda di panel kiri.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
