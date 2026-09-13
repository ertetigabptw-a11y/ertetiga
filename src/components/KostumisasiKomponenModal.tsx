import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/exportUtils';
import { X, Check, Sliders, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface KostumisasiKomponenModalProps {
  isOpen: boolean;
  warga: {
    id: number;
    nama: string;
    blokNo: string;
    statusUsiaPenghuni?: 'Produktif' | 'Lansia' | '-';
    dansosRT: number;
    dansosRW: number;
    pembangunan: number;
    snackRapat: number;
    jimpitan: number;
  } | null;
  onClose: () => void;
  onSave: (
    wargaId: number,
    komponen: {
      dansosRT: number;
      dansosRW: number;
      pembangunan: number;
      snackRapat: number;
      jimpitan: number;
    }
  ) => void;
}

export const KostumisasiKomponenModal: React.FC<KostumisasiKomponenModalProps> = ({
  isOpen,
  warga,
  onClose,
  onSave,
}) => {
  const [dansosRT, setDansosRT] = useState<number>(19000);
  const [dansosRW, setDansosRW] = useState<number>(8000);
  const [pembangunan, setPembangunan] = useState<number>(5000);
  const [snackRapat, setSnackRapat] = useState<number>(3000);
  const [jimpitan, setJimpitan] = useState<number>(15000);

  useEffect(() => {
    if (warga) {
      setDansosRT(warga.dansosRT ?? 19000);
      setDansosRW(warga.dansosRW ?? 8000);
      setPembangunan(warga.pembangunan ?? 5000);
      setSnackRapat(warga.snackRapat ?? 3000);
      setJimpitan(warga.jimpitan ?? 15000);
    }
  }, [warga]);

  if (!isOpen || !warga) return null;

  const totalIuran = dansosRT + dansosRW + pembangunan + snackRapat + jimpitan;

  const applyPreset = (type: 'standar' | 'lansia' | 'luarkota' | 'bebas') => {
    if (type === 'standar') {
      setDansosRT(19000);
      setDansosRW(8000);
      setPembangunan(5000);
      setSnackRapat(3000);
      setJimpitan(15000);
    } else if (type === 'lansia') {
      setDansosRT(19000);
      setDansosRW(8000);
      setPembangunan(0);
      setSnackRapat(3000);
      setJimpitan(0);
    } else if (type === 'luarkota') {
      setDansosRT(19000);
      setDansosRW(8000);
      setPembangunan(5000);
      setSnackRapat(0);
      setJimpitan(0);
    } else if (type === 'bebas') {
      setDansosRT(0);
      setDansosRW(0);
      setPembangunan(0);
      setSnackRapat(0);
      setJimpitan(0);
    }
  };

  const handleSave = () => {
    onSave(warga.id, {
      dansosRT,
      dansosRW,
      pembangunan,
      snackRapat,
      jimpitan,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Kostumisasi 5 Komponen Iuran</h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{warga.nama} • Kavling {warga.blokNo}</span>
                {warga.statusUsiaPenghuni && warga.statusUsiaPenghuni !== '-' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      warga.statusUsiaPenghuni === 'Lansia'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    {warga.statusUsiaPenghuni === 'Lansia' ? '👴 Lansia' : '⚡ Produktif'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Preset Cepat:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('standar')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-semibold text-center transition active:scale-95"
              >
                Standar (50k)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('lansia')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs font-semibold text-center transition active:scale-95"
              >
                Lansia (30k)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('luarkota')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-semibold text-center transition active:scale-95"
              >
                Luar Kota (32k)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('bebas')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold text-center transition active:scale-95"
              >
                Bebas / Kosong (0k)
              </button>
            </div>
          </div>

          {/* Form 5 Komponen */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
              Rincian Nominal 5 Komponen Warga:
            </span>

            {/* Dansos RT */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="dansosRTInput" className="text-slate-300 font-medium">
                1. Dansos RT (Rutin Kas RT)
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">Rp</span>
                <input
                  id="dansosRTInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={dansosRT}
                  onChange={(e) => setDansosRT(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dansos RW */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="dansosRWInput" className="text-slate-300 font-medium">
                2. Dansos RW (Rutin Kas RW)
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">Rp</span>
                <input
                  id="dansosRWInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={dansosRW}
                  onChange={(e) => setDansosRW(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Pembangunan */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="pembangunanInput" className="text-slate-300 font-medium">
                3. Pembangunan Sarpras
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">Rp</span>
                <input
                  id="pembangunanInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={pembangunan}
                  onChange={(e) => setPembangunan(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Snack Rapat */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="snackInput" className="text-slate-300 font-medium">
                4. Snack Rapat Warga
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">Rp</span>
                <input
                  id="snackInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={snackRapat}
                  onChange={(e) => setSnackRapat(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Jimpitan */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="jimpitanInput" className="text-slate-300 font-medium">
                5. Jimpitan / Kebersihan
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">Rp</span>
                <input
                  id="jimpitanInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={jimpitan}
                  onChange={(e) => setJimpitan(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-300 block">Total Iuran Wajib Baru</span>
              <span className="text-[10px] text-slate-400">
                Akan langsung diterapkan pada kartu tagihan bulan berjalan
              </span>
            </div>
            <span className="font-mono text-lg font-black text-emerald-300">
              {formatRupiah(totalIuran)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
