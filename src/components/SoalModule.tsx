"use client";

import React, { useState, useEffect } from "react";
import {
  Wand2,
  Trash2,
  Plus,
  Sparkles,
  Settings,
  Image as ImageIcon,
  Edit3,
  FileText,
  Download,
  Printer,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BlokSoal,
  KisiItem,
  KunciItem,
  Level,
  SoalItem,
  TeacherProfile,
} from "@/types";
import { KELAS_BY_LEVEL, SUBJECTS } from "@/constants";
import { callGeminiAI, callGeminiJson } from "@/lib/geminiService";
import { exportElementToPDF, exportHtmlToWordDoc } from "@/lib/exportUtils";

interface Props {
  profile: TeacherProfile;
  onAlert: (msg: string) => void;
}

export default function SoalModule({ profile, onAlert }: Props) {
  const [formData, setFormData] = useState({
    namaGuru: profile.namaGuru,
    nipGuru: profile.nipGuru,
    namaSekolah: profile.namaSekolah,
    namaKepalaSekolah: profile.namaKepalaSekolah,
    nipKepalaSekolah: profile.nipKepalaSekolah,
    level: (profile.level || "SD") as Level,
    kelas: profile.kelas || "1",
    fase: profile.fase || "A",
    mapel: profile.mataPelajaran || "Bahasa Indonesia",
    tahunPelajaran: profile.tahunPelajaran || "2026/2027",
    jenisUjian: " Penilaian Sumatif / Asesmen Harian",
    materi: "",
    blokSoal: [
      {
        id: 1,
        jenis: "Pilihan Ganda",
        jumlah: 5,
        opsiPG: 4,
        kesulitan: "Sedang",
        kognitif: "C3 (Mengaplikasikan)",
      },
      {
        id: 2,
        jenis: "Esai",
        jumlah: 2,
        opsiPG: 4,
        kesulitan: "Sulit (HOTS)",
        kognitif: "C4 (Menganalisis)",
      },
    ] as BlokSoal[],
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      namaGuru: profile.namaGuru || prev.namaGuru,
      nipGuru: profile.nipGuru || prev.nipGuru,
      namaSekolah: profile.namaSekolah || prev.namaSekolah,
      namaKepalaSekolah: profile.namaKepalaSekolah || prev.namaKepalaSekolah,
      nipKepalaSekolah: profile.nipKepalaSekolah || prev.nipKepalaSekolah,
      level: profile.level || prev.level,
      kelas: profile.kelas || prev.kelas,
      fase: profile.fase || prev.fase,
      mapel: profile.mataPelajaran || prev.mapel,
      tahunPelajaran: profile.tahunPelajaran || prev.tahunPelajaran,
    }));
  }, [profile]);

  const [viewMode, setViewMode] = useState<"form" | "result">("form");
  const [activeTab, setActiveTab] = useState<
    "soal" | "kunci" | "kisi" | "kartu"
  >("soal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingMateri, setIsSuggestingMateri] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [regeneratingNo, setRegeneratingNo] = useState<number | null>(null);
  const [loadingImageNo, setLoadingImageNo] = useState<number | null>(null);

  const [generatedData, setGeneratedData] = useState<{
    soal: SoalItem[];
    kisi: KisiItem[];
    kunci: KunciItem[];
  } | null>(null);

  const updateBlokSoal = (id: number, field: keyof BlokSoal, value: any) => {
    setFormData((prev) => ({
      ...prev,
      blokSoal: prev.blokSoal.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    }));
  };

  const addBlokSoal = () => {
    setFormData((prev) => ({
      ...prev,
      blokSoal: [
        ...prev.blokSoal,
        {
          id: Date.now(),
          jenis: "Pilihan Ganda",
          jumlah: 5,
          opsiPG: 4,
          kesulitan: "Sedang",
          kognitif: "C3 (Mengaplikasikan)",
        },
      ],
    }));
  };

  const removeBlokSoal = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      blokSoal: prev.blokSoal.filter((b) => b.id !== id),
    }));
  };

  const generateSaranMateri = async () => {
    setIsSuggestingMateri(true);
    try {
      const prompt = !formData.materi.trim()
        ? `Berikan 1 saran topik materi pelajaran utama beserta ringkasan poin-poin materinya (maksimal 1 paragraf) untuk siswa ${formData.level} Kelas ${formData.kelas} mata pelajaran ${formData.mapel}.`
        : `Kembangkan materi "${formData.materi}" menjadi ringkasan ruang lingkup materi ujian & indikator kompetensi untuk ${formData.level} Kelas ${formData.kelas} mata pelajaran ${formData.mapel} (maksimal 1 paragraf padat).`;
      const res = await callGeminiAI(
        prompt,
        "Kamu adalah guru ahli Kurikulum Nasional. Jawab langsung isi materinya tanpa kalimat pengantar."
      );
      setFormData((prev) => ({ ...prev, materi: res.trim() }));
    } catch (e: any) {
      onAlert(e.message);
    } finally {
      setIsSuggestingMateri(false);
    }
  };

  const handleGenerateSoal = async () => {
    const validBlocks = formData.blokSoal.filter((b) => Number(b.jumlah) > 0);
    const totalSoal = validBlocks.reduce((a, b) => a + Number(b.jumlah), 0);
    if (totalSoal === 0) {
      onAlert("Jumlah soal minimal 1. Silakan isi jumlah soal.");
      return;
    }

    setIsGenerating(true);
    try {
      let promptRincian = "";
      let currentNo = 1;
      validBlocks.forEach((blok) => {
        const endNo = currentNo + Number(blok.jumlah) - 1;
        promptRincian += `- Soal No ${currentNo} s/d ${endNo} (${blok.jumlah} soal): Jenis [${blok.jenis}], Tingkat Kesulitan [${blok.kesulitan}], Dimensi Kognitif [${blok.kognitif}]\n`;
        if (
          blok.jenis === "Pilihan Ganda" ||
          blok.jenis === "Pilihan Ganda Kompleks"
        ) {
          promptRincian += `  -> WAJIB punya persis ${blok.opsiPG} opsi jawaban dalam array "opsi" (tanpa huruf A/B/C di depannya).\n`;
        } else if (blok.jenis === "Mencocokkan") {
          promptRincian += `  -> WAJIB isi "opsi" dalam array dengan TEPAT 1 pasangan jawaban yang benar.\n`;
        } else {
          promptRincian += `  -> Kosongkan array "opsi" ([]).\n`;
        }
        currentNo = endNo + 1;
      });

      const prompt = `
        BUATKAN TEPAT ${totalSoal} SOAL EVALUASI PENDIDIKAN BERKUALITAS TINGGI (HOTS & KONTEKSTUAL).
        Konteks: Mata Pelajaran ${formData.mapel}, Jenjang ${formData.level} Kelas ${formData.kelas} (Fase ${formData.fase}).
        Materi / Topik: ${formData.materi || `Materi Esensial ${formData.mapel} Kelas ${formData.kelas}`}.
        Rincian Struktur Soal:
        ${promptRincian}

        Format output HARUS JSON murni dengan struktur persis berikut:
        {
          "soal": [
            { "no": 1, "jenis": "Pilihan Ganda", "pertanyaan": "...", "opsi": ["...", "...", "...", "..."] }
          ],
          "kisi": [
            { "no": 1, "cp": "...", "materi": "...", "indikator": "Disajikan ..., peserta didik dapat ...", "kognitif": "...", "bentuk": "..." }
          ],
          "kunci": [
            { "no": 1, "jenis": "Pilihan Ganda", "jawaban": "A", "penjelasan": "Pembahasan lengkap mengapa jawaban tersebut benar...", "skor": 10 }
          ]
        }
      `;

      const parsed = await callGeminiJson(
        prompt,
        "Hitung jumlah soal dengan sangat teliti. Pastikan nomor soal berurutan dari 1 sampai selesai dan kembalikan JSON murni."
      );
      setGeneratedData({
        soal: parsed.soal || [],
        kisi: parsed.kisi || [],
        kunci: parsed.kunci || [],
      });
      setViewMode("result");
      setActiveTab("soal");
    } catch (e: any) {
      onAlert(e.message || "Gagal meracik soal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSingleSoal = async (s: SoalItem) => {
    setRegeneratingNo(s.no);
    try {
      const prompt = `Buatkan 1 soal baru pengganti untuk nomor ${s.no}, Mata Pelajaran ${formData.mapel} Kelas ${formData.kelas}, Materi: "${formData.materi || formData.mapel}", Jenis: "${s.jenis}". Kembalikan JSON murni: { "pertanyaan": "...", "opsi": ["..."], "jawaban": "...", "penjelasan": "..." }`;
      const parsed = await callGeminiJson(prompt);
      setGeneratedData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          soal: prev.soal.map((x) =>
            x.no === s.no
              ? {
                  ...x,
                  pertanyaan: parsed.pertanyaan || x.pertanyaan,
                  opsi: parsed.opsi || x.opsi,
                }
              : x
          ),
          kunci: prev.kunci.map((k) =>
            k.no === s.no
              ? {
                  ...k,
                  jawaban: parsed.jawaban || k.jawaban,
                  penjelasan: parsed.penjelasan || k.penjelasan,
                }
              : k
          ),
        };
      });
    } catch (e: any) {
      onAlert(e.message || "Gagal mengganti soal.");
    } finally {
      setRegeneratingNo(null);
    }
  };

  const handleAutoImage = async (no: number, pertanyaan: string) => {
    setLoadingImageNo(no);
    try {
      const keyword = await callGeminiAI(
        `Berikan 2-3 kata kunci bahasa Inggris untuk ilustrasi pendidikan dari soal ini: "${pertanyaan}". Hanya kata kunci saja.`,
        "Return plain English keywords only."
      );
      const cleanKeyword = keyword.replace(/['"\n]/g, "").trim();
      const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        cleanKeyword + " educational illustration clean vector"
      )}?width=420&height=220&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
      setGeneratedData((prev) =>
        prev
          ? {
              ...prev,
              soal: prev.soal.map((s) =>
                s.no === no ? { ...s, image: newUrl } : s
              ),
            }
          : prev
      );
    } catch (e: any) {
      onAlert(e.message || "Gagal membuat gambar ilustrasi.");
    } finally {
      setLoadingImageNo(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-indigo-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Wand2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Racik Soal & Asesmen HOTS AI
            </h2>
            <p className="text-xs font-semibold text-indigo-600">
              Naskah Soal • Kunci & Pembahasan • Kisi-Kisi • Kartu Soal Supervisi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewMode("form")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-extrabold transition-all",
              viewMode === "form"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            1. Pengaturan Soal
          </button>
          <button
            onClick={() => setViewMode("result")}
            disabled={!generatedData}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-extrabold transition-all disabled:opacity-40",
              viewMode === "result"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            2. Hasil Naskah, Kisi & Kartu Soal
          </button>
        </div>
      </div>

      {viewMode === "form" ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-indigo-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Nama Sekolah / Madrasah
              </label>
              <input
                type="text"
                value={formData.namaSekolah}
                onChange={(e) =>
                  setFormData({ ...formData, namaSekolah: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Nama Guru
              </label>
              <input
                type="text"
                value={formData.namaGuru}
                onChange={(e) =>
                  setFormData({ ...formData, namaGuru: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Judul / Jenis Asesmen
              </label>
              <input
                type="text"
                value={formData.jenisUjian}
                onChange={(e) =>
                  setFormData({ ...formData, jenisUjian: e.target.value })
                }
                placeholder="Contoh: Sumatif Tengah Semester (STS)"
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Jenjang Pendidikan
              </label>
              <select
                value={formData.level}
                onChange={(e) => {
                  const lvl = e.target.value as Level;
                  const kls = KELAS_BY_LEVEL[lvl]?.[0] || {
                    value: "1",
                    fase: "A",
                  };
                  setFormData({
                    ...formData,
                    level: lvl,
                    kelas: kls.value,
                    fase: kls.fase,
                    mapel: SUBJECTS[lvl]?.[0] || "",
                  });
                }}
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              >
                {(Object.keys(SUBJECTS) as Level[]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Kelas & Fase
              </label>
              <select
                value={formData.kelas}
                onChange={(e) => {
                  const found = KELAS_BY_LEVEL[formData.level]?.find(
                    (k) => k.value === e.target.value
                  );
                  setFormData({
                    ...formData,
                    kelas: e.target.value,
                    fase: found ? found.fase : formData.fase,
                  });
                }}
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              >
                {(KELAS_BY_LEVEL[formData.level] || []).map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Mata Pelajaran
              </label>
              <input
                type="text"
                list="mapel-list-soal"
                value={formData.mapel}
                onChange={(e) =>
                  setFormData({ ...formData, mapel: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-bold"
              />
              <datalist id="mapel-list-soal">
                {(SUBJECTS[formData.level] || []).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Materi / CP Dasar */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Materi Pokok / Ruang Lingkup CP yang Diujikan
              </label>
              <button
                type="button"
                onClick={generateSaranMateri}
                disabled={isSuggestingMateri}
                className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm"
              >
                <Sparkles size={13} />
                {isSuggestingMateri ? "Meracik..." : "Kembangkan Materi AI ✨"}
              </button>
            </div>
            <textarea
              value={formData.materi}
              onChange={(e) =>
                setFormData({ ...formData, materi: e.target.value })
              }
              rows={3}
              placeholder="Ketik topik/materi soal atau klik 'Kembangkan Materi AI ✨'..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-200 text-sm font-medium"
            />
          </div>

          {/* Blok Struktur Evaluasi */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase">
                Struktur Komposisi Soal:
              </h3>
              <button
                type="button"
                onClick={addBlokSoal}
                className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl"
              >
                <Plus size={14} /> Tambah Tipe Soal
              </button>
            </div>

            {formData.blokSoal.map((b, i) => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-3 items-center"
              >
                <span className="font-black text-indigo-600 text-sm">
                  #{i + 1}
                </span>
                <select
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  value={b.jenis}
                  onChange={(e) =>
                    updateBlokSoal(b.id, "jenis", e.target.value)
                  }
                >
                  <option value="Pilihan Ganda">Pilihan Ganda</option>
                  <option value="Pilihan Ganda Kompleks">
                    Pilihan Ganda Kompleks (AKM)
                  </option>
                  <option value="Mencocokkan">Mencocokkan (Menjodohkan)</option>
                  <option value="Benar/Salah">Benar / Salah</option>
                  <option value="Uraian Singkat">Isian / Uraian Singkat</option>
                  <option value="Esai">Esai / HOTS</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Jml:</span>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={b.jumlah}
                    onChange={(e) =>
                      updateBlokSoal(b.id, "jumlah", Number(e.target.value))
                    }
                    className="w-16 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
                  />
                </div>

                {(b.jenis === "Pilihan Ganda" ||
                  b.jenis === "Pilihan Ganda Kompleks") && (
                  <select
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    value={b.opsiPG}
                    onChange={(e) =>
                      updateBlokSoal(b.id, "opsiPG", Number(e.target.value))
                    }
                  >
                    <option value={3}>3 Opsi (A-C)</option>
                    <option value={4}>4 Opsi (A-D)</option>
                    <option value={5}>5 Opsi (A-E)</option>
                  </select>
                )}

                <select
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  value={b.kesulitan}
                  onChange={(e) =>
                    updateBlokSoal(b.id, "kesulitan", e.target.value)
                  }
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Sulit (HOTS)">Sulit (HOTS)</option>
                </select>

                <select
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  value={b.kognitif}
                  onChange={(e) =>
                    updateBlokSoal(b.id, "kognitif", e.target.value)
                  }
                >
                  <option>C1 (Mengingat - L1)</option>
                  <option>C2 (Memahami - L1)</option>
                  <option>C3 (Mengaplikasikan - L2)</option>
                  <option>C4 (Menganalisis - L3 HOTS)</option>
                  <option>C5 (Mengevaluasi - L3 HOTS)</option>
                  <option>C6 (Mencipta - L3 HOTS)</option>
                </select>

                {formData.blokSoal.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlokSoal(b.id)}
                    className="text-rose-500 hover:text-rose-700 ml-auto p-1.5"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateSoal}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 flex justify-center items-center gap-2 transition-all disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span>
                  Meracik Soal, Kunci Pembahasan, Kisi-kisi & Kartu Soal...
                </span>
              </>
            ) : (
              <>
                <Sparkles size={22} />
                <span>GENERATE SOAL & PERANGKAT EVALUASI AI ✨</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* RESULT VIEW */
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              {[
                { id: "soal", label: "1. Naskah Soal" },
                { id: "kunci", label: "2. Kunci & Pembahasan" },
                { id: "kisi", label: "3. Kisi-Kisi Soal" },
                { id: "kartu", label: "4. Kartu Soal" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all",
                    activeTab === t.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

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
                onClick={() =>
                  exportHtmlToWordDoc(
                    "printable-soal",
                    `Soal_${activeTab}_${formData.mapel}.doc`
                  )
                }
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={14} /> Word (.doc)
              </button>
              <button
                onClick={() =>
                  exportElementToPDF(
                    "printable-soal",
                    `Soal_${activeTab}_${formData.mapel}.pdf`
                  )
                }
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Cetak
              </button>
            </div>
          </div>

          {/* Printable A4 Sheet */}
          <div className="overflow-x-auto pb-8">
            <div
              id="printable-soal"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              className={cn(
                "w-[210mm] max-w-full mx-auto bg-white px-[2cm] py-[2cm] shadow-xl rounded-2xl min-h-[297mm] text-[11.5pt] leading-[1.5] text-black",
                isEditing && "ring-4 ring-amber-400/50"
              )}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {/* KOP SOAL */}
              <div className="text-center mb-6 border-b-4 border-double border-black pb-4">
                <h1 className="text-[15pt] font-black uppercase">
                  {formData.jenisUjian}
                </h1>
                <h2 className="text-[13pt] font-bold uppercase">
                  {formData.namaSekolah || "SATUAN PENDIDIKAN"}
                </h2>
                <p className="text-[10.5pt] mt-1">
                  Mata Pelajaran: <strong>{formData.mapel}</strong> &nbsp;|&nbsp;
                  Kelas / Fase:{" "}
                  <strong>
                    {formData.kelas} / Fase {formData.fase}
                  </strong>{" "}
                  &nbsp;|&nbsp; Tahun Pelajaran:{" "}
                  <strong>{formData.tahunPelajaran}</strong>
                </p>
              </div>

              {/* TAB 1: NASKAH SOAL */}
              {activeTab === "soal" && (
                <div>
                  <div className="border border-black p-3 mb-6 text-[10.5pt] grid grid-cols-2 gap-2">
                    <div>Nama Peserta Didik : ....................................................</div>
                    <div>Hari / Tanggal : ....................................................</div>
                    <div>Kelas / No. Absen : ....................................................</div>
                    <div>Nilai : ....................................................</div>
                  </div>

                  {Object.entries(
                    generatedData?.soal?.reduce(
                      (acc: Record<string, SoalItem[]>, s) => {
                        if (!acc[s.jenis]) acc[s.jenis] = [];
                        acc[s.jenis].push(s);
                        return acc;
                      },
                      {}
                    ) || {}
                  ).map(([jenis, list]) => (
                    <div key={jenis} className="mb-8">
                      <h3 className="font-bold text-[11.5pt] mb-4 uppercase bg-slate-200 p-2 border-l-4 border-black">
                        BAGIAN SOAL: {jenis.toUpperCase()}
                      </h3>

                      {jenis === "Mencocokkan" ? (
                        <div className="flex flex-col sm:flex-row gap-6 mb-6 break-inside-avoid">
                          <table className="w-2/3 border-collapse border border-black">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-black p-1.5 w-10">No</th>
                                <th className="border border-black p-1.5">Pernyataan / Premis</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((s) => (
                                <tr key={s.no}>
                                  <td className="border border-black p-2 text-center">
                                    {s.no}
                                  </td>
                                  <td className="border border-black p-2">
                                    <div className="flex justify-between items-center">
                                      <span>{s.pertanyaan}</span>
                                      <span className="font-mono ml-2">
                                        ( .... )
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="w-1/3 border border-black p-3">
                            <p className="font-bold underline mb-2">
                              Pilihan Jawaban:
                            </p>
                            {Array.from(
                              new Set(list.flatMap((s) => s.opsi || []))
                            ).map((o, i) => (
                              <div key={i} className="mb-1">
                                <strong>{String.fromCharCode(65 + i)}.</strong>{" "}
                                {o}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        list.map((s) => (
                          <div
                            key={s.no}
                            className="mb-5 relative group break-inside-avoid pl-2"
                          >
                            <div className="flex gap-3">
                              <span className="font-bold">{s.no}.</span>
                              <div className="flex-1">
                                {jenis === "Benar/Salah" ? (
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <p className="flex-1">{s.pertanyaan}</p>
                                    <div className="border border-black px-3 py-0.5 font-bold ml-4">
                                      [ B / S ]
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2">{s.pertanyaan}</p>
                                    {s.image && (
                                      <img
                                        src={s.image}
                                        className="max-w-xs rounded-lg mb-3 border border-slate-300"
                                        alt="Ilustrasi Soal"
                                      />
                                    )}
                                    {s.opsi?.map((o, i) => (
                                      <p key={i} className="pl-4 mb-1">
                                        <strong>
                                          {String.fromCharCode(65 + i)}.
                                        </strong>{" "}
                                        <span className="ml-1.5">{o}</span>
                                      </p>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Hover Action Buttons per Soal */}
                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex gap-1.5 bg-white/90 p-1 rounded-xl shadow border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleRegenerateSingleSoal(s)}
                                title="Ganti Soal Ini dengan AI"
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-100"
                              >
                                {regeneratingNo === s.no ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Settings size={13} />
                                )}
                                Ganti AI
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAutoImage(s.no, s.pertanyaan)
                                }
                                title="Tambah Ilustrasi Gambar AI"
                                className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-pink-100"
                              >
                                {loadingImageNo === s.no ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <ImageIcon size={13} />
                                )}
                                Ilustrasi
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: KUNCI JAWABAN & PEMBAHASAN */}
              {activeTab === "kunci" && (
                <div className="space-y-4">
                  <h3 className="text-center font-bold text-[13pt] underline mb-4">
                    KUNCI JAWABAN, PEMBAHASAN & PEDOMAN PENSKORAN
                  </h3>
                  <table className="w-full border-collapse border border-black text-[10.5pt]">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-2 w-12">No</th>
                        <th className="border border-black p-2 w-1/5">Bentuk Soal</th>
                        <th className="border border-black p-2 w-1/4">Kunci Jawaban</th>
                        <th className="border border-black p-2">Pembahasan Lengkap</th>
                        <th className="border border-black p-2 w-16">Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedData?.kunci?.map((k) => (
                        <tr key={k.no}>
                          <td className="border border-black p-2 text-center font-bold">
                            {k.no}
                          </td>
                          <td className="border border-black p-2">{k.jenis}</td>
                          <td className="border border-black p-2 font-bold">
                            {k.jawaban}
                          </td>
                          <td className="border border-black p-2">
                            {k.penjelasan || "-"}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {k.skor || 10}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: KISI-KISI SOAL */}
              {activeTab === "kisi" && (
                <div className="space-y-4">
                  <h3 className="text-center font-bold text-[13pt] underline mb-4">
                    MATRIKS KISI-KISI PENULISAN SOAL
                  </h3>
                  <table className="w-full border-collapse border border-black text-[10pt]">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-2 w-10">No</th>
                        <th className="border border-black p-2">Capaian Pembelajaran (CP)</th>
                        <th className="border border-black p-2">Materi</th>
                        <th className="border border-black p-2">Indikator Soal</th>
                        <th className="border border-black p-2 w-24">Level Kognitif</th>
                        <th className="border border-black p-2 w-28">Bentuk Soal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedData?.kisi?.map((k) => (
                        <tr key={k.no}>
                          <td className="border border-black p-2 text-center">
                            {k.no}
                          </td>
                          <td className="border border-black p-2">{k.cp}</td>
                          <td className="border border-black p-2">{k.materi}</td>
                          <td className="border border-black p-2">
                            {k.indikator}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {k.kognitif}
                          </td>
                          <td className="border border-black p-2 text-center">
                            {k.bentuk}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: KARTU SOAL SUPERVISI */}
              {activeTab === "kartu" && (
                <div className="space-y-6">
                  <h3 className="text-center font-bold text-[13pt] underline mb-4">
                    DOKUMEN KARTU SOAL
                  </h3>
                  {generatedData?.soal?.map((s, idx) => {
                    const kisi = generatedData.kisi?.[idx];
                    const kunci = generatedData.kunci?.[idx];
                    return (
                      <table
                        key={s.no}
                        className="w-full border-collapse border border-black text-[10pt] mb-6 break-inside-avoid"
                      >
                        <tbody>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-black p-2" colSpan={2}>
                              KARTU SOAL NOMOR {s.no} ({s.jenis.toUpperCase()})
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 w-1/3">
                              <strong>Mata Pelajaran:</strong> {formData.mapel}
                              <br />
                              <strong>Kelas / Fase:</strong> {formData.kelas} /{" "}
                              {formData.fase}
                              <br />
                              <strong>Level Kognitif:</strong>{" "}
                              {kisi?.kognitif || "-"}
                            </td>
                            <td className="border border-black p-2">
                              <strong>Capaian Pembelajaran:</strong>{" "}
                              {kisi?.cp || "-"}
                              <br />
                              <strong>Materi:</strong> {kisi?.materi || "-"}
                              <br />
                              <strong>Indikator Soal:</strong>{" "}
                              {kisi?.indikator || "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black p-3" colSpan={2}>
                              <p className="font-bold underline mb-1">
                                Rumusan Butir Soal:
                              </p>
                              <p className="mb-2">{s.pertanyaan}</p>
                              {s.opsi?.map((o, i) => (
                                <p key={i} className="pl-4">
                                  {String.fromCharCode(65 + i)}. {o}
                                </p>
                              ))}
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="border border-black p-2">
                              <strong>Kunci Jawaban:</strong>{" "}
                              {kunci?.jawaban || "-"}
                            </td>
                            <td className="border border-black p-2">
                              <strong>Pembahasan / Penskoran:</strong>{" "}
                              {kunci?.penjelasan || "-"} (Skor:{" "}
                              {kunci?.skor || 10})
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
