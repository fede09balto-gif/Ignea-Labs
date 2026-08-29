import crypto from 'crypto';

var DEFAULT_ORIGINS = ['https://ignealabs.com', 'https://www.ignealabs.com'];

// See api/claude.js for the same helper's contract: unset/empty env fails
// closed to DEFAULT_ORIGINS, never open. No wildcard support.
function loadAllowedOrigins() {
  var raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  var parsed = raw.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  return parsed.length > 0 ? parsed : DEFAULT_ORIGINS;
}

var ALLOWED_ORIGINS = new Set(loadAllowedOrigins());

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

  /* TWO credentials, TWO scopes.

     IGNEA_OPS_TOKEN  -> scope 'ops'.  Full back office: /ops, the leads
                         dashboard, and free-form prompts to /api/claude.
     IGNEA_DEMO_TOKEN -> scope 'demo'. The Leyva sales demo pages ONLY, and
                         on /api/claude only preset requests — it cannot send
                         a system prompt of its own.

     The demo token exists so the person running a demo in a client's shop
     does not have to be handed the keys to the lead pipeline. Callers MUST
     check the returned `scope`; js/ops-auth.js rejects anything but 'ops'.
     IGNEA_DEMO_TOKEN is optional — unset simply means no demo credential
     exists, and nothing else changes. */
  var opsToken = process.env.IGNEA_OPS_TOKEN;
  var demoToken = process.env.IGNEA_DEMO_TOKEN;
  if (!opsToken) {
    return res.status(500).json({ error: 'server not configured' });
  }

  var supplied = (req.body && req.body.token) || '';
  if (!supplied) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  var scope = null;
  if (safeEqual(supplied, opsToken)) scope = 'ops';
  else if (demoToken && safeEqual(supplied, demoToken)) scope = 'demo';

  if (!scope) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!originOk(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  return res.status(200).json({ ok: true, scope: scope });
}
