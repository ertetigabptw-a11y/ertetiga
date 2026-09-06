import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';

interface WargaModuleProps {
  activeTab: string;
}

export const WargaModule: React.FC<WargaModuleProps> = ({ activeTab }) => {
  const {
    currentUser,
    wargaList,
    rondaSchedules,
    addPresensiRonda,
    presensiList,
    tagihanList,
    bayarTagihanWarga,
    alokasikanDanaTitipan,
    pengumumanList,
    markPengumumanRead,
    keluhanList,
    submitKeluhan,
    pengeluaranList,
    pemasukanList,
    settings,
  } = useApp();

  // Find the resident profile corresponding to current logged in resident
  const currentWarga = wargaList.find((w) => w.id === currentUser?.wargaId) || wargaList[0];
  const myTagihan = tagihanList.find((t) => t.wargaId === currentWarga.id) || tagihanList[0];

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
  const [kelebihanOption, setKelebihanOption] = useState<'titipan_bulan_depan' | 'donasi_kas' | 'tarik_kembali'>('titipan_bulan_depan');

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

  // Check if resident is scheduled for ronda tonight or this week
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = days[new Date().getDay()];
  const myRondaDay = rondaSchedules.find((s) =>
    s.petugasNames.some((name) => name.toUpperCase() === currentWarga.namaPenghuni.toUpperCase())
  );
  const isRondaTonight = myRondaDay?.hari === todayName;

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
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-teal-800">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Portal Warga RT.03</span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-100 text-teal-900 border border-teal-300 font-bold">
            Blok {currentWarga.blok}/{currentWarga.noRumah}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Selamat Datang, {currentWarga.namaPenghuni}</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Perum BPTW Cilacap • Status: {currentWarga.statusHuni} ({currentWarga.kriteriaRonda})
        </p>
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

      {/* TAB 2: ENTRI PRESENSI RONDA (KAMERA SELFIE LIVE & GPS) */}
      {activeTab === 'presensi_warga' && (
        <div className="space-y-3">
          {/* Location & Time Status */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Validasi Pos Ronda RT.03</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Jarak: {formatDistance(distanceMeters)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <div
                className={`p-2 rounded-xl border ${
                  isDistanceValid ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {isDistanceValid ? '✓ Di Area Pos Ronda' : '✕ Di Luar Radius Pos'}
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  isTimeValid ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
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
              <span>{isSubmittingPresensi ? 'Menyimpan Presensi...' : 'Kirim Presensi Ronda Sekarang'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LEMBAR TAGIHAN & STATUS IURAN SAYA */}
      {activeTab === 'tagihan_warga' && (
        <div className="space-y-3">
          {myTagihan && (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Lembar Tagihan Iuran Lingkungan</h3>
                  <p className="text-[10px] text-slate-400">
                    Periode: {myTagihan.periode} • Kavling {myTagihan.blokNo}
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

              {/* Rincian Komponen */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Dana Sosial RT (Dansos RT)</span>
                  <span className="font-mono">{formatRupiah(myTagihan.dansosRT)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Dana Sosial RW (Dansos RW)</span>
                  <span className="font-mono">{formatRupiah(myTagihan.dansosRW)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pembangunan Sarana Lingkungan</span>
                  <span className="font-mono">{formatRupiah(myTagihan.pembangunan)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Snack Rapat Warga RT</span>
                  <span className="font-mono">{formatRupiah(myTagihan.snack)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Jimpitan Lingkungan</span>
                  <span className="font-mono">{formatRupiah(myTagihan.jimpitan)}</span>
                </div>

                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-700/60">
                  <span>Subtotal Iuran Rutin</span>
                  <span className="font-mono">{formatRupiah(myTagihan.totalIuran)}</span>
                </div>

                {/* Denda Ronda jika ada */}
                {myTagihan.dendaRonda > 0 && (
                  <div className="flex justify-between text-amber-300 font-semibold">
                    <span>Denda Ronda Malam (Alpa)</span>
                    <span className="font-mono">{formatRupiah(myTagihan.dendaRonda)}</span>
                  </div>
                )}

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

                {/* Dana Titipan bulan lalu pemotong tagihan */}
                {myTagihan.titipanDigunakanUntukTagihan > 0 && (
                  <div className="flex justify-between text-teal-300 font-semibold">
                    <span>Potongan Dana Titipan Bulan Lalu</span>
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

              {/* Form Opsi Dana Titipan / Kelebihan Bayar */}
              {myTagihan.kelebihanBayar > 0 && (
                <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Saldo Dana Titipan Saya: {formatRupiah(myTagihan.kelebihanBayar)}</span>
                  </div>
                  <p className="text-[10px] text-teal-200">
                    Kelebihan pembayaran Anda tersimpan aman di kas RT. Anda dapat memilih peruntukan dana ini:
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => alokasikanDanaTitipan(myTagihan.id, 'titipan_bulan_depan', myTagihan.kelebihanBayar)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition ${
                        myTagihan.alokasiKelebihan === 'titipan_bulan_depan'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Potong Iuran Depan
                    </button>
                    <button
                      onClick={() => alokasikanDanaTitipan(myTagihan.id, 'donasi_kas', myTagihan.kelebihanBayar)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition ${
                        myTagihan.alokasiKelebihan === 'donasi_kas'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Donasi Kas RT
                    </button>
                    <button
                      onClick={() => alokasikanDanaTitipan(myTagihan.id, 'tarik_kembali', myTagihan.kelebihanBayar)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition ${
                        myTagihan.alokasiKelebihan === 'tarik_kembali'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Tarik Kembali
                    </button>
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

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Pemasukan:</span>
                <p className="font-mono font-bold text-emerald-400 text-sm">
                  {formatRupiah(pemasukanList.reduce((acc, curr) => acc + curr.nominal, 0))}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Pengeluaran:</span>
                <p className="font-mono font-bold text-rose-400 text-sm">
                  {formatRupiah(pengeluaranList.reduce((acc, curr) => acc + curr.nominal, 0))}
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
    </div>
  );
};
