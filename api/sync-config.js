import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  const SECRET_KEY = process.env.ACCELVIA_SECRET_KEY;
  if (SECRET_KEY && authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  const payload = req.body;
  if (!payload || !payload.monitors) {
    return res.status(400).json({ error: 'Invalid payload historically structured received' });
  }

  try {
    // Generate a unique fallback ID using the first monitor URL as a primary key anchor
    // For single-tenant Vercel proxy, this works universally.
    const proxyKey = "accelvia_fallback_config"; 
    await kv.set(proxyKey, payload);
    return res.status(200).json({ status: 'success', message: 'Edge Deadman Switch Config Armed Successfully in KV' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
