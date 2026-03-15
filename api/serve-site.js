import { kv } from '@vercel/kv';
import { renderSite } from '../site-template.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
let builderHtml;
try {
  builderHtml = readFileSync(join(__dir, '..', 'index.html'), 'utf8');
} catch (e) {
  builderHtml = null;
}

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page Not Found — mystudiopage</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400&family=DM+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #0c0c0c;
    color: #f0ece4;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 24px;
    -webkit-font-smoothing: antialiased;
  }
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.03;
  }
  .brand {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #686460;
    margin-bottom: 48px;
  }
  .code {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 120px;
    line-height: 1;
    color: #c8a96e;
    letter-spacing: 0.03em;
    margin-bottom: 16px;
  }
  .title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 0.05em;
    color: #f0ece4;
    margin-bottom: 12px;
  }
  .desc {
    font-size: 15px;
    color: #908c88;
    line-height: 1.7;
    max-width: 400px;
    margin-bottom: 40px;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: #c8a96e;
    color: #0c0c0c;
    padding: 14px 32px;
    text-decoration: none;
    transition: background 0.2s;
  }
  .cta:hover { background: #e8c98e; }
</style>
</head>
<body>
  <div class="brand">mystudiopage.com</div>
  <div class="code">404</div>
  <div class="title">This studio page hasn't been set up yet.</div>
  <p class="desc">The page you're looking for doesn't exist here — yet. Want to build your own audio engineering site?</p>
  <a class="cta" href="https://mystudiopage.com">Build Your Site →</a>
</body>
</html>`;

export default async function handler(req, res) {
  // x-forwarded-host preserves the original hostname through Vercel's internal routing
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const hostSubdomain = host.includes('.mystudiopage.com') ? host.split('.mystudiopage.com')[0] : '';

  let subdomain = req.query.s || hostSubdomain || '';

  // If the host is a custom domain (not mystudiopage.com), look up its subdomain mapping
  if (!subdomain && host && !host.endsWith('mystudiopage.com')) {
    const cleanHost = host.replace(/^www\./, '');
    try {
      const mapped = await kv.get(`customdomain:${cleanHost}`);
      if (mapped) subdomain = mapped;
    } catch (e) {
      console.error('[serve-site] custom domain lookup error:', e);
    }
  }

  // Debug header — check for this in browser Network tab
  res.setHeader('X-Debug-Host', host);
  res.setHeader('X-Debug-Subdomain', subdomain || 'none');

  if (!subdomain) {
    // Main domain request — serve the builder
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(builderHtml || NOT_FOUND_HTML);
  }

  try {
    const key = `site:${subdomain}`;
    const raw = await kv.get(key);

    if (!raw) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(NOT_FOUND_HTML);
    }

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const html = renderSite(data);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[serve-site] error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(NOT_FOUND_HTML);
  }
}
