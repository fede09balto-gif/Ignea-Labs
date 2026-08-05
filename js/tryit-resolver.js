/* ============================================================
   IGNEA LABS — /probalo template resolver

   Turns a `say` template from data/tryit-tree.json into finished text
   using data/ferreteria-catalog.json. Deliberately tiny: field lookup,
   two money formatters, and a CLOSED whitelist of named calculations.

   Two invariants this file exists to enforce:
     1. No price literal ever reaches reply text. Templates carry
        placeholders; only this file reads prices.
     2. A null-priced SKU can never be quoted. In dev that throws
        loudly; in production the caller skips the node silently.
   ============================================================ */
(function (root) {
  'use strict';

  var DEV = typeof location !== 'undefined' &&
            /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  function PriceUnavailable(sku) {
    var e = new Error('Catalog price unavailable for ' + sku + ' (source: TODO)');
    e.name = 'PriceUnavailable';
    e.sku = sku;
    return e;
  }

  function make(catalog) {
    var I = catalog.items, T = catalog.terms, R = catalog.rend;

    function item(sku) {
      var x = I[sku];
      if (!x) throw new Error('Unknown SKU: ' + sku);
      return x;
    }
    /* The single chokepoint for reading a price. Everything that could
       put a number in front of a prospect goes through here. */
    function price(sku) {
      var x = item(sku);
      if (x.p === null || x.p === undefined) throw PriceUnavailable(sku);
      return x.p;
    }

    function m0(v) { return catalog.meta.symbol + Number(v).toLocaleString('en-US'); }
    function money(v) {
      return catalog.meta.symbol + Number(v).toLocaleString('en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* ---- whitelisted calculations ----
       Adding one here is a deliberate act. The eval walker recomputes
       every one of these independently, so a wrong formula fails the
       build rather than shipping a wrong quote. */
    var CALC = {
      m3Losa:        function (m2, esp) { return (m2 * esp).toFixed(1); },  // string: keeps the trailing .0
      bolsasLosa:    function (m2, esp) { return Math.ceil(m2 * esp * R.cementoM3); },
      bolsasLosaCosto: function (m2, esp) { return CALC.bolsasLosa(m2, esp) * price('CEM-HOL-42'); },
      bloquesPared:  function (m2) { return Math.ceil(m2 * R.bloquesM2); },
      bloquesParedCosto: function (m2) { return CALC.bloquesPared(m2) * price('BLO-15'); },
      lineTotal:     function (sku, qty) { return price(sku) * Number(qty); },
      diff:          function (a, b) { return price(a) - price(b); },
      iva:           function (sub) { return sub * T.iva; },
      tot:           function (sub) { return sub + CALC.iva(sub); },

      /* proforma aggregates — named so the tree carries no arithmetic */
      subFinal:   function () { return CALC.bloquesParedCosto(40) + CALC.lineTotal('CEM-CAN-42', 14) + CALC.lineTotal('ARE-M3', 2) + T.flete.costo; },
      ivaFinal:   function () { return CALC.iva(CALC.subFinal()); },
      totFinal:   function () { return CALC.tot(CALC.subFinal()); },
      subCemento: function () { return CALC.lineTotal('CEM-HOL-42', 20) + T.flete.costo; },
      ivaCemento: function () { return CALC.iva(CALC.subCemento()); },
      totCemento: function () { return CALC.tot(CALC.subCemento()); },
      subVarilla: function () { return CALC.lineTotal('VAR-038-6', 40) + CALC.lineTotal('CEM-HOL-42', 20) + T.flete.costo; },
      ivaVarilla: function () { return CALC.iva(CALC.subVarilla()); },
      totVarilla: function () { return CALC.tot(CALC.subVarilla()); }
    };

    function path(expr) {
      var p = expr.split('.'), head = p.shift(), cur;
      if (head === 'i') { cur = item(p.shift()); if (p[0] === 'p') return price(cur === I[expr] ? expr : Object.keys(I).filter(function (k) { return I[k] === cur; })[0]); }
      else if (head === 't') cur = T;
      else if (head === 'r') cur = R;
      else throw new Error('Unknown namespace: ' + head);
      while (p.length) { cur = cur[p.shift()]; if (cur === undefined) throw new Error('Bad path: ' + expr); }
      return cur;
    }

    /* One token: a bare path, `m0 X`, `money X`, or `calc name args...`.
       Parenthesised sub-expressions are resolved innermost-first. */
    function token(src) {
      src = src.trim();
      if (src.charAt(0) === '(' && src.charAt(src.length - 1) === ')') src = src.slice(1, -1).trim();
      var parts = src.split(/\s+/), head = parts[0];

      if (head === 'calc') {
        var fn = CALC[parts[1]];
        if (!fn) throw new Error('Calculation not whitelisted: ' + parts[1]);
        return fn.apply(null, parts.slice(2).map(function (a) {
          return /^-?\d+(\.\d+)?$/.test(a) ? Number(a) : a;
        }));
      }
      if (head === 'm0' || head === 'money') {
        var inner = src.slice(head.length).trim();
        var v = /^\(/.test(inner) ? token(inner) : path(inner);
        return head === 'm0' ? m0(v) : money(v);
      }
      return path(src);
    }

    /* Resolve a whole template. Throws PriceUnavailable if any SKU it
       touches is unpriced — the caller decides dev-loud vs prod-silent. */
    function render(tpl) {
      return tpl.replace(/\{\{([^{}]*(?:\([^()]*\)[^{}]*)*)\}\}/g, function (_, expr) {
        return String(token(expr));
      });
    }

    /* Node-level entry point. Returns null in production when the node
       cannot be quoted, so the engine can drop the chip instead of
       showing a broken price. */
    function renderNode(node) {
      try {
        return render(node.say);
      } catch (e) {
        if (e.name === 'PriceUnavailable') {
          if (DEV) throw e;          // fail loudly while building
          return null;               // skip silently in production
        }
        throw e;
      }
    }

    return { render: render, renderNode: renderNode, CALC: CALC, price: price, item: item, m0: m0, money: money };
  }

  root.IgneaTryItResolver = { make: make, PriceUnavailable: PriceUnavailable };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.IgneaTryItResolver;
})(typeof globalThis !== 'undefined' ? globalThis : this);
