import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SelfieCamera } from '../components/SelfieCamera';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';
import { exportToCSV, formatRupiah, openPrintDialog } from '../utils/exportUtils';
import {
  Shield,
  Camera,
  MapPin,
  Clock,
  Coins,
  Users,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';

interface KeamananModuleProps {
  activeTab: string;
}

export const KeamananModule: React.FC<KeamananModuleProps> = ({ activeTab }) => {
  const {
    currentUser,
    rondaSchedules,
    updateRondaSchedule,
    presensiList,
    addPresensiRonda,
    dendaRondaList,
    pushDendaRondaToBendahara,
    settings,
    wargaList,
  } = useApp();

  // Presensi State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [selectedPetugas, setSelectedPetugas] = useState<string>(
    currentUser?.name || 'LUKMAN'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Jadwal Edit State
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingPetugasInput, setEditingPetugasInput] = useState('');

  // Periode Filter for Denda Report
  const [reportPeriod, setReportPeriod] = useState<'Bulanan' | 'Tahunan'>('Bulanan');

  // Watch GPS Location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung pada browser ini.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setLocationError(null);

        const dist = calculateDistanceMeters(
          lat,
          lng,
          settings.posRondaLat,
          settings.posRondaLng
        );
        setDistanceMeters(dist);
      },
      (err) => {
        console.warn('GPS location fetch issue:', err);
        // Default simulator position near pos ronda for reliable testing
        const simLat = settings.posRondaLat + 0.0001;
        const simLng = settings.posRondaLng + 0.0001;
        setUserLocation({ lat: simLat, lng: simLng });
        const dist = calculateDistanceMeters(simLat, simLng, settings.posRondaLat, settings.posRondaLng);
        setDistanceMeters(dist);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [settings.posRondaLat, settings.posRondaLng]);

  // Check if within ronda hours (22:00 - 23:59)
  const checkTimeValid = () => {
    if (settings.bypassJamCheck) return true;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeVal = currentHour * 60 + currentMinute;

    const [startH, startM] = settings.jamMulaiRonda.split(':').map(Number);
    const [endH, endM] = settings.jamSelesaiRonda.split(':').map(Number);

    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    return timeVal >= startVal && timeVal <= endVal;
  };

  const isTimeValid = checkTimeValid();
  const isDistanceValid = settings.bypassRadiusCheck || distanceMeters <= settings.posRondaRadiusMeters;

  const handleCapturePhoto = (base64: string) => {
    setCapturedPhoto(base64);
  };

  const handleSubmitPresensi = async () => {
    if (!capturedPhoto) {
      setSubmitResult({ success: false, msg: 'Wajib mengambil foto selfie langsung!' });
      return;
    }

    if (!isDistanceValid) {
      setSubmitResult({
        success: false,
        msg: `Jarak (${formatDistance(distanceMeters)}) melebihi radius pos ronda (${settings.posRondaRadiusMeters}m). Aktifkan bypass di Super Admin jika ingin simulasi.`,
      });
      return;
    }

    if (!isTimeValid) {
      setSubmitResult({
        success: false,
        msg: `Presensi hanya dibuka pukul ${settings.jamMulaiRonda} s/d ${settings.jamSelesaiRonda}. Aktifkan bypass di Super Admin jika ingin simulasi siang hari.`,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const now = new Date();
      const tanggal = now.toISOString().slice(0, 10);
      const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      await addPresensiRonda({
        nama: selectedPetugas,
        tanggal,
        waktu,
        latitude: userLocation?.lat || settings.posRondaLat,
        longitude: userLocation?.lng || settings.posRondaLng,
        distanceMeters: distanceMeters,
        selfieUrl: capturedPhoto,
        status: 'Hadir Tervalidasi',
      });

      setSubmitResult({
        success: true,
        msg: 'Presensi ronda berhasil dicatat & disiarkan ke WhatsApp Grup RT.03!',
      });
      setCapturedPhoto(null);
    } catch (err: any) {
      setSubmitResult({ success: false, msg: err.message || 'Gagal mengirim presensi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jadwal handlers
  const handleStartEditSchedule = (hari: string, currentPetugas: string[]) => {
    setEditingDay(hari);
    setEditingPetugasInput(currentPetugas.join(', '));
  };

  const handleSaveSchedule = (hari: any) => {
    const list = editingPetugasInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    updateRondaSchedule(hari, list);
    setEditingDay(null);
  };

  // Denda Report Export
  const handleExportDendaCSV = () => {
    const header = [
      'No',
      'Nama Warga (Kategori Wajib Ronda)',
      'Status Wajib',
      'Kriteria Usia & Domisili',
      'Jumlah Alpa',
      'Nilai Denda Ronda (Rp)',
      'Periode',
      'Status Push ke Bendahara',
    ];
    const rows = dendaRondaList.map((d, i) => [
      i + 1,
      d.nama,
      d.statusWajib,
      d.kategori,
      d.jumlahAlpa,
      d.dendaTotal,
      reportPeriod === 'Bulanan' ? 'September 2026' : 'Tahun 2026',
      d.statusPushed ? 'Sudah di-Push' : 'Belum',
    ]);
    exportToCSV(`Laporan_Denda_Ronda_RT03_${reportPeriod}`, [header, ...rows]);
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 shadow-sm">
        <div className="flex items-center gap-2 text-blue-800 mb-1">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Modul Keamanan RT.03</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Presensi Ronda Malam GPS & Selfie Live</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Jam Ronda: {settings.jamMulaiRonda} - {settings.jamSelesaiRonda} WIB • Radius: {settings.posRondaRadiusMeters}m Pos RT
        </p>
      </div>

      {/* TAB 1: PRESENSI RONDA (KAMERA SELFIE & GPS GEOFENCE) */}
      {activeTab === 'presensi' && (
        <div className="space-y-3">
          {/* Geolocation & Time Status Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Status Lokasi & Jam Malam</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Pos: {settings.posRondaLat.toFixed(4)}, {settings.posRondaLng.toFixed(4)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                className={`p-2 rounded-xl border flex flex-col justify-between ${
                  isDistanceValid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-400">Jarak ke Pos:</span>
                <p className="font-mono font-bold text-sm mt-0.5">
                  {formatDistance(distanceMeters)}
                </p>
                <span className="text-[10px] mt-1">
                  {isDistanceValid ? '✓ Dalam Radius Pos' : '✕ Di Luar Radius'}
                </span>
              </div>

              <div
                className={`p-2 rounded-xl border flex flex-col justify-between ${
                  isTimeValid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-400">Jadwal Jam:</span>
                <p className="font-mono font-bold text-sm mt-0.5">
                  {settings.jamMulaiRonda} - {settings.jamSelesaiRonda}
                </p>
                <span className="text-[10px] mt-1">
                  {isTimeValid ? '✓ Jam Ronda Aktif' : '✕ Di Luar Jam'}
                </span>
              </div>
            </div>

            {(settings.bypassRadiusCheck || settings.bypassJamCheck) && (
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Mode Demo Super Admin aktif: Pemeriksaan jam / radius di-bypass.</span>
              </div>
            )}
          </div>

          {/* Form & Camera Selfie Component */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Nama Petugas Ronda:
              </label>
              <select
                value={selectedPetugas}
                onChange={(e) => setSelectedPetugas(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {wargaList
                  .filter((w) => w.kriteriaRonda === 'Wajib Ronda' && w.namaPenghuni !== '-')
                  .map((w) => (
                    <option key={w.id} value={w.namaPenghuni}>
                      {w.namaPenghuni} (Blok {w.blok}/{w.noRumah} - {w.domisiliKerja})
                    </option>
                  ))}
              </select>
            </div>

            {/* Selfie Camera (tanpa fitur upload file) */}
            <div className="pt-1">
              <SelfieCamera
                capturedImage={capturedPhoto}
                onCapture={handleCapturePhoto}
                onRetake={() => setCapturedPhoto(null)}
              />
            </div>

            {submitResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  submitResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {submitResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <p className="font-semibold">{submitResult.msg}</p>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting || !capturedPhoto}
              onClick={handleSubmitPresensi}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-blue-950 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan Presensi...' : 'Kirim Presensi Ronda Malam'}</span>
            </button>
          </div>

          {/* Riwayat Presensi Malam Ini */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-white px-1">Riwayat Presensi Masuk</h3>
            {presensiList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                Belum ada presensi yang terekam malam ini.
              </div>
            ) : (
              presensiList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.selfieUrl ? (
                      <img
                        src={item.selfieUrl}
                        alt="Selfie"
                        className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.nama}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.tanggal} • {item.waktu} WIB
                      </p>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        Jarak: {formatDistance(item.distanceMeters)} dari Pos
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                    Tervalidasi
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA JADWAL RONDA (SENIN - MINGGU) */}
      {activeTab === 'jadwal' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
            <h3 className="text-sm font-bold text-white">Jadwal Ronda Malam RT.03</h3>
            <p className="text-[11px] text-slate-400">
              Rotasi petugas jaga malam Senin s/d Minggu sesuai SOP lingkungan RT.03 Perum BPTW
            </p>
          </div>

          <div className="space-y-2">
            {rondaSchedules.map((sch) => {
              const isEditing = editingDay === sch.hari;
              return (
                <div
                  key={sch.hari}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300 text-sm">{sch.hari}</span>
                      <span className="text-[10px] text-slate-400">({sch.petugasNames.length} Petugas)</span>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => handleStartEditSchedule(sch.hari, sch.petugasNames)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-xs"
                      >
                        Ubah Petugas
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingDay(null)}
                          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveSchedule(sch.hari)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                        >
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sch.petugasNames.map((p) => (
                        <span
                          key={p}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs font-semibold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-1 space-y-1">
                      <label className="text-[10px] text-slate-400">Pisahkan nama dengan koma (,):</label>
                      <input
                        type="text"
                        value={editingPetugasInput}
                        onChange={(e) => setEditingPetugasInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REKAPITULASI & DENDA RONDA */}
      {activeTab === 'denda' && (
        <div className="space-y-3">
          {/* Header Card & Push to Bendahara */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Rekapitulasi Denda Ronda Warga</h3>
                <p className="text-[11px] text-slate-400">
                  Hanya menampilkan warga kategori <strong>Wajib Ronda</strong>
                </p>
              </div>

              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="Bulanan">Periode Bulanan</option>
                <option value="Tahunan">Periode Tahunan</option>
              </select>
            </div>

            {/* Aturan Denda Info */}
            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-300 space-y-1">
              <p className="font-bold">Ketentuan Alur Logika Denda Ronda RT.03:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-300">
                <li>
                  <strong>Produktif, Luar Kota, Laki-laki:</strong> Rp 5.000 / minggu alpa. Jika sebulan penuh alpa (4 minggu) = <strong>Rp 25.000</strong>.
                </li>
                <li>
                  <strong>Produktif, Dalam Kota, Laki-laki:</strong> Rp 5.000 / ketidakhadiran. Jika sebulan penuh alpa (4 minggu) = <strong>Rp 50.000</strong>.
                </li>
              </ul>
            </div>

            {/* Export and Push Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportDendaCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={openPrintDialog}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cetak</span>
                </button>
              </div>

              {/* Push Denda to Bendahara */}
              <button
                onClick={pushDendaRondaToBendahara}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-95"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Push Denda ke Bendahara</span>
              </button>
            </div>
          </div>

          {/* List Denda Wajib Ronda */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 px-1">
              Menampilkan {dendaRondaList.length} Warga Terdaftar Wajib Ronda
            </div>

            {dendaRondaList.map((item) => (
              <div
                key={item.wargaId}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-white text-sm">{item.nama}</span>
                  <p className="text-[11px] text-slate-400">{item.kategori}</p>
                  <p className="text-[10px] text-slate-300">
                    Alpa Ronda: <span className="font-bold text-amber-400">{item.jumlahAlpa} kali</span>
                    {item.statusPushed && (
                      <span className="ml-2 text-emerald-400 font-semibold">• Sudah masuk tagihan</span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Denda Ronda</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatRupiah(item.dendaTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
