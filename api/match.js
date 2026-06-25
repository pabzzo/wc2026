export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const r = await fetch(`https://api.football-data.org/v4/matches/${id}`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
