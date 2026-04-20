export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // The WP plugin will pass specific monitor IDs if needed, or pull all.
  const { monitors } = req.body || {};
  
  const UPTIMEROBOT_KEY = process.env.UPTIMEROBOT_API_KEY;
  if (!UPTIMEROBOT_KEY) return res.status(500).json({ error: "API key missing in Vercel."});

  try {
    const params = new URLSearchParams({
      api_key: UPTIMEROBOT_KEY,
      format: 'json',
      // We can also ask UptimeRobot to return response times
      response_times: '1',
      response_times_limit: '1'
    });

    if (monitors) {
      params.append('monitors', monitors);
    }

    const fwRes = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: params
    });
    
    const data = await fwRes.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
