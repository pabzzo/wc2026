export default function handler(req, res) {
  const auth = req.headers.authorization;

  if (!auth || auth !== `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD}`).toString('base64')}`) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Back Office WC2026"');
    return res.status(401).send('Accès refusé');
  }

  res.status(200).send('OK');
}
