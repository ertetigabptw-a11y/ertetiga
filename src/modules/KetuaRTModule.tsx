import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Warga, SuratRT, Pengumuman } from '../types';
import { exportToCSV, formatRupiah, openPrintDialog } from '../utils/exportUtils';
import {
  Users,
  UserCheck,
  FileText,
  Bell,
  Search,
  Filter,
  Download,
  Printer,
  Send,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Coins,
  Eye,
  Calendar,
  Phone,
  MessageSquare,
  Mail,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface KetuaRTModuleProps {
  activeTab: string;
}

export const KetuaRTModule: React.FC<KetuaRTModuleProps> = ({ activeTab }) => {
  const {
    wargaList,
    updateWarga,
    addWarga,
    kerjaBaktiEvents,
    addKerjaBaktiEvent,
    updateKerjaBaktiAttendance,
    pushDendaKerjaBaktiToBendahara,
    unpushDendaKerjaBaktiFromBendahara,
    suratList,
    addSurat,
    updateSurat,
    deleteSurat,
    broadcastSuratViaWA,
    pengumumanList,
    addPengumuman,
    rondaSchedules,
    dendaRondaList,
    tagihanList,
    pengeluaranList,
    pemasukanList,
    settings,
  } = useApp();

  // Warga tab states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlok, setFilterBlok] = useState<string>('ALL');
  const [filterStatusHuni, setFilterStatusHuni] = useState<string>('ALL');
  const [filterStatusUsia, setFilterStatusUsia] = useState<string>('ALL');
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [isEditingWarga, setIsEditingWarga] = useState(false);
  const [editWargaForm, setEditWargaForm] = useState<Partial<Warga>>({});

  // Kerja Bakti tab states
  const [selectedEventId, setSelectedEventId] = useState<string>(
    kerjaBaktiEvents[0]?.id || ''
  );
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventDesc, setNewEventDesc] = useState('');

  // Surat tab states
  const [showSuratModal, setShowSuratModal] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<SuratRT | null>(null);
  const [sendingSuratId, setSendingSuratId] = useState<string | null>(null);
  const [suratSendMsg, setSuratSendMsg] = useState<{ id: string; msg: string; success: boolean } | null>(null);
  const [suratForm, setSuratForm] = useState<{
    jenis: SuratRT['jenis'];
    nomorSurat: string;
    tanggal: string;
    tujuan: string;
    targetHp: string;
    perihal: string;
    isiSurat: string;
    waktuAcara: string;
    tempat: string;
    agenda: string;
    penandatangan: string;
  }>({
    jenis: 'undangan_rapat',
    nomorSurat: `003/RT03-RW14/BPTW/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    tanggal: new Date().toISOString().slice(0, 10),
    tujuan: 'Seluruh Warga RT.03 RW.14',
    targetHp: settings.targetGroupWa,
    perihal: 'Undangan Rapat Rutin Warga RT.03',
    isiSurat: 'Mengharap kehadiran Bapak/Ibu warga RT.03 RW.14 Perum BPTW dalam rapat rutin warga untuk membahas evaluasi lingkungan dan keamanan.',
    waktuAcara: 'Sabtu Malam Minggu, Pukul 20.00 WIB s/d selesai',
    tempat: 'Balai Warga / Pos Ronda RT.03',
    agenda: '1. Evaluasi Iuran & Kas RT\n2. Jadwal Ronda Baru\n3. Rencana Kerja Bakti',
    penandatangan: 'Ketua RT.03 RW.14 Perum BPTW',
  });

  // Pengumuman form
  const [showPengumumanModal, setShowPengumumanModal] = useState(false);
  const [pgmJudul, setPgmJudul] = useState('');
  const [pgmIsi, setPgmIsi] = useState('');
  const [pgmKategori, setPgmKategori] = useState<'Informasi' | 'Darurat' | 'Kerja Bakti' | 'Iuran'>('Informasi');
  const [pgmSendWA, setPgmSendWA] = useState(true);

  // Filtered warga
  const filteredWarga = wargaList.filter((w) => {
    const matchSearch =
      w.namaPenghuni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.namaPemilik && w.namaPemilik.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${w.blok}/${w.noRumah}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBlok = filterBlok === 'ALL' || w.blok === filterBlok;
    const matchHuni = filterStatusHuni === 'ALL' || w.statusHuni === filterStatusHuni;
    const matchUsia = filterStatusUsia === 'ALL' || w.statusUsiaPenghuni === filterStatusUsia;
    return matchSearch && matchBlok && matchHuni && matchUsia;
  });

  // Male residents for Kerja Bakti
  const currentKBEvent = kerjaBaktiEvents.find((e) => e.id === selectedEventId) || kerjaBaktiEvents[0];

  // Handlers for Warga
  const handleStartEditWarga = (w: Warga) => {
    setSelectedWarga(w);
    const phone = w.kontakHp || w.hpPenghuni || w.hpPemilik || '';
    setEditWargaForm({
      ...w,
      kontakHp: phone,
      hpPenghuni: w.hpPenghuni || phone,
      hpPemilik: w.hpPemilik || phone,
    });
    setIsEditingWarga(true);
  };

  const handleSaveWarga = () => {
    if (!selectedWarga) return;
    const phone = (editWargaForm.kontakHp || editWargaForm.hpPenghuni || editWargaForm.hpPemilik || '').trim();
    updateWarga(selectedWarga.id, {
      ...editWargaForm,
      kontakHp: phone,
      hpPenghuni: editWargaForm.hpPenghuni || phone,
      hpPemilik: editWargaForm.hpPemilik || phone,
    });
    setIsEditingWarga(false);
    setSelectedWarga(null);
  };

  const handleExportWargaCSV = () => {
    const header = [
      'No',
      'Blok',
      'No Rumah',
      'Status Huni',
      'Nama Pemilik',
      'Nama Penghuni',
      'Jenis Kelamin',
      'Status Usia',
      'Domisili Kerja',
      'Kriteria Ronda',
      'Nomor WhatsApp / HP',
      'Total Iuran',
      'Saldo Awal Bulan Lalu',
    ];
    const rows = wargaList.map((w, idx) => [
      idx + 1,
      w.blok,
      w.noRumah,
      w.statusHuni,
      w.namaPemilik,
      w.namaPenghuni,
      w.jenisKelamin,
      w.statusUsiaPenghuni,
      w.domisiliKerja,
      w.kriteriaRonda,
      w.kontakHp || w.hpPenghuni || w.hpPemilik || '',
      w.totalIuran,
      w.saldoAwalBulanLalu,
    ]);
    exportToCSV('Data_Warga_RT03_RW14_BPTW', [header, ...rows]);
  };

  // Handlers for Kerja Bakti
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const males = wargaList.filter((w) => w.jenisKelamin === 'Laki-laki' && w.namaPenghuni !== '-');
    addKerjaBaktiEvent({
      judul: newEventTitle,
      tanggal: newEventDate,
      deskripsi: newEventDesc,
      dendaPerAlpa: 25000,
      kehadiran: males.map((m) => ({
        wargaId: m.id,
        nama: m.namaPenghuni,
        jenisKelamin: m.jenisKelamin,
        hadir: true,
        denda: 0,
      })),
    });
    setNewEventTitle('');
    setNewEventDesc('');
    setShowNewEventModal(false);
  };

  const handleExportKerjaBaktiCSV = () => {
    if (!currentKBEvent) return;
    const header = ['No', 'Nama Warga (Laki-laki)', 'Status Kehadiran', 'Denda (Rp)'];
    const rows = currentKBEvent.kehadiran.map((k, idx) => [
      idx + 1,
      k.nama,
      k.hadir ? 'Hadir' : 'Tidak Hadir (Alpa)',
      k.hadir ? 0 : currentKBEvent.dendaPerAlpa,
    ]);
    exportToCSV(`Kehadiran_KerjaBakti_${currentKBEvent.tanggal}`, [header, ...rows]);
  };

  // Handlers for Surat
  const handleTemplateSelect = (jenis: SuratRT['jenis']) => {
    let perihal = '';
    let isi = '';
    let agenda = '';

    if (jenis === 'undangan_rapat') {
      perihal = 'Undangan Rapat Rutin Warga RT.03 RW.14';
      isi = 'Mengharap kehadiran Bapak/Ibu warga RT.03 RW.14 Perum BPTW dalam rapat bulanan koordinasi lingkungan dan ketertiban.';
      agenda = '1. Laporan Keuangan Kas RT\n2. Kebersihan Lingkungan\n3. Lain-lain';
    } else if (jenis === 'undangan_kerja_bakti') {
      perihal = 'Undangan Kerja Bakti Gotong Royong Warga RT.03';
      isi = 'Dalam rangka menjaga kebersihan lingkungan dan pencegahan genangan air, kami mengundang seluruh bapak-bapak untuk hadir dalam kegiatan kerja bakti.';
      agenda = '1. Normalisasi saluran air/got\n2. Pemotongan rumput jalan utama\n3. Perapihan pos ronda';
    } else if (jenis === 'pengantar_administrasi') {
      perihal = 'Surat Pengantar Keterangan RT.03 RW.14 Perum BPTW';
      isi = 'Yang bertanda tangan di bawah ini Ketua RT.03 RW.14 Perum BPTW Kelurahan Gumilir, Kecamatan Cilacap Utara, menerangkan bahwa warga tersebut di atas adalah benar penduduk yang berdomisili sah di lingkungan RT.03 RW.14, berkepribadian baik, dan tertib bermasyarakat.\n\nDemikian surat pengantar ini dibuat dengan sebenarnya untuk dipergunakan dalam pengurusan administrasi kependudukan (KTP/KK), permohonan ke tingkat RW / Kelurahan Gumilir, atau instansi terkait.';
      agenda = 'Keperluan: Pengurusan KTP / KK / Surat Keterangan Domisili / Administrasi Resmi';
    } else if (jenis === 'surat_peringatan') {
      perihal = 'SURAT PERINGATAN (SP) KEPATUHAN & TATA TERTIB RT.03';
      isi = 'Berdasarkan musyawarah warga dan tata tertib RT.03 RW.14 Perum BPTW, bersama ini pengurus RT menyampaikan Peringatan Tertulis kepada yang bersangkutan sehubungan dengan adanya ketidakpatuhan / keterlambatan pemenuhan kewajiban (iuran kas / ketertiban jadwal ronda malam / ketertiban lingkungan) yang belum diselesaikan.\n\nMohon untuk segera mengonfirmasi dan menyelesaikan kewajiban tersebut demi menjaga kerukunan dan keharmonisan bersama seluruh warga.';
      agenda = 'Batas Waktu Koordinasi: 3 (tiga) hari kerja sejak surat ini disampaikan.';
    } else if (jenis === 'somasi') {
      perihal = 'SURAT TEGURAN / SOMASI KEPATUHAN LINGKUNGAN RT.03';
      isi = 'Sehubungan dengan catatan kepengurusan RT.03 terkait ketertiban lingkungan / tunggakan kewajiban iuran yang belum terselesaikan, bersama ini pengurus RT menyampaikan peringatan resmi untuk segera menyelesaikan kewajiban tersebut demi kenyamanan bersama.';
      agenda = 'Batas penyelesaian: 7 hari kerja sejak surat ini diterbitkan.';
    }

    setSuratForm((prev) => ({
      ...prev,
      jenis,
      perihal,
      isiSurat: isi,
      agenda,
    }));
  };

  const handleSaveSurat = (e: React.FormEvent) => {
    e.preventDefault();
    addSurat({
      jenis: suratForm.jenis,
      nomorSurat: suratForm.nomorSurat,
      tanggal: suratForm.tanggal,
      tujuan: suratForm.tujuan,
      targetHp: suratForm.targetHp,
      perihal: suratForm.perihal,
      isiSurat: suratForm.isiSurat,
      waktuAcara: suratForm.waktuAcara,
      tempat: suratForm.tempat,
      agenda: suratForm.agenda,
      penandatangan: suratForm.penandatangan,
      statusKirimWA: 'Belum',
    });
    setShowSuratModal(false);
  };

  const handleBroadcastSurat = async (id: string) => {
    setSendingSuratId(id);
    setSuratSendMsg(null);
    try {
      const res = await broadcastSuratViaWA(id);
      setSuratSendMsg({
        id,
        msg: res.message || (res.status ? 'Surat berhasil dikirim via WA Gateway!' : 'Gagal mengirim surat via WA'),
        success: res.status,
      });
    } catch (e: any) {
      setSuratSendMsg({
        id,
        msg: e.message || 'Error saat kirim surat',
        success: false,
      });
    } finally {
      setSendingSuratId(null);
    }
  };

  // Confirm modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'whatsapp';
    icon?: 'push' | 'unpush' | 'whatsapp' | 'danger' | 'info' | 'help';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    onClose?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePromptPushDendaKB = () => {
    if (!currentKBEvent) return;
    const alpaList = currentKBEvent.kehadiran.filter((k) => !k.hadir);
    const totalDenda = alpaList.length * currentKBEvent.dendaPerAlpa;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Push Denda Kerja Bakti',
      icon: 'push',
      confirmVariant: 'warning',
      confirmLabel: 'Ya, Push ke Bendahara',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menyinkronkan denda kerja bakti kegiatan <strong>{currentKBEvent.judul}</strong> ({currentKBEvent.tanggal}) ke Buku Tagihan Kas Bendahara RT.03.
          </p>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Warga Hadir:</span>
              <strong className="text-emerald-400 font-bold">{currentKBEvent.kehadiran.filter((k) => k.hadir).length} orang</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Warga Alpa (Kena Denda):</span>
              <strong className="text-rose-400 font-bold">{alpaList.length} orang</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tarif Denda per Alpa:</span>
              <strong className="text-slate-200 font-mono">{formatRupiah(currentKBEvent.dendaPerAlpa)}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-1">
              <span className="text-slate-300 font-semibold">Total Denda Di-push:</span>
              <strong className="text-amber-400 font-mono text-xs">{formatRupiah(totalDenda)}</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Nilai denda ini akan masuk ke kartu tagihan iuran bulanan warga yang bersangkutan di modul Bendahara.
          </p>
        </div>
      ),
      onConfirm: () => {
        pushDendaKerjaBaktiToBendahara(currentKBEvent.id);
        closeConfirmModal();
      },
    });
  };

  const handlePromptUnpushDendaKB = () => {
    if (!currentKBEvent) return;
    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Unpush Denda Kerja Bakti',
      icon: 'unpush',
      confirmVariant: 'danger',
      confirmLabel: 'Ya, Unpush Denda',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin <strong>menarik kembali (unpush)</strong> denda kerja bakti untuk kegiatan <strong>{currentKBEvent.judul}</strong>?
          </p>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-200 space-y-1">
            <p className="font-semibold">Efek Pembatalan:</p>
            <p>• Komponen tagihan denda kerja bakti pada warga terkait di buku tagihan Bendahara akan ditarik/dikurangkan kembali.</p>
            <p>• Status kegiatan ini akan kembali menjadi draf (belum di-push).</p>
          </div>
        </div>
      ),
      onConfirm: () => {
        unpushDendaKerjaBaktiFromBendahara(currentKBEvent.id);
        closeConfirmModal();
      },
    });
  };

  const handlePromptBroadcastSurat = (srt: SuratRT) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Siaran Surat via WhatsApp',
      icon: 'whatsapp',
      confirmVariant: 'whatsapp',
      confirmLabel: 'Ya, Kirim Surat Sekarang',
      message: (
        <div className="space-y-2">
          <p>
            Kirim surat resmi pengurus RT.03 melalui WhatsApp Gateway (Fonnte API):
          </p>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">No. Surat:</span>
              <strong className="font-mono text-slate-200">{srt.nomorSurat}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Perihal:</span>
              <strong className="text-amber-400">{srt.perihal}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tujuan:</span>
              <span className="text-slate-200">{srt.tujuan}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-1">
              <span className="text-slate-400">Target Nomor:</span>
              <strong className="font-mono text-emerald-400">{srt.targetHp || settings.targetGroupWa}</strong>
            </div>
          </div>
        </div>
      ),
      onConfirm: async () => {
        closeConfirmModal();
        await handleBroadcastSurat(srt.id);
      },
    });
  };

  // Handlers for Pengumuman
  const handleSavePengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgmJudul.trim() || !pgmIsi.trim()) return;

    if (pgmSendWA) {
      setConfirmModalConfig({
        isOpen: true,
        title: 'Konfirmasi Siaran Pengumuman via WhatsApp',
        icon: 'whatsapp',
        confirmVariant: 'whatsapp',
        confirmLabel: 'Ya, Terbitkan & Siarkan WA',
        message: (
          <div className="space-y-2">
            <p>
              Pengumuman ini akan diterbitkan di papan pengumuman aplikasi dan disiarkan langsung ke <strong>Grup WhatsApp Warga RT.03 RW.14</strong>.
            </p>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-[11px] space-y-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Judul Pengumuman:</span>
                <strong className="text-amber-400 text-xs">{pgmJudul}</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block text-[10px]">Kategori:</span>
                <span className="text-slate-200">{pgmKategori}</span>
              </div>
              <div className="pt-1 border-t border-slate-700">
                <span className="text-slate-400 block text-[10px]">Target Grup WA:</span>
                <span className="font-mono text-emerald-400">{settings.targetGroupWa}</span>
              </div>
            </div>
          </div>
        ),
        onConfirm: async () => {
          closeConfirmModal();
          await addPengumuman(
            {
              judul: pgmJudul,
              isi: pgmIsi,
              tanggal: new Date().toISOString().slice(0, 10),
              kategori: pgmKategori,
              author: 'Ketua RT.03 RW.14',
            },
            true
          );
          setPgmJudul('');
          setPgmIsi('');
          setShowPengumumanModal(false);
        },
      });
    } else {
      await addPengumuman(
        {
          judul: pgmJudul,
          isi: pgmIsi,
          tanggal: new Date().toISOString().slice(0, 10),
          kategori: pgmKategori,
          author: 'Ketua RT.03 RW.14',
        },
        false
      );
      setPgmJudul('');
      setPgmIsi('');
      setShowPengumumanModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
        <div className="flex items-center gap-2 text-amber-800 mb-1">
          <Users className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Modul Ketua RT</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Pengelolaan Warga & Administrasi Lingkungan</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          RT.03 RW.14 Perum BPTW Cilacap • 56 Kavling Warga Terdata
        </p>
      </div>

      {/* TAB 1: KELOLA DATA WARGA */}
      {activeTab === 'warga' && (
        <div className="space-y-3">
          {/* Action Bar */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Database 56 Kavling Warga</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportWargaCSV}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                  title="Download Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={openPrintDialog}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                  title="Cetak PDF / Print"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau blok..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <select
                value={filterBlok}
                onChange={(e) => setFilterBlok(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Semua Blok</option>
                <option value="UT">Blok UT</option>
                <option value="E">Blok E</option>
                <option value="G">Blok G</option>
                <option value="I">Blok I</option>
                <option value="K">Blok K</option>
                <option value="L">Blok L</option>
              </select>

              <select
                value={filterStatusHuni}
                onChange={(e) => setFilterStatusHuni(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Semua Huni</option>
                <option value="Dihuni">Dihuni</option>
                <option value="Kosong">Kosong</option>
                <option value="Tanah">Tanah</option>
              </select>

              <select
                value={filterStatusUsia}
                onChange={(e) => setFilterStatusUsia(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Semua Status Usia</option>
                <option value="Produktif">⚡ Produktif (37)</option>
                <option value="Lansia">👴 Lansia (5)</option>
                <option value="-">- (Tanpa Penghuni)</option>
              </select>
            </div>
          </div>

          {/* List Warga Cards */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
              <span>Menampilkan {filteredWarga.length} dari {wargaList.length} kavling</span>
              <span className="text-[10px] text-slate-500">
                {wargaList.filter((w) => w.statusUsiaPenghuni === 'Produktif').length} Produktif • {wargaList.filter((w) => w.statusUsiaPenghuni === 'Lansia').length} Lansia
              </span>
            </div>

            {filteredWarga.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {w.namaPenghuni !== '-' ? w.namaPenghuni : w.namaPemilik || 'Tanpa Nama'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          w.statusHuni === 'Dihuni'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : w.statusHuni === 'Kosong'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {w.statusHuni}
                      </span>
                      {w.statusUsiaPenghuni === 'Lansia' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          👴 Lansia
                        </span>
                      ) : w.statusUsiaPenghuni === 'Produktif' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                          ⚡ Produktif
                        </span>
                      ) : null}
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Kavling: <span className="text-slate-200 font-mono font-bold">Blok {w.blok}/{w.noRumah}</span>
                      {w.namaPemilik && w.namaPemilik !== w.namaPenghuni && ` • Pemilik: ${w.namaPemilik}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartEditWarga(w)}
                    className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                    title="Edit Data Warga"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-700/50 text-slate-300">
                  <div>
                    Kriteria Ronda:{' '}
                    <span
                      className={`font-semibold ${
                        w.kriteriaRonda === 'Wajib Ronda' ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {w.kriteriaRonda}
                    </span>
                  </div>
                  <div>
                    Iuran Bulanan:{' '}
                    <span className="font-semibold text-emerald-400 font-mono">
                      {formatRupiah(w.totalIuran)}
                    </span>
                  </div>
                  <div>
                    Status Usia:{' '}
                    <span className={`font-semibold ${w.statusUsiaPenghuni === 'Lansia' ? 'text-amber-300 font-bold' : w.statusUsiaPenghuni === 'Produktif' ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {w.statusUsiaPenghuni === 'Lansia' ? '👴 Lansia' : w.statusUsiaPenghuni === 'Produktif' ? '⚡ Produktif' : '-'}
                    </span>
                  </div>
                  <div>
                    Status Pernikahan:{' '}
                    <span className="font-semibold text-slate-200">
                      {w.statusPernikahan || 'Menikah'}
                    </span>
                  </div>
                  <div>
                    Gender / Tinggal: <span>{w.jenisKelamin}, {w.statusTinggal || '-'}</span>
                  </div>
                  <div>
                    Domisili Kerja: <span>{w.domisiliKerja}</span>
                  </div>
                </div>

                {(() => {
                  const phone = w.kontakHp || w.hpPenghuni || w.hpPemilik;
                  if (!phone) return null;
                  const cleanPhone = phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('62')
                    ? cleanPhone
                    : cleanPhone.startsWith('08')
                    ? `62${cleanPhone.slice(1)}`
                    : cleanPhone;
                  const waUrl = `https://wa.me/${waNumber}`;

                  return (
                    <div className="pt-2 mt-1 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{phone}</span>
                      </div>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition"
                        title="Chat WhatsApp Warga"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>Chat WA</span>
                      </a>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Edit Warga Modal */}
          {isEditingWarga && selectedWarga && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">
                    Edit Data Warga (Blok {selectedWarga.blok}/{selectedWarga.noRumah})
                  </h3>
                  <button
                    onClick={() => setIsEditingWarga(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Nama Penghuni:</label>
                    <input
                      type="text"
                      value={editWargaForm.namaPenghuni || ''}
                      onChange={(e) => setEditWargaForm({ ...editWargaForm, namaPenghuni: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Nama Pemilik:</label>
                    <input
                      type="text"
                      value={editWargaForm.namaPemilik || ''}
                      onChange={(e) => setEditWargaForm({ ...editWargaForm, namaPemilik: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Status Huni:</label>
                      <select
                        value={editWargaForm.statusHuni || 'Dihuni'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, statusHuni: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Dihuni">Dihuni</option>
                        <option value="Kosong">Kosong</option>
                        <option value="Tanah">Tanah</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Kriteria Ronda:</label>
                      <select
                        value={editWargaForm.kriteriaRonda || 'Wajib Ronda'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, kriteriaRonda: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Wajib Ronda">Wajib Ronda</option>
                        <option value="Bebas Ronda">Bebas Ronda</option>
                        <option value="Tidak Wajib">Tidak Wajib</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Status Usia:</label>
                      <select
                        value={editWargaForm.statusUsiaPenghuni || '-'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, statusUsiaPenghuni: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Produktif">Produktif</option>
                        <option value="Lansia">Lansia</option>
                        <option value="-">- (Tanpa Penghuni)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Status Tinggal:</label>
                      <select
                        value={editWargaForm.statusTinggal || 'Tetap'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, statusTinggal: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Sementara">Sementara</option>
                        <option value="-">-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Jenis Kelamin:</label>
                      <select
                        value={editWargaForm.jenisKelamin || 'Laki-laki'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, jenisKelamin: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Domisili Kerja:</label>
                      <select
                        value={editWargaForm.domisiliKerja || 'Dalam Kota'}
                        onChange={(e) => setEditWargaForm({ ...editWargaForm, domisiliKerja: e.target.value as any })}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      >
                        <option value="Dalam Kota">Dalam Kota</option>
                        <option value="Luar Kota">Luar Kota</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Status Pernikahan:</label>
                    <select
                      value={editWargaForm.statusPernikahan || 'Menikah'}
                      onChange={(e) => setEditWargaForm({ ...editWargaForm, statusPernikahan: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="Menikah">Menikah</option>
                      <option value="Blm Menikah">Blm Menikah</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Nomor WhatsApp / Kontak HP:</label>
                    <input
                      type="text"
                      value={editWargaForm.kontakHp || ''}
                      onChange={(e) =>
                        setEditWargaForm({
                          ...editWargaForm,
                          kontakHp: e.target.value,
                          hpPenghuni: e.target.value,
                        })
                      }
                      placeholder="Contoh: 628123456789 atau 08123456789"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                    />
                    <span className="text-[10px] text-emerald-400/90 mt-0.5 block">
                      ✓ Terintegrasi ke seluruh modul (Slip Bendahara, Denda Keamanan, Surat RT, Portal Warga).
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Catatan Khusus:</label>
                    <textarea
                      rows={2}
                      value={editWargaForm.catatan || ''}
                      onChange={(e) => setEditWargaForm({ ...editWargaForm, catatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingWarga(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveWarga}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      Simpan Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KEHADIRAN KERJA BAKTI */}
      {activeTab === 'kerjabakti' && (
        <div className="space-y-3">
          {/* Header Card & Push to Bendahara */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Presensi Kerja Bakti Rutin</h3>
                <p className="text-[11px] text-slate-400">
                  Otomatis memfilter warga laki-laki • Denda Alpa: Rp 25.000 / bln
                </p>
              </div>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kegiatan Baru</span>
              </button>
            </div>

            {/* Event Selector */}
            {kerjaBaktiEvents.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">Pilih Kegiatan Kerja Bakti:</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {kerjaBaktiEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.tanggal} - {evt.judul} ({evt.isPushedToBendahara ? 'Sudah di-Push' : 'Draf'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentKBEvent && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportKerjaBaktiCSV}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={openPrintDialog}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cetak</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Unpush Denda Kerja Bakti Button */}
                  <button
                    onClick={handlePromptUnpushDendaKB}
                    disabled={!currentKBEvent.isPushedToBendahara}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Batalkan denda kerja bakti untuk kegiatan ini dari modul Bendahara"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Unpush Denda</span>
                  </button>

                  {/* Push Denda to Bendahara Button */}
                  <button
                    onClick={handlePromptPushDendaKB}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-95"
                    title="Sinkronkan denda alpa kerja bakti ke modul Bendahara"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>
                      {currentKBEvent.isPushedToBendahara
                        ? 'Perbarui Push Denda'
                        : 'Push Denda ke Modul Bendahara'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List Laki-laki Attendance */}
          {currentKBEvent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Daftar Warga Laki-laki ({currentKBEvent.kehadiran.length} Orang)</span>
                <span>
                  Hadir: {currentKBEvent.kehadiran.filter((k) => k.hadir).length} • Alpa:{' '}
                  {currentKBEvent.kehadiran.filter((k) => !k.hadir).length}
                </span>
              </div>

              {currentKBEvent.kehadiran.map((attendee) => (
                <div
                  key={attendee.wargaId}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                    attendee.hadir
                      ? 'bg-slate-800/80 border-slate-700/80'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white text-sm">{attendee.nama}</span>
                    <p className="text-[11px] text-slate-400">
                      Status:{' '}
                      <span className={attendee.hadir ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {attendee.hadir ? 'Hadir Gotong Royong' : 'Tidak Hadir (Alpa)'}
                      </span>
                      {!attendee.hadir && (
                        <span className="text-rose-300 font-mono ml-2 font-bold">
                          Denda: Rp 25.000
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateKerjaBaktiAttendance(currentKBEvent.id, attendee.wargaId, true)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                        attendee.hadir
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => updateKerjaBaktiAttendance(currentKBEvent.id, attendee.wargaId, false)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                        !attendee.hadir
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Alpa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Event Modal */}
          {showNewEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleCreateEvent}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Jadwalkan Kerja Bakti Baru</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewEventModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Judul Kegiatan:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pembersihan Drainase Blok Utama"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Tanggal Pelaksanaan:</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Deskripsi / Keterangan:</label>
                    <textarea
                      rows={3}
                      placeholder="Detail kegiatan dan peralatan yang dibawa..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewEventModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    Buat Jadwal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEMPLATE SURAT & SOMASI */}
      {activeTab === 'surat' && (
        <div className="space-y-3">
          {/* Header Surat */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Template Surat Resmi RT.03</h3>
                <p className="text-[11px] text-slate-400">
                  Undangan Rapat, Kerja Bakti, Pengantar & Surat Somasi Warga
                </p>
              </div>
              <button
                onClick={() => setShowSuratModal(true)}
                className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Surat</span>
              </button>
            </div>

            {/* Quick Templates Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'undangan_rapat' as const, label: 'Undangan Rapat' },
                { id: 'undangan_kerja_bakti' as const, label: 'Undangan Kerja Bakti' },
                { id: 'pengantar_administrasi' as const, label: 'Surat Pengantar' },
                { id: 'surat_peringatan' as const, label: 'Surat Peringatan (SP)' },
                { id: 'somasi' as const, label: 'Surat Somasi / Teguran' },
              ].map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    handleTemplateSelect(template.id);
                    setShowSuratModal(true);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-medium"
                >
                  + {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Generated Letters */}
          <div className="space-y-2.5">
            {suratList.map((srt) => (
              <div
                key={srt.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                        {srt.jenisSurat}
                      </span>
                      <span className="text-slate-400 text-[10px]">{srt.tanggal}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{srt.perihal}</h4>
                    <p className="text-slate-400 text-[11px]">
                      No: <span className="font-mono text-slate-300">{srt.nomorSurat}</span> • Tujuan: {srt.tujuan}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteSurat(srt.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Hapus Surat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 line-clamp-2">
                  {srt.isiSurat}
                </div>

                {suratSendMsg && suratSendMsg.id === srt.id && (
                  <div
                    className={`p-2 rounded-lg text-xs font-semibold ${
                      suratSendMsg.success ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                    }`}
                  >
                    {suratSendMsg.msg}
                  </div>
                )}

                {/* Actions: Broadcast WA, Preview Kop RT, Print */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Status WA:</span>
                    <span
                      className={`font-semibold ${
                        srt.statusKirimWA === 'Terkirim' ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {srt.statusKirimWA}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewSurat(srt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-blue-400" />
                      <span>Preview Kop RT</span>
                    </button>

                    <button
                      onClick={() => handlePromptBroadcastSurat(srt)}
                      disabled={sendingSuratId === srt.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>{sendingSuratId === srt.id ? 'Mengirim...' : 'Kirim WA (Fonnte)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Surat Modal */}
          {showSuratModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSaveSurat}
                className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Buat Surat Resmi RT.03</h3>
                  <button
                    type="button"
                    onClick={() => setShowSuratModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Jenis Surat:</label>
                    <select
                      value={suratForm.jenis}
                      onChange={(e) => handleTemplateSelect(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="undangan_rapat">Undangan Rapat</option>
                      <option value="undangan_kerja_bakti">Undangan Kerja Bakti</option>
                      <option value="pengantar_administrasi">Surat Pengantar</option>
                      <option value="surat_peringatan">Surat Peringatan (SP)</option>
                      <option value="somasi">Surat Somasi / Teguran</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Tanggal Surat:</label>
                    <input
                      type="date"
                      value={suratForm.tanggal}
                      onChange={(e) => setSuratForm({ ...suratForm, tanggal: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nomor Surat:</label>
                  <input
                    type="text"
                    value={suratForm.nomorSurat}
                    onChange={(e) => setSuratForm({ ...suratForm, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Kepada / Tujuan:</label>
                    <input
                      type="text"
                      list="daftar-warga-surat"
                      value={suratForm.tujuan}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = wargaList.find(
                          (w) =>
                            (w.namaPenghuni && w.namaPenghuni.toLowerCase() === val.toLowerCase()) ||
                            (w.namaPemilik && w.namaPemilik.toLowerCase() === val.toLowerCase()) ||
                            `${w.blok}/${w.noRumah}`.toLowerCase() === val.toLowerCase()
                        );
                        const phone = match ? match.kontakHp || match.hpPenghuni || match.hpPemilik || '' : '';
                        setSuratForm({
                          ...suratForm,
                          tujuan: val,
                          targetHp: phone || suratForm.targetHp,
                        });
                      }}
                      placeholder="Pilih atau ketik tujuan..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                    <datalist id="daftar-warga-surat">
                      <option value="Seluruh Warga RT.03 RW.14" />
                      {wargaList.map((w) => {
                        const name = w.namaPenghuni !== '-' ? w.namaPenghuni : w.namaPemilik;
                        return (
                          <option
                            key={w.id}
                            value={name}
                            label={`Blok ${w.blok}/${w.noRumah} (${w.kontakHp || w.hpPenghuni || w.hpPemilik || 'No HP'})`}
                          />
                        );
                      })}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Target WA (Grup / Nomor):</label>
                    <input
                      type="text"
                      value={suratForm.targetHp}
                      onChange={(e) => setSuratForm({ ...suratForm, targetHp: e.target.value })}
                      placeholder="628... atau Grup WA RT"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Perihal Surat:</label>
                  <input
                    type="text"
                    value={suratForm.perihal}
                    onChange={(e) => setSuratForm({ ...suratForm, perihal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Isi Pesan Surat:</label>
                  <textarea
                    rows={3}
                    value={suratForm.isiSurat}
                    onChange={(e) => setSuratForm({ ...suratForm, isiSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Waktu Acara (opsional):</label>
                    <input
                      type="text"
                      placeholder="Sabtu, 20.00 WIB"
                      value={suratForm.waktuAcara}
                      onChange={(e) => setSuratForm({ ...suratForm, waktuAcara: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Tempat (opsional):</label>
                    <input
                      type="text"
                      placeholder="Pos Ronda RT.03"
                      value={suratForm.tempat}
                      onChange={(e) => setSuratForm({ ...suratForm, tempat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Agenda / Catatan (opsional):</label>
                  <textarea
                    rows={2}
                    value={suratForm.agenda}
                    onChange={(e) => setSuratForm({ ...suratForm, agenda: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSuratModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                  >
                    Simpan Surat
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Official Letter Preview Modal with Kop RT.03 RW.14 */}
          {previewSurat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white text-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official Document Print Preview
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={openPrintDialog}
                      className="px-3 py-1 bg-slate-800 text-white text-xs rounded-lg flex items-center gap-1 font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak / PDF
                    </button>
                    <button
                      onClick={() => setPreviewSurat(null)}
                      className="p-1 text-slate-500 hover:text-black"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Kop Surat Resmi */}
                <div className="text-center border-b-2 border-double border-slate-900 pb-3">
                  <h3 className="text-base font-black uppercase tracking-wide">
                    RUKUN TETANGGA 03 RUKUN WARGA 14
                  </h3>
                  <h4 className="text-sm font-bold uppercase tracking-wider">
                    PERUM BUMI PUSPA TAMBUN WIJAYA (BPTW) CILACAP
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Kelurahan Gumilir, Kecamatan Cilacap Utara, Kabupaten Cilacap, Jawa Tengah 53231
                  </p>
                </div>

                {/* Isi Surat */}
                <div className="text-xs space-y-3 leading-relaxed">
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p>Nomor : {previewSurat.nomorSurat}</p>
                      <p>Perihal : {previewSurat.perihal}</p>
                    </div>
                    <div className="text-right">
                      <p>Cilacap, {previewSurat.tanggal}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p>Kepada Yth:</p>
                    <p className="font-bold">{previewSurat.tujuan}</p>
                    <p>di Tempat</p>
                  </div>

                  <p className="indent-6">Dengan hormat,</p>
                  <p className="indent-6">{previewSurat.isiSurat}</p>

                  {previewSurat.waktuAcara && (
                    <div className="pl-6 space-y-1">
                      <p>Hari/Waktu : {previewSurat.waktuAcara}</p>
                      <p>Tempat : {previewSurat.tempat}</p>
                      {previewSurat.agenda && <p>Agenda : {previewSurat.agenda}</p>}
                    </div>
                  )}

                  <p className="indent-6">
                    Demikian surat ini kami sampaikan. Atas perhatian, kehadiran dan kerjasamanya kami ucapkan terima kasih.
                  </p>

                  {/* Tanda Tangan */}
                  <div className="pt-8 flex justify-end">
                    <div className="text-center w-56">
                      <p>Pengurus RT.03 RW.14</p>
                      <p className="font-bold mb-12">Ketua RT</p>
                      <p className="font-bold underline">{previewSurat.penandatangan}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PENGUMUMAN RT */}
      {activeTab === 'pengumuman' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Pengumuman & Siaran Warga</h3>
                <p className="text-[11px] text-slate-400">
                  Otomatis terbit di beranda warga & terkirim ke WhatsApp Grup RT
                </p>
              </div>
              <button
                onClick={() => setShowPengumumanModal(true)}
                className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {pengumumanList.map((pgm) => (
              <div
                key={pgm.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                      {pgm.kategori}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{pgm.judul}</h4>
                    <p className="text-[11px] text-slate-400">
                      Oleh: {pgm.author} • {pgm.tanggal}
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{pgm.isi}</p>

                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                  <span>Dibaca oleh {pgm.dibacaOleh.length} warga</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Siaran Terbit
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* New Announcement Modal */}
          {showPengumumanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSavePengumuman}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Buat Pengumuman Warga</h3>
                  <button
                    type="button"
                    onClick={() => setShowPengumumanModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Kategori:</label>
                  <select
                    value={pgmKategori}
                    onChange={(e) => setPgmKategori(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Informasi">Informasi Umum</option>
                    <option value="Kerja Bakti">Kerja Bakti</option>
                    <option value="Iuran">Iuran & Keuangan</option>
                    <option value="Darurat">Darurat / Penting</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Judul Pengumuman:</label>
                  <input
                    type="text"
                    required
                    value={pgmJudul}
                    onChange={(e) => setPgmJudul(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Isi Pengumuman:</label>
                  <textarea
                    rows={4}
                    required
                    value={pgmIsi}
                    onChange={(e) => setPgmIsi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={pgmSendWA}
                    onChange={(e) => setPgmSendWA(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 w-4 h-4"
                  />
                  <span>Kirim broadcast otomatis ke Grup WhatsApp RT.03</span>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPengumumanModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                  >
                    Terbitkan Pengumuman
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PREVIEW MODUL KEAMANAN (READ-ONLY) */}
      {activeTab === 'preview_keamanan' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>Mode Preview (Read-Only):</strong> Ketua RT hanya memiliki otoritas memantau modul Keamanan tanpa dapat mengedit jadwal atau denda.
            </span>
          </div>

          {/* Jadwal Ronda Overview */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Jadwal Ronda Petugas (Senin s/d Minggu)</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              *Warga dengan status usia Lansia otomatis dikecualikan/disembunyikan dari daftar hadir ronda.
            </p>

            <div className="space-y-1.5 pt-1">
              {rondaSchedules.map((sch) => {
                const activePetugas = sch.petugasNames.filter((p) => {
                  const w = wargaList.find(
                    (x) =>
                      x.namaPenghuni?.trim().toLowerCase() === p.trim().toLowerCase() ||
                      x.namaPemilik?.trim().toLowerCase() === p.trim().toLowerCase()
                  );
                  return w?.statusUsiaPenghuni !== 'Lansia';
                });

                return (
                  <div
                    key={sch.hari}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="font-bold text-amber-300 w-16">{sch.hari}</span>
                    <div className="flex flex-wrap gap-1 flex-1 pl-2">
                      {activePetugas.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rekap Denda Ronda Overview */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Rekapitulasi Denda Ronda Warga</span>
            </h3>

            <div className="space-y-1">
              {dendaRondaList
                .filter((d) => {
                  const w = wargaList.find(
                    (x) =>
                      x.id === d.wargaId ||
                      x.namaPenghuni?.trim().toLowerCase() === d.nama.trim().toLowerCase() ||
                      x.namaPemilik?.trim().toLowerCase() === d.nama.trim().toLowerCase()
                  );
                  return w?.statusUsiaPenghuni !== 'Lansia';
                })
                .slice(0, 5)
                .map((d) => (
                <div
                  key={d.wargaId}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white">{d.nama}</p>
                    <p className="text-[10px] text-slate-400">
                      Alpa: {d.jumlahAlpa} kali • {d.kategori}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatRupiah(d.dendaTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PREVIEW MODUL BENDAHARA (READ-ONLY) */}
      {activeTab === 'preview_bendahara' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              <strong>Mode Preview (Read-Only):</strong> Ketua RT hanya memiliki otoritas memantau pembukuan Kas RT tanpa dapat menginput atau mengubah transaksi kas.
            </span>
          </div>

          {/* Ringkasan Kas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Pemasukan Kas</span>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {formatRupiah((pemasukanList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0))}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Pengeluaran Kas</span>
              <p className="text-base font-black text-rose-400 font-mono mt-0.5">
                {formatRupiah((pengeluaranList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0))}
              </p>
            </div>
          </div>

          {/* Buku Kas RT Preview */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm">11 Komponen Pengeluaran SOP Kas RT</h3>
            <div className="space-y-1.5">
              {(!pengeluaranList || pengeluaranList.length === 0) ? (
                <p className="text-center py-4 text-slate-500 text-xs">Belum ada catatan mutasi pengeluaran kas.</p>
              ) : (
                pengeluaranList.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white">{exp.komponen}</p>
                      <p className="text-[10px] text-slate-400">{exp.keterangan || exp.namaPenerimaOrPekerjaan}</p>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {formatRupiah(exp.nominal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        cancelLabel={confirmModalConfig.cancelLabel}
        confirmVariant={confirmModalConfig.confirmVariant}
        icon={confirmModalConfig.icon}
        isLoading={confirmModalConfig.isLoading}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => {
          confirmModalConfig.onCancel?.();
          closeConfirmModal();
        }}
        onClose={() => {
          confirmModalConfig.onClose?.();
          closeConfirmModal();
        }}
      />
    </div>
  );
};
