import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Apple, CheckCircle2, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallBadgeProps {
  compact?: boolean;
}

export const PWAInstallBadge: React.FC<PWAInstallBadgeProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Aplikasi Terpasang (PWA)</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Android / Chrome Button */}
        <button
          onClick={async () => {
            if (isInstallable) {
              await install();
            } else {
              setShowAndroidModal(true);
            }
          }}
          className={`flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition active:scale-95 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
          title="Instalasi di HP Android"
        >
          <Smartphone className="w-4 h-4 text-indigo-100" />
          <span>Instal Android</span>
          <span className="bg-indigo-800/80 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
            App
          </span>
        </button>

        {/* iOS Button */}
        <button
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold shadow-sm transition active:scale-95 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
          title="Instalasi di iPhone / iPad"
        >
          <Apple className="w-4 h-4 text-slate-600" />
          <span>Instal iOS</span>
          <span className="bg-slate-100 text-[10px] text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-slate-200">
            PWA
          </span>
        </button>
      </div>

      {/* iOS Installation Modal Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Instalasi di iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Neo PoRT3 Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  Buka aplikasi ini menggunakan browser <strong>Safari</strong> di iPhone/iPad Anda.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <p>
                    Ketuk tombol <strong>Bagikan / Share</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /> di bilah navigasi bawah Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <p>
                    Gulir ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama</strong> (<i>Add to Home Screen</i> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-600" />).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Manual Guide (if not automatically prompted) */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Instalasi di Android</h3>
                  <p className="text-xs text-slate-500">Chrome / Edge Browser</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  Ketuk ikon <strong>Titik Tiga (⋮)</strong> di sudut kanan atas browser Chrome Anda.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  Pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  Ikon Neo PoRT3 akan otomatis muncul di menu aplikasi & homescreen Android Anda dengan kecepatan buka secepat aplikasi native!
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAndroidModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
              >
                Siap, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
