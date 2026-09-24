// Shared visitor counter for the desktop and mobile sites on Vercel.
// Requires Upstash REST credentials on the server (UPSTASH_* or KV_*).
const { randomUUID } = require('node:crypto');

const COOKIE = 'cg_visitor_id';
const TOTAL_KEY = 'cinegenome:visitors:total:v1';
const SEEN_KEY = 'cinegenome:visitors:seen:v1';
const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REGISTER = `
  local added = redis.call('SADD', KEYS[1], ARGV[1])
  if added == 1 then
    return redis.call('INCR', KEYS[2])
  end
  return tonumber(redis.call('GET', KEYS[2]) or '0')
`;

function existingId(header) {
  const match = String(header || '').match(/(?:^|;\s*)cg_visitor_id=([^;]+)/);
  return match && VISITOR_ID.test(match[1]) ? match[1] : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // The browser only calls this endpoint from its own origin.
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    const host = req.headers.host;
    let sameOrigin = true;
    if (origin) {
      try {
        const parsed = new URL(origin);
        sameOrigin = ['http:', 'https:'].includes(parsed.protocol) && parsed.host === host;
      } catch {
        sameOrigin = false;
      }
    }
    if (!sameOrigin || req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: 'invalid_origin' });
    }
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(503).json({ error: 'counter_not_configured' });

  const id = existingId(req.headers.cookie) || randomUUID();
  const command = req.method === 'GET'
    ? ['GET', TOTAL_KEY]
    : ['EVAL', REGISTER, '2', SEEN_KEY, TOTAL_KEY, id];

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) throw new Error('Counter store unavailable');
    const payload = await upstream.json();
    if (payload.error) throw new Error('Counter command failed');
    const total = payload.result === null ? 0 : Number(payload.result);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid counter result');

    if (req.method === 'POST') {
      res.setHeader('Set-Cookie', `${COOKIE}=${id}; Path=/; Max-Age=34560000; HttpOnly; SameSite=Lax${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
    }
    return res.status(200).json({ total });
  } catch (error) {
    console.error('[CINEGENOME VISITORS]', error);
    return res.status(502).json({ error: 'counter_unavailable' });
  }
};
