import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Logo3D } from './Logo3D';
import {
  Shield,
  Users,
  Coins,
  UserCheck,
  Crown,
  LogOut,
  Bell,
  MessageSquare,
  Sparkles,
  Layers,
  Send,
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
    logout,
  } = useApp();

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

  return (
    <div className="fixed inset-0 sm:static sm:min-h-screen bg-slate-100 flex justify-center items-stretch sm:items-center text-slate-800 antialiased selection:bg-indigo-600 selection:text-white sm:py-3 overflow-hidden sm:overflow-auto">
      {/* Mobile Optimized Application Container */}
      <div className="w-full max-w-md bg-slate-50 sm:rounded-[32px] sm:border sm:border-slate-200/90 sm:shadow-2xl flex flex-col h-full sm:h-[92vh] sm:max-h-[96vh] relative overflow-hidden">
        
        {/* App Bar / Header */}
        <header className="shrink-0 bg-indigo-700 text-white border-b border-indigo-800 shadow-sm z-30">
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Logo3D size="md" />
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

            <div className="flex items-center gap-2 shrink-0">
              {/* User Identity Display */}
              <div className="text-right">
                <span className="text-[11px] sm:text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                  {currentUser?.name || getRoleLabel(currentRole)}
                </span>
                <span className="text-[9px] text-indigo-200 uppercase font-semibold tracking-wider">
                  {getRoleLabel(currentRole)}
                </span>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl bg-indigo-800/80 hover:bg-rose-600 text-indigo-100 hover:text-white transition active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center border border-indigo-600/50 shadow-sm"
                title="Keluar / Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area (Mobile Scrollable Canvas) */}
        <main
          id="mobile-main-scrollable"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-4 py-3 sm:py-4 space-y-3.5 pb-28 bg-slate-50 text-slate-800 sleek-content overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch]"
        >
          {children}
        </main>

        {/* Bottom Navigation Bar (Mobile Native Touch Targets) */}
        <nav
          aria-label="Navigasi Menu Aplikasi"
          className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-30 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
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
      </div>
    </div>
  );
};
