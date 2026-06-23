export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches`,
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_KEY
        }
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur API scores' });
  }
}
