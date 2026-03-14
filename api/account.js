import { kv } from '@vercel/kv';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token required.' });

  try {
    const session = await kv.get(`session:${token}`);
    if (!session) return res.status(401).json({ error: 'Session expired. Please log in again.' });

    const siteData = await kv.get(`sitedata:${session.email}`);
    return res.status(200).json({
      success: true,
      email: session.email,
      data: siteData || null,
    });

  } catch (err) {
    console.error('[account] error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
