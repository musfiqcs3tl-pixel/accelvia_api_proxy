export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  const SECRET_KEY = process.env.ACCELVIA_SECRET_KEY;
  if (SECRET_KEY && authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  // Support single URL or an array of URLs for parallel batching
  let urls = req.body?.urls || (req.body?.url ? [req.body.url] : []);
  if (req.query?.url) urls = [req.query.url];
  
  if (!urls.length) return res.status(400).json({ status: 'error', message: 'Missing urls array' });

  // Limit parallel batch size to protect serverless concurrency limits safely
  urls = urls.slice(0, 75);

  const results = await Promise.all(urls.map(async (url) => {
      const startTime = Date.now();
      let controller;
      try {
        controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second limit

        const fwRes = await fetch(url, { 
            method: 'GET',
            headers: { 'User-Agent': 'Accelvia Edge Monitor/' + Date.now() },
            redirect: 'follow',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        return {
          url: url,
          stat: 'ok',
          status: fwRes.ok ? 'up' : 'down',
          status_code: fwRes.status,
          response_time: Date.now() - startTime
        };
      } catch(e) {
        return {
          url: url,
          stat: 'error',
          status: 'down',
          status_code: 0,
          response_time: Date.now() - startTime,
          error: e.message
        };
      }
  }));

  return res.status(200).json({ results: results });
}
