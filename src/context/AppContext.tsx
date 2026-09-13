import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  UserAccount,
  Warga,
  RondaSchedule,
  PresensiRonda,
  DendaRondaEntry,
  KerjaBaktiEvent,
  SuratRT,
  Pengumuman,
  KeluhanWarga,
  TagihanWarga,
  PengeluaranKas,
  PemasukanKas,
  HutangRT,
  PiutangWargaLainnya,
  AppSettings,
  LaporanBukuKasBulanan,
} from '../types';
import {
  INITIAL_WARGA_LIST,
  INITIAL_RONDA_SCHEDULES,
  INITIAL_USER_ACCOUNTS,
  DEFAULT_APP_SETTINGS,
  INITIAL_PENGELUARAN_KAS,
  INITIAL_PEMASUKAN_KAS,
  INITIAL_HUTANG_RT,
  INITIAL_PIUTANG_LAINNYA,
  INITIAL_SURAT_LIST,
  INITIAL_PENGUMUMAN,
  INITIAL_PRESENSI_LIST,
} from '../data/initialData';
import { sendFonnteMessage, FonnteResponse } from '../services/fonnteService';
import { testFirestoreConnection } from '../lib/firebase';
import {
  SyncData,
  SyncStatus,
  subscribeToFirestoreSync,
  debouncedPushToFirestore,
  pushStateToFirestore,
  setInternalUpdateFlag,
} from '../services/firebaseSyncService';

interface AppContextType {
  currentUser: UserAccount | null;
  currentRole: Role;
  users: UserAccount[];
  wargaList: Warga[];
  rondaSchedules: RondaSchedule[];
  presensiList: PresensiRonda[];
  dendaRondaList: DendaRondaEntry[];
  kerjaBaktiEvents: KerjaBaktiEvent[];
  suratList: SuratRT[];
  pengumumanList: Pengumuman[];
  keluhanList: KeluhanWarga[];
  tagihanList: TagihanWarga[];
  pengeluaranList: PengeluaranKas[];
  pemasukanList: PemasukanKas[];
  hutangList: HutangRT[];
  piutangLainnyaList: PiutangWargaLainnya[];
  settings: AppSettings;
  syncStatus: SyncStatus;
  forceSyncToCloud: () => Promise<boolean>;

  // Actions
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  switchRoleDirectly: (role: Role, targetWargaId?: number) => void;
  updateUserAccount: (userId: string, dataOrUsername: Partial<UserAccount> | string, newPassword?: string) => void;
  updateWarga: (id: number, data: Partial<Warga>) => void;
  addWarga: (warga: Omit<Warga, 'id'>) => void;
  deleteWarga: (id: number) => void;
  updateRondaSchedule: (hari: RondaSchedule['hari'], petugasNames: string[]) => void;
  addPresensiRonda: (entry: Omit<PresensiRonda, 'id'>) => Promise<PresensiRonda>;
  toggleDendaRondaWeek: (wargaId: number, week: 1 | 2 | 3 | 4) => void;
  pushDendaRondaToBendahara: () => void;
  unpushDendaRondaFromBendahara: () => void;
  addKerjaBaktiEvent: (event: Omit<KerjaBaktiEvent, 'id' | 'isPushedToBendahara'>) => void;
  updateKerjaBaktiAttendance: (eventId: string, wargaId: number, hadir: boolean) => void;
  pushDendaKerjaBaktiToBendahara: (eventId: string) => void;
  unpushDendaKerjaBaktiFromBendahara: (eventId: string) => void;
  addSurat: (surat: Omit<SuratRT, 'id'>) => void;
  updateSurat: (id: string, surat: Partial<SuratRT>) => void;
  deleteSurat: (id: string) => void;
  broadcastSuratViaWA: (suratId: string) => Promise<FonnteResponse>;
  addPengumuman: (pengumuman: Omit<Pengumuman, 'id' | 'dibacaOleh'>, sendBroadcastWA?: boolean) => Promise<void>;
  markPengumumanRead: (id: string, name: string) => void;
  submitKeluhan: (keluhan: Omit<KeluhanWarga, 'id' | 'status' | 'tanggal'>) => Promise<void>;
  updateKeluhanStatus: (id: string, status: KeluhanWarga['status'], tanggapan?: string) => void;
  bayarTagihanWarga: (
    tagihanId: string,
    jumlahBayar: number,
    metode: 'Transfer' | 'Tunai / Jimpitan',
    alokasiKelebihan?: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali',
    alokasiNominal?: number,
    tanggalBayar?: string
  ) => void;
  alokasikanDanaTitipan: (
    tagihanId: string,
    opsi: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali',
    nominal: number
  ) => void;
  alokasikanDepositWarga?: (
    tagihanId: string,
    opsi: 'pembayaran_tagihan' | 'donasi_kas',
    nominal: number
  ) => void;
  alokasikanDepositKombinasi: (
    tagihanId: string,
    nominalDonasi: number,
    nominalTagihanMendatang: number
  ) => void;
  addPengeluaranKas: (pengeluaran: Omit<PengeluaranKas, 'id'>) => void;
  updatePengeluaranKas: (id: string, data: Partial<PengeluaranKas>) => void;
  deletePengeluaranKas: (id: string) => void;
  syncAllDendaToTagihan: () => void;
  addPemasukanKas: (pemasukan: Omit<PemasukanKas, 'id'>) => void;
  addHutangRT: (hutang: Omit<HutangRT, 'id' | 'sudahDibayar' | 'sisaHutang' | 'status'>) => void;
  bayarCicilanHutang: (hutangId: string, nominal: number, tanggalBayar?: string) => void;
  addPiutangLainnya: (piutang: Omit<PiutangWargaLainnya, 'id' | 'sudahDibayar' | 'sisaPiutang' | 'status'>) => void;
  bayarCicilanPiutangLainnya: (id: string, nominal: number, tanggalBayar?: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetAllData: () => void;
  sendWhatsAppDirect: (target: string, message: string) => Promise<FonnteResponse>;
  activePeriode: string;
  setActivePeriode: (periode: string) => void;
  updateKomponenIuranWarga: (
    wargaId: number,
    komponen: {
      dansosRT: number;
      dansosRW: number;
      pembangunan: number;
      snackRapat: number;
      jimpitan: number;
    }
  ) => void;
  closingBulanKas: (namaPeriodeBaru: string) => {
    periodeLama: string;
    namaPeriodeBaru: string;
    saldoAwal: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    saldoAkhirKas: number;
    totalPiutangAkumulasi: number;
    totalDepositAkumulasi: number;
    wargaMenunggakCount: number;
    wargaDepositCount: number;
  };
  arsipLaporanBulanan: LaporanBukuKasBulanan[];
  deleteArsipLaporanBulanan: (id: string) => void;
  resetBukuKasOkt2026: (saldoAwalBaru?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'neoport3_v10_';

export const getWargaBilledName = (w: Warga): string => {
  if (w.pjKeuangan === 'Nama Pemilik' && w.namaPemilik && w.namaPemilik !== '-') {
    return w.namaPemilik;
  }
  if (w.pjKeuangan === 'Nama Penghuni' && w.namaPenghuni && w.namaPenghuni !== '-') {
    return w.namaPenghuni;
  }
  if (w.namaPenghuni && w.namaPenghuni !== '-') {
    return w.namaPenghuni;
  }
  if (w.namaPemilik && w.namaPemilik !== '-') {
    return w.namaPemilik;
  }
  return `Kavling ${w.blok}/${w.noRumah}`;
};

function getInitialTagihan(wargaList: Warga[], dendaRondaEntries?: DendaRondaEntry[]): TagihanWarga[] {
  return wargaList.map(w => {
    const totalIuran = w.totalIuran;
    const piutangBulanLalu = w.saldoAwalBulanLalu < 0 ? Math.abs(w.saldoAwalBulanLalu) : 0;
    const depositBulanLalu = w.saldoAwalBulanLalu > 0 ? w.saldoAwalBulanLalu : 0;

    const matchedDenda = dendaRondaEntries?.find(d => d.wargaId === w.id);
    const dendaRondaBulanBerjalan = matchedDenda ? matchedDenda.dendaTotal : 0;
    
    // Awal Pembukuan Oktober 2026: Denda = 0
    const dendaRondaBulanLalu = 0;
    const dendaRonda = 0;
    const dendaKerjaBakti = 0;
    const totalDenda = 0;

    // Sesuai pembukuan per Oktober 2026:
    // Total Tagihan = Total Iuran + Tunggakan (piutang bulan lalu)
    // Piutang yang ada = total tagihan dari tiap-tiap warga (Total Rp 6.609.000)
    // Warga dengan deposit (Hadi: Rp 13.000, Eva: Rp 650.000) memiliki saldoDeposit yang dapat dialokasikan
    const totalKewajiban = totalIuran + piutangBulanLalu;
    const sisaDeposit = depositBulanLalu;

    return {
      id: `tag-${w.id}`,
      wargaId: w.id,
      nama: getWargaBilledName(w),
      blokNo: `${w.blok}/${w.noRumah}`,
      kontakHp: w.kontakHp || w.hpPenghuni || w.hpPemilik || '',
      periode: 'Oktober 2026',
      dansosRT: w.dansosRT,
      dansosRW: w.dansosRW,
      pembangunan: w.pembangunan,
      snack: w.snackRapat,
      jimpitan: w.jimpitan,
      totalIuran: totalIuran,
      dendaRonda: 0,
      dendaRondaBulanLalu: 0,
      dendaRondaBulanBerjalan: dendaRondaBulanBerjalan,
      dendaKerjaBakti: 0,
      totalDenda: 0,
      piutangBulanLalu: piutangBulanLalu,
      titipanBulanLalu: depositBulanLalu,
      titipanDigunakanUntukTagihan: 0,
      depositBulanLalu: depositBulanLalu,
      depositDigunakanUntukTagihan: 0,
      totalKewajiban: totalKewajiban,
      jumlahDibayar: 0,
      statusBayar: totalKewajiban === 0 ? 'Lunas' : 'Belum Bayar',
      kelebihanBayar: sisaDeposit,
      saldoDeposit: sisaDeposit,
      alokasiKelebihan: sisaDeposit > 0 ? 'pembayaran_tagihan' : undefined,
      alokasiDeposit: sisaDeposit > 0 ? 'pembayaran_tagihan' : undefined,
    };
  });
}

export function getRondaWeekNumber(dateString?: string): 1 | 2 | 3 | 4 {
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export function calculateDendaEntry(
  w: Warga | undefined,
  m1: boolean,
  m2: boolean,
  m3: boolean,
  m4: boolean
): { jumlahAlpa: number; dendaPerAlpa: number; dendaTotal: number; keteranganTarif: string } {
  const hadirCount = (m1 ? 1 : 0) + (m2 ? 1 : 0) + (m3 ? 1 : 0) + (m4 ? 1 : 0);
  const alpaCount = 4 - hadirCount;
  const dendaPerAlpa = 5000;

  let dendaTotal = 0;
  let keteranganTarif = '';

  if (alpaCount === 0) {
    dendaTotal = 0;
    keteranganTarif = 'Lengkap (Bebas Denda)';
  } else if (alpaCount < 4) {
    // Denda per ketidakhadiran = 5.000
    dendaTotal = alpaCount * dendaPerAlpa;
    keteranganTarif = `${alpaCount}x Alpa @ Rp 5.000`;
  } else {
    // Tidak hadir 1 bulan penuh (4 minggu alpa):
    // Jika status usia produktif domisili kerja luar kota: 25.000
    // Jika status usia produktif domisili kerja dalam kota: 50.000
    const isLuarKota = w?.domisiliKerja === 'Luar Kota';
    if (isLuarKota) {
      dendaTotal = 25000;
      keteranganTarif = '1 Bulan Penuh (Produktif Luar Kota: Rp 25.000)';
    } else {
      dendaTotal = 50000;
      keteranganTarif = '1 Bulan Penuh (Produktif Dalam Kota: Rp 50.000)';
    }
  }

  return { jumlahAlpa: alpaCount, dendaPerAlpa, dendaTotal, keteranganTarif };
}

function getInitialDendaRonda(wargaList: Warga[]): DendaRondaEntry[] {
  return wargaList
    .filter(w => w.kriteriaRonda === 'Wajib Ronda' && w.namaPenghuni !== '-')
    .map(w => {
      // Data simulasi awal: Minggu 1 (Tgl 1-7) sebagian warga sudah presensi
      const m1 = w.id % 2 === 1 || w.namaPenghuni === 'LUKMAN' || w.namaPenghuni === 'TITO' || w.namaPenghuni === 'INDRAWAN';
      const m2 = false;
      const m3 = false;
      const m4 = false;
      const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(w, m1, m2, m3, m4);

      return {
        wargaId: w.id,
        nama: w.namaPenghuni,
        blok: w.blok,
        noRumah: w.noRumah,
        kontakHp: w.kontakHp || w.hpPenghuni || w.hpPemilik || '',
        statusWajib: 'Wajib Ronda',
        kategori: `${w.statusUsiaPenghuni}, ${w.domisiliKerja}, ${w.jenisKelamin}`,
        minggu1: m1,
        minggu2: m2,
        minggu3: m3,
        minggu4: m4,
        jumlahAlpa,
        dendaPerAlpa,
        dendaTotal,
        catatan: keteranganTarif,
        statusPushed: false,
        periode: 'September 2026',
      };
    });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or fallback to initial
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'users');
    return saved ? JSON.parse(saved) : INITIAL_USER_ACCOUNTS;
  });

  const [wargaList, setWargaList] = useState<Warga[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'warga');
    return saved ? JSON.parse(saved) : INITIAL_WARGA_LIST;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'currentUser');
    if (saved) return JSON.parse(saved);
    // Default logged in as Super Admin for smooth preview
    return INITIAL_USER_ACCOUNTS[0];
  });

  const [rondaSchedules, setRondaSchedules] = useState<RondaSchedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'schedules');
    return saved ? JSON.parse(saved) : INITIAL_RONDA_SCHEDULES;
  });

  const [presensiList, setPresensiList] = useState<PresensiRonda[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'presensi');
    return saved ? JSON.parse(saved) : INITIAL_PRESENSI_LIST;
  });

  const [dendaRondaList, setDendaRondaList] = useState<DendaRondaEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'dendaRonda');
    if (saved) {
      try {
        const parsed: DendaRondaEntry[] = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].minggu1 !== undefined) {
          return parsed.map(d => {
            const w = INITIAL_WARGA_LIST.find(x => x.id === d.wargaId);
            const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(
              w,
              d.minggu1,
              d.minggu2,
              d.minggu3,
              d.minggu4
            );
            return {
              ...d,
              jumlahAlpa,
              dendaPerAlpa,
              dendaTotal,
              catatan: keteranganTarif,
            };
          });
        }
      } catch (e) {
        console.error('Error loading dendaRonda:', e);
      }
    }
    return getInitialDendaRonda(INITIAL_WARGA_LIST);
  });

  const [kerjaBaktiEvents, setKerjaBaktiEvents] = useState<KerjaBaktiEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'kerjaBakti');
    if (saved) return JSON.parse(saved);

    // Initial event for September
    const males = INITIAL_WARGA_LIST.filter(w => w.jenisKelamin === 'Laki-laki' && w.namaPenghuni !== '-');
    return [
      {
        id: 'kb-sep-1',
        tanggal: '2026-09-13',
        judul: 'Kerja Bakti Normalisasi Saluran Air & Pembersihan Paving',
        deskripsi: 'Kegiatan rutin membersihkan drainase utama menyambut musim penghujan. Wajib bagi bapak-bapak.',
        dendaPerAlpa: 25000,
        kehadiran: males.map(m => ({
          wargaId: m.id,
          nama: m.namaPenghuni,
          jenisKelamin: m.jenisKelamin,
          hadir: true,
          denda: 0,
        })),
        isPushedToBendahara: false,
      },
    ];
  });

  const [suratList, setSuratList] = useState<SuratRT[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'surat');
    return saved ? JSON.parse(saved) : INITIAL_SURAT_LIST;
  });

  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pengumuman');
    return saved ? JSON.parse(saved) : INITIAL_PENGUMUMAN;
  });

  const [keluhanList, setKeluhanList] = useState<KeluhanWarga[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'keluhan');
    return saved ? JSON.parse(saved) : [
      {
        id: 'klh-1',
        wargaId: 4,
        namaWarga: 'INDRAWAN',
        blokNo: 'UT/7',
        tanggal: '2026-09-04',
        kategori: 'Fasilitas',
        judul: 'Lampu Penerangan Jalan Blok UT Redup',
        deskripsi: 'Lampu PJU di dekat kavling UT 7 berkedip-kedip dan mulai redup, mohon dicek tim keamanan / pengurus.',
        status: 'Diproses',
        tanggapanPengurus: 'Sudah dikoordinasikan untuk penggantian bohlam LED baru hari ini.',
      }
    ];
  });

  const [activePeriode, setActivePeriode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_PREFIX + 'active_periode') || 'Oktober 2026';
  });

  const [tagihanList, setTagihanList] = useState<TagihanWarga[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'tagihan');
    const initialDenda = getInitialDendaRonda(INITIAL_WARGA_LIST);
    if (saved) {
      try {
        const parsed: TagihanWarga[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing tagihan from localStorage:', e);
      }
    }
    return getInitialTagihan(INITIAL_WARGA_LIST, initialDenda);
  });

  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranKas[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pengeluaran');
    return saved ? JSON.parse(saved) : INITIAL_PENGELUARAN_KAS;
  });

  const [pemasukanList, setPemasukanList] = useState<PemasukanKas[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pemasukan');
    return saved ? JSON.parse(saved) : INITIAL_PEMASUKAN_KAS;
  });

  const [hutangList, setHutangList] = useState<HutangRT[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'hutang');
    return saved ? JSON.parse(saved) : INITIAL_HUTANG_RT;
  });

  const [piutangLainnyaList, setPiutangLainnyaList] = useState<PiutangWargaLainnya[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'piutangLainnya');
    return saved ? JSON.parse(saved) : INITIAL_PIUTANG_LAINNYA;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : DEFAULT_APP_SETTINGS;
  });

  const [arsipLaporanBulanan, setArsipLaporanBulanan] = useState<LaporanBukuKasBulanan[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'arsip_laporan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing arsip laporan:', e);
      }
    }
    return [
      {
        id: 'lap-sep-2026',
        periode: 'September 2026',
        tanggalClosing: '2026-09-30',
        saldoAwalKas: 0,
        totalPemasukan: 0,
        totalPengeluaran: 0,
        saldoAkhirKas: 0,
        totalPiutangWarga: 4629000,
        totalDepositWarga: 663000,
        totalHutangRT: 0,
        wargaMenunggakCount: 21,
        wargaDepositCount: 2,
        wargaLunasCount: 33,
        tagihanSnapshot: [],
        pemasukanSnapshot: [],
        pengeluaranSnapshot: [],
        catatan: 'Laporan Tutup Buku Kas RT.03 Periode September 2026 (Transisi Menuju Awal Pembukuan Baru Oktober 2026)',
      },
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'arsip_laporan', JSON.stringify(arsipLaporanBulanan));
  }, [arsipLaporanBulanan]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'active_periode', activePeriode);
  }, [activePeriode]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'warga', JSON.stringify(wargaList));
  }, [wargaList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'schedules', JSON.stringify(rondaSchedules));
  }, [rondaSchedules]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'presensi', JSON.stringify(presensiList));
  }, [presensiList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'dendaRonda', JSON.stringify(dendaRondaList));
  }, [dendaRondaList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'kerjaBakti', JSON.stringify(kerjaBaktiEvents));
  }, [kerjaBaktiEvents]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'surat', JSON.stringify(suratList));
  }, [suratList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pengumuman', JSON.stringify(pengumumanList));
  }, [pengumumanList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'keluhan', JSON.stringify(keluhanList));
  }, [keluhanList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tagihan', JSON.stringify(tagihanList));
  }, [tagihanList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pengeluaran', JSON.stringify(pengeluaranList));
  }, [pengeluaranList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pemasukan', JSON.stringify(pemasukanList));
  }, [pemasukanList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'hutang', JSON.stringify(hutangList));
  }, [hutangList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'piutangLainnya', JSON.stringify(piutangLainnyaList));
  }, [piutangLainnyaList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);

  // ==========================================
  // CLOUD FIRESTORE MULTI-DEVICE SYNC
  // ==========================================
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    isSyncing: true,
    lastSyncTime: null,
    lastUpdatedBy: null,
    error: null,
  });

  const isInitialSyncDone = React.useRef(false);

  // Subscribe to real-time changes across devices
  useEffect(() => {
    testFirestoreConnection();

    const initialBundle: SyncData = {
      users,
      wargaList,
      rondaSchedules,
      presensiList,
      dendaRondaList,
      kerjaBaktiEvents,
      suratList,
      pengumumanList,
      keluhanList,
      tagihanList,
      pengeluaranList,
      pemasukanList,
      hutangList,
      piutangLainnyaList,
      settings,
      arsipLaporanBulanan,
      activePeriode,
    };

    const unsubscribe = subscribeToFirestoreSync(
      initialBundle,
      (remote) => {
        setInternalUpdateFlag(true);
        if (remote.users && Array.isArray(remote.users) && remote.users.length > 0) {
          setUsers(remote.users);
        }
        if (remote.wargaList && Array.isArray(remote.wargaList) && remote.wargaList.length > 0) {
          setWargaList(remote.wargaList);
        }
        if (remote.rondaSchedules && Array.isArray(remote.rondaSchedules) && remote.rondaSchedules.length > 0) {
          setRondaSchedules(remote.rondaSchedules);
        }
        if (remote.presensiList && Array.isArray(remote.presensiList)) {
          setPresensiList(remote.presensiList);
        }
        if (remote.dendaRondaList && Array.isArray(remote.dendaRondaList) && remote.dendaRondaList.length > 0) {
          setDendaRondaList(remote.dendaRondaList);
        }
        if (remote.kerjaBaktiEvents && Array.isArray(remote.kerjaBaktiEvents)) {
          setKerjaBaktiEvents(remote.kerjaBaktiEvents);
        }
        if (remote.suratList && Array.isArray(remote.suratList)) {
          setSuratList(remote.suratList);
        }
        if (remote.pengumumanList && Array.isArray(remote.pengumumanList)) {
          setPengumumanList(remote.pengumumanList);
        }
        if (remote.keluhanList && Array.isArray(remote.keluhanList)) {
          setKeluhanList(remote.keluhanList);
        }
        if (remote.tagihanList && Array.isArray(remote.tagihanList) && remote.tagihanList.length > 0) {
          setTagihanList(remote.tagihanList);
        }
        if (remote.pengeluaranList && Array.isArray(remote.pengeluaranList)) {
          setPengeluaranList(remote.pengeluaranList);
        }
        if (remote.pemasukanList && Array.isArray(remote.pemasukanList)) {
          setPemasukanList(remote.pemasukanList);
        }
        if (remote.hutangList && Array.isArray(remote.hutangList)) {
          setHutangList(remote.hutangList);
        }
        if (remote.piutangLainnyaList && Array.isArray(remote.piutangLainnyaList)) {
          setPiutangLainnyaList(remote.piutangLainnyaList);
        }
        if (remote.arsipLaporanBulanan && Array.isArray(remote.arsipLaporanBulanan)) {
          setArsipLaporanBulanan(remote.arsipLaporanBulanan);
        }
        if (remote.activePeriode && typeof remote.activePeriode === 'string') {
          setActivePeriode(remote.activePeriode);
        }
        if (remote.settings && typeof remote.settings === 'object' && remote.settings.posRondaRadiusMeters !== undefined) {
          setSettings(remote.settings);
        }

        setTimeout(() => {
          setInternalUpdateFlag(false);
          isInitialSyncDone.current = true;
        }, 150);
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time synchronization push to Firestore when local state mutates
  useEffect(() => {
    if (!isInitialSyncDone.current) return;

    debouncedPushToFirestore(
      {
        users,
        wargaList,
        rondaSchedules,
        presensiList,
        dendaRondaList,
        kerjaBaktiEvents,
        suratList,
        pengumumanList,
        keluhanList,
        tagihanList,
        pengeluaranList,
        pemasukanList,
        hutangList,
        piutangLainnyaList,
        settings,
        arsipLaporanBulanan,
        activePeriode,
      },
      currentUser ? `${currentUser.role} (${currentUser.name})` : 'Aplikasi RT.03'
    );
  }, [
    users,
    wargaList,
    rondaSchedules,
    presensiList,
    dendaRondaList,
    kerjaBaktiEvents,
    suratList,
    pengumumanList,
    keluhanList,
    tagihanList,
    pengeluaranList,
    pemasukanList,
    hutangList,
    piutangLainnyaList,
    settings,
    arsipLaporanBulanan,
    activePeriode,
  ]);

  const forceSyncToCloud = async (): Promise<boolean> => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const success = await pushStateToFirestore(
      {
        users,
        wargaList,
        rondaSchedules,
        presensiList,
        dendaRondaList,
        kerjaBaktiEvents,
        suratList,
        pengumumanList,
        keluhanList,
        tagihanList,
        pengeluaranList,
        pemasukanList,
        hutangList,
        piutangLainnyaList,
        settings,
        arsipLaporanBulanan,
        activePeriode,
      },
      currentUser ? `${currentUser.role} (${currentUser.name}) - Manual Sync` : 'Sinkronisasi Manual'
    );
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      isConnected: success,
      lastSyncTime: success ? new Date().toISOString() : prev.lastSyncTime,
      lastUpdatedBy: success ? (currentUser ? currentUser.name : 'Manual') : prev.lastUpdatedBy,
    }));
    return success;
  };

  // Auth actions
  const login = (username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    const matched = users.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (matched) {
      setCurrentUser(matched);
      return { success: true, message: `Selamat datang, ${matched.name}!` };
    }
    return { success: false, message: 'Username atau password salah. Silakan coba lagi.' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRoleDirectly = (targetRole: Role, targetWargaId?: number) => {
    if (targetRole === 'warga') {
      const wargaUser = users.find(u => u.role === 'warga' && (targetWargaId ? u.wargaId === targetWargaId : true))
        || users.find(u => u.role === 'warga')
        || {
          id: 'usr-warga-demo',
          username: 'tito',
          password: '12345',
          role: 'warga' as Role,
          name: 'TITO',
          wargaId: 1,
        };
      setCurrentUser(wargaUser);
    } else {
      const roleUser = users.find(u => u.role === targetRole);
      if (roleUser) {
        setCurrentUser(roleUser);
      }
    }
  };

  const updateUserAccount = (userId: string, dataOrUsername: Partial<UserAccount> | string, newPassword?: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          if (typeof dataOrUsername === 'string') {
            return {
              ...u,
              username: dataOrUsername.trim(),
              ...(newPassword ? { password: newPassword.trim() } : {}),
            };
          } else {
            return {
              ...u,
              ...dataOrUsername,
              ...(dataOrUsername.username ? { username: dataOrUsername.username.trim() } : {}),
              ...(dataOrUsername.password ? { password: dataOrUsername.password.trim() } : {}),
            };
          }
        }
        return u;
      })
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        if (typeof dataOrUsername === 'string') {
          return {
            ...prev,
            username: dataOrUsername.trim(),
            ...(newPassword ? { password: newPassword.trim() } : {}),
          };
        } else {
          return {
            ...prev,
            ...dataOrUsername,
            ...(dataOrUsername.username ? { username: dataOrUsername.username.trim() } : {}),
            ...(dataOrUsername.password ? { password: dataOrUsername.password.trim() } : {}),
          };
        }
      });
    }
  };

  // Warga management with comprehensive multi-role synchronization
  const updateWarga = (id: number, data: Partial<Warga>) => {
    const oldWarga = wargaList.find(w => w.id === id);
    const fullUpdatedWarga = { ...oldWarga, ...data } as Warga;

    const phone = (
      fullUpdatedWarga.kontakHp ||
      fullUpdatedWarga.hpPenghuni ||
      fullUpdatedWarga.hpPemilik ||
      oldWarga?.kontakHp ||
      oldWarga?.hpPenghuni ||
      oldWarga?.hpPemilik ||
      ''
    ).trim();

    fullUpdatedWarga.kontakHp = phone;
    if (!fullUpdatedWarga.hpPenghuni && phone) fullUpdatedWarga.hpPenghuni = phone;
    if (!fullUpdatedWarga.hpPemilik && phone) fullUpdatedWarga.hpPemilik = phone;

    const newName =
      fullUpdatedWarga.namaPenghuni && fullUpdatedWarga.namaPenghuni !== '-'
        ? fullUpdatedWarga.namaPenghuni
        : fullUpdatedWarga.namaPemilik || oldWarga?.namaPenghuni || oldWarga?.namaPemilik || `Rumah ${fullUpdatedWarga.blok}/${fullUpdatedWarga.noRumah}`;
    const newBlok = fullUpdatedWarga.blok || oldWarga?.blok || '';
    const newNoRumah = fullUpdatedWarga.noRumah || oldWarga?.noRumah || '';
    const newBlokNo = `${newBlok}/${newNoRumah}`;

    // 1. Update wargaList
    setWargaList(prev =>
      prev.map(w => (w.id === id ? fullUpdatedWarga : w))
    );

    // 2. Sync to dendaRondaList (recalculate denda based on updated kriteria/domisili/usia & sync phone)
    let newDendaTotalForTagihan: number | null = null;
    setDendaRondaList(prevDenda => {
      const existing = prevDenda.find(d => d.wargaId === id);
      const isWajib = fullUpdatedWarga.kriteriaRonda === 'Wajib Ronda' && fullUpdatedWarga.namaPenghuni !== '-';

      if (existing) {
        const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(
          fullUpdatedWarga,
          existing.minggu1,
          existing.minggu2,
          existing.minggu3,
          existing.minggu4
        );
        const finalDenda = isWajib ? dendaTotal : 0;
        newDendaTotalForTagihan = finalDenda;

        return prevDenda.map(d =>
          d.wargaId === id
            ? {
                ...d,
                nama: newName,
                blok: newBlok,
                noRumah: newNoRumah,
                kontakHp: phone,
                statusWajib: fullUpdatedWarga.kriteriaRonda,
                kategori: `${fullUpdatedWarga.statusUsiaPenghuni}, ${fullUpdatedWarga.domisiliKerja}, ${fullUpdatedWarga.jenisKelamin}`,
                jumlahAlpa: isWajib ? jumlahAlpa : 0,
                dendaPerAlpa,
                dendaTotal: finalDenda,
                catatan: isWajib ? keteranganTarif : 'Bebas Denda',
              }
            : d
        );
      } else if (isWajib) {
        const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(
          fullUpdatedWarga,
          false,
          false,
          false,
          false
        );
        newDendaTotalForTagihan = dendaTotal;
        const newEntry: DendaRondaEntry = {
          wargaId: id,
          nama: newName,
          blok: newBlok,
          noRumah: newNoRumah,
          kontakHp: phone,
          statusWajib: 'Wajib Ronda',
          kategori: `${fullUpdatedWarga.statusUsiaPenghuni}, ${fullUpdatedWarga.domisiliKerja}, ${fullUpdatedWarga.jenisKelamin}`,
          minggu1: false,
          minggu2: false,
          minggu3: false,
          minggu4: false,
          jumlahAlpa,
          dendaPerAlpa,
          dendaTotal,
          catatan: keteranganTarif,
          statusPushed: true,
          periode: 'September 2026',
        };
        return [...prevDenda, newEntry];
      }
      return prevDenda;
    });

    // 3. Sync to tagihanList across all roles (Bendahara, Warga, Ketua RT)
    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        if (tag.wargaId !== id) return tag;
        const dansosRT = fullUpdatedWarga.dansosRT ?? tag.dansosRT;
        const dansosRW = fullUpdatedWarga.dansosRW ?? tag.dansosRW;
        const pembangunan = fullUpdatedWarga.pembangunan ?? tag.pembangunan;
        const snack = fullUpdatedWarga.snackRapat ?? tag.snack;
        const jimpitan =
          fullUpdatedWarga.jimpitan !== undefined
            ? fullUpdatedWarga.jimpitan
            : fullUpdatedWarga.statusHuni === 'Kosong' || fullUpdatedWarga.statusHuni === 'Tanah'
            ? 0
            : tag.jimpitan;
        const totalIuran =
          fullUpdatedWarga.totalIuran !== undefined
            ? fullUpdatedWarga.totalIuran
            : dansosRT + dansosRW + pembangunan + snack + jimpitan;

        const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0;
        const dendaRonda = dendaRondaBulanLalu;
        const dendaRondaBulanBerjalan =
          newDendaTotalForTagihan !== null ? newDendaTotalForTagihan : (tag.dendaRondaBulanBerjalan || 0);
        const totalDenda = dendaRonda + tag.dendaKerjaBakti;
        const totalKewajiban = Math.max(
          0,
          totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';

        return {
          ...tag,
          nama: newName,
          blokNo: newBlokNo,
          kontakHp: phone,
          dansosRT,
          dansosRW,
          pembangunan,
          snack,
          jimpitan,
          totalIuran,
          dendaRonda,
          dendaRondaBulanLalu,
          dendaRondaBulanBerjalan,
          totalDenda,
          totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    // 4. Sync to userAccounts (Warga role authentication & display name)
    setUsers(prevUsers =>
      prevUsers.map(u => (u.wargaId === id ? { ...u, name: newName, blok: newBlok } : u))
    );

    // 5. Sync currentUser if the logged-in session belongs to this warga
    setCurrentUser(prevUser => {
      if (prevUser && prevUser.wargaId === id) {
        return {
          ...prevUser,
          name: newName,
          blok: newBlok,
        };
      }
      return prevUser;
    });

    // 6. Sync to rondaSchedules if old name is in petugas list
    if (oldWarga && oldWarga.namaPenghuni && oldWarga.namaPenghuni !== '-') {
      const oldNama = oldWarga.namaPenghuni;
      setRondaSchedules(prevSchedules =>
        prevSchedules.map(sch => ({
          ...sch,
          petugasNames: sch.petugasNames.map(p => (p === oldNama ? newName : p)),
        }))
      );
    }

    // 7. Sync to kerjaBaktiEvents
    setKerjaBaktiEvents(prevEvents =>
      prevEvents.map(evt => ({
        ...evt,
        kehadiran: evt.kehadiran.map(k =>
          k.wargaId === id
            ? { ...k, nama: newName, jenisKelamin: fullUpdatedWarga.jenisKelamin || k.jenisKelamin }
            : k
        ),
      }))
    );

    // 8. Sync to keluhanList
    setKeluhanList(prevKeluhan =>
      prevKeluhan.map(klh =>
        klh.wargaId === id ? { ...klh, namaWarga: newName, blokNo: newBlokNo } : klh
      )
    );

    // 9. Sync to presensiList
    setPresensiList(prevPresensi =>
      prevPresensi.map(p =>
        p.wargaId === id ? { ...p, nama: newName, blok: newBlok } : p
      )
    );

    // 10. Sync to suratList targetHp if targeted to this resident
    if (oldWarga && (oldWarga.namaPenghuni || oldWarga.namaPemilik)) {
      const oldTarget = oldWarga.namaPenghuni !== '-' ? oldWarga.namaPenghuni : oldWarga.namaPemilik;
      setSuratList(prevSurat =>
        prevSurat.map(s =>
          s.tujuan === oldTarget
            ? { ...s, tujuan: newName, targetHp: phone || s.targetHp }
            : s
        )
      );
    }
  };

  const addWarga = (warga: Omit<Warga, 'id'>) => {
    const nextId = wargaList.length > 0 ? Math.max(...wargaList.map(w => w.id)) + 1 : 1;
    const newWarga: Warga = { ...warga, id: nextId };
    setWargaList(prev => [...prev, newWarga]);

    // Create tagihan automatically
    const initialTags = getInitialTagihan([newWarga]);
    setTagihanList(prev => [...prev, ...initialTags]);

    // If eligible for ronda, add to dendaRondaList
    if (newWarga.kriteriaRonda === 'Wajib Ronda' && newWarga.namaPenghuni !== '-') {
      const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(
        newWarga,
        false,
        false,
        false,
        false
      );
      setDendaRondaList(prev => [
        ...prev,
        {
          wargaId: nextId,
          nama: newWarga.namaPenghuni,
          blok: newWarga.blok,
          noRumah: newWarga.noRumah,
          statusWajib: 'Wajib Ronda',
          kategori: `${newWarga.statusUsiaPenghuni}, ${newWarga.domisiliKerja}, ${newWarga.jenisKelamin}`,
          minggu1: false,
          minggu2: false,
          minggu3: false,
          minggu4: false,
          jumlahAlpa,
          dendaPerAlpa,
          dendaTotal,
          catatan: keteranganTarif,
          statusPushed: true,
          periode: 'September 2026',
        },
      ]);
    }
  };

  const deleteWarga = (id: number) => {
    setWargaList(prev => prev.filter(w => w.id !== id));
    setTagihanList(prev => prev.filter(t => t.wargaId !== id));
    setDendaRondaList(prev => prev.filter(d => d.wargaId !== id));
    setUsers(prev => prev.filter(u => u.wargaId !== id));
  };

  // Keamanan / Ronda
  const updateRondaSchedule = (hari: RondaSchedule['hari'], petugasNames: string[]) => {
    setRondaSchedules(prev =>
      prev.map(s => (s.hari === hari ? { ...s, petugasNames } : s))
    );
  };

  const toggleDendaRondaWeek = (wargaId: number, week: 1 | 2 | 3 | 4) => {
    let updatedDendaTotal = 0;
    setDendaRondaList(prev =>
      prev.map(d => {
        if (d.wargaId !== wargaId) return d;
        const w = wargaList.find(x => x.id === wargaId);
        const m1 = week === 1 ? !d.minggu1 : d.minggu1;
        const m2 = week === 2 ? !d.minggu2 : d.minggu2;
        const m3 = week === 3 ? !d.minggu3 : d.minggu3;
        const m4 = week === 4 ? !d.minggu4 : d.minggu4;
        const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(w, m1, m2, m3, m4);
        updatedDendaTotal = dendaTotal;
        return {
          ...d,
          minggu1: m1,
          minggu2: m2,
          minggu3: m3,
          minggu4: m4,
          jumlahAlpa,
          dendaPerAlpa,
          dendaTotal,
          catatan: keteranganTarif,
        };
      })
    );

    // Synchronize to tagihanList immediately so Bendahara and Warga always match
    setTagihanList(prevTags =>
      prevTags.map(tag => {
        if (tag.wargaId !== wargaId) return tag;
        // Denda yang ditagihkan di tagihan bulan ini adalah denda bulan sebelumnya (Agustus = 0)
        const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0;
        const dendaRonda = dendaRondaBulanLalu;
        const totalDenda = dendaRonda + tag.dendaKerjaBakti;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaRonda,
          dendaRondaBulanLalu,
          dendaRondaBulanBerjalan: updatedDendaTotal,
          totalDenda,
          totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );
  };

  const addPresensiRonda = async (entry: Omit<PresensiRonda, 'id'>) => {
    const newEntry: PresensiRonda = {
      ...entry,
      id: `prs-${Date.now()}`,
    };
    setPresensiList(prev => [newEntry, ...prev]);

    // Update checklist 4 minggu ronda warga:
    // Aturan: Dalam 1 minggu warga hanya diperbolehkan satu kali presensi meskipun tidak pada jadwalnya
    const weekNum = getRondaWeekNumber(entry.tanggal);
    let matchedWargaId: number | null = null;
    let updatedDendaTotal = 0;

    setDendaRondaList(prev =>
      prev.map(d => {
        const isMatched =
          (entry.wargaId && d.wargaId === entry.wargaId) ||
          d.nama.trim().toUpperCase() === entry.nama.trim().toUpperCase();
        if (!isMatched) return d;

        matchedWargaId = d.wargaId;
        const w = wargaList.find(x => x.id === d.wargaId);
        const m1 = weekNum === 1 ? true : d.minggu1;
        const m2 = weekNum === 2 ? true : d.minggu2;
        const m3 = weekNum === 3 ? true : d.minggu3;
        const m4 = weekNum === 4 ? true : d.minggu4;
        const { jumlahAlpa, dendaPerAlpa, dendaTotal, keteranganTarif } = calculateDendaEntry(w, m1, m2, m3, m4);
        updatedDendaTotal = dendaTotal;

        return {
          ...d,
          minggu1: m1,
          minggu2: m2,
          minggu3: m3,
          minggu4: m4,
          jumlahAlpa,
          dendaPerAlpa,
          dendaTotal,
          catatan: keteranganTarif,
        };
      })
    );

    // Sync to tagihanList immediately
    if (matchedWargaId !== null) {
      const targetId = matchedWargaId;
      setTagihanList(prevTags =>
        prevTags.map(tag => {
          if (tag.wargaId !== targetId) return tag;
          const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0;
          const dendaRonda = dendaRondaBulanLalu;
          const totalDenda = dendaRonda + tag.dendaKerjaBakti;
          const totalKewajiban = Math.max(
            0,
            tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
          );
          const statusBayar =
            tag.jumlahDibayar >= totalKewajiban
              ? tag.jumlahDibayar > totalKewajiban
                ? 'Lebih Bayar'
                : 'Lunas'
              : tag.jumlahDibayar > 0
              ? 'Kurang Bayar'
              : 'Belum Bayar';
          return {
            ...tag,
            dendaRonda,
            dendaRondaBulanLalu,
            dendaRondaBulanBerjalan: updatedDendaTotal,
            totalDenda,
            totalKewajiban,
            statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
            kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
          };
        })
      );
    }

    // Kirim siaran konfirmasi WhatsApp ke grup RT
    const msg = `*PRESENSI RONDA POS RT.03*\n\nPetugas: *${entry.nama}*\nStatus: *${entry.status}*\nKewajiban Ronda: *Minggu ke-${weekNum} Terpenuhi* (1x presensi per minggu)\nWaktu: ${entry.tanggal} ${entry.waktu}\nJarak ke Pos: ${Math.round(entry.distanceMeters)} meter\nVerifikasi: Lokasi GPS Valid`;
    sendFonnteMessage(settings.fonnteToken, settings.targetGroupWa, msg).catch(() => {});

    return newEntry;
  };

  const pushDendaRondaToBendahara = () => {
    // SOP: Denda pada tagihan kas bulanan adalah denda bulan sebelumnya (Agustus = 0)
    // Angka denda yang dipush keamanan untuk bulan berjalan (September) dicatat sebagai dendaRondaBulanBerjalan
    // yang akan menjadi denda bulan lalu pada siklus tagihan berikutnya (Oktober)
    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const dendaEntry = dendaRondaList.find(d => d.wargaId === tag.wargaId);
        const nominalDendaBerjalan = dendaEntry ? dendaEntry.dendaTotal : 0;
        const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0; // Asumsi Agustus = 0
        const dendaRonda = dendaRondaBulanLalu;
        const totalDenda = dendaRonda + tag.dendaKerjaBakti;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaRonda,
          dendaRondaBulanLalu,
          dendaRondaBulanBerjalan: nominalDendaBerjalan,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    setDendaRondaList(prev =>
      prev.map(d => ({ ...d, statusPushed: true }))
    );
  };

  const unpushDendaRondaFromBendahara = () => {
    // Batalkan sinkronisasi denda ronda dari tagihanList
    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0;
        const dendaRonda = dendaRondaBulanLalu;
        const totalDenda = dendaRonda + tag.dendaKerjaBakti;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaRonda,
          dendaRondaBulanBerjalan: 0,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    setDendaRondaList(prev =>
      prev.map(d => ({ ...d, statusPushed: false }))
    );
  };

  // Dedicated sync all denda (ronda & kerja bakti) across modules
  const syncAllDendaToTagihan = () => {
    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const dendaEntry = dendaRondaList.find(d => d.wargaId === tag.wargaId);
        const nominalDendaRondaBerjalan = dendaEntry ? dendaEntry.dendaTotal : 0;
        const dendaRondaBulanLalu = tag.dendaRondaBulanLalu ?? 0; // Asumsi Agustus = 0
        const dendaRonda = dendaRondaBulanLalu;

        let nominalDendaKB = 0;
        for (const evt of kerjaBaktiEvents) {
          if (evt.isPushedToBendahara) {
            const kb = evt.kehadiran.find(k => k.wargaId === tag.wargaId);
            if (kb && !kb.hadir) {
              nominalDendaKB += kb.denda || evt.dendaPerAlpa;
            }
          }
        }

        const totalDenda = dendaRonda + nominalDendaKB;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaRonda,
          dendaRondaBulanLalu,
          dendaRondaBulanBerjalan: nominalDendaRondaBerjalan,
          dendaKerjaBakti: nominalDendaKB,
          totalDenda,
          totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    setDendaRondaList(prev =>
      prev.map(d => ({ ...d, statusPushed: true }))
    );
  };

  // Kerja Bakti
  const addKerjaBaktiEvent = (event: Omit<KerjaBaktiEvent, 'id' | 'isPushedToBendahara'>) => {
    const newEvent: KerjaBaktiEvent = {
      ...event,
      id: `kb-${Date.now()}`,
      isPushedToBendahara: false,
    };
    setKerjaBaktiEvents(prev => [newEvent, ...prev]);
  };

  const updateKerjaBaktiAttendance = (eventId: string, wargaId: number, hadir: boolean) => {
    let evtIsPushed = false;
    let dendaPerAlpa = 25000;

    setKerjaBaktiEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        evtIsPushed = evt.isPushedToBendahara;
        dendaPerAlpa = evt.dendaPerAlpa;
        const updatedKehadiran = evt.kehadiran.map(k => {
          if (k.wargaId === wargaId) {
            return {
              ...k,
              hadir,
              denda: hadir ? 0 : evt.dendaPerAlpa,
            };
          }
          return k;
        });
        return { ...evt, kehadiran: updatedKehadiran };
      })
    );

    // If already pushed, sync directly to tagihan
    if (evtIsPushed) {
      setTagihanList(prevTags =>
        prevTags.map(tag => {
          if (tag.wargaId !== wargaId) return tag;
          const newDendaKB = hadir ? 0 : dendaPerAlpa;
          const totalDenda = tag.dendaRonda + newDendaKB;
          const totalKewajiban = Math.max(
            0,
            tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
          );
          const statusBayar =
            tag.jumlahDibayar >= totalKewajiban
              ? tag.jumlahDibayar > totalKewajiban
                ? 'Lebih Bayar'
                : 'Lunas'
              : tag.jumlahDibayar > 0
              ? 'Kurang Bayar'
              : 'Belum Bayar';
          return {
            ...tag,
            dendaKerjaBakti: newDendaKB,
            totalDenda,
            totalKewajiban,
            statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
            kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
          };
        })
      );
    }
  };

  const pushDendaKerjaBaktiToBendahara = (eventId: string) => {
    const evt = kerjaBaktiEvents.find(e => e.id === eventId);
    if (!evt) return;

    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const attendee = evt.kehadiran.find(k => k.wargaId === tag.wargaId);
        const nominalDendaKB = attendee && !attendee.hadir ? attendee.denda : 0;
        const totalDenda = tag.dendaRonda + nominalDendaKB;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaKerjaBakti: nominalDendaKB,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    setKerjaBaktiEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isPushedToBendahara: true } : e))
    );
  };

  const unpushDendaKerjaBaktiFromBendahara = (eventId: string) => {
    const evt = kerjaBaktiEvents.find(e => e.id === eventId);
    if (!evt) return;

    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const attendee = evt.kehadiran.find(k => k.wargaId === tag.wargaId);
        const nominalDendaKBSedangDiUnpush = attendee && !attendee.hadir ? attendee.denda : 0;
        const sisaDendaKB = Math.max(0, tag.dendaKerjaBakti - nominalDendaKBSedangDiUnpush);
        const totalDenda = tag.dendaRonda + sisaDendaKB;
        const totalKewajiban = Math.max(
          0,
          tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan
        );
        const statusBayar =
          tag.jumlahDibayar >= totalKewajiban
            ? tag.jumlahDibayar > totalKewajiban
              ? 'Lebih Bayar'
              : 'Lunas'
            : tag.jumlahDibayar > 0
            ? 'Kurang Bayar'
            : 'Belum Bayar';
        return {
          ...tag,
          dendaKerjaBakti: sisaDendaKB,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : statusBayar,
          kelebihanBayar: Math.max(0, tag.jumlahDibayar - totalKewajiban),
        };
      })
    );

    setKerjaBaktiEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isPushedToBendahara: false } : e))
    );
  };

  // Surat RT
  const addSurat = (surat: Omit<SuratRT, 'id'>) => {
    const newSurat: SuratRT = {
      ...surat,
      id: `srt-${Date.now()}`,
      statusKirimWA: 'Belum',
    };
    setSuratList(prev => [newSurat, ...prev]);
  };

  const updateSurat = (id: string, surat: Partial<SuratRT>) => {
    setSuratList(prev =>
      prev.map(s => (s.id === id ? { ...s, ...surat } : s))
    );
  };

  const deleteSurat = (id: string) => {
    setSuratList(prev => prev.filter(s => s.id !== id));
  };

  const broadcastSuratViaWA = async (suratId: string): Promise<FonnteResponse> => {
    const surat = suratList.find(s => s.id === suratId);
    if (!surat) {
      return { status: false, message: 'Surat tidak ditemukan' };
    }

    const target = surat.targetHp || settings.targetGroupWa;
    const msg = `*RUKUN TETANGGA 03 RW.14 PERUM BPTW CILACAP*\n----------------------------------------\n*SURAT RESMI*: ${surat.perihal.toUpperCase()}\nNomor: ${surat.nomorSurat}\nTanggal: ${surat.tanggal}\n\nKepada Yth: ${surat.tujuan}\n\n${surat.waktuAcara ? `Waktu: ${surat.waktuAcara}\n` : ''}${surat.tempat ? `Tempat: ${surat.tempat}\n` : ''}${surat.agenda ? `Agenda:\n${surat.agenda}\n\n` : ''}${surat.isiSurat}\n\nSalam hormat,\n*${surat.penandatangan}*`;

    const res = await sendFonnteMessage(settings.fonnteToken, target, msg);
    if (res.status) {
      updateSurat(suratId, {
        statusKirimWA: 'Terkirim',
        tglKirimWA: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    } else {
      updateSurat(suratId, { statusKirimWA: 'Gagal' });
    }
    return res;
  };

  // Pengumuman RT
  const addPengumuman = async (pengumuman: Omit<Pengumuman, 'id' | 'dibacaOleh'>, sendBroadcastWA = true) => {
    const newP: Pengumuman = {
      ...pengumuman,
      id: `pgm-${Date.now()}`,
      dibacaOleh: [],
    };
    setPengumumanList(prev => [newP, ...prev]);

    if (sendBroadcastWA) {
      const msg = `📢 *PENGUMUMAN WARGA RT.03 RW.14 BPTW*\n\n*${pengumuman.judul}*\nKategori: ${pengumuman.kategori}\nTanggal: ${pengumuman.tanggal}\n\n${pengumuman.isi}\n\nOleh: ${pengumuman.author}\n_Portal Warga Neo PoRT3_`;
      await sendFonnteMessage(settings.fonnteToken, settings.targetGroupWa, msg);
    }
  };

  const markPengumumanRead = (id: string, name: string) => {
    setPengumumanList(prev =>
      prev.map(p => {
        if (p.id === id && !p.dibacaOleh.includes(name)) {
          return { ...p, dibacaOleh: [...p.dibacaOleh, name] };
        }
        return p;
      })
    );
  };

  // Keluhan Warga
  const submitKeluhan = async (keluhan: Omit<KeluhanWarga, 'id' | 'status' | 'tanggal'>) => {
    const newK: KeluhanWarga = {
      ...keluhan,
      id: `klh-${Date.now()}`,
      status: 'Menunggu',
      tanggal: new Date().toISOString().slice(0, 10),
    };
    setKeluhanList(prev => [newK, ...prev]);

    // Send notification to WA Group
    const msg = `⚠️ *LAPORAN KELUHAN WARGA (Neo PoRT3)*\n\nDari: *${keluhan.namaWarga}* (Kavling ${keluhan.blokNo})\nKategori: ${keluhan.kategori}\nJudul: *${keluhan.judul}*\n\nDeskripsi:\n"${keluhan.deskripsi}"\n\n_Mohon pengurus RT / keamanan dapat menindaklanjuti._`;
    await sendFonnteMessage(settings.fonnteToken, settings.targetGroupWa, msg);
  };

  const updateKeluhanStatus = (id: string, status: KeluhanWarga['status'], tanggapan?: string) => {
    setKeluhanList(prev =>
      prev.map(k => (k.id === id ? { ...k, status, tanggapanPengurus: tanggapan || k.tanggapanPengurus } : k))
    );
  };

  // Bendahara / Tagihan
  const bayarTagihanWarga = (
    tagihanId: string,
    jumlahBayar: number,
    metode: 'Transfer' | 'Tunai / Jimpitan',
    alokasiKelebihan?: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali',
    alokasiNominal?: number,
    tanggalBayar?: string
  ) => {
    const tglTransaksi = tanggalBayar || new Date().toISOString().slice(0, 10);
    setTagihanList(prev =>
      prev.map(tag => {
        if (tag.id !== tagihanId) return tag;

        const totalBayar = tag.jumlahDibayar + jumlahBayar;
        const sisaKewajiban = tag.totalKewajiban - totalBayar;
        let kelebihan = 0;
        let status: TagihanWarga['statusBayar'] = 'Belum Bayar';

        if (sisaKewajiban <= 0) {
          status = sisaKewajiban < 0 ? 'Lebih Bayar' : 'Lunas';
          kelebihan = Math.abs(sisaKewajiban);
        } else {
          status = totalBayar > 0 ? 'Kurang Bayar' : 'Belum Bayar';
        }

        const effectiveAlokasi = alokasiKelebihan || (kelebihan > 0 ? 'pembayaran_tagihan' : undefined);

        return {
          ...tag,
          jumlahDibayar: totalBayar,
          statusBayar: status,
          kelebihanBayar: kelebihan,
          saldoDeposit: kelebihan,
          alokasiKelebihan: effectiveAlokasi,
          alokasiDeposit: effectiveAlokasi === 'donasi_kas' ? 'donasi_kas' : (kelebihan > 0 ? 'pembayaran_tagihan' : undefined),
          alokasiNominal: alokasiNominal || kelebihan,
          metodeBayar: metode,
          tglBayar: tglTransaksi,
        };
      })
    );

    // Record to Kas RT Pemasukan
    const tag = tagihanList.find(t => t.id === tagihanId);
    if (tag && jumlahBayar > 0) {
      addPemasukanKas({
        tanggal: tglTransaksi,
        kategori: 'Iuran Warga',
        namaSumber: `${tag.nama} (${tag.blokNo})`,
        nominal: jumlahBayar,
        keterangan: `Pembayaran iuran/denda periode ${tag.periode} via ${metode}`,
      });
    }

    // Jika ada kelebihan bayar dan warga langsung memilih dialihkan ke donasi kas RT
    if (alokasiKelebihan === 'donasi_kas' && tag) {
      const sisaKewajiban = tag.totalKewajiban - (tag.jumlahDibayar + jumlahBayar);
      if (sisaKewajiban < 0) {
        const nominalKelebihan = Math.abs(sisaKewajiban);
        addPemasukanKas({
          tanggal: tglTransaksi,
          kategori: 'Donasi Warga',
          namaSumber: `${tag.nama} (${tag.blokNo})`,
          nominal: nominalKelebihan,
          keterangan: `Donasi kas RT dari kelebihan bayar iuran periode ${tag.periode}`,
        });
        // Reset saldo deposit ke 0 karena sudah disedekahkan ke kas RT
        setTagihanList(prev =>
          prev.map(t =>
            t.id === tagihanId
              ? {
                  ...t,
                  kelebihanBayar: 0,
                  saldoDeposit: 0,
                  alokasiDonasiNominal: (t.alokasiDonasiNominal || 0) + nominalKelebihan,
                }
              : t
          )
        );
      }
    }
  };

  const alokasikanDanaTitipan = (
    tagihanId: string,
    opsi: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali',
    nominal: number
  ) => {
    const tag = tagihanList.find(t => t.id === tagihanId);
    if (!tag) return;
    const nominalAlokasi = Math.min(nominal, tag.kelebihanBayar);
    if (nominalAlokasi <= 0) return;

    if (opsi === 'donasi_kas') {
      addPemasukanKas({
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: 'Donasi Warga',
        namaSumber: `${tag.nama} (${tag.blokNo})`,
        nominal: nominalAlokasi,
        keterangan: `Donasi kas RT dari pengalihan saldo deposit warga ${tag.nama} (${tag.blokNo})`,
      });

      setTagihanList(prev =>
        prev.map(t => {
          if (t.id !== tagihanId) return t;
          const sisaKelebihan = t.kelebihanBayar - nominalAlokasi;
          return {
            ...t,
            kelebihanBayar: sisaKelebihan,
            saldoDeposit: sisaKelebihan,
            alokasiKelebihan: sisaKelebihan > 0 ? 'pembayaran_tagihan' : undefined,
            alokasiDeposit: sisaKelebihan > 0 ? 'pembayaran_tagihan' : undefined,
            alokasiDonasiNominal: (t.alokasiDonasiNominal || 0) + nominalAlokasi,
            alokasiTagihanMendatangNominal: sisaKelebihan,
          };
        })
      );
    } else if (opsi === 'tarik_kembali') {
      addPengeluaranKas({
        tanggal: new Date().toISOString().slice(0, 10),
        komponen: 'Pengeluaran lainnya',
        namaPenerimaOrPekerjaan: tag.nama,
        nominal: nominalAlokasi,
        keterangan: `Penarikan/pengembalian saldo deposit ke warga (${tag.blokNo})`,
      });

      setTagihanList(prev =>
        prev.map(t => {
          if (t.id !== tagihanId) return t;
          const sisaKelebihan = t.kelebihanBayar - nominalAlokasi;
          return {
            ...t,
            kelebihanBayar: sisaKelebihan,
            saldoDeposit: sisaKelebihan,
            alokasiKelebihan: sisaKelebihan > 0 ? t.alokasiKelebihan : undefined,
            alokasiDeposit: sisaKelebihan > 0 ? t.alokasiDeposit : undefined,
          };
        })
      );
    } else {
      // 'pembayaran_tagihan' | 'titipan_bulan_depan'
      setTagihanList(prev =>
        prev.map(t => {
          if (t.id !== tagihanId) return t;
          return {
            ...t,
            alokasiKelebihan: 'pembayaran_tagihan',
            alokasiDeposit: 'pembayaran_tagihan',
            alokasiNominal: nominalAlokasi,
            alokasiTagihanMendatangNominal: nominalAlokasi,
          };
        })
      );
    }
  };

  // Pilihan kombinasi: Warga dapat memilih sebagian untuk Donasi dan sebagian untuk Membayar Tagihan Bulan Datang
  const alokasikanDepositKombinasi = (
    tagihanId: string,
    nominalDonasi: number,
    nominalTagihanMendatang: number
  ) => {
    const tag = tagihanList.find(t => t.id === tagihanId);
    if (!tag) return;

    const available = tag.kelebihanBayar;
    const donasi = Math.max(0, Math.min(nominalDonasi, available));
    const sisaDeposit = Math.max(0, available - donasi);

    if (donasi > 0) {
      addPemasukanKas({
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: 'Donasi Warga',
        namaSumber: `${tag.nama} (${tag.blokNo})`,
        nominal: donasi,
        keterangan: `Donasi kas RT dari pengalihan sebagian saldo deposit warga ${tag.nama} (${tag.blokNo})`,
      });
    }

    setTagihanList(prev =>
      prev.map(t => {
        if (t.id !== tagihanId) return t;
        return {
          ...t,
          kelebihanBayar: sisaDeposit,
          saldoDeposit: sisaDeposit,
          alokasiKelebihan: sisaDeposit > 0 ? 'pembayaran_tagihan' : undefined,
          alokasiDeposit: sisaDeposit > 0 ? 'pembayaran_tagihan' : undefined,
          alokasiDonasiNominal: (t.alokasiDonasiNominal || 0) + donasi,
          alokasiTagihanMendatangNominal: sisaDeposit,
        };
      })
    );
  };

  const addPengeluaranKas = (pengeluaran: Omit<PengeluaranKas, 'id'>) => {
    const newExp: PengeluaranKas = {
      ...pengeluaran,
      id: `exp-${Date.now()}`,
    };
    setPengeluaranList(prev => [newExp, ...prev]);
  };

  const updatePengeluaranKas = (id: string, data: Partial<PengeluaranKas>) => {
    setPengeluaranList(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, ...data } : exp))
    );
  };

  const deletePengeluaranKas = (id: string) => {
    setPengeluaranList(prev => prev.filter(exp => exp.id !== id));
  };

  const addPemasukanKas = (pemasukan: Omit<PemasukanKas, 'id'>) => {
    const newInc: PemasukanKas = {
      ...pemasukan,
      id: `inc-${Date.now()}`,
    };
    setPemasukanList(prev => [newInc, ...prev]);
  };

  const addHutangRT = (
    hutang: Omit<HutangRT, 'id' | 'sudahDibayar' | 'sisaHutang' | 'status'>
  ) => {
    const newH: HutangRT = {
      ...hutang,
      id: `htg-${Date.now()}`,
      sudahDibayar: 0,
      sisaHutang: hutang.totalHutang,
      status: 'Belum Lunas',
    };
    setHutangList(prev => [newH, ...prev]);
  };

  const bayarCicilanHutang = (hutangId: string, nominal: number, tanggalBayar?: string) => {
    const tglTransaksi = tanggalBayar || new Date().toISOString().slice(0, 10);
    setHutangList(prev =>
      prev.map(h => {
        if (h.id !== hutangId) return h;
        const newSudah = h.sudahDibayar + nominal;
        const newSisa = Math.max(0, h.totalHutang - newSudah);
        return {
          ...h,
          sudahDibayar: newSudah,
          sisaHutang: newSisa,
          status: newSisa === 0 ? 'Lunas' : 'Belum Lunas',
        };
      })
    );

    // Kas Keluar
    const h = hutangList.find(item => item.id === hutangId);
    addPengeluaranKas({
      tanggal: tglTransaksi,
      komponen: 'Pengeluaran lainnya',
      namaPenerimaOrPekerjaan: h?.kreditur || 'Cicilan Hutang',
      nominal: nominal,
      keterangan: `Pembayaran cicilan hutang tempo: ${h?.deskripsi}`,
    });
  };

  const addPiutangLainnya = (
    piutang: Omit<PiutangWargaLainnya, 'id' | 'sudahDibayar' | 'sisaPiutang' | 'status'>
  ) => {
    const newP: PiutangWargaLainnya = {
      ...piutang,
      id: `ptg-${Date.now()}`,
      sudahDibayar: 0,
      sisaPiutang: piutang.totalPiutang,
      status: 'Belum Lunas',
    };
    setPiutangLainnyaList(prev => [newP, ...prev]);
  };

  const bayarCicilanPiutangLainnya = (id: string, nominal: number, tanggalBayar?: string) => {
    const p = piutangLainnyaList.find(item => item.id === id);
    if (!p) return;
    const nominalBayar = Math.min(nominal, p.sisaPiutang);
    if (nominalBayar <= 0) return;
    const tglTransaksi = tanggalBayar || new Date().toISOString().slice(0, 10);

    setPiutangLainnyaList(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newSudah = item.sudahDibayar + nominalBayar;
        const newSisa = Math.max(0, item.totalPiutang - newSudah);
        return {
          ...item,
          sudahDibayar: newSudah,
          sisaPiutang: newSisa,
          status: newSisa === 0 ? 'Lunas' : 'Belum Lunas',
        };
      })
    );

    // Pelunasan dicatat sebagai kas masuk dan mengurangi saldo piutang
    addPemasukanKas({
      tanggal: tglTransaksi,
      kategori: 'Iuran Warga',
      namaSumber: `${p.namaWarga}${p.blokNo ? ` (${p.blokNo})` : ''}`,
      nominal: nominalBayar,
      keterangan: `Pelunasan piutang/talangan: ${p.deskripsi}`,
    });
  };

  const updateKomponenIuranWarga = (
    wargaId: number,
    komponen: {
      dansosRT: number;
      dansosRW: number;
      pembangunan: number;
      snackRapat: number;
      jimpitan: number;
    }
  ) => {
    const totalIuran =
      komponen.dansosRT +
      komponen.dansosRW +
      komponen.pembangunan +
      komponen.snackRapat +
      komponen.jimpitan;

    setWargaList((prev) => {
      const updated = prev.map((w) => {
        if (w.id === wargaId) {
          return {
            ...w,
            dansosRT: komponen.dansosRT,
            dansosRW: komponen.dansosRW,
            pembangunan: komponen.pembangunan,
            snackRapat: komponen.snackRapat,
            jimpitan: komponen.jimpitan,
            totalIuran: totalIuran,
          };
        }
        return w;
      });
      localStorage.setItem(STORAGE_PREFIX + 'warga', JSON.stringify(updated));
      return updated;
    });

    setTagihanList((prev) => {
      const updated = prev.map((t) => {
        if (t.wargaId === wargaId) {
          const depositBulanLalu = t.depositBulanLalu ?? t.titipanBulanLalu ?? 0;
          const piutangBulanLalu = t.piutangBulanLalu || 0;
          const totalDenda = t.totalDenda || 0;

          const depositDigunakan = Math.min(depositBulanLalu, totalIuran + piutangBulanLalu);
          const totalKewajiban = Math.max(0, totalIuran + totalDenda + piutangBulanLalu - depositDigunakan);
          const kelebihanBayar = Math.max(0, depositBulanLalu - depositDigunakan);
          const saldoDeposit = kelebihanBayar;
          const jumlahDibayar =
            t.jumlahDibayar > 0
              ? t.jumlahDibayar
              : totalKewajiban === 0 && depositDigunakan > 0
              ? depositDigunakan
              : 0;
          const statusBayar: TagihanWarga['statusBayar'] =
            jumlahDibayar >= totalKewajiban
              ? saldoDeposit > 0 || jumlahDibayar > totalKewajiban
                ? 'Lebih Bayar'
                : 'Lunas'
              : jumlahDibayar > 0
              ? 'Kurang Bayar'
              : 'Belum Bayar';

          return {
            ...t,
            dansosRT: komponen.dansosRT,
            dansosRW: komponen.dansosRW,
            pembangunan: komponen.pembangunan,
            snack: komponen.snackRapat,
            jimpitan: komponen.jimpitan,
            totalIuran: totalIuran,
            titipanDigunakanUntukTagihan: depositDigunakan,
            depositDigunakanUntukTagihan: depositDigunakan,
            totalKewajiban,
            kelebihanBayar,
            saldoDeposit,
            jumlahDibayar,
            statusBayar,
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_PREFIX + 'tagihan', JSON.stringify(updated));
      return updated;
    });
  };

  const closingBulanKas = (namaPeriodeBaru: string) => {
    const periodeLama = activePeriode;
    const cleanNamaPeriode = namaPeriodeBaru.trim() || 'Oktober 2026';

    const saldoAwal = settings.saldoAwalKas || 0;
    const totalPemasukan = pemasukanList.reduce((acc, curr) => acc + curr.nominal, 0);
    const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.nominal, 0);
    const saldoAkhirKas = saldoAwal + totalPemasukan - totalPengeluaran;

    let totalPiutangAkumulasi = 0;
    let totalDepositAkumulasi = 0;
    let wargaMenunggakCount = 0;
    let wargaDepositCount = 0;

    const newSaldoMap = new Map<number, number>();

    tagihanList.forEach((t) => {
      const sisaKewajiban = Math.max(0, t.totalKewajiban - t.jumlahDibayar);
      const sisaDeposit = Math.max(0, t.saldoDeposit ?? t.kelebihanBayar ?? 0);

      if (sisaKewajiban > 0) {
        newSaldoMap.set(t.wargaId, -sisaKewajiban);
        totalPiutangAkumulasi += sisaKewajiban;
        wargaMenunggakCount++;
      } else if (sisaDeposit > 0) {
        newSaldoMap.set(t.wargaId, sisaDeposit);
        totalDepositAkumulasi += sisaDeposit;
        wargaDepositCount++;
      } else {
        newSaldoMap.set(t.wargaId, 0);
      }
    });

    // Simpan snapshot laporan bulanan yang ditutup ke arsip
    const laporanArsipBaru: LaporanBukuKasBulanan = {
      id: `lap-${Date.now()}`,
      periode: periodeLama,
      tanggalClosing: new Date().toISOString().slice(0, 10),
      saldoAwalKas: saldoAwal,
      totalPemasukan,
      totalPengeluaran,
      saldoAkhirKas,
      totalPiutangWarga: totalPiutangAkumulasi,
      totalDepositWarga: totalDepositAkumulasi,
      totalHutangRT: hutangList.reduce((acc, curr) => acc + (curr.sisaHutang || 0), 0),
      wargaMenunggakCount,
      wargaDepositCount,
      wargaLunasCount: Math.max(0, tagihanList.length - wargaMenunggakCount - wargaDepositCount),
      tagihanSnapshot: [...tagihanList],
      pemasukanSnapshot: [...pemasukanList],
      pengeluaranSnapshot: [...pengeluaranList],
      catatan: `Laporan Tutup Buku Kas RT.03 Periode ${periodeLama}`,
    };

    setArsipLaporanBulanan((prev) => {
      const filtered = prev.filter((p) => p.periode !== periodeLama);
      const updated = [laporanArsipBaru, ...filtered];
      localStorage.setItem(STORAGE_PREFIX + 'arsip_laporan', JSON.stringify(updated));
      return updated;
    });

    const updatedWargaList = wargaList.map((w) => {
      const newSaldo = newSaldoMap.get(w.id) ?? 0;
      return {
        ...w,
        saldoAwalBulanLalu: newSaldo,
      };
    });
    setWargaList(updatedWargaList);
    localStorage.setItem(STORAGE_PREFIX + 'warga', JSON.stringify(updatedWargaList));

    const newTagihanList: TagihanWarga[] = updatedWargaList.map((w) => {
      const totalIuran = w.totalIuran;
      const piutangBulanLalu = w.saldoAwalBulanLalu < 0 ? Math.abs(w.saldoAwalBulanLalu) : 0;
      const depositBulanLalu = w.saldoAwalBulanLalu > 0 ? w.saldoAwalBulanLalu : 0;

      const oldTag = tagihanList.find((t) => t.wargaId === w.id);
      const dendaRondaBulanLalu = oldTag?.dendaRondaBulanBerjalan || 0;
      const dendaRonda = dendaRondaBulanLalu;
      const dendaKerjaBakti = 0;
      const totalDenda = dendaRonda + dendaKerjaBakti;

      let depositDigunakan = 0;
      if (depositBulanLalu > 0) {
        depositDigunakan = Math.min(depositBulanLalu, totalIuran + totalDenda + piutangBulanLalu);
      }

      const totalKewajiban = Math.max(0, totalIuran + totalDenda + piutangBulanLalu - depositDigunakan);
      const sisaDeposit = depositBulanLalu - depositDigunakan;
      const jumlahDibayar = totalKewajiban === 0 && depositDigunakan > 0 ? depositDigunakan : 0;
      const statusBayar: TagihanWarga['statusBayar'] =
        sisaDeposit > 0 ? 'Lebih Bayar' : totalKewajiban === 0 ? 'Lunas' : 'Belum Bayar';

      return {
        id: `tag-${w.id}-${Date.now()}`,
        wargaId: w.id,
        nama: getWargaBilledName(w),
        blokNo: `${w.blok}/${w.noRumah}`,
        periode: cleanNamaPeriode,
        dansosRT: w.dansosRT,
        dansosRW: w.dansosRW,
        pembangunan: w.pembangunan,
        snack: w.snackRapat,
        jimpitan: w.jimpitan,
        totalIuran: totalIuran,
        dendaRonda: dendaRonda,
        dendaRondaBulanLalu: dendaRondaBulanLalu,
        dendaRondaBulanBerjalan: 0,
        dendaKerjaBakti: 0,
        totalDenda: totalDenda,
        piutangBulanLalu: piutangBulanLalu,
        titipanBulanLalu: depositBulanLalu,
        titipanDigunakanUntukTagihan: depositDigunakan,
        depositBulanLalu: depositBulanLalu,
        depositDigunakanUntukTagihan: depositDigunakan,
        totalKewajiban: totalKewajiban,
        jumlahDibayar: jumlahDibayar,
        statusBayar: statusBayar,
        kelebihanBayar: sisaDeposit,
        saldoDeposit: sisaDeposit,
      };
    });

    setTagihanList(newTagihanList);
    localStorage.setItem(STORAGE_PREFIX + 'tagihan', JSON.stringify(newTagihanList));

    setActivePeriode(cleanNamaPeriode);
    localStorage.setItem(STORAGE_PREFIX + 'active_periode', cleanNamaPeriode);

    // Update Saldo Awal di Settings untuk periode baru
    setSettings((prev) => {
      const updated = { ...prev, saldoAwalKas: saldoAkhirKas };
      localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(updated));
      return updated;
    });

    // Reset pemasukan & pengeluaran untuk periode kas bulanan baru
    setPemasukanList([]);
    localStorage.setItem(STORAGE_PREFIX + 'pemasukan', JSON.stringify([]));
    setPengeluaranList([]);
    localStorage.setItem(STORAGE_PREFIX + 'pengeluaran', JSON.stringify([]));

    return {
      periodeLama,
      namaPeriodeBaru: cleanNamaPeriode,
      saldoAwal,
      totalPemasukan,
      totalPengeluaran,
      saldoAkhirKas,
      totalPiutangAkumulasi,
      totalDepositAkumulasi,
      wargaMenunggakCount,
      wargaDepositCount,
    };
  };

  const deleteArsipLaporanBulanan = (id: string) => {
    setArsipLaporanBulanan((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_PREFIX + 'arsip_laporan', JSON.stringify(updated));
      return updated;
    });
  };

  const resetBukuKasOkt2026 = (saldoAwalBaru: number = 0) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        saldoAwalKas: saldoAwalBaru,
        periodeAwalPembukuan: 'Oktober 2026',
      };
      localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(updated));
      return updated;
    });

    setActivePeriode('Oktober 2026');
    localStorage.setItem(STORAGE_PREFIX + 'active_periode', 'Oktober 2026');

    setPengeluaranList([]);
    localStorage.setItem(STORAGE_PREFIX + 'pengeluaran', JSON.stringify([]));

    setPemasukanList([]);
    localStorage.setItem(STORAGE_PREFIX + 'pemasukan', JSON.stringify([]));

    setHutangList([]);
    localStorage.setItem(STORAGE_PREFIX + 'hutang', JSON.stringify([]));

    setPiutangLainnyaList([]);
    localStorage.setItem(STORAGE_PREFIX + 'piutangLainnya', JSON.stringify([]));

    const initialDenda = getInitialDendaRonda(INITIAL_WARGA_LIST);
    setDendaRondaList(initialDenda);
    localStorage.setItem(STORAGE_PREFIX + 'dendaRonda', JSON.stringify(initialDenda));

    setWargaList(INITIAL_WARGA_LIST);
    localStorage.setItem(STORAGE_PREFIX + 'warga', JSON.stringify(INITIAL_WARGA_LIST));

    const initialTags = getInitialTagihan(INITIAL_WARGA_LIST, initialDenda);
    setTagihanList(initialTags);
    localStorage.setItem(STORAGE_PREFIX + 'tagihan', JSON.stringify(initialTags));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    const initialUsers = INITIAL_USER_ACCOUNTS;
    const initialWarga = INITIAL_WARGA_LIST;
    const initialSchedules = INITIAL_RONDA_SCHEDULES;
    const initialPresensi = INITIAL_PRESENSI_LIST;
    const initialDenda = getInitialDendaRonda(INITIAL_WARGA_LIST);
    const initialTagihan = getInitialTagihan(INITIAL_WARGA_LIST);
    const initialPengeluaran = INITIAL_PENGELUARAN_KAS;
    const initialPemasukan = INITIAL_PEMASUKAN_KAS;
    const initialHutang = INITIAL_HUTANG_RT;
    const initialPiutang = INITIAL_PIUTANG_LAINNYA;
    const initialSurat = INITIAL_SURAT_LIST;
    const initialPengumuman = INITIAL_PENGUMUMAN;
    const initialSettings = DEFAULT_APP_SETTINGS;

    setUsers(initialUsers);
    setWargaList(initialWarga);
    setRondaSchedules(initialSchedules);
    setPresensiList(initialPresensi);
    setDendaRondaList(initialDenda);
    setTagihanList(initialTagihan);
    setPengeluaranList(initialPengeluaran);
    setPemasukanList(initialPemasukan);
    setHutangList(initialHutang);
    setPiutangLainnyaList(initialPiutang);
    setSuratList(initialSurat);
    setPengumumanList(initialPengumuman);
    setSettings(initialSettings);
    setCurrentUser(initialUsers[0]);
    localStorage.clear();

    pushStateToFirestore(
      {
        users: initialUsers,
        wargaList: initialWarga,
        rondaSchedules: initialSchedules,
        presensiList: initialPresensi,
        dendaRondaList: initialDenda,
        tagihanList: initialTagihan,
        pengeluaranList: initialPengeluaran,
        pemasukanList: initialPemasukan,
        hutangList: initialHutang,
        piutangLainnyaList: initialPiutang,
        suratList: initialSurat,
        pengumumanList: initialPengumuman,
        settings: initialSettings,
      },
      'Reset Data Default RT.03'
    );
  };

  const sendWhatsAppDirect = async (target: string, message: string) => {
    return sendFonnteMessage(settings.fonnteToken, target, message);
  };

  const currentRole: Role = currentUser?.role || 'superadmin';

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        users,
        wargaList,
        rondaSchedules,
        presensiList,
        dendaRondaList,
        kerjaBaktiEvents,
        suratList,
        pengumumanList,
        keluhanList,
        tagihanList,
        pengeluaranList,
        pemasukanList,
        hutangList,
        piutangLainnyaList,
        settings,
        syncStatus,
        forceSyncToCloud,
        login,
        logout,
        switchRoleDirectly,
        updateUserAccount,
        updateWarga,
        addWarga,
        deleteWarga,
        updateRondaSchedule,
        addPresensiRonda,
        toggleDendaRondaWeek,
        pushDendaRondaToBendahara,
        unpushDendaRondaFromBendahara,
        addKerjaBaktiEvent,
        updateKerjaBaktiAttendance,
        pushDendaKerjaBaktiToBendahara,
        unpushDendaKerjaBaktiFromBendahara,
        addSurat,
        updateSurat,
        deleteSurat,
        broadcastSuratViaWA,
        addPengumuman,
        markPengumumanRead,
        submitKeluhan,
        updateKeluhanStatus,
        bayarTagihanWarga,
        alokasikanDanaTitipan,
        alokasikanDepositWarga: alokasikanDanaTitipan,
        alokasikanDepositKombinasi,
        addPengeluaranKas,
        updatePengeluaranKas,
        deletePengeluaranKas,
        syncAllDendaToTagihan,
        addPemasukanKas,
        addHutangRT,
        bayarCicilanHutang,
        addPiutangLainnya,
        bayarCicilanPiutangLainnya,
        updateSettings,
        resetAllData,
        sendWhatsAppDirect,
        activePeriode,
        setActivePeriode,
        updateKomponenIuranWarga,
        closingBulanKas,
        arsipLaporanBulanan,
        deleteArsipLaporanBulanan,
        resetBukuKasOkt2026,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
