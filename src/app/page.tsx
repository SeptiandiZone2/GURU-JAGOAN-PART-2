"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  BookOpen,
  Wand2,
  Lightbulb,
  ClipboardList,
  LayoutDashboard,
  UserCheck,
  LogOut,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
  School,
  ArrowRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_USERS, KELAS_BY_LEVEL, SUBJECTS } from "@/constants";
import { Level, TeacherProfile, UserAccount } from "@/types";
import { registerGoogleAuthModalListener } from "@/lib/geminiService";
import ModulAjarModule from "@/components/ModulAjarModule";
import KktpModule from "@/components/KktpModule";
import SoalModule from "@/components/SoalModule";
import ProyekModule from "@/components/ProyekModule";
import AdministrasiModule from "@/components/AdministrasiModule";
import GoogleAuthModal from "@/components/GoogleAuthModal";

type ActiveMenu =
  | "dashboard"
  | "modul-pm"
  | "kktp"
  | "soal"
  | "proyek"
  | "administrasi"
  | "admin-users";

const DEFAULT_PROFILE: TeacherProfile = {
  namaGuru: "",
  nipGuru: "",
  namaSekolah: "",
  namaKepalaSekolah: "",
  nipKepalaSekolah: "",
  institutionType: "Sekolah",
  level: "SD",
  kelas: "1",
  fase: "A",
  mataPelajaran: "Bahasa Indonesia",
  tahunPelajaran: "2026/2027",
  semester: "Ganjil",
  kota: "Jakarta",
  tanggal: new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
};

const GoogleLogoSVG = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

export default function HomePage() {
  // Auth State
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showUsernameLogin, setShowUsernameLogin] = useState(false);
  const [authError, setAuthError] = useState("");

  // Google Auth Modal & Auto-Gate Promise Ref
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalReason, setGoogleModalReason] = useState(
    "Pilih Akun Google Anda untuk mengaktifkan AI secara otomatis tanpa perlu memasukkan API Key."
  );
  const pendingAuthPromise = useRef<{
    resolve: (u: UserAccount) => void;
    reject: (e: Error) => void;
  } | null>(null);

  // Navigation & Global Modals
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("dashboard");
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = localStorage.getItem("guruJagoan_users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(DEFAULT_USERS);
      }
    } else {
      localStorage.setItem("guruJagoan_users", JSON.stringify(DEFAULT_USERS));
    }

    const storedCurrent = localStorage.getItem("guruJagoan_currentUser");
    if (storedCurrent) {
      try {
        const parsedUser: UserAccount = JSON.parse(storedCurrent);
        if (parsedUser && (parsedUser.isGoogleAuth || parsedUser.email)) {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem("guruJagoan_currentUser");
          setShowGoogleModal(true);
        }
      } catch {
        setShowGoogleModal(true);
      }
    } else {
      // Otomatis tampilkan jendela Login & Persetujuan Google saat pertama kali membuka aplikasi
      setShowGoogleModal(true);
    }

    const storedProfile = localStorage.getItem("guruJagoan_profile");
    if (storedProfile) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) });
      } catch {
        // ignore
      }
    }
  }, []);

  // Register automatic Google Auth listener when user clicks any Generate AI button
  useEffect(() => {
    registerGoogleAuthModalListener((resolve, reject) => {
      pendingAuthPromise.current = { resolve, reject };
      setGoogleModalReason(
        "Untuk memproses pembuatan Soal / Perangkat Ajar AI secara otomatis (tanpa API Key), silakan masuk dengan Akun Google Anda terlebih dahulu."
      );
      setShowGoogleModal(true);
    });
    return () => registerGoogleAuthModalListener(null);
  }, []);

  const handleGoogleLoginSuccess = (googleUser: UserAccount) => {
    setCurrentUser(googleUser);
    localStorage.setItem("guruJagoan_currentUser", JSON.stringify(googleUser));
    setShowGoogleModal(false);

    // Otomatis isi nama guru di profil jika masih kosong
    setProfile((prev) => {
      const updated = {
        ...prev,
        namaGuru: prev.namaGuru || googleUser.username,
      };
      localStorage.setItem("guruJagoan_profile", JSON.stringify(updated));
      return updated;
    });

    // Jika login ini dipicu otomatis saat klik tombol Generate AI, langsung lanjutkan proses AI!
    if (pendingAuthPromise.current) {
      pendingAuthPromise.current.resolve(googleUser);
      pendingAuthPromise.current = null;
    }
  };

  const handleGoogleModalClose = () => {
    setShowGoogleModal(false);
    if (pendingAuthPromise.current) {
      pendingAuthPromise.current.reject(
        new Error(
          "Login Google dibatalkan. Silakan login dengan Akun Google untuk melanjutkan pembuatan dokumen AI."
        )
      );
      pendingAuthPromise.current = null;
    }
  };

  const handleUsernameLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = users.find(
      (x) => x.username === username.trim() && x.password === password
    );
    if (u) {
      if (u.status === "pending") {
        setAuthError("Akun Anda sedang menunggu persetujuan Admin.");
      } else {
        setCurrentUser(u);
        localStorage.setItem("guruJagoan_currentUser", JSON.stringify(u));
        setAuthError("");
      }
    } else {
      setAuthError("Username atau Password tidak sesuai.");
    }
  };

  const handleEnterAsGuest = () => {
    const guestUser: UserAccount = {
      username: "Guru Tamu (Belum Login Google)",
      role: "demo",
      status: "active",
      isGoogleAuth: false,
    };
    setCurrentUser(guestUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("guruJagoan_currentUser");
    setUsername("");
    setPassword("");
    setActiveMenu("dashboard");
  };

  const handleApproveUser = (targetUsername: string) => {
    const updated = users.map((u) =>
      u.username === targetUsername ? { ...u, status: "active" as const } : u
    );
    setUsers(updated);
    localStorage.setItem("guruJagoan_users", JSON.stringify(updated));
  };

  const handleDeleteUser = (targetUsername: string) => {
    const updated = users.filter((u) => u.username !== targetUsername);
    setUsers(updated);
    localStorage.setItem("guruJagoan_users", JSON.stringify(updated));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("guruJagoan_profile", JSON.stringify(profile));
    setShowProfileModal(false);
  };

  // --- LOGIN VIEW ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/85 backdrop-blur-2xl border border-white shadow-2xl rounded-[2.5rem] p-8 text-center space-y-5">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl mx-auto flex items-center justify-center text-white text-5xl font-black italic shadow-lg shadow-indigo-200">
              G
            </div>
            <div>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">
                GURU JAGOAN AI 2.0 🚀
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1">
                SuperApp RPP Pembelajaran Mendalam • KKTP SOLO • Soal HOTS • Administrasi Guru
              </p>
            </div>

            {/* TOMBOL UTAMA: LOGIN & PERSETUJUAN GOOGLE OTOMATIS (TANPA API KEY) */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-xs text-indigo-950 font-semibold leading-relaxed text-left space-y-1">
                <p className="font-black text-indigo-800 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
                  Autentikasi Resmi Akun Google (OAuth 2.0)
                </p>
                <p className="text-[11px] text-slate-600">
                  Silakan login menggunakan Akun Google / belajar.id Anda terlebih dahulu dan setujui akses langsung dari Google untuk mengaktifkan seluruh fitur AI secara otomatis tanpa API Key.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGoogleModalReason(
                    "Pilih Akun Google Anda dan klik 'Setujui & Izinkan Akses' untuk mengaktifkan seluruh fitur AI tanpa perlu memasukkan API Key."
                  );
                  setShowGoogleModal(true);
                }}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-indigo-200/70 flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5"
              >
                <div className="p-1.5 bg-white rounded-lg flex items-center justify-center">
                  <GoogleLogoSVG />
                </div>
                <span>Login & Setujui dengan Akun Google</span>
              </button>

              <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Disetujui Langsung oleh Google • Tanpa Input API Key
              </p>
            </div>

            {/* OPSI ADMIN USERNAME */}
            <div className="pt-2 border-t border-slate-200/70">
              <button
                type="button"
                onClick={() => setShowUsernameLogin(!showUsernameLogin)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 block w-full pt-1"
              >
                {showUsernameLogin
                  ? "Sembunyikan Login Admin"
                  : "Atau masuk dengan Akun Admin Sekolah"}
              </button>
            </div>

            {showUsernameLogin && (
              <form
                onSubmit={handleUsernameLogin}
                className="space-y-3 pt-2 border-t border-slate-100 text-left"
              >
                <input
                  type="text"
                  placeholder="Username (contoh: Septa18)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-center text-xs"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-center text-xs"
                />
                {authError && (
                  <p className="text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-xl text-center">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Masuk dengan Username
                </button>
              </form>
            )}
          </div>
        </div>

        <footer className="text-center text-xs text-slate-500 font-semibold mt-6">
          <p>
            &copy; 2026 Guru Jagoan AI v2.0 • Kurikulum Nasional & Pembelajaran Mendalam • Made by Dede Septiandi
          </p>
        </footer>

        <GoogleAuthModal
          isOpen={showGoogleModal}
          reason={googleModalReason}
          onSuccess={handleGoogleLoginSuccess}
          onClose={handleGoogleModalClose}
        />
      </div>
    );
  }

  const isGoogleConnected = Boolean(
    currentUser.isGoogleAuth || currentUser.email
  );

  const navItems: {
    id: ActiveMenu;
    label: string;
    shortLabel: string;
    icon: any;
    badge?: string;
    color: string;
  }[] = [
    {
      id: "dashboard",
      label: "Beranda Utama",
      shortLabel: "Beranda",
      icon: LayoutDashboard,
      color: "from-slate-700 to-slate-900",
    },
    {
      id: "modul-pm",
      label: "RPP & Modul Ajar Deep Learning",
      shortLabel: "RPP / Modul PM",
      icon: BrainCircuit,
      badge: "Insersi Isu + 8 Dok",
      color: "from-purple-600 to-pink-600",
    },
    {
      id: "kktp",
      label: "KKTP Kurikulum Nasional",
      shortLabel: "KKTP (SOLO)",
      icon: BookOpen,
      badge: "Taksonomi SOLO",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "soal",
      label: "Racik Soal & Kartu Soal AI",
      shortLabel: "Racik Soal AI",
      icon: Wand2,
      badge: "HOTS & Kisi",
      color: "from-indigo-600 to-purple-600",
    },
    {
      id: "proyek",
      label: "Projek Kokurikuler / P5",
      shortLabel: "Projek P5",
      icon: Lightbulb,
      badge: "8 Profil Lulusan",
      color: "from-orange-500 to-rose-600",
    },
    {
      id: "administrasi",
      label: "ATP, Prota, Promes & Jurnal",
      shortLabel: "Administrasi Guru",
      icon: ClipboardList,
      badge: "5 Dokumen",
      color: "from-emerald-600 to-teal-700",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <button
            onClick={() => setActiveMenu("dashboard")}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 tracking-tight">
                  GURU JAGOAN AI
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                  v2.0 Next.js
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                {profile.namaSekolah
                  ? `${profile.namaSekolah} • ${profile.mataPelajaran} (${profile.level} Kelas ${profile.kelas})`
                  : "SuperApp Administrasi Guru & Kurikulum Nasional Terbaru"}
              </p>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center gap-1.5 border border-indigo-200/60 transition-all"
            >
              <School size={15} />
              <span className="hidden md:inline">Identitas Guru & Sekolah</span>
            </button>

            {/* Status Akun Google (Tanpa Perlu Tombol API Key) */}
            {isGoogleConnected ? (
              <button
                onClick={() => {
                  setGoogleModalReason("Ganti Akun Google yang terhubung:");
                  setShowGoogleModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-2 transition-all"
                title={`Terhubung sebagai ${currentUser.email}`}
              >
                <GoogleLogoSVG />
                <div className="text-left hidden sm:block">
                  <p className="text-[11px] font-black leading-none text-slate-800">
                    {currentUser.username}
                  </p>
                  <p className="text-[9px] font-semibold text-emerald-700">
                    {currentUser.email} • AI Aktif
                  </p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setGoogleModalReason(
                    "Hubungkan Akun Google Anda agar dapat langsung membuat Soal, RPP, KKTP, dan Administrasi AI tanpa API Key."
                  );
                  setShowGoogleModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-indigo-200 text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all"
              >
                <GoogleLogoSVG />
                <span>Login Google</span>
              </button>
            )}

            {currentUser.role === "admin" && (
              <button
                onClick={() => setActiveMenu("admin-users")}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center gap-1.5 border border-purple-200"
              >
                <Users size={15} />
                <span className="hidden lg:inline">Kelola User</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition-all",
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  )}
                >
                  <Icon size={15} />
                  <span>{item.shortLabel}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-black",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeMenu === "dashboard" && (
          <div className="space-y-8">
            {/* Hero Welcome Card */}
            <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/15">
                  <Sparkles size={14} /> Bebas Tanpa Input API Key • Terintegrasi Login Google
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Selamat Datang, {profile.namaGuru || currentUser.username}! 🎓
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
                  Seluruh aplikasi Anda kini telah menyatu dalam satu ekosistem{" "}
                  <strong>Guru Jagoan AI v2.0</strong>: cukup gunakan{" "}
                  <strong>Akun Google Anda</strong> (tanpa perlu repot memasukkan API Key) untuk membuat{" "}
                  <strong>RPP Pembelajaran Mendalam & Insersi Isu Nasional</strong>,{" "}
                  <strong>Generator KKTP Taksonomi SOLO</strong>,{" "}
                  <strong>Racik Soal HOTS & Kartu Soal</strong>, hingga{" "}
                  <strong>ATP, Prota, Promes, dan Modul Projek Kokurikuler</strong>.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="px-5 py-3 rounded-2xl bg-white text-indigo-950 font-black text-xs hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
                  >
                    <UserCheck size={16} />
                    Atur Identitas Guru & Sekolah Sekali Saja
                  </button>
                  {!isGoogleConnected && (
                    <button
                      onClick={() => {
                        setGoogleModalReason(
                          "Hubungkan Akun Google Anda agar AI siap digunakan kapan saja tanpa API Key."
                        );
                        setShowGoogleModal(true);
                      }}
                      className="px-5 py-3 rounded-2xl bg-indigo-700/70 hover:bg-indigo-700 text-white border border-indigo-400/40 font-black text-xs transition-all flex items-center gap-2"
                    >
                      <GoogleLogoSVG />
                      Hubungkan Akun Google Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 5 Integrated Feature Cards */}
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-4 px-1">
                Pilih Modul Administrasi & Perangkat Pembelajaran AI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Card 1: RPP / Modul Ajar PM */}
                <button
                  onClick={() => setActiveMenu("modul-pm")}
                  className="bg-white p-7 rounded-3xl border border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                      <BrainCircuit size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                      Kurikulum Nasional • Sekolah & Madrasah
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                      RPP & Modul Ajar Pembelajaran Mendalam ✨
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Dilengkapi sintaks <strong>Memahami, Mengaplikasi, Merefleksi</strong>, 8 Dimensi Profil Lulusan, Panca Cinta Kemenag, Insersi Isu Prioritas Nasional, serta{" "}
                      <strong>8 Perangkat Pendukung</strong> (LKPD, Handout, PPT, Roleplay, Miskonsepsi, Rubrik).
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-purple-700">
                    <span>Buka Generator RPP & Modul</span>
                    <ArrowRight size={16} />
                  </div>
                </button>

                {/* Card 2: KKTP */}
                <button
                  onClick={() => setActiveMenu("kktp")}
                  className="bg-white p-7 rounded-3xl border border-amber-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                      <BookOpen size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      Taksonomi SOLO • Upload CP/ATP & Otomatis
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                      Generator KKTP Kurikulum Nasional ✨
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Susun Kriteria Ketercapaian Tujuan Pembelajaran berbasis{" "}
                      <strong>Taksonomi SOLO</strong> & Deep Learning beserta tabel interval nilai rapor (0-40%, 41-65%, 66-85%, 86-100%). Bisa dari upload file CP/ATP atau otomatis AI!
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-700">
                    <span>Buka Generator KKTP</span>
                    <ArrowRight size={16} />
                  </div>
                </button>

                {/* Card 3: Racik Soal AI */}
                <button
                  onClick={() => setActiveMenu("soal")}
                  className="bg-white p-7 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                      <Wand2 size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                      PG • AKM • Menjodohkan • Esai HOTS
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                      Racik Soal, Kisi-Kisi & Kartu Soal AI ✨
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Buat naskah soal multi-tipe berstandar HOTS (C1-C6), lengkap Kunci Jawaban & Pembahasan, Matriks Kisi-Kisi, Kartu Soal Supervisi, dan Ilustrasi Gambar AI.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-700">
                    <span>Buka Racik Soal AI</span>
                    <ArrowRight size={16} />
                  </div>
                </button>

                {/* Card 4: Projek Kokurikuler / P5 */}
                <button
                  onClick={() => setActiveMenu("proyek")}
                  className="bg-white p-7 rounded-3xl border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                      <Lightbulb size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                      Kokurikuler • 8 Profil Lulusan
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                      Modul Projek Kokurikuler & P5 AI ✨
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Rancang modul projek penguatan profil lulusan & 7 Kebiasaan Anak Indonesia Hebat yang kontekstual lengkap dengan 4 tahapan aksi dan rubrik MB-SB-BSH-SAB.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-orange-700">
                    <span>Buka Generator Projek</span>
                    <ArrowRight size={16} />
                  </div>
                </button>

                {/* Card 5: Administrasi Guru Lengkap */}
                <button
                  onClick={() => setActiveMenu("administrasi")}
                  className="bg-white p-7 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between group md:col-span-2"
                >
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                      <ClipboardList size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Administrasi Supervisi & Akreditasi Lengkap
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                      Generator ATP, PROTA, PROMES, Asesmen Diagnostik & Jurnal Guru ✨
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Susun otomatis seluruh kelengkapan administrasi tahunan dan semesteran guru sesuai Kurikulum Nasional: Alur Tujuan Pembelajaran (ATP), Program Tahunan (PROTA), Program Semester (PROMES), Instrumen Asesmen Diagnostik Kognitif/Non-Kognitif, serta Jurnal Agenda & Refleksi Mengajar.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700">
                    <span>Buka Generator Administrasi Guru</span>
                    <ArrowRight size={16} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMenu === "modul-pm" && (
          <ModulAjarModule
            profile={profile}
            onAlert={(msg) => setAlertMessage(msg)}
          />
        )}

        {activeMenu === "kktp" && (
          <KktpModule
            profile={profile}
            onAlert={(msg) => setAlertMessage(msg)}
          />
        )}

        {activeMenu === "soal" && (
          <SoalModule
            profile={profile}
            onAlert={(msg) => setAlertMessage(msg)}
          />
        )}

        {activeMenu === "proyek" && (
          <ProyekModule
            profile={profile}
            onAlert={(msg) => setAlertMessage(msg)}
          />
        )}

        {activeMenu === "administrasi" && (
          <AdministrasiModule
            profile={profile}
            onAlert={(msg) => setAlertMessage(msg)}
          />
        )}

        {activeMenu === "admin-users" && currentUser.role === "admin" && (
          <div className="bg-white p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-purple-600" /> Panel Admin —
                  Manajemen Akun Pengguna
                </h2>
                <p className="text-xs text-slate-500">
                  Setujui pendaftaran akun guru baru atau kelola akses pengguna.
                </p>
              </div>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 border border-slate-200">Username</th>
                  <th className="p-3 border border-slate-200">Role</th>
                  <th className="p-3 border border-slate-200">Status</th>
                  <th className="p-3 border border-slate-200">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username}>
                    <td className="p-3 border border-slate-200 font-bold">
                      {u.username}
                    </td>
                    <td className="p-3 border border-slate-200 uppercase text-xs font-bold">
                      {u.role}
                    </td>
                    <td className="p-3 border border-slate-200">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 border border-slate-200 space-x-2">
                      {u.status === "pending" && (
                        <button
                          onClick={() => handleApproveUser(u.username)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          Aktifkan
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL LOGIN GOOGLE OTOMATIS */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        reason={googleModalReason}
        onSuccess={handleGoogleLoginSuccess}
        onClose={handleGoogleModalClose}
      />

      {/* MODAL IDENTITAS GURU & SEKOLAH TERPADU */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Profil Identitas Guru & Sekolah Terpadu
                </h3>
                <p className="text-xs text-slate-500">
                  Data ini otomatis tersinkronisasi ke seluruh fitur (RPP, KKTP, Soal, Projek & Administrasi).
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Nama Sekolah / Madrasah
                  </label>
                  <input
                    type="text"
                    value={profile.namaSekolah}
                    onChange={(e) =>
                      setProfile({ ...profile, namaSekolah: e.target.value })
                    }
                    placeholder="Contoh: SMP Negeri 1 / MTsN 1"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Naungan Institusi
                  </label>
                  <select
                    value={profile.institutionType}
                    onChange={(e) => {
                      const inst = e.target.value as "Sekolah" | "Madrasah";
                      const lvl = inst === "Sekolah" ? "SD" : "MI";
                      setProfile({
                        ...profile,
                        institutionType: inst,
                        level: lvl,
                      });
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                  >
                    <option value="Sekolah">Sekolah Umum (Kemendikdasmen)</option>
                    <option value="Madrasah">Madrasah (Kemenag)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Nama Guru & Gelar
                  </label>
                  <input
                    type="text"
                    value={profile.namaGuru}
                    onChange={(e) =>
                      setProfile({ ...profile, namaGuru: e.target.value })
                    }
                    placeholder="Nama Lengkap Guru"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={profile.nipGuru}
                    onChange={(e) =>
                      setProfile({ ...profile, nipGuru: e.target.value })
                    }
                    placeholder="NIP Guru (Opsional)"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={profile.namaKepalaSekolah}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        namaKepalaSekolah: e.target.value,
                      })
                    }
                    placeholder="Nama Lengkap Kepala Sekolah"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={profile.nipKepalaSekolah}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        nipKepalaSekolah: e.target.value,
                      })
                    }
                    placeholder="NIP Kepala Sekolah (Opsional)"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Jenjang Default
                  </label>
                  <select
                    value={profile.level}
                    onChange={(e) => {
                      const lvl = e.target.value as Level;
                      const kls = KELAS_BY_LEVEL[lvl]?.[0] || {
                        value: "1",
                        fase: "A",
                      };
                      setProfile({
                        ...profile,
                        level: lvl,
                        kelas: kls.value,
                        fase: kls.fase,
                        mataPelajaran: SUBJECTS[lvl]?.[0] || "",
                      });
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
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
                    Kelas & Fase Default
                  </label>
                  <select
                    value={profile.kelas}
                    onChange={(e) => {
                      const found = KELAS_BY_LEVEL[profile.level]?.find(
                        (k) => k.value === e.target.value
                      );
                      setProfile({
                        ...profile,
                        kelas: e.target.value,
                        fase: found ? found.fase : profile.fase,
                      });
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                  >
                    {(KELAS_BY_LEVEL[profile.level] || []).map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Mata Pelajaran Utama
                  </label>
                  <input
                    type="text"
                    value={profile.mataPelajaran}
                    onChange={(e) =>
                      setProfile({ ...profile, mataPelajaran: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Kota & Tahun Pelajaran
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={profile.kota}
                      onChange={(e) =>
                        setProfile({ ...profile, kota: e.target.value })
                      }
                      placeholder="Kota"
                      className="w-1/2 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                    />
                    <input
                      type="text"
                      value={profile.tahunPelajaran}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          tahunPelajaran: e.target.value,
                        })
                      }
                      placeholder="2026/2027"
                      className="w-1/2 p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-md"
                >
                  Simpan & Sinkronkan Profil ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-black text-rose-600">Pemberitahuan</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {alertMessage}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs rounded-xl shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
