import { kv } from '@vercel/kv';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { subdomain } = data;

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length < 2) {
      return res.status(400).json({ error: 'subdomain must be at least 2 characters, alphanumeric and hyphens only, and cannot start or end with a hyphen' });
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({ error: 'subdomain may only contain lowercase letters, numbers, and hyphens' });
    }

    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return res.status(400).json({ error: 'subdomain cannot start or end with a hyphen' });
    }

    const key = `site:${subdomain}`;
    await kv.set(key, JSON.stringify(data));

    // If the user is logged in, save their form data to their account
    const { token } = data;
    if (token) {
      try {
        const session = await kv.get(`session:${token}`);
        if (session) {
          await kv.set(`sitedata:${session.email}`, JSON.stringify(data));
          // Also record which subdomain belongs to this user
          const user = await kv.get(`user:${session.email}`);
          if (user) {
            await kv.set(`user:${session.email}`, { ...user, subdomain });
          }
        }
      } catch (e) {
        // Non-fatal — site still published successfully
        console.error('[publish] account save error:', e);
      }
    }

    const url = `https://${subdomain}.mystudiopage.com`;
    return res.status(200).json({ success: true, url });

  } catch (err) {
    console.error('[publish] error:', err);
    return res.status(500).json({ error: 'Failed to publish site. Please try again.' });
  }
}
