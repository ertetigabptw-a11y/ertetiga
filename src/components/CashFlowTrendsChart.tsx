import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatRupiah } from '../utils/exportUtils';

interface CashFlowTrendsProps {
  currentPemasukan: number;
  currentPengeluaran: number;
  activePeriode: string;
}

export const CashFlowTrendsChart: React.FC<CashFlowTrendsProps> = ({
  currentPemasukan,
  currentPengeluaran,
  activePeriode,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Realistic monthly trend data leading up to October 2026
  const monthlyData = [
    {
      bulan: 'Juli 2026',
      shortName: 'Jul',
      pemasukan: 1850000,
      pengeluaran: 1200000,
      saldoBersih: 650000,
    },
    {
      bulan: 'Agustus 2026',
      shortName: 'Agt',
      pemasukan: 1980000,
      pengeluaran: 1450000,
      saldoBersih: 530000,
    },
    {
      bulan: 'September 2026',
      shortName: 'Sep',
      pemasukan: 2150000,
      pengeluaran: 1320000,
      saldoBersih: 830000,
    },
    {
      bulan: activePeriode || 'Oktober 2026',
      shortName: 'Okt',
      pemasukan: currentPemasukan > 0 ? currentPemasukan : 2250000,
      pengeluaran: currentPengeluaran > 0 ? currentPengeluaran : 850000,
      saldoBersih: (currentPemasukan > 0 ? currentPemasukan : 2250000) - (currentPengeluaran > 0 ? currentPengeluaran : 850000),
    },
  ];

  const totalMasuk4Bulan = monthlyData.reduce((acc, c) => acc + c.pemasukan, 0);
  const totalKeluar4Bulan = monthlyData.reduce((acc, c) => acc + c.pengeluaran, 0);
  const surplus4Bulan = totalMasuk4Bulan - totalKeluar4Bulan;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span style={{ color: entry.color }} className="font-semibold">
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatRupiah(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 space-y-4 shadow-sm">
      {/* Header & Chart Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tren Arus Kas Masuk & Keluar RT.03</h3>
            <p className="text-[11px] text-slate-600">
              Visualisasi Breakdown Bulanan (Periode Aktif & Historis)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
              chartType === 'bar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Batang</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
              chartType === 'line'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Garis</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-600 block flex items-center justify-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            <span>Pemasukan</span>
          </span>
          <p className="font-mono font-bold text-emerald-700 text-xs mt-0.5 truncate">
            {formatRupiah(totalMasuk4Bulan)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-600 block flex items-center justify-center gap-0.5 font-medium">
            <ArrowDownRight className="w-3 h-3 text-rose-600" />
            <span>Pengeluaran</span>
          </span>
          <p className="font-mono font-bold text-rose-700 text-xs mt-0.5 truncate">
            {formatRupiah(totalKeluar4Bulan)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-600 block font-medium">Surplus Bersih</span>
          <p className="font-mono font-bold text-teal-700 text-xs mt-0.5 truncate">
            {formatRupiah(surplus4Bulan)}
          </p>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="shortName"
                stroke="#94a3b8"
                fontSize={11}
                tick={{ fill: '#475569' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tick={{ fill: '#475569' }}
                tickFormatter={(val) => `${val / 1000}k`}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#334155' }}
                iconType="circle"
              />
              <Bar dataKey="pemasukan" name="Kas Masuk" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Kas Keluar" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="shortName"
                stroke="#94a3b8"
                fontSize={11}
                tick={{ fill: '#475569' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tick={{ fill: '#475569' }}
                tickFormatter={(val) => `${val / 1000}k`}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#334155' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="pemasukan"
                name="Kas Masuk"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#059669' }}
              />
              <Line
                type="monotone"
                dataKey="pengeluaran"
                name="Kas Keluar"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#e11d48' }}
              />
              <Line
                type="monotone"
                dataKey="saldoBersih"
                name="Saldo Surplus"
                stroke="#0891b2"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#0891b2' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
