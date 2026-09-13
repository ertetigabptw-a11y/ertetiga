export type Role = 'superadmin' | 'ketua_rt' | 'keamanan' | 'bendahara' | 'warga';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  jabatan?: string;
  kontakHp?: string;
  avatarUrl?: string;
  wargaId?: number; // linked warga ID for warga role
}

export interface Warga {
  id: number;
  alamat: string;
  blok: string;
  noRumah: string;
  wujudAset: string;
  namaPemilik: string;
  statusHuni: 'Dihuni' | 'Kosong' | 'Tanah';
  namaPenghuni: string;
  statusUsiaPenghuni: 'Produktif' | 'Lansia' | '-';
  statusTinggal: 'Tetap' | 'Sementara' | '-';
  domisiliKerja: 'Dalam Kota' | 'Luar Kota' | '-';
  jenisKelamin: 'Laki-laki' | 'Perempuan' | '-';
  statusPernikahan?: 'Menikah' | 'Blm Menikah';
  alamatPemilik: string;
  email?: string;
  hpPemilik?: string;
  hpPenghuni?: string;
  kontakHp?: string;
  avatarUrl?: string;
  catatan: string;
  // Dari sheet Keamanan
  kriteriaRonda: 'Wajib Ronda' | 'Tidak Ronda';
  dendaPerHari: number;
  dendaSebulan: number;
  // Dari sheet Bendahara
  pjKeuangan: string;
  dansosRT: number;
  dansosRW: number;
  pembangunan: number;
  snackRapat: number;
  jimpitan: number;
  totalIuran: number;
  saldoAwalBulanLalu: number; // minus = piutang/kurang bayar, plus = saldo deposit warga bulan lalu
  dendaRondaAgustus?: number; // Denda ronda bulan Agustus yang sudah terposting menjadi komponen tagihan
}

export interface RondaSchedule {
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  petugasNames: string[];
}

export interface PresensiRonda {
  id: string;
  wargaId: number;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm:ss
  lat: number;
  lng: number;
  distanceMeters: number;
  withinRadius: boolean;
  selfieBase64: string;
  status: 'Hadir' | 'Izin' | 'Alpa';
  keterangan?: string;
}

export interface DendaRondaEntry {
  wargaId: number;
  nama: string;
  blok?: string;
  noRumah?: string;
  statusWajib: 'Wajib Ronda';
  kategori: string;
  // Checklist 4 Minggu Ronda:
  // Dalam 1 minggu warga hanya diperbolehkan satu kali presensi meskipun tidak pada jadwalnya
  minggu1: boolean; // Hadir Minggu 1 (Tgl 1 - 7)
  minggu2: boolean; // Hadir Minggu 2 (Tgl 8 - 14)
  minggu3: boolean; // Hadir Minggu 3 (Tgl 15 - 21)
  minggu4: boolean; // Hadir Minggu 4 (Tgl 22 - 30/31)
  jumlahAlpa: number; // 4 dikurangi jumlah minggu yang hadir
  dendaPerAlpa: number; // Nominal denda per ketidakhadiran (misal Rp 12.500 atau Rp 25.000)
  dendaTotal: number; // jumlahAlpa * dendaPerAlpa
  statusPushed: boolean;
  periode: string; // e.g. "September 2026"
  kontakHp?: string;
  catatan?: string;
}

export interface KerjaBaktiEvent {
  id: string;
  tanggal: string;
  judul: string;
  deskripsi: string;
  dendaPerAlpa: number; // Default 25000
  kehadiran: {
    wargaId: number;
    nama: string;
    jenisKelamin: string;
    hadir: boolean;
    denda: number;
  }[];
  isPushedToBendahara: boolean;
}

export interface SuratRT {
  id: string;
  jenis: 'undangan_rapat' | 'undangan_kerja_bakti' | 'pengantar_administrasi' | 'somasi' | 'surat_peringatan';
  nomorSurat: string;
  tanggal: string;
  perihal: string;
  tujuan: 'Semua Warga (Group WA)' | string; // Nama warga spesifik atau grup
  targetHp?: string;
  tempat?: string;
  waktuAcara?: string;
  agenda?: string;
  isiSurat: string;
  penandatangan: string;
  nik?: string;
  keperluan?: string;
  berlakuHingga?: string;
  pekerjaan?: string;
  agama?: string;
  statusPernikahan?: 'Menikah' | 'Blm Menikah';
  statusKirimWA?: 'Terkirim' | 'Belum' | 'Gagal';
  tglKirimWA?: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  kategori: 'Penting' | 'Informasi' | 'Kegiatan' | 'Darurat';
  author: string;
  dibacaOleh: string[];
}

export interface KeluhanWarga {
  id: string;
  wargaId: number;
  namaWarga: string;
  blokNo: string;
  tanggal: string;
  kategori: 'Keamanan' | 'Kebersihan' | 'Fasilitas' | 'Ketertiban' | 'Lainnya';
  judul: string;
  deskripsi: string;
  fotoUrl?: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Ditolak';
  tanggapanPengurus?: string;
}

export interface TagihanWarga {
  id: string;
  wargaId: number;
  nama: string;
  blokNo: string;
  kontakHp?: string;
  periode: string; // e.g. "September 2026"
  // Komponen Iuran
  dansosRT: number;
  dansosRW: number;
  pembangunan: number;
  snack: number;
  jimpitan: number;
  totalIuran: number;
  // Denda
  dendaRonda: number; // Denda bulan sebelumnya yang ditagihkan bulan ini (Agustus = 0)
  dendaRondaBulanLalu?: number; // Denda bulan sebelumnya (Agustus = 0)
  dendaRondaBulanBerjalan?: number; // Akumulasi denda ronda bulan berjalan (September) yang akan ditagihkan bulan depan
  dendaKerjaBakti: number;
  totalDenda: number;
  // Status bulan lalu
  piutangBulanLalu: number;    // Kekurangan (-) bayar dari bulan sebelumnya = Piutang Warga (Debit / Hak Kas RT)
  titipanBulanLalu: number;    // Kelebihan (+) bayar dari bulan sebelumnya = Deposit Awal Warga
  titipanDigunakanUntukTagihan: number; // Otomatis dipotong untuk tagihan bulan ini
  depositBulanLalu?: number;   // alias saldo deposit bulan lalu
  depositDigunakanUntukTagihan?: number; // alias potongan deposit untuk pembayaran tagihan bulan ini
  // Perhitungan
  totalKewajiban: number; // totalIuran + totalDenda + piutangBulanLalu - titipanDigunakanUntukTagihan
  jumlahDibayar: number;
  statusBayar: 'Lunas' | 'Kurang Bayar' | 'Belum Bayar' | 'Lebih Bayar';
  // Sisa saldo deposit warga (setelah dikurangi tagihan bulan ini)
  kelebihanBayar: number; // sisa saldo deposit yang belum terpakai (dapat dialokasikan untuk Donasi dan/atau Tagihan Bulan Datang)
  saldoDeposit?: number;  // alias sisa saldo deposit aktif
  alokasiKelebihan?: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali';
  alokasiDeposit?: 'pembayaran_tagihan' | 'donasi_kas'; // peruntukan: Donasi atau Pembayaran tagihan bulan depan
  alokasiNominal?: number;
  alokasiDonasiNominal?: number; // nominal yang dialokasikan untuk Donasi Kas RT
  alokasiTagihanMendatangNominal?: number; // nominal yang dialokasikan untuk Pembayaran Tagihan di Bulan yang Akan Datang
  tglBayar?: string;
  metodeBayar?: 'Transfer' | 'Tunai / Jimpitan';
  buktiBayar?: string;
  catatan?: string;
}

export interface PengeluaranKas {
  id: string;
  tanggal: string;
  komponen: 
    | 'Dana Apresiasi RT'
    | 'Dansos RW'
    | 'Bayar Listrik Pos'
    | 'Bayar Tagihan PDAM'
    | 'Uang Snack Rapat RT'
    | 'Santunan Duka Cita (Kematian)'
    | 'Bantuan Warga Sakit (Rawat Inap)'
    | 'Logistik POS Ronda'
    | 'Logistik Kerja Bakti'
    | 'Pembelian material pekerjaan'
    | 'Pengeluaran lainnya';
  namaPenerimaOrPekerjaan?: string;
  nominal: number;
  keterangan: string;
  buktiUrl?: string;
}

export interface PemasukanKas {
  id: string;
  tanggal: string;
  kategori:
    | 'Iuran Warga'
    | 'Denda Ronda'
    | 'Denda Kerja Bakti'
    | 'Donasi Warga'
    | 'Kelebihan Bayar Dialihkan Donasi'
    | 'Pelunasan Piutang Warga'
    | 'Lainnya';
  namaSumber: string;
  nominal: number;
  keterangan: string;
}

export interface HutangRT {
  id: string;
  tanggal: string;
  kreditur: string; // Vendor atau Warga talangan
  deskripsi: string;
  totalHutang: number;
  sudahDibayar: number;
  sisaHutang: number;
  status: 'Belum Lunas' | 'Lunas';
  jatuhTempo?: string;
}

export interface PiutangWargaLainnya {
  id: string;
  tanggal: string;
  namaWarga: string;
  blokNo?: string;
  jenis: 'Dana Talangan' | 'Pinjaman Darurat' | 'Penundaan Kewajiban Khusus';
  deskripsi: string;
  totalPiutang: number;
  sudahDibayar: number;
  sisaPiutang: number;
  status: 'Belum Lunas' | 'Lunas';
  jatuhTempo?: string;
}

export interface LaporanBukuKasBulanan {
  id: string;
  periode: string; // e.g. "Oktober 2026", "November 2026"
  tanggalClosing: string;
  saldoAwalKas: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhirKas: number;
  totalPiutangWarga: number;
  totalDepositWarga: number;
  totalHutangRT: number;
  wargaMenunggakCount: number;
  wargaDepositCount: number;
  wargaLunasCount: number;
  tagihanSnapshot: TagihanWarga[];
  pemasukanSnapshot: PemasukanKas[];
  pengeluaranSnapshot: PengeluaranKas[];
  catatan?: string;
}

export interface AppSettings {
  fonnteToken: string;
  targetGroupWa: string;
  posRondaLat: number;
  posRondaLng: number;
  posRondaRadiusMeters: number;
  bypassRadiusForDemo: boolean;
  bypassHoursForDemo: boolean;
  jamMulaiRonda: string; // "22:00"
  jamSelesaiRonda: string; // "23:59"
  tarifKerjaBaktiDenda: number; // 25000
  saldoAwalKas?: number; // Saldo awal pembukuan kas RT (bisa diisi oleh Super Admin, default 0)
  periodeAwalPembukuan?: string; // e.g. "Oktober 2026"
}
