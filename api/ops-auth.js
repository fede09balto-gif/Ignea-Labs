import crypto from 'crypto';

var ALLOWED_ORIGINS = new Set([
  'https://ignealabs.com',
  'https://www.ignealabs.com'
]);

// In-memory, per-instance only — see api/claude.js for the same caveat.
var ipHits = new Map();
var WINDOW_MS = 60000;
var IP_LIMIT = 10;

function rateLimited(map, key, limit) {
  var now = Date.now();
  var entry = map.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    map.set(key, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}

function safeEqual(a, b) {
  var ha = crypto.createHash('sha256').update(String(a)).digest();
  var hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function originOk(req) {
  var origin = req.headers['origin'];
  if (!origin && req.headers['referer']) {
    try {
      origin = new URL(req.headers['referer']).origin;
    } catch (e) {
      origin = null;
    }
  }
  return !!origin && ALLOWED_ORIGINS.has(origin);
}

function clientIp(req) {
  var fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  var contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 2048) {
    return res.status(413).json({ error: 'payload too large' });
  }

  var ip = clientIp(req);
  if (rateLimited(ipHits, ip, IP_LIMIT)) {
    return res.status(429).json({ error: 'too many requests' });
  }

  var configuredToken = process.env.IGNEA_OPS_TOKEN;
  if (!configuredToken) {
    return res.status(500).json({ error: 'server not configured' });
  }

  var supplied = (req.body && req.body.token) || '';
  if (!supplied || !safeEqual(supplied, configuredToken)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!originOk(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  return res.status(200).json({ ok: true });
}
