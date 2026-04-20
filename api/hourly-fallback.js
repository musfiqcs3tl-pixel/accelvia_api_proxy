import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Authorization verification (Protects cron from external spam)
  const authHeader = req.headers.authorization;
  const SECRET_KEY = process.env.ACCELVIA_SECRET_KEY;
  if (req.query.secret !== SECRET_KEY && authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized Cron Request' });
  }

  try {
    const config = await kv.get("accelvia_fallback_config");
    if (!config || !config.monitors) return res.status(200).json({ status: "No config armed" });

    const checks = await Promise.all(config.monitors.map(async (m) => {
        let isDown = false;
        let errMsg = '';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const fwRes = await fetch(m.url, {
                method: 'GET',
                headers: { 'User-Agent': 'Accelvia Edge Fallback Engine/1.0' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!fwRes.ok) {
                isDown = true;
                errMsg = `HTTP Error ${fwRes.status}`;
            }
        } catch(e) {
            isDown = true;
            errMsg = e.message;
        }

        // Deadman's Switch Logic: ONLY DISPATCH IF COMPLETELY DOWN
        if (isDown) {
            await dispatchAlert(m, errMsg, config.channels);
            return { url: m.url, status: 'down', dispatched: true };
        }
        
        // If up, do nothing. WordPress native WP-Cron will handle positive routing.
        return { url: m.url, status: 'up', dispatched: false };
    }));

    return res.status(200).json({ executed: true, checks });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function dispatchAlert(monitor, errorMsg, channels) {
    const text = `🔴 *Accelvia Edge Deadman Switch Triggered*\nNode: ${monitor.friendly_name}\nTarget: ${monitor.url}\nStatus: DOWN (Fallback proxy activated, WordPress core may be compromised)\nReason: ${errorMsg}`;

    const jobs = [];

    if (channels.discord) {
        jobs.push(fetch(channels.discord, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "Accelvia Edge Deadman Triggered",
                    color: 15158332,
                    description: `Critical core failure detected for **${monitor.friendly_name}**`,
                    fields: [
                        { name: "Target", value: monitor.url, inline: true },
                        { name: "Error", value: errorMsg, inline: false },
                        { name: "Proxy Note", value: "Vercel autonomous hourly proxy detected the native WP engine was unreachable." }
                    ]
                }]
            })
        }));
    }
    if (channels.slack) {
        jobs.push(fetch(channels.slack, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text
            })
        }));
    }
    if (channels.telegram_token && channels.telegram_chat_id) {
        jobs.push(fetch(`https://api.telegram.org/bot${channels.telegram_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: channels.telegram_chat_id, text: text })
        }));
    }
    
    // Attempt all channel blasts asynchronously
    await Promise.allSettled(jobs);
}
