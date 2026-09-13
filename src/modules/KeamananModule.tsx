import React, { useState, useEffect } from 'react';
import { useApp, getRondaWeekNumber } from '../context/AppContext';
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
  XCircle,
  Search,
  CheckSquare,
  Square,
  Info,
  RotateCcw,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

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
    toggleDendaRondaWeek,
    pushDendaRondaToBendahara,
    unpushDendaRondaFromBendahara,
    sendWhatsAppDirect,
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

  // Periode & Filter for Denda 4-Week Checklist
  const [reportPeriod, setReportPeriod] = useState<'Bulanan' | 'Tahunan'>('Bulanan');
  const [dendaSearch, setDendaSearch] = useState('');
  const [dendaFilter, setDendaFilter] = useState<'semua' | 'ada_denda' | 'lengkap'>('semua');
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [waSendingId, setWaSendingId] = useState<number | null>(null);
  const [waSentToast, setWaSentToast] = useState<string | null>(null);

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

  // Denda Report Export with 4-Week Checklist
  const handleExportDendaCSV = () => {
    const header = [
      'No',
      'Nama Warga',
      'Blok/No',
      'Kategori Wajib Ronda',
      'Minggu 1 (Tgl 1-7)',
      'Minggu 2 (Tgl 8-14)',
      'Minggu 3 (Tgl 15-21)',
      'Minggu 4 (Tgl 22-30)',
      'Total Minggu Hadir',
      'Total Alpa (Minggu)',
      'Total Denda Ronda (Rp)',
      'Periode',
      'Status Push Kas',
    ];
    const rows = dendaRondaList.map((d, i) => {
      const hadirCount = (d.minggu1 ? 1 : 0) + (d.minggu2 ? 1 : 0) + (d.minggu3 ? 1 : 0) + (d.minggu4 ? 1 : 0);
      return [
        i + 1,
        d.nama,
        d.blok && d.noRumah ? `${d.blok}/${d.noRumah}` : '-',
        d.kategori,
        d.minggu1 ? 'Hadir (1x)' : 'Alpa',
        d.minggu2 ? 'Hadir (1x)' : 'Alpa',
        d.minggu3 ? 'Hadir (1x)' : 'Alpa',
        d.minggu4 ? 'Hadir (1x)' : 'Alpa',
        hadirCount,
        d.jumlahAlpa,
        d.dendaTotal,
        reportPeriod === 'Bulanan' ? 'September 2026' : 'Tahun 2026',
        d.statusPushed ? 'Sudah Masuk Kas' : 'Belum',
      ];
    });
    exportToCSV(`Rekap_Checklist_4Minggu_Ronda_RT03_${reportPeriod}`, [header, ...rows]);
  };

  // Confirm modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning' | 'success' | 'whatsapp';
    icon?: 'push' | 'unpush' | 'whatsapp' | 'danger' | 'info' | 'help';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    onClose?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Push Denda with notification feedback
  const handlePushDendaWithFeedback = () => {
    pushDendaRondaToBendahara();
    setPushStatusMessage('Berhasil! Seluruh denda ronda telah disinkronkan ke Buku Tagihan Iuran Bendahara RT.03.');
    setTimeout(() => setPushStatusMessage(null), 5000);
  };

  // Prompt Push Denda with Confirmation Dialog
  const handlePromptPushDenda = () => {
    const totalDendaAll = (dendaRondaList || []).reduce((acc, curr) => acc + (curr.dendaTotal || 0), 0);
    const totalAlpaAll = (dendaRondaList || []).reduce((acc, curr) => acc + (curr.jumlahAlpa || 0), 0);
    const wargaKenaDendaCount = (dendaRondaList || []).filter((d) => (d.dendaTotal || 0) > 0).length;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Push Denda Ronda ke Bendahara',
      icon: 'push',
      confirmVariant: 'success',
      confirmLabel: 'Ya, Push ke Bendahara',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menyinkronkan data denda ronda 4 minggu periode <strong>September 2026</strong> ke Buku Tagihan Kas Bendahara RT.03.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Warga Terkena Denda:</span>
              <strong className="text-slate-800 dark:text-slate-200">{wargaKenaDendaCount} orang</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Akumulasi Alpa:</span>
              <strong className="text-slate-800 dark:text-slate-200">{totalAlpaAll} minggu</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span className="text-slate-500 font-semibold">Total Nilai Denda Ronda:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{formatRupiah(totalDendaAll)}</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Nilai ini akan otomatis ditambahkan ke kolom <em>Denda Ronda</em> pada kartu tagihan warga di modul Bendahara.
          </p>
        </div>
      ),
      onConfirm: () => {
        handlePushDendaWithFeedback();
        closeConfirmModal();
      },
    });
  };

  // Prompt Unpush Denda with Confirmation Dialog
  const handlePromptUnpushDenda = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Unpush Denda Ronda',
      icon: 'unpush',
      confirmVariant: 'warning',
      confirmLabel: 'Ya, Unpush Denda',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin <strong>menarik kembali / membatalkan push</strong> Denda Ronda dari Buku Tagihan Bendahara?
          </p>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-semibold">Efek Unpush:</p>
            <p>• Komponen tagihan denda ronda seluruh warga di modul Bendahara akan ditarik dan direset menjadi <strong>Rp 0</strong>.</p>
            <p>• Status push pada checklist 4 minggu akan kembali menjadi draf belum disinkronkan.</p>
          </div>
        </div>
      ),
      onConfirm: () => {
        unpushDendaRondaFromBendahara();
        closeConfirmModal();
        setPushStatusMessage('Denda ronda berhasil di-unpush. Tagihan denda ronda di modul Bendahara telah direset ke Rp 0.');
        setTimeout(() => setPushStatusMessage(null), 5000);
      },
    });
  };

  // Kirim Rekap 4 Minggu via WhatsApp ke Warga
  const handleSendWARecap = async (item: (typeof dendaRondaList)[0]) => {
    const targetWarga = wargaList.find((w) => w.id === item.wargaId);
    const targetHp = (
      item.kontakHp ||
      targetWarga?.kontakHp ||
      targetWarga?.hpPenghuni ||
      targetWarga?.hpPemilik ||
      settings.targetGroupWa ||
      ''
    ).trim();
    
    setWaSendingId(item.wargaId);
    try {
      const hadirCount = (item.minggu1 ? 1 : 0) + (item.minggu2 ? 1 : 0) + (item.minggu3 ? 1 : 0) + (item.minggu4 ? 1 : 0);
      const rumusText = item.catatan || (item.jumlahAlpa === 4
        ? item.kategori.includes('Luar Kota')
          ? '1 Bulan Penuh Luar Kota: Rp 25.000'
          : '1 Bulan Penuh Dalam Kota: Rp 50.000'
        : `${item.jumlahAlpa}x Alpa @ Rp 5.000`);

      const text = `*REKAPITULASI CHECKLIST 4 MINGGU RONDA RT.03 RW.14*\n\nKepada Yth: *${item.nama}* (Kavling ${item.blok || ''}/${item.noRumah || ''})\nPeriode: *September 2026*\n\n*Checklist Kehadiran Mingguan:*\n• Minggu I (Tgl 1 - 7): ${item.minggu1 ? '✅ Hadir' : '❌ Alpa'}\n• Minggu II (Tgl 8 - 14): ${item.minggu2 ? '✅ Hadir' : '❌ Alpa'}\n• Minggu III (Tgl 15 - 21): ${item.minggu3 ? '✅ Hadir' : '❌ Alpa'}\n• Minggu IV (Tgl 22 - 30): ${item.minggu4 ? '✅ Hadir' : '❌ Alpa'}\n\n*Ringkasan Denda:*\n- Kehadiran: ${hadirCount} dari 4 Minggu\n- Total Alpa: ${item.jumlahAlpa} Minggu\n- Rincian Tarif: ${rumusText}\n- Total Denda Ronda: *${formatRupiah(item.dendaTotal)}*\n\n_Ketentuan: Dalam 1 minggu warga hanya diperbolehkan satu kali presensi meskipun tidak pada jadwalnya. Denda per alpa Rp 5.000, atau denda 1 bulan penuh alpa: Rp 25.000 (Luar Kota) / Rp 50.000 (Dalam Kota)._\n\nSalam,\n*Sie Keamanan & Ketertiban RT.03 Perum BPTW*`;
      
      await sendWhatsAppDirect(targetHp, text);
      setWaSentToast(`Rekap checklist 4 minggu berhasil dikirim ke WhatsApp ${item.nama} (${targetHp})!`);
      setTimeout(() => setWaSentToast(null), 4000);
    } catch (e: any) {
      setWaSentToast(`Gagal kirim WA: ${e.message || 'Error gateway'}`);
      setTimeout(() => setWaSentToast(null), 4000);
    } finally {
      setWaSendingId(null);
    }
  };

  // Prompt Kirim Rekap WA with Confirmation Dialog
  const handlePromptSendWARecap = (item: (typeof dendaRondaList)[0]) => {
    const targetWarga = wargaList.find((w) => w.id === item.wargaId);
    const targetHp = (
      item.kontakHp ||
      targetWarga?.kontakHp ||
      targetWarga?.hpPenghuni ||
      targetWarga?.hpPemilik ||
      settings.targetGroupWa ||
      ''
    ).trim();
    const hadirCount = (item.minggu1 ? 1 : 0) + (item.minggu2 ? 1 : 0) + (item.minggu3 ? 1 : 0) + (item.minggu4 ? 1 : 0);
    const rumusText = item.catatan || (item.jumlahAlpa === 4
      ? item.kategori.includes('Luar Kota')
        ? '1 Bulan Penuh Luar Kota: Rp 25.000'
        : '1 Bulan Penuh Dalam Kota: Rp 50.000'
      : `${item.jumlahAlpa}x Alpa @ Rp 5.000`);

    setConfirmModalConfig({
      isOpen: true,
      title: 'Konfirmasi Kirim Rekap via WhatsApp',
      icon: 'whatsapp',
      confirmVariant: 'whatsapp',
      confirmLabel: 'Ya, Kirim Pesan WA',
      message: (
        <div className="space-y-2">
          <p>
            Kirim rincian rekapitulasi checklist 4 minggu ronda bulan berjalan langsung ke nomor WhatsApp warga:
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Warga:</span>
              <strong className="text-slate-900 dark:text-white">{item.nama} ({item.blok || ''}/{item.noRumah || ''})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target No. WA:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{targetHp}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kehadiran:</span>
              <span>{hadirCount} Hadir • {item.jumlahAlpa} Alpa</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span className="text-slate-500 font-semibold">Total Denda Ronda:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(item.dendaTotal)}</strong>
            </div>
            <div className="text-[10px] text-slate-500 italic">
              *Rincian: {rumusText}
            </div>
          </div>
        </div>
      ),
      onConfirm: async () => {
        closeConfirmModal();
        await handleSendWARecap(item);
      },
    });
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

            {/* Active Ronda Week Status for Selected Petugas */}
            {(() => {
              const currentWeek = getRondaWeekNumber();
              const weekDates =
                currentWeek === 1
                  ? '1 - 7 Sept'
                  : currentWeek === 2
                  ? '8 - 14 Sept'
                  : currentWeek === 3
                  ? '15 - 21 Sept'
                  : '22 - 30 Sept';
              const targetDenda = dendaRondaList.find(
                (d) => d.nama.toUpperCase() === selectedPetugas.toUpperCase()
              );
              const isWeekDone = targetDenda
                ? currentWeek === 1
                  ? targetDenda.minggu1
                  : currentWeek === 2
                  ? targetDenda.minggu2
                  : currentWeek === 3
                  ? targetDenda.minggu3
                  : targetDenda.minggu4
                : false;

              return (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-[11px]">Periode Berjalan:</span>
                    <span className="text-indigo-400 font-bold text-[11px]">
                      Minggu ke-{currentWeek} ({weekDates})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Kewajiban Minggu Ini:</span>
                    {isWeekDone ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Hadir (1x Presensi Terpenuhi)</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Belum Presensi Minggu Ini</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    *SOP RT.03: Dalam 1 minggu cukup 1x presensi meskipun tidak pada hari jadwal resmi Anda.
                  </p>
                </div>
              );
            })()}

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
                      {sch.petugasNames
                        .filter((p) => {
                          const w = wargaList.find(
                            (x) =>
                              x.namaPenghuni?.trim().toLowerCase() === p.trim().toLowerCase() ||
                              x.namaPemilik?.trim().toLowerCase() === p.trim().toLowerCase()
                          );
                          return w?.statusUsiaPenghuni !== 'Lansia';
                        })
                        .map((p) => (
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

      {/* TAB 3: REKAPITULASI & CHECKLIST 4 MINGGU RONDA */}
      {activeTab === 'denda' && (() => {
        const totalWajib = dendaRondaList.length;
        const countM1 = dendaRondaList.filter(d => d.minggu1).length;
        const countM2 = dendaRondaList.filter(d => d.minggu2).length;
        const countM3 = dendaRondaList.filter(d => d.minggu3).length;
        const countM4 = dendaRondaList.filter(d => d.minggu4).length;
        const totalDendaAll = (dendaRondaList || []).reduce((acc, d) => acc + (d.dendaTotal || 0), 0);
        const bebasDendaCount = (dendaRondaList || []).filter(d => (d.jumlahAlpa || 0) === 0).length;
        const adaDendaCount = (dendaRondaList || []).filter(d => (d.dendaTotal || 0) > 0).length;

        const filteredList = dendaRondaList
          .filter((item) => {
            const w = wargaList.find(
              (x) =>
                x.id === item.wargaId ||
                x.namaPenghuni?.trim().toLowerCase() === item.nama.trim().toLowerCase() ||
                x.namaPemilik?.trim().toLowerCase() === item.nama.trim().toLowerCase()
            );
            return w?.statusUsiaPenghuni !== 'Lansia';
          })
          .filter((item) => {
            const matchSearch =
              item.nama.toLowerCase().includes(dendaSearch.toLowerCase()) ||
              (item.blok && item.blok.toLowerCase().includes(dendaSearch.toLowerCase())) ||
              (item.noRumah && item.noRumah.toLowerCase().includes(dendaSearch.toLowerCase()));
            if (!matchSearch) return false;
            if (dendaFilter === 'ada_denda') return item.dendaTotal > 0;
            if (dendaFilter === 'lengkap') return item.jumlahAlpa === 0;
            return true;
          });

        return (
          <div className="space-y-3.5">
            {/* Notification Toasts */}
            {pushStatusMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{pushStatusMessage}</span>
              </div>
            )}
            {waSentToast && (
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-300 text-teal-800 text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
                <Send className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-medium">{waSentToast}</span>
              </div>
            )}

            {/* Header Card & Push to Bendahara */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                    <span>Rekap Denda & Checklist 4 Minggu Ronda</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sistem 4 Periode Mingguan • Wajib 1x presensi per minggu
                  </p>
                </div>

                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Bulanan">Periode September 2026</option>
                  <option value="Tahunan">Periode Tahunan 2026</option>
                </select>
              </div>

              {/* Aturan Denda & Ketentuan 1 Minggu 1 Kali Info */}
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-[11px] text-indigo-100 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-indigo-200">
                  <Info className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                  <span>Ketentuan Presensi & Denda Ronda RT.03 (4 Minggu/Bulan):</span>
                </p>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  Dalam 1 minggu warga hanya diperbolehkan <strong>satu kali presensi</strong> meskipun tidak pada jadwal resminya. Denda per ketidakhadiran = <strong>Rp 5.000 / minggu alpa</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-indigo-800/60 text-[11px] text-indigo-200">
                  <div className="p-1.5 rounded-lg bg-indigo-900/50 border border-indigo-700/50">
                    • <strong>Produktif Luar Kota:</strong> Denda Rp 5.000/alpa. Jika alpa 1 bulan penuh (4 minggu): <strong>Rp 25.000</strong>.
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-900/50 border border-indigo-700/50">
                    • <strong>Produktif Dalam Kota:</strong> Denda Rp 5.000/alpa. Jika alpa 1 bulan penuh (4 minggu): <strong>Rp 50.000</strong>.
                  </div>
                </div>
              </div>

              {/* Quick Metrics (Overview 4 Minggu) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Wajib Ronda</span>
                  <span className="text-sm font-bold text-white font-mono">{totalWajib}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <span className="text-[10px] text-emerald-400 block font-medium">M1 (1-7)</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{countM1} Hadir</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <span className="text-[10px] text-emerald-400 block font-medium">M2 (8-14)</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{countM2} Hadir</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <span className="text-[10px] text-emerald-400 block font-medium">M3 (15-21)</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{countM3} Hadir</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <span className="text-[10px] text-emerald-400 block font-medium">M4 (22-30)</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{countM4} Hadir</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 text-center">
                  <span className="text-[10px] text-rose-300 block font-medium">Total Denda</span>
                  <span className="text-xs font-bold text-rose-200 font-mono truncate block">
                    {formatRupiah(totalDendaAll)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Export, Push & Unpush Bendahara */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportDendaCSV}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition active:scale-95"
                    title="Export Rekap Checklist 4 Minggu ke Excel CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={openPrintDialog}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cetak</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Unpush Denda Button */}
                  <button
                    onClick={handlePromptUnpushDenda}
                    disabled={!dendaRondaList.some((d) => d.statusPushed)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Batalkan sinkronisasi / tarik denda ronda dari buku tagihan Bendahara"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unpush Denda</span>
                  </button>

                  {/* Push Denda to Bendahara */}
                  <button
                    onClick={handlePromptPushDenda}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
                    title="Sinkronkan nilai denda ke tagihan kas bulanan Bendahara"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>
                      {dendaRondaList.every((d) => d.statusPushed)
                        ? 'Perbarui Push Denda'
                        : 'Push Denda ke Bendahara'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama warga atau nomor kavling..."
                    value={dendaSearch}
                    onChange={(e) => setDendaSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setDendaFilter('semua')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    dendaFilter === 'semua'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({totalWajib})
                </button>
                <button
                  onClick={() => setDendaFilter('ada_denda')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    dendaFilter === 'ada_denda'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ada Denda ({adaDendaCount})
                </button>
                <button
                  onClick={() => setDendaFilter('lengkap')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    dendaFilter === 'lengkap'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bebas Denda / Lengkap ({bebasDendaCount})
                </button>
              </div>
            </div>

            {/* List of Residents with 4-Week Checklist */}
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium px-1 flex items-center justify-between">
                <span>
                  Menampilkan {filteredList.length} dari {totalWajib} Warga Wajib Ronda
                </span>
                <span className="text-[10px] text-slate-400">Klik M1-M4 untuk toggle manual</span>
              </div>

              {filteredList.map((item) => {
                const hadirCount =
                  (item.minggu1 ? 1 : 0) +
                  (item.minggu2 ? 1 : 0) +
                  (item.minggu3 ? 1 : 0) +
                  (item.minggu4 ? 1 : 0);

                return (
                  <div
                    key={item.wargaId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 transition hover:border-slate-300"
                  >
                    {/* Top Row: Resident Info & Status */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.nama}</span>
                          {item.blok && item.noRumah && (
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {item.blok}/{item.noRumah}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">{item.kategori}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-medium text-slate-600">
                            {item.jumlahAlpa === 4
                              ? item.kategori.includes('Luar Kota')
                                ? 'Tarif 1 Bln: Rp 25.000'
                                : 'Tarif 1 Bln: Rp 50.000'
                              : 'Tarif: Rp 5.000/alpa'}
                          </span>
                          {(() => {
                            const targetW = wargaList.find((w) => w.id === item.wargaId);
                            const phone = item.kontakHp || targetW?.kontakHp || targetW?.hpPenghuni || targetW?.hpPemilik;
                            if (!phone) return null;
                            return (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  {phone}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right: Denda & Push status */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Kewajiban Denda</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            item.dendaTotal > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatRupiah(item.dendaTotal)}
                        </span>
                        {item.statusPushed && (
                          <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded block mt-0.5 border border-emerald-200">
                            ✓ Masuk Kas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: The 4-Week Checklist Buttons */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Checklist 4 Minggu (1x Presensi/Minggu):</span>
                        <span className="text-slate-600 font-medium">
                          {hadirCount === 4 ? (
                            <span className="text-emerald-600 font-bold">✓ 4/4 Lengkap</span>
                          ) : (
                            <span>{hadirCount}/4 Minggu Terpenuhi</span>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {/* Minggu 1 */}
                        <button
                          type="button"
                          onClick={() => toggleDendaRondaWeek(item.wargaId, 1)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition border active:scale-95 ${
                            item.minggu1
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status Minggu 1 (Tgl 1 - 7)"
                        >
                          <div className="flex items-center gap-1">
                            {item.minggu1 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-bold">M1</span>
                          </div>
                          <span className="text-[9px] opacity-80">
                            {item.minggu1 ? 'Hadir' : 'Alpa'}
                          </span>
                        </button>

                        {/* Minggu 2 */}
                        <button
                          type="button"
                          onClick={() => toggleDendaRondaWeek(item.wargaId, 2)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition border active:scale-95 ${
                            item.minggu2
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status Minggu 2 (Tgl 8 - 14)"
                        >
                          <div className="flex items-center gap-1">
                            {item.minggu2 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-bold">M2</span>
                          </div>
                          <span className="text-[9px] opacity-80">
                            {item.minggu2 ? 'Hadir' : 'Alpa'}
                          </span>
                        </button>

                        {/* Minggu 3 */}
                        <button
                          type="button"
                          onClick={() => toggleDendaRondaWeek(item.wargaId, 3)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition border active:scale-95 ${
                            item.minggu3
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status Minggu 3 (Tgl 15 - 21)"
                        >
                          <div className="flex items-center gap-1">
                            {item.minggu3 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-bold">M3</span>
                          </div>
                          <span className="text-[9px] opacity-80">
                            {item.minggu3 ? 'Hadir' : 'Alpa'}
                          </span>
                        </button>

                        {/* Minggu 4 */}
                        <button
                          type="button"
                          onClick={() => toggleDendaRondaWeek(item.wargaId, 4)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition border active:scale-95 ${
                            item.minggu4
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status Minggu 4 (Tgl 22 - 30)"
                        >
                          <div className="flex items-center gap-1">
                            {item.minggu4 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span className="font-bold">M4</span>
                          </div>
                          <span className="text-[9px] opacity-80">
                            {item.minggu4 ? 'Hadir' : 'Alpa'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Quick WA notification button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="text-slate-600">
                        <span>
                          Alpa: <strong className="text-slate-900">{item.jumlahAlpa}x</strong> ({4 - item.jumlahAlpa} hadir)
                        </span>
                        {item.catatan && (
                          <span className="text-[10px] text-indigo-700 font-semibold block sm:inline sm:ml-2">
                            • {item.catatan}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {(() => {
                          const targetW = wargaList.find((w) => w.id === item.wargaId);
                          const phone = (
                            item.kontakHp ||
                            targetW?.kontakHp ||
                            targetW?.hpPenghuni ||
                            targetW?.hpPemilik ||
                            ''
                          ).trim();
                          if (!phone) return null;
                          const cleanPhone = phone.replace(/[^0-9]/g, '');
                          const waNumber = cleanPhone.startsWith('62')
                            ? cleanPhone
                            : cleanPhone.startsWith('08')
                            ? `62${cleanPhone.slice(1)}`
                            : cleanPhone;
                          const hadirCount =
                            (item.minggu1 ? 1 : 0) +
                            (item.minggu2 ? 1 : 0) +
                            (item.minggu3 ? 1 : 0) +
                            (item.minggu4 ? 1 : 0);
                          const waText = encodeURIComponent(
                            `Halo Bpk/Ibu ${item.nama} (Kavling ${item.blok || ''}/${item.noRumah || ''}), info rekap checklist ronda September 2026: Kehadiran ${hadirCount}/4 minggu (${item.jumlahAlpa}x alpa). Kewajiban denda: ${formatRupiah(item.dendaTotal)}. Terima kasih.`
                          );
                          return (
                            <a
                              href={`https://wa.me/${waNumber}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-medium flex items-center gap-1 transition"
                              title={`Chat WhatsApp Langsung ke ${phone}`}
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>Chat WA</span>
                            </a>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => handlePromptSendWARecap(item)}
                          disabled={waSendingId === item.wargaId}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                          title="Kirim Rekap Checklist 4 Minggu ke WhatsApp Warga via Gateway"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>
                            {waSendingId === item.wargaId ? 'Mengirim...' : 'Kirim Rekap WA'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        cancelLabel={confirmModalConfig.cancelLabel}
        confirmVariant={confirmModalConfig.confirmVariant}
        icon={confirmModalConfig.icon}
        isLoading={confirmModalConfig.isLoading}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => {
          confirmModalConfig.onCancel?.();
          closeConfirmModal();
        }}
        onClose={() => {
          confirmModalConfig.onClose?.();
          closeConfirmModal();
        }}
      />
    </div>
  );
};
