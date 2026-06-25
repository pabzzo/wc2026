export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  const PLAYLIST_ID = 'PLYTrSce4LemRNjnWWkdPnU9GG44dMAKnZ';
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'YOUTUBE_API_KEY not set' });
  try {
    let items = [], pageToken = '';
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      items = items.concat(data.items || []);
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
