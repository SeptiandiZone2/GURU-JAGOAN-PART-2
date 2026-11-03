export type InstitutionType = "Sekolah" | "Madrasah";

export type Level =
  | "PAUD"
  | "SD"
  | "SMP"
  | "SMA"
  | "SMK"
  | "RA"
  | "MI"
  | "MTs"
  | "MA"
  | "MAK";

export interface UserAccount {
  username: string;
  email?: string;
  avatar?: string;
  isGoogleAuth?: boolean;
  googleAccessToken?: string;
  password?: string;
  role: "admin" | "user" | "demo";
  status: "active" | "pending";
}

export interface TeacherProfile {
  namaGuru: string;
  nipGuru: string;
  namaSekolah: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  institutionType: InstitutionType;
  level: Level;
  kelas: string;
  fase: string;
  mataPelajaran: string;
  tahunPelajaran: string;
  semester: "Ganjil" | "Genap";
  kota: string;
  tanggal: string;
}

export interface Pertemuan {
  pertemuanKe: number;
  kegiatanAwal: string;
  kegiatanInti: {
    memahami: string;
    mengaplikasi: string;
    merefleksi: string;
  };
  kegiatanAkhir: string;
}

export interface RubrikRow {
  kriteria: string;
  sangatBaik: string;
  baik: string;
  cukup: string;
  perluBimbingan: string;
}

export interface ModulAjarData {
  // A. IDENTIFIKASI
  namaSekolah: string;
  namaGuru: string;
  nipGuru: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  kota: string;
  tanggal: string;
  tahunPelajaran: string;
  kurikulum: string;
  institutionType: InstitutionType;
  level: Level;
  kelas: string;
  fase: string;
  mataPelajaran: string;
  dimensiProfil: string[];
  pancaCinta: string[];
  alokasiWaktu: string;
  materiPembelajaranAI: {
    jenisPengetahuan: string;
    relevansi: string;
    strukturMateri: string;
    tingkatKesulitan: string;
    integrasiNilaiKarakter: string;
  };
  pesertaDidikAI: string;
  identifikasiKesiapanAI: string;

  // B. DESAIN PEMBELAJARAN
  capaianPembelajaran: string;
  lintasDisiplinIlmu: string[];
  lintasDisiplinLainnya: string;
  isuPrioritas: string[];
  isuPrioritasLainnya: string;
  tujuanPembelajaranAI: string;
  kktpAI: string;
  pemahamanBermaknaAI: string;
  pertanyaanPemantikAI: string;
  topikPembelajaran: string;
  modaBelajar: string;
  instruksiTambahan: string;
  praktikPedagogis: {
    modelPembelajaran: string;
    modelLainnya: string;
    pendekatanPembelajaran: string;
    pendekatanLainnya: string;
    metodePembelajaran: string;
    metodeLainnya: string;
    strategiPembelajaran: string;
    strategiLainnya: string;
    strategiAI: string;
    pendekatanAI: string;
    teknikAI: string;
  };
  kemitraanAI: string;
  lingkunganAI: string;
  pemanfaatanDigitalAI: string;
  remidialDanPengayaanAI: string;
  lkpdAI: string;
  daftarPustakaAI: string[];

  // C. PENGALAMAN BELAJAR
  pertemuan: Pertemuan[];

  // D. ASESMEN PEMBELAJARAN
  asesmenAI: {
    teknikInstrumen: string;
    rubrikAsesmen: RubrikRow[];
    rubrikKognitif: RubrikRow[];
    rubrikProfilLulusan: RubrikRow[];
  };
  asesmenCheckboxes: string[];
  asesmenLainnya: string;
}

export interface KKTPItem {
  objective: string;
  criteria: string[];
  soloLevel: string;
  deepLearningAspect: string;
  indicators: string[];
  intervalDeskripsi?: {
    perluBimbingan: string;
    cukup: string;
    baik: string;
    sangatBaik: string;
  };
}

export interface KKTPResult {
  learningObjectives: KKTPItem[];
  summary: string;
}

export interface BlokSoal {
  id: number;
  jenis:
    | "Pilihan Ganda"
    | "Pilihan Ganda Kompleks"
    | "Mencocokkan"
    | "Benar/Salah"
    | "Uraian Singkat"
    | "Esai";
  jumlah: number;
  opsiPG: number;
  kesulitan: "Mudah" | "Sedang" | "Sulit (HOTS)";
  kognitif: string;
}

export interface SoalItem {
  no: number;
  jenis: string;
  pertanyaan: string;
  stimulus?: string;
  opsi: string[];
  image?: string;
}

export interface KisiItem {
  no: number;
  cp: string;
  materi: string;
  indikator: string;
  kognitif: string;
  bentuk: string;
}

export interface KunciItem {
  no: number;
  jenis: string;
  jawaban: string;
  penjelasan: string;
  skor: number;
}
