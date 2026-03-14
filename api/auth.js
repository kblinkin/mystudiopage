import { kv } from '@vercel/kv';
import crypto from 'crypto';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex'));
    });
  });
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, token } = req.body || {};

  try {

    // ── REGISTER ─────────────────────────────────────────────────────────────
    if (action === 'register') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const em = email.toLowerCase().trim();
      const existing = await kv.get(`user:${em}`);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await hashPassword(password, salt);

      await kv.set(`user:${em}`, {
        email: em,
        passwordHash: hash,
        salt,
        subdomain: null,
        createdAt: Date.now(),
      });

      const sessionToken = crypto.randomBytes(32).toString('hex');
      await kv.set(`session:${sessionToken}`, { email: em }, { ex: 30 * 24 * 60 * 60 });

      return res.status(200).json({ success: true, token: sessionToken, email: em });
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const em = email.toLowerCase().trim();
      const user = await kv.get(`user:${em}`);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const hash = await hashPassword(password, user.salt);
      if (hash !== user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      await kv.set(`session:${sessionToken}`, { email: em }, { ex: 30 * 24 * 60 * 60 });

      return res.status(200).json({
        success: true,
        token: sessionToken,
        email: em,
        subdomain: user.subdomain || null,
      });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!token) return res.status(400).json({ error: 'Token required.' });

      const session = await kv.get(`session:${token}`);
      if (!session) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }

      const user = await kv.get(`user:${session.email}`);
      return res.status(200).json({
        valid: true,
        email: session.email,
        subdomain: user?.subdomain || null,
      });
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      if (token) await kv.del(`session:${token}`);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });

  } catch (err) {
    console.error('[auth] error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
