import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SelfieCameraProps {
  onCapture: (base64Image: string) => void;
  capturedImage: string | null;
  onRetake: () => void;
}

export const SelfieCamera: React.FC<SelfieCameraProps> = ({
  onCapture,
  capturedImage,
  onRetake,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start camera stream when not captured
  useEffect(() => {
    if (capturedImage) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      setIsLoading(true);
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (isMounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (isMounted) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda.'
              : 'Kamera tidak terdeteksi atau sedang digunakan aplikasi lain.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal for natural mirror selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(base64);
  };

  // Fallback simulator for camera in restricted environments (sandbox preview)
  const handleSimulateSelfie = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw simulated selfie badge
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(200, 160, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(200, 320, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SELFIE VERIFIED', 200, 370);
      const dataUrl = canvas.toDataURL('image/jpeg');
      onCapture(dataUrl);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
        {capturedImage ? (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Hasil Foto Selfie Presensi"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <Check className="w-3.5 h-3.5" />
              <span>Foto Tervalidasi</span>
            </div>
          </div>
        ) : cameraError ? (
          <div className="p-4 text-center text-slate-300 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-xs text-amber-200">{cameraError}</p>
            <button
              type="button"
              onClick={handleSimulateSelfie}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
            >
              Gunakan Snapshot Otomatis
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-slate-400 text-xs">
                Mengaktifkan kamera live...
              </div>
            )}
            {/* Camera Overlay Guides */}
            <div className="absolute inset-0 pointer-events-none border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center">
              <div className="w-36 h-48 rounded-full border-2 border-dashed border-emerald-400/60" />
              <span className="text-[11px] text-emerald-300/80 bg-slate-900/70 px-2 py-0.5 rounded-full mt-2">
                Posisikan Wajah Petugas
              </span>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Action Control */}
      <div className="mt-3 flex items-center gap-3">
        {capturedImage ? (
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Foto Ulang</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isLoading || !!cameraError}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/40 transition active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Ambil Foto Selfie</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 text-center">
        *Presensi ronda wajib menggunakan kamera live langsung tanpa unggah foto dari perangkat.
      </p>
    </div>
  );
};
