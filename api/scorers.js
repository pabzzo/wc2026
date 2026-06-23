export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const r = await fetch('https://api.football-data.org/v4/competitions/WC/scorers?limit=50', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
