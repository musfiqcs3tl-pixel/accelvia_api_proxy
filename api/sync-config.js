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
    if (!payload.tenant_hash) {
      return res.status(400).json({ error: 'Missing tenant_hash for multi-tenant isolation' });
    }
    const proxyKey = `accelvia_tenant_${payload.tenant_hash}`;
    await kv.set(proxyKey, payload);
    return res.status(200).json({ status: 'success', message: 'Edge Deadman Switch Config Armed Successfully in KV', tenant: payload.tenant_hash });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
