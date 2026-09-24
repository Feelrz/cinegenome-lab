// Shared unique-browser visitor counter for desktop + mobile on Vercel.
// Requires Upstash REST credentials on the server (UPSTASH_* or KV_*).
const { randomUUID } = require('node:crypto');

const COOKIE = 'cg_visitor_id';
const SEEN_KEY = 'cinegenome:visitors:seen:v1';
const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function existingId(header) {
  const match = String(header || '').match(/(?:^|;\s*)cg_visitor_id=([^;]+)/);
  return match && VISITOR_ID.test(match[1]) ? match[1] : null;
}

function storageConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
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
    try {
      payload = await response.json();
    } catch {
      throw new Error(`upstash_invalid_json_${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`upstash_http_${response.status}`);
    }
    if (payload && payload.error) {
      throw new Error(`upstash_command_${String(payload.error).slice(0, 80)}`);
    }
    return payload ? payload.result : null;
  } finally {
    clearTimeout(timer);
  }
}

function requestHost(req) {
  const forwarded = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  return forwarded || String(req.headers.host || '').trim();
}

function validSameOriginPost(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.host === requestHost(req);
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (req.method === 'POST' && !validSameOriginPost(req)) {
    return res.status(403).json({ error: 'invalid_origin' });
  }

  const { url, token } = storageConfig();
  if (!url || !token) {
    return res.status(503).json({
      error: 'counter_not_configured',
      missing: [!url ? 'REST_URL' : null, !token ? 'REST_TOKEN' : null].filter(Boolean),
    });
  }

  try {
    // SCARD reads the number of registered unique browser IDs directly.
    // A previous SADD followed by a failed INCR cannot leave a permanently low total.
    if (req.method === 'GET') {
      const total = Number(await redis(url, token, ['SCARD', SEEN_KEY]));
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('invalid_counter_result');
      return res.status(200).json({ total });
    }

    // POST registers one browser UUID. SADD is atomic: it returns 1 only once.
    const id = existingId(req.headers.cookie) || randomUUID();
    const added = Number(await redis(url, token, ['SADD', SEEN_KEY, id]));
    if (added !== 0 && added !== 1) throw new Error('invalid_sadd_result');
    const total = Number(await redis(url, token, ['SCARD', SEEN_KEY]));
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('invalid_counter_result');

    res.setHeader(
      'Set-Cookie',
      `${COOKIE}=${id}; Path=/; Max-Age=34560000; HttpOnly; SameSite=Lax${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
    );

    return res.status(200).json({ total, registered: added === 1 });
  } catch (error) {
    const message = error && error.name === 'AbortError'
      ? 'upstash_timeout'
      : String(error && error.message ? error.message : 'counter_error');
    console.error('[CINEGENOME VISITORS]', message);
    return res.status(502).json({ error: 'counter_unavailable', detail: message });
  }
};
