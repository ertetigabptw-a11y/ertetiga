import React, { useState } from 'react';
import { Warga } from '../types';
import { formatRupiah } from '../utils/exportUtils';
import {
  Sliders,
  Search,
  CheckCircle2,
  Users,
  Building,
  Edit2,
  Sparkles,
  ArrowRight,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface KostumisasiIuranViewProps {
  wargaList: Warga[];
  onOpenEditModal: (warga: Warga) => void;
  onApplyQuickPreset: (
    wargaId: number,
    presetType: 'standar' | 'lansia' | 'luarkota' | 'bebas'
  ) => void;
  successFeedback: string | null;
}

export const KostumisasiIuranView: React.FC<KostumisasiIuranViewProps> = ({
  wargaList,
  onOpenEditModal,
  onApplyQuickPreset,
  successFeedback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'ALL' | 'STANDAR' | 'LANSIA' | 'LUAR_KOTA' | 'KOSONG' | 'KUSTOM'
  >('ALL');

  const getKomponenCategory = (w: Warga) => {
    if (w.totalIuran === 0 && w.dansosRT === 0 && w.dansosRW === 0) return 'KOSONG';
    if (
      w.dansosRT === 19000 &&
      w.dansosRW === 8000 &&
      w.pembangunan === 5000 &&
      w.snackRapat === 3000 &&
      w.jimpitan === 15000
    ) {
      return 'STANDAR';
    }
    if (
      w.dansosRT === 19000 &&
      w.dansosRW === 8000 &&
      w.pembangunan === 0 &&
      w.snackRapat === 3000 &&
      w.jimpitan === 0
    ) {
      return 'LANSIA';
    }
    if (
      w.dansosRT === 19000 &&
      w.dansosRW === 8000 &&
      w.pembangunan === 5000 &&
      w.snackRapat === 0 &&
      w.jimpitan === 0
    ) {
      return 'LUAR_KOTA';
    }
    return 'KUSTOM';
  };

  // Metrics
  const totalKK = wargaList.length;
  const countStandar = wargaList.filter((w) => getKomponenCategory(w) === 'STANDAR').length;
  const countLansia = wargaList.filter((w) => getKomponenCategory(w) === 'LANSIA').length;
  const countLuarKota = wargaList.filter((w) => getKomponenCategory(w) === 'LUAR_KOTA').length;
  const countKosong = wargaList.filter((w) => getKomponenCategory(w) === 'KOSONG').length;
  const countKustom = wargaList.filter((w) => getKomponenCategory(w) === 'KUSTOM').length;
  const totalPotensiKas = wargaList.reduce((acc, curr) => acc + (curr.totalIuran || 0), 0);

  const filteredWarga = wargaList.filter((w) => {
    const cat = getKomponenCategory(w);
    if (filterCategory !== 'ALL' && cat !== filterCategory) return false;

    const term = searchTerm.toLowerCase();
    const namaPenghuni = (w.namaPenghuni || '').toLowerCase();
    const namaPemilik = (w.namaPemilik || '').toLowerCase();
    const blok = `${w.blok}/${w.noRumah}`.toLowerCase();
    return namaPenghuni.includes(term) || namaPemilik.includes(term) || blok.includes(term);
  });

  return (
    <div className="space-y-3.5">
      {/* Success Notification Banner */}
      {successFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Kostumisasi Komponen Iuran Masing-Masing Warga
              </h3>
              <p className="text-xs text-slate-400">
                Alokasi 5 Komponen: Dansos RT (19k), Dansos RW (8k), Pembangunan (5k), Snack (3k), Jimpitan (15k)
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-right">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">
              Potensi Iuran Bulanan
            </span>
            <span className="font-mono text-sm font-black text-emerald-300">
              {formatRupiah(totalPotensiKas)}
            </span>
          </div>
        </div>

        {/* SOP Notice */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Sesuai kesepakatan RT: Warga <strong>Lansia</strong> dibebaskan dari iuran Pembangunan & Jimpitan (Rp 30.000/bln). Warga <strong>Luar Kota</strong> dibebaskan dari Snack & Jimpitan (Rp 32.000/bln). Rumah <strong>Kosong / Tanah</strong> dibebaskan (Rp 0). Penyesuaian otomatis memperbarui tagihan aktif dan neraca kas.
          </p>
        </div>

        {/* Metric Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilterCategory('STANDAR')}
            className={`p-2 rounded-xl border text-center transition ${
              filterCategory === 'STANDAR'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] block">Standar (50k)</span>
            <span className="font-mono text-xs font-black">{countStandar} KK</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('LANSIA')}
            className={`p-2 rounded-xl border text-center transition ${
              filterCategory === 'LANSIA'
                ? 'bg-purple-950 border-purple-500 text-purple-300 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] block">Lansia (30k)</span>
            <span className="font-mono text-xs font-black">{countLansia} KK</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('LUAR_KOTA')}
            className={`p-2 rounded-xl border text-center transition ${
              filterCategory === 'LUAR_KOTA'
                ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] block">Luar Kota (32k)</span>
            <span className="font-mono text-xs font-black">{countLuarKota} KK</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('KOSONG')}
            className={`p-2 rounded-xl border text-center transition ${
              filterCategory === 'KOSONG'
                ? 'bg-slate-800 border-slate-500 text-slate-200 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] block">Kosong/Bebas (0k)</span>
            <span className="font-mono text-xs font-black">{countKosong} KK</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('KUSTOM')}
            className={`p-2 rounded-xl border text-center transition ${
              filterCategory === 'KUSTOM'
                ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] block">Kustom Khusus</span>
            <span className="font-mono text-xs font-black">{countKustom} KK</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama warga / kavling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-slate-400">Filter Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="ALL">Semua Warga ({totalKK} KK)</option>
            <option value="STANDAR">Standar 50k ({countStandar})</option>
            <option value="LANSIA">Lansia 30k ({countLansia})</option>
            <option value="LUAR_KOTA">Luar Kota 32k ({countLuarKota})</option>
            <option value="KOSONG">Kosong/Bebas 0k ({countKosong})</option>
            <option value="KUSTOM">Kustom ({countKustom})</option>
          </select>
        </div>
      </div>

      {/* Table of Residents and Components */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">No & Kavling</th>
                <th className="py-2.5 px-3">Nama Warga</th>
                <th className="py-2.5 px-2 text-right">Dansos RT</th>
                <th className="py-2.5 px-2 text-right">Dansos RW</th>
                <th className="py-2.5 px-2 text-right">Sarpras</th>
                <th className="py-2.5 px-2 text-right">Snack</th>
                <th className="py-2.5 px-2 text-right">Jimpitan</th>
                <th className="py-2.5 px-3 text-right">Total Iuran</th>
                <th className="py-2.5 px-3 text-center">Status Profil</th>
                <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filteredWarga.map((w, idx) => {
                const cat = getKomponenCategory(w);
                const displayName =
                  w.namaPenghuni !== '-'
                    ? w.namaPenghuni
                    : w.namaPemilik
                    ? `${w.namaPemilik} (Pemilik)`
                    : `Rumah ${w.blok}/${w.noRumah}`;

                return (
                  <tr
                    key={w.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* No & Kavling */}
                    <td className="py-2.5 px-3 text-slate-400 font-sans">
                      <span className="font-mono text-slate-500 mr-1.5">{idx + 1}.</span>
                      <strong className="text-white">{w.blok}/{w.noRumah}</strong>
                    </td>

                    {/* Nama Warga */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-white">{displayName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{w.statusHuni}</span>
                        <span>•</span>
                        {w.statusUsiaPenghuni === 'Lansia' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold text-[9px]">
                            👴 Lansia
                          </span>
                        ) : w.statusUsiaPenghuni === 'Produktif' ? (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-semibold text-[9px]">
                            ⚡ Produktif
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                        <span>•</span>
                        <span>{w.domisiliKerja}</span>
                      </div>
                    </td>

                    {/* 5 Komponen */}
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {formatRupiah(w.dansosRT)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {formatRupiah(w.dansosRW)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {w.pembangunan > 0 ? (
                        formatRupiah(w.pembangunan)
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {w.snackRapat > 0 ? (
                        formatRupiah(w.snackRapat)
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {w.jimpitan > 0 ? (
                        formatRupiah(w.jimpitan)
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Total Iuran */}
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-black ${
                          w.totalIuran === 0
                            ? 'text-slate-500'
                            : w.totalIuran === 50000
                            ? 'text-emerald-400'
                            : w.totalIuran === 30000
                            ? 'text-purple-300'
                            : w.totalIuran === 32000
                            ? 'text-blue-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {formatRupiah(w.totalIuran)}
                      </span>
                    </td>

                    {/* Kategori Badge */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      {cat === 'STANDAR' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          Standar 50k
                        </span>
                      )}
                      {cat === 'LANSIA' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                          Lansia 30k
                        </span>
                      )}
                      {cat === 'LUAR_KOTA' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
                          Luar Kota 32k
                        </span>
                      )}
                      {cat === 'KOSONG' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Bebas / 0k
                        </span>
                      )}
                      {cat === 'KUSTOM' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          Kustom
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(w)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow active:scale-95"
                          title="Kostumisasi 5 komponen"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Ubah</span>
                        </button>

                        <div className="hidden sm:flex items-center gap-0.5">
                          {cat !== 'STANDAR' && (
                            <button
                              type="button"
                              onClick={() => onApplyQuickPreset(w.id, 'standar')}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                              title="Set Standar 50k"
                            >
                              50k
                            </button>
                          )}
                          {cat !== 'LANSIA' && (
                            <button
                              type="button"
                              onClick={() => onApplyQuickPreset(w.id, 'lansia')}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                              title="Set Lansia 30k"
                            >
                              30k
                            </button>
                          )}
                          {cat !== 'KOSONG' && (
                            <button
                              type="button"
                              onClick={() => onApplyQuickPreset(w.id, 'bebas')}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                              title="Set Bebas 0k"
                            >
                              0k
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
