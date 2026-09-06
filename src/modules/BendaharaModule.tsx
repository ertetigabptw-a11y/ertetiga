import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TagihanWarga, PengeluaranKas, PemasukanKas, HutangRT } from '../types';
import { exportToCSV, formatRupiah, openPrintDialog } from '../utils/exportUtils';
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
} from 'lucide-react';

interface BendaharaModuleProps {
  activeTab: string;
}

export const BendaharaModule: React.FC<BendaharaModuleProps> = ({ activeTab }) => {
  const {
    tagihanList,
    bayarTagihanWarga,
    alokasikanDanaTitipan,
    pengeluaranList,
    addPengeluaranKas,
    pemasukanList,
    addPemasukanKas,
    hutangList,
    bayarCicilanHutang,
    sendWhatsAppDirect,
    settings,
  } = useApp();

  // Tagihan search & filter
  const [tagihanSearch, setTagihanSearch] = useState('');
  const [tagihanStatusFilter, setTagihanStatusFilter] = useState('ALL');
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanWarga | null>(null);

  // Payment modal state
  const [bayarNominal, setBayarNominal] = useState<number>(0);
  const [metodeBayar, setMetodeBayar] = useState<'Transfer' | 'Tunai / Jimpitan'>('Transfer');
  const [kelebihanOption, setKelebihanOption] = useState<'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali'>('titipan_bulan_depan');
  const [sendingSlipId, setSendingSlipId] = useState<string | null>(null);
  const [slipSendMsg, setSlipSendMsg] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  // Pengeluaran modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedKomponen, setSelectedKomponen] = useState<PengeluaranKas['komponen']>('Dana Apresiasi RT');
  const [expenseNominal, setExpenseNominal] = useState<number>(0);
  const [expensePenerimaOrPekerjaan, setExpensePenerimaOrPekerjaan] = useState('');
  const [expenseKeterangan, setExpenseKeterangan] = useState('');

  // Pemasukan modal state
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeKategori, setIncomeKategori] = useState('Donasi Kas RT');
  const [incomeSumber, setIncomeSumber] = useState('');
  const [incomeNominal, setIncomeNominal] = useState<number>(0);
  const [incomeKet, setIncomeKet] = useState('');

  // Cicilan Hutang modal
  const [selectedHutang, setSelectedHutang] = useState<HutangRT | null>(null);
  const [cicilanNominal, setCicilanNominal] = useState<number>(0);

  // Report period
  const [reportPeriod, setReportPeriod] = useState<'Bulanan' | 'Tahunan'>('Bulanan');

  // Calculations for Book of Cash (Buku Kas RT)
  const totalPemasukan = pemasukanList.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.nominal, 0);
  const pemasukanBersih = totalPemasukan - totalPengeluaran;

  // Filtered Tagihan
  const filteredTagihan = tagihanList.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(tagihanSearch.toLowerCase()) ||
      t.blokNo.toLowerCase().includes(tagihanSearch.toLowerCase());
    const matchStatus =
      tagihanStatusFilter === 'ALL' ||
      (tagihanStatusFilter === 'Lunas' && t.statusBayar === 'Lunas') ||
      (tagihanStatusFilter === 'Belum' && t.statusBayar !== 'Lunas');
    return matchSearch && matchStatus;
  });

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

    const message = `*SLIP TAGIHAN IURAN RT.03 RW.14 PERUM BPTW*\nPeriode: *${tag.periode}*\n----------------------------------------\nNama: *${tag.nama}* (Kavling ${tag.blokNo})\n\n*Rincian Tagihan:*\n- Dansos RT: ${formatRupiah(tag.dansosRT)}\n- Dansos RW: ${formatRupiah(tag.dansosRW)}\n- Pembangunan: ${formatRupiah(tag.pembangunan)}\n- Snack Rapat: ${formatRupiah(tag.snack)}\n- Jimpitan: ${formatRupiah(tag.jimpitan)}\n*Total Iuran Rutin: ${formatRupiah(tag.totalIuran)}*\n\n${tag.dendaRonda > 0 ? `• Denda Ronda: ${formatRupiah(tag.dendaRonda)}\n` : ''}${tag.dendaKerjaBakti > 0 ? `• Denda Kerja Bakti: ${formatRupiah(tag.dendaKerjaBakti)}\n` : ''}${tag.piutangBulanLalu > 0 ? `• Piutang Bulan Lalu: ${formatRupiah(tag.piutangBulanLalu)}\n` : ''}${tag.titipanDigunakanUntukTagihan > 0 ? `• Potongan Dana Titipan: -${formatRupiah(tag.titipanDigunakanUntukTagihan)}\n` : ''}----------------------------------------\n*TOTAL KEWAJIBAN: ${formatRupiah(tag.totalKewajiban)}*\nStatus Bayar: *${tag.statusBayar.toUpperCase()}*\n(Dibayar: ${formatRupiah(tag.jumlahDibayar)})\n\n_Silakan transfer ke Rekening RT atau titipkan ke pengurus saat jimpitan._\nTerima kasih atas partisipasi aktif warga RT.03!`;

    try {
      const res = await sendWhatsAppDirect(settings.targetGroupWa, message);
      setSlipSendMsg({
        id: tag.id,
        msg: res.message || (res.status ? 'Slip berhasil dikirim via WA Gateway!' : 'Gagal mengirim slip'),
        success: res.status,
      });
    } catch (err: any) {
      setSlipSendMsg({ id: tag.id, msg: err.message || 'Error pengiriman WA', success: false });
    } finally {
      setSendingSlipId(null);
    }
  };

  // Handlers for Pengeluaran
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseNominal <= 0) return;

    addPengeluaranKas({
      tanggal: new Date().toISOString().slice(0, 10),
      komponen: selectedKomponen,
      nominal: Number(expenseNominal),
      namaPenerimaOrPekerjaan: expensePenerimaOrPekerjaan,
      keterangan: expenseKeterangan,
    });

    setExpenseNominal(0);
    setExpensePenerimaOrPekerjaan('');
    setExpenseKeterangan('');
    setShowExpenseModal(false);
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
  const handleBayarCicilan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHutang || cicilanNominal <= 0) return;

    bayarCicilanHutang(selectedHutang.id, Number(cicilanNominal));
    setSelectedHutang(null);
    setCicilanNominal(0);
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
      'Titipan Digunakan',
      'Total Kewajiban',
      'Jumlah Dibayar',
      'Status Bayar',
      'Kelebihan Bayar',
      'Alokasi Kelebihan',
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

  const handleExportKasCSV = () => {
    const headerPemasukan = ['Tanggal', 'Kategori', 'Sumber', 'Nominal', 'Keterangan'];
    const rowsPemasukan = pemasukanList.map((p) => [p.tanggal, p.kategori, p.namaSumber, p.nominal, p.keterangan]);

    const headerPengeluaran = ['Tanggal', 'Komponen SOP RT', 'Penerima / Pekerjaan', 'Nominal', 'Keterangan'];
    const rowsPengeluaran = pengeluaranList.map((p) => [
      p.tanggal,
      p.komponen,
      p.namaPenerimaOrPekerjaan || '-',
      p.nominal,
      p.keterangan || '-',
    ]);

    exportToCSV(`Buku_Kas_RT03_${reportPeriod}`, [
      ['LAPORAN PEMASUKAN KAS RT.03'],
      headerPemasukan,
      ...rowsPemasukan,
      [''],
      ['LAPORAN PENGELUARAN KAS RT.03 (11 KOMPONEN SOP)'],
      headerPengeluaran,
      ...rowsPengeluaran,
      [''],
      ['RINGKASAN TOTAL'],
      ['Total Pemasukan', totalPemasukan],
      ['Total Pengeluaran', totalPengeluaran],
      ['Pemasukan Bersih (Saldo)', pemasukanBersih],
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 mb-1">
          <Coins className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Modul Bendahara RT.03</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Transparansi Keuangan & Iuran Lingkungan</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          RT.03 RW.14 Perum BPTW • Iuran Rutin, Denda, 11 Komponen SOP & Dana Titipan
        </p>
      </div>

      {/* TAB 1: LEMBAR TAGIHAN WARGA */}
      {activeTab === 'tagihan' && (
        <div className="space-y-3">
          {/* Action Bar & Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Tagihan Iuran & Denda Warga</h3>
                <p className="text-[10px] text-slate-400">
                  Dansos RT (19k) + RW (8k) + Pembangunan (5k) + Snack (3k) + Jimpitan (15k)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
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
                <option value="ALL">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum">Belum Lunas</option>
              </select>
            </div>
          </div>

          {/* List Tagihan Warga */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 px-1">
              Menampilkan {filteredTagihan.length} dari {tagihanList.length} tagihan
            </div>

            {filteredTagihan.map((tag) => (
              <div
                key={tag.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Kavling: <span className="text-slate-200 font-mono font-bold">{tag.blokNo}</span> • Periode: {tag.periode}
                    </p>
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
                    Denda Ronda: <span className="font-mono text-amber-400">{formatRupiah(tag.dendaRonda)}</span>
                  </div>
                  <div>
                    Denda Kerja Bakti:{' '}
                    <span className="font-mono text-amber-400">{formatRupiah(tag.dendaKerjaBakti)}</span>
                  </div>
                  <div>
                    Piutang Lalu:{' '}
                    <span className="font-mono text-rose-400">{formatRupiah(tag.piutangBulanLalu)}</span>
                  </div>
                  {tag.titipanDigunakanUntukTagihan > 0 && (
                    <div className="col-span-2 text-teal-300 font-semibold">
                      Dana Titipan Memotong Tagihan: -{formatRupiah(tag.titipanDigunakanUntukTagihan)}
                    </div>
                  )}
                  {tag.kelebihanBayar > 0 && (
                    <div className="col-span-2 text-emerald-400 font-semibold">
                      Sisa Kelebihan: {formatRupiah(tag.kelebihanBayar)} (
                      {tag.alokasiKelebihan === 'donasi_kas'
                        ? 'Donasi Kas RT'
                        : tag.alokasiKelebihan === 'tarik_kembali'
                        ? 'Ditarik Kembali'
                        : 'Titipan Bulan Depan'}
                      )
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
                      onClick={() => handleSendSlipWA(tag)}
                      disabled={sendingSlipId === tag.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1"
                      title="Kirim Slip Tagihan via WhatsApp"
                    >
                      <Send className="w-3 h-3" />
                      <span>{sendingSlipId === tag.id ? 'Mengirim...' : 'Kirim WA'}</span>
                    </button>

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
            ))}
          </div>

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

                {/* Sifat Alur Logika Kelebihan Bayar / Dana Titipan */}
                {bayarNominal > (selectedTagihan.totalKewajiban - selectedTagihan.jumlahDibayar) && (
                  <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-200 space-y-1.5">
                    <p className="font-bold text-[11px] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Terdeteksi Kelebihan Bayar: {formatRupiah(bayarNominal - (selectedTagihan.totalKewajiban - selectedTagihan.jumlahDibayar))}</span>
                    </p>
                    <p className="text-[10px] text-teal-300">
                      Pilih opsi alokasi dana kelebihan sesuai alur SOP RT.03:
                    </p>
                    <select
                      value={kelebihanOption}
                      onChange={(e) => setKelebihanOption(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="titipan_bulan_depan">Simpan Titipan Iuran Bulan Depan</option>
                      <option value="donasi_kas">Dialihkan Sebagai Donasi Kas RT</option>
                      <option value="tarik_kembali">Ditarik Kembali Oleh Warga</option>
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
              onClick={() => setShowExpenseModal(true)}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pengeluaran (11 Komponen)</span>
            </button>
          </div>

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
              {pengeluaranList.map((exp) => (
                <div
                  key={exp.id}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-white block">{exp.komponen}</span>
                    <p className="text-[11px] text-slate-400">
                      {exp.tanggal} • {exp.keterangan || exp.namaPenerimaOrPekerjaan}
                    </p>
                    {exp.namaPenerimaOrPekerjaan && (
                      <span className="text-[10px] text-amber-400 font-medium">
                        Penerima / Pekerjaan: {exp.namaPenerimaOrPekerjaan}
                      </span>
                    )}
                  </div>

                  <span className="font-mono font-bold text-rose-400 shrink-0">
                    -{formatRupiah(exp.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Catatan Pemasukan Kas */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm">Catatan Pemasukan Kas Terakhir</h3>
            <div className="space-y-1.5 pt-1">
              {pemasukanList.slice(0, 6).map((inc) => (
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
              ))}
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
                  <h3 className="text-sm font-bold text-white">Input Pengeluaran SOP Kas RT</h3>
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
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
                    onClick={() => setShowExpenseModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Simpan Pengeluaran
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
        <div className="space-y-3">
          {/* Header Card */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <h3 className="text-sm font-bold text-white">Pembukuan Hutang & Piutang RT</h3>
            <p className="text-[11px] text-slate-400">
              Piutang Warga (Hak Kas RT) • Hutang RT (Kewajiban Material Tempo & Talangan Operasional)
            </p>
          </div>

          {/* Section 1: Hutang RT (Kewajiban Tempo Kas RT) */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ArrowDownRight className="w-4 h-4" />
                <span>Kewajiban Hutang RT (Material Tempo / Talangan)</span>
              </div>
              <span className="text-[11px] font-mono text-rose-300 font-bold">
                Sisa: {formatRupiah(hutangList.reduce((acc, curr) => acc + curr.sisaHutang, 0))}
              </span>
            </div>

            <div className="space-y-2">
              {hutangList.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{h.kreditur}</span>
                      <p className="text-[11px] text-slate-400">{h.deskripsi}</p>
                      <p className="text-[10px] text-slate-500">
                        Tanggal: {h.tanggal} • Jatuh Tempo: {h.jatuhTempo}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
                      Total: {formatRupiah(h.totalHutang)} • Sudah Bayar: {formatRupiah(h.sudahDibayar)}
                    </span>
                    <span className="font-mono font-bold text-rose-400">
                      Sisa: {formatRupiah(h.sisaHutang)}
                    </span>
                  </div>

                  {h.sisaHutang > 0 && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setSelectedHutang(h);
                          setCicilanNominal(h.sisaHutang);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs transition"
                      >
                        Bayar Cicilan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Piutang Warga (Hak Kas RT) */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ArrowUpRight className="w-4 h-4" />
                <span>Piutang Warga (Tunggakan & Denda Hak Kas RT)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                Total:{' '}
                {formatRupiah(
                  tagihanList
                    .filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar')
                    .reduce((acc, curr) => acc + (curr.totalKewajiban - curr.jumlahDibayar), 0)
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              {tagihanList
                .filter((t) => t.statusBayar !== 'Lunas' && t.statusBayar !== 'Lebih Bayar')
                .slice(0, 8)
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white">{t.nama}</span>
                      <p className="text-[10px] text-slate-400">
                        Kavling {t.blokNo} • Iuran: {formatRupiah(t.totalIuran)}
                        {t.totalDenda > 0 && ` + Denda: ${formatRupiah(t.totalDenda)}`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {formatRupiah(t.totalKewajiban - t.jumlahDibayar)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Bayar Cicilan Modal */}
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
        </div>
      )}

      {/* TAB 4: LAPORAN & REKAP KEUANGAN (BULANAN & TAHUNAN) */}
      {activeTab === 'laporan' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Laporan Keuangan Transparan</h3>
                <p className="text-[11px] text-slate-400">
                  Unduh PDF, Excel & Cetak format resmi RT.03 RW.14
                </p>
              </div>

              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="Bulanan">Periode Bulanan</option>
                <option value="Tahunan">Periode Tahunan</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-700/60">
              <button
                onClick={handleExportKasCSV}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Excel (.csv)</span>
              </button>
              <button
                onClick={openPrintDialog}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Report Layout */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="text-center border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-white text-sm uppercase">
                LAPORAN KAS RT.03 RW.14 PERUM BPTW CILACAP
              </h4>
              <p className="text-slate-400 text-[11px]">
                Periode: {reportPeriod === 'Bulanan' ? 'September 2026' : 'Tahun Berjalan 2026'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-white pb-1 border-b border-slate-800">
                <span>Total Penerimaan Iuran & Kas</span>
                <span className="text-emerald-400 font-mono">{formatRupiah(totalPemasukan)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pb-1 border-b border-slate-800">
                <span>Total Pengeluaran (11 Komponen SOP)</span>
                <span className="text-rose-400 font-mono">{formatRupiah(totalPengeluaran)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-white pt-1">
                <span>Saldo Kas Bersih Akhir</span>
                <span className="text-emerald-300 font-mono">{formatRupiah(pemasukanBersih)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
