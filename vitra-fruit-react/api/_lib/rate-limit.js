// Simple fixed-window rate limiter keyed on client IP. State lives in memory,
// so this is best-effort only: each serverless instance keeps its own counts
// and they reset on cold start. It blunts casual abuse, not a determined attacker.

function clientIp(req) {
  const forwarded = String((req.headers && req.headers['x-forwarded-for']) || '');
  const first = forwarded.split(',')[0].trim();
  return first || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function createRateLimiter({ limit, windowMs }) {
  const hits = new Map();

  return function isRateLimited(req) {
    const now = Date.now();
    const key = clientIp(req);
    let entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (hits.size > 5000) {
      for (const [ip, value] of hits) {
        if (now - value.start >= windowMs) hits.delete(ip);
      }
    }
    return entry.count > limit;
  };
}

module.exports = { clientIp, createRateLimiter };
