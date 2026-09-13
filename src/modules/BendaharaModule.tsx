import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TagihanWarga, PengeluaranKas, PemasukanKas, HutangRT, PiutangWargaLainnya, Warga } from '../types';
import { exportToCSV, formatRupiah, openPrintDialog } from '../utils/exportUtils';
import { ConfirmModal } from '../components/ConfirmModal';
import { KostumisasiKomponenModal } from '../components/KostumisasiKomponenModal';
import { ClosingBulanModal } from '../components/ClosingBulanModal';
import { KostumisasiIuranView } from '../components/KostumisasiIuranView';
import { CashFlowTrendChart } from '../components/CashFlowTrendChart';
import {
  Coins,
  Receipt,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Download,
  Printer,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Wallet,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Shield,
  CheckSquare,
  XCircle,
  Users,
  Info,
  Lock,
  Calendar,
  Sliders,
  Settings2,
  Phone,
  Archive,
} from 'lucide-react';

interface BendaharaModuleProps {
  activeTab: string;
}

export const BendaharaModule: React.FC<BendaharaModuleProps> = ({ activeTab }) => {
  const {
    tagihanList,
    dendaRondaList,
    bayarTagihanWarga,
    alokasikanDanaTitipan,
    pengeluaranList,
    addPengeluaranKas,
    updatePengeluaranKas,
    deletePengeluaranKas,
    syncAllDendaToTagihan,
    pemasukanList,
    addPemasukanKas,
    hutangList,
    addHutangRT,
    bayarCicilanHutang,
    piutangLainnyaList,
    addPiutangLainnya,
    bayarCicilanPiutangLainnya,
    alokasikanDepositKombinasi,
    sendWhatsAppDirect,
    settings,
    wargaList,
    activePeriode,
    updateKomponenIuranWarga,
    closingBulanKas,
    arsipLaporanBulanan,
    deleteArsipLaporanBulanan,
  } = useApp();

  // Sub-tab under Tab 1: Tagihan vs Kostumisasi 5 Komponen vs Dana Titipan vs Rekap Denda
  const [tagihanSubTab, setTagihanSubTab] = useState<'tagihan' | 'kostumisasi' | 'titipan' | 'rekap_denda'>('tagihan');

  // Kostumisasi Komponen states
  const [editingKomponenWarga, setEditingKomponenWarga] = useState<Warga | null>(null);
  const [komponenFeedback, setKomponenFeedback] = useState<string | null>(null);

  // Closing Bulan Modal state
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);

  // Dana Titipan search & feedback state
  const [titipanSearch, setTitipanSearch] = useState('');
  const [titipanFeedback, setTitipanFeedback] = useState<string | null>(null);
  const [splitModalTagihan, setSplitModalTagihan] = useState<TagihanWarga | null>(null);
  const [splitDonasiNominal, setSplitDonasiNominal] = useState<number>(0);

  // Laporan Tab states (Bulanan / Tahunan & Rekap / Per Individu / Arsip Bulan Lalu)
  const [reportType, setReportType] = useState<'rekap' | 'individu' | 'arsip'>('rekap');
  const [selectedIndividuWargaId, setSelectedIndividuWargaId] = useState<number>(1);
  const [searchIndividu, setSearchIndividu] = useState('');
  const [selectedArsipPeriode, setSelectedArsipPeriode] = useState<string>('CURRENT');
  const [selectedArsipDetail, setSelectedArsipDetail] = useState<any | null>(null);

  // Tagihan search & filter
  const [tagihanSearch, setTagihanSearch] = useState('');
  const [tagihanStatusFilter, setTagihanStatusFilter] = useState('ALL');
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanWarga | null>(null);

  // Rekap Denda search & filter (Bulan Berjalan - September)
  const [dendaSearch, setDendaSearch] = useState('');
  const [dendaFilterStatus, setDendaFilterStatus] = useState<'ALL' | 'DENDA' | 'BEBAS'>('ALL');

  // Payment modal state
  const [bayarNominal, setBayarNominal] = useState<number>(0);
  const [metodeBayar, setMetodeBayar] = useState<'Transfer' | 'Tunai / Jimpitan'>('Transfer');
  const [kelebihanOption, setKelebihanOption] = useState<'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali'>('pembayaran_tagihan');
  const [sendingSlipId, setSendingSlipId] = useState<string | null>(null);
  const [slipSendMsg, setSlipSendMsg] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  // Pengeluaran modal state & edit state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PengeluaranKas | null>(null);
  const [expenseTanggal, setExpenseTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [selectedKomponen, setSelectedKomponen] = useState<PengeluaranKas['komponen']>('Dana Apresiasi RT');
  const [expenseNominal, setExpenseNominal] = useState<number>(0);
  const [expensePenerimaOrPekerjaan, setExpensePenerimaOrPekerjaan] = useState('');
  const [expenseKeterangan, setExpenseKeterangan] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Confirmation Modal State
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
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Pemasukan modal state
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeKategori, setIncomeKategori] = useState('Donasi Kas RT');
  const [incomeSumber, setIncomeSumber] = useState('');
  const [incomeNominal, setIncomeNominal] = useState<number>(0);
  const [incomeKet, setIncomeKet] = useState('');

  // Hutang RT states & modal
  const [selectedHutang, setSelectedHutang] = useState<HutangRT | null>(null);
  const [cicilanNominal, setCicilanNominal] = useState<number>(0);
  const [showAddHutangModal, setShowAddHutangModal] = useState(false);
  const [newHutangKreditur, setNewHutangKreditur] = useState('');
  const [newHutangDeskripsi, setNewHutangDeskripsi] = useState('');
  const [newHutangTotal, setNewHutangTotal] = useState<number>(0);
  const [newHutangJatuhTempo, setNewHutangJatuhTempo] = useState('');

  // Piutang Warga states & modal
  const [piutangSubTab, setPiutangSubTab] = useState<'tagihan' | 'talangan'>('tagihan');
  const [piutangTagihanFilter, setPiutangTagihanFilter] = useState<'ALL' | 'BULAN_LALU' | 'BERJALAN'>('ALL');
  const [showAddPiutangModal, setShowAddPiutangModal] = useState(false);
  const [newPiutangNama, setNewPiutangNama] = useState('');
  const [newPiutangBlok, setNewPiutangBlok] = useState('');
  const [newPiutangJenis, setNewPiutangJenis] = useState<'Dana Talangan' | 'Pinjaman Darurat' | 'Penundaan Kewajiban Khusus'>('Dana Talangan');
  const [newPiutangDeskripsi, setNewPiutangDeskripsi] = useState('');
  const [newPiutangTotal, setNewPiutangTotal] = useState<number>(0);
  const [newPiutangJatuhTempo, setNewPiutangJatuhTempo] = useState('');
  const [selectedPiutang, setSelectedPiutang] = useState<PiutangWargaLainnya | null>(null);
  const [cicilanPiutangNominal, setCicilanPiutangNominal] = useState<number>(0);

  // Dana Titipan Warga allocation helper
  const [danaTitipanInputMap, setDanaTitipanInputMap] = useState<Record<string, number>>({});

  // Report period
  const [reportPeriod, setReportPeriod] = useState<'Bulanan' | 'Tahunan'>('Bulanan');

  // Calculations for Book of Cash (Buku Kas RT)
  const saldoAwalKas = settings.saldoAwalKas || 0;
  const totalPemasukan = (pemasukanList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const totalPengeluaran = (pengeluaranList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const pemasukanBersih = totalPemasukan - totalPengeluaran;
  const saldoAkhirKas = saldoAwalKas + pemasukanBersih;

  // Keuangan Status Bulan Sebelumnya & Berjalan
  // Kekurangan (-) bayar dari bulan sebelumnya menjadi Piutang Warga (Debit / Hak Kas RT)
  const totalPiutangBulanLalu = (tagihanList || []).reduce((acc, curr) => acc + (curr.piutangBulanLalu || 0), 0);
  const countWargaPiutangLalu = (tagihanList || []).filter((t) => (t.piutangBulanLalu || 0) > 0).length;

  const totalTagihanBerjalanBelumBayar = (tagihanList || [])
    .filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar')
    .reduce((acc, curr) => acc + Math.max(0, (curr.totalKewajiban || 0) - (curr.jumlahDibayar || 0)), 0);

  const totalHakKasRT = (tagihanList || []).reduce((acc, curr) => {
    const sisa = (curr.totalKewajiban || 0) - (curr.jumlahDibayar || 0);
    return acc + (sisa > 0 ? sisa : 0);
  }, 0);

  // Dana Titipan Warga lists & totals
  // Kelebihan (+) bayar dari bulan sebelumnya merupakan deposit yang angkanya sudah dikurangi tagihan bulan ini
  const wargaWithTitipan = (tagihanList || []).filter((t) => {
    const hasTitipan = (t.kelebihanBayar || 0) > 0 || (t.titipanDigunakanUntukTagihan || 0) > 0;
    const matchSearch =
      (t.nama || '').toLowerCase().includes(titipanSearch.toLowerCase()) ||
      (t.blokNo || '').toLowerCase().includes(titipanSearch.toLowerCase());
    return hasTitipan && matchSearch;
  });
  const totalDanaTitipanTersimpan = (tagihanList || []).reduce((acc, curr) => acc + (curr.kelebihanBayar || 0), 0);
  const totalTitipanBulanLalu = (tagihanList || []).reduce((acc, curr) => acc + (curr.titipanBulanLalu || 0), 0);
  const totalTitipanDigunakanBulanIni = (tagihanList || []).reduce((acc, curr) => acc + (curr.titipanDigunakanUntukTagihan || 0), 0);
  const countWargaTitipanAktif = (tagihanList || []).filter((t) => (t.kelebihanBayar || 0) > 0).length;

  // Filtered Tagihan
  const filteredTagihan = tagihanList.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(tagihanSearch.toLowerCase()) ||
      t.blokNo.toLowerCase().includes(tagihanSearch.toLowerCase());
    const matchStatus =
      tagihanStatusFilter === 'ALL' ||
      (tagihanStatusFilter === 'Lunas' && (t.statusBayar === 'Lunas' || t.statusBayar === 'Lebih Bayar')) ||
      (tagihanStatusFilter === 'Belum' && t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar') ||
      (tagihanStatusFilter === 'PiutangLalu' && t.piutangBulanLalu > 0) ||
      (tagihanStatusFilter === 'Deposit' && t.kelebihanBayar > 0);
    return matchSearch && matchStatus;
  });

  // Calculations & Filtered Rekap Denda Ronda (Bulan Berjalan - September)
  const filteredDendaRonda = dendaRondaList.filter((d) => {
    const matchSearch =
      d.nama.toLowerCase().includes(dendaSearch.toLowerCase()) ||
      `${d.blok}-${d.noRumah}`.toLowerCase().includes(dendaSearch.toLowerCase());
    const matchStatus =
      dendaFilterStatus === 'ALL'
        ? true
        : dendaFilterStatus === 'DENDA'
        ? d.dendaTotal > 0
        : d.jumlahAlpa === 0;
    return matchSearch && matchStatus;
  });

  const totalDendaBerjalanSeptember = dendaRondaList.reduce((acc, curr) => acc + curr.dendaTotal, 0);
  const wargaKenaDendaCount = dendaRondaList.filter((d) => d.dendaTotal > 0).length;
  const totalAlpaCount = dendaRondaList.reduce((acc, curr) => acc + curr.jumlahAlpa, 0);
  const totalWargaRonda = dendaRondaList.length;

  // Handlers for Kostumisasi 5 Komponen
  const handleApplyQuickPreset = (
    wargaId: number,
    presetType: 'standar' | 'lansia' | 'luarkota' | 'bebas'
  ) => {
    let komp = { dansosRT: 19000, dansosRW: 8000, pembangunan: 5000, snackRapat: 3000, jimpitan: 15000 };
    if (presetType === 'lansia') {
      komp = { dansosRT: 19000, dansosRW: 8000, pembangunan: 0, snackRapat: 3000, jimpitan: 0 };
    } else if (presetType === 'luarkota') {
      komp = { dansosRT: 19000, dansosRW: 8000, pembangunan: 5000, snackRapat: 0, jimpitan: 0 };
    } else if (presetType === 'bebas') {
      komp = { dansosRT: 0, dansosRW: 0, pembangunan: 0, snackRapat: 0, jimpitan: 0 };
    }
    updateKomponenIuranWarga(wargaId, komp);
    const w = wargaList.find((item) => item.id === wargaId);
    const total = komp.dansosRT + komp.dansosRW + komp.pembangunan + komp.snackRapat + komp.jimpitan;
    setKomponenFeedback(
      `Komponen iuran untuk ${w?.namaPenghuni !== '-' ? w?.namaPenghuni : w?.namaPemilik} berhasil diubah ke preset ${presetType.toUpperCase()} (${formatRupiah(total)}/bln).`
    );
    setTimeout(() => setKomponenFeedback(null), 4000);
  };

  const handleSaveKomponen = (
    wargaId: number,
    komp: {
      dansosRT: number;
      dansosRW: number;
      pembangunan: number;
      snackRapat: number;
      jimpitan: number;
    }
  ) => {
    updateKomponenIuranWarga(wargaId, komp);
    const w = wargaList.find((item) => item.id === wargaId);
    const total = komp.dansosRT + komp.dansosRW + komp.pembangunan + komp.snackRapat + komp.jimpitan;
    setKomponenFeedback(
      `Komponen iuran untuk ${w?.namaPenghuni !== '-' ? w?.namaPenghuni : w?.namaPemilik} berhasil diperbarui menjadi ${formatRupiah(total)}/bln.`
    );
    setTimeout(() => setKomponenFeedback(null), 4000);
  };

  // Handlers for Tagihan
  const handleStartBayar = (tag: TagihanWarga) => {
    setSelectedTagihan(tag);
    const sisa = Math.max(0, tag.totalKewajiban - tag.jumlahDibayar);
    setBayarNominal(sisa);
  };

  const handleConfirmBayar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagihan || bayarNominal <= 0) return;

    bayarTagihanWarga(
      selectedTagihan.id,
      Number(bayarNominal),
      metodeBayar,
      kelebihanOption
    );

    setSelectedTagihan(null);
  };

  const handleSendSlipWA = async (tag: TagihanWarga) => {
    setSendingSlipId(tag.id);
    setSlipSendMsg(null);

    const message = `*SLIP TAGIHAN IURAN RT.03 RW.14 PERUM BPTW*\nPeriode: *${tag.periode}*\n----------------------------------------\nNama: *${tag.nama}* (Kavling ${tag.blokNo})\n\n*Rincian Tagihan:*\n- Dansos RT: ${formatRupiah(tag.dansosRT)}\n- Dansos RW: ${formatRupiah(tag.dansosRW)}\n- Pembangunan: ${formatRupiah(tag.pembangunan)}\n- Snack Rapat: ${formatRupiah(tag.snack)}\n- Jimpitan: ${formatRupiah(tag.jimpitan)}\n*Total Iuran Rutin: ${formatRupiah(tag.totalIuran)}*\n\n${tag.dendaRonda > 0 ? `• Denda Ronda (Bulan Sebelumnya): ${formatRupiah(tag.dendaRonda)}\n` : '• Denda Ronda (Bulan Sebelumnya / Agt): Rp 0\n'}${tag.dendaKerjaBakti > 0 ? `• Denda Kerja Bakti: ${formatRupiah(tag.dendaKerjaBakti)}\n` : ''}${tag.piutangBulanLalu > 0 ? `• Piutang Bulan Lalu: ${formatRupiah(tag.piutangBulanLalu)}\n` : ''}${tag.titipanDigunakanUntukTagihan > 0 ? `• Potongan Saldo Deposit Bulan Lalu: -${formatRupiah(tag.titipanDigunakanUntukTagihan)}\n` : ''}----------------------------------------\n*TOTAL KEWAJIBAN: ${formatRupiah(tag.totalKewajiban)}*\nStatus Bayar: *${tag.statusBayar.toUpperCase()}*\n(Dibayar: ${formatRupiah(tag.jumlahDibayar)})\n${tag.kelebihanBayar > 0 ? `• Sisa Saldo Deposit Warga: ${formatRupiah(tag.kelebihanBayar)} (Peruntukan: ${tag.alokasiKelebihan === 'donasi_kas' ? 'Donasi Kas RT' : 'Pembayaran Tagihan'})\n` : ''}\n${tag.dendaRondaBulanBerjalan && tag.dendaRondaBulanBerjalan > 0 ? `_Catatan: Akumulasi denda ronda berjalan September (${formatRupiah(tag.dendaRondaBulanBerjalan)}) akan ditagihkan pada siklus bulan berikutnya (Oktober)._\n\n` : ''}_Silakan transfer ke Rekening RT atau titipkan ke pengurus saat jimpitan._\nTerima kasih atas partisipasi aktif warga RT.03!`;

    const matchedWarga = wargaList.find((w) => w.id === tag.wargaId);
    const rawTarget =
      tag.kontakHp ||
      matchedWarga?.kontakHp ||
      matchedWarga?.hpPenghuni ||
      matchedWarga?.hpPemilik ||
      settings.targetGroupWa;
    const targetPhone = (rawTarget || '').trim();

    try {
      const res = await sendWhatsAppDirect(targetPhone, message);
      setSlipSendMsg({
        id: tag.id,
        msg: res.message || (res.status ? `Slip berhasil dikirim via WA Gateway ke ${targetPhone}!` : 'Gagal mengirim slip'),
        success: res.status,
      });
    } catch (err: any) {
      setSlipSendMsg({ id: tag.id, msg: err.message || 'Error pengiriman WA', success: false });
    } finally {
      setSendingSlipId(null);
    }
  };

  // Handlers for Pengeluaran
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setSelectedKomponen('Dana Apresiasi RT');
    setExpenseNominal(0);
    setExpensePenerimaOrPekerjaan('');
    setExpenseKeterangan('');
    setExpenseTanggal(new Date().toISOString().slice(0, 10));
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: PengeluaranKas) => {
    setEditingExpense(exp);
    setSelectedKomponen(exp.komponen);
    setExpenseNominal(exp.nominal);
    setExpensePenerimaOrPekerjaan(exp.namaPenerimaOrPekerjaan || '');
    setExpenseKeterangan(exp.keterangan || '');
    setExpenseTanggal(exp.tanggal || new Date().toISOString().slice(0, 10));
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = (exp: PengeluaranKas) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Hapus Catatan Pengeluaran Kas',
      icon: 'danger',
      confirmVariant: 'danger',
      confirmLabel: 'Ya, Hapus Pengeluaran',
      cancelLabel: 'Batal',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin menghapus catatan pengeluaran kas berikut?
          </p>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Komponen:</span>
              <strong className="text-white">{exp.komponen}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nominal:</span>
              <strong className="text-rose-400 font-mono">-{formatRupiah(exp.nominal)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tanggal:</span>
              <span className="text-slate-300">{exp.tanggal}</span>
            </div>
            {exp.namaPenerimaOrPekerjaan && (
              <div className="flex justify-between">
                <span className="text-slate-400">Penerima / Pekerjaan:</span>
                <span className="text-amber-300">{exp.namaPenerimaOrPekerjaan}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            *Saldo kas bersih akan dihitung ulang secara otomatis setelah transaksi ini dihapus.
          </p>
        </div>
      ),
      onConfirm: () => {
        deletePengeluaranKas(exp.id);
        closeConfirmModal();
      },
    });
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseNominal <= 0) return;

    if (editingExpense) {
      updatePengeluaranKas(editingExpense.id, {
        tanggal: expenseTanggal || new Date().toISOString().slice(0, 10),
        komponen: selectedKomponen,
        nominal: Number(expenseNominal),
        namaPenerimaOrPekerjaan: expensePenerimaOrPekerjaan,
        keterangan: expenseKeterangan,
      });
    } else {
      addPengeluaranKas({
        tanggal: expenseTanggal || new Date().toISOString().slice(0, 10),
        komponen: selectedKomponen,
        nominal: Number(expenseNominal),
        namaPenerimaOrPekerjaan: expensePenerimaOrPekerjaan,
        keterangan: expenseKeterangan,
      });
    }

    setEditingExpense(null);
    setExpenseNominal(0);
    setExpensePenerimaOrPekerjaan('');
    setExpenseKeterangan('');
    setShowExpenseModal(false);
  };

  const handleSyncDenda = () => {
    syncAllDendaToTagihan();
    setSyncFeedback('Data denda ronda & kerja bakti berhasil disinkronkan ke tagihan seluruh warga!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Handlers for Pemasukan
  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeNominal <= 0) return;

    addPemasukanKas({
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: incomeKategori,
      namaSumber: incomeSumber || 'Warga RT.03',
      nominal: Number(incomeNominal),
      keterangan: incomeKet,
    });

    setIncomeNominal(0);
    setIncomeSumber('');
    setIncomeKet('');
    setShowIncomeModal(false);
  };

  // Handlers for Hutang
  const handleSaveHutang = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHutangTotal <= 0 || !newHutangKreditur) return;

    addHutangRT({
      kreditur: newHutangKreditur,
      deskripsi: newHutangDeskripsi || 'Material tempo / operasional RT',
      totalHutang: Number(newHutangTotal),
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: newHutangJatuhTempo || 'Akhir Bulan Berjalan',
    });

    setNewHutangKreditur('');
    setNewHutangDeskripsi('');
    setNewHutangTotal(0);
    setNewHutangJatuhTempo('');
    setShowAddHutangModal(false);
  };

  const handleBayarCicilan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHutang || cicilanNominal <= 0) return;

    bayarCicilanHutang(selectedHutang.id, Number(cicilanNominal));
    setSelectedHutang(null);
    setCicilanNominal(0);
  };

  // Handlers for Piutang Warga Lainnya (Talangan / Darurat)
  const handleSavePiutang = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPiutangTotal <= 0 || !newPiutangNama) return;

    addPiutangLainnya({
      namaWarga: newPiutangNama,
      blokNo: newPiutangBlok,
      jenis: newPiutangJenis,
      deskripsi: newPiutangDeskripsi || 'Dana talangan / pinjaman darurat warga',
      totalPiutang: Number(newPiutangTotal),
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: newPiutangJatuhTempo || 'Tempo Kesepakatan',
    });

    setNewPiutangNama('');
    setNewPiutangBlok('');
    setNewPiutangDeskripsi('');
    setNewPiutangTotal(0);
    setNewPiutangJatuhTempo('');
    setShowAddPiutangModal(false);
  };

  const handleBayarCicilanPiutang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiutang || cicilanPiutangNominal <= 0) return;

    bayarCicilanPiutangLainnya(selectedPiutang.id, Number(cicilanPiutangNominal));
    setSelectedPiutang(null);
    setCicilanPiutangNominal(0);
  };

  // Handler for Deposit Allocation by Bendahara
  const handleAlokasiDanaTitipanBendahara = (
    tagihanId: string,
    alokasi: 'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali',
    wargaNama: string,
    saldoMax: number
  ) => {
    const nominal =
      danaTitipanInputMap[tagihanId] !== undefined ? danaTitipanInputMap[tagihanId] : saldoMax;
    if (nominal <= 0 || nominal > saldoMax) {
      alert(`Nominal alokasi harus antara Rp 1 s/d ${formatRupiah(saldoMax)}`);
      return;
    }

    alokasikanDanaTitipan(tagihanId, alokasi, nominal);

    const opsiLabel =
      alokasi === 'donasi_kas'
        ? 'Donasi Kas RT'
        : 'Membayar Tagihan di Bulan yang Akan Datang';

    setTitipanFeedback(`Berhasil mengalokasikan ${formatRupiah(nominal)} saldo deposit milik ${wargaNama} untuk ${opsiLabel}.`);
    setTimeout(() => setTitipanFeedback(null), 5000);
  };

  // Handler for Split Combination (Donasi & Tagihan Bulan yang Akan Datang)
  const handleAlokasiKombinasiBendahara = (
    tagihanId: string,
    donasiNominal: number,
    wargaNama: string,
    totalDeposit: number
  ) => {
    const donasi = Math.max(0, Math.min(donasiNominal, totalDeposit));
    const tagihanMendatang = Math.max(0, totalDeposit - donasi);

    alokasikanDepositKombinasi(tagihanId, donasi, tagihanMendatang);

    setTitipanFeedback(
      `Berhasil mengalokasikan saldo deposit ${wargaNama}: ${formatRupiah(donasi)} untuk Donasi Kas RT dan ${formatRupiah(tagihanMendatang)} untuk Membayar Tagihan di Bulan yang Akan Datang.`
    );
    setTimeout(() => setTitipanFeedback(null), 5000);
    setSplitModalTagihan(null);
  };

  // Export handlers
  const handleExportTagihanCSV = () => {
    const header = [
      'No',
      'Nama Warga',
      'Blok/No',
      'Dansos RT',
      'Dansos RW',
      'Pembangunan',
      'Snack',
      'Jimpitan',
      'Total Iuran',
      'Denda Ronda',
      'Denda Kerja Bakti',
      'Piutang Bulan Lalu',
      'Potongan Deposit Bulan Lalu',
      'Total Kewajiban',
      'Jumlah Dibayar',
      'Status Bayar',
      'Sisa Saldo Deposit',
      'Peruntukan Deposit',
    ];
    const rows = tagihanList.map((t, i) => [
      i + 1,
      t.nama,
      t.blokNo,
      t.dansosRT,
      t.dansosRW,
      t.pembangunan,
      t.snack,
      t.jimpitan,
      t.totalIuran,
      t.dendaRonda,
      t.dendaKerjaBakti,
      t.piutangBulanLalu,
      t.titipanDigunakanUntukTagihan,
      t.totalKewajiban,
      t.jumlahDibayar,
      t.statusBayar,
      t.kelebihanBayar,
      t.alokasiKelebihan || '-',
    ]);
    exportToCSV(`Lembar_Tagihan_Warga_RT03_${reportPeriod}`, [header, ...rows]);
  };

  const handleExportDendaCSV = () => {
    const header = [
      'No',
      'Nama Warga',
      'Kavling',
      'Status Wajib',
      'Kategori',
      'Minggu 1 (1-7 Sept)',
      'Minggu 2 (8-14 Sept)',
      'Minggu 3 (15-21 Sept)',
      'Minggu 4 (22-30 Sept)',
      'Total Alpa',
      'Denda Berjalan Sept (Rp)',
      'Keterangan Tarif SOP',
      'Status Push Keamanan',
    ];
    const rows = dendaRondaList.map((d, idx) => [
      idx + 1,
      d.nama,
      `${d.blok}-${d.noRumah}`,
      d.statusWajib,
      d.kategori,
      d.minggu1 ? 'Hadir' : 'Alpa',
      d.minggu2 ? 'Hadir' : 'Alpa',
      d.minggu3 ? 'Hadir' : 'Alpa',
      d.minggu4 ? 'Hadir' : 'Alpa',
      d.jumlahAlpa,
      d.dendaTotal,
      d.catatan || '-',
      d.statusPushed ? 'Sudah Dipush' : 'Belum Dipush',
    ]);
    exportToCSV(`Rekap_Denda_Ronda_Bulan_Berjalan_September_2026`, [
      ['REKAPITULASI DENDA RONDA BULAN BERJALAN (SEPTEMBER 2026) - RT.03 RW.14'],
      ['*Catatan: Denda berjalan ini ditagihkan pada siklus bulan berikutnya (Oktober 2026).'],
      [''],
      header,
      ...rows,
    ]);
  };

  const handleExportKasCSV = (customArsip?: any) => {
    const targetArsip =
      customArsip ||
      (selectedArsipPeriode !== 'CURRENT'
        ? (arsipLaporanBulanan || []).find((a) => a.id === selectedArsipPeriode)
        : null);

    const pemList = targetArsip ? targetArsip.pemasukanSnapshot || [] : pemasukanList;
    const pengList = targetArsip ? targetArsip.pengeluaranSnapshot || [] : pengeluaranList;
    const sAwal = targetArsip ? targetArsip.saldoAwalKas : saldoAwalKas;
    const totPem = targetArsip ? targetArsip.totalPemasukan : totalPemasukan;
    const totPeng = targetArsip ? targetArsip.totalPengeluaran : totalPengeluaran;
    const sAkhir = targetArsip ? targetArsip.saldoAkhirKas : saldoAkhirKas;
    const periodeLabel = targetArsip ? targetArsip.periode : activePeriode;

    const headerPemasukan = ['Tanggal', 'Kategori', 'Sumber', 'Nominal', 'Keterangan'];
    const rowsPemasukan = pemList.map((p: any) => [p.tanggal, p.kategori, p.namaSumber, p.nominal, p.keterangan]);

    const headerPengeluaran = ['Tanggal', 'Komponen SOP RT', 'Penerima / Pekerjaan', 'Nominal', 'Keterangan'];
    const rowsPengeluaran = pengList.map((p: any) => [
      p.tanggal,
      p.komponen,
      p.namaPenerimaOrPekerjaan || '-',
      p.nominal,
      p.keterangan || '-',
    ]);

    exportToCSV(`Buku_Kas_RT03_${periodeLabel.replace(/\s+/g, '_')}`, [
      [`LAPORAN PEMASUKAN KAS RT.03 - PERIODE ${periodeLabel}`],
      headerPemasukan,
      ...rowsPemasukan,
      [''],
      [`LAPORAN PENGELUARAN KAS RT.03 (11 KOMPONEN SOP) - PERIODE ${periodeLabel}`],
      headerPengeluaran,
      ...rowsPengeluaran,
      [''],
      ['RINGKASAN NERACA KAS'],
      ['Saldo Awal Kas RT', sAwal],
      ['Total Penerimaan Kas', totPem],
      ['Total Pengeluaran Kas', totPeng],
      ['Surplus / Defisit Kas Bulan Ini', totPem - totPeng],
      ['Saldo Akhir Kas Riil', sAkhir],
    ]);
  };

  const handleExportTitipanCSV = () => {
    const header = [
      'No',
      'Nama Warga',
      'Kavling',
      'Saldo Deposit Bulan Lalu (Rp)',
      'Digunakan Tagihan Bulan Ini (Rp)',
      'Sisa Saldo Deposit Aktif (Rp)',
      'Peruntukan Deposit',
      'Periode',
    ];
    const rows = tagihanList
      .filter((t) => t.kelebihanBayar > 0 || t.titipanDigunakanUntukTagihan > 0)
      .map((t, idx) => [
        idx + 1,
        t.nama,
        t.blokNo,
        t.titipanBulanLalu,
        t.titipanDigunakanUntukTagihan,
        t.kelebihanBayar,
        t.alokasiKelebihan === 'donasi_kas'
          ? 'Donasi Kas RT'
          : 'Pembayaran Tagihan (Bulan Ini & Seterusnya)',
        t.periode,
      ]);

    exportToCSV(`Rekap_Saldo_Deposit_Warga_RT03_${reportPeriod}`, [
      ['REKAPITULASI SISTEM DEPOSIT WARGA DARI BULAN LALU RT.03 RW.14 PERUM BPTW'],
      ['*Peruntukan Deposit: Donasi Kas RT atau Pembayaran Tagihan Bulan Ini dan Seterusnya.'],
      [''],
      header,
      ...rows,
    ]);
  };

  const handleExportIndividuCSV = (targetTag: TagihanWarga) => {
    const header = ['Komponen', 'Keterangan Transaksi', 'Nominal (Rp)'];
    const rows = [
      ['Nama Warga', targetTag.nama, ''],
      ['Kavling', targetTag.blokNo, ''],
      ['Periode', targetTag.periode, ''],
      ['Status Bayar', targetTag.statusBayar, ''],
      ['------------------', '------------------', '------------------'],
      ['Dansos RT', 'Iuran Rutin RT', targetTag.dansosRT],
      ['Dansos RW', 'Iuran Rutin RW', targetTag.dansosRW],
      ['Pembangunan', 'Sarana Prasarana Lingkungan', targetTag.pembangunan],
      ['Snack Rapat', 'Konsumsi Rapat Warga', targetTag.snack],
      ['Jimpitan', 'Koin Jimpitan Gotong Royong', targetTag.jimpitan],
      ['Subtotal Iuran Rutin', '5 Komponen Rutin', targetTag.totalIuran],
      ['Denda Ronda (Lalu)', 'Denda Siklus Sebelumnya (Agustus)', targetTag.dendaRonda],
      ['Denda Kerja Bakti', 'Alpa Gotong Royong', targetTag.dendaKerjaBakti],
      ['Tunggakan Lalu', 'Piutang Bulan Sebelumnya', targetTag.piutangBulanLalu],
      ['Potongan Deposit Bulan Lalu', 'Pembayaran Tagihan dari Saldo Deposit', -targetTag.titipanDigunakanUntukTagihan],
      ['TOTAL KEWAJIBAN BULAN INI', 'Tagihan Resmi Bersih', targetTag.totalKewajiban],
      ['Jumlah Dibayar', 'Realisasi Kas Masuk', targetTag.jumlahDibayar],
      [
        'Status Sisa Kewajiban (Piutang)',
        targetTag.statusBayar === 'Lunas' ? 'Nihil / Lunas' : 'Tercatat Piutang Warga',
        targetTag.statusBayar === 'Lunas' ? 0 : Math.max(0, targetTag.totalKewajiban - targetTag.jumlahDibayar),
      ],
      ['Sisa Saldo Deposit Tersimpan', 'Peruntukan Tagihan Seterusnya / Donasi', targetTag.kelebihanBayar],
      ['Peruntukan Deposit', targetTag.alokasiKelebihan === 'donasi_kas' ? 'Donasi Kas RT' : (targetTag.kelebihanBayar > 0 ? 'Pembayaran Tagihan' : '-'), ''],
    ];

    exportToCSV(`Kartu_Keuangan_Individu_${targetTag.nama.replace(/\s+/g, '_')}_${reportPeriod}`, [
      [`KARTU IURAN & BUKTI KEUANGAN INDIVIDU WARGA RT.03 RW.14 PERUM BPTW`],
      [`Periode: ${reportPeriod === 'Bulanan' ? targetTag.periode : 'Tahun Anggaran 2026'}`],
      [''],
      header,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 mb-1 flex-wrap">
            <Coins className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Modul Bendahara RT.03</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-700" />
              Periode Aktif: {activePeriode}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Transparansi Keuangan & Iuran Lingkungan</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            RT.03 RW.14 Perum BPTW • Iuran Rutin, Denda, 11 Komponen SOP, Sistem Deposit & Buku Kas Berbasis Akuntansi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowClosingModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-sm border border-amber-500/40 flex items-center gap-2 transition active:scale-95"
            title="Tutup buku kas periode ini dan buka periode baru dengan pemindahan saldo berjalan otomatis"
          >
            <Lock className="w-3.5 h-3.5 text-amber-200" />
            <span>Closing Bulan & Periode Baru</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LEMBAR TAGIHAN WARGA, DEPOSIT WARGA & REKAP DENDA BULAN BERJALAN */}
      {activeTab === 'tagihan' && (
        <div className="space-y-3">
          {/* Ringkasan Finansial Tagihan, Piutang Hak RT & Deposit Warga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Piutang Warga (Debit / Hak Kas RT) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between text-rose-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span>Piutang Warga (Hak Kas RT)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30 font-bold">
                  Debit RT
                </span>
              </div>
              <div className="font-mono text-lg font-black text-rose-300">
                {formatRupiah(totalHakKasRT)}
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                <p>
                  • Kekurangan (-) Bulan Lalu: <strong className="text-rose-400 font-mono">{formatRupiah(totalPiutangBulanLalu)}</strong> ({countWargaPiutangLalu} Warga)
                </p>
                <p>
                  • Tagihan Berjalan Belum Lunas: <strong className="text-slate-300 font-mono">{formatRupiah(totalTagihanBerjalanBelumBayar)}</strong>
                </p>
              </div>
            </div>

            {/* Saldo Deposit Warga (+) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between text-teal-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-teal-400" />
                  <span>Saldo Deposit Warga (+)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-200 border border-teal-500/30 font-bold">
                  {countWargaTitipanAktif} Warga
                </span>
              </div>
              <div className="font-mono text-lg font-black text-teal-300">
                {formatRupiah(totalDanaTitipanTersimpan)}
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                <p>• Kelebihan (+) bayar bulan lalu setelah potong tagihan</p>
                <p>
                  • Pilihan: <strong className="text-teal-300">Donasi Kas RT</strong> & <strong className="text-teal-300">Tagihan Bulan Datang</strong>
                </p>
              </div>
            </div>

            {/* Kas Masuk Terbayar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kas Masuk Terbayar</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                  {tagihanList.filter((t) => t.statusBayar === 'Lunas' || t.statusBayar === 'Lebih Bayar').length} Lunas
                </span>
              </div>
              <div className="font-mono text-lg font-black text-emerald-300">
                {formatRupiah(tagihanList.reduce((acc, curr) => acc + curr.jumlahDibayar, 0))}
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                <p>• Total Penerimaan Iuran & Denda Terbayar</p>
                <p>
                  • Belum Lunas: <strong className="text-rose-400 font-mono">{tagihanList.filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar').length} Warga</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation Toggle (4 Sub-Tabs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTagihanSubTab('tagihan')}
              className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                tagihanSubTab === 'tagihan'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Lembar Tagihan</span>
            </button>
            <button
              type="button"
              onClick={() => setTagihanSubTab('kostumisasi')}
              className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                tagihanSubTab === 'kostumisasi'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Kostumisasi 5 Komponen</span>
            </button>
            <button
              type="button"
              onClick={() => setTagihanSubTab('titipan')}
              className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                tagihanSubTab === 'titipan'
                  ? 'bg-teal-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Deposit Warga</span>
              {totalDanaTitipanTersimpan > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-200 border border-teal-400/40 text-[10px] font-mono">
                  {formatRupiah(totalDanaTitipanTersimpan)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTagihanSubTab('rekap_denda')}
              className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                tagihanSubTab === 'rekap_denda'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Rekap Denda</span>
              {totalDendaBerjalanSeptember > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 border border-amber-400/40 text-[10px] font-mono">
                  {formatRupiah(totalDendaBerjalanSeptember)}
                </span>
              )}
            </button>
          </div>

          {/* SUB-VIEW A: LEMBAR TAGIHAN WARGA */}
          {tagihanSubTab === 'tagihan' && (
            <div className="space-y-3">
              {/* Info Notice: SOP Integrasi Denda Bulan Lalu */}
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>SOP Integrasi Denda pada Tagihan Bendahara</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Denda yang ditagihkan pada siklus tagihan September adalah <strong>denda bulan sebelumnya (Agustus = Rp 0 / Bebas Denda)</strong>. Angka denda ronda bulan berjalan (September) dicatat akumulatif pada tab <strong>Rekap Denda (Bulan Berjalan)</strong> dan akan ditagihkan pada siklus berikutnya (Oktober 2026).
                </p>
              </div>

              {/* Action Bar & Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">Tagihan Iuran Warga (Periode September 2026)</h3>
                    <p className="text-[10px] text-slate-400">
                      Dansos RT (19k) + RW (8k) + Pembangunan (5k) + Snack (3k) + Jimpitan (15k)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSyncDenda}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-xs flex items-center gap-1 active:scale-95 transition"
                      title="Sinkronkan denda ronda dan kerja bakti ke kartu tagihan seluruh warga"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sinkron Denda</span>
                    </button>
                    <button
                      onClick={handleExportTagihanCSV}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={openPrintDialog}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>

                {syncFeedback && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{syncFeedback}</span>
                  </div>
                )}

                {/* Filter & Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama atau blok..."
                      value={tagihanSearch}
                      onChange={(e) => setTagihanSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <select
                    value={tagihanStatusFilter}
                    onChange={(e) => setTagihanStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">Semua Status ({tagihanList.length})</option>
                    <option value="Lunas">Lunas ({tagihanList.filter((t) => t.statusBayar === 'Lunas' || t.statusBayar === 'Lebih Bayar').length})</option>
                    <option value="Belum">Belum Lunas ({tagihanList.filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar').length})</option>
                    <option value="PiutangLalu">Kekurangan (-) Bayar Bulan Lalu ({countWargaPiutangLalu})</option>
                    <option value="Deposit">Memiliki Saldo Deposit (+) ({countWargaTitipanAktif})</option>
                  </select>
                </div>
              </div>

              {/* List Tagihan Warga */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
                  <span>Menampilkan {filteredTagihan.length} dari {tagihanList.length} tagihan</span>
                  {tagihanStatusFilter === 'PiutangLalu' && (
                    <span className="text-rose-400 font-bold">Kekurangan (-) Bayar Bulan Lalu = Piutang Hak Kas RT</span>
                  )}
                  {tagihanStatusFilter === 'Deposit' && (
                    <span className="text-teal-400 font-bold">Deposit Kelebihan (+) Bayar Bulan Lalu</span>
                  )}
                </div>

                {filteredTagihan.map((tag) => {
                  const matchedWarga = wargaList.find((w) => w.id === tag.wargaId);
                  return (
                  <div
                    key={tag.id}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm">{tag.nama}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              tag.statusBayar === 'Lunas' || tag.statusBayar === 'Lebih Bayar'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {tag.statusBayar}
                          </span>
                          {matchedWarga?.statusUsiaPenghuni === 'Lansia' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              👴 Lansia
                            </span>
                          ) : matchedWarga?.statusUsiaPenghuni === 'Produktif' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                              ⚡ Produktif
                            </span>
                          ) : null}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-2 flex-wrap">
                          <span>
                            Kavling: <span className="text-slate-200 font-mono font-bold">{tag.blokNo}</span> • Periode: {tag.periode}
                          </span>
                          {(() => {
                            const phone = tag.kontakHp || matchedWarga?.kontakHp || matchedWarga?.hpPenghuni || matchedWarga?.hpPemilik;
                            if (!phone) return null;
                            return (
                              <span className="text-emerald-400 font-mono flex items-center gap-1">
                                • <Phone className="w-3 h-3 inline" /> {phone}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Kewajiban</span>
                        <span className="font-mono font-black text-white text-sm">
                          {formatRupiah(tag.totalKewajiban)}
                        </span>
                      </div>
                    </div>

                    {/* Rincian Komponen Tagihan */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-300">
                      <div>
                        Iuran Rutin: <span className="font-mono text-emerald-400">{formatRupiah(tag.totalIuran)}</span>
                      </div>
                      <div>
                        Denda Ronda Agustus (Terposting): <span className="font-mono text-amber-400">{formatRupiah(tag.dendaRonda)}</span>
                      </div>
                      <div>
                        Denda Kerja Bakti:{' '}
                        <span className="font-mono text-amber-400">{formatRupiah(tag.dendaKerjaBakti)}</span>
                      </div>
                      <div>
                        Piutang Warga (Kekurangan Lalu):{' '}
                        <span className="font-mono text-rose-400 font-bold">{formatRupiah(tag.piutangBulanLalu)}</span>
                      </div>
                      {tag.dendaRondaBulanBerjalan !== undefined && tag.dendaRondaBulanBerjalan > 0 && (
                        <div className="col-span-2 flex items-center justify-between text-[10px] text-amber-300 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/30">
                          <span>Akumulasi Denda Berjalan (Sept):</span>
                          <span className="font-mono font-bold text-amber-400">{formatRupiah(tag.dendaRondaBulanBerjalan)} (ditagihkan Okt)</span>
                        </div>
                      )}
                      {tag.titipanDigunakanUntukTagihan > 0 && (
                        <div className="col-span-2 text-teal-300 font-semibold">
                          Potongan Saldo Deposit Bulan Lalu: -{formatRupiah(tag.titipanDigunakanUntukTagihan)}
                        </div>
                      )}
                      {tag.kelebihanBayar > 0 && (
                        <div className="col-span-2 text-teal-300 font-semibold flex items-center justify-between flex-wrap gap-1 bg-teal-950/40 p-1.5 rounded-lg border border-teal-500/30">
                          <span>
                            Sisa Saldo Deposit: <strong className="font-mono text-teal-200">{formatRupiah(tag.kelebihanBayar)}</strong>{' '}
                            <span className="text-[10px] text-teal-400 font-normal">
                              ({tag.alokasiDonasiNominal && tag.alokasiTagihanMendatangNominal
                                ? `Kombinasi: Donasi ${formatRupiah(tag.alokasiDonasiNominal)} & Tagihan Datang ${formatRupiah(tag.alokasiTagihanMendatangNominal)}`
                                : tag.alokasiKelebihan === 'donasi_kas'
                                ? 'Donasi Kas RT'
                                : 'Membayar Tagihan Bulan yang Akan Datang'})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSplitModalTagihan(tag);
                              setSplitDonasiNominal(tag.alokasiDonasiNominal || Math.floor(tag.kelebihanBayar / 2));
                            }}
                            className="px-2 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold"
                          >
                            Pilihan Alokasi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Slip WA Message status if sent */}
                    {slipSendMsg && slipSendMsg.id === tag.id && (
                      <div
                        className={`p-2 rounded-lg text-xs font-semibold ${
                          slipSendMsg.success ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                        }`}
                      >
                        {slipSendMsg.msg}
                      </div>
                    )}

                    {/* Actions: Catat Pembayaran & Broadcast Slip WA */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Sudah Masuk: {formatRupiah(tag.jumlahDibayar)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const foundW = wargaList.find((w) => w.id === tag.wargaId);
                            if (foundW) {
                              setEditingKomponenWarga(foundW);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition"
                          title="Kostumisasi 5 Komponen Iuran Warga Ini"
                        >
                          <Sliders className="w-3 h-3 text-emerald-400" />
                          <span className="hidden sm:inline">Komponen</span>
                        </button>

                        <button
                          onClick={() => handleSendSlipWA(tag)}
                          disabled={sendingSlipId === tag.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1"
                          title="Kirim Slip Tagihan via WhatsApp Gateway"
                        >
                          <Send className="w-3 h-3" />
                          <span>{sendingSlipId === tag.id ? 'Mengirim...' : 'Kirim WA'}</span>
                        </button>

                        {(() => {
                          const phone = (
                            tag.kontakHp ||
                            matchedWarga?.kontakHp ||
                            matchedWarga?.hpPenghuni ||
                            matchedWarga?.hpPemilik ||
                            ''
                          ).trim();
                          if (!phone) return null;
                          const cleanPhone = phone.replace(/[^0-9]/g, '');
                          const waNumber = cleanPhone.startsWith('62')
                            ? cleanPhone
                            : cleanPhone.startsWith('08')
                            ? `62${cleanPhone.slice(1)}`
                            : cleanPhone;
                          const waText = encodeURIComponent(
                            `Halo Bpk/Ibu ${tag.nama} (Kavling ${tag.blokNo}), berikut info tagihan iuran RT.03 periode ${tag.periode}: Total Kewajiban ${formatRupiah(tag.totalKewajiban)}. Status: ${tag.statusBayar}. Mohon konfirmasi atau titipkan iuran pada pengurus. Terima kasih.`
                          );
                          return (
                            <a
                              href={`https://wa.me/${waNumber}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1 transition"
                              title={`Chat WA Langsung ke ${phone}`}
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline">Chat WA</span>
                            </a>
                          );
                        })()}

                        <button
                          onClick={() => handleStartBayar(tag)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Catat Bayar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VIEW B: KOSTUMISASI KOMPONEN IURAN MASING-MASING WARGA (5 KOMPONEN) */}
          {tagihanSubTab === 'kostumisasi' && (
            <KostumisasiIuranView
              wargaList={wargaList}
              onOpenEditModal={(w) => setEditingKomponenWarga(w)}
              onApplyQuickPreset={handleApplyQuickPreset}
              successFeedback={komponenFeedback}
            />
          )}

          {/* SUB-VIEW C: PENGELOLAAN DANA TITIPAN WARGA & SISA KELEBIHAN BAYAR */}
          {tagihanSubTab === 'titipan' && (
            <div className="space-y-3">
              {/* Header & SOP Rules */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-xs text-teal-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-100 text-sm">
                      Pengelolaan Sistem Deposit Warga RT.03
                    </h3>
                    <p className="text-[11px] text-teal-300/80">
                      SOP RT.03 RW.14 Perum BPTW • Kelebihan (+) Bayar Bulan Sebelumnya dikurangi Tagihan Bulan Ini
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-teal-500/20 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Ketentuan Baku Sistem Deposit Warga RT.03:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>
                      <strong>Kelebihan (+) Bayar dari Bulan Sebelumnya:</strong> Merupakan <strong>deposit</strong> yang angkanya sudah otomatis dikurangi tagihan bulan berjalan.
                    </li>
                    <li>
                      <strong>Pilihan Peruntukan Warga:</strong> Warga memiliki pilihan untuk <strong>Donasi Kas RT</strong> dan/atau untuk <strong>membayar tagihan di bulan yang akan datang</strong>.
                    </li>
                    <li>
                      <strong>Fleksibilitas Alokasi:</strong> Dapat dialokasikan penuh untuk salah satu opsi atau dibagi secara kombinasi (sebagian donasi sukarela, sebagian tabungan tagihan mendatang).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-teal-500/30">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Saldo Deposit Tersimpan</span>
                  <span className="text-base font-black font-mono text-teal-300">
                    {formatRupiah(totalDanaTitipanTersimpan)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Saldo deposit aktif milik warga</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Warga Pemilik Saldo Deposit</span>
                  <span className="text-base font-black font-mono text-white">
                    {countWargaTitipanAktif} Warga
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Memiliki saldo deposit berjalan</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Deposit Terpakai Bulan Ini</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatRupiah(totalTitipanDigunakanBulanIni)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Memotong tagihan September 2026</span>
                </div>
              </div>

              {/* Feedback Alert if any */}
              {titipanFeedback && (
                <div className="p-3 rounded-xl bg-teal-950/80 border border-teal-500 text-xs font-semibold text-teal-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{titipanFeedback}</span>
                </div>
              )}

              {/* Filter & Export Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={titipanSearch}
                    onChange={(e) => setTitipanSearch(e.target.value)}
                    placeholder="Cari nama warga atau kavling..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportTitipanCSV}
                  className="px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/80 text-teal-200 border border-teal-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Download CSV Deposit Warga</span>
                </button>
              </div>

              {/* Residents with Deposit List */}
              <div className="space-y-2.5">
                {wargaWithTitipan.map((t) => {
                  const inputVal = danaTitipanInputMap[t.id] ?? t.kelebihanBayar;

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-teal-500/40 transition"
                    >
                      {/* Top Info */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{t.nama}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
                              {t.blokNo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Periode {t.periode} • Status Tagihan:{' '}
                            <span
                              className={
                                t.statusBayar === 'Lunas' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                              }
                            >
                              {t.statusBayar}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Saldo Deposit Tersedia</span>
                          <span className="text-sm font-black font-mono text-teal-300">
                            {formatRupiah(t.kelebihanBayar)}
                          </span>
                        </div>
                      </div>

                      {/* Ledger History Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Deposit Awal Bulan Lalu</span>
                          <span className="text-slate-300">{formatRupiah(t.titipanBulanLalu)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Potong Tagihan Bulan Ini</span>
                          <span className="text-emerald-400">-{formatRupiah(t.titipanDigunakanUntukTagihan)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Sisa Saldo Deposit Sekarang</span>
                          <span className="text-teal-300 font-bold">{formatRupiah(t.kelebihanBayar)}</span>
                        </div>
                      </div>

                      {/* Allocation Form if Saldo > 0 */}
                      {t.kelebihanBayar > 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/20 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-teal-200">
                              Peruntukan Saldo Deposit (SOP RT.03):
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">Nominal:</span>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  value={inputVal}
                                  onChange={(e) =>
                                    setDanaTitipanInputMap({
                                      ...danaTitipanInputMap,
                                      [t.id]: Math.max(0, Math.min(t.kelebihanBayar, Number(e.target.value))),
                                    })
                                  }
                                  className="w-28 pl-7 pr-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:border-teal-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setDanaTitipanInputMap({
                                    ...danaTitipanInputMap,
                                    [t.id]: t.kelebihanBayar,
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition"
                              >
                                Max
                              </button>
                            </div>
                          </div>

                          {/* 3 Action Buttons for Peruntukan: Pembayaran Tagihan Mendatang, Donasi, & Kombinasi */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleAlokasiDanaTitipanBendahara(
                                  t.id,
                                  'pembayaran_tagihan',
                                  t.nama,
                                  t.kelebihanBayar
                                )
                              }
                              className="py-2 px-3 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
                            >
                              <Receipt className="w-4 h-4 text-teal-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">1. Tagihan Datang</span>
                                <span className="text-[10px] text-teal-300/80 font-normal">Bayar Tagihan Bulan Depan</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAlokasiDanaTitipanBendahara(t.id, 'donasi_kas', t.nama, t.kelebihanBayar)
                              }
                              className="py-2 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
                            >
                              <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">2. Donasi Kas RT</span>
                                <span className="text-[10px] text-emerald-300/80 font-normal">Sumbangan Sukarela Warga</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSplitModalTagihan(t);
                                setSplitDonasiNominal(
                                  t.alokasiDonasiNominal || Math.floor(t.kelebihanBayar / 2)
                                );
                              }}
                              className="py-2 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
                            >
                              <Wallet className="w-4 h-4 text-purple-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">3. Kombinasi</span>
                                <span className="text-[10px] text-purple-300/80 font-normal">Donasi & Tagihan Datang</span>
                              </div>
                            </button>
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />
                            <span>
                              Peruntukan Tersimpan:{' '}
                              <strong className="text-white">
                                {t.alokasiDonasiNominal && t.alokasiTagihanMendatangNominal
                                  ? `Kombinasi: Donasi Kas RT (${formatRupiah(t.alokasiDonasiNominal)}) & Tagihan Bulan Datang (${formatRupiah(t.alokasiTagihanMendatangNominal)})`
                                  : t.alokasiKelebihan === 'donasi_kas'
                                  ? 'Donasi Kas RT'
                                  : 'Membayar Tagihan di Bulan yang Akan Datang'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950/50 text-[11px] text-slate-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Seluruh saldo deposit bulan lalu telah digunakan penuh untuk melunasi tagihan bulan berjalan.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {wargaWithTitipan.length === 0 && (
                  <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">Tidak Ada Saldo Deposit Warga</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tidak ada warga yang memiliki sisa kelebihan bayar untuk kriteria pencarian ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW C: REKAP DENDA (BULAN BERJALAN - SEPTEMBER 2026) */}
          {tagihanSubTab === 'rekap_denda' && (
            <div className="space-y-3">
              {/* Header & SOP Rule Explanation */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-200 text-sm">
                      Rekap Denda Ronda Bulan Berjalan (September 2026)
                    </h3>
                    <p className="text-[11px] text-amber-300/80">
                      Dipantau oleh Bendahara & Seksi Keamanan • Terintegrasi Otomatis
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-[11px] text-slate-300 leading-relaxed space-y-1">
                  <p>
                    📌 <strong>SOP Alur Penagihan Denda:</strong> Angka denda yang tampil pada rekapitulasi ini adalah <strong>denda ronda bulan berjalan (September 2026)</strong>.
                  </p>
                  <p>
                    Denda yang dimasukkan ke tagihan iuran bulan September adalah denda bulan sebelumnya (Agustus = <strong>Rp 0 / Bebas Denda</strong>). Denda berjalan bulan September ini akan otomatis masuk ke <strong>tagihan bulan berikutnya (Oktober 2026)</strong> setelah dipush oleh Seksi Keamanan.
                  </p>
                </div>
              </div>

              {/* 4 Ringkasan Metrik Rekap Denda Bulan Berjalan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Total Denda Berjalan</span>
                  <span className="font-mono font-black text-amber-400 text-base block">
                    {formatRupiah(totalDendaBerjalanSeptember)}
                  </span>
                  <span className="text-[10px] text-slate-400">Periode September</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Warga Kena Denda</span>
                  <span className="font-mono font-bold text-rose-400 text-base block">
                    {wargaKenaDendaCount} <span className="text-xs text-slate-400 font-normal">warga</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Ada catatan alpa</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Bebas Denda (Nihil)</span>
                  <span className="font-mono font-bold text-emerald-400 text-base block">
                    {totalWargaRonda - wargaKenaDendaCount} <span className="text-xs text-slate-400 font-normal">warga</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Kehadiran lengkap</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Total Alpa Tercatat</span>
                  <span className="font-mono font-bold text-purple-400 text-base block">
                    {totalAlpaCount} <span className="text-xs text-slate-400 font-normal">kali</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Dari 4 minggu ronda</span>
                </div>
              </div>

              {/* Action Bar & Filter Rekap Denda */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Daftar Warga Wajib Ronda & Denda</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSyncDenda}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs flex items-center gap-1 active:scale-95 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sinkron Denda</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportDendaCSV}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV Denda</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama warga ronda atau blok..."
                      value={dendaSearch}
                      onChange={(e) => setDendaSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <select
                    value={dendaFilterStatus}
                    onChange={(e) => setDendaFilterStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">Semua Warga ({dendaRondaList.length})</option>
                    <option value="DENDA">Kena Denda ({wargaKenaDendaCount})</option>
                    <option value="BEBAS">Bebas Denda ({totalWargaRonda - wargaKenaDendaCount})</option>
                  </select>
                </div>
              </div>

              {/* List Warga Rekap Denda Bulan Berjalan */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 px-1 flex justify-between">
                  <span>Menampilkan {filteredDendaRonda.length} data warga ronda</span>
                  <span className="text-amber-400/90 font-medium">Bulan Berjalan: September 2026</span>
                </div>

                {filteredDendaRonda.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Tidak ditemukan data warga ronda yang sesuai dengan filter pencarian.
                  </div>
                ) : (
                  filteredDendaRonda.map((d) => (
                    <div
                      key={d.wargaId}
                      className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{d.nama}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                d.dendaTotal === 0
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {d.dendaTotal === 0 ? '✓ Bebas Denda' : `${d.jumlahAlpa}x Alpa`}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">
                            Kavling: <span className="text-slate-200 font-mono font-bold">{d.blok}-{d.noRumah}</span> • {d.kategori}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Denda Bulan Berjalan</span>
                          <span
                            className={`font-mono font-black text-sm ${
                              d.dendaTotal > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatRupiah(d.dendaTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Checklist 4 Minggu Ronda */}
                      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[10px] text-center">
                        <div
                          className={`p-1.5 rounded-lg border ${
                            d.minggu1
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="block text-[9px] text-slate-400">M1 (1-7)</span>
                          <span>{d.minggu1 ? '✓ Hadir' : '✗ Alpa'}</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border ${
                            d.minggu2
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="block text-[9px] text-slate-400">M2 (8-14)</span>
                          <span>{d.minggu2 ? '✓ Hadir' : '✗ Alpa'}</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border ${
                            d.minggu3
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="block text-[9px] text-slate-400">M3 (15-21)</span>
                          <span>{d.minggu3 ? '✓ Hadir' : '✗ Alpa'}</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border ${
                            d.minggu4
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="block text-[9px] text-slate-400">M4 (22-30)</span>
                          <span>{d.minggu4 ? '✓ Hadir' : '✗ Alpa'}</span>
                        </div>
                      </div>

                      {/* Detail SOP Tarif & Status Penagihan */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-700/60 text-[11px]">
                        <span className="text-slate-400">
                          Perhitungan: <strong className="text-slate-200">{d.catatan || 'Sesuai SOP'}</strong>
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                          Penagihan: <strong className="text-amber-300">Masuk Tagihan Okt 2026</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Payment Modal with Kelebihan Bayar Options */}
          {selectedTagihan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleConfirmBayar}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Catat Pembayaran Iuran</h3>
                    <p className="text-[11px] text-slate-400">
                      {selectedTagihan.nama} (Kavling {selectedTagihan.blokNo})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTagihan(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Kewajiban:</span>
                    <span className="font-mono font-bold text-white">
                      {formatRupiah(selectedTagihan.totalKewajiban)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sudah Dibayar:</span>
                    <span className="font-mono">{formatRupiah(selectedTagihan.jumlahDibayar)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Pembayaran (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={bayarNominal}
                    onChange={(e) => setBayarNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Metode Pembayaran:</label>
                  <select
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Transfer">Transfer Bank / QRIS</option>
                    <option value="Tunai / Jimpitan">Tunai / Melalui Jimpitan</option>
                  </select>
                </div>

                {/* Alur Sistem Deposit Kelebihan Bayar */}
                {bayarNominal > (selectedTagihan.totalKewajiban - selectedTagihan.jumlahDibayar) && (
                  <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-200 space-y-1.5">
                    <p className="font-bold text-[11px] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Terdeteksi Kelebihan Bayar: {formatRupiah(bayarNominal - (selectedTagihan.totalKewajiban - selectedTagihan.jumlahDibayar))}</span>
                    </p>
                    <p className="text-[10px] text-teal-300">
                      Pilih peruntukan saldo deposit warga (SOP RT.03):
                    </p>
                    <select
                      value={kelebihanOption}
                      onChange={(e) => setKelebihanOption(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="pembayaran_tagihan">Simpan Deposit untuk Pembayaran Tagihan (Bulan Ini & Seterusnya)</option>
                      <option value="donasi_kas">Dialihkan Sebagai Donasi Kas RT</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedTagihan(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Simpan Pembayaran
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUKU KAS RT (PEMASUKAN & PENGELUARAN 11 KOMPONEN SOP) */}
      {activeTab === 'buku_kas' && (
        <div className="space-y-3">
          {/* Summary Balance Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Pemasukan</span>
              <p className="text-xs sm:text-sm font-black text-emerald-400 font-mono mt-0.5 truncate">
                {formatRupiah(totalPemasukan)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Pengeluaran</span>
              <p className="text-xs sm:text-sm font-black text-rose-400 font-mono mt-0.5 truncate">
                {formatRupiah(totalPengeluaran)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-[9px] text-emerald-400 font-bold uppercase block">Saldo Kas</span>
              <p className="text-xs sm:text-sm font-black text-emerald-300 font-mono mt-0.5 truncate">
                {formatRupiah(pemasukanBersih)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowIncomeModal(true)}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kas Masuk</span>
            </button>

            <button
              onClick={handleOpenAddExpense}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pengeluaran (11 Komponen)</span>
            </button>
          </div>

          {/* Visualisasi Arus Kas Bulanan (Recharts) */}
          <CashFlowTrendChart
            pemasukanList={pemasukanList}
            pengeluaranList={pengeluaranList}
            tagihanList={tagihanList}
            activePeriode={activePeriode}
          />

          {/* 11 Komponen SOP Pengeluaran RT.03 */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Catatan Pengeluaran Kas (SOP RT.03)</h3>
              <button
                onClick={handleExportKasCSV}
                className="px-2 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-[11px] flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Excel</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {pengeluaranList.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-xs">Belum ada mutasi pengeluaran kas tercatat.</p>
              ) : (
                pengeluaranList.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-white block truncate">{exp.komponen}</span>
                      <p className="text-[11px] text-slate-400">
                        {exp.tanggal} • {exp.keterangan || exp.namaPenerimaOrPekerjaan}
                      </p>
                      {exp.namaPenerimaOrPekerjaan && (
                        <span className="text-[10px] text-amber-400 font-medium block truncate">
                          Penerima / Pekerjaan: {exp.namaPenerimaOrPekerjaan}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-rose-400">
                        -{formatRupiah(exp.nominal)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                          title="Edit Catatan Pengeluaran"
                          aria-label="Edit pengeluaran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition"
                          title="Hapus Catatan Pengeluaran"
                          aria-label="Hapus pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Catatan Pemasukan Kas */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm">Catatan Pemasukan Kas Terakhir</h3>
            <div className="space-y-1.5 pt-1">
              {pemasukanList.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-xs">Belum ada mutasi pemasukan kas tercatat.</p>
              ) : (
                pemasukanList.slice(0, 6).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-white block">{inc.kategori}</span>
                      <p className="text-[11px] text-slate-400">
                        {inc.tanggal} • Dari: {inc.namaSumber}
                      </p>
                      {inc.keterangan && (
                        <p className="text-[10px] text-slate-500">{inc.keterangan}</p>
                      )}
                    </div>

                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                      +{formatRupiah(inc.nominal)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal Pengeluaran 11 Komponen */}
          {showExpenseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSaveExpense}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">
                    {editingExpense ? 'Edit Pengeluaran SOP Kas RT' : 'Input Pengeluaran SOP Kas RT'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseModal(false);
                      setEditingExpense(null);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg"
                    aria-label="Tutup form"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Tanggal Transaksi:</label>
                  <input
                    type="date"
                    required
                    value={expenseTanggal}
                    onChange={(e) => setExpenseTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Komponen Pengeluaran (11 SOP):</label>
                  <select
                    value={selectedKomponen}
                    onChange={(e) => setSelectedKomponen(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Dana Apresiasi RT">1. Dana Apresiasi RT</option>
                    <option value="Dansos RW">2. Dansos RW</option>
                    <option value="Bayar Listrik Pos">3. Bayar Listrik Pos</option>
                    <option value="Bayar Tagihan PDAM">4. Bayar Tagihan PDAM</option>
                    <option value="Uang Snack Rapat RT">5. Uang Snack Rapat RT</option>
                    <option value="Santunan Duka Cita (Kematian)">6. Santunan Duka Cita (Kematian)</option>
                    <option value="Bantuan Warga Sakit (Rawat Inap)">7. Bantuan Warga Sakit (Rawat Inap)</option>
                    <option value="Logistik POS Ronda">8. Logistik POS Ronda</option>
                    <option value="Logistik Kerja Bakti">9. Logistik Kerja Bakti</option>
                    <option value="Pembelian material pekerjaan">10. Pembelian material pekerjaan</option>
                    <option value="Pengeluaran lainnya">11. Pengeluaran lainnya</option>
                  </select>
                </div>

                {/* Conditional specific fields required by prompt */}
                {(selectedKomponen === 'Santunan Duka Cita (Kematian)' ||
                  selectedKomponen === 'Bantuan Warga Sakit (Rawat Inap)' ||
                  selectedKomponen === 'Pembelian material pekerjaan' ||
                  selectedKomponen === 'Pengeluaran lainnya') && (
                  <div>
                    <label className="text-slate-400 block mb-0.5 font-bold text-amber-300">
                      {selectedKomponen === 'Santunan Duka Cita (Kematian)' && 'Nama Penerima Santunan (Warga Berduka):'}
                      {selectedKomponen === 'Bantuan Warga Sakit (Rawat Inap)' && 'Nama Warga Sakit (Rawat Inap):'}
                      {selectedKomponen === 'Pembelian material pekerjaan' && 'Nama Pekerjaan / Proyek Fasilitas:'}
                      {selectedKomponen === 'Pengeluaran lainnya' && 'Nama / Jenis Pengeluaran Lainnya:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Wajib diisi sesuai SOP RT.03"
                      value={expensePenerimaOrPekerjaan}
                      onChange={(e) => setExpensePenerimaOrPekerjaan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Pengeluaran (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={expenseNominal}
                    onChange={(e) => setExpenseNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Keterangan / Bukti Nota:</label>
                  <textarea
                    rows={2}
                    placeholder="No nota atau detail kebutuhan..."
                    value={expenseKeterangan}
                    onChange={(e) => setExpenseKeterangan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseModal(false);
                      setEditingExpense(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition active:scale-95"
                  >
                    {editingExpense ? 'Perbarui Pengeluaran' : 'Simpan Pengeluaran'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Pemasukan Kas */}
          {showIncomeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSaveIncome}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Input Kas Masuk Tambahan</h3>
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Kategori Pemasukan:</label>
                  <select
                    value={incomeKategori}
                    onChange={(e) => setIncomeKategori(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Donasi Kas RT">Donasi Sukarela Warga / Simpatisan</option>
                    <option value="Bantuan / CSR Perumahan">Bantuan / CSR Perumahan</option>
                    <option value="Hasil Jimpitan Tambahan">Hasil Jimpitan Tambahan</option>
                    <option value="Kelebihan Bayar Dialihkan Donasi">Kelebihan Bayar Dialihkan Donasi</option>
                    <option value="Pemasukan Lain-lain">Pemasukan Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nama Sumber / Donatur:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hamba Allah / Warga Blok E"
                    value={incomeSumber}
                    onChange={(e) => setIncomeSumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={incomeNominal}
                    onChange={(e) => setIncomeNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Keterangan:</label>
                  <textarea
                    rows={2}
                    value={incomeKet}
                    onChange={(e) => setIncomeKet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Simpan Kas Masuk
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HUTANG & PIUTANG RT */}
      {activeTab === 'hutang_piutang' && (
        <div className="space-y-4">
          {/* Header Card SOP Keuangan */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Pembukuan Hutang & Piutang SOP RT.03</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prinsip Akuntansi RT: Piutang Warga (Debit / Hak Kas RT) & Hutang RT (Kredit / Kewajiban Kas RT)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  Piutang Warga (Debit / Hak Kas RT)
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Dana talangan, pinjaman darurat, atau penundaan kewajiban warga (tagihan iuran & denda). Pelunasan dicatat sebagai kas masuk dan mengurangi saldo piutang.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-rose-500/30">
                <span className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                  <ArrowDownRight className="w-4 h-4" />
                  Hutang RT (Kredit / Kewajiban Kas RT)
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Kewajiban pembayaran material, talangan operasional belanja tempo kepada warga/vendor. Pembayaran cicilan dicatat sebagai kas keluar.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Hutang RT (Kredit / Kewajiban Kas RT) */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ArrowDownRight className="w-4 h-4" />
                <span>Kewajiban Hutang RT (Material Tempo & Talangan Belanja)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-rose-300 font-bold">
                  Sisa: {formatRupiah((hutangList || []).reduce((acc, curr) => acc + (curr.sisaHutang || 0), 0))}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddHutangModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Hutang RT</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {hutangList.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-xs">Tidak ada catatan hutang RT saat ini.</p>
              ) : (
                hutangList.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{h.kreditur}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{h.deskripsi}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Tercatat: {h.tanggal} • Jatuh Tempo: <span className="text-amber-400/90 font-medium">{h.jatuhTempo}</span>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          h.status === 'Lunas'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">
                        Total: <strong className="text-slate-200">{formatRupiah(h.totalHutang)}</strong> • Terbayar:{' '}
                        <strong className="text-emerald-400">{formatRupiah(h.sudahDibayar)}</strong>
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        Sisa: {formatRupiah(h.sisaHutang)}
                      </span>
                    </div>

                    {h.sisaHutang > 0 && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHutang(h);
                            setCicilanNominal(h.sisaHutang);
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1 shadow"
                        >
                          <Coins className="w-3 h-3" />
                          <span>Bayar Cicilan Kas Keluar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Piutang Warga (Debit / Hak Kas RT) */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ArrowUpRight className="w-4 h-4" />
                <span>Piutang Warga (Debit / Hak Kas RT)</span>
              </div>
              <span className="text-[11px] font-mono text-rose-300 font-bold">
                Total Hak RT:{' '}
                {formatRupiah(
                  totalHakKasRT +
                    (piutangLainnyaList || []).reduce((acc, curr) => acc + (curr.sisaPiutang || 0), 0)
                )}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/20 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-rose-400">Aturan Akuntansi SOP RT.03:</strong> Kekurangan (-) bayar dari bulan sebelumnya secara otomatis menjadi <strong>Piutang Warga (Debit / Hak Kas RT)</strong> yang wajib ditagihkan dan diakumulasikan ke lembar kewajiban warga.
            </div>

            {/* SubTab Toggle */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setPiutangSubTab('tagihan')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  piutangSubTab === 'tagihan'
                    ? 'bg-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Piutang Iuran & Denda ({tagihanList.filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar').length})
              </button>
              <button
                type="button"
                onClick={() => setPiutangSubTab('talangan')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  piutangSubTab === 'talangan'
                    ? 'bg-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Dana Talangan & Pinjaman Darurat ({piutangLainnyaList.length})
              </button>
            </div>

            {/* SubTab 1: Tunggakan Tagihan Warga */}
            {piutangSubTab === 'tagihan' && (
              <div className="space-y-2">
                {/* Secondary filter: All vs Bulan Lalu Saja vs Berjalan */}
                <div className="flex gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPiutangTagihanFilter('ALL')}
                    className={`px-2.5 py-1 rounded transition font-semibold ${
                      piutangTagihanFilter === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Tagihan Belum Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPiutangTagihanFilter('BULAN_LALU')}
                    className={`px-2.5 py-1 rounded transition font-semibold ${
                      piutangTagihanFilter === 'BULAN_LALU'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kekurangan (-) Bulan Lalu Saja ({countWargaPiutangLalu})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPiutangTagihanFilter('BERJALAN')}
                    className={`px-2.5 py-1 rounded transition font-semibold ${
                      piutangTagihanFilter === 'BERJALAN'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tagihan Berjalan Belum Bayar
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 px-0.5">
                  <span>Daftar Hak Kas RT dari Warga:</span>
                  <span className="font-mono font-bold text-rose-400">
                    Total Piutang Tagihan: {formatRupiah(totalHakKasRT)}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {tagihanList
                    .filter((t) => {
                      if (piutangTagihanFilter === 'BULAN_LALU') {
                        return t.piutangBulanLalu > 0;
                      }
                      if (piutangTagihanFilter === 'BERJALAN') {
                        return t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar' && t.piutangBulanLalu === 0;
                      }
                      return t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar';
                    })
                    .map((t) => {
                      const sisa = t.totalKewajiban - t.jumlahDibayar;
                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{t.nama}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                Kavling {t.blokNo}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                {t.statusBayar}
                              </span>
                              {t.piutangBulanLalu > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-900/60 text-rose-300 border border-rose-500/30">
                                  Kekurangan Lalu
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Iuran: {formatRupiah(t.totalIuran)}
                              {t.totalDenda > 0 && ` • Denda: ${formatRupiah(t.totalDenda)}`}
                              {t.piutangBulanLalu > 0 && (
                                <span className="text-rose-400 font-semibold font-mono">
                                  {' '}• Piutang Lalu: {formatRupiah(t.piutangBulanLalu)}
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <span className="font-mono font-bold text-rose-400 block text-xs">
                              {formatRupiah(sisa > 0 ? sisa : t.piutangBulanLalu)}
                            </span>
                            <div className="flex gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleSendSlipWA(t)}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold"
                              >
                                WA Slip
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartBayar(t)}
                                className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                              >
                                Bayar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SubTab 2: Dana Talangan & Pinjaman Darurat Warga */}
            {piutangSubTab === 'talangan' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Catatan talangan darurat atau pinjaman warga kepada kas RT:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPiutangModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Talangan Baru</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {piutangLainnyaList.length === 0 ? (
                    <p className="text-center py-4 text-slate-500 text-xs">Tidak ada catatan pinjaman darurat / talangan warga.</p>
                  ) : (
                    piutangLainnyaList.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{p.namaWarga}</span>
                              {p.blokNo && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                  Kavling {p.blokNo}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                                {p.jenis}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{p.deskripsi}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Tercatat: {p.tanggal} • Jatuh Tempo:{' '}
                              <span className="text-amber-400/90 font-medium">{p.jatuhTempo}</span>
                            </p>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              p.status === 'Lunas'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-400">
                            Total: <strong className="text-slate-200">{formatRupiah(p.totalPiutang)}</strong> • Terbayar:{' '}
                            <strong className="text-emerald-400">{formatRupiah(p.sudahDibayar)}</strong>
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            Sisa Hak RT: {formatRupiah(p.sisaPiutang)}
                          </span>
                        </div>

                        {p.sisaPiutang > 0 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPiutang(p);
                                setCicilanPiutangNominal(p.sisaPiutang);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Catat Pelunasan / Cicilan (Kas Masuk)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Rekap & Pengelolaan Deposit Warga */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-teal-500/40 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                <Coins className="w-4 h-4" />
                <span>Rekapitulasi Sistem Deposit Warga RT.03</span>
              </div>
              <span className="text-[11px] font-mono text-teal-300 font-bold">
                Total Tersimpan:{' '}
                {formatRupiah(
                  tagihanList.reduce((acc, curr) => acc + (curr.kelebihanBayar || 0), 0)
                )}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>SOP Keuangan RT.03:</strong> Kelebihan (+) Bayar dari Bulan Sebelumnya merupakan <strong>deposit</strong> yang angkanya sudah dikurangi tagihan bulan ini dan warga memiliki pilihan untuk <strong>Donasi Kas RT</strong> dan atau untuk <strong>membayar tagihan di bulan yang akan datang</strong> (bisa juga alokasi kombinasi keduanya).
            </p>

            <div className="space-y-2">
              {tagihanList.filter((t) => t.kelebihanBayar > 0).length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900 text-center text-slate-400 text-xs">
                  Tidak ada saldo deposit warga saat ini.
                </div>
              ) : (
                tagihanList
                  .filter((t) => t.kelebihanBayar > 0)
                  .map((t) => {
                    const currentNominal =
                      danaTitipanInputMap[t.id] !== undefined
                        ? danaTitipanInputMap[t.id]
                        : t.kelebihanBayar;

                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-teal-700/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm">{t.nama}</span>
                            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              Kavling {t.blokNo}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-teal-300 text-sm">
                            Saldo: {formatRupiah(t.kelebihanBayar)}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <div className="flex-1 w-full flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 shrink-0">Nominal:</span>
                            <input
                              type="number"
                              min={1000}
                              max={t.kelebihanBayar}
                              value={currentNominal}
                              onChange={(e) =>
                                setDanaTitipanInputMap((prev) => ({
                                  ...prev,
                                  [t.id]: Math.min(
                                    t.kelebihanBayar,
                                    Math.max(0, Number(e.target.value))
                                  ),
                                }))
                              }
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDanaTitipanInputMap((prev) => ({
                                  ...prev,
                                  [t.id]: t.kelebihanBayar,
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold"
                            >
                              Semua
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                alokasikanDanaTitipan(t.id, 'pembayaran_tagihan', currentNominal);
                              }}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold"
                              title="Peruntukan Membayar Tagihan di Bulan yang Akan Datang"
                            >
                              Tagihan Datang
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alokasikanDanaTitipan(t.id, 'donasi_kas', currentNominal);
                              }}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold"
                              title="Peruntukan Donasi Kas RT"
                            >
                              Donasi Kas RT
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSplitModalTagihan(t);
                                setSplitDonasiNominal(
                                  t.alokasiDonasiNominal || Math.floor(t.kelebihanBayar / 2)
                                );
                              }}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold"
                              title="Pilihan Kombinasi Donasi & Tagihan Datang"
                            >
                              Kombinasi Split
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400">
                          Peruntukan:{' '}
                          <strong className="text-teal-300">
                            {t.alokasiDonasiNominal && t.alokasiTagihanMendatangNominal
                              ? `Kombinasi: Donasi Kas RT (${formatRupiah(t.alokasiDonasiNominal)}) & Tagihan Datang (${formatRupiah(t.alokasiTagihanMendatangNominal)})`
                              : t.alokasiKelebihan === 'donasi_kas'
                              ? 'Donasi Kas RT'
                              : 'Membayar Tagihan di Bulan yang Akan Datang'}
                          </strong>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Modal Bayar Cicilan Hutang RT */}
          {selectedHutang && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleBayarCicilan}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Bayar Cicilan Hutang RT</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedHutang(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-800 text-xs space-y-1">
                  <p className="font-bold text-white">{selectedHutang.kreditur}</p>
                  <p className="text-slate-400">{selectedHutang.deskripsi}</p>
                  <p className="text-rose-400 font-mono font-bold">
                    Sisa Hutang: {formatRupiah(selectedHutang.sisaHutang)}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Pembayaran Cicilan (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={selectedHutang.sisaHutang}
                    value={cicilanNominal}
                    onChange={(e) => setCicilanNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Pembayaran cicilan akan dicatat otomatis sebagai Kas Keluar RT.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedHutang(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Konfirmasi Cicilan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Tambah Hutang RT Baru */}
          {showAddHutangModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSaveHutang}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Tambah Kewajiban Hutang RT</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddHutangModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Kreditur / Vendor / Warga Talangan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Bangunan Berkah / Bapak Sugeng"
                    value={newHutangKreditur}
                    onChange={(e) => setNewHutangKreditur(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Deskripsi Belanja / Keperluan Tempo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian semen dan cat pos ronda tempo 30 hari"
                    value={newHutangDeskripsi}
                    onChange={(e) => setNewHutangDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Total Nominal Hutang (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newHutangTotal || ''}
                    onChange={(e) => setNewHutangTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Estimasi Tanggal Jatuh Tempo:</label>
                  <input
                    type="date"
                    value={newHutangJatuhTempo}
                    onChange={(e) => setNewHutangJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddHutangModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Simpan Hutang RT
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Tambah Piutang Warga Baru (Talangan / Pinjaman Darurat) */}
          {showAddPiutangModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSavePiutang}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Catat Piutang / Talangan Warga</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddPiutangModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nama Warga Penerima:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama warga..."
                    value={newPiutangNama}
                    onChange={(e) => setNewPiutangNama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Kavling / Blok No:</label>
                  <input
                    type="text"
                    placeholder="Contoh: D-08"
                    value={newPiutangBlok}
                    onChange={(e) => setNewPiutangBlok(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Jenis Piutang:</label>
                  <select
                    value={newPiutangJenis}
                    onChange={(e) => setNewPiutangJenis(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Dana Talangan">Dana Talangan Operasional Warga</option>
                    <option value="Pinjaman Darurat">Pinjaman Darurat Sosial Warga</option>
                    <option value="Penundaan Kewajiban Khusus">Penundaan Kewajiban Khusus</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Deskripsi / Peruntukan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Keterangan kebutuhan mendesak..."
                    value={newPiutangDeskripsi}
                    onChange={(e) => setNewPiutangDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Piutang (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newPiutangTotal || ''}
                    onChange={(e) => setNewPiutangTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Jatuh Tempo Pengembalian:</label>
                  <input
                    type="date"
                    value={newPiutangJatuhTempo}
                    onChange={(e) => setNewPiutangJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddPiutangModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                  >
                    Simpan Piutang Warga
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Pelunasan / Cicilan Piutang Warga */}
          {selectedPiutang && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleBayarCicilanPiutang}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Catat Pelunasan Piutang Warga</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedPiutang(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-800 text-xs space-y-1">
                  <p className="font-bold text-white">{selectedPiutang.namaWarga} {selectedPiutang.blokNo && `(${selectedPiutang.blokNo})`}</p>
                  <p className="text-slate-400">{selectedPiutang.deskripsi}</p>
                  <p className="text-emerald-400 font-mono font-bold">
                    Sisa Piutang: {formatRupiah(selectedPiutang.sisaPiutang)}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Pelunasan / Cicilan (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={selectedPiutang.sisaPiutang}
                    value={cicilanPiutangNominal}
                    onChange={(e) => setCicilanPiutangNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                  <p className="text-[10px] text-emerald-400/90 mt-1">
                    *Pelunasan dicatat sebagai Kas Masuk RT dan otomatis mengurangi saldo piutang warga.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPiutang(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Konfirmasi Pelunasan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LAPORAN & REKAP KEUANGAN (BULANAN & TAHUNAN, REKAP & PER INDIVIDU) */}
      {activeTab === 'laporan' && (
        <div className="space-y-4">
          {/* Header & Controls Card */}
          {(() => {
            const activeArsipItem =
              selectedArsipPeriode !== 'CURRENT'
                ? (arsipLaporanBulanan || []).find((a) => a.id === selectedArsipPeriode) || null
                : null;

            const currentReportSaldoAwal = activeArsipItem ? activeArsipItem.saldoAwalKas : saldoAwalKas;
            const currentReportPemasukan = activeArsipItem ? activeArsipItem.totalPemasukan : totalPemasukan;
            const currentReportPengeluaran = activeArsipItem ? activeArsipItem.totalPengeluaran : totalPengeluaran;
            const currentReportPemasukanBersih = currentReportPemasukan - currentReportPengeluaran;
            const currentReportSaldoAkhir = activeArsipItem ? activeArsipItem.saldoAkhirKas : saldoAkhirKas;
            const currentReportPiutang = activeArsipItem ? activeArsipItem.totalPiutangWarga : totalHakKasRT;
            const currentReportDeposit = activeArsipItem ? activeArsipItem.totalDepositWarga : totalDanaTitipanTersimpan;
            const currentReportHutang = activeArsipItem
              ? activeArsipItem.totalHutangRT
              : (hutangList || []).reduce((acc, curr) => acc + (curr.sisaHutang || 0), 0);
            const currentReportPeriode = activeArsipItem ? activeArsipItem.periode : activePeriode;
            const currentReportPemasukanList = activeArsipItem ? activeArsipItem.pemasukanSnapshot || [] : pemasukanList;
            const currentReportPengeluaranList = activeArsipItem ? activeArsipItem.pengeluaranSnapshot || [] : pengeluaranList;
            const currentReportTagihanList = activeArsipItem ? activeArsipItem.tagihanSnapshot || [] : tagihanList;

            return (
              <>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 mb-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Laporan Resmi Keuangan RT.03
                        </span>
                        {activeArsipItem && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-400/40 text-purple-300 font-mono text-[9px] font-bold">
                            Arsip Tutup Buku
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white">Transparansi Laporan Kas & Iuran Warga</h3>
                      <p className="text-[11px] text-slate-400">
                        Format Rekapitulasi, Per Individu Warga, & Arsip Bulan Terlewati
                      </p>
                    </div>

                    {/* Periode Selector & Closing Action */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold">Periode:</span>
                        <select
                          value={selectedArsipPeriode}
                          onChange={(e) => {
                            setSelectedArsipPeriode(e.target.value);
                            if (e.target.value !== 'CURRENT' && reportType === 'individu') {
                              setReportType('rekap');
                            }
                          }}
                          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="CURRENT">Periode Berjalan ({activePeriode})</option>
                          {(arsipLaporanBulanan || []).map((arsip) => (
                            <option key={arsip.id} value={arsip.id}>
                              Arsip: {arsip.periode} (Tutup Buku {arsip.tanggalClosing})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowClosingModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-95"
                        title="Closing Buku Kas & Buka Periode Baru Kapan Saja"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Closing Bulan</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-toggle: Rekapitulasi Kas vs Per Individu Warga vs Arsip Bulan Terlewati */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setReportType('rekap')}
                      className={`py-2 px-3 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                        reportType === 'rekap'
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>1. Rekapitulasi Kas & Neraca RT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('individu')}
                      className={`py-2 px-3 rounded-lg transition text-center flex items-center justify-center gap-1.5 ${
                        reportType === 'individu'
                          ? 'bg-blue-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>2. Laporan Per Individu Warga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('arsip')}
                      className={`py-2 px-3 rounded-lg transition text-center flex items-center justify-center gap-1.5 relative ${
                        reportType === 'arsip'
                          ? 'bg-purple-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>3. Arsip Laporan Kas Bulanan</span>
                      {(arsipLaporanBulanan?.length || 0) > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-900 border border-purple-400/50 text-purple-200">
                          {arsipLaporanBulanan.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Active Archive Notice Banner */}
                  {activeArsipItem && reportType === 'rekap' && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-purple-300 shrink-0" />
                        <span className="text-purple-200 font-medium">
                          Menampilkan data arsip tutup buku periode <strong>{activeArsipItem.periode}</strong> (disimpan pada {activeArsipItem.tanggalClosing}).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedArsipPeriode('CURRENT')}
                        className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] whitespace-nowrap transition"
                      >
                        Kembali ke Periode Berjalan ({activePeriode})
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (reportType === 'rekap') {
                          handleExportKasCSV(activeArsipItem);
                        } else {
                          const sel =
                            currentReportTagihanList.find((t: any) => t.wargaId === selectedIndividuWargaId) ||
                            currentReportTagihanList[0];
                          if (sel) handleExportIndividuCSV(sel);
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {reportType === 'rekap'
                          ? `Unduh Excel Rekap ${currentReportPeriode} (.csv)`
                          : 'Unduh Excel Individu (.csv)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={openPrintDialog}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cetak / Simpan PDF Resmi</span>
                    </button>
                  </div>
                </div>

                {/* VIEW 1: LAPORAN REKAPITULASI KAS & NERACA RT.03 */}
                {reportType === 'rekap' && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-xs shadow-md print:bg-white print:text-black">
                    {/* Kop Laporan Resmi RT.03 */}
                    <div className="text-center border-b-2 border-slate-700 pb-4 space-y-1">
                      <h3 className="text-xs tracking-widest uppercase font-bold text-slate-400">
                        Rukun Tetangga 03 Rukun Warga 14
                      </h3>
                      <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                        Perumahan BPTW Cilacap Utara
                      </h2>
                      <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] mt-1">
                        LAPORAN REKAPITULASI KEUANGAN & NERACA KAS RT
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Periode: <strong>{currentReportPeriode}</strong> {activeArsipItem ? '(Status: Arsip Tutup Buku)' : '(Status: Periode Berjalan)'} • Dicetak:{' '}
                        {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </p>
                    </div>

                    {/* Visualisasi Tren Arus Kas RT (Recharts) */}
                    {!activeArsipItem && (
                      <div className="print:hidden">
                        <CashFlowTrendChart
                          pemasukanList={pemasukanList}
                          pengeluaranList={pengeluaranList}
                          tagihanList={tagihanList}
                          activePeriode={activePeriode}
                        />
                      </div>
                    )}

                    {/* SECTION 0: SALDO AWAL KAS */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-300 uppercase block">
                          I. Saldo Awal Kas RT.03
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Kas riil awal periode {currentReportPeriode} yang dapat dibelanjakan
                        </span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                        {formatRupiah(currentReportSaldoAwal)}
                      </span>
                    </div>

                    {/* SECTION I: ARUS PENERIMAAN KAS (PEMASUKAN) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowDownRight className="w-4 h-4" />
                          II. Arus Penerimaan Kas (Pemasukan)
                        </span>
                        <span className="font-bold text-xs text-slate-400">Nominal (Rp)</span>
                      </div>

                      <div className="space-y-1.5 pl-2 font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">1. Iuran Rutin Warga (Dansos RT, RW, Pembangunan, Snack, Jimpitan)</span>
                          <span>
                            {formatRupiah(
                              currentReportPemasukanList
                                .filter((p: any) => p.kategori === 'Iuran Warga')
                                .reduce((s: number, p: any) => s + (p.nominal || 0), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">2. Donasi Warga & Pengalihan Saldo Deposit</span>
                          <span>
                            {formatRupiah(
                              currentReportPemasukanList
                                .filter(
                                  (p: any) =>
                                    p.kategori === 'Donasi Warga' ||
                                    p.kategori === 'Donasi Kas RT'
                                )
                                .reduce((s: number, p: any) => s + (p.nominal || 0), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">3. Pelunasan Piutang & Cicilan Talangan Warga</span>
                          <span>
                            {formatRupiah(
                              currentReportPemasukanList
                                .filter((p: any) => p.kategori && p.kategori.includes('Piutang'))
                                .reduce((s: number, p: any) => s + (p.nominal || 0), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">4. Pemasukan Kas Lainnya & Swadaya Gotong Royong</span>
                          <span>
                            {formatRupiah(
                              currentReportPemasukanList
                                .filter(
                                  (p: any) =>
                                    !['Iuran Warga', 'Donasi Warga', 'Donasi Kas RT'].includes(p.kategori) &&
                                    !p.kategori.includes('Piutang')
                                )
                                .reduce((s: number, p: any) => s + (p.nominal || 0), 0)
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800 text-sm">
                          <span className="font-sans">Total Penerimaan Kas:</span>
                          <span className="text-emerald-400">{formatRupiah(currentReportPemasukan)}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION II: ARUS PENGELUARAN KAS (11 KOMPONEN SOP) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="font-extrabold text-sm text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowUpRight className="w-4 h-4" />
                          III. Arus Pengeluaran Kas (11 Komponen SOP RT.03)
                        </span>
                        <span className="font-bold text-xs text-slate-400">Nominal (Rp)</span>
                      </div>

                      <div className="space-y-1.5 pl-2 font-mono">
                        {[
                          'Dana Apresiasi RT',
                          'Dansos RW',
                          'Bayar Listrik Pos',
                          'Bayar Tagihan PDAM',
                          'Uang Snack Rapat RT',
                          'Santunan Duka Cita (Kematian)',
                          'Bantuan Warga Sakit (Rawat Inap)',
                          'Logistik POS Ronda',
                          'Logistik Kerja Bakti',
                          'Pembelian material pekerjaan',
                          'Pengeluaran lainnya',
                        ].map((komp, idx) => {
                          const nom = currentReportPengeluaranList
                            .filter((p: any) => p.komponen === komp)
                            .reduce((s: number, p: any) => s + (p.nominal || 0), 0);

                          return (
                            <div key={komp} className="flex justify-between text-slate-300">
                              <span className="font-sans">
                                {idx + 1}. {komp}
                              </span>
                              <span>{formatRupiah(nom)}</span>
                            </div>
                          );
                        })}

                        <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800 text-sm">
                          <span className="font-sans">Total Pengeluaran Kas (11 Komponen):</span>
                          <span className="text-rose-400">{formatRupiah(currentReportPengeluaran)}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION III: POSISI KAS BERSIH (SALDO AKHIR RIIL) */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-xs font-bold text-slate-300 uppercase block">
                            IV. Posisi Kas Bersih & Saldo Kas Riil
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Saldo Awal Kas + Penerimaan Kas - Pengeluaran Kas
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-300 font-mono">
                          Surplus/Defisit: {formatRupiah(currentReportPemasukanBersih)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-extrabold text-white uppercase">
                          Saldo Akhir Kas RT.03 ({currentReportPeriode}):
                        </span>
                        <span className="text-base sm:text-xl font-black font-mono text-emerald-400">
                          {formatRupiah(currentReportSaldoAkhir)}
                        </span>
                      </div>
                    </div>

                    {/* SECTION IV: NERACA POSISI PIUTANG, HUTANG & TITIPAN WARGA */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Coins className="w-4 h-4" />
                          V. Neraca Hak & Kewajiban Kas RT.03
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            1. Piutang Warga (Debit / Hak RT)
                          </span>
                          <span className="text-sm font-black font-mono text-amber-300">
                            {formatRupiah(currentReportPiutang)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Tagihan belum bayar & pinjaman/talangan darurat warga.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            2. Hutang RT (Kredit / Kewajiban RT)
                          </span>
                          <span className="text-sm font-black font-mono text-rose-300">
                            {formatRupiah(currentReportHutang)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Kewajiban tempo pembelian material/belanja operasional ke vendor.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            3. Saldo Deposit Warga
                          </span>
                          <span className="text-sm font-black font-mono text-teal-300">
                            {formatRupiah(currentReportDeposit)}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Saldo deposit warga untuk pembayaran tagihan & donasi.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lembar Tanda Tangan Pengurus */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800 text-center">
                      <div className="space-y-12">
                        <span className="text-slate-400 text-xs block">Mengetahui, Ketua RT.03</span>
                        <div>
                          <p className="font-bold text-white text-xs border-b border-slate-700 pb-0.5 inline-block min-w-[120px]">
                            TITO
                          </p>
                          <p className="text-[10px] text-slate-500">Ketua RT.03 RW.14</p>
                        </div>
                      </div>

                      <div className="space-y-12">
                        <span className="text-slate-400 text-xs block">Dibuat oleh, Bendahara RT.03</span>
                        <div>
                          <p className="font-bold text-white text-xs border-b border-slate-700 pb-0.5 inline-block min-w-[120px]">
                            BENDAHARA RT.03
                          </p>
                          <p className="text-[10px] text-slate-500">Pengelola Keuangan Kas RT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* VIEW 2: LAPORAN KEUANGAN PER INDIVIDU WARGA */}
          {reportType === 'individu' && (
            <div className="space-y-3">
              {/* Warga Picker Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  Pilih Warga untuk Menampilkan Lembar Keuangan Individu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchIndividu}
                      onChange={(e) => setSearchIndividu(e.target.value)}
                      placeholder="Cari nama atau kavling warga..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={selectedIndividuWargaId}
                    onChange={(e) => setSelectedIndividuWargaId(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {tagihanList
                      .filter((t) => {
                        if (!searchIndividu) return true;
                        return (
                          t.nama.toLowerCase().includes(searchIndividu.toLowerCase()) ||
                          t.blokNo.toLowerCase().includes(searchIndividu.toLowerCase())
                        );
                      })
                      .map((t) => (
                        <option key={t.id} value={t.wargaId}>
                          {t.blokNo} - {t.nama} ({t.statusBayar})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Individu Ledger Sheet */}
              {(() => {
                const targetTag =
                  tagihanList.find((t) => t.wargaId === selectedIndividuWargaId) || tagihanList[0];
                const targetWarga = wargaList.find((w) => w.id === targetTag?.wargaId);

                if (!targetTag) return null;

                const sisaKewajiban =
                  targetTag.statusBayar === 'Lunas'
                    ? 0
                    : Math.max(0, targetTag.totalKewajiban - targetTag.jumlahDibayar);

                return (
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-xs shadow-md print:bg-white print:text-black">
                    {/* Official Kop Individu */}
                    <div className="border-b-2 border-slate-700 pb-3.5 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">
                            RT.03 RW.14 PERUM BPTW CILACAP
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-white uppercase">
                            KARTU IURAN & STATUS KEUANGAN INDIVIDU
                          </h3>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 block">Periode Tagihan</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {reportPeriod === 'Bulanan' ? targetTag.periode : 'Tahun Anggaran 2026'}
                          </span>
                        </div>
                      </div>

                      {/* Resident Identity Header */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Nama Warga:</span>
                          <strong className="text-white text-xs">{targetTag.nama}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Kavling / Blok:</span>
                          <strong className="text-white text-xs font-mono">{targetTag.blokNo}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Status Hunian:</span>
                          <span className="text-slate-200">{targetWarga?.statusHuni || 'Dihuni'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Kriteria Ronda:</span>
                          <span className="text-slate-200">{targetWarga?.kriteriaRonda || 'Wajib Ronda'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rincian Komponen Tagihan Warga */}
                    <div className="space-y-2">
                      <div className="flex justify-between pb-1 border-b border-slate-800 text-slate-400 font-bold">
                        <span>Rincian Komponen Kewajiban Warga</span>
                        <span>Nominal (Rp)</span>
                      </div>

                      <div className="space-y-1.5 font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">1. Dana Sosial RT (Dansos RT)</span>
                          <span>{formatRupiah(targetTag.dansosRT)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">2. Dana Sosial RW (Dansos RW)</span>
                          <span>{formatRupiah(targetTag.dansosRW)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">3. Dana Pembangunan Sarana RT</span>
                          <span>{formatRupiah(targetTag.pembangunan)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">4. Uang Snack Rapat Warga</span>
                          <span>{formatRupiah(targetTag.snack)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">5. Jimpitan Gotong Royong</span>
                          <span>{formatRupiah(targetTag.jimpitan)}</span>
                        </div>

                        <div className="flex justify-between text-slate-200 font-semibold pt-1 border-t border-slate-800/60">
                          <span className="font-sans font-bold">Subtotal Iuran Rutin:</span>
                          <span>{formatRupiah(targetTag.totalIuran)}</span>
                        </div>

                        {/* Denda Ronda & Denda Kerja Bakti */}
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">
                            6. Denda Ronda (Bulan Lalu - Agustus):
                          </span>
                          <span className={targetTag.dendaRonda > 0 ? 'text-amber-400' : 'text-slate-400'}>
                            {formatRupiah(targetTag.dendaRonda)}
                          </span>
                        </div>

                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">7. Denda Kerja Bakti:</span>
                          <span className={targetTag.dendaKerjaBakti > 0 ? 'text-amber-400' : 'text-slate-400'}>
                            {formatRupiah(targetTag.dendaKerjaBakti)}
                          </span>
                        </div>

                        {/* Status Bulan Lalu: Tunggakan & Titipan */}
                        {targetTag.piutangBulanLalu > 0 && (
                          <div className="flex justify-between text-amber-300">
                            <span className="font-sans">8. Tunggakan / Piutang Bulan Sebelumnya:</span>
                            <span>+{formatRupiah(targetTag.piutangBulanLalu)}</span>
                          </div>
                        )}

                        {targetTag.titipanDigunakanUntukTagihan > 0 && (
                          <div className="flex justify-between text-teal-300">
                            <span className="font-sans">
                              9. Potongan Saldo Deposit Bulan Lalu:
                            </span>
                            <span>-{formatRupiah(targetTag.titipanDigunakanUntukTagihan)}</span>
                          </div>
                        )}

                        {/* Total Tagihan Bersih */}
                        <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t-2 border-slate-700">
                          <span className="font-sans">TOTAL KEWAJIBAN BULAN INI:</span>
                          <span className="text-emerald-400">{formatRupiah(targetTag.totalKewajiban)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Realisasi Pembayaran & Status Finansial */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Jumlah yang Telah Dibayarkan:</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {formatRupiah(targetTag.jumlahDibayar)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Status Pembayaran:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            targetTag.statusBayar === 'Lunas'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : targetTag.statusBayar === 'Lebih Bayar'
                              ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {targetTag.statusBayar}
                        </span>
                      </div>

                      {/* Notice Piutang Warga if unpaid */}
                      {sisaKewajiban > 0 && (
                        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
                          <span>Kekurangan Bayar Tercatat Sebagai Piutang Warga:</span>
                          <span className="font-mono font-bold">{formatRupiah(sisaKewajiban)}</span>
                        </div>
                      )}

                      {/* Notice Saldo Deposit if overpaid */}
                      {targetTag.kelebihanBayar > 0 && (
                        <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-[11px] text-teal-300 flex items-center justify-between">
                          <span>Saldo Deposit Warga Tersimpan:</span>
                          <span className="font-mono font-bold">
                            {formatRupiah(targetTag.kelebihanBayar)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action for Individu */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleExportIndividuCSV(targetTag)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unduh Excel Individu (.csv)</span>
                      </button>
                      <button
                        type="button"
                        onClick={openPrintDialog}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Slip Tagihan</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW 3: ARSIP LAPORAN KAS BULANAN (BULAN-BULAN YANG SUDAH TERLEWATI) */}
          {reportType === 'arsip' && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Arsip Pembukuan Kas Bulanan RT.03</h4>
                    <p className="text-[11px] text-slate-400">
                      Seluruh rekapitulasi penerimaan, pengeluaran, saldo kas riil, dan status iuran tiap warga dari bulan-bulan yang telah ditutup tersimpan permanen di sini.
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-300 font-bold font-mono text-xs">
                    {arsipLaporanBulanan?.length || 0} Periode Diarsipkan
                  </span>
                </div>
              </div>

              {/* List of Archives */}
              {(!arsipLaporanBulanan || arsipLaporanBulanan.length === 0) ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Archive className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Belum Ada Arsip Tutup Buku</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Arsip bulanan akan otomatis terbuat saat Anda atau Pengurus melakukan proses <strong>Closing Bulan</strong>. Seluruh riwayat saldo kas, mutasi pengeluaran, dan status iuran warga akan tersimpan rapi tanpa risiko terhapus.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClosingModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lakukan Closing Bulan Sekarang</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arsipLaporanBulanan.map((arsip) => {
                    return (
                      <div
                        key={arsip.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition space-y-3 shadow-md"
                      >
                        {/* Header Period Card */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {arsip.periode}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
                                Tutup Buku
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Ditutup pada: {arsip.tanggalClosing} • Oleh: {arsip.closedBy || 'Bendahara / Super Admin'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Saldo Akhir Kas:</span>
                            <span className="text-xs font-black font-mono text-emerald-400">
                              {formatRupiah(arsip.saldoAkhirKas)}
                            </span>
                          </div>
                        </div>

                        {/* Financial Snapshot Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                            <span className="text-slate-400 font-semibold block">Saldo Awal</span>
                            <span className="font-mono font-bold text-slate-200">
                              {formatRupiah(arsip.saldoAwalKas)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-0.5">
                            <span className="text-slate-400 font-semibold block">Penerimaan</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatRupiah(arsip.totalPemasukan)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950 border border-rose-500/20 space-y-0.5">
                            <span className="text-slate-400 font-semibold block">Pengeluaran</span>
                            <span className="font-mono font-bold text-rose-400">
                              {formatRupiah(arsip.totalPengeluaran)}
                            </span>
                          </div>
                        </div>

                        {/* Secondary Metrics */}
                        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
                          <span>
                            Piutang Warga: <strong className="text-amber-300 font-mono">{formatRupiah(arsip.totalPiutangWarga)}</strong>
                          </span>
                          <span>
                            Deposit Warga: <strong className="text-teal-300 font-mono">{formatRupiah(arsip.totalDepositWarga)}</strong>
                          </span>
                          <span>
                            Hutang RT: <strong className="text-rose-300 font-mono">{formatRupiah(arsip.totalHutangRT)}</strong>
                          </span>
                        </div>

                        {arsip.catatanClosing && (
                          <p className="text-[11px] text-slate-300 italic px-2 bg-slate-950/40 py-1 rounded-lg border border-slate-800/80">
                            &quot;{arsip.catatanClosing}&quot;
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArsipPeriode(arsip.id);
                              setReportType('rekap');
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Buka Laporan Lengkap</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedArsipDetail(arsip)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                            title="Lihat Snapshot Rincian"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                            <span>Rincian</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportKasCSV(arsip)}
                            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition"
                            title="Unduh Excel .CSV Arsip"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus arsip laporan periode ${arsip.periode}? Tindakan ini tidak dapat dibatalkan.`)) {
                                deleteArsipLaporanBulanan(arsip.id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                            title="Hapus Arsip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Pilihan Alokasi Deposit Warga (Donasi dan/atau Bayar Tagihan Bulan Datang) */}
      {splitModalTagihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-teal-500/40 p-5 shadow-2xl text-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Alokasi Pilihan Deposit Warga</h3>
                  <p className="text-[11px] text-teal-300/80">Kavling {splitModalTagihan.blokNo} • {splitModalTagihan.nama}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSplitModalTagihan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* SOP Explanation Box */}
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-teal-300">
                <Info className="w-3.5 h-3.5" />
                <span>Ketentuan Alokasi Deposit Warga:</span>
              </p>
              <p>
                Kelebihan (+) Bayar dari Bulan Sebelumnya merupakan <strong>deposit</strong> yang angkanya sudah dikurangi tagihan bulan ini. Warga memiliki pilihan untuk <strong>Donasi</strong> dan atau untuk <strong>membayar tagihan di bulan yang akan datang</strong>.
              </p>
            </div>

            {/* Saldo Summary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Saldo Deposit Tersedia</span>
                <span className="text-xs text-slate-300">Telah dipotong tagihan bulan berjalan</span>
              </div>
              <span className="text-lg font-black font-mono text-teal-300">
                {formatRupiah(splitModalTagihan.kelebihanBayar)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300">Pilihan Cepat Alokasi:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominal(0)}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominal === 0
                      ? 'bg-teal-950 text-teal-300 border-teal-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  100% Tagihan Datang
                </button>
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominal(Math.floor(splitModalTagihan.kelebihanBayar / 2))}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominal > 0 && splitDonasiNominal < splitModalTagihan.kelebihanBayar
                      ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Kombinasi 50% - 50%
                </button>
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominal(splitModalTagihan.kelebihanBayar)}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominal === splitModalTagihan.kelebihanBayar
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  100% Donasi Kas RT
                </button>
              </div>
            </div>

            {/* Custom Nominal Distribution */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>1. Donasi Kas RT (Sukarela):</span>
                  </label>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatRupiah(splitDonasiNominal)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={splitModalTagihan.kelebihanBayar}
                  step={5000}
                  value={splitDonasiNominal}
                  onChange={(e) => setSplitDonasiNominal(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <label className="font-semibold text-teal-400 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>2. Membayar Tagihan di Bulan yang Akan Datang:</span>
                </label>
                <span className="font-mono font-bold text-teal-300">
                  {formatRupiah(Math.max(0, splitModalTagihan.kelebihanBayar - splitDonasiNominal))}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSplitModalTagihan(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAlokasiKombinasiBendahara(
                    splitModalTagihan.id,
                    splitDonasiNominal,
                    splitModalTagihan.nama,
                    splitModalTagihan.kelebihanBayar
                  )
                }
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Alokasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kostumisasi 5 Komponen Iuran Individu Warga */}
      <KostumisasiKomponenModal
        isOpen={!!editingKomponenWarga}
        warga={
          editingKomponenWarga
            ? {
                id: editingKomponenWarga.id,
                nama:
                  editingKomponenWarga.namaPenghuni !== '-'
                    ? editingKomponenWarga.namaPenghuni
                    : editingKomponenWarga.namaPemilik || `ID ${editingKomponenWarga.id}`,
                blokNo: `${editingKomponenWarga.blok}/${editingKomponenWarga.noRumah}`,
                statusUsiaPenghuni: editingKomponenWarga.statusUsiaPenghuni,
                dansosRT: editingKomponenWarga.dansosRT,
                dansosRW: editingKomponenWarga.dansosRW,
                pembangunan: editingKomponenWarga.pembangunan,
                snackRapat: editingKomponenWarga.snackRapat,
                jimpitan: editingKomponenWarga.jimpitan,
              }
            : null
        }
        onClose={() => setEditingKomponenWarga(null)}
        onSave={handleSaveKomponen}
      />

      {/* Modal Detail Snapshot Arsip Laporan Bulanan */}
      {selectedArsipDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Snapshot Arsip Periode: {selectedArsipDetail.periode}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ditutup pada {selectedArsipDetail.tanggalClosing} oleh {selectedArsipDetail.closedBy || 'Bendahara'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArsipDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Ringkasan Neraca Kas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Saldo Awal Kas</span>
                  <span className="text-xs font-bold text-slate-200">{formatRupiah(selectedArsipDetail.saldoAwalKas)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 font-sans block">Penerimaan</span>
                  <span className="text-xs font-bold text-emerald-400">{formatRupiah(selectedArsipDetail.totalPemasukan)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/20">
                  <span className="text-[10px] text-slate-400 font-sans block">Pengeluaran</span>
                  <span className="text-xs font-bold text-rose-400">{formatRupiah(selectedArsipDetail.totalPengeluaran)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30">
                  <span className="text-[10px] text-slate-400 font-sans block">Saldo Akhir Riil</span>
                  <span className="text-xs font-extrabold text-purple-300">{formatRupiah(selectedArsipDetail.saldoAkhirKas)}</span>
                </div>
              </div>

              {/* Rincian Pengeluaran Kas Snapshot */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>Mutasi Pengeluaran ({selectedArsipDetail.pengeluaranSnapshot?.length || 0} Transaksi)</span>
                  <span className="text-rose-400 font-mono">{formatRupiah(selectedArsipDetail.totalPengeluaran)}</span>
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(!selectedArsipDetail.pengeluaranSnapshot || selectedArsipDetail.pengeluaranSnapshot.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic">Tidak ada transaksi pengeluaran pada periode ini (0 Pengeluaran).</p>
                  ) : (
                    selectedArsipDetail.pengeluaranSnapshot.map((peng: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-white block">{peng.komponen}</span>
                          <span className="text-[10px] text-slate-400">{peng.tanggal} • {peng.namaPenerimaOrPekerjaan || peng.keterangan || '-'}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-400">{formatRupiah(peng.nominal)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rincian Penerimaan Snapshot */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>Penerimaan Kas ({selectedArsipDetail.pemasukanSnapshot?.length || 0} Sumber)</span>
                  <span className="text-emerald-400 font-mono">{formatRupiah(selectedArsipDetail.totalPemasukan)}</span>
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(!selectedArsipDetail.pemasukanSnapshot || selectedArsipDetail.pemasukanSnapshot.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic">Tidak ada transaksi pemasukan pada periode ini (0 Pemasukan).</p>
                  ) : (
                    selectedArsipDetail.pemasukanSnapshot.map((pem: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-white block">{pem.kategori} - {pem.namaSumber}</span>
                          <span className="text-[10px] text-slate-400">{pem.tanggal} • {pem.keterangan || '-'}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{formatRupiah(pem.nominal)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status Iuran Warga Snapshot */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>Status Iuran Warga ({selectedArsipDetail.tagihanSnapshot?.length || 0} Kavling)</span>
                  <span className="text-amber-300 font-mono text-[11px]">
                    Piutang: {formatRupiah(selectedArsipDetail.totalPiutangWarga)}
                  </span>
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {(selectedArsipDetail.tagihanSnapshot || []).map((tag: any, idx: number) => {
                    const isLunas = tag.statusBayar === 'Lunas' || tag.statusBayar === 'Lebih Bayar';
                    return (
                      <div key={idx} className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white w-12">{tag.blokNo}</span>
                          <span className="text-slate-300 truncate max-w-[140px]">{tag.nama}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-300">{formatRupiah(tag.totalKewajiban)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLunas ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}>
                            {tag.statusBayar}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedArsipPeriode(selectedArsipDetail.id);
                  setReportType('rekap');
                  setSelectedArsipDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Buka Lembar Laporan Penuh & Cetak</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportKasCSV(selectedArsipDetail)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh .CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArsipDetail(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Closing Bulan Kas & Buka Periode Baru Kapan Saja */}
      <ClosingBulanModal
        isOpen={showClosingModal}
        activePeriode={activePeriode}
        onClose={() => setShowClosingModal(false)}
        onExecuteClosing={(newPeriode) => closingBulanKas(newPeriode)}
        totalPemasukan={totalPemasukan}
        totalPengeluaran={totalPengeluaran}
        saldoAkhirKas={saldoAkhirKas}
        totalPiutangWarga={totalHakKasRT}
        countWargaPiutang={tagihanList.filter((t) => Math.max(0, t.totalKewajiban - t.jumlahDibayar) > 0).length}
        totalDepositWarga={totalDanaTitipanTersimpan}
        countWargaDeposit={countWargaTitipanAktif}
      />

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
        onCancel={closeConfirmModal}
        onClose={closeConfirmModal}
      />
    </div>
  );
};
