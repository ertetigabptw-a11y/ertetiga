export interface FonnteResponse {
  status: boolean;
  message?: string;
  detail?: string;
  target?: string;
}

export async function sendFonnteMessage(
  token: string,
  target: string,
  message: string,
  countryCode: string = '62'
): Promise<FonnteResponse> {
  const cleanTarget = target.trim();
  if (!cleanTarget) {
    return { status: false, message: 'Target nomor WhatsApp atau grup tidak boleh kosong' };
  }

  // 1. Try sending via local backend proxy if available to avoid browser CORS
  try {
    const proxyRes = await fetch('/api/fonnte/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: cleanTarget, message, token }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        status: data.status === true || data.status === 'true' || data.success === true,
        message: data.message || (data.status ? 'Pesan berhasil dikirim via Gateway Fonnte' : 'Respon gateway diterima'),
        detail: JSON.stringify(data),
        target: cleanTarget,
      };
    }
  } catch {
    // If local proxy not mounted or failed, continue to direct client-side call
  }

  // 2. Direct call to Fonnte API
  try {
    const formData = new URLSearchParams();
    formData.append('target', cleanTarget);
    formData.append('message', message);
    formData.append('countryCode', countryCode);

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (res.ok && (data.status === true || data.status === 'true')) {
      return {
        status: true,
        message: data.reason || data.detail || 'Pesan WhatsApp berhasil dikirim via Fonnte Gateway!',
        detail: text,
        target: cleanTarget,
      };
    } else {
      return {
        status: false,
        message: data.reason || data.message || 'Gagal mengirim pesan via Gateway Fonnte (Periksa kuota atau token)',
        detail: text,
        target: cleanTarget,
      };
    }
  } catch (err: any) {
    return {
      status: false,
      message: `Koneksi Gateway Fonnte gagal: ${err.message || 'CORS / Network Error'}. Gunakan tombol Buka WhatsApp Langsung.`,
      target: cleanTarget,
    };
  }
}

/**
 * Generate Direct WhatsApp Link as reliable fallback
 */
export function getDirectWhatsAppUrl(target: string, text: string): string {
  const isGroup = target.includes('@g.us');
  const encoded = encodeURIComponent(text);
  if (isGroup) {
    // For groups, open web whatsapp
    return `https://web.whatsapp.com/accept?code=${target}`;
  }
  let cleanPhone = target.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
