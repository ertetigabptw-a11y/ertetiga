import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallBadge } from './PWAInstallBadge';
import { Logo3D } from './Logo3D';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, wargaList, users } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSearchWarga, setShowSearchWarga] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search resident for username
  const [searchWargaQuery, setSearchWargaQuery] = useState('');
  const [showWargaResults, setShowWargaResults] = useState(false);
  const [selectedWargaInfo, setSelectedWargaInfo] = useState<{
    nama: string;
    blokNo: string;
    username: string;
  } | null>(null);

  // List of all residents mapped to their system username
  const residentOptions = useMemo(() => {
    return wargaList
      .filter((w) => w.namaPenghuni && w.namaPenghuni.trim() !== '-' && w.namaPenghuni.trim() !== '')
      .map((w) => {
        const userAcc = users.find(
          (u) => u.wargaId === w.id || u.name.toLowerCase() === w.namaPenghuni.toLowerCase()
        );
        const resolvedUsername =
          userAcc?.username || w.namaPenghuni.toLowerCase().replace(/[^a-z0-9]/g, '');
        return {
          id: w.id,
          nama: w.namaPenghuni,
          blokNo: `Blok ${w.blok}/${w.noRumah}`,
          username: resolvedUsername,
          defaultPassword: userAcc?.password || '12345',
        };
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [wargaList, users]);

  // Filtered residents based on search query
  const filteredWarga = useMemo(() => {
    if (!searchWargaQuery.trim()) return residentOptions.slice(0, 8);
    const query = searchWargaQuery.toLowerCase().trim();
    return residentOptions.filter(
      (w) =>
        w.nama.toLowerCase().includes(query) ||
        w.blokNo.toLowerCase().includes(query) ||
        w.username.toLowerCase().includes(query)
    );
  }, [residentOptions, searchWargaQuery]);

  const handleSelectWarga = (item: (typeof residentOptions)[0]) => {
    setUsername(item.username);
    if (!password) {
      setPassword(item.defaultPassword);
    }
    setSelectedWargaInfo({
      nama: item.nama,
      blokNo: item.blokNo,
      username: item.username,
    });
    setSearchWargaQuery(item.nama);
    setShowWargaResults(false);
    setShowSearchWarga(false);
    setErrorMsg(null);
  };

  const handleClearWargaSearch = () => {
    setSearchWargaQuery('');
    setSelectedWargaInfo(null);
    setShowWargaResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim()) {
      setErrorMsg('Harap masukkan username atau pilih akun warga.');
      return;
    }
    if (!password) {
      setErrorMsg('Harap masukkan password.');
      return;
    }
    const result = login(username, password);
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
          <div className="flex justify-center mb-1">
            <Logo3D size="xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Neo <span className="text-indigo-600">PoRT3</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Portal Warga RT.03 RW.14 Perum BPTW Cilacap
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Ertetiga Selalu Di Hati...Wijaya! Wijaya!
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <PWAInstallBadge iconOnly />
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

          {/* Username / Akun Field dengan Tombol Bantuan Username */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-username" className="text-xs font-semibold text-slate-700 block">
                Username / Akun
              </label>
              <button
                type="button"
                onClick={() => setShowSearchWarga(!showSearchWarga)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                tabIndex={-1}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showSearchWarga ? 'Sembunyikan' : 'Bantuan Username'}</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (selectedWargaInfo && e.target.value !== selectedWargaInfo.username) {
                    setSelectedWargaInfo(null);
                  }
                }}
                placeholder="Masukkan username akun"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowSearchWarga(!showSearchWarga)}
                aria-label={showSearchWarga ? 'Sembunyikan bantuan username' : 'Bantuan username'}
                title={showSearchWarga ? 'Sembunyikan bantuan username' : 'Bantuan username'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
              >
                <HelpCircle className={`w-4 h-4 ${showSearchWarga ? 'text-indigo-600' : ''}`} />
              </button>
            </div>

            {selectedWargaInfo && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Akun warga: <strong>{selectedWargaInfo.nama}</strong> ({selectedWargaInfo.blokNo})
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                  @{selectedWargaInfo.username}
                </span>
              </div>
            )}

            {/* Panel Pencarian Bantuan Username */}
            {showSearchWarga && (
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100/90 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pencarian Nama Warga</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSearchWarga(false)}
                    className="text-[10px] text-indigo-600 hover:underline font-medium"
                  >
                    Tutup
                  </button>
                </div>

                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  Cari nama atau kavling Anda untuk mengisi username otomatis:
                </p>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="search-warga-input"
                    type="text"
                    value={searchWargaQuery}
                    onChange={(e) => {
                      setSearchWargaQuery(e.target.value);
                      setShowWargaResults(true);
                    }}
                    onFocus={() => setShowWargaResults(true)}
                    placeholder="Ketik nama warga atau kavling (contoh: Tito / A/1)..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-indigo-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm placeholder:text-slate-400"
                    autoFocus
                  />
                  {searchWargaQuery && (
                    <button
                      type="button"
                      onClick={handleClearWargaSearch}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown hasil pencarian warga */}
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl bg-white border border-indigo-100 p-1.5 shadow-sm">
                  {filteredWarga.length > 0 ? (
                    filteredWarga.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectWarga(item)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 flex items-center gap-1.5">
                            <span>{item.nama}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {item.blokNo}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Username:{' '}
                            <span className="font-mono font-semibold text-indigo-600">
                              {item.username}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded transition">
                          Pilih
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      Nama warga &quot;{searchWargaQuery}&quot; tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Password Field dengan Tombol Lihat Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 block">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Password</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            <span>Masuk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

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

