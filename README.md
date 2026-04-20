# Accelvia Engine - Edge Proxy

This is the serverless Edge computing layer powering the **Accelvia Uptime Monitor** WordPress plugin. 

Instead of relying on third-party SaaS limits like UptimeRobot, this lightweight Vercel application acts as your own **proprietary global ping engine**. It provides your WordPress plugin with the ability to execute completely stateless, high-speed latency tests from global cloud networks, ensuring 100% accurate uptime readings outside of your local network environment.

## Architecture

1. Your WordPress plugin gathers its active list of monitored URL endpoints.
2. It sends a single batch payload directly to this Vercel proxy.
3. Vercel utilizes asynchronous scaling to instantly ping all targets concurrently from its global Edge nodes.
4. It measures the precise millisecond latency (`ms`) and absolute HTTP status codes.
5. It instantly returns the formatted JSON array directly back to WordPress, which securely graphs the Data natively.

## Deployment Guidelines

Deploying this proxy costs $0 and effortlessly scales within Vercel's generous infrastructure bandwidths.

1. Install the [Vercel CLI](https://vercel.com/docs/cli) locally or simply drag this codebase into your Vercel Dashboard.
2. Run `vercel deploy` within this directory if using the CLI.
3. Once fully deployed and live, copy your generated Vercel Production URL (e.g., `https://accelvia-proxy.vercel.app`).
4. Paste this URL into your WordPress Plugin's Settings page.

## Securing the Proxy (Optional)

To prevent unauthorized web-scrapers from using your free Vercel deployment to ping arbitrary websites, you can lock down the endpoint using an optional secret access key.

1. Go to your Vercel Project Settings > **Environment Variables**.
2. Add a new variable:
   * **Key**: `ACCELVIA_SECRET_KEY`
   * **Value**: *(Generate a long, random secure password)*
3. Redeploy your Vercel project to lock in the variable.
4. Navigate to your WordPress Dashboard (under the Accelvia Settings tab), and paste this exact same secret key into the Master Node Configuration.

The Edge Engine will now aggressively reject any ping requests that don't match this Bearer Token.

## API Endpoints
- **`GET/POST /api/ping`** - The primary serverless controller managing concurrent batched HTTP executions and latency mapping logic.
