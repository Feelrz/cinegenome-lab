// CineGenome LAB NOTES // public wall.
// Uses a dedicated Upstash Redis REST database when configured, otherwise the
// same REST credentials already used by Genome Key / visitor counter.
//
// Optional overrides:
//   CG_NOTES_REDIS_REST_URL
//   CG_NOTES_REDIS_REST_TOKEN
//   CG_NOTES_ADMIN_TOKEN        (only needed for DELETE moderation)

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');

const WALL_KEY = 'cinegenome:labnotes:wall:v1';
const RATE_PREFIX = 'cinegenome:labnotes:rate:v1:';
const MAX_NOTES = 500;
const RATE_SECONDS = 35;

function storageConfig() {
  const url = process.env.CG_NOTES_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.CG_NOTES_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

async function redis(url, token, command) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error(`upstash_invalid_json_${response.status}`); }
    if (!response.ok) throw new Error(`upstash_http_${response.status}`);
    if (payload && payload.error) throw new Error(`upstash_command_${String(payload.error).slice(0, 80)}`);
    return payload ? payload.result : null;
  } finally {
    clearTimeout(timer);
  }
}

function requestHost(req) {
  const forwarded = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  return forwarded || String(req.headers.host || '').trim();
}

function validSameOriginWrite(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host === requestHost(req);
  } catch { return false; }
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

function sanitizeMessage(value) {
  let text = String(value || '').normalize('NFKC');
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  text = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!text || text.length > 180) return null;
  // Keep the wall as notes, not a generic link board. Letterboxd is attached separately.
  if (/(?:https?:\/\/|www\.)/i.test(text)) return null;
  return text;
}

function normalizeLetterboxd(value) {
  let raw = String(value || '').trim();
  if (!raw) return null;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (host !== 'letterboxd.com') return null;
      raw = parsed.pathname.split('/').filter(Boolean)[0] || '';
    }
  } catch { return null; }
  raw = raw.replace(/^@+/, '').replace(/^\/+/, '').split('/')[0].trim();
  if (!/^[A-Za-z0-9_-]{1,30}$/.test(raw)) return null;
  return raw;
}

function requesterFingerprint(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || String(req.socket && req.socket.remoteAddress || 'unknown');
  return createHash('sha256').update(ip).digest('hex').slice(0, 18);
}

function noteId() {
  return `N-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function safeLimit(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 12;
  return Math.max(1, Math.min(500, Math.round(n)));
}

function isAdmin(req) {
  const secret = String(process.env.CG_NOTES_ADMIN_TOKEN || '');
  if (!secret) return false;
  const auth = String(req.headers.authorization || '');
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { url, token } = storageConfig();
  if (!url || !token) {
    return res.status(503).json({
      error: 'notes_store_not_configured',
      missing: [!url ? 'REST_URL' : null, !token ? 'REST_TOKEN' : null].filter(Boolean),
    });
  }

  try {
    if (req.method === 'GET') {
      const adminRequested = String((req.query && req.query.admin) || '') === '1';
      if (adminRequested && !isAdmin(req)) return res.status(401).json({ error: 'admin_required' });
      const limit = safeLimit(req.query && req.query.limit);
      const raw = await redis(url, token, ['ZREVRANGE', WALL_KEY, '0', String(limit - 1)]);
      const notes = (Array.isArray(raw) ? raw : []).map(item => {
        try { return JSON.parse(item); } catch { return null; }
      }).filter(Boolean).filter(note => note && note.id && note.message && note.letterboxd);
      const total = Number(await redis(url, token, ['ZCARD', WALL_KEY]) || notes.length);
      return res.status(200).json({ notes, total, live: true, admin: adminRequested });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'admin_required' });
      const id = String((req.query && req.query.id) || '').trim().toUpperCase();
      if (!/^N-[A-F0-9]{10}$/.test(id)) return res.status(400).json({ error: 'invalid_note_id' });
      const raw = await redis(url, token, ['ZRANGE', WALL_KEY, '0', '-1']);
      const member = (Array.isArray(raw) ? raw : []).find(item => {
        try { return JSON.parse(item).id === id; } catch { return false; }
      });
      if (!member) return res.status(404).json({ error: 'note_not_found' });
      await redis(url, token, ['ZREM', WALL_KEY, member]);
      return res.status(200).json({ ok: true, id });
    }

    if (!validSameOriginWrite(req)) return res.status(403).json({ error: 'invalid_origin' });
    const body = readBody(req) || {};
    const message = sanitizeMessage(body.message);
    const letterboxd = normalizeLetterboxd(body.letterboxd);
    if (!message) return res.status(400).json({ error: 'invalid_message', maxLength: 180 });
    if (!letterboxd) return res.status(400).json({ error: 'invalid_letterboxd' });

    const fingerprint = requesterFingerprint(req);
    const rate = await redis(url, token, ['SET', `${RATE_PREFIX}${fingerprint}`, '1', 'EX', String(RATE_SECONDS), 'NX']);
    if (rate !== 'OK') {
      res.setHeader('Retry-After', String(RATE_SECONDS));
      return res.status(429).json({ error: 'note_rate_limited', retryAfter: RATE_SECONDS });
    }

    const note = {
      id: noteId(),
      message,
      letterboxd,
      createdAt: Date.now(),
    };
    const record = JSON.stringify(note);
    await redis(url, token, ['ZADD', WALL_KEY, String(note.createdAt), record]);

    const count = Number(await redis(url, token, ['ZCARD', WALL_KEY]) || 0);
    if (count > MAX_NOTES) {
      await redis(url, token, ['ZREMRANGEBYRANK', WALL_KEY, '0', String(count - MAX_NOTES - 1)]);
    }

    return res.status(201).json({ note, total: Math.min(Math.max(count, 1), MAX_NOTES), live: true });
  } catch (error) {
    const detail = error && error.name === 'AbortError'
      ? 'upstash_timeout'
      : String(error && error.message ? error.message : 'notes_store_error');
    console.error('[CINEGENOME LAB NOTES]', detail);
    return res.status(502).json({ error: 'notes_store_unavailable', detail });
  }
};
