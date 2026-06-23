export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const FEEDS = {
    google:    'https://news.google.com/rss/search?q=coupe+du+monde+2026+football&hl=fr&gl=FR&ceid=FR:fr',
    eurosport: 'https://www.eurosport.fr/football/rss.xml',
    lequipe:   'https://www.lequipe.fr/rss/actu_rss_Football.xml',
  };

  const src = req.query.src || 'google';
  const url = FEEDS[src] || FEEDS.google;

  function getTag(str, tag) {
    const re = new RegExp(
      `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      'i'
    );
    const m = str.match(re);
    return m ? (m[1] || m[2] || '').trim() : '';
  }

  function findImg(str) {
    const patterns = [
      /url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
      /<media:content[^>]+url="([^"]+)"/i,
      /<enclosure[^>]+url="([^"]+)"/i,
      /<img[^>]+src="([^"]+)"/i,
    ];
    for (const p of patterns) {
      const m = str.match(p);
      if (m && m[1] && !m[1].includes('pixel') && m[1].length > 10) return m[1];
    }
    return '';
  }

  // Fetch og:image from article page when RSS doesn't include one
  async function fetchOgImage(articleUrl) {
    if (!articleUrl) return '';
    try {
      const r = await fetch(articleUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WC2026Dashboard/1.0)' },
        signal: AbortSignal.timeout(3000),
      });
      const html = await r.text();
      const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
               || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      return m ? m[1] : '';
    } catch {
      return '';
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WC2026Dashboard/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const items = [];

    for (const match of itemMatches.slice(0, 10)) {
      const raw = match[1];
      const rawTitle = getTag(raw, 'title');
      if (!rawTitle) continue;

      // Google News: "Titre article - Source"
      const parts = rawTitle.split(' - ');
      const source = parts.length > 1 ? parts.pop().trim() : src;
      const title = parts.join(' - ').trim() || rawTitle;

      const desc = getTag(raw, 'description').replace(/<[^>]+>/g, '').trim().slice(0, 400);
      const pubDate = getTag(raw, 'pubDate');
      const link = getTag(raw, 'link') || raw.match(/<link[^>]*>\s*([^<]+)/)?.[1]?.trim() || '';

      let date = '';
      try { date = new Date(pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); }
      catch { date = pubDate.slice(0, 10); }

      items.push({
        title,
        text: desc,
        img: findImg(raw),
        date,
        tag: source,
        type: 'actu',
        url: link,
        id: 'rss_' + Buffer.from(link).toString('base64').slice(0, 12),
      });
    }

    // Fetch og:image in parallel for items without image
    const withImages = await Promise.all(
      items.map(async item => {
        if (item.img) return item;
        const img = await fetchOgImage(item.url);
        return { ...item, img };
      })
    );

    res.status(200).json(withImages);
  } catch (error) {
    res.status(500).json({ error: 'RSS indisponible', details: error.message });
  }
}
