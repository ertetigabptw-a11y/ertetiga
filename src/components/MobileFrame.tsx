import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { PWAInstallBadge } from './PWAInstallBadge';
import {
  Shield,
  Users,
  Coins,
  UserCheck,
  Crown,
  LogOut,
  ChevronDown,
  Bell,
  MessageSquare,
  Sparkles,
  Layers,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const {
    currentUser,
    currentRole,
    switchRoleDirectly,
    logout,
    wargaList,
    sendWhatsAppDirect,
    settings,
  } = useApp();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [quickWaTarget, setQuickWaTarget] = useState(settings.targetGroupWa);
  const [quickWaMsg, setQuickWaMsg] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<{ success: boolean; msg: string } | null>(null);

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'ketua_rt':
        return 'Ketua RT';
      case 'keamanan':
        return 'Keamanan';
      case 'bendahara':
        return 'Bendahara';
      case 'warga':
        return 'Warga';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'ketua_rt':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'keamanan':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'bendahara':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'warga':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Define tabs with concise mobile labels
  const getTabsForRole = () => {
    switch (currentRole) {
      case 'superadmin':
        return [
          { id: 'settings', label: 'Pengaturan', icon: Crown },
          { id: 'users', label: 'Akun & Role', icon: Users },
          { id: 'preview_all', label: 'Akses Role', icon: Layers },
          { id: 'broadcast', label: 'WA Gateway', icon: Send },
        ];
      case 'ketua_rt':
        return [
          { id: 'warga', label: 'Warga', icon: Users },
          { id: 'kerjabakti', label: 'Bakti', icon: UserCheck },
          { id: 'surat', label: 'Surat', icon: MessageSquare },
          { id: 'pengumuman', label: 'Info RT', icon: Bell },
          { id: 'preview_keamanan', label: 'Keamanan', icon: Shield },
          { id: 'preview_bendahara', label: 'Kas RT', icon: Coins },
        ];
      case 'keamanan':
        return [
          { id: 'presensi', label: 'Presensi', icon: Shield },
          { id: 'jadwal', label: 'Jadwal', icon: Users },
          { id: 'denda', label: 'Rekap Denda', icon: Coins },
        ];
      case 'bendahara':
        return [
          { id: 'tagihan', label: 'Tagihan', icon: Coins },
          { id: 'buku_kas', label: 'Buku Kas', icon: Layers },
          { id: 'hutang_piutang', label: 'Hutang', icon: UserCheck },
          { id: 'laporan', label: 'Laporan', icon: MessageSquare },
        ];
      case 'warga':
        return [
          { id: 'home', label: 'Beranda', icon: Sparkles },
          { id: 'presensi_warga', label: 'Ronda', icon: Shield },
          { id: 'tagihan_warga', label: 'Iuran', icon: Coins },
          { id: 'keluhan', label: 'Keluhan', icon: MessageSquare },
          { id: 'preview_laporan', label: 'Info Kas', icon: Layers },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  const handleSendQuickWa = async () => {
    if (!quickWaMsg.trim()) return;
    setSendingWa(true);
    setWaResult(null);
    try {
      const res = await sendWhatsAppDirect(quickWaTarget, quickWaMsg);
      setWaResult({
        success: res.status,
        msg: res.message || (res.status ? 'Pesan berhasil terkirim via Fonnte!' : 'Gagal mengirim pesan'),
      });
      if (res.status) {
        setQuickWaMsg('');
      }
    } catch (e: any) {
      setWaResult({ success: false, msg: e.message || 'Error pengiriman WhatsApp' });
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex justify-center items-stretch sm:items-center text-slate-800 antialiased selection:bg-indigo-600 selection:text-white sm:py-3">
      {/* Mobile Optimized Application Container */}
      <div className="w-full max-w-md bg-slate-50 sm:rounded-[32px] sm:border sm:border-slate-200/90 sm:shadow-2xl flex flex-col min-h-screen min-h-[100dvh] sm:min-h-[92vh] sm:max-h-[96vh] relative overflow-hidden">
        
        {/* App Bar / Header (Native Mobile Experience - No Fake System Bar) */}
        <header className="sticky top-0 z-40 bg-indigo-700 text-white border-b border-indigo-800/80 shadow-sm shrink-0">
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 font-black text-xl sm:text-2xl shadow-sm shrink-0">
                N
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none truncate">
                    Neo PoRT3
                  </h1>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/90 text-indigo-100 font-mono font-bold border border-indigo-500/40">
                    RT.03
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100/90 uppercase tracking-tight truncate leading-tight mt-0.5 font-medium">
                  Portal Warga RT.03 RW.14 BPTW
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Active Role Selector Pill */}
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition active:scale-95 shadow-sm min-h-[36px] ${getRoleBadgeColor(
                  currentRole
                )}`}
                title="Ganti Role Akun"
              >
                <span className="truncate max-w-[85px]">{getRoleLabel(currentRole)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl bg-indigo-800/70 hover:bg-rose-600 hover:text-white text-indigo-100 transition active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Keluar / Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Sub-header: WA Fonnte Connection & Quick Actions */}
          <div className="px-3.5 sm:px-4 py-1.5 bg-indigo-900/95 border-t border-indigo-600/30 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>WA Fonnte: Online</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-200/80 truncate hidden xs:inline">
                RT.03 RW.14 Cilacap
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <PWAInstallBadge compact />
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white flex items-center gap-1 transition font-semibold active:scale-95"
                title="Tes Kirim WhatsApp Fonnte"
              >
                <Send className="w-3 h-3" />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area (Mobile Scrollable Canvas) */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-3 sm:py-4 space-y-3.5 pb-24 bg-slate-50 text-slate-800 sleek-content overscroll-contain">
          {children}
        </main>

        {/* Bottom Navigation Bar (Mobile Native Touch Targets) */}
        <nav
          aria-label="Navigasi Menu Aplikasi"
          className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.04)] shrink-0 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl relative min-h-[44px] select-none active:scale-95 ${
                  isActive ? 'text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-transparent text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight truncate max-w-[66px]">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute top-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Switcher Modal / Mobile Bottom Sheet */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-t-[28px] sm:rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-800 max-h-[88vh] overflow-y-auto">
              {/* Drag bar for mobile bottom sheet */}
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Pilih Role Akses</h3>
                    <p className="text-[11px] text-slate-500">Beralih mode aplikasi secara instan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { role: 'superadmin' as Role, name: 'Super Admin', desc: 'Setting/reset password & akses semua role' },
                  { role: 'ketua_rt' as Role, name: 'Ketua RT', desc: 'Kelola data warga, kerja bakti, surat & pengumuman' },
                  { role: 'keamanan' as Role, name: 'Keamanan', desc: 'Presensi GPS, selfie live, jadwal & denda ronda' },
                  { role: 'bendahara' as Role, name: 'Bendahara', desc: 'Iuran, denda, buku kas RT, hutang & dana titipan' },
                  { role: 'warga' as Role, name: 'Warga', desc: 'Presensi ronda, iuran saya, titipan & keluhan' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      switchRoleDirectly(item.role);
                      setShowRoleModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition active:scale-98 ${
                      currentRole === item.role
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {currentRole === item.role && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Resident Chooser if switched to Warga */}
              {currentRole === 'warga' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Ganti Profil Warga Spesifik:
                  </label>
                  <select
                    value={currentUser?.wargaId || 1}
                    onChange={(e) => {
                      switchRoleDirectly('warga', Number(e.target.value));
                      setShowRoleModal(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    {wargaList
                      .filter((w) => w.namaPenghuni && w.namaPenghuni !== '-')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.namaPenghuni} ({w.blok}/{w.noRumah})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Direct WhatsApp Quick Broadcast Modal */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-t-[28px] sm:rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
              {/* Drag bar for mobile bottom sheet */}
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">WhatsApp Gateway Fonnte</h3>
                    <p className="text-[10px] text-slate-500">Kirim pesan langsung ke Grup / Nomor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Tujuan Penerima:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickWaTarget}
                      onChange={(e) => setQuickWaTarget(e.target.value)}
                      placeholder="Nomor WA (628...) atau ID Grup"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickWaTarget(settings.targetGroupWa)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-indigo-700 hover:bg-slate-200 border border-slate-200 font-medium"
                    >
                      Target Grup RT Default
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Isi Pesan:</label>
                  <textarea
                    rows={4}
                    value={quickWaMsg}
                    onChange={(e) => setQuickWaMsg(e.target.value)}
                    placeholder="Tulis pesan pengumuman, pengingat atau informasi warga..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {waResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      waResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{waResult.msg}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium active:scale-95"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    disabled={sendingWa || !quickWaMsg.trim()}
                    onClick={handleSendQuickWa}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-sm active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingWa ? 'Mengirim...' : 'Kirim Sekarang'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
