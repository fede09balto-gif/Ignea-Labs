/* ============================================================
   IGNEA LABS — Demo privado: Ferretería Roberto Leyva
   Driven live by Luis Velázquez in front of a buyer. Read the
   constraint before changing anything here:

   IT CANNOT FAIL IN THAT ROOM. Store wifi, Nicaraguan mobile
   data, a phone passed between two people, no second meeting.

   Therefore the architecture is offline-first, not API-first:

     answer(text)
       ├─ local(text)          <- deterministic, zero network,
       │                          ALWAYS computed first
       └─ if online && !forced: race the API against a 4s timeout
            ├─ API wins  -> use the API reply
            └─ anything else (timeout, error, no key, bad shape,
               offline) -> silently use the local answer

   There is no spinner that can hang and no error state a buyer
   can see. The worst case is a slightly less flexible answer.

   PRICE INVARIANTS (mirror of api/claude.js's preset builder):
     · LOCAL_PRICES below contains ONLY items that have a real
       price. Null-priced items are not represented here at all,
       so the offline path has no number it could leak — the same
       guarantee the server gives the model, by construction.
     · Stock and delivery appear in neither path. We do not have
       them. Both paths escalate to the mostrador instead.
   ============================================================ */

var LeyvaDemo = (function () {
  'use strict';

  var API_TIMEOUT_MS = 4000;   // approved: 4s. probalo's 8s is too long live.
  var MAX_TOKENS = 200;        // counter replies are short

  /* ---- offline data ------------------------------------------------
     A deliberate subset of data/leyva-catalog.json: priced items only.
     Kept small on purpose — this is the "it must answer with no
     network" set, not a mirror of the catalog. Null-priced items are
     absent by design, never with a placeholder. */
  var LOCAL_PRICES = {
    gypsum:   { n: 'lámina de gypsum 1/2" x 4x8', p: 370, antes: 400 },
    puerta3:  { n: 'puerta metálica 3 tableros café', p: 4260, antes: 4761 },
    puerta6:  { n: 'puerta metálica blanca 6 tableros', p: 4260, antes: 4761 },
    puerta5:  { n: 'puerta metálica 5 tableros caoba', p: 4140, antes: 4792 },
    tabla:    { n: 'tabla 1" x 12 x 5"', p: 1050, antes: 1150 },
    bondex:   { n: 'Bondex Plus Cemex de 20 kg', p: 185 },
    bondexp:  { n: 'Bondex Pega Cerámica Premium de 20 kg', p: 230 },
    aceite:   { n: 'Yamalube 20W-50 4T de litro', p: 277 },
    bat65:    { n: 'batería Kobe 12N6-5L-BS-GEL', p: 663 },
    bat74:    { n: 'batería Kobe 12N7-4B-GEL', p: 816 },
    llanta17: { n: 'CST C6571 2.75-17 6PR', p: 1206 },
    llanta90: { n: 'CST C918 90/90-17 TL', p: 1626 }
  };

  var CAT_TOOLS = {
    taladro: 'taladro de impacto Caterpillar DX161U de 850 W',
    sierra:  'sierra circular Caterpillar DX59U de 7-1/4" y 1400 W',
    martillo:'martillo giratorio Caterpillar SDS+ DX27U de 1500 W',
    lijadora:'lijadora orbital Caterpillar DX461U de 5"'
  };

  function money(v) { return 'C$' + Number(v).toLocaleString('en-US'); }

  /* ---- the offline responder ---------------------------------------
     Returns an array of bubbles — the same shape the API path returns,
     so the sequencer downstream cannot tell them apart. */
  function local(text) {
    var t = (text || '').toLowerCase();
    var rail = [];

    function hit(msgs, trace) { rail = trace; return { bubbles: msgs, rail: rail }; }

    // Asked directly whether it's a bot — answer honestly, lightly, move on.
    if (/\b(bot|robot|m[áa]quina|humano|persona real|es usted una persona|con qui[ée]n hablo)\b/.test(t)) {
      return hit(['Soy el asistente de la ferretería, pero le resuelvo igual.', '¿Qué ocupa?'],
        ['Pregunta directa: ¿es un asistente?', 'Respuesta honesta, sin rodeos']);
    }

    // Delivery — we have no policy. Escalate, never invent.
    if (/\b(env[íi]o|entrega|flete|domicilio|reparto|mandan|llevan)\b/.test(t)) {
      return hit(['De la entrega le confirmo con el mostrador, no quiero darle un dato malo.', '¿Para qué zona sería?'],
        ['Consulta: entrega', 'Sin dato de entrega en sistema', 'Escalar al mostrador']);
    }

    // Stock — we have no inventory. Escalate, never invent.
    // The quantifier and the verb are usually SEPARATED by the product
    // ("¿cuántas láminas de gypsum tienen?"), so this cannot require them to
    // be adjacent. Getting that wrong made a stock question fall through to
    // the price branch and answer C$370 to "how many do you have" — caught in
    // the browser pass, and exactly the kind of thing that reads as evasion
    // in front of a buyer.
    if (/\b(existencia|inventario|stock|hay en bodega)\b/.test(t) ||
        /\bcu[áa]nt[oa]s?\b[^?]*\b(hay|tiene|tienen|quedan|le quedan|disponibles?)\b/.test(t) ||
        /\b(tiene|tienen|queda|quedan)\b[^?]*\ben (existencia|bodega|stock)\b/.test(t)) {
      return hit(['Déjeme confirmarlo con el mostrador antes de prometerle.', '¿Cuántas ocupa?'],
        ['Consulta: existencia', 'Sin inventario en sistema', 'Escalar al mostrador']);
    }

    // Caterpillar tools — real specs, no price, offer to confirm.
    var tool = null;
    if (/taladro/.test(t)) tool = CAT_TOOLS.taladro;
    else if (/sierra/.test(t)) tool = CAT_TOOLS.sierra;
    else if (/martillo|rotomartillo|sds/.test(t)) tool = CAT_TOOLS.martillo;
    else if (/lijadora/.test(t)) tool = CAT_TOOLS.lijadora;
    else if (/caterpillar|\bcat\b/.test(t)) tool = CAT_TOOLS.taladro;
    if (tool) {
      return hit(['Sí, sí manejamos el ' + tool + '.', 'El precio no lo tengo en pantalla — se lo confirmo con el mostrador ahorita.'],
        ['Consulta: herramienta Caterpillar', 'Producto en catálogo', 'SIN PRECIO EN SISTEMA', 'Escalar al mostrador']);
    }

    // Carried, but we have no current price. Saying "no lo manejo" here would
    // be a false statement about their own stock — the safe answer is the
    // honest one: we have it, the price needs confirming. Its known
    // precio_antes is deliberately NOT repeated; a stale price is the exact
    // failure this demo cannot afford.
    if (/revestimiento|kl8231|m[áa]rmol|marmol/.test(t)) {
      return hit(['Sí, esa lámina de revestimiento negra mármol la manejamos.', 'El precio actual se lo confirmo con el mostrador.'],
        ['Consulta: lámina de revestimiento', 'Producto en catálogo', 'SIN PRECIO EN SISTEMA', 'Escalar al mostrador']);
    }

    // Cotización — sum priced items only.
    if (/cotiza|proforma|proform|proforma|proformar|presupuesto|me arma|s[úu]meme|cu[áa]nto me sale todo/.test(t)) {
      var lines = [
        { q: 10, it: LOCAL_PRICES.gypsum },
        { q: 2, it: LOCAL_PRICES.puerta3 }
      ];
      var sub = lines.reduce(function (a, l) { return a + l.q * l.it.p; }, 0);
      return hit([
        'Va pues, se la armo.',
        lines.map(function (l) { return l.q + ' ' + l.it.n + ' — ' + money(l.q * l.it.p); }).join('\n'),
        'Total ' + money(sub) + '. Entrega se la confirma el mostrador.'
      ], ['Consulta: cotización', '2 líneas con precio en sistema', 'Suma ' + money(sub), 'Entrega: sin dato → escalar']);
    }

    // Priced lookups.
    var key = null;
    if (/gypsum|gipsum|yeso/.test(t)) key = 'gypsum';
    else if (/puerta/.test(t) && /caoba|5 tablero/.test(t)) key = 'puerta5';
    else if (/puerta/.test(t) && /blanc|6 tablero/.test(t)) key = 'puerta6';
    else if (/puerta/.test(t)) key = 'puerta3';
    else if (/tabla|madera/.test(t)) key = 'tabla';
    else if (/bondex/.test(t) && /premium|cer[áa]mica/.test(t)) key = 'bondexp';
    else if (/bondex|pega/.test(t)) key = 'bondex';
    else if (/aceite|yamalube|20w/.test(t)) key = 'aceite';
    else if (/bater[íi]a|kobe/.test(t) && /7|12n7/.test(t)) key = 'bat74';
    else if (/bater[íi]a|kobe/.test(t)) key = 'bat65';
    else if (/llanta|neum[áa]tico|rin/.test(t) && /90\/90|17 tl/.test(t)) key = 'llanta90';
    else if (/llanta|neum[áa]tico|rin/.test(t)) key = 'llanta17';

    if (key) {
      var it = LOCAL_PRICES[key];
      var msgs = ['Fíjese que sí, esa la tenemos.'];
      if (it.antes) {
        msgs.push('Le queda a ' + money(it.p) + ', andaba en ' + money(it.antes) + '.');
        msgs.push('Está en promoción patrias.');
      } else {
        msgs.push('Le queda a ' + money(it.p) + '.');
      }
      return hit(msgs, ['Consulta: precio', 'Coincidencia en catálogo', it.antes ? 'Precio de promoción aplicado' : 'Precio único', 'Sin dato de existencia']);
    }

    // Off catalog.
    return hit(['Uy, ese no lo manejo.', '¿Quiere que le pase la consulta al equipo por WhatsApp?'],
      ['Consulta fuera de catálogo', 'Sin coincidencia', 'Ofrecer pasar al equipo']);
  }

  /* ---- API path ------------------------------------------------------
     Never throws to the caller. Resolves to null on ANY failure, which
     the caller reads as "use the local answer". */
  function callApi(history) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT_MS);

    return fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ignea-ops-token': sessionStorage.getItem('ignea_ops_token') || ''
      },
      // `preset` is what makes the server build the catalog-grounded
      // system prompt. No system prompt is sent from here on purpose —
      // the server would ignore it anyway.
      body: JSON.stringify({ preset: 'leyva', max_tokens: MAX_TOKENS, messages: history }),
      signal: ctrl.signal
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (d) {
      if (!d || !d.content || !d.content[0] || !d.content[0].text) return null;
      var bubbles = d.content[0].text.split('|||').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!bubbles.length) return null;
      return { bubbles: bubbles, usage: d.usage || null };
    }).catch(function () {
      return null;
    }).then(function (v) {
      clearTimeout(timer);
      return v;
    });
  }

  return {
    local: local,
    callApi: callApi,
    LOCAL_PRICES: LOCAL_PRICES,
    CAT_TOOLS: CAT_TOOLS,
    API_TIMEOUT_MS: API_TIMEOUT_MS
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaDemo; }
