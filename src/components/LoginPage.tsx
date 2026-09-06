import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallBadge } from './PWAInstallBadge';
import {
  Lock,
  User,
  Shield,
  Crown,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchRoleDirectly, wargaList } = useApp();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('superadmin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedWargaId, setSelectedWargaId] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = login(username, password);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    const result = login(user, pass);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 antialiased text-slate-800">
      {/* Device Shell */}
      <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-200 p-6 sm:p-7 shadow-xl space-y-6">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-700 text-white font-black text-2xl shadow-lg shadow-indigo-200 mb-1">
            N
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Neo <span className="text-indigo-600">PoRT3</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Portal Warga RT.03 RW.14 Perum BPTW Cilacap
            </p>
            <p className="text-[11px] text-slate-400">
              Pelaporan Keluhan & Pemantauan Iuran Lingkungan Transparan
            </p>
          </div>
          
          <div className="pt-2 flex justify-center">
            <PWAInstallBadge />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Username / Akun</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username akun"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Masuk ke Portal Neo PoRT3</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Access Credentials Panel */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Akses Cepat Pengujian (1-Klik)
            </span>
            <span className="text-[10px] text-indigo-600 font-mono font-semibold">5 Role Terintegrasi</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin', 'superadmin123')}
              className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-slate-800 transition text-xs group"
            >
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold mb-0.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">superadmin / superadmin123</p>
            </button>

            {/* Ketua RT */}
            <button
              type="button"
              onClick={() => handleQuickLogin('ketua', 'ketua123')}
              className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-slate-800 transition text-xs group"
            >
              <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span>Ketua RT</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">ketua / ketua123</p>
            </button>

            {/* Keamanan */}
            <button
              type="button"
              onClick={() => handleQuickLogin('keamanan', 'keamanan123')}
              className="p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200 text-slate-800 transition text-xs group"
            >
              <div className="flex items-center gap-1.5 text-orange-800 font-bold mb-0.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Keamanan</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">keamanan / keamanan123</p>
            </button>

            {/* Bendahara */}
            <button
              type="button"
              onClick={() => handleQuickLogin('bendahara', 'bendahara123')}
              className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-slate-800 transition text-xs group"
            >
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-0.5">
                <Coins className="w-3.5 h-3.5" />
                <span>Bendahara</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">bendahara / bendahara123</p>
            </button>
          </div>

          {/* Quick Resident (Warga) Selector */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Akses Masuk Sebagai Warga</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Password: 12345</span>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedWargaId}
                onChange={(e) => setSelectedWargaId(Number(e.target.value))}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
              >
                {wargaList
                  .filter((w) => w.namaPenghuni && w.namaPenghuni !== '-')
                  .slice(0, 15)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.namaPenghuni} (Blok {w.blok}/{w.noRumah})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const target = wargaList.find((w) => w.id === selectedWargaId);
                  if (target) {
                    const cleanUsername = target.namaPenghuni.toLowerCase().replace(/[^a-z0-9]/g, '');
                    handleQuickLogin(cleanUsername, '12345');
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <p>© 2026 RT.03 RW.14 Perum BPTW Cilacap. All rights reserved.</p>
          <p className="mt-0.5 text-indigo-600 font-medium">
            Didukung WhatsApp Gateway Fonnte & PWA Android/iOS
          </p>
        </div>
      </div>
    </div>
  );
};
