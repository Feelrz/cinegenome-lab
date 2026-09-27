// CineGenome FILMPRINT hybrid share keys.
// Local FILMPRINT results stay in the browser. A short server key is created
// only when the user explicitly chooses GENERATE SHARE KEY.
//
// Uses the same Upstash REST credentials as the visitor counter by default:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// Optional dedicated database overrides:
//   CG_GENOME_REDIS_REST_URL
//   CG_GENOME_REDIS_REST_TOKEN

const { randomBytes } = require('node:crypto');

const PREFIX = 'cinegenome:genome:share:v1:';
const TTL_SECONDS = 60 * 60 * 24 * 365;
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function storageConfig() {
  const url = process.env.CG_GENOME_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.CG_GENOME_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
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

function validSameOriginPost(req) {
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

function normalizeAnswers(value) {
  if (!Array.isArray(value) || value.length !== 30) return null;
  const answers = value.map(Number);
  if (answers.some(n => !Number.isInteger(n) || n < 1 || n > 5)) return null;
  return answers;
}

// Older/partial records may carry an axis vector instead of the full answers.
// Only expose recognized, finite 0–100 measurements; absent axes stay absent.
const AXIS_KEYS = ['surrealism','solitude','romance','nostalgia','intensity','pace','visual','complexity','darkness','humor','dreamLogic','action','horror','warmth','intimacy'];
const AXIS_LABELS = {surrealism:'realitybend',visual:'visualstyle'};
function normalizeVector(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const vector = {};
  for (const axis of AXIS_KEYS) {
    const key = Object.keys(value).find(k => {
      const normalized=k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalized===axis.toLowerCase() || normalized===AXIS_LABELS[axis];
    });
    const raw = key === undefined ? null : value[key];
    if (raw === null || raw === '' || !['string','number'].includes(typeof raw)) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 100) vector[axis] = n;
  }
  return Object.keys(vector).length ? vector : null;
}

function randomToken(length = 8) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] & 31];
  return out;
}

function formatKey(token) {
  const compact = String(token || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `CG-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

function normalizeKey(raw) {
  let compact = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  compact = compact.replace(/O/g, '0').replace(/[IL]/g, '1');
  if (compact.startsWith('CG')) compact = compact.slice(2);
  if (compact.length !== 8) return null;
  if ([...compact].some(ch => !ALPHABET.includes(ch))) return null;
  return compact;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { url, token } = storageConfig();
  if (!url || !token) {
    return res.status(503).json({
      error: 'genome_store_not_configured',
      localFallback: true,
      missing: [!url ? 'REST_URL' : null, !token ? 'REST_TOKEN' : null].filter(Boolean),
    });
  }

  try {
    if (req.method === 'GET') {
      const tokenPart = normalizeKey(req.query && req.query.key);
      if (!tokenPart) return res.status(400).json({ error: 'invalid_genome_key' });

      const raw = await redis(url, token, ['GET', `${PREFIX}${tokenPart}`]);
      if (!raw) return res.status(404).json({ error: 'genome_key_not_found' });

      let record;
      try { record = typeof raw === 'string' ? JSON.parse(raw) : raw; }
      catch { throw new Error('invalid_genome_record'); }

      const answers = normalizeAnswers(record && record.answers);
      const vector = answers ? null : normalizeVector(record && (record.vector || record.dna?.vector || record.profile));
      if (!answers && !vector) throw new Error('invalid_genome_record');
      return res.status(200).json({ key: formatKey(tokenPart), version: 1, ...(answers ? { answers } : { vector }) });
    }

    if (!validSameOriginPost(req)) return res.status(403).json({ error: 'invalid_origin' });
    const body = readBody(req);
    const answers = normalizeAnswers(body && body.answers);
    if (!answers) return res.status(400).json({ error: 'invalid_answers' });

    const record = JSON.stringify({ version: 1, answers, createdAt: Date.now() });
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const tokenPart = randomToken(8);
      const result = await redis(url, token, ['SET', `${PREFIX}${tokenPart}`, record, 'EX', TTL_SECONDS, 'NX']);
      if (result === 'OK') {
        return res.status(201).json({
          key: formatKey(tokenPart),
          version: 1,
          expiresInDays: 365,
        });
      }
    }
    throw new Error('genome_key_collision_retry_exhausted');
  } catch (error) {
    const detail = error && error.name === 'AbortError'
      ? 'upstash_timeout'
      : String(error && error.message ? error.message : 'genome_store_error');
    console.error('[CINEGENOME GENOME]', detail);
    return res.status(502).json({ error: 'genome_store_unavailable', detail, localFallback: true });
  }
};
