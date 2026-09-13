import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[]>;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS preflight if called from external
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    const { target, message, token } = body || {};
    const apiToken = token || process.env.FONNTE_TOKEN || 'U9M+VF45H6DNsgIZdHkS';

    if (!target || !message) {
      return res.status(400).json({ status: false, message: 'Target and message are required' });
    }

    const formData = new URLSearchParams();
    formData.append('target', String(target).trim());
    formData.append('message', String(message));
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: apiToken,
      },
      body: formData,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return res.status(response.ok ? 200 : 400).json(responseData);
  } catch (error: any) {
    console.error('Vercel Fonnte Proxy Error:', error);
    return res.status(500).json({
      status: false,
      message: error?.message || 'Failed to reach Fonnte WhatsApp gateway via Vercel function',
    });
  }
}
