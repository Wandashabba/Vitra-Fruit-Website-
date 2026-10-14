const { applyCors } = require('./_lib/shop');
const { createRateLimiter } = require('./_lib/rate-limit');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const GENERIC_ERROR = 'Could not subscribe. Please try again.';

// Best-effort per serverless instance: counts are in memory and not shared across instances.
const isRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many sign-up attempts. Please try again in a few minutes.' });
  }

  const body = req.body || {};

  // Honeypot: real visitors never see or fill the "company" field
  if (String(body.company || '').trim()) {
    return res.status(200).json({ success: true });
  }

  const email = String(body.email || '').trim();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID');
    return res.status(500).json({ error: 'Newsletter service is not configured.' });
  }

  // Derive datacenter from API key (format: key-dc e.g. abc123-us6)
  const dc = apiKey.split('-').pop();
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'pending', // double opt-in: Mailchimp emails a confirmation link
        tags: ['website-signup'],
      }),
    });

    const data = await response.json().catch(() => ({}));

    // 400 with title "Member Exists" means already on the list — treat as success
    if (response.ok || data.title === 'Member Exists') {
      return res.status(200).json({ success: true });
    }

    console.error('Mailchimp error:', response.status, data.title, data.detail);
    return res.status(400).json({ error: GENERIC_ERROR });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
