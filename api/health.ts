import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(
  _req: IncomingMessage,
  res: ServerResponse & { json?: (data: any) => void; status?: (code: number) => any }
) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json({
      status: 'ok',
      app: 'Neo PoRT3 RT.03 RW.14 BPTW',
      environment: 'Vercel Serverless',
    });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      app: 'Neo PoRT3 RT.03 RW.14 BPTW',
      environment: 'Vercel Serverless',
    })
  );
}
