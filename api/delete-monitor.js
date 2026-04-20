export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing monitor id' });
  
  const UPTIMEROBOT_KEY = process.env.UPTIMEROBOT_API_KEY;
  if (!UPTIMEROBOT_KEY) return res.status(500).json({ error: "API key missing in Vercel."});

  try {
    const fwRes = await fetch('https://api.uptimerobot.com/v2/deleteMonitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: new URLSearchParams({ api_key: UPTIMEROBOT_KEY, id: id, format: 'json' })
    });
    const data = await fwRes.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
