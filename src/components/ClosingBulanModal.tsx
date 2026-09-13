import React, { useState } from 'react';
import { formatRupiah } from '../utils/exportUtils';
import {
  Calendar,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Coins,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react';

interface ClosingBulanModalProps {
  isOpen: boolean;
  activePeriode: string;
  onClose: () => void;
  onExecuteClosing: (namaPeriodeBaru: string) => {
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
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhirKas: number;
  totalPiutangWarga: number;
  countWargaPiutang: number;
  totalDepositWarga: number;
  countWargaDeposit: number;
}

export const ClosingBulanModal: React.FC<ClosingBulanModalProps> = ({
  isOpen,
  activePeriode,
  onClose,
  onExecuteClosing,
  totalPemasukan,
  totalPengeluaran,
  saldoAkhirKas,
  totalPiutangWarga,
  countWargaPiutang,
  totalDepositWarga,
  countWargaDeposit,
}) => {
  const [newPeriodeName, setNewPeriodeName] = useState<string>('Oktober 2026');
  const [confirmCheck, setConfirmCheck] = useState<boolean>(false);
  const [closingResult, setClosingResult] = useState<{
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
  } | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (!confirmCheck) return;
    const result = onExecuteClosing(newPeriodeName);
    setClosingResult(result);
  };

  const handleFinished = () => {
    setClosingResult(null);
    setConfirmCheck(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Closing Buku Kas & Buka Periode Baru
              </h3>
              <p className="text-xs text-slate-400">
                RT.03 RW.14 Perum BPTW • Sistem Akuntansi Saldo Berjalan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinished}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {closingResult ? (
          /* Success Screen */
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">
                Closing Buku Periode Berhasil!
              </h4>
              <p className="text-xs text-slate-300">
                Periode <strong className="text-emerald-400">{closingResult.periodeLama}</strong> resmi ditutup, dan periode baru <strong className="text-cyan-400">{closingResult.namaPeriodeBaru}</strong> telah aktif.
              </p>
            </div>

            {/* Rekap Saldo Berjalan */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Saldo Akhir Kas Riil (Dipindahkan):</span>
                <span className="font-mono font-bold text-emerald-300">
                  {formatRupiah(closingResult.saldoAkhirKas)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Akumulasi Piutang Warga:</span>
                <span className="font-mono font-bold text-rose-300">
                  {formatRupiah(closingResult.totalPiutangAkumulasi)} ({closingResult.wargaMenunggakCount} KK)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Saldo Deposit Warga Berjalan:</span>
                <span className="font-mono font-bold text-teal-300">
                  {formatRupiah(closingResult.totalDepositAkumulasi)} ({closingResult.wargaDepositCount} KK)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 text-left space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                Catatan Transisi Otomatis:
              </span>
              <p className="text-[11px] text-slate-300">
                • Seluruh sisa kewajiban iuran otomatis menjadi <strong>Piutang Bulan Lalu</strong> pada lembar tagihan {closingResult.namaPeriodeBaru}.
              </p>
              <p className="text-[11px] text-slate-300">
                • Saldo deposit warga yang tersisa otomatis menjadi <strong>Deposit Bulan Lalu</strong> dan memotong tagihan baru secara otomatis.
              </p>
              <p className="text-[11px] text-slate-300">
                • Saldo akhir kas riil telah tercatat sebagai <strong>Saldo Awal Kas</strong> di buku kas periode baru.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinished}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
            >
              Selesai & Buka Lembar Tagihan Periode Baru
            </button>
          </div>
        ) : (
          /* Confirmation & Review Screen */
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Periode Info Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                  Periode yang Akan Ditutup:
                </span>
                <span className="text-sm font-black text-white">{activePeriode}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 block">
                    Periode Baru:
                  </span>
                  <span className="text-sm font-black text-white">{newPeriodeName}</span>
                </div>
              </div>
            </div>

            {/* Ringkasan Neraca Kas Periode Ini */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. Posisi Kas Riil yang Akan Dipindahkan:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Penerimaan</span>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {formatRupiah(totalPemasukan)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Pengeluaran</span>
                  <span className="font-mono text-xs font-black text-rose-400">
                    {formatRupiah(totalPengeluaran)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold block">Saldo Akhir Kas Riil</span>
                  <span className="font-mono text-xs font-black text-emerald-300">
                    {formatRupiah(saldoAkhirKas)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ringkasan Piutang & Deposit yang Dialihkan */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Rekapitulasi Hak & Kewajiban Berjalan:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Piutang Iuran Dialihkan
                  </span>
                  <span className="font-mono text-sm font-black text-rose-300 block">
                    {formatRupiah(totalPiutangWarga)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {countWargaPiutang} KK warga menunggak akan otomatis masuk sebagai Piutang Bulan Lalu.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Saldo Deposit Dialihkan
                  </span>
                  <span className="font-mono text-sm font-black text-teal-300 block">
                    {formatRupiah(totalDepositWarga)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {countWargaDeposit} KK warga dengan kelebihan bayar otomatis memotong tagihan baru.
                  </span>
                </div>
              </div>
            </div>

            {/* Input Nama Periode Baru */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <label htmlFor="namaPeriodeInput" className="text-xs font-bold text-slate-300 block">
                Nama Periode Buku Kas Baru:
              </label>
              <input
                id="namaPeriodeInput"
                type="text"
                value={newPeriodeName}
                onChange={(e) => setNewPeriodeName(e.target.value)}
                placeholder="Contoh: Oktober 2026"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                Nama periode ini akan tertera pada kartu tagihan dan laporan keuangan berikutnya.
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={confirmCheck}
                  onChange={(e) => setConfirmCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                />
                <span className="leading-snug">
                  Saya telah memeriksa rekapitulasi kas dan mengonfirmasi untuk melakukan <strong>Closing Buku Periode {activePeriode}</strong> serta mengalihkan saldo berjalan ke <strong>{newPeriodeName}</strong>.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="p-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!confirmCheck}
                onClick={handleExecute}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 ${
                  confirmCheck
                    ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Closing & Buka Periode Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
