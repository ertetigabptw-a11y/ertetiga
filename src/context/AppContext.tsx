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
  AppSettings,
} from '../types';
import {
  INITIAL_WARGA_LIST,
  INITIAL_RONDA_SCHEDULES,
  INITIAL_USER_ACCOUNTS,
  DEFAULT_APP_SETTINGS,
  INITIAL_PENGELUARAN_KAS,
  INITIAL_PEMASUKAN_KAS,
  INITIAL_HUTANG_RT,
  INITIAL_SURAT_LIST,
  INITIAL_PENGUMUMAN,
} from '../data/initialData';
import { sendFonnteMessage, FonnteResponse } from '../services/fonnteService';

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
  settings: AppSettings;

  // Actions
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  switchRoleDirectly: (role: Role, targetWargaId?: number) => void;
  updateUserAccount: (userId: string, newUsername: string, newPassword?: string) => void;
  updateWarga: (id: number, data: Partial<Warga>) => void;
  addWarga: (warga: Omit<Warga, 'id'>) => void;
  deleteWarga: (id: number) => void;
  updateRondaSchedule: (hari: RondaSchedule['hari'], petugasNames: string[]) => void;
  addPresensiRonda: (entry: Omit<PresensiRonda, 'id'>) => Promise<PresensiRonda>;
  pushDendaRondaToBendahara: () => void;
  addKerjaBaktiEvent: (event: Omit<KerjaBaktiEvent, 'id' | 'isPushedToBendahara'>) => void;
  updateKerjaBaktiAttendance: (eventId: string, wargaId: number, hadir: boolean) => void;
  pushDendaKerjaBaktiToBendahara: (eventId: string) => void;
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
    alokasiKelebihan?: 'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali',
    alokasiNominal?: number
  ) => void;
  alokasikanDanaTitipan: (
    tagihanId: string,
    opsi: 'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali',
    nominal: number
  ) => void;
  addPengeluaranKas: (pengeluaran: Omit<PengeluaranKas, 'id'>) => void;
  addPemasukanKas: (pemasukan: Omit<PemasukanKas, 'id'>) => void;
  bayarCicilanHutang: (hutangId: string, nominal: number) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetAllData: () => void;
  sendWhatsAppDirect: (target: string, message: string) => Promise<FonnteResponse>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'neoport3_v2_';

function getInitialTagihan(wargaList: Warga[]): TagihanWarga[] {
  return wargaList.map(w => {
    const totalIuran = w.totalIuran;
    const piutangBulanLalu = w.saldoAwalBulanLalu < 0 ? Math.abs(w.saldoAwalBulanLalu) : 0;
    const titipanBulanLalu = w.saldoAwalBulanLalu > 0 ? w.saldoAwalBulanLalu : 0;

    // Sifat kelebihan bayar bulan lalu: otomatis mengurangi tagihan bulan berjalan
    let titipanDigunakan = 0;
    if (titipanBulanLalu > 0) {
      titipanDigunakan = Math.min(titipanBulanLalu, totalIuran + piutangBulanLalu);
    }

    const totalKewajiban = Math.max(0, totalIuran + piutangBulanLalu - titipanDigunakan);
    const sisaTitipan = titipanBulanLalu - titipanDigunakan;

    return {
      id: `tag-${w.id}`,
      wargaId: w.id,
      nama: w.namaPenghuni !== '-' ? w.namaPenghuni : (w.namaPemilik || `Rumah ${w.blok}/${w.noRumah}`),
      blokNo: `${w.blok}/${w.noRumah}`,
      periode: 'September 2026',
      dansosRT: w.dansosRT,
      dansosRW: w.dansosRW,
      pembangunan: w.pembangunan,
      snack: w.snackRapat,
      jimpitan: w.jimpitan,
      totalIuran: totalIuran,
      dendaRonda: 0,
      dendaKerjaBakti: 0,
      totalDenda: 0,
      piutangBulanLalu: piutangBulanLalu,
      titipanBulanLalu: titipanBulanLalu,
      titipanDigunakanUntukTagihan: titipanDigunakan,
      totalKewajiban: totalKewajiban,
      jumlahDibayar: totalKewajiban === 0 && titipanDigunakan > 0 ? titipanDigunakan : 0,
      statusBayar: totalKewajiban === 0 ? 'Lunas' : 'Belum Bayar',
      kelebihanBayar: sisaTitipan,
      alokasiKelebihan: sisaTitipan > 0 ? 'titipan_bulan_depan' : undefined,
    };
  });
}

function getInitialDendaRonda(wargaList: Warga[]): DendaRondaEntry[] {
  return wargaList
    .filter(w => w.kriteriaRonda === 'Wajib Ronda' && w.namaPenghuni !== '-')
    .map(w => ({
      wargaId: w.id,
      nama: w.namaPenghuni,
      statusWajib: 'Wajib Ronda',
      kategori: `${w.statusUsiaPenghuni}, ${w.domisiliKerja}, ${w.jenisKelamin}`,
      jumlahAlpa: 0,
      dendaTotal: 0,
      statusPushed: false,
      periode: 'September 2026',
    }));
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
    return saved ? JSON.parse(saved) : [];
  });

  const [dendaRondaList, setDendaRondaList] = useState<DendaRondaEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'dendaRonda');
    return saved ? JSON.parse(saved) : getInitialDendaRonda(INITIAL_WARGA_LIST);
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

  const [tagihanList, setTagihanList] = useState<TagihanWarga[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'tagihan');
    return saved ? JSON.parse(saved) : getInitialTagihan(INITIAL_WARGA_LIST);
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

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : DEFAULT_APP_SETTINGS;
  });

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
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);

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

  const updateUserAccount = (userId: string, newUsername: string, newPassword?: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            username: newUsername.trim(),
            ...(newPassword ? { password: newPassword.trim() } : {}),
          };
        }
        return u;
      })
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        username: newUsername.trim(),
        ...(newPassword ? { password: newPassword.trim() } : {}),
      } : null);
    }
  };

  // Warga management
  const updateWarga = (id: number, data: Partial<Warga>) => {
    setWargaList(prev =>
      prev.map(w => (w.id === id ? { ...w, ...data } : w))
    );
  };

  const addWarga = (warga: Omit<Warga, 'id'>) => {
    const nextId = wargaList.length > 0 ? Math.max(...wargaList.map(w => w.id)) + 1 : 1;
    const newWarga: Warga = { ...warga, id: nextId };
    setWargaList(prev => [...prev, newWarga]);
  };

  const deleteWarga = (id: number) => {
    setWargaList(prev => prev.filter(w => w.id !== id));
  };

  // Keamanan / Ronda
  const updateRondaSchedule = (hari: RondaSchedule['hari'], petugasNames: string[]) => {
    setRondaSchedules(prev =>
      prev.map(s => (s.hari === hari ? { ...s, petugasNames } : s))
    );
  };

  const addPresensiRonda = async (entry: Omit<PresensiRonda, 'id'>) => {
    const newEntry: PresensiRonda = {
      ...entry,
      id: `prs-${Date.now()}`,
    };
    setPresensiList(prev => [newEntry, ...prev]);

    // Optional: send automated WA broadcast to RT group
    const msg = `*PRESENSI RONDA POS RT.03*\n\nPetugas: *${entry.nama}*\nStatus: *${entry.status}*\nWaktu: ${entry.tanggal} ${entry.waktu}\nJarak ke Pos: ${Math.round(entry.distanceMeters)} meter\nVerifikasi: Lokasi GPS Valid`;
    sendFonnteMessage(settings.fonnteToken, settings.targetGroupWa, msg).catch(() => {});

    return newEntry;
  };

  const pushDendaRondaToBendahara = () => {
    // Sync denda ronda to tagihanList
    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const dendaEntry = dendaRondaList.find(d => d.wargaId === tag.wargaId);
        const nominalDenda = dendaEntry ? dendaEntry.dendaTotal : 0;
        const totalDenda = nominalDenda + tag.dendaKerjaBakti;
        const totalKewajiban = Math.max(0, tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan);
        return {
          ...tag,
          dendaRonda: nominalDenda,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : tag.jumlahDibayar >= totalKewajiban ? 'Lunas' : 'Belum Bayar',
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
    setKerjaBaktiEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
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
  };

  const pushDendaKerjaBaktiToBendahara = (eventId: string) => {
    const evt = kerjaBaktiEvents.find(e => e.id === eventId);
    if (!evt) return;

    setTagihanList(prevTagihan =>
      prevTagihan.map(tag => {
        const attendee = evt.kehadiran.find(k => k.wargaId === tag.wargaId);
        const nominalDendaKB = attendee && !attendee.hadir ? attendee.denda : 0;
        const totalDenda = tag.dendaRonda + nominalDendaKB;
        const totalKewajiban = Math.max(0, tag.totalIuran + totalDenda + tag.piutangBulanLalu - tag.titipanDigunakanUntukTagihan);
        return {
          ...tag,
          dendaKerjaBakti: nominalDendaKB,
          totalDenda: totalDenda,
          totalKewajiban: totalKewajiban,
          statusBayar: totalKewajiban === 0 ? 'Lunas' : tag.jumlahDibayar >= totalKewajiban ? 'Lunas' : 'Belum Bayar',
        };
      })
    );

    setKerjaBaktiEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isPushedToBendahara: true } : e))
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
    alokasiKelebihan?: 'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali',
    alokasiNominal?: number
  ) => {
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

        return {
          ...tag,
          jumlahDibayar: totalBayar,
          statusBayar: status,
          kelebihanBayar: kelebihan,
          alokasiKelebihan: alokasiKelebihan || (kelebihan > 0 ? 'titipan_bulan_depan' : undefined),
          alokasiNominal: alokasiNominal || kelebihan,
          metodeBayar: metode,
          tglBayar: new Date().toISOString().slice(0, 10),
        };
      })
    );

    // Record to Kas RT Pemasukan
    const tag = tagihanList.find(t => t.id === tagihanId);
    if (tag && jumlahBayar > 0) {
      addPemasukanKas({
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: 'Iuran Warga',
        namaSumber: `${tag.nama} (${tag.blokNo})`,
        nominal: jumlahBayar,
        keterangan: `Pembayaran iuran/denda periode ${tag.periode} via ${metode}`,
      });
    }
  };

  const alokasikanDanaTitipan = (
    tagihanId: string,
    opsi: 'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali',
    nominal: number
  ) => {
    setTagihanList(prev =>
      prev.map(tag => {
        if (tag.id !== tagihanId) return tag;
        return {
          ...tag,
          alokasiKelebihan: opsi,
          alokasiNominal: nominal,
        };
      })
    );

    const tag = tagihanList.find(t => t.id === tagihanId);
    if (tag && opsi === 'donasi_kas' && nominal > 0) {
      addPemasukanKas({
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: 'Kelebihan Bayar Dialihkan Donasi',
        namaSumber: `${tag.nama} (${tag.blokNo})`,
        nominal: nominal,
        keterangan: `Alokasi sisa kelebihan bayar untuk kas donasi RT`,
      });
    }
  };

  const addPengeluaranKas = (pengeluaran: Omit<PengeluaranKas, 'id'>) => {
    const newExp: PengeluaranKas = {
      ...pengeluaran,
      id: `exp-${Date.now()}`,
    };
    setPengeluaranList(prev => [newExp, ...prev]);
  };

  const addPemasukanKas = (pemasukan: Omit<PemasukanKas, 'id'>) => {
    const newInc: PemasukanKas = {
      ...pemasukan,
      id: `inc-${Date.now()}`,
    };
    setPemasukanList(prev => [newInc, ...prev]);
  };

  const bayarCicilanHutang = (hutangId: string, nominal: number) => {
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
      tanggal: new Date().toISOString().slice(0, 10),
      komponen: 'Pengeluaran lainnya',
      namaPenerimaOrPekerjaan: h?.kreditur || 'Cicilan Hutang',
      nominal: nominal,
      keterangan: `Pembayaran cicilan hutang tempo: ${h?.deskripsi}`,
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    setUsers(INITIAL_USER_ACCOUNTS);
    setWargaList(INITIAL_WARGA_LIST);
    setRondaSchedules(INITIAL_RONDA_SCHEDULES);
    setPresensiList([]);
    setDendaRondaList(getInitialDendaRonda(INITIAL_WARGA_LIST));
    setTagihanList(getInitialTagihan(INITIAL_WARGA_LIST));
    setPengeluaranList(INITIAL_PENGELUARAN_KAS);
    setPemasukanList(INITIAL_PEMASUKAN_KAS);
    setHutangList(INITIAL_HUTANG_RT);
    setSuratList(INITIAL_SURAT_LIST);
    setPengumumanList(INITIAL_PENGUMUMAN);
    setSettings(DEFAULT_APP_SETTINGS);
    setCurrentUser(INITIAL_USER_ACCOUNTS[0]);
    localStorage.clear();
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
        settings,
        login,
        logout,
        switchRoleDirectly,
        updateUserAccount,
        updateWarga,
        addWarga,
        deleteWarga,
        updateRondaSchedule,
        addPresensiRonda,
        pushDendaRondaToBendahara,
        addKerjaBaktiEvent,
        updateKerjaBaktiAttendance,
        pushDendaKerjaBaktiToBendahara,
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
        addPengeluaranKas,
        addPemasukanKas,
        bayarCicilanHutang,
        updateSettings,
        resetAllData,
        sendWhatsAppDirect,
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
