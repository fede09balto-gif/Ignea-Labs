#!/usr/bin/env node
/* Asserts js/leyva-order.js's table matches api/_data/leyva-catalog.json.
   A drift means the offline path quotes one number and the online path
   another — the demo disagreeing with itself in front of a buyer. */
const path = require('path'), root = path.join(__dirname, '..');
const C = require(path.join(root, 'api/_data/leyva-catalog.json'));
const O = require(path.join(root, 'js/leyva-order.js'));
let bad = [];
O.P.forEach(r => {
  const it = C.items[r.sku];
  if (!it) return bad.push(r.sku + ': not in catalog');
  if (it.precio !== r.p) bad.push(r.sku + ': price ' + r.p + ' vs catalog ' + it.precio);
  if ((it.precio_antes || null) !== (r.antes || null)) bad.push(r.sku + ': antes ' + r.antes + ' vs catalog ' + it.precio_antes);
});
const priced = Object.keys(C.items).filter(s => C.items[s].precio !== null);
const covered = O.P.map(r => r.sku);
priced.filter(s => !covered.includes(s)).forEach(s => bad.push(s + ': priced in catalog but missing from leyva-order.js'));
covered.filter(s => C.items[s] && C.items[s].precio === null).forEach(s => bad.push(s + ': NULL-PRICED but present in leyva-order.js'));
if (bad.length) { console.error('PRICE PARITY FAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
console.log('price parity OK — ' + O.P.length + ' rows match the catalog, ' + priced.length + ' priced SKUs all covered');
