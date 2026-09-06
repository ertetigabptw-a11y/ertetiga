export type Role = 'superadmin' | 'ketua_rt' | 'keamanan' | 'bendahara' | 'warga';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
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
  alamatPemilik: string;
  email?: string;
  hpPemilik?: string;
  hpPenghuni?: string;
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
  saldoAwalBulanLalu: number; // minus = piutang/kurang bayar, plus = dana titipan
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
  statusWajib: 'Wajib Ronda';
  kategori: string;
  jumlahAlpa: number; // 0-4
  dendaTotal: number;
  statusPushed: boolean;
  periode: string; // e.g. "September 2026"
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
  jenis: 'undangan_rapat' | 'undangan_kerja_bakti' | 'pengantar_administrasi' | 'somasi';
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
  periode: string; // e.g. "September 2026"
  // Komponen Iuran
  dansosRT: number;
  dansosRW: number;
  pembangunan: number;
  snack: number;
  jimpitan: number;
  totalIuran: number;
  // Denda
  dendaRonda: number;
  dendaKerjaBakti: number;
  totalDenda: number;
  // Status bulan lalu
  piutangBulanLalu: number;    // nominal hutang warga ke kas RT
  titipanBulanLalu: number;    // nominal kelebihan bayar warga sebelumnya
  titipanDigunakanUntukTagihan: number;
  // Perhitungan
  totalKewajiban: number; // totalIuran + totalDenda + piutangBulanLalu - titipanDigunakanUntukTagihan
  jumlahDibayar: number;
  statusBayar: 'Lunas' | 'Kurang Bayar' | 'Belum Bayar' | 'Lebih Bayar';
  // Sisa kelebihan bayar bulan ini
  kelebihanBayar: number;
  alokasiKelebihan?: 'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali';
  alokasiNominal?: number;
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
  kategori: 'Iuran Warga' | 'Denda Ronda' | 'Denda Kerja Bakti' | 'Donasi Warga' | 'Kelebihan Bayar Dialihkan Donasi' | 'Lainnya';
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
}
