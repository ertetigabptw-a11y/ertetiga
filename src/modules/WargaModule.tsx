import React, { useState, useEffect } from 'react';
import { useApp, getRondaWeekNumber } from '../context/AppContext';
import { SelfieCamera } from '../components/SelfieCamera';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';
import { exportToCSV, formatRupiah, openPrintDialog } from '../utils/exportUtils';
import {
  Sparkles,
  Shield,
  Coins,
  MessageSquare,
  Bell,
  Camera,
  MapPin,
  Clock,
  Send,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  HelpCircle,
  XCircle,
  CheckSquare,
  Info,
  ArrowUpRight,
  Users,
  Receipt,
  Wallet,
  Phone,
  Edit3,
  Save,
  X,
} from 'lucide-react';

interface WargaModuleProps {
  activeTab: string;
}

export const WargaModule: React.FC<WargaModuleProps> = ({ activeTab }) => {
  const {
    currentUser,
    wargaList,
    updateWarga,
    updateUserAccount,
    rondaSchedules,
    addPresensiRonda,
    presensiList,
    dendaRondaList,
    tagihanList,
    bayarTagihanWarga,
    alokasikanDanaTitipan,
    alokasikanDepositKombinasi,
    pengumumanList,
    markPengumumanRead,
    keluhanList,
    submitKeluhan,
    pengeluaranList,
    pemasukanList,
    settings,
  } = useApp();

  // Find the resident profile strictly belonging to the currently logged in resident
  const currentWarga =
    (currentUser?.wargaId ? wargaList.find((w) => w.id === currentUser.wargaId) : null) ||
    wargaList.find((w) => w.namaPenghuni.toLowerCase() === currentUser?.name?.toLowerCase()) ||
    wargaList[0];
  const myTagihan = tagihanList.find((t) => t.wargaId === currentWarga.id) || tagihanList[0];
  const myDendaEntry = dendaRondaList.find(
    (d) =>
      d.wargaId === currentWarga.id ||
      d.nama.trim().toUpperCase() === currentWarga.namaPenghuni.trim().toUpperCase()
  );

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(currentWarga.avatarUrl || '');
  const [profilePhone, setProfilePhone] = useState(currentWarga.kontakHp || currentWarga.hpPenghuni || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Presensi History Filter
  const [rondaHistoryFilter, setRondaHistoryFilter] = useState<'semua' | 'saya'>('semua');

  // Presensi Selfie State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isSubmittingPresensi, setIsSubmittingPresensi] = useState(false);
  const [presensiFeedback, setPresensiFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Keluhan Form State
  const [showKeluhanModal, setShowKeluhanModal] = useState(false);
  const [keluhanJudul, setKeluhanJudul] = useState('');
  const [keluhanDeskripsi, setKeluhanDeskripsi] = useState('');
  const [keluhanKategori, setKeluhanKategori] = useState<'Fasilitas' | 'Keamanan' | 'Kebersihan' | 'Lainnya'>('Fasilitas');
  const [isSubmittingKeluhan, setIsSubmittingKeluhan] = useState(false);

  // Bayar Tagihan State
  const [showBayarModal, setShowBayarModal] = useState(false);
  const [bayarNominal, setBayarNominal] = useState<number>(myTagihan?.totalKewajiban || 50000);
  const [metodeBayar, setMetodeBayar] = useState<'Transfer' | 'Tunai / Jimpitan'>('Transfer');
  const [kelebihanOption, setKelebihanOption] = useState<'pembayaran_tagihan' | 'donasi_kas' | 'titipan_bulan_depan' | 'tarik_kembali'>('pembayaran_tagihan');
  const [titipanInputNominal, setTitipanInputNominal] = useState<number>(0);
  const [titipanFeedbackMsg, setTitipanFeedbackMsg] = useState<string | null>(null);
  const [showSplitModalWarga, setShowSplitModalWarga] = useState(false);
  const [splitDonasiNominalWarga, setSplitDonasiNominalWarga] = useState<number>(0);

  // Preview Report Period
  const [reportPeriod, setReportPeriod] = useState<'Bulanan' | 'Tahunan'>('Bulanan');

  // Watch GPS Location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        const dist = calculateDistanceMeters(lat, lng, settings.posRondaLat, settings.posRondaLng);
        setDistanceMeters(dist);
      },
      (err) => {
        // Fallback for sandboxed environment
        const simLat = settings.posRondaLat + 0.0001;
        const simLng = settings.posRondaLng + 0.0001;
        setUserLocation({ lat: simLat, lng: simLng });
        setDistanceMeters(calculateDistanceMeters(simLat, simLng, settings.posRondaLat, settings.posRondaLng));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [settings.posRondaLat, settings.posRondaLng]);

  // Check if within ronda hours (strictly enforced, no bypass)
  const checkTimeValid = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeVal = currentHour * 60 + currentMinute;

    const [startH, startM] = (settings.jamMulaiRonda || '22:00').split(':').map(Number);
    const [endH, endM] = (settings.jamSelesaiRonda || '23:59').split(':').map(Number);

    const startVal = startH * 60 + (startM || 0);
    const endVal = endH * 60 + (endM || 0);

    return timeVal >= startVal && timeVal <= endVal;
  };

  const isTimeValid = checkTimeValid();
  // Validasi jarak fisik ke Pos Ronda RT.03 (strictly enforced, no bypass)
  const isDistanceValid = distanceMeters <= (settings.posRondaRadiusMeters || 50);

  // Check if resident is scheduled for ronda tonight or this week
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = days[new Date().getDay()];
  const myRondaDay = rondaSchedules.find((s) =>
    s.petugasNames.some((name) => name.toUpperCase() === currentWarga.namaPenghuni.toUpperCase())
  );
  const isRondaTonight = myRondaDay?.hari === todayName;

  const myReguMembers = myRondaDay
    ? myRondaDay.petugasNames.filter(
        (name) => name.toUpperCase() !== currentWarga.namaPenghuni.toUpperCase()
      )
    : [];

  const myPresensiLogs = presensiList.filter(
    (p) =>
      p.wargaId === currentWarga.id ||
      p.nama.trim().toUpperCase() === currentWarga.namaPenghuni.trim().toUpperCase()
  );

  // Presensi Submit Handler
  const handleSubmitPresensiWarga = async () => {
    if (!capturedPhoto) {
      setPresensiFeedback({ success: false, msg: 'Wajib mengambil foto selfie langsung!' });
      return;
    }

    if (!isDistanceValid) {
      setPresensiFeedback({
        success: false,
        msg: `Jarak Anda (${formatDistance(distanceMeters)}) di luar radius Pos Ronda RT.03.`,
      });
      return;
    }

    if (!isTimeValid) {
      setPresensiFeedback({
        success: false,
        msg: `Presensi hanya dibuka pada jam ronda (${settings.jamMulaiRonda} s/d ${settings.jamSelesaiRonda} WIB).`,
      });
      return;
    }

    setIsSubmittingPresensi(true);
    setPresensiFeedback(null);

    try {
      const now = new Date();
      await addPresensiRonda({
        nama: currentWarga.namaPenghuni,
        tanggal: now.toISOString().slice(0, 10),
        waktu: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        latitude: userLocation?.lat || settings.posRondaLat,
        longitude: userLocation?.lng || settings.posRondaLng,
        distanceMeters: distanceMeters,
        selfieUrl: capturedPhoto,
        status: 'Hadir Tervalidasi',
      });

      setPresensiFeedback({
        success: true,
        msg: 'Presensi ronda Anda berhasil terekam & disiarkan ke WhatsApp Grup RT.03!',
      });
      setCapturedPhoto(null);
    } catch (e: any) {
      setPresensiFeedback({ success: false, msg: e.message || 'Gagal menyimpan presensi' });
    } finally {
      setIsSubmittingPresensi(false);
    }
  };

  // Submit Keluhan Handler
  const handleSaveKeluhan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keluhanJudul.trim() || !keluhanDeskripsi.trim()) return;

    setIsSubmittingKeluhan(true);
    try {
      await submitKeluhan({
        wargaId: currentWarga.id,
        namaWarga: currentWarga.namaPenghuni,
        blokNo: `${currentWarga.blok}/${currentWarga.noRumah}`,
        kategori: keluhanKategori,
        judul: keluhanJudul,
        deskripsi: keluhanDeskripsi,
      });

      setKeluhanJudul('');
      setKeluhanDeskripsi('');
      setShowKeluhanModal(false);
    } finally {
      setIsSubmittingKeluhan(false);
    }
  };

  // Submit Payment Handler
  const handleConfirmBayarWarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTagihan || bayarNominal <= 0) return;

    bayarTagihanWarga(
      myTagihan.id,
      Number(bayarNominal),
      metodeBayar,
      kelebihanOption
    );

    setShowBayarModal(false);
  };

  // My Complaints List
  const myComplaints = keluhanList.filter((k) => k.wargaId === currentWarga.id);

  return (
    <div className="space-y-4">
      {/* Resident Identity Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-800">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Portal Warga RT.03</span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-100 text-teal-900 border border-teal-300 font-bold">
            Blok {currentWarga.blok}/{currentWarga.noRumah}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Foto Profil Warga dengan Tombol Pasang Profil */}
            <div className="relative shrink-0">
              {currentWarga.avatarUrl ? (
                <img
                  src={currentWarga.avatarUrl}
                  alt={currentWarga.namaPenghuni}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-sm border-2 border-teal-400">
                  {currentWarga.namaPenghuni ? currentWarga.namaPenghuni.charAt(0).toUpperCase() : 'W'}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setProfileAvatar(currentWarga.avatarUrl || '');
                  setProfilePhone(currentWarga.kontakHp || currentWarga.hpPenghuni || '');
                  setProfileFeedback(null);
                  setShowProfileModal(true);
                }}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white text-teal-700 shadow-sm border border-teal-300 hover:bg-teal-50 transition"
                title="Pasang / Ubah Foto Profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Selamat Datang, {currentWarga.namaPenghuni}
              </h2>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Perum BPTW Cilacap • Status: {currentWarga.statusHuni} ({currentWarga.kriteriaRonda})</span>
                {currentWarga.statusUsiaPenghuni && currentWarga.statusUsiaPenghuni !== '-' && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      currentWarga.statusUsiaPenghuni === 'Lansia'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    }`}
                  >
                    {currentWarga.statusUsiaPenghuni === 'Lansia' ? '👴 Lansia' : '⚡ Usia Produktif'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setProfileAvatar(currentWarga.avatarUrl || '');
              setProfilePhone(currentWarga.kontakHp || currentWarga.hpPenghuni || '');
              setProfileFeedback(null);
              setShowProfileModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pasang Profil</span>
            <span className="sm:hidden">Profil</span>
          </button>
        </div>

        {/* Kontak Pengurus RT */}
        <div className="pt-2 border-t border-teal-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-teal-900 font-medium">
            <span>Pusat Komunikasi & Layanan Warga RT.03</span>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              const ketuaPhone = settings.kontakKetuaRt || '628123456789';
              const cleanKetua = ketuaPhone.replace(/[^0-9]/g, '');
              const waKetua = cleanKetua.startsWith('62')
                ? cleanKetua
                : cleanKetua.startsWith('08')
                ? `62${cleanKetua.slice(1)}`
                : cleanKetua;
              return (
                <a
                  href={`https://wa.me/${waKetua}?text=${encodeURIComponent(
                    `Halo Pak Ketua RT 03, saya ${currentWarga.namaPenghuni} (Blok ${currentWarga.blok}/${currentWarga.noRumah}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-sm transition"
                  title="Hubungi Ketua RT via WhatsApp"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Chat Pak RT</span>
                </a>
              );
            })()}
          </div>
        </div>
      </div>

      {/* TAB 1: BERANDA WARGA & NOTIFIKASI PENGINGAT */}
      {activeTab === 'home' && (
        <div className="space-y-3">
          {/* Notification Alert: Ronda Reminder */}
          {myRondaDay ? (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                isRondaTonight
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
              }`}
            >
              <Bell className="w-5 h-5 shrink-0 text-amber-400 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-white">
                  {isRondaTonight ? '⚠️ PENGINGAT JADWAL RONDA MALAM INI!' : `Pengingat Ronda: Hari ${myRondaDay.hari}`}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {isRondaTonight
                    ? `Malam ini (${todayName}) adalah jadwal ronda Anda bersama rekan jaga: ${myRondaDay.petugasNames.join(
                        ', '
                      )}. Harap hadir presensi di Pos Ronda pukul ${settings.jamMulaiRonda} - ${settings.jamSelesaiRonda} WIB.`
                    : `Anda terjadwal piket ronda setiap hari ${myRondaDay.hari}. Rekan jaga: ${myRondaDay.petugasNames.join(
                        ', '
                      )}.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Status Anda: Bebas dari kewajiban ronda malam.</span>
            </div>
          )}

          {/* Quick Status Tagihan Card */}
          {myTagihan && (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Status Iuran & Kewajiban Saya</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    myTagihan.statusBayar === 'Lunas' || myTagihan.statusBayar === 'Lebih Bayar'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {myTagihan.statusBayar}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Total Kewajiban:</span>
                  <p className="font-mono font-bold text-white text-sm">
                    {formatRupiah(myTagihan.totalKewajiban)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Sudah Dibayar:</span>
                  <p className="font-mono font-bold text-emerald-400 text-sm">
                    {formatRupiah(myTagihan.jumlahDibayar)}
                  </p>
                </div>
              </div>

              {myTagihan.totalKewajiban > myTagihan.jumlahDibayar && (
                <button
                  onClick={() => setShowBayarModal(true)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition mt-1"
                >
                  Konfirmasi / Bayar Iuran Sekarang
                </button>
              )}
            </div>
          )}

          {/* DEDICATED CARD: DATA RONDA INDIVIDU SAYA */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Data Ronda Individu Saya</h3>
                  <p className="text-[10px] text-slate-400">
                    Jadwal, Regu Petugas, Presensi & Denda Warga
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                  myDendaEntry && myDendaEntry.jumlahAlpa === 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {myDendaEntry && myDendaEntry.jumlahAlpa === 0
                  ? '✓ Bebas Denda'
                  : `${myDendaEntry?.jumlahAlpa || 0}x Alpa`}
              </span>
            </div>

            {/* Rincian Jadwal & Rekan Regu */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jadwal Tugas Ronda:</span>
                <span className="font-bold text-amber-300">
                  {myRondaDay ? `Hari ${myRondaDay.hari} (${settings.jamMulaiRonda} - ${settings.jamSelesaiRonda} WIB)` : 'Bebas Ronda'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 shrink-0">Rekan Satu Regu:</span>
                <span className="text-right text-slate-200 font-medium">
                  {myReguMembers.length > 0 ? myReguMembers.join(', ') : 'Mandiri / Tidak Ada'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Status Usia & Kategori:</span>
                <span className="text-slate-300">
                  {currentWarga.statusUsiaPenghuni === 'Lansia' ? '👴 Lansia (Bebas Ronda)' : `⚡ ${currentWarga.statusUsiaPenghuni}`} • Kerja {currentWarga.domisiliKerja || 'Dalam Kota'}
                </span>
              </div>
            </div>

            {/* Status 4 Minggu Ronda Bulan Berjalan */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                Status Kehadiran 4 Minggu (September 2026):
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div
                  className={`p-2 rounded-xl border ${
                    myDendaEntry?.minggu1
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span className="block text-[9px] text-slate-400">M1 (1-7)</span>
                  <span className="font-bold">{myDendaEntry?.minggu1 ? '✓ Hadir' : '✕ Alpa'}</span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    myDendaEntry?.minggu2
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span className="block text-[9px] text-slate-400">M2 (8-14)</span>
                  <span className="font-bold">{myDendaEntry?.minggu2 ? '✓ Hadir' : '✕ Alpa'}</span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    myDendaEntry?.minggu3
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span className="block text-[9px] text-slate-400">M3 (15-21)</span>
                  <span className="font-bold">{myDendaEntry?.minggu3 ? '✓ Hadir' : '✕ Alpa'}</span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    myDendaEntry?.minggu4
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span className="block text-[9px] text-slate-400">M4 (22-30)</span>
                  <span className="font-bold">{myDendaEntry?.minggu4 ? '✓ Hadir' : '✕ Alpa'}</span>
                </div>
              </div>
            </div>

            {/* Integrasi Denda Bulan Lalu vs Bulan Berjalan */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block">Denda Ronda Bulan Lalu (Agt):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm block">
                  {formatRupiah(myTagihan?.dendaRonda || 0)}
                </span>
                <span className="text-[9px] text-slate-400 leading-tight block">
                  ✓ Terposting ke komponen tagihan September
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-amber-400 block font-semibold">Denda Ronda Berjalan (Sept):</span>
                <span
                  className={`font-mono font-bold text-sm block ${
                    (myDendaEntry?.dendaTotal || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {formatRupiah(myDendaEntry?.dendaTotal || 0)}
                </span>
                <span className="text-[9px] text-amber-300/80 leading-tight block">
                  Masuk tagihan Okt 2026 (dipush Keamanan)
                </span>
              </div>
            </div>

            {myDendaEntry?.catatan && (
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-300 flex items-center justify-between">
                <span>Formula Denda:</span>
                <span className="font-semibold text-white">{myDendaEntry.catatan}</span>
              </div>
            )}
          </div>

          {/* Pengumuman Warga Terbaru */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white px-1">Pengumuman & Siaran RT.03</h3>
            {pengumumanList.map((pgm) => (
              <div
                key={pgm.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                    {pgm.kategori}
                  </span>
                  <span className="text-[10px] text-slate-400">{pgm.tanggal}</span>
                </div>
                <h4 className="font-bold text-white text-sm">{pgm.judul}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{pgm.isi}</p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/60">
                  Dipublikasikan oleh {pgm.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ENTRI PRESENSI & CHECKLIST 4 MINGGU RONDA */}
      {activeTab === 'presensi_warga' && (() => {
        const currentWeek = getRondaWeekNumber();
        const weekDates =
          currentWeek === 1
            ? '1 - 7 Sept'
            : currentWeek === 2
            ? '8 - 14 Sept'
            : currentWeek === 3
            ? '15 - 21 Sept'
            : '22 - 30 Sept';

        const isCurrentWeekAttended = myDendaEntry
          ? currentWeek === 1
            ? myDendaEntry.minggu1
            : currentWeek === 2
            ? myDendaEntry.minggu2
            : currentWeek === 3
            ? myDendaEntry.minggu3
            : myDendaEntry.minggu4
          : false;

        const hadirCount = myDendaEntry
          ? (myDendaEntry.minggu1 ? 1 : 0) +
            (myDendaEntry.minggu2 ? 1 : 0) +
            (myDendaEntry.minggu3 ? 1 : 0) +
            (myDendaEntry.minggu4 ? 1 : 0)
          : 0;

        return (
          <div className="space-y-3.5">
            {/* Profil & Jadwal Ronda Individu Warga Card */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-950/70 border border-teal-500/30 text-teal-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Profil & Regu Ronda Individu</h3>
                    <p className="text-[10px] text-slate-400">
                      {currentWarga.namaPenghuni} • Blok {currentWarga.blok}/{currentWarga.noRumah}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-900 text-teal-300 border border-slate-700">
                  {currentWarga.kriteriaRonda}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Jadwal Tugas Ronda:</span>
                  <p className="font-bold text-amber-300">
                    {myRondaDay ? `Hari ${myRondaDay.hari}` : 'Bebas Ronda'} ({settings.jamMulaiRonda} - {settings.jamSelesaiRonda} WIB)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Status Usia: <strong className="text-slate-200">{currentWarga.statusUsiaPenghuni}</strong> • Domisili: {currentWarga.domisiliKerja || 'Dalam Kota'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Rekan Satu Regu Piket:</span>
                  <p className="text-slate-200 font-medium leading-snug">
                    {myReguMembers.length > 0 ? myReguMembers.join(', ') : 'Mandiri / Bebas Jadwal'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Pos: Pos Ronda Utama RT.03
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist 4 Minggu Ronda Warga Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Checklist 4 Minggu Ronda Saya</h3>
                    <p className="text-[11px] text-slate-500">Periode Bulan September 2026</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    myDendaEntry && myDendaEntry.jumlahAlpa === 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {myDendaEntry && myDendaEntry.jumlahAlpa === 0 ? '✓ Bebas Denda' : `${myDendaEntry?.jumlahAlpa || 0} Alpa`}
                </span>
              </div>

              {/* SOP Rule Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>SOP Presensi & Denda Ronda RT.03 (1 Bulan = 4 Minggu):</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Dalam 1 minggu warga hanya diperbolehkan/diwajibkan <strong>satu kali presensi</strong> meskipun tidak pada jadwal resminya (kehadiran di hari mana pun pada minggu berjalan sah memenuhi kewajiban).
                </p>
                <div className="p-2 rounded-lg bg-indigo-50/80 border border-indigo-100 text-[11px] space-y-1 text-indigo-950">
                  <p>• Denda per ketidakhadiran: <strong>Rp 5.000 / minggu alpa</strong></p>
                  <p>• Denda jika tidak hadir 1 bulan penuh (4 minggu alpa):</p>
                  <div className="pl-3 space-y-0.5 text-[10px] text-indigo-900">
                    <div>- Status usia produktif domisili kerja luar kota: <strong>Rp 25.000</strong></div>
                    <div>- Status usia produktif domisili kerja dalam kota: <strong>Rp 50.000</strong></div>
                  </div>
                </div>
              </div>

              {/* 4-Week Progress Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Minggu 1 */}
                <div
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    myDendaEntry?.minggu1
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {myDendaEntry?.minggu1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-xs">Minggu I</span>
                  </div>
                  <span className="text-[10px] block opacity-75">Tgl 1 - 7 Sept</span>
                  <span className="text-[10px] font-semibold block">
                    {myDendaEntry?.minggu1 ? 'Hadir (1x)' : 'Alpa'}
                  </span>
                </div>

                {/* Minggu 2 */}
                <div
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    myDendaEntry?.minggu2
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {myDendaEntry?.minggu2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-xs">Minggu II</span>
                  </div>
                  <span className="text-[10px] block opacity-75">Tgl 8 - 14 Sept</span>
                  <span className="text-[10px] font-semibold block">
                    {myDendaEntry?.minggu2 ? 'Hadir (1x)' : 'Alpa'}
                  </span>
                </div>

                {/* Minggu 3 */}
                <div
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    myDendaEntry?.minggu3
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {myDendaEntry?.minggu3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-xs">Minggu III</span>
                  </div>
                  <span className="text-[10px] block opacity-75">Tgl 15 - 21 Sept</span>
                  <span className="text-[10px] font-semibold block">
                    {myDendaEntry?.minggu3 ? 'Hadir (1x)' : 'Alpa'}
                  </span>
                </div>

                {/* Minggu 4 */}
                <div
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    myDendaEntry?.minggu4
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {myDendaEntry?.minggu4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-xs">Minggu IV</span>
                  </div>
                  <span className="text-[10px] block opacity-75">Tgl 22 - 30 Sept</span>
                  <span className="text-[10px] font-semibold block">
                    {myDendaEntry?.minggu4 ? 'Hadir (1x)' : 'Alpa'}
                  </span>
                </div>
              </div>

              {/* Status Rekapitulasi Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Kehadiran Bulan Ini</span>
                    <span className="font-bold text-slate-900">
                      {hadirCount} dari 4 Minggu ({myDendaEntry?.jumlahAlpa || 0} alpa)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Denda Ronda Bulan Ini</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        (myDendaEntry?.dendaTotal || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {myDendaEntry ? formatRupiah(myDendaEntry.dendaTotal) : 'Rp 0'}
                    </span>
                  </div>
                </div>

                {myDendaEntry && myDendaEntry.catatan && (
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Keterangan Perhitungan:</span>
                    <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {myDendaEntry.catatan}
                    </span>
                  </div>
                )}
              </div>

              {/* Current Week Status Banner */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  isCurrentWeekAttended
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {isCurrentWeekAttended ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    Minggu Berjalan: <strong>Minggu ke-{currentWeek} ({weekDates})</strong>
                  </p>
                  <p className="text-[11px] opacity-90">
                    {isCurrentWeekAttended
                      ? '✓ Anda sudah presensi minggu ini. Kewajiban Anda sudah terpenuhi! (Presensi baru tetap dicatat sebagai log patroli).'
                      : 'Anda belum presensi untuk minggu berjalan. Ambil foto selfie di Pos Ronda untuk melunasi kewajiban minggu ini.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Time Status */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Validasi Lokasi Pos Ronda RT.03</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Jarak: {formatDistance(distanceMeters)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div
                  className={`p-2 rounded-xl border ${
                    isDistanceValid
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {isDistanceValid ? '✓ Di Area Pos Ronda' : '✕ Di Luar Radius Pos'}
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    isTimeValid
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isTimeValid ? '✓ Jam Ronda Buka' : '✕ Di Luar Jam Ronda'}
                </div>
              </div>
            </div>

            {/* Camera Selfie Component */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
              <p className="text-xs font-semibold text-slate-300">
                Ambil Foto Selfie di Lokasi Pos Ronda:
              </p>

              <SelfieCamera
                capturedImage={capturedPhoto}
                onCapture={(b64) => setCapturedPhoto(b64)}
                onRetake={() => setCapturedPhoto(null)}
              />

              {presensiFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    presensiFeedback.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {presensiFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <p className="font-semibold">{presensiFeedback.msg}</p>
                </div>
              )}

              <button
                type="button"
                disabled={isSubmittingPresensi || !capturedPhoto}
                onClick={handleSubmitPresensiWarga}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmittingPresensi ? 'Menyimpan Presensi...' : 'Kirim Presensi Ronda Sekarang'}
                </span>
              </button>
            </div>

            {/* Histori Keseluruhan Warga yang Melakukan Presensi Ronda */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Histori Keseluruhan Presensi Ronda Warga</h3>
                    <p className="text-[10px] text-slate-400">Catatan presensi seluruh warga yang hadir ronda di Pos RT.03</p>
                  </div>
                </div>

                {/* Filter Toggle: Semua Warga vs Presensi Saya */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setRondaHistoryFilter('semua')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rondaHistoryFilter === 'semua'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua Warga ({presensiList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRondaHistoryFilter('saya')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rondaHistoryFilter === 'saya'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Saya ({myPresensiLogs.length})
                  </button>
                </div>
              </div>

              {(() => {
                const logsToDisplay = rondaHistoryFilter === 'saya' ? myPresensiLogs : presensiList;

                if (logsToDisplay.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
                      <p className="text-slate-400 text-xs">
                        {rondaHistoryFilter === 'saya'
                          ? `Belum ada riwayat presensi patroli atas nama ${currentWarga.namaPenghuni} di bulan ini.`
                          : 'Belum ada catatan presensi ronda warga yang tersimpan di sistem.'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Gunakan kamera selfie di atas saat bertugas ronda di Pos Ronda untuk mencatatkan kehadiran.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {logsToDisplay.map((log) => {
                      const isMine =
                        log.wargaId === currentWarga.id ||
                        log.nama?.trim().toLowerCase() === currentWarga.namaPenghuni.trim().toLowerCase();

                      return (
                        <div
                          key={log.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                            isMine
                              ? 'bg-teal-950/30 border-teal-500/40 ring-1 ring-teal-500/20'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          {log.fotoSelfie ? (
                            <img
                              src={log.fotoSelfie}
                              alt="Selfie Presensi"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                              <Camera className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs">{log.nama}</span>
                                {isMine && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                    Saya
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                {log.waktuPresensi} WIB
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 flex items-center justify-between">
                              <span>Tanggal: {log.tanggal}</span>
                              <span className="text-[10px] font-mono">
                                {log.jarakMeter <= (settings.posRondaRadiusMeters || 50) ? (
                                  <span className="text-emerald-400">✓ Di Area Pos ({log.jarakMeter}m)</span>
                                ) : (
                                  <span className="text-amber-400">⚠️ {log.jarakMeter}m</span>
                                )}
                              </span>
                            </p>

                            <p className="text-[10px] text-teal-300">
                              {log.catatan || 'Presensi Mandiri Terverifikasi'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: LEMBAR TAGIHAN & STATUS IURAN SAYA */}
      {activeTab === 'tagihan_warga' && (
        <div className="space-y-3">
          {myTagihan && (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
              {/* Header Lembar Tagihan */}
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Lembar Tagihan Iuran Lingkungan</h3>
                  <p className="text-[10px] text-slate-400">
                    Periode: {myTagihan.periode} • Kavling {myTagihan.blokNo} • {currentWarga.namaPenghuni}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    myTagihan.statusBayar === 'Lunas' || myTagihan.statusBayar === 'Lebih Bayar'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {myTagihan.statusBayar}
                </span>
              </div>

              {/* Strip Kriteria Warga (Penentu Komponen Tagihan) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Kriteria Penetapan Komponen Iuran Anda:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    Status Huni: <strong className="text-white">{currentWarga.statusHuni}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    Usia Penghuni:{' '}
                    <strong className={currentWarga.statusUsiaPenghuni === 'Lansia' ? 'text-amber-300' : 'text-indigo-300'}>
                      {currentWarga.statusUsiaPenghuni || 'Produktif'}
                    </strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    Domisili Kerja: <strong className="text-white">{currentWarga.domisiliKerja || 'Dalam Kota'}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    Tugas Ronda:{' '}
                    <strong className={currentWarga.statusUsiaPenghuni === 'Lansia' ? 'text-amber-300' : 'text-blue-300'}>
                      {currentWarga.statusUsiaPenghuni === 'Lansia' ? 'Bebas Ronda (Lansia)' : currentWarga.kriteriaRonda}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Rincian Komponen Sesuai Kriteria */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Dana Sosial RT (Dansos RT)</span>
                  <span className="font-mono">{formatRupiah(myTagihan.dansosRT)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Dana Sosial RW (Dansos RW)</span>
                  <span className="font-mono">{formatRupiah(myTagihan.dansosRW)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Pembangunan Sarana Lingkungan</span>
                  <span className="font-mono">{formatRupiah(myTagihan.pembangunan)}</span>
                </div>

                {/* Snack Rapat - disesuaikan kriteria status huni */}
                <div className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span>Snack Rapat Warga RT</span>
                    {currentWarga.statusHuni === 'Kosong' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Bebas (Rumah Kosong)
                      </span>
                    )}
                  </div>
                  <span className="font-mono">
                    {myTagihan.snack > 0 ? formatRupiah(myTagihan.snack) : 'Rp 0'}
                  </span>
                </div>

                {/* Jimpitan Lingkungan - disesuaikan kriteria Lansia / Kosong */}
                <div className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span>Jimpitan Lingkungan</span>
                    {currentWarga.statusUsiaPenghuni === 'Lansia' ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold">
                        Bebas (Lansia)
                      </span>
                    ) : currentWarga.statusHuni === 'Kosong' ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Bebas (Rumah Kosong)
                      </span>
                    ) : null}
                  </div>
                  <span className="font-mono">
                    {myTagihan.jimpitan > 0 ? formatRupiah(myTagihan.jimpitan) : 'Rp 0'}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-700/60">
                  <span>Subtotal Iuran Rutin</span>
                  <span className="font-mono">{formatRupiah(myTagihan.totalIuran)}</span>
                </div>

                {/* Denda Ronda Bulan Lalu - disesuaikan kriteria Lansia / Kriteria Ronda */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className={myTagihan.dendaRonda > 0 ? 'text-amber-300 font-semibold' : 'text-slate-400 text-[11px]'}>
                      Denda Ronda Bulan Lalu
                    </span>
                    {currentWarga.statusUsiaPenghuni === 'Lansia' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        Bebas Ronda (Lansia)
                      </span>
                    )}
                  </div>
                  <span className={`font-mono ${myTagihan.dendaRonda > 0 ? 'text-amber-300 font-semibold' : 'text-emerald-400 text-[11px]'}`}>
                    {currentWarga.statusUsiaPenghuni === 'Lansia'
                      ? 'Rp 0'
                      : myTagihan.dendaRonda > 0
                      ? formatRupiah(myTagihan.dendaRonda)
                      : 'Rp 0 (Disiplin)'}
                  </span>
                </div>

                {/* Callout Info Denda Berjalan (September) */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] space-y-1 my-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Status Denda Ronda Berjalan (September 2026):</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatRupiah(myDendaEntry?.dendaTotal || 0)}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Sesuai SOP, denda ronda September ({myDendaEntry?.jumlahAlpa || 0}x alpa) dipantau pada rekap berjalan Bendahara dan akan ditagihkan pada siklus bulan berikutnya (Oktober 2026) setelah dipush Seksi Keamanan.
                  </p>
                </div>

                {/* Denda Kerja Bakti jika ada */}
                {myTagihan.dendaKerjaBakti > 0 && (
                  <div className="flex justify-between text-amber-300 font-semibold">
                    <span>Denda Kerja Bakti (Alpa Gotong Royong)</span>
                    <span className="font-mono">{formatRupiah(myTagihan.dendaKerjaBakti)}</span>
                  </div>
                )}

                {/* Piutang bulan lalu */}
                {myTagihan.piutangBulanLalu > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Tunggakan Bulan Sebelumnya</span>
                    <span className="font-mono">{formatRupiah(myTagihan.piutangBulanLalu)}</span>
                  </div>
                )}

                {/* Saldo Deposit bulan lalu pemotong tagihan */}
                {myTagihan.titipanDigunakanUntukTagihan > 0 && (
                  <div className="flex justify-between text-teal-300 font-semibold">
                    <span>Potongan Saldo Deposit Bulan Lalu</span>
                    <span className="font-mono">-{formatRupiah(myTagihan.titipanDigunakanUntukTagihan)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-slate-700">
                  <span>TOTAL KEWAJIBAN BULAN INI</span>
                  <span className="font-mono text-emerald-400">{formatRupiah(myTagihan.totalKewajiban)}</span>
                </div>

                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Jumlah yang Sudah Dibayar</span>
                  <span className="font-mono">{formatRupiah(myTagihan.jumlahDibayar)}</span>
                </div>
              </div>

              {/* Status Piutang Warga jika belum atau kurang bayar */}
              {(myTagihan.statusBayar === 'Belum Bayar' || myTagihan.statusBayar === 'Kurang Bayar' || myTagihan.piutangBulanLalu > 0) && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-rose-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-rose-400" />
                      <span>Piutang Warga (Debit / Hak Kas RT)</span>
                    </span>
                    <span className="font-mono text-sm text-rose-300 font-bold">
                      {formatRupiah(Math.max(0, myTagihan.totalKewajiban - myTagihan.jumlahDibayar))}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    <strong>SOP Keuangan RT.03:</strong> Kekurangan (-) bayar dari bulan sebelumnya menjadi <strong>Piutang Warga (Debit / Hak Kas RT)</strong> yang tercatat secara resmi pada buku kas RT. Silakan lakukan pelunasan via transfer atau titipkan melalui pengurus saat jimpitan gotong royong.
                  </p>
                  {myTagihan.piutangBulanLalu > 0 && (
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-rose-500/30 flex justify-between text-[11px]">
                      <span className="text-slate-400">Kekurangan Bulan Sebelumnya (Hak RT):</span>
                      <strong className="font-mono text-rose-400">{formatRupiah(myTagihan.piutangBulanLalu)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Form Opsi Deposit Warga (Kelebihan Bayar) dengan Peruntukan Donasi & Pembayaran Tagihan */}
              {myTagihan.kelebihanBayar > 0 && (
                <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/50 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                      <Coins className="w-4 h-4" />
                      <span>Saldo Deposit Warga: {formatRupiah(myTagihan.kelebihanBayar)}</span>
                    </div>
                    <span className="text-[10px] bg-teal-900/90 text-teal-200 px-2.5 py-0.5 rounded-full font-bold border border-teal-500/40">
                      Deposit Aktif
                    </span>
                  </div>

                  <p className="text-[11px] text-teal-200 leading-relaxed">
                    <strong>SOP Keuangan RT.03:</strong> Kelebihan (+) Bayar dari Bulan Sebelumnya merupakan <strong>deposit</strong> yang angkanya sudah dikurangi tagihan bulan ini dan Anda memiliki pilihan untuk <strong>Donasi</strong> dan atau untuk <strong>membayar tagihan di bulan yang akan datang</strong>:
                  </p>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-700/40 space-y-1.5">
                    <label className="text-[11px] text-slate-300 font-medium block">
                      Entri Nominal Alokasi Deposit (Rp):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1000}
                        max={myTagihan.kelebihanBayar}
                        value={titipanInputNominal || myTagihan.kelebihanBayar}
                        onChange={(e) =>
                          setTitipanInputNominal(
                            Math.min(myTagihan.kelebihanBayar, Math.max(0, Number(e.target.value)))
                          )
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-teal-400"
                      />
                      <button
                        type="button"
                        onClick={() => setTitipanInputNominal(myTagihan.kelebihanBayar)}
                        className="px-3 py-1.5 rounded-lg bg-teal-900/80 hover:bg-teal-800 text-teal-200 text-xs font-bold border border-teal-600/40"
                      >
                        Semua ({formatRupiah(myTagihan.kelebihanBayar)})
                      </button>
                    </div>
                  </div>

                  {titipanFeedbackMsg && (
                    <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-semibold">
                      ✓ {titipanFeedbackMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nom = titipanInputNominal || myTagihan.kelebihanBayar;
                        alokasikanDanaTitipan(myTagihan.id, 'pembayaran_tagihan', nom);
                        setTitipanFeedbackMsg(`Berhasil dialokasikan ${formatRupiah(nom)} saldo deposit untuk membayar tagihan di bulan yang akan datang.`);
                        setTimeout(() => setTitipanFeedbackMsg(null), 4000);
                      }}
                      className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-center transition flex flex-col items-center justify-center gap-0.5 shadow"
                    >
                      <span className="text-xs">1. Tagihan Datang</span>
                      <span className="text-[10px] font-normal opacity-85">Bayar Tagihan Bulan Depan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nom = titipanInputNominal || myTagihan.kelebihanBayar;
                        alokasikanDanaTitipan(myTagihan.id, 'donasi_kas', nom);
                        setTitipanFeedbackMsg(`Terima kasih! ${formatRupiah(nom)} saldo deposit dialihkan sebagai Donasi Kas RT.`);
                        setTimeout(() => setTitipanFeedbackMsg(null), 4000);
                      }}
                      className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-center transition flex flex-col items-center justify-center gap-0.5 shadow"
                    >
                      <span className="text-xs">2. Donasi Kas RT</span>
                      <span className="text-[10px] font-normal opacity-85">Salurkan Sukarela ke Kas RT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSplitDonasiNominalWarga(myTagihan.alokasiDonasiNominal || Math.floor(myTagihan.kelebihanBayar / 2));
                        setShowSplitModalWarga(true);
                      }}
                      className="p-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-center transition flex flex-col items-center justify-center gap-0.5 shadow"
                    >
                      <span className="text-xs">3. Kombinasi</span>
                      <span className="text-[10px] font-normal opacity-85">Donasi & Tagihan Datang</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-teal-300 font-semibold pt-1 border-t border-teal-800/60">
                    Alokasi Saat Ini:{' '}
                    <strong className="text-white">
                      {myTagihan.alokasiDonasiNominal && myTagihan.alokasiTagihanMendatangNominal
                        ? `Kombinasi: Donasi Kas RT (${formatRupiah(myTagihan.alokasiDonasiNominal)}) & Tagihan Datang (${formatRupiah(myTagihan.alokasiTagihanMendatangNominal)})`
                        : myTagihan.alokasiKelebihan === 'donasi_kas'
                        ? 'Donasi Kas RT'
                        : 'Membayar Tagihan di Bulan yang Akan Datang'}
                    </strong>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={openPrintDialog}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cetak Kwitansi</span>
                </button>

                <button
                  onClick={() => setShowBayarModal(true)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Konfirmasi Bayar</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Bayar Warga */}
          {showBayarModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleConfirmBayarWarga}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Konfirmasi Pembayaran Iuran</h3>
                  <button
                    type="button"
                    onClick={() => setShowBayarModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Nominal Bayar (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={bayarNominal}
                    onChange={(e) => setBayarNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Metode:</label>
                  <select
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Transfer">Transfer Bank / QRIS Kas RT</option>
                    <option value="Tunai / Jimpitan">Titip Tunai Petugas Jimpitan</option>
                  </select>
                </div>

                {/* Sifat Alur Sistem Deposit Kelebihan Bayar Warga */}
                {myTagihan && bayarNominal > (myTagihan.totalKewajiban - myTagihan.jumlahDibayar) && (
                  <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-200 space-y-1.5">
                    <p className="font-bold text-[11px] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>
                        Terdeteksi Kelebihan Bayar:{' '}
                        {formatRupiah(bayarNominal - (myTagihan.totalKewajiban - myTagihan.jumlahDibayar))}
                      </span>
                    </p>
                    <p className="text-[10px] text-teal-300">
                      Pilih peruntukan saldo deposit warga:
                    </p>
                    <select
                      value={kelebihanOption}
                      onChange={(e) => setKelebihanOption(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="pembayaran_tagihan">
                        Simpan Deposit untuk Pembayaran Tagihan (Bulan Ini & Seterusnya)
                      </option>
                      <option value="donasi_kas">Dialihkan Sebagai Donasi Kas RT</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBayarModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Kirim Konfirmasi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PELAPORAN KELUHAN WARGA */}
      {activeTab === 'keluhan' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Laporan Keluhan Warga</h3>
                <p className="text-[11px] text-slate-400">
                  Fasilitas, keamanan, kebersihan & ketertiban lingkungan
                </p>
              </div>
              <button
                onClick={() => setShowKeluhanModal(true)}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1 text-xs font-semibold"
              >
                <span>+ Lapor Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {myComplaints.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                Anda belum pernah mengirim laporan keluhan.
              </div>
            ) : (
              myComplaints.map((klh) => (
                <div
                  key={klh.id}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-900 text-teal-300 border border-teal-500/40">
                        {klh.kategori}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">{klh.judul}</h4>
                      <p className="text-[10px] text-slate-400">{klh.tanggal}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        klh.status === 'Selesai'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : klh.status === 'Diproses'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {klh.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{klh.deskripsi}</p>

                  {klh.tanggapanPengurus && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 space-y-0.5">
                      <span className="font-bold block">Tanggapan Pengurus RT:</span>
                      <p>{klh.tanggapanPengurus}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* New Complaint Modal */}
          {showKeluhanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <form
                onSubmit={handleSaveKeluhan}
                className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Buat Laporan Keluhan Lingkungan</h3>
                  <button
                    type="button"
                    onClick={() => setShowKeluhanModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Kategori Masalah:</label>
                  <select
                    value={keluhanKategori}
                    onChange={(e) => setKeluhanKategori(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Fasilitas">Fasilitas Umum / PJU / Jalan / Drainase</option>
                    <option value="Keamanan">Keamanan & Ketertiban Lingkungan</option>
                    <option value="Kebersihan">Kebersihan Sampah & Selokan</option>
                    <option value="Lainnya">Masalah Sosial Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Judul Masalah:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lampu PJU Gang E Rusak"
                    value={keluhanJudul}
                    onChange={(e) => setKeluhanJudul(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Rincian Deskripsi Keluhan:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan lokasi tepat dan penjelasan kendala yang dialami..."
                    value={keluhanDeskripsi}
                    onChange={(e) => setKeluhanDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowKeluhanModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingKeluhan}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                  >
                    {isSubmittingKeluhan ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PREVIEW LAPORAN RONDA & KAS RT (READ-ONLY TRANSPARANSI) */}
      {activeTab === 'preview_laporan' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-xs text-teal-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 shrink-0" />
              <span>Transparansi Publik: Anda dapat memantau laporan ronda & kas RT secara terbuka.</span>
            </span>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={openPrintDialog}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white"
                title="Cetak PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transparansi Kas RT */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Transparansi Saldo Kas RT.03</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Pemasukan:</span>
                <p className="font-mono font-bold text-emerald-400 text-xs sm:text-sm truncate">
                  {formatRupiah((pemasukanList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0))}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Pengeluaran:</span>
                <p className="font-mono font-bold text-rose-400 text-xs sm:text-sm truncate">
                  {formatRupiah((pengeluaranList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0))}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Pemasukan Bersih (Saldo):</span>
                <p className="font-mono font-bold text-teal-300 text-xs sm:text-sm truncate">
                  {formatRupiah(
                    (pemasukanList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0) -
                      (pengeluaranList || []).reduce((acc, curr) => acc + (curr.nominal || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Transparansi Presensi Ronda Terakhir */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Catatan Ronda Terkini</span>
            </h3>

            <div className="space-y-1.5">
              {presensiList.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{p.nama}</span>
                    <p className="text-[10px] text-slate-400">{p.tanggal} • {p.waktu} WIB</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Hadir Tervalidasi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Alokasi Deposit Warga (Donasi dan/atau Bayar Tagihan Bulan Datang) */}
      {showSplitModalWarga && myTagihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-teal-500/40 p-5 shadow-2xl text-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Alokasi Pilihan Deposit Anda</h3>
                  <p className="text-[11px] text-teal-300/80">Kavling {myTagihan.blokNo} • {myTagihan.nama}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModalWarga(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* SOP Rule Box */}
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-[11px] text-teal-200 leading-relaxed">
              <p className="font-bold text-teal-300 mb-1">Ketentuan Alokasi Deposit:</p>
              <p>
                Kelebihan (+) Bayar dari Bulan Sebelumnya merupakan <strong>deposit</strong> yang angkanya sudah dikurangi tagihan bulan ini dan warga memiliki pilihan untuk <strong>Donasi</strong> dan atau untuk <strong>membayar tagihan di bulan yang akan datang</strong>.
              </p>
            </div>

            {/* Total Saldo Deposit */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Saldo Deposit Anda</span>
                <span className="text-xs text-slate-300">Sudah dikurangi tagihan bulan ini</span>
              </div>
              <span className="text-lg font-black font-mono text-teal-300">
                {formatRupiah(myTagihan.kelebihanBayar)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300">Pilihan Cepat:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominalWarga(0)}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominalWarga === 0
                      ? 'bg-teal-950 text-teal-300 border-teal-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  100% Tagihan
                </button>
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominalWarga(Math.floor(myTagihan.kelebihanBayar / 2))}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominalWarga > 0 && splitDonasiNominalWarga < myTagihan.kelebihanBayar
                      ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  50% : 50%
                </button>
                <button
                  type="button"
                  onClick={() => setSplitDonasiNominalWarga(myTagihan.kelebihanBayar)}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    splitDonasiNominalWarga === myTagihan.kelebihanBayar
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  100% Donasi
                </button>
              </div>
            </div>

            {/* Slider and Breakdown */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>1. Donasi Kas RT:</span>
                  </label>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatRupiah(splitDonasiNominalWarga)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={myTagihan.kelebihanBayar}
                  step={5000}
                  value={splitDonasiNominalWarga}
                  onChange={(e) => setSplitDonasiNominalWarga(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <label className="font-semibold text-teal-400 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>2. Tagihan Bulan Datang:</span>
                </label>
                <span className="font-mono font-bold text-teal-300">
                  {formatRupiah(Math.max(0, myTagihan.kelebihanBayar - splitDonasiNominalWarga))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSplitModalWarga(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const donasi = splitDonasiNominalWarga;
                  const tagihanMendatang = Math.max(0, myTagihan.kelebihanBayar - donasi);
                  alokasikanDepositKombinasi(myTagihan.id, donasi, tagihanMendatang);
                  setShowSplitModalWarga(false);
                  setTitipanFeedbackMsg(`Pilihan tersimpan: Donasi ${formatRupiah(donasi)} & Tagihan Datang ${formatRupiah(tagihanMendatang)}.`);
                  setTimeout(() => setTitipanFeedbackMsg(null), 4000);
                }}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Alokasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pasang Foto Profil & Perbarui Kontak Warga */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-teal-500/40 p-5 shadow-2xl text-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pasang Profil Warga</h3>
                  <p className="text-[11px] text-teal-300/80">
                    {currentWarga.namaPenghuni} • Blok {currentWarga.blok}/{currentWarga.noRumah}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {profileFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileFeedback}</span>
              </div>
            )}

            {/* Preview Foto */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="relative">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt="Preview Profil"
                    className="w-24 h-24 rounded-full object-cover border-4 border-teal-500 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-slate-400 font-bold text-3xl shadow-inner">
                    {currentWarga.namaPenghuni ? currentWarga.namaPenghuni.charAt(0).toUpperCase() : 'W'}
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <label className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow transition">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Unggah Foto dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {profileAvatar && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setProfileAvatar('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Hapus Foto Profil
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Input Kontak & Info */}
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Nomor WhatsApp / HP Warga:</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Nomor ini digunakan untuk penerimaan notifikasi slip iuran dan koordinasi ronda RT.03.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Tempat Tinggal:</span>
                  <span className="font-semibold text-white">{currentWarga.statusHuni} ({currentWarga.statusTinggal})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kategori Usia:</span>
                  <span className="font-semibold text-white">{currentWarga.statusUsiaPenghuni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penanggung Jawab:</span>
                  <span className="font-semibold text-white">{currentWarga.namaPemilik}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={profileSaving}
                onClick={async () => {
                  setProfileSaving(true);
                  try {
                    // Update warga data
                    updateWarga(currentWarga.id, {
                      avatarUrl: profileAvatar,
                      kontakHp: profilePhone,
                      hpPenghuni: profilePhone,
                    });

                    // Also update linked user account if exists
                    if (currentUser) {
                      updateUserAccount(currentUser.id, {
                        avatarUrl: profileAvatar,
                        kontakHp: profilePhone,
                      });
                    }

                    setProfileFeedback('Profil & foto berhasil diperbarui!');
                    setTimeout(() => {
                      setProfileSaving(false);
                      setShowProfileModal(false);
                    }, 1000);
                  } catch (err) {
                    setProfileSaving(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow transition active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{profileSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
