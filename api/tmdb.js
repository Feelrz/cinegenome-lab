// CINEGENOME Vercel TMDB proxy.
// Store one credential in Vercel Environment Variables:
//   TMDB_API_KEY     -> v3 API key
//   TMDB_READ_TOKEN  -> API Read Access Token (Bearer)
// Never commit either secret to the repository.
module.exports = async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_TOKEN;
  if (!apiKey && !readToken) {
    return res.status(500).json({ error: 'TMDB credential is not configured on the server.' });
  }

  const path = String((req.query && req.query.path) || '');
  if (!/^\/(configuration|search\/movie|movie\/\d+)$/.test(path)) {
    return res.status(400).json({ error: 'Unsupported TMDB path.' });
  }

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value == null) continue;
    if (Array.isArray(value)) value.forEach(v => qs.append(key, String(v)));
    else qs.set(key, String(value));
  }
  if (apiKey && !readToken) qs.set('api_key', apiKey);

  const headers = { accept: 'application/json' };
  if (readToken) headers.Authorization = `Bearer ${readToken}`;

  try {
    const upstream = await fetch(`https://api.themoviedb.org/3${path}?${qs.toString()}`, { headers });
    const body = await upstream.text();
    res.status(upstream.status)
      .setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
      .setHeader('cache-control', 's-maxage=86400, stale-while-revalidate=604800')
      .send(body);
  } catch (error) {
    res.status(502).json({ error: 'TMDB upstream request failed.' });
  }
};
