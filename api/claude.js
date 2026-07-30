import crypto from 'crypto';

var ALLOWED_MODEL = 'claude-sonnet-5';
var MAX_TOKENS_CAP = 4096;
var MAX_BODY_BYTES = 20000;
var IP_LIMIT = 30;
var TOKEN_LIMIT = 20;
var WINDOW_MS = 60000;

var DEFAULT_ORIGINS = ['https://ignealabs.com', 'https://www.ignealabs.com'];

// ALLOWED_ORIGINS env var: comma-separated, replaces the default list when
// set. Unset OR empty (including whitespace-only) fails closed to
// DEFAULT_ORIGINS — it never falls open to allow-all. No wildcard support:
// entries are matched by exact string equality only.
function loadAllowedOrigins() {
  var raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  var parsed = raw.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  return parsed.length > 0 ? parsed : DEFAULT_ORIGINS;
}

var ALLOWED_ORIGINS = new Set(loadAllowedOrigins());

// In-memory, per-instance only. Vercel can run multiple concurrent instances
// and cold-starts reset these maps, so this slows a brute-force attempt but
// does not stop one. Durable enforcement needs Vercel KV or Upstash.
var ipHits = new Map();
var tokenHits = new Map();

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
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'payload too large' });
  }

  var ip = clientIp(req);
  if (rateLimited(ipHits, ip, IP_LIMIT)) {
    return res.status(429).json({ error: 'too many requests' });
  }

  var configuredToken = process.env.IGNEA_OPS_TOKEN;
  var suppliedToken = req.headers['x-ignea-ops-token'];

  if (!configuredToken) {
    return res.status(500).json({ error: 'server not configured' });
  }
  if (!suppliedToken || !safeEqual(suppliedToken, configuredToken)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!originOk(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  if (rateLimited(tokenHits, suppliedToken, TOKEN_LIMIT)) {
    return res.status(429).json({ error: 'too many requests' });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    var incoming = req.body || {};
    var requestedTokens = parseInt(incoming.max_tokens, 10);
    var maxTokens = Math.min(
      isNaN(requestedTokens) || requestedTokens <= 0 ? 1024 : requestedTokens,
      MAX_TOKENS_CAP
    );

    // model, temperature, top_p and top_k are never read from the client —
    // Sonnet 5 also 400s on non-default sampling params, so there is nothing
    // to forward even if a caller sent one.
    var body = {
      model: ALLOWED_MODEL,
      max_tokens: maxTokens,
      system: incoming.system,
      messages: incoming.messages,
      thinking: { type: 'disabled' }
    };

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    var data = await response.json();

    if (!response.ok) {
      var message = (data && data.error && data.error.message) || 'upstream error';
      return res.status(response.status).json({ error: message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'internal error' });
  }
}
