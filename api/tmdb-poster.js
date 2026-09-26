// Same-origin TMDB poster proxy for Canvas/share-card exports.
// Poster images are public CDN assets; no TMDB secret is exposed here.
module.exports = async function handler(req, res) {
  const posterPath = String((req.query && req.query.path) || '');
  const size = String((req.query && req.query.size) || 'w780');
  const allowedSizes = new Set(['w342','w500','w780','original']);
  if (!/^\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)$/i.test(posterPath) || !allowedSizes.has(size)) {
    return res.status(400).json({ error: 'Invalid poster request.' });
  }
  try {
    const upstream = await fetch(`https://image.tmdb.org/t/p/${size}${posterPath}`, {
      headers: { accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Poster unavailable.' });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.status(200)
      .setHeader('content-type', upstream.headers.get('content-type') || 'image/jpeg')
      .setHeader('cache-control', 'public, s-maxage=604800, stale-while-revalidate=2592000')
      .send(body);
  } catch (error) {
    res.status(502).json({ error: 'Poster upstream request failed.' });
  }
};
