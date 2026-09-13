import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { PemasukanKas, PengeluaranKas, TagihanWarga } from '../types';
import { formatRupiah } from '../utils/exportUtils';

interface CashFlowTrendChartProps {
  pemasukanList: PemasukanKas[];
  pengeluaranList: PengeluaranKas[];
  tagihanList: TagihanWarga[];
  activePeriode?: string;
  year?: number;
}

const MONTH_DEFS = [
  { key: '01', name: 'Jan', fullName: 'Januari' },
  { key: '02', name: 'Feb', fullName: 'Februari' },
  { key: '03', name: 'Mar', fullName: 'Maret' },
  { key: '04', name: 'Apr', fullName: 'April' },
  { key: '05', name: 'Mei', fullName: 'Mei' },
  { key: '06', name: 'Jun', fullName: 'Juni' },
  { key: '07', name: 'Jul', fullName: 'Juli' },
  { key: '08', name: 'Agu', fullName: 'Agustus' },
  { key: '09', name: 'Sep', fullName: 'September' },
  { key: '10', name: 'Okt', fullName: 'Oktober' },
  { key: '11', name: 'Nov', fullName: 'November' },
  { key: '12', name: 'Des', fullName: 'Desember' },
];

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({
  pemasukanList = [],
  pengeluaranList = [],
  tagihanList = [],
  activePeriode = 'September 2026',
  year = 2026,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [timeRange, setTimeRange] = useState<'all' | 'semester2' | 'last6'>('all');
  const [includeIuran, setIncludeIuran] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Active month index from activePeriode (e.g. 'September 2026' => 8 for Sep)
  const activeMonthIdx = useMemo(() => {
    const lower = activePeriode.toLowerCase();
    const idx = MONTH_DEFS.findIndex((m) => lower.includes(m.fullName.toLowerCase()) || lower.includes(m.name.toLowerCase()));
    return idx >= 0 ? idx : 8; // Default September (idx 8)
  }, [activePeriode]);

  // Aggregate monthly data
  const monthlyData = useMemo(() => {
    let runningBalance = 0;

    return MONTH_DEFS.map((m, idx) => {
      const monthPrefix = `${year}-${m.key}`;

      // 1. Direct Kas In records
      const directKasIn = (pemasukanList || []).filter((p) => {
        if (!p.tanggal) return false;
        return p.tanggal.startsWith(monthPrefix);
      }).reduce((sum, p) => sum + (p.nominal || 0), 0);

      // 2. Realized Iuran payments
      let iuranPayments = 0;
      if (includeIuran) {
        // Match either tglBayar in this month, or active period for currently recorded payments
        iuranPayments = (tagihanList || []).reduce((sum, t) => {
          if (!t.jumlahDibayar || t.jumlahDibayar <= 0) return sum;
          if (t.tglBayar && t.tglBayar.startsWith(monthPrefix)) {
            return sum + t.jumlahDibayar;
          }
          // If no specific tglBayar, assign to activeMonthIdx if tagihan belongs to active period
          if (!t.tglBayar && idx === activeMonthIdx) {
            return sum + t.jumlahDibayar;
          }
          return sum;
        }, 0);
      }

      const totalKasMasuk = directKasIn + iuranPayments;

      // 3. Kas Out records
      const totalKasKeluar = (pengeluaranList || []).filter((p) => {
        if (!p.tanggal) return false;
        return p.tanggal.startsWith(monthPrefix);
      }).reduce((sum, p) => sum + (p.nominal || 0), 0);

      const netSurplus = totalKasMasuk - totalKasKeluar;
      runningBalance += netSurplus;

      return {
        monthKey: m.key,
        bulan: m.name,
        namaLengkap: `${m.fullName} ${year}`,
        directKasIn,
        iuranPayments,
        kasMasuk: totalKasMasuk,
        kasKeluar: totalKasKeluar,
        netSurplus,
        saldoKumulatif: runningBalance,
        isCurrent: idx === activeMonthIdx,
      };
    });
  }, [pemasukanList, pengeluaranList, tagihanList, includeIuran, year, activeMonthIdx]);

  // Filtered dataset according to time range
  const filteredData = useMemo(() => {
    if (timeRange === 'semester2') {
      return monthlyData.slice(6); // Jul - Des
    }
    if (timeRange === 'last6') {
      // 6 months ending at activeMonthIdx or last month
      const end = Math.min(12, Math.max(6, activeMonthIdx + 1));
      return monthlyData.slice(Math.max(0, end - 6), end);
    }
    return monthlyData; // All 12 months
  }, [monthlyData, timeRange, activeMonthIdx]);

  // Summary KPI calculations
  const totalMasukPeriode = useMemo(() => filteredData.reduce((s, d) => s + d.kasMasuk, 0), [filteredData]);
  const totalKeluarPeriode = useMemo(() => filteredData.reduce((s, d) => s + d.kasKeluar, 0), [filteredData]);
  const netSurplusPeriode = totalMasukPeriode - totalKeluarPeriode;
  const avgMasuk = filteredData.length > 0 ? Math.round(totalMasukPeriode / filteredData.length) : 0;
  const avgKeluar = filteredData.length > 0 ? Math.round(totalKeluarPeriode / filteredData.length) : 0;

  // Best surplus month
  const bestMonth = useMemo(() => {
    if (filteredData.length === 0) return null;
    return [...filteredData].sort((a, b) => b.netSurplus - a.netSurplus)[0];
  }, [filteredData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[190px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {dataPoint.namaLengkap}
            </span>
            {dataPoint.isCurrent && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40">
                Aktif
              </span>
            )}
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Kas Masuk:
              </span>
              <span className="font-mono font-bold">{formatRupiah(dataPoint.kasMasuk)}</span>
            </div>

            {includeIuran && dataPoint.iuranPayments > 0 && (
              <div className="pl-3 text-[10px] text-slate-400 flex justify-between">
                <span>• Iuran Warga:</span>
                <span className="font-mono">{formatRupiah(dataPoint.iuranPayments)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Kas Keluar:
              </span>
              <span className="font-mono font-bold">-{formatRupiah(dataPoint.kasKeluar)}</span>
            </div>

            <div className="border-t border-slate-800 pt-1 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Surplus / Defisit:</span>
              <span
                className={`font-mono font-bold ${
                  dataPoint.netSurplus >= 0 ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {dataPoint.netSurplus >= 0 ? '+' : ''}
                {formatRupiah(dataPoint.netSurplus)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-teal-300 font-semibold pt-0.5">
              <span>Saldo Kumulatif:</span>
              <span className="font-mono font-bold">{formatRupiah(dataPoint.saldoKumulatif)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg text-xs">
      {/* Header & Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-0.5">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Visualisasi Arus Kas Bulanan
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Tren Arus Kas Masuk & Keluar RT.03 ({year})
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Breakdown bulanan realisasi pemasukan kas, iuran warga, dan pengeluaran operasional SOP RT.
          </p>
        </div>

        {/* Controls: Chart Type, Range & Include Iuran */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chart Type Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                chartType === 'bar'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grafik Batang Komparasi Masuk vs Keluar"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Batang</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                chartType === 'area'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grafik Area Tren Kas"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                chartType === 'line'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grafik Garis Saldo Kumulatif"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Garis</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">12 Bulan ({year})</option>
            <option value="semester2">Semester II (Jul-Des)</option>
            <option value="last6">6 Bulan Terakhir</option>
          </select>

          {/* Include Iuran Checkbox */}
          <button
            type="button"
            onClick={() => setIncludeIuran(!includeIuran)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              includeIuran
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Sertakan realisasi pembayaran iuran warga ke dalam arus kas masuk"
          >
            {includeIuran ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Iuran Warga</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] uppercase font-bold">Total Masuk</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-mono font-bold text-sm text-emerald-400 truncate">
            {formatRupiah(totalMasukPeriode)}
          </p>
          <span className="text-[9px] text-slate-500 block">Rata2: {formatRupiah(avgMasuk)}/bln</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] uppercase font-bold">Total Keluar</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="font-mono font-bold text-sm text-rose-400 truncate">
            {formatRupiah(totalKeluarPeriode)}
          </p>
          <span className="text-[9px] text-slate-500 block">Rata2: {formatRupiah(avgKeluar)}/bln</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] uppercase font-bold">Surplus / Defisit</span>
            {netSurplusPeriode >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <p
            className={`font-mono font-bold text-sm truncate ${
              netSurplusPeriode >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {netSurplusPeriode >= 0 ? '+' : ''}
            {formatRupiah(netSurplusPeriode)}
          </p>
          <span className="text-[9px] text-slate-500 block">
            {netSurplusPeriode >= 0 ? 'Kas Surplus Positif' : 'Defisit Pengeluaran'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] uppercase font-bold">Puncak Surplus</span>
            <Wallet className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="font-mono font-bold text-sm text-teal-300 truncate">
            {bestMonth && bestMonth.netSurplus > 0 ? bestMonth.bulan : '-'}
          </p>
          <span className="text-[9px] text-slate-500 block truncate">
            {bestMonth && bestMonth.netSurplus > 0
              ? `+${formatRupiah(bestMonth.netSurplus)}`
              : 'Belum ada surplus'}
          </span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={filteredData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="bulan"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Bar
                  dataKey="kasMasuk"
                  name="Kas Masuk"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="kasKeluar"
                  name="Kas Keluar"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            ) : chartType === 'area' ? (
              <AreaChart data={filteredData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="bulan"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="kasMasuk"
                  name="Kas Masuk"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMasuk)"
                />
                <Area
                  type="monotone"
                  dataKey="kasKeluar"
                  name="Kas Keluar"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorKeluar)"
                />
              </AreaChart>
            ) : (
              <LineChart data={filteredData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="bulan"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="kasMasuk"
                  name="Kas Masuk"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="kasKeluar"
                  name="Kas Keluar"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="saldoKumulatif"
                  name="Saldo Kumulatif"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#06b6d4' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Hint Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2.5 mt-1 border-t border-slate-900 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Kas Masuk {includeIuran ? '(Iuran & Lainnya)' : '(Kas Langsung)'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              Kas Keluar (11 Komponen SOP)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
          >
            <Info className="w-3 h-3" />
            <span>{showTable ? 'Tutup Tabel Rincian' : 'Lihat Tabel Rincian Bulanan'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Monthly Breakdown Table */}
      {showTable && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2 font-bold">Bulan</th>
                <th className="py-1.5 px-2 font-bold text-right text-emerald-400">Kas Masuk</th>
                <th className="py-1.5 px-2 font-bold text-right text-rose-400">Kas Keluar</th>
                <th className="py-1.5 px-2 font-bold text-right">Surplus / (Defisit)</th>
                <th className="py-1.5 px-2 font-bold text-right text-teal-400">Saldo Kumulatif</th>
                <th className="py-1.5 px-2 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredData.map((row) => (
                <tr
                  key={row.monthKey}
                  className={`hover:bg-slate-900/60 ${row.isCurrent ? 'bg-emerald-950/20' : ''}`}
                >
                  <td className="py-1.5 px-2 font-sans font-medium text-white flex items-center gap-1.5">
                    <span>{row.namaLengkap}</span>
                    {row.isCurrent && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900 text-emerald-300 font-bold font-sans">
                        Bulan Ini
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right text-emerald-400">
                    {formatRupiah(row.kasMasuk)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-rose-400">
                    {formatRupiah(row.kasKeluar)}
                  </td>
                  <td
                    className={`py-1.5 px-2 text-right font-bold ${
                      row.netSurplus >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {row.netSurplus >= 0 ? '+' : ''}
                    {formatRupiah(row.netSurplus)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-teal-300">
                    {formatRupiah(row.saldoKumulatif)}
                  </td>
                  <td className="py-1.5 px-2 text-center font-sans">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        row.netSurplus > 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : row.netSurplus < 0
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row.netSurplus > 0 ? 'Surplus' : row.netSurplus < 0 ? 'Defisit' : 'Nihil'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
