import { renderSite } from '../site-template.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Minimal ZIP writer (no dependencies) ─────────────────────────────────────

const CRC32_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC32_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u16(buf, off, v) { buf[off] = v & 0xFF; buf[off+1] = (v >> 8) & 0xFF; }
function u32(buf, off, v) { buf[off] = v & 0xFF; buf[off+1] = (v >> 8) & 0xFF; buf[off+2] = (v >> 16) & 0xFF; buf[off+3] = (v >> 24) & 0xFF; }

function buildZip(entries) {
  // entries: [{ name: string, data: Buffer }]
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const size = data.length;
    // DOS date: 2024-01-01
    const dosDate = (44 << 9) | (1 << 5) | 1;

    const local = Buffer.alloc(30 + nameBytes.length);
    u32(local, 0, 0x04034b50); // local file header sig
    u16(local, 4, 20);          // version needed
    u16(local, 6, 0);           // flags
    u16(local, 8, 0);           // compression: stored
    u16(local, 10, 0);          // mod time
    u16(local, 12, dosDate);    // mod date
    u32(local, 14, crc);
    u32(local, 18, size);       // compressed size
    u32(local, 22, size);       // uncompressed size
    u16(local, 26, nameBytes.length);
    u16(local, 28, 0);          // extra field length
    nameBytes.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + nameBytes.length);
    u32(central, 0, 0x02014b50); // central dir sig
    u16(central, 4, 20);          // version made by
    u16(central, 6, 20);          // version needed
    u16(central, 8, 0);           // flags
    u16(central, 10, 0);          // compression: stored
    u16(central, 12, 0);          // mod time
    u16(central, 14, dosDate);    // mod date
    u32(central, 16, crc);
    u32(central, 20, size);       // compressed size
    u32(central, 24, size);       // uncompressed size
    u16(central, 28, nameBytes.length);
    u16(central, 30, 0);          // extra field length
    u16(central, 32, 0);          // comment length
    u16(central, 34, 0);          // disk start
    u16(central, 36, 0);          // internal attrs
    u32(central, 38, 0);          // external attrs
    u32(central, 42, offset);     // local header offset
    nameBytes.copy(central, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  u32(eocd, 0, 0x06054b50);           // end of central dir sig
  u16(eocd, 4, 0);                     // disk number
  u16(eocd, 6, 0);                     // disk with central dir
  u16(eocd, 8, entries.length);        // entries on this disk
  u16(eocd, 10, entries.length);       // total entries
  u32(eocd, 12, centralBuf.length);   // central dir size
  u32(eocd, 16, offset);              // central dir offset
  u16(eocd, 20, 0);                   // comment length

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid request body' });

    const html = renderSite(data);
    const siteName = (data.subdomain || data.studioName || 'my-site')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'my-site';

    const zip = buildZip([
      { name: 'index.html', data: Buffer.from(html, 'utf8') },
    ]);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${siteName}-site.zip"`);
    res.setHeader('Content-Length', zip.length);
    return res.status(200).send(zip);

  } catch (err) {
    console.error('[download] error:', err);
    return res.status(500).json({ error: 'Failed to generate site files.' });
  }
}
