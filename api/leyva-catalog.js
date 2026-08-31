import crypto from 'crypto';
import leyvaCatalog from './_data/leyva-catalog.json' with { type: 'json' };
import leyvaFamilies from './_data/leyva-families.json' with { type: 'json' };

/* ============================================================
   The operator's catalog view, for /leyva-script.

   WHY AN ENDPOINT AND NOT A LIST TYPED INTO THE BRIEF:
   a hand-maintained copy drifts, and a brief that disagrees with the
   assistant is worse than no brief — it sends the operator into a shop
   confident about something the demo will contradict in front of the
   buyer. This reads the SAME file the system prompt is built from, so
   the two cannot disagree.

   SAME GATE AS EVERYTHING ELSE: the demo token opens it, and so does
   the ops token. Nothing here is reachable without one.

   WHAT IT DELIBERATELY DOES NOT RETURN: the _README, source_url /
   source_date provenance fields, and the meta block. Those are internal
   notes about how unverified this catalog is; the operator is told that
   separately and in plainer words, and shipping them here would put the
   phrase "0 of 29 sourced" one View Source away from a client's phone.
   ============================================================ */

var DEFAULT_ORIGINS = ['https://ignealabs.com', 'https://www.ignealabs.com'];

function loadAllowedOrigins() {
  var raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  var parsed = raw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
  return parsed.length > 0 ? parsed : DEFAULT_ORIGINS;
}
var ALLOWED_ORIGINS = new Set(loadAllowedOrigins());

function safeEqual(a, b) {
  var ha = crypto.createHash('sha256').update(String(a)).digest();
  var hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function originOk(req) {
  var origin = req.headers['origin'];
  if (!origin && req.headers['referer']) {
    try { origin = new URL(req.headers['referer']).origin; } catch (e) { origin = null; }
  }
  return !!origin && ALLOWED_ORIGINS.has(origin);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  var opsToken = process.env.IGNEA_OPS_TOKEN;
  var demoToken = process.env.IGNEA_DEMO_TOKEN;
  if (!opsToken) return res.status(500).json({ error: 'server not configured' });

  var supplied = req.headers['x-ignea-ops-token'];
  var scope = null;
  if (supplied && safeEqual(supplied, opsToken)) scope = 'ops';
  else if (supplied && demoToken && safeEqual(supplied, demoToken)) scope = 'demo';
  if (!scope) return res.status(401).json({ error: 'unauthorized' });
  if (!originOk(req)) return res.status(403).json({ error: 'forbidden' });

  var F = leyvaFamilies.familias;
  var grupos = [], noManeja = [];

  Object.keys(F).forEach(function (k) {
    var f = F[k];
    // Dedupe labels: several spellings share one ("zinc", "lamina de zinc").
    var aus = [];
    f.ausentes.forEach(function (t) {
      var lab = f.etiquetas[t] || t;
      if (aus.indexOf(lab) === -1) aus.push(lab);
    });

    if (!f.presente) {
      var todos = [];
      f.terms.forEach(function (t) {
        var lab = f.etiquetas[t] || t;
        if (todos.indexOf(lab) === -1) todos.push(lab);
      });
      noManeja.push({ familia: f.label, ejemplos: todos });
      return;
    }

    grupos.push({
      familia: f.label,
      noManeja: aus,
      items: f.skus.map(function (sku) {
        var it = leyvaCatalog.items[sku];
        if (!it) return null;
        return {
          sku: sku,
          n: it.n,
          u: it.u || null,
          specs: it.specs || null,
          // precio null is the signal the brief renders as "sin precio en
          // sistema — escala". precio_antes is only ever sent alongside a
          // current price, never on its own: a stale price with no current
          // one is the single worst thing this project can put on a screen.
          precio: (it.precio === null || it.precio === undefined) ? null : it.precio,
          precio_antes: (it.precio !== null && it.precio !== undefined && it.precio_antes) ? it.precio_antes : null,
          promo: (it.precio !== null && it.precio !== undefined && it.promo) ? it.promo : null
        };
      }).filter(Boolean)
    });
  });

  var total = 0, conPrecio = 0;
  grupos.forEach(function (g) { g.items.forEach(function (i) { total++; if (i.precio !== null) conPrecio++; }); });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    negocio: leyvaCatalog.meta.business,
    /* PROJECTED, not passed through. The contacto block carries its own
       source / source_url / source_date provenance fields, and spreading the
       object shipped them to the browser — the exact metadata this endpoint
       is written to withhold. Caught by asserting on the response body rather
       than on the fields I remembered writing. */
    contacto: {
      whatsapp: leyvaCatalog.contacto.whatsapp,
      telefonos: leyvaCatalog.contacto.telefonos,
      direccion: leyvaCatalog.contacto.direccion
    },
    resumen: { total: total, conPrecio: conPrecio, sinPrecio: total - conPrecio },
    grupos: grupos,
    noManeja: noManeja
  });
}
