export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const { url } = req.query;
  if (!url) return res.status(400).json({ img: '' });

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WC2026Dashboard/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await r.text();

    const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
             || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
             || html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i)
             || html.match(/<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i);

    res.status(200).json({ img: og ? og[1] : '' });
  } catch {
    res.status(200).json({ img: '' });
  }
}
