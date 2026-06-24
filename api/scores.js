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
    // Pass through full response including errors for debugging
    res.status(response.status).json({ ...data, _status: response.status, _keyPresent: !!process.env.FOOTBALL_DATA_KEY });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
