import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import {
  Crown,
  Key,
  Users,
  Shield,
  Coins,
  Settings,
  Sparkles,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Clock,
  Radio,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface SuperAdminModuleProps {
  activeTab: string;
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({ activeTab }) => {
  const {
    users,
    updateUserAccount,
    switchRoleDirectly,
    settings,
    updateSettings,
    resetAllData,
    sendWhatsAppDirect,
    wargaList,
    syncStatus,
    forceSyncToCloud,
  } = useApp();

  // Settings form state
  const [fonnteToken, setFonnteToken] = useState(settings.fonnteToken);
  const [targetGroupWa, setTargetGroupWa] = useState(settings.targetGroupWa);
  const [posLat, setPosLat] = useState(settings.posRondaLat);
  const [posLng, setPosLng] = useState(settings.posRondaLng);
  const [posRadius, setPosRadius] = useState(settings.posRondaRadiusMeters);
  const [jamMulai, setJamMulai] = useState(settings.jamMulaiRonda);
  const [jamSelesai, setJamSelesai] = useState(settings.jamSelesaiRonda);
  const [bypassRadius, setBypassRadius] = useState(settings.bypassRadiusCheck);
  const [bypassJam, setBypassJam] = useState(settings.bypassJamCheck);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editKontakHp, setEditKontakHp] = useState('');

  // WhatsApp broadcast test state
  const [testTarget, setTestTarget] = useState(settings.targetGroupWa);
  const [testMsg, setTestMsg] = useState(
    'Halo Warga RT.03 RW.14 Perum BPTW Cilacap! Ini adalah pesan uji coba terhubung dari sistem portal Neo PoRT3 via WhatsApp Gateway Fonnte.'
  );
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: boolean; message: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      fonnteToken,
      targetGroupWa,
      posRondaLat: Number(posLat),
      posRondaLng: Number(posLng),
      posRondaRadiusMeters: Number(posRadius),
      jamMulaiRonda: jamMulai,
      jamSelesaiRonda: jamSelesai,
      bypassRadiusCheck: bypassRadius,
      bypassJamCheck: bypassJam,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleStartEditUser = (user: (typeof users)[0]) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword('');
    setEditJabatan(user.jabatan || '');
    setEditKontakHp(user.kontakHp || '');
  };

  const handleSaveUser = (userId: string) => {
    if (!editUsername.trim() || !editName.trim()) return;
    updateUserAccount(userId, {
      name: editName.trim(),
      username: editUsername.trim(),
      ...(editPassword ? { password: editPassword.trim() } : {}),
      jabatan: editJabatan.trim(),
      kontakHp: editKontakHp.trim(),
    });
    setEditingUserId(null);
  };

  const handleTestWhatsApp = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await sendWhatsAppDirect(testTarget, testMsg);
      setSendResult({
        status: res.status,
        message: res.message || (res.status ? 'Pesan berhasil dikirim via Fonnte!' : 'Gagal mengirim pesan'),
      });
    } catch (err: any) {
      setSendResult({
        status: false,
        message: err.message || 'Terjadi kesalahan jaringan/gateway',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Super Admin Top Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-700 mb-1">
          <Crown className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Super Administrator</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Pusat Otoritas & Pengaturan Sistem</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Kelola kredensial akun semua role, integrasi WhatsApp Fonnte, dan akses 4 modul di bawahnya.
        </p>
      </div>

      {/* 4 Quick Access Buttons to Sub-Roles */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>4 Tombol Akses Masuk Semua Role</span>
          </div>
          <span className="text-[10px] text-purple-400 font-semibold bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
            Akses Otoriter
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => switchRoleDirectly('ketua_rt')}
            className="p-3 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-left transition active:scale-95 group"
          >
            <div className="flex items-center justify-between text-amber-300 font-bold text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>1. Ketua RT</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400">Data warga, surat resmi, kerja bakti</p>
          </button>

          <button
            onClick={() => switchRoleDirectly('keamanan')}
            className="p-3 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/40 text-left transition active:scale-95 group"
          >
            <div className="flex items-center justify-between text-blue-300 font-bold text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>2. Keamanan</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400">Presensi GPS, selfie, jadwal & denda</p>
          </button>

          <button
            onClick={() => switchRoleDirectly('bendahara')}
            className="p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-left transition active:scale-95 group"
          >
            <div className="flex items-center justify-between text-emerald-300 font-bold text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>3. Bendahara</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400">Iuran, kas RT, denda, hutang-piutang</p>
          </button>

          <button
            onClick={() => switchRoleDirectly('warga')}
            className="p-3 rounded-xl bg-teal-950/50 hover:bg-teal-900/60 border border-teal-500/40 text-left transition active:scale-95 group"
          >
            <div className="flex items-center justify-between text-teal-300 font-bold text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>4. Warga</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400">Presensi ronda, iuran saya, keluhan</p>
          </button>
        </div>
      </div>

      {/* Tab: Settings System & Integration */}
      {(activeTab === 'settings' || activeTab === 'preview_all') && (
        <div className="space-y-4">
          <form onSubmit={handleSaveSettings} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Pengaturan Fitur & Parameter</h3>
              </div>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
            </div>

            {/* Cloud Firebase Multi-Device Sync Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sinkronisasi Cloud Firebase</h4>
                    <p className="text-[10px] text-slate-400">
                      Real-time database antarperangkat (HP, Tablet, Laptop)
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    syncStatus.isConnected
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : syncStatus.isSyncing
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {syncStatus.isConnected
                    ? 'Terhubung'
                    : syncStatus.isSyncing
                    ? 'Menghubungkan'
                    : 'Offline'}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-mono text-sky-300 font-semibold">Google Cloud Firestore</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sinkron Terakhir:</span>
                  <span className="font-mono text-slate-200">
                    {syncStatus.lastSyncTime
                      ? new Date(syncStatus.lastSyncTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Baru Saja'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Oleh:</span>
                  <span className="text-slate-300 font-medium">
                    {syncStatus.lastUpdatedBy || 'Sistem RT.03'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-slate-400 leading-tight">
                  Semua input data (presensi ronda, tagihan kas, pengumuman, aspirasi) langsung terupdate di semua HP pengurus dan warga tanpa refresh.
                </p>
                <button
                  type="button"
                  onClick={() => forceSyncToCloud()}
                  disabled={syncStatus.isSyncing}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-md shadow-sky-950 transition active:scale-95"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>Sync Sekarang</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Fonnte Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-700/60">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                1. Integrasi WhatsApp Gateway (Fonnte)
              </h4>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium block">
                  Token Fonnte (API Authorization):
                </label>
                <input
                  type="text"
                  required
                  value={fonnteToken}
                  onChange={(e) => setFonnteToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium block">
                  ID Grup WhatsApp Tujuan (RT.03 RW.14):
                </label>
                <input
                  type="text"
                  required
                  value={targetGroupWa}
                  onChange={(e) => setTargetGroupWa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Pos Ronda Geofence Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-700/60">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Geofence Pos Ronda RT.03</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Latitude Pos:</label>
                  <input
                    type="number"
                    step="any"
                    value={posLat}
                    onChange={(e) => setPosLat(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Longitude Pos:</label>
                  <input
                    type="number"
                    step="any"
                    value={posLng}
                    onChange={(e) => setPosLng(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">
                  Radius Toleransi Presensi (meter):
                </label>
                <input
                  type="number"
                  value={posRadius}
                  onChange={(e) => setPosRadius(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Jam Presensi Ronda */}
            <div className="space-y-3 pt-2 border-t border-slate-700/60">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Jam Presensi Ronda Malam</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Jam Mulai:</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Jam Selesai:</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Demo Testing Bypass Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-700/60 bg-slate-900/50 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-teal-300 block">
                Mode Uji Coba / Demo Bypass (Memudahkan Review Kapan Saja):
              </span>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bypassRadius}
                  onChange={(e) => setBypassRadius(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span>Izinkan presensi di luar radius GPS pos ronda (Demo mode)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bypassJam}
                  onChange={(e) => setBypassJam(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span>Izinkan presensi di luar jam malam 22:00 - 23:59 (Demo mode)</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetAllData}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 px-3 py-2 rounded-xl border border-rose-500/30 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data Sistem</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: User Credentials & Password Reset */}
      {activeTab === 'users' && (
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Kelola & Reset Password Semua Role</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {users.map((u) => {
              const isEditing = editingUserId === u.id;
              return (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{u.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-mono uppercase">
                          {u.role}
                        </span>
                      </div>
                      {u.jabatan && (
                        <p className="text-[11px] text-amber-300 font-medium mt-0.5">
                          {u.jabatan}
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEditUser(u)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium border border-purple-500/30 transition"
                      >
                        Edit Profil & Akun
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-1 pt-1">
                      <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                        <div>
                          Username: <span className="text-slate-200 font-bold">{u.username}</span>
                        </div>
                        <div>
                          Password: <span className="text-slate-200">•••••••• ({u.password})</span>
                        </div>
                      </div>
                      {u.kontakHp && (
                        <div className="text-[11px] text-slate-400">
                          Kontak/WA: <span className="text-emerald-400 font-mono">{u.kontakHp}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-800 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Nama Lengkap Pengurus/User:</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Jabatan / Peran:</label>
                          <input
                            type="text"
                            placeholder="Contoh: Ketua RT.03 / Bendahara Kas"
                            value={editJabatan}
                            onChange={(e) => setEditJabatan(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">No. Kontak / WhatsApp:</label>
                        <input
                          type="text"
                          placeholder="628123456789"
                          value={editKontakHp}
                          onChange={(e) => setEditKontakHp(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Username Login:</label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Password Baru:</label>
                          <input
                            type="text"
                            placeholder="Biarkan kosong jika tetap"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingUserId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveUser(u.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Simpan Profil & Akun
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Broadcast WA Test */}
      {activeTab === 'broadcast' && (
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Uji Coba Pengiriman WhatsApp Fonnte</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Nomor Tujuan / ID Grup:</label>
              <input
                type="text"
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                placeholder="628... atau ID Grup"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setTestTarget(settings.targetGroupWa)}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Gunakan Grup RT.03 (Default)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Pesan:</label>
              <textarea
                rows={4}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            {sendResult && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 ${
                  sendResult.status
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                }`}
              >
                {sendResult.status ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{sendResult.message}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={sending || !testMsg.trim()}
              onClick={handleTestWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Mengirim ke Gateway...' : 'Kirim Pesan WhatsApp Sekarang'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
