// Vercel-style serverless TMDB proxy example.
// Set TMDB_READ_TOKEN in your hosting environment, then change data/tmdb-config.js mode to "proxy".
export default async function handler(req, res) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return res.status(500).json({ error: 'TMDB_READ_TOKEN is not configured.' });
  const path = String(req.query?.path || '');
  if (!/^\/(search\/movie|movie\/\d+)$/.test(path)) return res.status(400).json({ error: 'Unsupported TMDB path.' });
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value == null) continue;
    if (Array.isArray(value)) value.forEach(v => qs.append(key, v)); else qs.set(key, value);
  }
  const upstream = await fetch(`https://api.themoviedb.org/3${path}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
  });
  const body = await upstream.text();
  res.status(upstream.status).setHeader('content-type', upstream.headers.get('content-type') || 'application/json').send(body);
}
