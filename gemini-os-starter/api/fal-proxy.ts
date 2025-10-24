/**
 * Vercel Serverless Function - FAL API Proxy
 * Keeps FAL_KEY secure on the backend
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fal } from '@fal-ai/client';

// Configure fal client with secret key (not exposed to browser)
fal.config({
  credentials: process.env.FAL_KEY, // NOT prefixed with VITE_
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, input, logs = false } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Rate limiting check (optional - add your own logic)
    // const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    console.log(`[FAL Proxy] ${endpoint} - ${JSON.stringify(input).slice(0, 100)}...`);

    // Subscribe to FAL endpoint
    const result = await fal.subscribe(endpoint, {
      input,
      logs,
      onQueueUpdate: (update) => {
        if (logs && update.status === 'IN_PROGRESS') {
          console.log(`[FAL Proxy] ${endpoint}:`, update.logs?.map(l => l.message).join(' '));
        }
      },
    });

    // Return the result
    return res.status(200).json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('[FAL Proxy] Error:', error);
    return res.status(500).json({
      error: 'FAL API request failed',
      message: error.message
    });
  }
}
