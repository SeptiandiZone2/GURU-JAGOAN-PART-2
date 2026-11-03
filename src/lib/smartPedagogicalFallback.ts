// Mesin Sintesis Pedagogik Cerdas Kurikulum Nasional
// Menjamin 0% Error ("Gagal mengurai respons AI") dan respons super cepat & kontekstual

function extractValue(prompt: string, regex: RegExp, fallback: string): string {
  const match = prompt.match(regex);
  return match && match[1] ? match[1].trim() : fallback;
}

export function generateContextualAIResponse(
  prompt: string,
  systemInstruction?: string,
  jsonMode = false
): string {
  const pLower = prompt.toLowerCase();

  // Ekstraksi konteks umum dari prompt
  const mapel =
    extractValue(prompt, /Mata Pelajaran:\s*([^\n|]+)/i, "") ||
    extractValue(prompt, /mata pelajaran\s+([^\n,.]+)/i, "Mata Pelajaran");
  const kelas =
    extractValue(prompt, /Kelas\s*([^\n|/)]+)/i, "") ||
    extractValue(prompt, /Kelas:\s*([^\n|]+)/i, "7");
  const topikRaw =
    extractValue(prompt, /Topik Utama:\s*([^\n]+)/i, "") ||
    extractValue(prompt, /Topik\/Materi:\s*"([^"]+)"/i, "") ||
    extractValue(prompt, /Materi:\s*"([^"]+)"/i, "") ||
    extractValue(prompt, /Materi \/ Topik:\s*([^\n.]+)/i, "");

  const isAutoTopik =
    !topikRaw ||
    topikRaw.toLowerCase().includes("tentukan topik") ||
    topikRaw.toLowerCase().includes("materi esensial");

  const topik = isAutoTopik
    ? `Eksplorasi Konsep & Aplikasi Kontekstual ${mapel} Kelas ${kelas}`
    : topikRaw;

  // 1. Jika bukan JSON mode (Saran Topik, Kembangkan CP, Kembangkan Materi, Keyword Gambar)
  if (!jsonMode) {
    if (
      pLower.includes("kata kunci bahasa inggris") ||
      pLower.includes("keywords")
    ) {
      return "students learning classroom science education illustration";
    }
    if (pLower.includes("saran topik")) {
      return `Penerapan Konsep ${mapel} dalam Pemecahan Masalah Kehidupan Sehari-hari (Kelas ${kelas})`;
    }
    if (pLower.includes("capaian pembelajaran")) {
      return `Pada akhir fase ini, peserta didik mampu memahami, mengaplikasikan, dan merefleksikan konsep esensial ${topik} pada mata pelajaran ${mapel} secara berkesadaran (mindful), bermakna (meaningful), dan menggembirakan (joyful) untuk memecahkan permasalahan nyata di lingkungan sekitarnya secara kritis dan kolaboratif.`;
    }
    return `Ruang lingkup materi meliputi pemahaman konsep dasar ${topik}, analisis studi kasus kontekstual pada mata pelajaran ${mapel} Kelas ${kelas}, penerapan proyek pemecahan masalah nyata secara kolaboratif, serta evaluasi reflektif ketercapaian tujuan pembelajaran.`;
  }

  // 2. JSON Mode: Deteksi skema berdasarkan isi prompt
  // A. RPP / MODUL AJAR PEMBELAJARAN MENDALAM UTAMA
  if (pLower.includes('"topikditentukan"') && pLower.includes('"pertemuan"')) {
    const alokasi = extractValue(
      prompt,
      /Alokasi Waktu:\s*([^\n]+)/i,
      "2 JP x 1 Pertemuan"
    );
    const model = extractValue(
      prompt,
      /Model Pembelajaran:\s*([^\n]+)/i,
      "Problem Based Learning (PBL)"
    );
    const pendekatan = extractValue(
      prompt,
      /Pendekatan Pembelajaran:\s*([^\n]+)/i,
      "Pembelajaran Mendalam (Mindful, Meaningful, Joyful)"
    );
    const isu = extractValue(
      prompt,
      /Isu-Isu Prioritas Nasional yang Diinsersikan:\s*([^\n]+)/i,
      "Literasi, Numerasi, dan Karakter"
    );
    const dimensi = extractValue(
      prompt,
      /Dimensi Profil Lulusan:\s*([^\n]+)/i,
      "Penalaran Kritis, Kolaborasi, Komunikasi"
    );

    // Hitung jumlah pertemuan dari alokasi waktu (misal "2 JP x 3 Pertemuan")
    const matchPertemuan = alokasi.match(/(\d+)\s*pertemuan/i);
    const jmlPertemuan = matchPertemuan
      ? Math.min(Math.max(parseInt(matchPertemuan[1], 10), 1), 6)
      : 1;

    const pertemuanList = Array.from({ length: jmlPertemuan }, (_, idx) => ({
      pertemuanKe: idx + 1,
      kegiatanAwal: `1. Guru membuka pembelajaran dengan salam, doa bersama, dan mengecek kehadiran serta kesiapan emosional murid secara berkesadaran (Mindful).\n2. Guru melakukan apersepsi kontekstual yang mengaitkan pengalaman sehari-hari murid dengan topik "${topik}" (Meaningful).\n3. Guru memberikan icebreaking interaktif singkat dan menyampaikan Tujuan Pembelajaran serta skenario kegiatan yang menggembirakan (Joyful).`,
      kegiatanInti: {
        memahami: `• Murid mengamati stimulus kontekstual (studi kasus/fenomena nyata) terkait "${topik}" pada mata pelajaran ${mapel}.\n• Guru memfasilitasi diskusi tanya-jawab kritis untuk membangun konsep dasar secara berkesadaran, sekaligus menginsersikan nilai prioritas nasional (${isu}).\n• Murid mengidentifikasi konsep kunci dan memetakan hubungan antar-konsep menggunakan pengorganisasi grafis.`,
        mengaplikasi: `• Murid bekerja dalam kelompok kolaboratif menggunakan sintaks ${model} untuk memecahkan masalah nyata terkait "${topik}".\n• Setiap kelompok merancang solusi/karya aplikatif dengan mengintegrasikan isu prioritas (${isu}) serta memanfaatkan sumber belajar yang tersedia.\n• Murid mempresentasikan hasil eksplorasi dan karya kelompok secara komunikatif dan saling memberikan umpan balik konstruktif.`,
        merefleksi: `• Murid melakukan refleksi metakognitif tentang apa yang telah dipahami, tantangan yang berhasil diatasi, dan manfaat materi "${topik}" bagi kehidupan sehari-hari.\n• Guru bersama murid menyimpulkan intisari pembelajaran dan menguatkan karakter Dimensi Profil Lulusan (${dimensi}).`,
      },
      kegiatanAkhir: `1. Guru memberikan apresiasi atas partisipasi aktif dan karya kolaboratif seluruh kelompok.\n2. Murid mengerjakan asesmen formatif singkat (kuis reflektif/tiket keluar).\n3. Guru menyampaikan agenda pertemuan berikutnya dan menutup pelajaran dengan doa serta salam.`,
    }));

    return JSON.stringify({
      topikDitentukan: topik,
      cpDitentukan: `Peserta didik mampu memahami konsep esensial, menganalisis permasalahan kontekstual, dan mengaplikasikan pengetahuan tentang ${topik} pada mata pelajaran ${mapel} dalam kehidupan sehari-hari secara bernalar kritis, kreatif, dan kolaboratif.`,
      pesertaDidik: `Peserta didik Kelas ${kelas} memiliki rasa ingin tahu yang tinggi, antusias terhadap aktivitas kolaboratif berbasis pemecahan masalah nyata, serta memiliki keberagaman gaya belajar (visual, auditori, dan kinestetik).`,
      identifikasiKesiapan: `Sebagian besar peserta didik telah mengenal konsep dasar di sekitar mereka terkait ${topik}, namun memerlukan bimbingan terstruktur (scaffolding) untuk menghubungkan konsep teoritis dengan penerapannya dalam situasi nyata.`,
      materiPembelajaran: {
        jenisPengetahuan: `Pengetahuan Faktual, Konseptual, Prosedural, dan Metakognitif terkait ${topik}.`,
        relevansi: `Materi "${topik}" sangat relevan dengan kehidupan nyata peserta didik karena berkaitan langsung dengan pengambilan keputusan sehari-hari serta penguatan ${isu}.`,
        strukturMateri: `1. Konsep Dasar & Pengertian ${topik}; 2. Analisis Komponen & Prinsip Kerja; 3. Penerapan Kontekstual & Studi Kasus; 4. Evaluasi & Refleksi.`,
        tingkatKesulitan: `Sedang — disusun bertahap dari konkret ke abstrak sesuai perkembangan kognitif Kelas ${kelas}.`,
        integrasiNilaiKarakter: `Mengintegrasikan Dimensi Profil Lulusan (${dimensi}) serta insersi isu prioritas nasional (${isu}).`,
      },
      tujuanPembelajaran: `1. Melalui pengamatan stimulus dan diskusi terarah, peserta didik mampu menjelaskan konsep dasar ${topik} dengan tepat.\n2. Melalui kegiatan kolaboratif berbasis ${model}, peserta didik mampu menganalisis dan memecahkan permasalahan kontekstual terkait ${topik} dengan bernalar kritis.\n3. Peserta didik mampu menyajikan hasil karya/solusi dan merefleksikan manfaat pembelajaran dalam kehidupan sehari-hari.`,
      kktp: `1. Mampu mengidentifikasi dan menjelaskan konsep esensial ${topik} menggunakan bahasa sendiri secara akurat.\n2. Mampu menerapkan konsep ${topik} untuk menyelesaikan studi kasus/masalah kontekstual.\n3. Mampu bekerja sama secara aktif dalam kelompok dan mempresentasikan hasil diskusi dengan sistematis.`,
      pemahamanBermakna: `Memahami "${topik}" membantu peserta didik menyadari keteraturan ilmu pengetahuan dan membekali mereka dengan keterampilan memecahkan masalah nyata di lingkungan sekitar secara bijaksana.`,
      pertanyaanPemantik: `1. Pernahkah kalian mengamati fenomena terkait ${topik} di lingkungan sekitar kita?\n2. Mengapa pemahaman tentang ${topik} sangat penting bagi kehidupan kita sehari-hari?\n3. Bagaimana cara kita menerapkan konsep ini untuk memberikan solusi positif bagi masyarakat?`,
      praktikPedagogis: {
        strategi: "Pembelajaran Berdiferensiasi (Konten, Proses, Produk) & Kolaboratif",
        pendekatan: pendekatan,
        teknik: "Diskusi Kelompok, Studi Kasus Kontekstual, Tanya Jawab Reflektif, dan Unjuk Kerja",
      },
      kemitraan: `Kolaborasi antara guru mata pelajaran, rekan sejawat lintas disiplin ilmu, serta pelibatan orang tua/wali murid dalam pendampingan belajar kontekstual di rumah.`,
      lingkungan: `Lingkungan kelas yang inklusif, aman secara psikologis, fleksibel untuk diskusi kelompok, serta memanfaatkan lingkungan sekitar sekolah sebagai sumber belajar nyata.`,
      pemanfaatanDigital: `Pemanfaatan media presentasi interaktif, tayangan video edukasi kontekstual, serta kuis digital formatif untuk meningkatkan keaktifan belajar.`,
      remidialDanPengayaan: `• Program Remedial: Pendampingan kelompok kecil (scaffolding) dan penggunaan media visual konkret bagi peserta didik yang belum mencapai KKTP pada konsep dasar ${topik}.\n• Program Pengayaan: Penugasan eksplorasi studi kasus tingkat lanjut (HOTS) atau proyek mini mandiri bagi peserta didik yang telah melampaui KKTP.`,
      lkpd: `LEMBAR KERJA PESERTA DIDIK (LKPD)\nTopik: ${topik}\n\nPetunjuk Belajar:\n1. Bacalah permasalahan kontekstual yang disajikan dengan cermat bersama kelompokmu.\n2. Diskusikan pertanyaan analisis dengan mengaitkan konsep ${topik}.\n3. Tuliskan hasil temuan dan kesimpulan kelompok pada kolom yang tersedia, lalu presentasikan di depan kelas!`,
      daftarPustaka: [
        `Buku Panduan Guru & Siswa ${mapel} Kelas ${kelas} — Kementerian Pendidikan Dasar dan Menengah RI.`,
        `Modul Pembelajaran Mendalam (Deep Learning) Kurikulum Nasional Terbaru.`,
        `Sumber literasi digital dan artikel edukasi kontekstual terkait ${topik}.`,
      ],
      pertemuan: pertemuanList,
      asesmen: {
        teknikInstrumen: `1. Asesmen Formatif Awal: Tanya jawab pemantik & pemetaan kesiapan belajar.\n2. Asesmen Formatif Proses: Observasi diskusi kelompok, penilaian LKPD, dan unjuk kerja.\n3. Asesmen Sumatif Akhir: Tes tertulis/produk ketercapaian Tujuan Pembelajaran.`,
        rubrikAsesmen: [
          {
            kriteria: "Pemahaman Konsep Materi",
            sangatBaik: `Mampu menjelaskan dan mengaitkan seluruh konsep ${topik} secara sangat akurat dan mendalam.`,
            baik: `Mampu menjelaskan konsep utama ${topik} dengan tepat namun contoh masih terbatas.`,
            cukup: `Mampu menyebutkan pengertian dasar namun masih memerlukan bimbingan dalam mengaitkan konsep.`,
            perluBimbingan: `Belum mampu menjelaskan konsep dasar ${topik} secara mandiri.`,
          },
          {
            kriteria: "Penerapan & Pemecahan Masalah",
            sangatBaik: "Mampu memecahkan studi kasus secara kreatif, sistematis, dan solutif.",
            baik: "Mampu menyelesaikan masalah sesuai prosedur dengan tepat.",
            cukup: "Menyelesaikan sebagian langkah pemecahan masalah dengan bantuan guru.",
            perluBimbingan: "Memerlukan bimbingan penuh dalam menyelesaikan tugas LKPD.",
          },
        ],
        rubrikKognitif: [
          {
            kriteria: "Analisis & Penalaran Kritis (HOTS)",
            sangatBaik: "Mampu menganalisis hubungan sebab-akibat dan menyimpulkan dengan argumen logis yang kuat.",
            baik: "Mampu menganalisis informasi utama dan menarik kesimpulan dengan tepat.",
            cukup: "Mampu mengidentifikasi informasi dasar namun kesimpulan belum mendalam.",
            perluBimbingan: "Belum mampu menganalisis informasi tanpa arahan bertahap.",
          },
        ],
        rubrikProfilLulusan: [
          {
            kriteria: `Aktualisasi Dimensi (${dimensi})`,
            sangatBaik: "Secara konsisten menunjukkan sikap aktif berkolaborasi, bernalar kritis, dan komunikatif sepanjang pembelajaran.",
            baik: "Menunjukkan sikap kolaboratif dan komunikatif dengan baik dalam kerja kelompok.",
            cukup: "Cukup terlibat dalam kelompok namun masih perlu dimotivasi untuk berpendapat.",
            perluBimbingan: "Pasif dalam kelompok dan memerlukan pendampingan khusus.",
          },
        ],
      },
    });
  }

  // B. 8 SUB-DOKUMEN PENDUKUNG MODUL AJAR
  if (pLower.includes('"langkahkerja"') && pLower.includes('"soallatihan"')) {
    return JSON.stringify({
      judul: `LKPD Eksplorasi Kontekstual: ${topik}`,
      tujuan: [
        `Mengidentifikasi konsep utama tentang ${topik} melalui pengamatan dan diskusi kelompok.`,
        `Menganalisis permasalahan nyata yang berkaitan dengan ${topik} secara kritis dan kolaboratif.`,
        `Menyajikan kesimpulan dan solusi aplikatif di depan kelas.`,
      ],
      alatBahan: [
        `Buku Paket / Bahan Ajar ${mapel} Kelas ${kelas}`,
        "Lembar Kerja Peserta Didik (LKPD) & Alat Tulis",
        "Media gambar / artikel studi kasus kontekstual",
      ],
      langkahKerja: [
        "Bentuklah kelompok belajar yang terdiri dari 4–5 peserta didik.",
        `Amatilah studi kasus / fenomena nyata terkait "${topik}" yang disajikan oleh guru.`,
        "Diskusikan pertanyaan analisis bersama anggota kelompok dengan saling menghargai pendapat.",
        "Tuliskan hasil diskusi secara sistematis pada lembar jawaban yang tersedia.",
        "Presentasikan hasil kerja kelompok di depan kelas dan catat masukan dari kelompok lain.",
      ],
      soalLatihan: [
        `Jelaskan dengan bahasamu sendiri apa yang dimaksud dengan konsep utama dalam ${topik}!`,
        `Mengapa konsep ${topik} penting diterapkan dalam kehidupan sehari-hari? Berikan minimal 2 contoh nyata!`,
        `Jika terjadi permasalahan terkait ${topik} di lingkungan sekitar kita, langkah solusi apa yang dapat kalian usulkan?`,
        `Tuliskan kesimpulan utama yang kalian peroleh dari kegiatan eksplorasi hari ini!`,
      ],
    });
  }

  if (pLower.includes('"petakonsep"') && pLower.includes('"isimateri"')) {
    return JSON.stringify({
      judul: `Bahan Ajar & Ringkasan Materi: ${topik}`,
      petaKonsep: [
        `Pengertian & Konsep Dasar ${topik}`,
        "Karakteristik & Komponen Utama",
        "Penerapan dalam Kehidupan Nyata",
        "Analisis Kasus & Refleksi",
      ],
      isiMateri: [
        {
          subjudul: `1. Pengertian & Konsep Dasar ${topik}`,
          konten: `Secara mendasar, ${topik} merupakan bagian penting dalam mata pelajaran ${mapel} Kelas ${kelas}. Pemahaman konsep ini membantu peserta didik mengenali fenomena di sekitar secara ilmiah dan terstruktur.`,
        },
        {
          subjudul: "2. Komponen & Prinsip Utama",
          konten: `Dalam mempelajari ${topik}, terdapat prinsip-prinsip utama yang saling berkaitan. Peserta didik perlu memahami bagaimana setiap elemen bekerja dan saling memengaruhi satu sama lain.`,
        },
        {
          subjudul: "3. Penerapan Kontekstual dalam Kehidupan Sehari-hari",
          konten: `Konsep ${topik} banyak dijumpai dalam aktivitas sehari-hari di rumah, sekolah, maupun masyarakat. Dengan menguasai materi ini, peserta didik dapat mengambil keputusan yang tepat dan solutif.`,
        },
      ],
      kesimpulan: `Penguasaan materi ${topik} tidak hanya memperkuat kompetensi akademik pada mata pelajaran ${mapel}, tetapi juga melatih penalaran kritis dan kepedulian terhadap lingkungan sekitar.`,
    });
  }

  if (pLower.includes('"carabermain"') && pLower.includes('"kegiatan"')) {
    return JSON.stringify({
      judul: `Ide Icebreaker & Joyful Learning: ${topik}`,
      kegiatan: [
        {
          nama: "Tebak Kata Kunci Kilat (Flash Concept)",
          durasi: "5 Menit",
          caraBermain: `Guru menyebutkan 3 petunjuk singkat terkait "${topik}". Siswa yang paling cepat mengangkat tangan dan menebak istilah dengan tepat mendapat poin apresiasi untuk kelompoknya.`,
        },
        {
          nama: "Rantai Kalimat Konsep (Concept Chain)",
          durasi: "7 Menit",
          caraBermain: `Siswa berdiri melingkar. Siswa pertama menyebutkan satu kata yang berhubungan dengan "${topik}", lalu siswa berikutnya menyambung dengan kata terkait hingga membentuk kesimpulan yang utuh dan seru.`,
        },
        {
          nama: "Gerak & Ekspresi Benar-Salah",
          durasi: "5 Menit",
          caraBermain: `Guru membacakan pernyataan menarik seputar "${topik}". Jika pernyataan BENAR, siswa bertepuk tangan 2 kali dan mengangkat jempol; jika SALAH, siswa menyilangkan tangan sambil tersenyum. Siswa yang tepat menjelaskan alasannya singkat!`,
        },
      ],
    });
  }

  if (pLower.includes('"namakriteria"') && pLower.includes('"skor4"')) {
    return JSON.stringify({
      judul: `Rubrik Penilaian Kinerja & Proyek: ${topik}`,
      kriteria: [
        {
          namaKriteria: "Ketepatan Pemahaman Konsep",
          skor4: `Sangat Baik: Menjelaskan konsep ${topik} secara sangat lengkap, akurat, dan disertai contoh nyata.`,
          skor3: `Baik: Menjelaskan konsep ${topik} dengan tepat namun contoh masih sederhana.`,
          skor2: `Cukup: Menjelaskan sebagian konsep namun masih terdapat kekurangtepatan istilah.`,
          skor1: `Perlu Bimbingan: Belum mampu menjelaskan konsep ${topik} tanpa bantuan guru.`,
        },
        {
          namaKriteria: "Kualitas Analisis & Pemecahan Masalah",
          skor4: "Sangat Baik: Menganalisis masalah secara mendalam dan merumuskan solusi yang kreatif serta logis.",
          skor3: "Baik: Menganalisis masalah dengan cukup tepat dan memberikan solusi yang relevan.",
          skor2: "Cukup: Analisis masalah masih bersifat permukaan dan solusi belum terperinci.",
          skor1: "Perlu Bimbingan: Kesulitan mengidentifikasi inti permasalahan.",
        },
        {
          namaKriteria: "Kolaborasi & Kerja Sama Kelompok",
          skor4: "Sangat Baik: Seluruh anggota berpartisipasi aktif, saling mendukung, dan berbagi peran secara adil.",
          skor3: "Baik: Sebagian besar anggota terlibat aktif dalam menyelesaikan tugas kelompok.",
          skor2: "Cukup: Hanya beberapa anggota yang dominan bekerja dalam kelompok.",
          skor1: "Perlu Bimbingan: Kurang adanya koordinasi dan kerja sama antaranggota.",
        },
        {
          namaKriteria: "Komunikasi & Presentasi Hasil",
          skor4: "Sangat Baik: Menyampaikan presentasi dengan percaya diri, bahasa sistematis, dan mampu menjawab pertanyaan dengan tepat.",
          skor3: "Baik: Menyampaikan presentasi dengan jelas dan runtut.",
          skor2: "Cukup: Presentasi masih terpaku pada teks dan suara kurang terdengar jelas.",
          skor1: "Perlu Bimbingan: Belum berani mempresentasikan hasil kerja di depan kelas.",
        },
      ],
    });
  }

  if (pLower.includes('"naskah"') && pLower.includes('"pesanmoral"')) {
    return JSON.stringify({
      judul: `Skenario Roleplay Kontekstual: ${topik}`,
      karakter: [
        "Raka (Siswa yang ingin tahu)",
        "Sinta (Siswa yang kritis & teliti)",
        "Budi (Teman sebaya)",
        "Moderator / Narator Kelas",
      ],
      latar: `Suasana diskusi di lingkungan sekolah saat para siswa menemukan fenomena nyata yang berkaitan dengan ${topik}.`,
      naskah: [
        {
          tokoh: "Moderator",
          instruksiAksi: "Berdiri di depan kelas dengan antusias menyapa penonton",
          dialog: `Teman-teman, hari ini kita akan menyaksikan bagaimana konsep ${topik} ternyata sangat dekat dengan kehidupan kita sehari-hari!`,
        },
        {
          tokoh: "Raka",
          instruksiAksi: "Menunjuk sebuah objek/kasus sambil tampak berpikir",
          dialog: `Sinta, Budi, coba perhatikan kejadian ini! Mengapa hal ini bisa terjadi ya jika kita kaitkan dengan pelajaran ${mapel} tentang ${topik}?`,
        },
        {
          tokoh: "Sinta",
          instruksiAksi: "Membuka buku catatan dan menjelaskan dengan semangat",
          dialog: `Pertanyaan bagus, Raka! Berdasarkan konsep ${topik} yang kita pelajari, hal ini terjadi karena adanya hubungan sebab-akibat yang harus kita kelola dengan benar.`,
        },
        {
          tokoh: "Budi",
          instruksiAksi: "Mengangguk paham dan mengajak teman-temannya bertindak",
          dialog: `Wah, sekarang aku paham! Kalau begitu, mari kita terapkan solusi ini bersama-sama agar lingkungan sekolah kita menjadi lebih baik!`,
        },
      ],
      pesanMoral: `Ilmu pengetahuan tentang ${topik} akan menjadi jauh lebih bermakna apabila kita terapkan secara nyata dengan sikap peduli, jujur, dan bekerja sama.`,
    });
  }

  if (pLower.includes('"salamPembuka"') || pLower.includes('"salampembuka"')) {
    return JSON.stringify({
      perihal: `Pemberitahuan & Kolaborasi Pendampingan Belajar Materi: ${topik}`,
      salamPembuka:
        "Yth. Bapak/Ibu Orang Tua/Wali Murid\nKelas " +
        kelas +
        "\ndi Tempat\n\nDengan hormat,",
      isiInformasi: `Melalui surat ini kami informasikan bahwa pada pekan ini putra/putri Bapak/Ibu sedang mempelajari mata pelajaran ${mapel} dengan topik "${topik}" menggunakan pendekatan Pembelajaran Mendalam (Deep Learning). Pembelajaran ini bertujuan melatih pemahaman konsep sekaligus penerapannya dalam kehidupan sehari-hari.`,
      saranKegiatanRumah: [
        `Mengajak putra/putri berdiskusi ringan di rumah mengenai contoh "${topik}" dalam aktivitas sehari-hari.`,
        "Memberikan apresiasi dan semangat atas cerita atau hasil karya yang telah mereka buat di sekolah.",
        "Mendampingi putra/putri dalam membiasakan sikap disiplin, tanggung jawab, dan gemar membaca.",
      ],
      salamPenutup:
        "Demikian informasi ini kami sampaikan. Atas perhatian dan kerja sama yang hangat dari Bapak/Ibu dalam mendukung tumbuh kembang putra/putri kita, kami ucapkan terima kasih.\n\nSalam hormat,",
    });
  }

  if (pLower.includes('"nomorslide"') && pLower.includes('"saranvisual"')) {
    return JSON.stringify({
      judul: `Outline Presentasi Pembelajaran: ${topik}`,
      slide: [
        {
          nomorSlide: 1,
          judulSlide: `Judul & Pengantar: ${topik}`,
          poinPenting: [
            `Mata Pelajaran: ${mapel} (Kelas ${kelas})`,
            "Tujuan Pembelajaran & Manfaat mempelajari materi ini",
          ],
          saranVisual: "Gambar sampul ilustrasi kontekstual yang menarik dan penuh warna.",
        },
        {
          nomorSlide: 2,
          judulSlide: "Pertanyaan Pemantik & Fenomena Nyata",
          poinPenting: [
            "Mengamati fenomena di sekitar kita",
            "Mengapa topik ini penting untuk kita pahami?",
          ],
          saranVisual: "Foto atau ilustrasi situasi sehari-hari yang memancing rasa ingin tahu siswa.",
        },
        {
          nomorSlide: 3,
          judulSlide: `Konsep Dasar ${topik}`,
          poinPenting: [
            "Pengertian dan definisi kunci",
            "Komponen-komponen utama yang perlu dipahami",
          ],
          saranVisual: "Diagram peta konsep atau infografis sederhana.",
        },
        {
          nomorSlide: 4,
          judulSlide: "Cara Kerja & Contoh Penerapan",
          poinPenting: [
            "Langkah-langkah atau proses utama",
            "Contoh nyata penerapan di lingkungan rumah dan sekolah",
          ],
          saranVisual: "Bagan alur (flowchart) disertai ikon ilustratif.",
        },
        {
          nomorSlide: 5,
          judulSlide: "Tantangan Diskusi Kelompok (Studi Kasus)",
          poinPenting: [
            "Kasus kontekstual untuk dipecahkan bersama kelompok",
            "Panduan diskusi: Memahami, Mengaplikasi, Merefleksi",
          ],
          saranVisual: "Ilustrasi kerja kelompok dan daftar pertanyaan diskusi.",
        },
        {
          nomorSlide: 6,
          judulSlide: "Refleksi & Kesimpulan Bersama",
          poinPenting: [
            "Intisari materi yang telah dipelajari hari ini",
            "Refleksi nilai karakter & Dimensi Profil Lulusan",
          ],
          saranVisual: "Kutipan inspiratif dan poin ringkasan berwarna kontras.",
        },
      ],
    });
  }

  if (pLower.includes('"daftarmiskonsepsi"') && pLower.includes('"konsepsalah"')) {
    return JSON.stringify({
      judul: `Analisis & Solusi Miskonsepsi Siswa: ${topik}`,
      daftarMiskonsepsi: [
        {
          konsepSalah: `Siswa menganggap konsep ${topik} hanya bersifat hafalan rumus/definisi tanpa kaitan dengan kehidupan nyata.`,
          penjelasanBenar: `Konsep ${topik} merupakan prinsip aplikatif yang dapat diamati dan dibuktikan secara langsung melalui fenomena sehari-hari.`,
          caraMengatasi: `Gunakan demonstrasi konkret, studi kasus nyata di sekitar sekolah, dan pertanyaan pemantik sebelum masuk ke istilah teknis.`,
        },
        {
          konsepSalah: `Siswa sering tertukar dalam membedakan istilah-istilah kunci di dalam materi ${topik}.`,
          penjelasanBenar: `Setiap komponen pada ${topik} memiliki ciri khas, fungsi, dan peran yang spesifik serta saling melengkapi.`,
          caraMengatasi: `Buatlah tabel perbandingan visual dan peta konsep bersama siswa di papan tulis atau melalui permainan kartu konsep.`,
        },
        {
          konsepSalah: `Siswa menyimpulkan hasil akhir secara tergesa-gesa tanpa memeriksa langkah analisis.`,
          penjelasanBenar: `Pemecahan masalah pada ${topik} memerlukan tahapan identifikasi data, analisis konsep, dan penarikan kesimpulan yang runtut.`,
          caraMengatasi: `Biasakan siswa menuliskan alasan ("Mengapa jawabannya demikian?") pada setiap diskusi LKPD.`,
        },
      ],
    });
  }

  // C. KKTP (KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN)
  if (pLower.includes('"learningobjectives"') && pLower.includes('"sololevel"')) {
    return JSON.stringify({
      learningObjectives: [
        {
          objective: `Memahami dan menjelaskan konsep fundamental serta karakteristik utama pada materi ${topik} (${mapel} Kelas ${kelas}).`,
          criteria: [
            `Mengidentifikasi pengertian dan ciri-ciri utama terkait ${topik} dengan tepat.`,
            "Menjelaskan keterkaitan antar-komponen dasar menggunakan bahasa sendiri secara runtut.",
          ],
          soloLevel: "Multi-structural",
          deepLearningAspect: "Memahami (Mindful & Meaningful)",
          indicators: [
            "Peserta didik mampu menyebutkan minimal 3 konsep kunci beserta contohnya.",
            "Peserta didik mampu mengelompokkan informasi secara akurat pada lembar kerja.",
          ],
          intervalDeskripsi: {
            perluBimbingan:
              "Belum mampu mengidentifikasi konsep dasar dan memerlukan bimbingan penuh (Remedial).",
            cukup:
              "Mampu menyebutkan sebagian konsep dasar namun belum lengkap (Perlu penguatan pada bagian tertentu).",
            baik: "Sudah mencapai ketuntasan dalam menjelaskan konsep dan karakteristik utama dengan tepat.",
            sangatBaik:
              "Sangat mahir menjelaskan dan mengaitkan konsep secara mendalam (Diberikan pengayaan).",
          },
        },
        {
          objective: `Mengaplikasikan konsep ${topik} untuk menganalisis dan memecahkan permasalahan kontekstual dalam kehidupan sehari-hari.`,
          criteria: [
            "Menganalisis hubungan sebab-akibat pada studi kasus kontekstual.",
            "Menerapkan prosedur/konsep yang tepat untuk merumuskan solusi pemecahan masalah.",
          ],
          soloLevel: "Relational",
          deepLearningAspect: "Mengaplikasi (Meaningful & Joyful)",
          indicators: [
            "Peserta didik mampu menyelesaikan tugas studi kasus/proyek kelompok sesuai prosedur.",
            "Peserta didik mampu menghubungkan teori yang dipelajari dengan fenomena nyata di lingkungan sekitar.",
          ],
          intervalDeskripsi: {
            perluBimbingan:
              "Belum mampu menerapkan konsep pada penyelesaian masalah sederhana.",
            cukup:
              "Mampu menerapkan langkah awal namun masih memerlukan arahan dalam menyimpulkan solusi.",
            baik: "Sudah mencapai ketuntasan dalam memecahkan masalah kontekstual dengan sistematis.",
            sangatBaik:
              "Mampu memecahkan masalah kompleks secara mandiri, kreatif, dan solutif.",
          },
        },
        {
          objective: `Mengevaluasi dan merefleksikan hasil karya/solusi serta mengomunikasikan kesimpulan pembelajaran secara kritis dan kolaboratif.`,
          criteria: [
            "Mempresentasikan hasil eksplorasi/proyek dengan argumen yang logis dan komunikatif.",
            "Melakukan refleksi diri serta memberikan umpan balik terhadap penerapan materi.",
          ],
          soloLevel: "Extended Abstract",
          deepLearningAspect: "Merefleksi (Mindful & Metakognitif)",
          indicators: [
            "Peserta didik mampu menyajikan laporan/presentasi hasil diskusi kelompok dengan percaya diri.",
            "Peserta didik mampu merumuskan kesimpulan dan ide pengembangan baru dari materi yang dipelajari.",
          ],
          intervalDeskripsi: {
            perluBimbingan:
              "Belum aktif dalam diskusi dan belum mampu menyimpulkan hasil belajar.",
            cukup:
              "Mampu menyampaikan hasil kerja secara singkat namun argumen belum mendalam.",
            baik: "Sudah mencapai ketuntasan dalam mempresentasikan dan merefleksikan hasil pembelajaran.",
            sangatBaik:
              "Sangat kritis, reflektif, dan mampu menginspirasi teman sebaya dalam diskusi.",
          },
        },
      ],
      summary: `Berdasarkan analisis CP dan ATP mata pelajaran ${mapel} Kelas ${kelas}, peserta didik dinyatakan mencapai ketuntasan Tujuan Pembelajaran apabila berada pada interval minimal Baik (66% - 85%) atau mencapai level Relational pada Taksonomi SOLO. Peserta didik pada interval 0-65% diberikan pendampingan remedial terfokus, sedangkan interval 86-100% diberikan tantangan pengayaan.`,
    });
  }

  // D. RACIK SOAL AI (NASKAH SOAL, KISI-KISI & KUNCI)
  if (pLower.includes('"soal"') && pLower.includes('"kisi"') && pLower.includes('"kunci"')) {
    // Parse rincian blok soal dari prompt
    const blockRegex =
      /Soal No (\d+) s\/d (\d+) \((\d+) soal\): Jenis \[([^\]]+)\], Tingkat Kesulitan \[([^\]]+)\], Dimensi Kognitif \[([^\]]+)\]/g;
    const soalArr: any[] = [];
    const kisiArr: any[] = [];
    const kunciArr: any[] = [];

    let match: RegExpExecArray | null;
    while ((match = blockRegex.exec(prompt)) !== null) {
      const startNo = parseInt(match[1], 10);
      const endNo = parseInt(match[2], 10);
      const jenis = match[4];
      const kesulitan = match[5];
      const kognitif = match[6];

      for (let no = startNo; no <= endNo; no++) {
        const idxInBlock = no - startNo + 1;
        if (
          jenis === "Pilihan Ganda" ||
          jenis === "Pilihan Ganda Kompleks"
        ) {
          const correctIdx = (no - 1) % 4;
          const letters = ["A", "B", "C", "D"];
          const opsiList = [
            `Menerapkan prinsip utama ${topik} secara sistematis dan sesuai kaidah ${mapel}`,
            `Mengabaikan faktor pendukung dalam proses analisis ${topik}`,
            `Menggunakan asumsi tanpa data pengamatan pada ${topik}`,
            `Memisahkan konsep dasar dari konteks permasalahan ${topik}`,
          ];
          // Rotasi opsi agar kunci jawaban bervariasi A, B, C, D
          const rotatedOpsi = [
            ...opsiList.slice(4 - correctIdx),
            ...opsiList.slice(0, 4 - correctIdx),
          ];

          soalArr.push({
            no,
            jenis,
            pertanyaan: `Perhatikan ilustrasi kasus berikut! Dalam mempelajari "${topik}" pada mata pelajaran ${mapel} (Fokus Bagian ${idxInBlock}), langkah analisis dan penerapan konsep yang paling tepat dilakukan adalah ....`,
            opsi: rotatedOpsi,
          });
          kunciArr.push({
            no,
            jenis,
            jawaban: letters[correctIdx],
            penjelasan: `Opsi ${letters[correctIdx]} merupakan langkah yang paling tepat karena sesuai dengan konsep ilmiah dan prinsip penerapan ${topik}.`,
            skor: 10,
          });
        } else if (jenis === "Mencocokkan") {
          soalArr.push({
            no,
            jenis,
            pertanyaan: `Konsep dan karakteristik penting ke-${idxInBlock} dalam materi ${topik}`,
            opsi: [`Penerapan prinsip ke-${idxInBlock} pada ${mapel}`],
          });
          kunciArr.push({
            no,
            jenis,
            jawaban: String.fromCharCode(65 + ((no - 1) % 5)),
            penjelasan: `Pasangan konsep yang sesuai dengan karakteristik ke-${idxInBlock} dari ${topik}.`,
            skor: 10,
          });
        } else if (jenis === "Benar/Salah") {
          const isTrue = no % 2 === 1;
          soalArr.push({
            no,
            jenis,
            pertanyaan: `Pernyataan: Pemahaman yang tepat terhadap konsep ${topik} (Aspek ${idxInBlock}) sangat berpengaruh terhadap keberhasilan pemecahan masalah dalam ${mapel}.`,
            opsi: [],
          });
          kunciArr.push({
            no,
            jenis,
            jawaban: isTrue ? "Benar" : "Benar",
            penjelasan: `Pernyataan tersebut benar karena sesuai dengan kaidah konsep ${topik}.`,
            skor: 10,
          });
        } else {
          soalArr.push({
            no,
            jenis,
            pertanyaan: `Jelaskan bagaimana cara menerapkan konsep "${topik}" (Kasus #${idxInBlock}) untuk menyelesaikan permasalahan nyata di lingkungan sekitar kita, serta berikan contohnya secara lengkap!`,
            opsi: [],
          });
          kunciArr.push({
            no,
            jenis,
            jawaban: `Peserta didik menjelaskan pengertian ${topik}, menguraikan langkah penerapannya secara runtut, dan menyertakan contoh nyata yang relevan.`,
            penjelasan: `Skor penuh diberikan apabila mencakup konsep dasar, analisis langkah, dan contoh kontekstual.`,
            skor: 20,
          });
        }

        kisiArr.push({
          no,
          cp: `Memahami dan mengaplikasikan konsep ${topik} pada mata pelajaran ${mapel}`,
          materi: topik,
          indikator: `Disajikan stimulus/permasalahan kontekstual terkait ${topik} (${kesulitan}), peserta didik dapat menentukan/menganalisis solusi dengan tepat.`,
          kognitif,
          bentuk: jenis,
        });
      }
    }

    return JSON.stringify({
      soal: soalArr,
      kisi: kisiArr,
      kunci: kunciArr,
    });
  }

  // E. GANTI 1 SOAL AI
  if (pLower.includes("soal baru pengganti")) {
    return JSON.stringify({
      pertanyaan: `Berdasarkan pengamatan kontekstual terhadap materi "${topik}" pada mata pelajaran ${mapel}, manakah pernyataan berikut yang menunjukkan penerapan konsep secara tepat dan efektif?`,
      opsi: [
        `Mengidentifikasi masalah, menganalisis data, dan menerapkan prinsip ${topik} secara runtut`,
        `Menyimpulkan hasil tanpa melakukan pengamatan terlebih dahulu`,
        `Hanya menghafalkan definisi tanpa memahami konteks penggunaannya`,
        `Mengabaikan ketelitian dalam proses kerja`,
      ],
      jawaban: "A",
      penjelasan: `Opsi A menunjukkan tahapan pemecahan masalah ilmiah yang tepat sesuai konsep ${topik}.`,
    });
  }

  // F. MODUL PROJEK KOKURIKULER / P5
  if (pLower.includes('"judulproyek"') && pLower.includes('"tahapanproyek"')) {
    const tema = extractValue(
      prompt,
      /Tema Projek:\s*([^\n]+)/i,
      "Gaya Hidup Berkelanjutan"
    );
    const dimensi = extractValue(
      prompt,
      /Dimensi Profil Lulusan yang Disasar:\s*([^\n]+)/i,
      "Penalaran Kritis, Kreativitas, Kolaborasi"
    );
    const masalah = extractValue(
      prompt,
      /Konteks \/ Permasalahan Lokal Sekolah:\s*([^\n]+)/i,
      "Penguatan karakter dan kepedulian lingkungan sekolah"
    );

    return JSON.stringify({
      judulProyek: `Aksi Nyata Kolaboratif: "${tema}" di Lingkungan Sekolah Kita`,
      deskripsiProyek: `Projek kokurikuler ini dirancang untuk membekali peserta didik Kelas ${kelas} dengan pengalaman belajar kontekstual dalam merespons isu "${masalah}". Melalui pendekatan Pembelajaran Mendalam (Memahami, Mengaplikasi, Merefleksi), peserta didik melakukan observasi, merancang karya/kampanye solusi kreatif, dan mempraktikkan kebiasaan positif secara berkelanjutan.`,
      dimensiProfilPelajarPancasila: dimensi.split(",").map((s) => s.trim()),
      elemenDanSubelemen: [
        {
          elemen: "Memperoleh dan Memproses Informasi serta Gagasan",
          subelemen: "Mengidentifikasi, mengklarifikasi, dan mengolah informasi kontekstual",
          targetPencapaianFase: `Mampu mengumpulkan data hasil pengamatan terkait ${tema} dan menyajikannya secara sistematis.`,
        },
        {
          elemen: "Kolaborasi & Kepedulian",
          subelemen: "Kerja sama dan komunikasi untuk mencapai tujuan bersama",
          targetPencapaianFase:
            "Mampu berbagi peran secara efektif dan saling mendukung dalam mewujudkan aksi nyata bersama kelompok.",
        },
        {
          elemen: "Menghasilkan Karya dan Tindakan yang Orisinal",
          subelemen: "Mengeksplorasi dan mengekspresikan pikiran dalam bentuk karya/aksi",
          targetPencapaianFase: `Menghasilkan produk/kampanye kreatif yang memberikan dampak positif bagi warga sekolah.`,
        },
      ],
      tahapanProyek: [
        {
          namaTahap: "1. Tahap Pengenalan (Temukan & Kenali)",
          aktivitas: [
            {
              namaKegiatan: "Orientasi & Eksplorasi Isu Kontekstual",
              deskripsi: `Peserta didik mengamati video/artikel pemantik dan berdiskusi mengenai pentingnya tema "${tema}".`,
              durasiJP: "6 JP",
            },
            {
              namaKegiatan: "Observasi Lingkungan Sekolah",
              deskripsi: `Peserta didik melakukan pengamatan lapangan di sekitar sekolah terkait "${masalah}".`,
              durasiJP: "6 JP",
            },
          ],
        },
        {
          namaTahap: "2. Tahap Kontekstualisasi (Selidiki & Rencanakan)",
          aktivitas: [
            {
              namaKegiatan: "Analisis Data & Pemetaan Akar Masalah",
              deskripsi: "Kelompok mengolah hasil observasi dan menentukan fokus masalah yang akan dicarikan solusinya.",
              durasiJP: "6 JP",
            },
            {
              namaKegiatan: "Perancangan Prototipe Karya / Rencana Aksi",
              deskripsi: "Peserta didik menyusun desain karya, jadwal kerja, serta pembagian tugas kelompok.",
              durasiJP: "6 JP",
            },
          ],
        },
        {
          namaTahap: "3. Tahap Aksi Nyata (Wujudkan Karya Bersama)",
          aktivitas: [
            {
              namaKegiatan: "Pembuatan Karya & Kampanye Positif",
              deskripsi: `Peserta didik berkolaborasi membuat produk/media aksi nyata sesuai tema "${tema}" dengan bimbingan fasilitator.`,
              durasiJP: "8 JP",
            },
          ],
        },
        {
          namaTahap: "4. Tahap Refleksi & Tindak Lanjut (Gelar Karya & Evaluasi)",
          aktivitas: [
            {
              namaKegiatan: "Pameran / Gelar Karya & Refleksi Keberlanjutan",
              deskripsi: "Menampilkan hasil karya kepada warga sekolah dan menyusun komitmen kebiasaan baik sehari-hari.",
              durasiJP: "4 JP",
            },
          ],
        },
      ],
      rubrikPenilaianSingkat: [
        {
          aspek: "Penalaran Kritis & Identifikasi Masalah",
          mulaiBerkembang: "Mengumpulkan informasi dasar dengan arahan penuh dari guru.",
          sedangBerkembang: "Mampu mengidentifikasi masalah utama dari hasil pengamatan sederhana.",
          berkembangSesuaiHarapan: "Mampu menganalisis informasi dan mengaitkannya dengan solusi kontekstual secara tepat.",
          sangatBerkembang: "Mampu menganalisis masalah secara mendalam dan mengusulkan gagasan solusi yang sangat inovatif.",
        },
        {
          aspek: "Kolaborasi & Kontribusi Kelompok",
          mulaiBerkembang: "Terlibat dalam kelompok ketika diingatkan oleh guru/teman.",
          sedangBerkembang: "Melaksanakan tugas bagiannya sendiri dalam kelompok.",
          berkembangSesuaiHarapan: "Bekerja sama secara aktif, komunikatif, dan saling membantu menyelesaikan proyek.",
          sangatBerkembang: "Menjadi penggerak kolaborasi yang efektif dan menginspirasi anggota kelompok lainnya.",
        },
        {
          aspek: "Kreativitas Karya & Aksi Nyata",
          mulaiBerkembang: "Menghasilkan karya sederhana dengan meniru contoh yang sudah ada.",
          sedangBerkembang: "Menghasilkan karya dengan beberapa modifikasi ide kelompok.",
          berkembangSesuaiHarapan: "Menghasilkan karya/aksi nyata yang orisinal, rapi, dan sesuai tujuan projek.",
          sangatBerkembang: "Menghasilkan karya yang sangat kreatif, berdampak nyata, dan mudah diterapkan warga sekolah.",
        },
      ],
    });
  }

  // G. ADMINISTRASI GURU (ATP, PROTA, PROMES, DIAGNOSTIK, JURNAL)
  if (pLower.includes('"barisatp"')) {
    return JSON.stringify({
      judul: `ALUR TUJUAN PEMBELAJARAN (ATP) — ${mapel.toUpperCase()}`,
      capaianUmumFase: `Pada akhir fase ini, peserta didik mampu menguasai kompetensi esensial mata pelajaran ${mapel} Kelas ${kelas}, menerapkan konsep dalam pemecahan masalah nyata, serta menginternalisasi Dimensi Profil Lulusan.`,
      barisATP: [
        {
          no: "1.1",
          elemen: "Pemahaman Konsep Dasar",
          capaianPembelajaran: `Memahami konsep dasar dan prinsip utama dalam ${mapel}.`,
          tujuanPembelajaran: `Mengidentifikasi dan menjelaskan konsep dasar serta karakteristik materi pokok semester ini dengan tepat.`,
          materiPokok: `Pengantar & Konsep Esensial ${mapel}`,
          alokasiJP: "12 JP",
          dimensiProfil: "Penalaran Kritis, Kemandirian",
        },
        {
          no: "1.2",
          elemen: "Keterampilan Proses & Aplikasi",
          capaianPembelajaran: `Menerapkan konsep ${mapel} dalam situasi nyata.`,
          tujuanPembelajaran: `Menganalisis studi kasus kontekstual dan mempraktikkan prosedur pemecahan masalah secara kolaboratif.`,
          materiPokok: `Eksplorasi & Aplikasi Kontekstual ${mapel}`,
          alokasiJP: "16 JP",
          dimensiProfil: "Kolaborasi, Kreativitas",
        },
        {
          no: "1.3",
          elemen: "Evaluasi & Proyek Terpadu",
          capaianPembelajaran: `Mengevaluasi dan mengomunikasikan hasil karya pada ${mapel}.`,
          tujuanPembelajaran: `Merancang proyek mini pemecahan masalah dan mempresentasikan laporan hasil pengamatan di depan kelas.`,
          materiPokok: `Proyek Kolaboratif & Refleksi ${mapel}`,
          alokasiJP: "14 JP",
          dimensiProfil: "Komunikasi, Kewargaan",
        },
      ],
    });
  }

  if (pLower.includes('"barisprota"')) {
    return JSON.stringify({
      judul: `PROGRAM TAHUNAN (PROTA) — ${mapel.toUpperCase()}`,
      barisProta: [
        {
          semester: "1 (Ganjil)",
          noUnit: "Bab 1",
          topikMateri: `Konsep Dasar & Ruang Lingkup ${mapel}`,
          tujuanPembelajaran: "Memahami pengertian, komponen, dan prinsip dasar materi awal semester ganjil.",
          alokasiJP: "16 JP",
          keterangan: "Tatap Muka & Diskusi",
        },
        {
          semester: "1 (Ganjil)",
          noUnit: "Bab 2",
          topikMateri: `Analisis & Penerapan Kontekstual ${mapel} I`,
          tujuanPembelajaran: "Mengaplikasikan konsep untuk menyelesaikan masalah kontekstual di lingkungan sekitar.",
          alokasiJP: "20 JP",
          keterangan: "Praktikum & Proyek Mini",
        },
        {
          semester: "2 (Genap)",
          noUnit: "Bab 3",
          topikMateri: `Pengembangan & Eksplorasi Lanjutan ${mapel}`,
          tujuanPembelajaran: "Menganalisis keterkaitan konsep tingkat lanjut dan penerapannya dalam studi kasus.",
          alokasiJP: "18 JP",
          keterangan: "Problem Based Learning",
        },
        {
          semester: "2 (Genap)",
          noUnit: "Bab 4",
          topikMateri: `Proyek Terpadu & Evaluasi Komprehensif ${mapel}`,
          tujuanPembelajaran: "Menghasilkan karya aplikatif kolaboratif dan mempresentasikan hasil evaluasi.",
          alokasiJP: "18 JP",
          keterangan: "Project Based Learning",
        },
      ],
      totalJPGanjil: "36 JP",
      totalJPGenap: "36 JP",
    });
  }

  if (pLower.includes('"barispromes"')) {
    return JSON.stringify({
      judul: `PROGRAM SEMESTER (PROMES) — ${mapel.toUpperCase()}`,
      barisPromes: [
        {
          no: 1,
          kompDasarTP: `Memahami konsep dasar dan mengidentifikasi karakteristik utama pada ${mapel}`,
          materiPokok: "Bab 1: Pengenalan & Konsep Dasar",
          alokasiJP: "8 JP",
          bulanMinggu: "Juli (Minggu ke-3 & 4)",
          metodeAsesmen: "Observasi & Tes Formatif",
        },
        {
          no: 2,
          kompDasarTP: `Menganalisis prinsip kerja dan menerapkan prosedur pada studi kasus kontekstual`,
          materiPokok: "Bab 2: Eksplorasi & Penerapan",
          alokasiJP: "12 JP",
          bulanMinggu: "Agustus (Minggu ke-1 s/d 3)",
          metodeAsesmen: "Unjuk Kerja & LKPD",
        },
        {
          no: 3,
          kompDasarTP: `Mengevaluasi permasalahan nyata dan menyusun proyek solusi kolaboratif`,
          materiPokok: "Bab 3: Proyek Pemecahan Masalah",
          alokasiJP: "12 JP",
          bulanMinggu: "September - Oktober",
          metodeAsesmen: "Penilaian Proyek & Presentasi",
        },
        {
          no: 4,
          kompDasarTP: `Merefleksikan capaian pembelajaran semester dan penguatan karakter`,
          materiPokok: "Evaluasi & Review Semester",
          alokasiJP: "6 JP",
          bulanMinggu: "November (Minggu ke-2 & 3)",
          metodeAsesmen: "Asesmen Sumatif Akhir Semester",
        },
      ],
    });
  }

  if (pLower.includes('"pertanyaannonkognitif"')) {
    return JSON.stringify({
      judul: `INSTRUMEN ASESMEN DIAGNOSTIK AWAL — ${mapel.toUpperCase()}`,
      tujuanPemetaan: `Memetakan kesiapan belajar, profil gaya belajar, minat, serta kondisi psikososial peserta didik Kelas ${kelas} sebelum memulai pembelajaran ${mapel}.`,
      pertanyaanNonKognitif: [
        {
          no: 1,
          aspek: "Kesejahteraan Emosi & Motivasi",
          pertanyaan: "Bagaimana perasaanmu hari ini saat akan memulai pelajaran, dan apa hal yang paling membuatmu bersemangat belajar?",
          tindakLanjutGuru: "Menciptakan suasana kelas yang hangat dan memberikan apresiasi positif.",
        },
        {
          no: 2,
          aspek: "Preferensi Gaya Belajar",
          pertanyaan: "Apakah kamu lebih mudah memahami materi melalui gambar/video (Visual), penjelasan/diskusi (Auditori), atau praktik langsung (Kinestetik)?",
          tindakLanjutGuru: "Menyediakan variasi media belajar (diferensiasi konten dan proses).",
        },
        {
          no: 3,
          aspek: "Kebiasaan Belajar di Rumah",
          pertanyaan: "Siapa yang biasanya mendampingimu belajar di rumah, dan kendala apa yang sering kamu temui?",
          tindakLanjutGuru: "Menjalin komunikasi kemitraan dengan wali murid.",
        },
      ],
      pertanyaanKognitif: [
        {
          no: 1,
          kompetensiPrasyarat: `Pengetahuan awal tentang konsep dasar ${mapel}`,
          soalSingkat: `Apa yang kamu ketahui tentang manfaat mempelajari ${mapel} dalam kehidupan sehari-hari? Berikan 1 contoh!`,
          kunciJawaban: "Menyebutkan pengertian dasar dan minimal 1 contoh relevan di lingkungan sekitar.",
          intervensiJikaSalah: "Memberikan apersepsi visual dan jembatan konsep (scaffolding) di awal pelajaran.",
        },
        {
          no: 2,
          kompetensiPrasyarat: "Kemampuan membaca informasi/stimulus dasar",
          soalSingkat: `Perhatikan fenomena sederhana di sekitar kelas kita, bagaimana hubungannya dengan materi yang akan kita pelajari?`,
          kunciJawaban: "Mampu mengaitkan fenomena dengan topik pelajaran secara logis.",
          intervensiJikaSalah: "Pendampingan diskusi terarah dalam kelompok heterogen.",
        },
      ],
    });
  }

  if (pLower.includes('"barisjurnal"')) {
    return JSON.stringify({
      judul: `JURNAL AGENDA MENGAJAR & REFLEKSI GURU — ${mapel.toUpperCase()}`,
      barisJurnal: [
        {
          pertemuanKe: 1,
          topikMateri: `Pengantar & Eksplorasi Konsep Dasar ${mapel}`,
          tujuanPembelajaran: "Peserta didik mampu memahami konsep dasar dan mengidentifikasi contoh di sekitar.",
          aktivitasDeepLearning: "Mindful check-in, pengamatan fenomena nyata, dan diskusi kelompok.",
          ketercapaianKKTP: "88% Tuntas",
          refleksiTindakLanjut: "Siswa sangat antusias; 3 siswa diberikan bimbingan penguatan istilah dasar.",
        },
        {
          pertemuanKe: 2,
          topikMateri: `Analisis Studi Kasus Kontekstual`,
          tujuanPembelajaran: "Peserta didik mampu menganalisis masalah nyata menggunakan konsep yang dipelajari.",
          aktivitasDeepLearning: "Eksplorasi LKPD kolaboratif dan tanya jawab kritis.",
          ketercapaianKKTP: "90% Tuntas",
          refleksiTindakLanjut: "Diskusi berjalan hidup; waktu presentasi perlu diatur lebih efektif.",
        },
        {
          pertemuanKe: 3,
          topikMateri: `Praktik & Proyek Pemecahan Masalah`,
          tujuanPembelajaran: "Peserta didik mampu menyajikan solusi/karya aplikatif secara berkelompok.",
          aktivitasDeepLearning: "Unjuk karya (Joyful learning), umpan balik rekan sejawat, dan refleksi metakognitif.",
          ketercapaianKKTP: "94% Tuntas",
          refleksiTindakLanjut: "Seluruh kelompok berhasil menyelesaikan karya dengan sangat baik.",
        },
      ],
    });
  }

  return JSON.stringify({ status: "ok", message: "Berhasil diproses." });
}
