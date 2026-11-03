"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  User,
  Layout,
  Zap,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  ChevronRight,
  ChevronDown,
  School,
  Building2,
  BrainCircuit,
  Target,
  Globe,
  Edit3,
  Copy,
  FileText,
  RotateCcw,
  Clock,
  Sparkles,
  Printer,
  AlertCircle,
} from "lucide-react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import {
  InstitutionType,
  Level,
  ModulAjarData,
  TeacherProfile,
} from "@/types";
import {
  DIMENSI_PROFIL,
  PANCA_CINTA,
  MODEL_PEMBELAJARAN,
  ASESMEN_OPTIONS,
  SUBJECTS,
  LINTAS_DISIPLIN_MAPEL,
  ISU_PRIORITAS,
  METODE_PEMBELAJARAN,
  STRATEGI_PEMBELAJARAN,
  PENDEKATAN_PEMBELAJARAN,
  KELAS_BY_LEVEL,
} from "@/constants";
import { callGeminiAI, callGeminiJson } from "@/lib/geminiService";
import { exportElementToPDF, exportHtmlToWordDoc } from "@/lib/exportUtils";

interface Props {
  profile: TeacherProfile;
  onAlert: (msg: string) => void;
}

const toggleCheckbox = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

export default function ModulAjarModule({ profile, onAlert }: Props) {
  const [data, setData] = useState<ModulAjarData>({
    namaSekolah: profile.namaSekolah,
    namaGuru: profile.namaGuru,
    nipGuru: profile.nipGuru,
    namaKepalaSekolah: profile.namaKepalaSekolah,
    nipKepalaSekolah: profile.nipKepalaSekolah,
    kota: profile.kota || "Jakarta",
    tanggal:
      profile.tanggal ||
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    tahunPelajaran: profile.tahunPelajaran || "2026/2027",
    kurikulum: "Kurikulum Nasional (Pembelajaran Mendalam)",
    institutionType: profile.institutionType || "Sekolah",
    level: profile.level || "SD",
    kelas: profile.kelas || "1",
    fase: profile.fase || "A",
    mataPelajaran: profile.mataPelajaran || "Bahasa Indonesia",
    dimensiProfil: ["Penalaran Kritis", "Kolaborasi", "Komunikasi"],
    pancaCinta: [],
    alokasiWaktu: "2 JP x 1 Pertemuan (2 x 35 Menit)",
    materiPembelajaranAI: {
      jenisPengetahuan: "",
      relevansi: "",
      strukturMateri: "",
      tingkatKesulitan: "",
      integrasiNilaiKarakter: "",
    },
    pesertaDidikAI: "",
    identifikasiKesiapanAI: "",
    capaianPembelajaran: "",
    lintasDisiplinIlmu: [],
    lintasDisiplinLainnya: "",
    isuPrioritas: ["Literasi", "Pembelajaran sopan santun & Karakter"],
    isuPrioritasLainnya: "",
    tujuanPembelajaranAI: "",
    kktpAI: "",
    pemahamanBermaknaAI: "",
    pertanyaanPemantikAI: "",
    topikPembelajaran: "",
    modaBelajar: "Tatap Muka",
    instruksiTambahan: "",
    praktikPedagogis: {
      modelPembelajaran: "Problem Based Learning (PBL)",
      modelLainnya: "",
      pendekatanPembelajaran:
        "Pembelajaran Mendalam (Deep Learning: Mindful, Meaningful, Joyful)",
      pendekatanLainnya: "",
      metodePembelajaran: "Diskusi kelompok",
      metodeLainnya: "",
      strategiPembelajaran: "Diferensiasi proses",
      strategiLainnya: "",
      strategiAI: "",
      pendekatanAI: "",
      teknikAI: "",
    },
    kemitraanAI: "",
    lingkunganAI: "",
    pemanfaatanDigitalAI: "",
    remidialDanPengayaanAI: "",
    lkpdAI: "",
    daftarPustakaAI: [],
    pertemuan: [],
    asesmenAI: {
      teknikInstrumen: "",
      rubrikAsesmen: [],
      rubrikKognitif: [],
      rubrikProfilLulusan: [],
    },
    asesmenCheckboxes: ["Observasi", "Tes tertulis/lisan", "Proyek"],
    asesmenLainnya: "",
  });

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      namaSekolah: profile.namaSekolah || prev.namaSekolah,
      namaGuru: profile.namaGuru || prev.namaGuru,
      nipGuru: profile.nipGuru || prev.nipGuru,
      namaKepalaSekolah: profile.namaKepalaSekolah || prev.namaKepalaSekolah,
      nipKepalaSekolah: profile.nipKepalaSekolah || prev.nipKepalaSekolah,
      kota: profile.kota || prev.kota,
      tahunPelajaran: profile.tahunPelajaran || prev.tahunPelajaran,
      institutionType: profile.institutionType || prev.institutionType,
      level: profile.level || prev.level,
      kelas: profile.kelas || prev.kelas,
      fase: profile.fase || prev.fase,
      mataPelajaran: profile.mataPelajaran || prev.mataPelajaran,
    }));
  }, [profile]);

  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "identifikasi"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingTopik, setIsSuggestingTopik] = useState(false);
  const [isSuggestingCP, setIsSuggestingCP] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sub-dokumen state (8 Perangkat Ajar Pendukung)
  const [activeSubDoc, setActiveSubDoc] = useState<string>("modul");
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);
  const [extraDocs, setExtraDocs] = useState<Record<string, any>>({});

  const handleSuggestTopik = async () => {
    setIsSuggestingTopik(true);
    try {
      const prompt = data.topikPembelajaran.trim()
        ? `Kembangkan topik "${data.topikPembelajaran}" menjadi judul topik pembelajaran yang spesifik, kontekstual, dan menarik untuk ${data.level} Kelas ${data.kelas} mata pelajaran ${data.mataPelajaran} (1 kalimat singkat padat).`
        : `Berikan 1 saran topik materi pelajaran utama yang spesifik dan menarik untuk siswa ${data.level} Kelas ${data.kelas} mata pelajaran ${data.mataPelajaran} sesuai Kurikulum Nasional (1 kalimat langsung tanpa pembuka).`;
      const res = await callGeminiAI(
        prompt,
        "Kamu adalah pakar kurikulum Indonesia. Jawab langsung dengan judul topiknya saja."
      );
      setData((prev) => ({ ...prev, topikPembelajaran: res.trim() }));
    } catch (e: any) {
      onAlert(e.message);
    } finally {
      setIsSuggestingTopik(false);
    }
  };

  const handleSuggestCP = async () => {
    setIsSuggestingCP(true);
    try {
      const prompt = `Buatkan rumusan Capaian Pembelajaran (CP) dan Tujuan Pembelajaran yang operasional untuk mata pelajaran ${data.mataPelajaran}, Jenjang ${data.level} Kelas ${data.kelas} (Fase ${data.fase}), Topik: "${data.topikPembelajaran || "Materi Esensial"}". Maksimal 1 paragraf padat.`;
      const res = await callGeminiAI(
        prompt,
        "Kamu adalah pakar penyusun Modul Ajar & RPP Pembelajaran Mendalam. Jawab langsung tanpa pengantar."
      );
      setData((prev) => ({ ...prev, capaianPembelajaran: res.trim() }));
    } catch (e: any) {
      onAlert(e.message);
    } finally {
      setIsSuggestingCP(false);
    }
  };

  const handleGenerateModul = async () => {
    if (!data.mataPelajaran.trim()) {
      onAlert("Mohon pilih atau ketik Mata Pelajaran terlebih dahulu.");
      setExpandedSection("identifikasi");
      return;
    }

    setIsGenerating(true);
    try {
      const semuaLintas = [
        ...data.lintasDisiplinIlmu,
        ...(data.lintasDisiplinLainnya ? [data.lintasDisiplinLainnya] : []),
      ];
      const semuaIsu = [
        ...data.isuPrioritas,
        ...(data.isuPrioritasLainnya ? [data.isuPrioritasLainnya] : []),
      ];
      const modelFinal =
        data.praktikPedagogis.modelPembelajaran === "Lainnya"
          ? data.praktikPedagogis.modelLainnya
          : data.praktikPedagogis.modelPembelajaran;
      const pendekatanFinal =
        data.praktikPedagogis.pendekatanPembelajaran === "Lainnya"
          ? data.praktikPedagogis.pendekatanLainnya
          : data.praktikPedagogis.pendekatanPembelajaran;
      const metodeFinal =
        data.praktikPedagogis.metodePembelajaran === "Lainnya"
          ? data.praktikPedagogis.metodeLainnya
          : data.praktikPedagogis.metodePembelajaran;
      const strategiFinal =
        data.praktikPedagogis.strategiPembelajaran === "Lainnya"
          ? data.praktikPedagogis.strategiLainnya
          : data.praktikPedagogis.strategiPembelajaran;

      const systemInstruction = `
        Anda adalah seorang ahli pengembang kurikulum nasional dan pakar pedagogi "Pembelajaran Mendalam" (Deep Learning).
        Tugas Anda adalah membuat draf lengkap RPP / Modul Ajar Pembelajaran Mendalam yang komprehensif, inspiratif, dan siap digunakan.
        Konten harus mencerminkan prinsip "Pembelajaran Mendalam": Berkesadaran (Mindful), Bermakna (Meaningful), dan Menggembirakan (Joyful).
        Gunakan narasi yang mendalam, operasional, dan aplikatif.
        Hubungkan materi dengan kehidupan nyata dan Dimensi Profil Lulusan yang dipilih.
        Untuk Madrasah, integrasikan nilai-nilai Panca Cinta secara organik ke dalam kegiatan.
        Integrasikan Isu-Isu Prioritas Nasional yang dipilih ke dalam tahapan Kegiatan Inti ("memahami", "mengaplikasi", "merefleksi") pada setiap Pertemuan.
        Perhatikan Alokasi Waktu (JP x Pertemuan). Jika user meminta lebih dari 1 pertemuan, buat sejumlah pertemuan tersebut dalam array "pertemuan".
        Kembalikan HANYA JSON murni yang valid sesuai struktur yang diminta.
      `;

      const prompt = `
        PARAMETER INPUT:
        - Jenjang: ${data.level} (${data.institutionType})
        - Kelas / Fase: Kelas ${data.kelas} / Fase ${data.fase}
        - Kurikulum: ${data.kurikulum}
        - Mata Pelajaran: ${data.mataPelajaran}
        - Topik Utama: ${data.topikPembelajaran || "Tentukan topik yang paling relevan untuk jenjang, kelas, dan mata pelajaran ini"}
        - Capaian Belajar Murid (CP): ${data.capaianPembelajaran || "Tentukan Capaian Pembelajaran standar kurikulum nasional yang sesuai"}
        - Alokasi Waktu: ${data.alokasiWaktu}
        - Dimensi Profil Lulusan: ${data.dimensiProfil.join(", ") || "Penalaran Kritis, Kolaborasi, Komunikasi"}
        ${data.institutionType === "Madrasah" ? `- Panca Cinta (Khas Madrasah): ${data.pancaCinta.join(", ") || "Cinta Allah & Rasul, Cinta Ilmu"}` : ""}
        - Lintas Disiplin Ilmu: ${semuaLintas.join(", ") || "Tentukan yang relevan"}
        - Isu-Isu Prioritas Nasional yang Diinsersikan: ${semuaIsu.join(", ") || "Literasi, Numerasi, Karakter"}
        - Model Pembelajaran: ${modelFinal}
        - Pendekatan Pembelajaran: ${pendekatanFinal}
        - Metode Pembelajaran: ${metodeFinal}
        - Strategi Pembelajaran: ${strategiFinal}
        - Jenis Asesmen: ${data.asesmenCheckboxes.join(", ")}${data.asesmenLainnya ? `, ${data.asesmenLainnya}` : ""}
        - Moda Belajar: ${data.modaBelajar}
        - Instruksi Tambahan Guru: ${data.instruksiTambahan || "Tidak ada"}

        Hasilkan JSON murni dengan struktur persis berikut:
        {
          "topikDitentukan": "string",
          "cpDitentukan": "string",
          "pesertaDidik": "string (profil & karakteristik peserta didik)",
          "identifikasiKesiapan": "string (identifikasi kesiapan belajar awal)",
          "materiPembelajaran": {
            "jenisPengetahuan": "string (Faktual, Konseptual, Prosedural, Metakognitif)",
            "relevansi": "string (Relevansi dengan kehidupan nyata murid)",
            "strukturMateri": "string (Poin-poin struktur materi esensial)",
            "tingkatKesulitan": "string",
            "integrasiNilaiKarakter": "string (Integrasi Dimensi Profil Lulusan & Isu Prioritas)"
          },
          "tujuanPembelajaran": "string",
          "kktp": "string (Breakdown Kriteria Ketercapaian Tujuan Pembelajaran yang terukur)",
          "pemahamanBermakna": "string",
          "pertanyaanPemantik": "string",
          "praktikPedagogis": {
            "strategi": "string",
            "pendekatan": "string",
            "teknik": "string"
          },
          "kemitraan": "string (Kemitraan pembelajaran dengan orang tua/komunitas/ahli)",
          "lingkungan": "string (Pengaturan lingkungan belajar fisik & psikososial)",
          "pemanfaatanDigital": "string (Pemanfaatan teknologi digital/AI interaktif)",
          "remidialDanPengayaan": "string (Skenario konkret diferensiasi remedial & pengayaan)",
          "lkpd": "string (Lembar Kerja Peserta Didik lengkap petunjuk & aktivitas)",
          "daftarPustaka": ["string"],
          "pertemuan": [
            {
              "pertemuanKe": 1,
              "kegiatanAwal": "string (Orientasi berkesadaran, apersepsi bermakna, motivasi menggembirakan)",
              "kegiatanInti": {
                "memahami": "string (Eksplorasi konsep mendalam + insersi isu prioritas)",
                "mengaplikasi": "string (Kolaborasi pemecahan masalah nyata / proyek + insersi isu prioritas)",
                "merefleksi": "string (Refleksi metakognitif & kesimpulan bermakna)"
              },
              "kegiatanAkhir": "string (Umpan balik, penguatan, tindak lanjut & doa)"
            }
          ],
          "asesmen": {
            "teknikInstrumen": "string (Penjelasan asesmen formatif awal, proses, dan sumatif akhir)",
            "rubrikAsesmen": [
              { "kriteria": "string", "sangatBaik": "string", "baik": "string", "cukup": "string", "perluBimbingan": "string" }
            ],
            "rubrikKognitif": [
              { "kriteria": "string", "sangatBaik": "string", "baik": "string", "cukup": "string", "perluBimbingan": "string" }
            ],
            "rubrikProfilLulusan": [
              { "kriteria": "string", "sangatBaik": "string", "baik": "string", "cukup": "string", "perluBimbingan": "string" }
            ]
          }
        }
      `;

      const result = await callGeminiJson(prompt, systemInstruction);

      setData((prev) => ({
        ...prev,
        topikPembelajaran:
          prev.topikPembelajaran ||
          result.topikDitentukan ||
          prev.topikPembelajaran,
        capaianPembelajaran:
          prev.capaianPembelajaran ||
          result.cpDitentukan ||
          prev.capaianPembelajaran,
        pesertaDidikAI: result.pesertaDidik || "",
        identifikasiKesiapanAI: result.identifikasiKesiapan || "",
        materiPembelajaranAI: {
          jenisPengetahuan: result.materiPembelajaran?.jenisPengetahuan || "",
          relevansi: result.materiPembelajaran?.relevansi || "",
          strukturMateri: result.materiPembelajaran?.strukturMateri || "",
          tingkatKesulitan: result.materiPembelajaran?.tingkatKesulitan || "",
          integrasiNilaiKarakter:
            result.materiPembelajaran?.integrasiNilaiKarakter || "",
        },
        tujuanPembelajaranAI: result.tujuanPembelajaran || "",
        kktpAI: result.kktp || "",
        pemahamanBermaknaAI: result.pemahamanBermakna || "",
        pertanyaanPemantikAI: result.pertanyaanPemantik || "",
        praktikPedagogis: {
          ...prev.praktikPedagogis,
          strategiAI: result.praktikPedagogis?.strategi || "",
          pendekatanAI: result.praktikPedagogis?.pendekatan || "",
          teknikAI: result.praktikPedagogis?.teknik || "",
        },
        kemitraanAI: result.kemitraan || "",
        lingkunganAI: result.lingkungan || "",
        pemanfaatanDigitalAI: result.pemanfaatanDigital || "",
        remidialDanPengayaanAI: result.remidialDanPengayaan || "",
        lkpdAI: result.lkpd || "",
        daftarPustakaAI: result.daftarPustaka || [],
        pertemuan: result.pertemuan || [],
        asesmenAI: {
          teknikInstrumen: result.asesmen?.teknikInstrumen || "",
          rubrikAsesmen: result.asesmen?.rubrikAsesmen || [],
          rubrikKognitif: result.asesmen?.rubrikKognitif || [],
          rubrikProfilLulusan: result.asesmen?.rubrikProfilLulusan || [],
        },
      }));
      setExtraDocs({});
      setActiveSubDoc("modul");
      setActiveTab("preview");
    } catch (error: any) {
      onAlert(error.message || "Gagal menghasilkan Modul Ajar / RPP.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExtraDoc = async (type: string) => {
    if (type === "modul") {
      setActiveSubDoc("modul");
      return;
    }
    if (extraDocs[type]) {
      setActiveSubDoc(type);
      return;
    }

    setIsGeneratingExtra(true);
    try {
      const materiKonteks =
        data.topikPembelajaran || data.capaianPembelajaran || data.mataPelajaran;
      let prompt = "";

      if (type === "lkpd") {
        prompt = `Berdasarkan Topik/Materi: "${materiKonteks}" untuk Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Buatkan Lembar Kerja Peserta Didik (LKPD) berbasis Pembelajaran Mendalam yang interaktif. Format output HARUS JSON murni: { "judul": "LKPD: ...", "tujuan": ["..."], "alatBahan": ["..."], "langkahKerja": ["..."], "soalLatihan": ["..."] }`;
      } else if (type === "ringkasan") {
        prompt = `Berdasarkan Topik/Materi: "${materiKonteks}" untuk Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Buatkan Bahan Ajar / Ringkasan Materi (Handout) lengkap. Format output HARUS JSON murni: { "judul": "...", "petaKonsep": ["..."], "isiMateri": [ { "subjudul": "...", "konten": "..." } ], "kesimpulan": "..." }`;
      } else if (type === "icebreaker") {
        prompt = `Berdasarkan Topik/Materi: "${materiKonteks}" untuk Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Buatkan 3 ide "Icebreaker & Joyful Learning" berdurasi singkat yang terhubung dengan materi. Format output HARUS JSON murni: { "judul": "...", "kegiatan": [ { "nama": "...", "durasi": "...", "caraBermain": "..." } ] }`;
      } else if (type === "rubrik") {
        prompt = `Buatkan Rubrik Penilaian Proyek/Kinerja untuk materi: "${materiKonteks}" Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Minimal 4 kriteria. Format output HARUS JSON murni: { "judul": "...", "kriteria": [ { "namaKriteria": "...", "skor4": "Sangat Baik: ...", "skor3": "Baik: ...", "skor2": "Cukup: ...", "skor1": "Perlu Bimbingan: ..." } ] }`;
      } else if (type === "roleplay") {
        prompt = `Berdasarkan Materi: "${materiKonteks}" Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Buatkan skenario Roleplay / Simulasi Kontekstual berdurasi 5-10 menit di kelas. Format output HARUS JSON murni: { "judul": "...", "karakter": ["..."], "latar": "...", "naskah": [ { "tokoh": "...", "dialog": "...", "instruksiAksi": "..." } ], "pesanMoral": "..." }`;
      } else if (type === "surat") {
        prompt = `Berdasarkan Materi: "${materiKonteks}" Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Buatkan draf surat kemitraan/pemberitahuan dari guru kepada wali murid untuk pendampingan belajar di rumah. Format output HARUS JSON murni: { "perihal": "...", "salamPembuka": "...", "isiInformasi": "...", "saranKegiatanRumah": ["..."], "salamPenutup": "..." }`;
      } else if (type === "presentasi") {
        prompt = `Buatkan outline presentasi PowerPoint/Canva (7 slide) untuk Materi: "${materiKonteks}" Mata Pelajaran ${data.mataPelajaran} (${data.level} Kelas ${data.kelas}). Format output HARUS JSON murni: { "judul": "...", "slide": [ { "nomorSlide": 1, "judulSlide": "...", "poinPenting": ["..."], "saranVisual": "..." } ] }`;
      } else if (type === "miskonsepsi") {
        prompt = `Analisis 4 potensi miskonsepsi (kesalahan pemahaman konsep) siswa saat mempelajari Materi: "${materiKonteks}" (${data.level} Kelas ${data.kelas}) beserta solusinya. Format output HARUS JSON murni: { "judul": "...", "daftarMiskonsepsi": [ { "konsepSalah": "...", "penjelasanBenar": "...", "caraMengatasi": "..." } ] }`;
      }

      const parsed = await callGeminiJson(
        prompt,
        "Hasilkan output wajib dalam format JSON murni tanpa markdown blok."
      );
      setExtraDocs((prev) => ({ ...prev, [type]: parsed }));
      setActiveSubDoc(type);
    } catch (e: any) {
      onAlert(e.message || "Gagal meracik dokumen tambahan.");
    } finally {
      setIsGeneratingExtra(false);
    }
  };

  const handleDownloadDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "RPP / MODUL AJAR PEMBELAJARAN MENDALAM",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `${data.institutionType} - ${data.level} (Kelas ${data.kelas} / Fase ${data.fase})`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: data.mataPelajaran,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({ text: "Satuan Pendidikan: ", bold: true }),
                new TextRun(data.namaSekolah || "-"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nama Guru: ", bold: true }),
                new TextRun(
                  `${data.namaGuru || "-"}${data.nipGuru ? ` (NIP. ${data.nipGuru})` : ""}`
                ),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Topik Pembelajaran: ", bold: true }),
                new TextRun(data.topikPembelajaran || "-"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Alokasi Waktu: ", bold: true }),
                new TextRun(data.alokasiWaktu || "-"),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "A. IDENTIFIKASI",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `Dimensi Profil Lulusan: ${data.dimensiProfil.join(", ")}`,
            }),
            ...(data.institutionType === "Madrasah"
              ? [
                  new Paragraph({
                    text: `Panca Cinta: ${data.pancaCinta.join(", ")}`,
                  }),
                ]
              : []),
            new Paragraph({
              text: `Karakteristik Peserta Didik: ${data.pesertaDidikAI}`,
            }),
            new Paragraph({
              text: `Kesiapan Belajar: ${data.identifikasiKesiapanAI}`,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "B. DESAIN PEMBELAJARAN",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `Capaian Pembelajaran: ${data.capaianPembelajaran}`,
            }),
            new Paragraph({
              text: `Tujuan Pembelajaran: ${data.tujuanPembelajaranAI}`,
            }),
            new Paragraph({ text: `KKTP: ${data.kktpAI}` }),
            new Paragraph({
              text: `Pemahaman Bermakna: ${data.pemahamanBermaknaAI}`,
            }),
            new Paragraph({
              text: `Pertanyaan Pemantik: ${data.pertanyaanPemantikAI}`,
            }),
            new Paragraph({
              text: `Isu Prioritas Terintegrasi: ${[...data.isuPrioritas, ...(data.isuPrioritasLainnya ? [data.isuPrioritasLainnya] : [])].join(", ")}`,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "C. PENGALAMAN BELAJAR (DEEP LEARNING)",
              heading: HeadingLevel.HEADING_2,
            }),
            ...data.pertemuan.flatMap((p) => [
              new Paragraph({
                text: `Pertemuan Ke-${p.pertemuanKe}`,
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({ text: `Kegiatan Awal: ${p.kegiatanAwal}` }),
              new Paragraph({
                text: `Inti - Memahami (Mindful/Meaningful): ${p.kegiatanInti.memahami}`,
                bullet: { level: 0 },
              }),
              new Paragraph({
                text: `Inti - Mengaplikasi (Meaningful/Joyful): ${p.kegiatanInti.mengaplikasi}`,
                bullet: { level: 0 },
              }),
              new Paragraph({
                text: `Inti - Merefleksi (Mindful): ${p.kegiatanInti.merefleksi}`,
                bullet: { level: 0 },
              }),
              new Paragraph({ text: `Kegiatan Akhir: ${p.kegiatanAkhir}` }),
              new Paragraph({ text: "" }),
            ]),
            new Paragraph({
              text: "D. ASESMEN, REMEDIAL & LKPD",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `Teknik & Instrumen: ${data.asesmenAI.teknikInstrumen}`,
            }),
            new Paragraph({
              text: `Remedial & Pengayaan: ${data.remidialDanPengayaanAI}`,
            }),
            new Paragraph({ text: `LKPD: ${data.lkpdAI}` }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: `Mengetahui, Kepala Sekolah: ${data.namaKepalaSekolah || ".............................."} (NIP. ${data.nipKepalaSekolah || "..........................."})`,
            }),
            new Paragraph({
              text: `${data.kota}, ${data.tanggal} - Guru Mata Pelajaran: ${data.namaGuru || ".............................."} (NIP. ${data.nipGuru || "..........................."})`,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(
      blob,
      `RPP_PM_${(data.topikPembelajaran || data.mataPelajaran).replace(/\s+/g, "_")}.docx`
    );
  };

  const subDocTabs = [
    { id: "modul", label: "RPP / Modul Utama" },
    { id: "lkpd", label: "LKPD Interaktif" },
    { id: "ringkasan", label: "Bahan Ajar / Handout" },
    { id: "icebreaker", label: "Ide Icebreaker" },
    { id: "rubrik", label: "Rubrik Detail" },
    { id: "roleplay", label: "Skenario Roleplay" },
    { id: "presentasi", label: "Outline Slide PPT" },
    { id: "miskonsepsi", label: "Miskonsepsi Siswa" },
    { id: "surat", label: "Surat Wali Murid" },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Header Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-indigo-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-200">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Generator RPP & Modul Ajar Pembelajaran Mendalam
            </h2>
            <p className="text-xs font-semibold text-purple-600">
              Deep Learning (Mindful, Meaningful, Joyful) • Insersi Isu Nasional • 8 Perangkat Pendukung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("form")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-extrabold transition-all",
              activeTab === "form"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            1. Form Penyusunan
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-extrabold transition-all",
              activeTab === "preview"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            2. Pratinjau & 8 Perangkat Ajar
          </button>
        </div>
      </div>

      {activeTab === "form" ? (
        <div className="space-y-5">
          {/* SECTION 1: IDENTIFIKASI */}
          <div className="border border-purple-100 rounded-3xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "identifikasi" ? null : "identifikasi"
                )
              }
              className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50/80 to-white hover:from-purple-100/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    A. Identifikasi Satuan Pendidikan, Mapel & Dimensi Profil Lulusan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sekolah/Madrasah, Mata Pelajaran, Alokasi Waktu, 8 Dimensi Profil Lulusan & Panca Cinta
                  </p>
                </div>
              </div>
              {expandedSection === "identifikasi" ? (
                <ChevronDown size={20} className="text-purple-500" />
              ) : (
                <ChevronRight size={20} className="text-purple-500" />
              )}
            </button>

            {expandedSection === "identifikasi" && (
              <div className="p-6 border-t border-purple-50 space-y-6">
                {/* Identitas Guru & Sekolah */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Nama Sekolah / Madrasah
                    </label>
                    <input
                      type="text"
                      value={data.namaSekolah}
                      onChange={(e) =>
                        setData({ ...data, namaSekolah: e.target.value })
                      }
                      placeholder="Contoh: SD Negeri 1 / MIN 1"
                      className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Nama Guru & Gelar
                    </label>
                    <input
                      type="text"
                      value={data.namaGuru}
                      onChange={(e) =>
                        setData({ ...data, namaGuru: e.target.value })
                      }
                      placeholder="Nama Guru"
                      className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      NIP Guru
                    </label>
                    <input
                      type="text"
                      value={data.nipGuru}
                      onChange={(e) =>
                        setData({ ...data, nipGuru: e.target.value })
                      }
                      placeholder="NIP Guru (Opsional)"
                      className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Nama Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={data.namaKepalaSekolah}
                      onChange={(e) =>
                        setData({ ...data, namaKepalaSekolah: e.target.value })
                      }
                      placeholder="Nama Kepala Sekolah"
                      className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={data.nipKepalaSekolah}
                      onChange={(e) =>
                        setData({ ...data, nipKepalaSekolah: e.target.value })
                      }
                      placeholder="NIP Kepala Sekolah"
                      className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Kota
                      </label>
                      <input
                        type="text"
                        value={data.kota}
                        onChange={(e) =>
                          setData({ ...data, kota: e.target.value })
                        }
                        placeholder="Kota"
                        className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Tanggal
                      </label>
                      <input
                        type="text"
                        value={data.tanggal}
                        onChange={(e) =>
                          setData({ ...data, tanggal: e.target.value })
                        }
                        placeholder="Tanggal"
                        className="w-full mt-1 p-2.5 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Pilihan Institusi, Jenjang, Kelas, Mapel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Naungan Institusi
                    </label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            institutionType: "Sekolah",
                            level: "SD",
                            kelas: "1",
                            fase: "A",
                            mataPelajaran: SUBJECTS["SD"][0],
                          })
                        }
                        className={cn(
                          "flex-1 py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all",
                          data.institutionType === "Sekolah"
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-slate-200 text-slate-500"
                        )}
                      >
                        <School size={16} /> Sekolah Umum
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            institutionType: "Madrasah",
                            level: "MI",
                            kelas: "1",
                            fase: "A",
                            mataPelajaran: SUBJECTS["MI"][0],
                          })
                        }
                        className={cn(
                          "flex-1 py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all",
                          data.institutionType === "Madrasah"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-500"
                        )}
                      >
                        <Building2 size={16} /> Madrasah
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Tingkat / Satuan
                    </label>
                    <select
                      value={data.level}
                      onChange={(e) => {
                        const newLvl = e.target.value as Level;
                        const defaultKls = KELAS_BY_LEVEL[newLvl]?.[0] || {
                          value: "1",
                          fase: "A",
                        };
                        setData({
                          ...data,
                          level: newLvl,
                          kelas: defaultKls.value,
                          fase: defaultKls.fase,
                          mataPelajaran: SUBJECTS[newLvl]?.[0] || "",
                        });
                      }}
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {data.institutionType === "Sekolah" ? (
                        <>
                          <option value="PAUD">PAUD / TK</option>
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA">SMA</option>
                          <option value="SMK">SMK</option>
                        </>
                      ) : (
                        <>
                          <option value="RA">RA</option>
                          <option value="MI">MI</option>
                          <option value="MTs">MTs</option>
                          <option value="MA">MA</option>
                          <option value="MAK">MAK</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Kelas & Fase
                    </label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={data.kelas}
                        onChange={(e) => {
                          const found = KELAS_BY_LEVEL[data.level]?.find(
                            (k) => k.value === e.target.value
                          );
                          setData({
                            ...data,
                            kelas: e.target.value,
                            fase: found ? found.fase : data.fase,
                          });
                        }}
                        className="w-2/3 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                      >
                        {(KELAS_BY_LEVEL[data.level] || []).map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={`Fase ${data.fase}`}
                        readOnly
                        className="w-1/3 p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-center font-bold text-xs text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Pilih Mata Pelajaran
                    </label>
                    <select
                      value={
                        SUBJECTS[data.level]?.includes(data.mataPelajaran)
                          ? data.mataPelajaran
                          : "LAINNYA"
                      }
                      onChange={(e) => {
                        if (e.target.value !== "LAINNYA") {
                          setData({ ...data, mataPelajaran: e.target.value });
                        } else {
                          setData({ ...data, mataPelajaran: "" });
                        }
                      }}
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {(SUBJECTS[data.level] || []).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="LAINNYA">+ Ketik Mapel Lainnya...</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Nama Mata Pelajaran (Aktif)
                    </label>
                    <input
                      type="text"
                      value={data.mataPelajaran}
                      onChange={(e) =>
                        setData({ ...data, mataPelajaran: e.target.value })
                      }
                      placeholder="Ketik nama mata pelajaran..."
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-semibold text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      <Clock size={14} className="text-purple-600" /> Alokasi
                      Waktu (JP x Pertemuan)
                    </label>
                    <input
                      type="text"
                      value={data.alokasiWaktu}
                      onChange={(e) =>
                        setData({ ...data, alokasiWaktu: e.target.value })
                      }
                      placeholder="Contoh: 2 JP x 2 Pertemuan (2 x 35 Menit)"
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-semibold text-sm bg-white"
                    />
                  </div>
                </div>

                {/* 8 Dimensi Profil Lulusan */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} className="text-purple-600" /> 8 Dimensi
                    Profil Lulusan (Kurikulum Nasional Terbaru)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {DIMENSI_PROFIL.map((item) => (
                      <label
                        key={item}
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                          data.dimensiProfil.includes(item)
                            ? "border-purple-500 bg-purple-50/70 text-purple-900"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={data.dimensiProfil.includes(item)}
                          onChange={() =>
                            setData({
                              ...data,
                              dimensiProfil: toggleCheckbox(
                                data.dimensiProfil,
                                item
                              ),
                            })
                          }
                          className="w-4 h-4 accent-purple-600 rounded"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Panca Cinta (Khusus Madrasah) */}
                {data.institutionType === "Madrasah" && (
                  <div className="space-y-2 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                    <label className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                      <Zap size={16} className="text-emerald-600" /> Kurikulum
                      Berbasis Cinta (Panca Cinta Kemenag)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {PANCA_CINTA.map((item) => (
                        <label
                          key={item}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                            data.pancaCinta.includes(item)
                              ? "border-emerald-600 bg-white text-emerald-900 shadow-sm"
                              : "border-emerald-200/80 bg-white/50 text-emerald-800"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={data.pancaCinta.includes(item)}
                            onChange={() =>
                              setData({
                                ...data,
                                pancaCinta: toggleCheckbox(
                                  data.pancaCinta,
                                  item
                                ),
                              })
                            }
                            className="w-4 h-4 accent-emerald-600 rounded"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: DESAIN PEMBELAJARAN & INSERSI ISU NASIONAL */}
          <div className="border border-purple-100 rounded-3xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "desain" ? null : "desain"
                )
              }
              className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50/80 to-white hover:from-purple-100/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
                  <Layout size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    B. Desain Pembelajaran, Insersi Isu Nasional & Praktik Pedagogis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Topik, CP/TP, Lintas Disiplin Ilmu, Insersi Isu Prioritas Nasional, Model & Strategi Pembelajaran
                  </p>
                </div>
              </div>
              {expandedSection === "desain" ? (
                <ChevronDown size={20} className="text-purple-500" />
              ) : (
                <ChevronRight size={20} className="text-purple-500" />
              )}
            </button>

            {expandedSection === "desain" && (
              <div className="p-6 border-t border-purple-50 space-y-6">
                {/* Topik & CP dengan Tombol Kembangkan AI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Topik Pembelajaran / Materi Esensial
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestTopik}
                        disabled={isSuggestingTopik}
                        className="text-[11px] bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm hover:opacity-90"
                      >
                        <Sparkles size={12} />
                        {isSuggestingTopik ? "Meracik..." : "Saran Topik AI ✨"}
                      </button>
                    </div>
                    <textarea
                      value={data.topikPembelajaran}
                      onChange={(e) =>
                        setData({ ...data, topikPembelajaran: e.target.value })
                      }
                      rows={3}
                      placeholder="Contoh: Ekosistem dan Rantai Makanan (Atau klik Saran Topik AI)"
                      className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Capaian Pembelajaran (CP) / Tujuan Dasar
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestCP}
                        disabled={isSuggestingCP}
                        className="text-[11px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm hover:opacity-90"
                      >
                        <Sparkles size={12} />
                        {isSuggestingCP ? "Meracik..." : "Kembangkan CP AI ✨"}
                      </button>
                    </div>
                    <textarea
                      value={data.capaianPembelajaran}
                      onChange={(e) =>
                        setData({
                          ...data,
                          capaianPembelajaran: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Bisa dikosongkan (AI akan menyusun otomatis) atau klik Kembangkan CP AI..."
                      className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Integrasi Isu-Isu Prioritas Nasional */}
                <div className="space-y-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <label className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} className="text-indigo-600" /> Insersi
                    Isu-Isu Prioritas Nasional (Diintegrasikan ke Kegiatan Inti)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ISU_PRIORITAS.map((item) => (
                      <label
                        key={item}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                          data.isuPrioritas.includes(item)
                            ? "border-indigo-600 bg-white text-indigo-900 shadow-sm"
                            : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={data.isuPrioritas.includes(item)}
                          onChange={() =>
                            setData({
                              ...data,
                              isuPrioritas: toggleCheckbox(
                                data.isuPrioritas,
                                item
                              ),
                            })
                          }
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={data.isuPrioritasLainnya}
                    onChange={(e) =>
                      setData({ ...data, isuPrioritasLainnya: e.target.value })
                    }
                    placeholder="+ Ketik Isu Prioritas Lainnya (Opsional, misal: Mitigasi Banjir Lokal, Pangan Sehat)..."
                    className="w-full p-2.5 rounded-xl border border-indigo-200 text-xs font-semibold bg-white"
                  />
                </div>

                {/* Lintas Disiplin Ilmu */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={16} className="text-purple-600" /> Lintas
                    Disiplin Ilmu
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                    {LINTAS_DISIPLIN_MAPEL.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 text-xs font-medium cursor-pointer hover:bg-purple-50"
                      >
                        <input
                          type="checkbox"
                          checked={data.lintasDisiplinIlmu.includes(item)}
                          onChange={() =>
                            setData({
                              ...data,
                              lintasDisiplinIlmu: toggleCheckbox(
                                data.lintasDisiplinIlmu,
                                item
                              ),
                            })
                          }
                          className="w-3.5 h-3.5 accent-purple-600 rounded"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Praktik Pedagogis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Model Pembelajaran
                    </label>
                    <select
                      value={data.praktikPedagogis.modelPembelajaran}
                      onChange={(e) =>
                        setData({
                          ...data,
                          praktikPedagogis: {
                            ...data.praktikPedagogis,
                            modelPembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {MODEL_PEMBELAJARAN.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Pendekatan Pembelajaran
                    </label>
                    <select
                      value={data.praktikPedagogis.pendekatanPembelajaran}
                      onChange={(e) =>
                        setData({
                          ...data,
                          praktikPedagogis: {
                            ...data.praktikPedagogis,
                            pendekatanPembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {PENDEKATAN_PEMBELAJARAN.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Metode Pembelajaran
                    </label>
                    <select
                      value={data.praktikPedagogis.metodePembelajaran}
                      onChange={(e) =>
                        setData({
                          ...data,
                          praktikPedagogis: {
                            ...data.praktikPedagogis,
                            metodePembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {METODE_PEMBELAJARAN.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Strategi Pembelajaran
                    </label>
                    <select
                      value={data.praktikPedagogis.strategiPembelajaran}
                      onChange={(e) =>
                        setData({
                          ...data,
                          praktikPedagogis: {
                            ...data.praktikPedagogis,
                            strategiPembelajaran: e.target.value,
                          },
                        })
                      }
                      className="w-full mt-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-white"
                    >
                      {STRATEGI_PEMBELAJARAN.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pilihan Asesmen & Instruksi Tambahan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
                      Teknik Asesmen yang Digunakan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASESMEN_OPTIONS.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-purple-50"
                        >
                          <input
                            type="checkbox"
                            checked={data.asesmenCheckboxes.includes(item)}
                            onChange={() =>
                              setData({
                                ...data,
                                asesmenCheckboxes: toggleCheckbox(
                                  data.asesmenCheckboxes,
                                  item
                                ),
                              })
                            }
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
                      Instruksi Khusus / Konteks Kelas (Opsional)
                    </label>
                    <textarea
                      value={data.instruksiTambahan}
                      onChange={(e) =>
                        setData({ ...data, instruksiTambahan: e.target.value })
                      }
                      rows={4}
                      placeholder="Contoh: Siswa menyukai permainan kelompok dan praktikum sederhana di halaman sekolah..."
                      className="w-full p-3 rounded-2xl border-2 border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GENERATE BUTTON */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              onClick={handleGenerateModul}
              disabled={isGenerating}
              className="flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-base shadow-xl shadow-purple-200 flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>
                    Sedang Menyusun RPP Pembelajaran Mendalam & Rubrik...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={22} />
                  <span>GENERATE RPP / MODUL AJAR DEEP LEARNING ✨</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* PREVIEW & 8 SUB-DOCS VIEW */
        <div className="space-y-5">
          {/* Sub-Doc Navigation Bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-purple-100 space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {subDocTabs.map((t) => {
                  const isReady = t.id === "modul" || Boolean(extraDocs[t.id]);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleGenerateExtraDoc(t.id)}
                      disabled={isGeneratingExtra}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5",
                        activeSubDoc === t.id
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                          : isReady
                            ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      <span>{t.label}</span>
                      {!isReady && <span className="text-[10px]">✨</span>}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all",
                    isEditing
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  )}
                >
                  <Edit3 size={14} />
                  {isEditing ? "Selesai Edit" : "Edit Manual"}
                </button>
                {activeSubDoc === "modul" && (
                  <button
                    onClick={handleDownloadDocx}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText size={14} /> Word (.docx)
                  </button>
                )}
                <button
                  onClick={() =>
                    exportHtmlToWordDoc(
                      "printable-modul-area",
                      `GuruJagoan_${activeSubDoc}_${data.mataPelajaran}.doc`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText size={14} /> Word (.doc)
                </button>
                <button
                  onClick={() =>
                    exportElementToPDF(
                      "printable-modul-area",
                      `GuruJagoan_${activeSubDoc}_${data.mataPelajaran}.pdf`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={14} /> Cetak
                </button>
              </div>
            </div>

            {isGeneratingExtra && (
              <div className="flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 rounded-2xl text-xs font-bold">
                <Loader2 size={16} className="animate-spin" />
                <span>
                  AI sedang menyusun perangkat pendukung untuk topik &quot;
                  {data.topikPembelajaran || data.mataPelajaran}&quot;...
                </span>
              </div>
            )}
          </div>

          {/* Printable A4 Sheet */}
          <div className="overflow-x-auto pb-8">
            <div
              id="printable-modul-area"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              className={cn(
                "w-[210mm] max-w-full mx-auto bg-white px-[2cm] py-[2cm] shadow-xl rounded-2xl min-h-[297mm] text-slate-900 text-[11.5pt] leading-[1.55]",
                isEditing && "ring-4 ring-amber-400/50"
              )}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {/* HEADER DOKUMEN */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
                <h1 className="text-[15pt] font-black uppercase tracking-tight text-slate-900">
                  {activeSubDoc === "modul"
                    ? "RENCANA PELAKSANAAN PEMBELAJARAN (RPP) / MODUL AJAR"
                    : subDocTabs
                        .find((x) => x.id === activeSubDoc)
                        ?.label.toUpperCase()}
                </h1>
                <p className="text-[11pt] font-extrabold text-purple-700 uppercase tracking-widest mt-0.5">
                  PENDEKATAN PEMBELAJARAN MENDALAM (DEEP LEARNING)
                </p>
                <h2 className="text-[13pt] font-bold text-slate-800 mt-1">
                  {data.namaSekolah || "SATUAN PENDIDIKAN"}
                </h2>
              </div>

              {/* TABEL IDENTITAS UMUM */}
              <table className="w-full text-[11pt] mb-6 border-collapse">
                <tbody>
                  <tr>
                    <td className="py-1 px-2 font-bold w-1/4 border border-slate-300 bg-slate-50">
                      Nama Penyusun
                    </td>
                    <td className="py-1 px-2 border border-slate-300 w-1/4">
                      {data.namaGuru || "-"}
                      {data.nipGuru ? ` (NIP. ${data.nipGuru})` : ""}
                    </td>
                    <td className="py-1 px-2 font-bold w-1/4 border border-slate-300 bg-slate-50">
                      Mata Pelajaran
                    </td>
                    <td className="py-1 px-2 border border-slate-300 w-1/4">
                      {data.mataPelajaran}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-bold border border-slate-300 bg-slate-50">
                      Jenjang / Kelas / Fase
                    </td>
                    <td className="py-1 px-2 border border-slate-300">
                      {data.level} / Kelas {data.kelas} (Fase {data.fase})
                    </td>
                    <td className="py-1 px-2 font-bold border border-slate-300 bg-slate-50">
                      Alokasi Waktu
                    </td>
                    <td className="py-1 px-2 border border-slate-300">
                      {data.alokasiWaktu}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-bold border border-slate-300 bg-slate-50">
                      Topik Pembelajaran
                    </td>
                    <td className="py-1 px-2 border border-slate-300" colSpan={3}>
                      <strong>{data.topikPembelajaran || "-"}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* KONTEN UTAMA RPP PEMBELAJARAN MENDALAM */}
              {activeSubDoc === "modul" && (
                <div className="space-y-6">
                  {/* A. IDENTIFIKASI */}
                  <section className="space-y-2">
                    <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                      A. IDENTIFIKASI PEMBELAJARAN
                    </h3>
                    <table className="w-full text-[11pt] border-collapse">
                      <tbody>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold w-1/3 bg-slate-50">
                            1. Kesiapan & Karakteristik Peserta Didik
                          </td>
                          <td className="p-2 border border-slate-300">
                            <p className="mb-1">{data.pesertaDidikAI || "-"}</p>
                            <p className="text-slate-700">
                              {data.identifikasiKesiapanAI}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            2. Karakteristik Materi Pelajaran
                          </td>
                          <td className="p-2 border border-slate-300 space-y-1">
                            <p>
                              <strong>Jenis Pengetahuan:</strong>{" "}
                              {data.materiPembelajaranAI.jenisPengetahuan || "-"}
                            </p>
                            <p>
                              <strong>Relevansi Kehidupan Nyata:</strong>{" "}
                              {data.materiPembelajaranAI.relevansi || "-"}
                            </p>
                            <p>
                              <strong>Struktur & Tingkat Kesulitan:</strong>{" "}
                              {data.materiPembelajaranAI.strukturMateri}{" "}
                              ({data.materiPembelajaranAI.tingkatKesulitan})
                            </p>
                            <p>
                              <strong>Integrasi Nilai & Karakter:</strong>{" "}
                              {data.materiPembelajaranAI.integrasiNilaiKarakter}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            3. Dimensi Profil Lulusan
                          </td>
                          <td className="p-2 border border-slate-300 font-semibold text-purple-900">
                            {data.dimensiProfil.join(", ") || "-"}
                            {data.institutionType === "Madrasah" &&
                              data.pancaCinta.length > 0 && (
                                <div className="mt-1 text-emerald-800">
                                  <strong>Panca Cinta Madrasah:</strong>{" "}
                                  {data.pancaCinta.join(", ")}
                                </div>
                              )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  {/* B. DESAIN PEMBELAJARAN */}
                  <section className="space-y-2">
                    <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                      B. DESAIN PEMBELAJARAN
                    </h3>
                    <table className="w-full text-[11pt] border-collapse">
                      <tbody>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold w-1/3 bg-slate-50">
                            1. Capaian Pembelajaran (CP)
                          </td>
                          <td className="p-2 border border-slate-300">
                            {data.capaianPembelajaran || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            2. Tujuan Pembelajaran (TP)
                          </td>
                          <td className="p-2 border border-slate-300 whitespace-pre-line">
                            {data.tujuanPembelajaranAI || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            3. Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                          </td>
                          <td className="p-2 border border-slate-300 whitespace-pre-line">
                            {data.kktpAI || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            4. Topik, Pemahaman Bermakna & Pertanyaan Pemantik
                          </td>
                          <td className="p-2 border border-slate-300 space-y-1">
                            <p>
                              <strong>Pemahaman Bermakna:</strong>{" "}
                              {data.pemahamanBermaknaAI || "-"}
                            </p>
                            <p>
                              <strong>Pertanyaan Pemantik:</strong>{" "}
                              {data.pertanyaanPemantikAI || "-"}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            5. Lintas Disiplin Ilmu & Insersi Isu Nasional
                          </td>
                          <td className="p-2 border border-slate-300 space-y-1">
                            <p>
                              <strong>Lintas Disiplin Ilmu:</strong>{" "}
                              {[
                                ...data.lintasDisiplinIlmu,
                                ...(data.lintasDisiplinLainnya
                                  ? [data.lintasDisiplinLainnya]
                                  : []),
                              ].join(", ") || "-"}
                            </p>
                            <p>
                              <strong>Insersi Isu Prioritas Nasional:</strong>{" "}
                              {[
                                ...data.isuPrioritas,
                                ...(data.isuPrioritasLainnya
                                  ? [data.isuPrioritasLainnya]
                                  : []),
                              ].join(", ") || "-"}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-300 font-bold bg-slate-50">
                            6. Praktik Pedagogis, Lingkungan, Kemitraan & Digital
                          </td>
                          <td className="p-2 border border-slate-300 space-y-1">
                            <p>
                              <strong>Model & Pendekatan:</strong>{" "}
                              {data.praktikPedagogis.modelPembelajaran} |{" "}
                              {data.praktikPedagogis.pendekatanPembelajaran}
                            </p>
                            <p>
                              <strong>Metode & Strategi:</strong>{" "}
                              {data.praktikPedagogis.metodePembelajaran} |{" "}
                              {data.praktikPedagogis.strategiPembelajaran}
                            </p>
                            <p>
                              <strong>Kemitraan Pembelajaran:</strong>{" "}
                              {data.kemitraanAI || "-"}
                            </p>
                            <p>
                              <strong>Lingkungan Belajar:</strong>{" "}
                              {data.lingkunganAI || "-"}
                            </p>
                            <p>
                              <strong>Pemanfaatan Digital:</strong>{" "}
                              {data.pemanfaatanDigitalAI || "-"}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  {/* C. PENGALAMAN BELAJAR (PERTEMUAN) */}
                  <section className="space-y-3">
                    <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                      C. PENGALAMAN BELAJAR (BERKESADARAN, BERMAKNA, MENGGEMBIRAKAN)
                    </h3>
                    {data.pertemuan.length > 0 ? (
                      data.pertemuan.map((p, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-300 rounded-lg overflow-hidden mb-4 break-inside-avoid"
                        >
                          <div className="bg-purple-100 px-3 py-2 font-black text-purple-950 border-b border-slate-300">
                            PERTEMUAN KE-{p.pertemuanKe}
                          </div>
                          <table className="w-full text-[11pt] border-collapse">
                            <tbody>
                              <tr>
                                <td className="p-2.5 border-b border-r border-slate-300 font-bold w-1/4 bg-slate-50">
                                  1. Kegiatan Awal (Pendahuluan)
                                </td>
                                <td className="p-2.5 border-b border-slate-300 whitespace-pre-line">
                                  {p.kegiatanAwal}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 border-b border-r border-slate-300 font-bold bg-purple-50/50">
                                  2. Kegiatan Inti
                                  <div className="text-[9.5pt] font-normal text-purple-700 mt-1">
                                    Sintaks Deep Learning & Insersi Isu Nasional
                                  </div>
                                </td>
                                <td className="p-2.5 border-b border-slate-300 space-y-2.5">
                                  <div>
                                    <p className="font-bold text-purple-900 underline">
                                      a. Memahami (Berkesadaran & Bermakna):
                                    </p>
                                    <p className="whitespace-pre-line">
                                      {p.kegiatanInti.memahami}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-indigo-900 underline">
                                      b. Mengaplikasi (Bermakna & Menggembirakan):
                                    </p>
                                    <p className="whitespace-pre-line">
                                      {p.kegiatanInti.mengaplikasi}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-pink-900 underline">
                                      c. Merefleksi (Berkesadaran & Metakognitif):
                                    </p>
                                    <p className="whitespace-pre-line">
                                      {p.kegiatanInti.merefleksi}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2.5 border-r border-slate-300 font-bold bg-slate-50">
                                  3. Kegiatan Akhir (Penutup)
                                </td>
                                <td className="p-2.5 whitespace-pre-line">
                                  {p.kegiatanAkhir}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))
                    ) : (
                      <p className="italic text-slate-500 p-4 border border-dashed border-slate-300 text-center">
                        Belum ada data pertemuan. Silakan klik tombol Generate di tab Form Penyusunan.
                      </p>
                    )}
                  </section>

                  {/* D. ASESMEN PEMBELAJARAN & RUBRIK */}
                  <section className="space-y-4">
                    <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                      D. ASESMEN PEMBELAJARAN & RUBRIK PENILAIAN
                    </h3>
                    <div className="p-3 border border-slate-300 bg-slate-50/50">
                      <p className="font-bold mb-1">
                        Teknik & Instrumen Asesmen ({data.asesmenCheckboxes.join(", ")}):
                      </p>
                      <p className="whitespace-pre-line">
                        {data.asesmenAI.teknikInstrumen || "-"}
                      </p>
                    </div>

                    {[
                      {
                        title: "1. Rubrik Penilaian Umum / Kinerja",
                        rows: data.asesmenAI.rubrikAsesmen,
                      },
                      {
                        title: "2. Rubrik Asesmen Kognitif",
                        rows: data.asesmenAI.rubrikKognitif,
                      },
                      {
                        title: "3. Rubrik Ketercapaian Dimensi Profil Lulusan",
                        rows: data.asesmenAI.rubrikProfilLulusan,
                      },
                    ].map(
                      (rub, rIdx) =>
                        rub.rows &&
                        rub.rows.length > 0 && (
                          <div key={rIdx} className="break-inside-avoid">
                            <p className="font-bold text-[11pt] mb-1.5">
                              {rub.title}
                            </p>
                            <table className="w-full text-[10pt] border-collapse border border-slate-400">
                              <thead>
                                <tr className="bg-slate-200">
                                  <th className="border border-slate-400 p-2 w-1/5">
                                    Kriteria
                                  </th>
                                  <th className="border border-slate-400 p-2 w-1/5">
                                    Sangat Baik (4)
                                  </th>
                                  <th className="border border-slate-400 p-2 w-1/5">
                                    Baik (3)
                                  </th>
                                  <th className="border border-slate-400 p-2 w-1/5">
                                    Cukup (2)
                                  </th>
                                  <th className="border border-slate-400 p-2 w-1/5">
                                    Perlu Bimbingan (1)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {rub.rows.map((r, i) => (
                                  <tr key={i}>
                                    <td className="border border-slate-400 p-2 font-bold">
                                      {r.kriteria}
                                    </td>
                                    <td className="border border-slate-400 p-2">
                                      {r.sangatBaik}
                                    </td>
                                    <td className="border border-slate-400 p-2">
                                      {r.baik}
                                    </td>
                                    <td className="border border-slate-400 p-2">
                                      {r.cukup}
                                    </td>
                                    <td className="border border-slate-400 p-2">
                                      {r.perluBimbingan}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                    )}
                  </section>

                  {/* E. REMEDIAL, PENGAYAAN & LAMPIRAN LKPD */}
                  {data.remidialDanPengayaanAI && (
                    <section className="space-y-2 break-inside-avoid">
                      <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                        E. PENGAYAAN DAN REMEDIAL
                      </h3>
                      <div className="p-3 border border-slate-300 whitespace-pre-line">
                        {data.remidialDanPengayaanAI}
                      </div>
                    </section>
                  )}

                  {data.lkpdAI && (
                    <section className="space-y-2 break-inside-avoid">
                      <h3 className="bg-slate-900 text-white px-3 py-1.5 text-[11.5pt] font-bold uppercase">
                        F. LAMPIRAN LEMBAR KERJA PESERTA DIDIK (LKPD)
                      </h3>
                      <div className="p-3 border border-slate-300 whitespace-pre-line">
                        {data.lkpdAI}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* RENDER 8 SUB-DOKUMEN PENDUKUNG */}
              {activeSubDoc === "lkpd" && extraDocs.lkpd && (
                <div className="space-y-5">
                  <div className="border-2 border-dashed border-slate-400 p-4 rounded-xl">
                    <p>Nama Siswa / Kelompok : ..............................................................</p>
                    <p>Kelas / Hari, Tanggal : {data.kelas} / ...............................................</p>
                  </div>
                  <div>
                    <h4 className="font-bold underline mb-1">A. Tujuan Kegiatan:</h4>
                    <ul className="list-disc pl-6">
                      {extraDocs.lkpd.tujuan?.map((x: string, i: number) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold underline mb-1">B. Alat dan Bahan:</h4>
                    <ul className="list-disc pl-6">
                      {extraDocs.lkpd.alatBahan?.map((x: string, i: number) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold underline mb-1">C. Langkah Kerja Eksplorasi:</h4>
                    <ol className="list-decimal pl-6 space-y-1">
                      {extraDocs.lkpd.langkahKerja?.map((x: string, i: number) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-bold underline mb-2">D. Pertanyaan Diskusi & Evaluasi Mandiri:</h4>
                    {extraDocs.lkpd.soalLatihan?.map((s: string, i: number) => (
                      <div key={i} className="mb-4">
                        <p className="font-semibold">
                          {i + 1}. {s}
                        </p>
                        <div className="h-14 border-b border-dotted border-slate-400 mt-2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubDoc === "ringkasan" && extraDocs.ringkasan && (
                <div className="space-y-5">
                  <div className="p-4 border-2 border-indigo-200 bg-indigo-50/40 rounded-xl text-center">
                    <p className="font-bold text-indigo-900 mb-1">Alur Peta Konsep:</p>
                    <p className="font-semibold text-indigo-700">
                      {extraDocs.ringkasan.petaKonsep?.join(" ➔ ")}
                    </p>
                  </div>
                  <table className="w-full border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 p-2 w-1/4">Sub-Topik</th>
                        <th className="border border-slate-400 p-2">Uraian Materi Lengkap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraDocs.ringkasan.isiMateri?.map((m: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-slate-400 p-3 font-bold">
                            {m.subjudul}
                          </td>
                          <td className="border border-slate-400 p-3 text-justify">
                            {m.konten}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 bg-slate-100 border-l-4 border-slate-800">
                    <strong>Intisari / Kesimpulan:</strong>{" "}
                    {extraDocs.ringkasan.kesimpulan}
                  </div>
                </div>
              )}

              {activeSubDoc === "icebreaker" && extraDocs.icebreaker && (
                <table className="w-full border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-400 p-2 w-12">No</th>
                      <th className="border border-slate-400 p-2 w-1/4">Nama Icebreaker</th>
                      <th className="border border-slate-400 p-2 w-24">Durasi</th>
                      <th className="border border-slate-400 p-2">Langkah Permainan & Kaitan Materi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraDocs.icebreaker.kegiatan?.map((k: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-slate-400 p-2 text-center">
                          {i + 1}
                        </td>
                        <td className="border border-slate-400 p-2 font-bold">
                          {k.nama}
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          {k.durasi}
                        </td>
                        <td className="border border-slate-400 p-2">
                          {k.caraBermain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeSubDoc === "rubrik" && extraDocs.rubrik && (
                <table className="w-full border-collapse border border-slate-400 text-[10.5pt]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-400 p-2">Aspek / Kriteria</th>
                      <th className="border border-slate-400 p-2">Sangat Baik (4)</th>
                      <th className="border border-slate-400 p-2">Baik (3)</th>
                      <th className="border border-slate-400 p-2">Cukup (2)</th>
                      <th className="border border-slate-400 p-2">Perlu Bimbingan (1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraDocs.rubrik.kriteria?.map((k: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-slate-400 p-2 font-bold">
                          {k.namaKriteria}
                        </td>
                        <td className="border border-slate-400 p-2">{k.skor4}</td>
                        <td className="border border-slate-400 p-2">{k.skor3}</td>
                        <td className="border border-slate-400 p-2">{k.skor2}</td>
                        <td className="border border-slate-400 p-2">{k.skor1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeSubDoc === "roleplay" && extraDocs.roleplay && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-300">
                    <p>
                      <strong>Pemeran / Karakter:</strong>{" "}
                      {extraDocs.roleplay.karakter?.join(", ")}
                    </p>
                    <p>
                      <strong>Latar Situasi:</strong> {extraDocs.roleplay.latar}
                    </p>
                  </div>
                  <table className="w-full border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 p-2 w-1/5">Tokoh</th>
                        <th className="border border-slate-400 p-2 w-1/4">Ekspresi / Aksi</th>
                        <th className="border border-slate-400 p-2">Dialog</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraDocs.roleplay.naskah?.map((n: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-slate-400 p-2 font-bold">
                            {n.tokoh}
                          </td>
                          <td className="border border-slate-400 p-2 italic">
                            {n.instruksiAksi}
                          </td>
                          <td className="border border-slate-400 p-2">
                            &ldquo;{n.dialog}&rdquo;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-700">
                    <strong>Refleksi & Pesan Moral:</strong>{" "}
                    {extraDocs.roleplay.pesanMoral}
                  </div>
                </div>
              )}

              {activeSubDoc === "presentasi" && extraDocs.presentasi && (
                <div className="space-y-4">
                  {extraDocs.presentasi.slide?.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 border border-slate-300 rounded-xl break-inside-avoid"
                    >
                      <h4 className="font-bold text-purple-900 border-b border-slate-200 pb-1 mb-2">
                        Slide {s.nomorSlide}: {s.judulSlide}
                      </h4>
                      <ul className="list-disc pl-6 mb-2">
                        {s.poinPenting?.map((p: string, j: number) => (
                          <li key={j}>{p}</li>
                        ))}
                      </ul>
                      <p className="text-xs italic text-slate-600 bg-slate-100 p-2 rounded">
                        <strong>Visual / Media:</strong> {s.saranVisual}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeSubDoc === "miskonsepsi" && extraDocs.miskonsepsi && (
                <div className="space-y-4">
                  {extraDocs.miskonsepsi.daftarMiskonsepsi?.map(
                    (m: any, i: number) => (
                      <div
                        key={i}
                        className="border border-rose-200 rounded-xl overflow-hidden break-inside-avoid"
                      >
                        <div className="bg-rose-50 px-4 py-2 font-bold text-rose-900 border-b border-rose-200 flex items-center gap-2">
                          <AlertCircle size={16} /> Miskonsepsi #{i + 1}:{" "}
                          {m.konsepSalah}
                        </div>
                        <div className="p-4 space-y-2">
                          <p>
                            <strong className="text-emerald-700">
                              Konsep Ilmiah yang Benar:
                            </strong>{" "}
                            {m.penjelasanBenar}
                          </p>
                          <p>
                            <strong className="text-amber-700">
                              Strategi Mengatasi di Kelas:
                            </strong>{" "}
                            {m.caraMengatasi}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {activeSubDoc === "surat" && extraDocs.surat && (
                <div className="space-y-4">
                  <p className="text-right">
                    {data.kota}, {data.tanggal}
                  </p>
                  <p>
                    <strong>Perihal:</strong> {extraDocs.surat.perihal}
                  </p>
                  <p className="whitespace-pre-line">
                    {extraDocs.surat.salamPembuka}
                  </p>
                  <p className="text-justify">{extraDocs.surat.isiInformasi}</p>
                  <div>
                    <p className="font-bold mb-1">
                      Pendampingan & Aktivitas Bersama Orang Tua di Rumah:
                    </p>
                    <ul className="list-disc pl-6">
                      {extraDocs.surat.saranKegiatanRumah?.map(
                        (s: string, i: number) => <li key={i}>{s}</li>
                      )}
                    </ul>
                  </div>
                  <p className="whitespace-pre-line">
                    {extraDocs.surat.salamPenutup}
                  </p>
                </div>
              )}

              {/* BLOK TANDA TANGAN */}
              <div className="mt-14 pt-6 break-inside-avoid">
                <table className="w-full border-none text-center text-[11pt]">
                  <tbody className="border-none">
                    <tr className="border-none">
                      <td className="w-1/2 border-none">
                        <p>Mengetahui,</p>
                        <p>Kepala {data.namaSekolah || data.institutionType}</p>
                        <div className="h-20"></div>
                        <p className="font-bold underline">
                          {data.namaKepalaSekolah ||
                            ".................................................."}
                        </p>
                        <p>
                          NIP.{" "}
                          {data.nipKepalaSekolah ||
                            "........................................"}
                        </p>
                      </td>
                      <td className="w-1/2 border-none">
                        <p>
                          {data.kota || "................"},{" "}
                          {data.tanggal || "......................"}
                        </p>
                        <p>Guru Mata Pelajaran,</p>
                        <div className="h-20"></div>
                        <p className="font-bold underline">
                          {data.namaGuru ||
                            ".................................................."}
                        </p>
                        <p>
                          NIP.{" "}
                          {data.nipGuru ||
                            "........................................"}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
