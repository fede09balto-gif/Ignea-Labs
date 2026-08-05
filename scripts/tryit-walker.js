#!/usr/bin/env node
/* ============================================================
   IGNEA — /probalo tree/catalog eval walker

   Run: node scripts/tryit-walker.js

   Asserts, per node, and fails the build (non-zero exit) on any
   violation:
     1. Every {{calc ...}} figure is recomputed INDEPENDENTLY of
        js/tryit-resolver.js's own CALC map (see that file's
        comment: "the eval walker recomputes every one of these
        independently, so a wrong formula fails the build rather
        than shipping a wrong quote"). This is a second, separate
        implementation of the same whitelist, not a call into the
        resolver's — a bug shipped in one won't validate itself
        against the other.
     2. Every chip id referenced by a node resolves to a real node.
     3. Every node is reachable from one of the 4 entry points.
     4. No dead ends: any node without chips must be the explicit
        closer (`closes:true`); nothing else may terminate silently.
     5. Every bare digit in a node's STATIC template text (i.e.
        outside {{...}} placeholders) is declared in that node's
        allowDigits — proving it's a scripted scenario quantity,
        not a leaked price literal.
   ============================================================ */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var tree = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tryit-tree.json'), 'utf8'));
var catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ferreteria-catalog.json'), 'utf8'));
var resolver = require(path.join(ROOT, 'js/tryit-resolver.js'));
var R = resolver.make(catalog);

/* ---- independent recompute: separate implementation, not resolver.CALC ---- */
function priceOf(sku) {
  var it = catalog.items[sku];
  if (!it) throw new Error('Unknown SKU in catalog: ' + sku);
  if (it.p === null || it.p === undefined) throw new Error('PriceUnavailable: ' + sku + ' (source: ' + it.source + ')');
  return it.p;
}
var W = {
  m3Losa: function (m2, esp) { return Number((m2 * esp).toFixed(1)); },
  bolsasLosa: function (m2, esp) { return Math.ceil(m2 * esp * catalog.rend.cementoM3); },
  bolsasLosaCosto: function (m2, esp) { return W.bolsasLosa(m2, esp) * priceOf('CEM-HOL-42'); },
  bloquesPared: function (m2) { return Math.ceil(m2 * catalog.rend.bloquesM2); },
  bloquesParedCosto: function (m2) { return W.bloquesPared(m2) * priceOf('BLO-15'); },
  lineTotal: function (sku, qty) { return priceOf(sku) * Number(qty); },
  diff: function (a, b) { return priceOf(a) - priceOf(b); },
  iva: function (sub) { return sub * catalog.terms.iva; },
  tot: function (sub) { return sub + W.iva(sub); },
  subFinal: function () { return W.bloquesParedCosto(40) + W.lineTotal('CEM-CAN-42', 14) + W.lineTotal('ARE-M3', 2) + catalog.terms.flete.costo; },
  ivaFinal: function () { return W.iva(W.subFinal()); },
  totFinal: function () { return W.tot(W.subFinal()); },
  subCemento: function () { return W.lineTotal('CEM-HOL-42', 20) + catalog.terms.flete.costo; },
  ivaCemento: function () { return W.iva(W.subCemento()); },
  totCemento: function () { return W.tot(W.subCemento()); },
  subVarilla: function () { return W.lineTotal('VAR-038-6', 40) + W.lineTotal('CEM-HOL-42', 20) + catalog.terms.flete.costo; },
  ivaVarilla: function () { return W.iva(W.subVarilla()); },
  totVarilla: function () { return W.tot(W.subVarilla()); }
};

var PLACEHOLDER_RE = /\{\{([^{}]*(?:\([^()]*\)[^{}]*)*)\}\}/g;

/* Every `calc NAME args...` invocation inside a raw template, wrapped or not
   (`{{calc x 1}}`, `{{m0 (calc x 1)}}`). No calc-within-calc-args nesting
   exists in this tree (verified below by exhaustive extraction), so a flat
   regex over each {{...}} span is sufficient — do not widen without
   re-checking that assumption. */
function findCalcCalls(expr) {
  var out = [];
  var re = /calc\s+([A-Za-z0-9_]+)((?:\s+[^\s()]+)*)/g;
  var m;
  while ((m = re.exec(expr))) {
    var argsStr = m[2].trim();
    var args = argsStr.length ? argsStr.split(/\s+/) : [];
    out.push({
      name: m[1],
      args: args.map(function (a) { return /^-?\d+(\.\d+)?$/.test(a) ? Number(a) : a; })
    });
  }
  return out;
}

function staticDigits(sayTemplate) {
  var stripped = sayTemplate.replace(PLACEHOLDER_RE, ' ');
  var found = [], re = /\d+(?:\.\d+)?/g, m;
  while ((m = re.exec(stripped))) found.push(Number(m[0]));
  return found;
}

/* ---- per-node checks ---- */
var nodeIds = Object.keys(tree.nodes);
var results = [];
var allOk = true;

nodeIds.forEach(function (id) {
  var node = tree.nodes[id];
  var fails = [];

  // 1. full render must succeed (proves every path/calc reference resolves
  //    against the catalog — no undefined field, no unknown SKU, no
  //    unwhitelisted calc name, no null-priced SKU reaching a template).
  var rendered = null;
  try {
    rendered = R.render(node.say);
  } catch (e) {
    fails.push('render threw: ' + e.message);
  }

  // 2. independent recompute of every calc invocation in the raw template.
  //    Extract each {{...}} placeholder span first, then look for `calc`
  //    inside it — scanning the whole template would let the regex run on
  //    past the closing "}}" into surrounding prose.
  var exprs = [], pm, placeholderRe = new RegExp(PLACEHOLDER_RE.source, 'g');
  while ((pm = placeholderRe.exec(node.say))) exprs.push(pm[1]);
  var calls = [];
  exprs.forEach(function (expr) { calls = calls.concat(findCalcCalls(expr)); });
  calls.forEach(function (c) {
    var resolverVal, walkerVal, resolverErr, walkerErr;
    if (!(c.name in R.CALC)) {
      resolverErr = 'not in resolver.CALC whitelist: ' + c.name;
    } else {
      try { resolverVal = R.CALC[c.name].apply(null, c.args); }
      catch (e) { resolverErr = e.message; }
    }
    try {
      if (!W[c.name]) throw new Error('not in independent walker whitelist: ' + c.name);
      walkerVal = W[c.name].apply(null, c.args);
    } catch (e) { walkerErr = e.message; }

    if (resolverErr || walkerErr) {
      fails.push('calc ' + c.name + '(' + c.args.join(',') + ') — resolver:' + (resolverErr || resolverVal) + ' walker:' + (walkerErr || walkerVal));
    } else if (Number(resolverVal) !== Number(walkerVal)) {
      fails.push('calc ' + c.name + '(' + c.args.join(',') + ') MISMATCH — resolver=' + resolverVal + ' walker=' + walkerVal);
    }
  });

  // 3. every chip id resolves
  (node.chips || []).forEach(function (cid) {
    if (!tree.nodes[cid]) fails.push('chip "' + cid + '" does not resolve to a node');
  });

  // 4. dead-end check
  if (!node.chips || node.chips.length === 0) {
    if (!node.closes) fails.push('no chips and not marked closes:true — dead end');
  }

  // 5. bare-digit guard
  var allow = node.allowDigits || [];
  var digits = staticDigits(node.say);
  digits.forEach(function (d) {
    if (allow.indexOf(d) === -1) fails.push('bare digit "' + d + '" in static text not in allowDigits ' + JSON.stringify(allow));
  });

  results.push({ id: id, pass: fails.length === 0, fails: fails, rendered: rendered });
  if (fails.length) allOk = false;
});

/* ---- global checks ---- */
var globalFails = [];

tree.entry.forEach(function (id) {
  if (!tree.nodes[id]) globalFails.push('entry "' + id + '" does not resolve to a node');
});

var seen = {};
var queue = tree.entry.slice();
while (queue.length) {
  var id = queue.shift();
  if (seen[id]) continue;
  seen[id] = true;
  var n = tree.nodes[id];
  if (!n) continue;
  (n.chips || []).forEach(function (c) { if (!seen[c]) queue.push(c); });
}
var unreachable = nodeIds.filter(function (id) { return !seen[id]; });
if (unreachable.length) globalFails.push('unreachable from the 4 entry points: ' + unreachable.join(', '));

var closers = nodeIds.filter(function (id) { return tree.nodes[id].closes; });
if (closers.length !== 1) globalFails.push('expected exactly 1 closing node, found ' + closers.length + ': ' + closers.join(', '));

if (globalFails.length) allOk = false;

/* ---- report ---- */
console.log('=== /probalo tryit-tree eval walker ===\n');
results.forEach(function (r) {
  console.log((r.pass ? '[PASS] ' : '[FAIL] ') + r.id);
  if (!r.pass) r.fails.forEach(function (f) { console.log('    - ' + f); });
});
console.log('\n=== global checks ===');
if (globalFails.length === 0) {
  console.log('[PASS] entry validity, full reachability, single closer (' + closers[0] + ')');
} else {
  console.log('[FAIL] global');
  globalFails.forEach(function (f) { console.log('    - ' + f); });
}

console.log('\n=== summary ===');
console.log(results.filter(function (r) { return r.pass; }).length + '/' + results.length + ' nodes passed');
console.log(allOk ? 'BUILD OK' : 'BUILD FAILED');

process.exit(allOk ? 0 : 1);
