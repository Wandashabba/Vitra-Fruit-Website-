module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  return res.status(200).json({
    ok: true,
    service: 'vitra-fruit-api',
    timestamp: new Date().toISOString(),
    host: req.headers.host || null,
    env: {
      smtpHost: Boolean(String(process.env.SMTP_HOST || '').trim()),
      smtpPort: Boolean(String(process.env.SMTP_PORT || '').trim()),
      smtpUser: Boolean(String(process.env.SMTP_USER || '').trim()),
      smtpPass: Boolean(String(process.env.SMTP_PASS || '').trim()),
      orderEmailTo: Boolean(String(process.env.ORDER_EMAIL_TO || '').trim()),
      payfastSandbox: String(process.env.PAYFAST_SANDBOX || 'false')
    }
  });
};
