#!/usr/bin/env node
/* Generates js/leyva-families.js from api/_data/leyva-families.json.

   The client needs the family lexicon for the offline path, and the server
   needs it for the output gate. Rather than maintain two copies by hand — the
   failure mode being a term that routes one way offline and another way
   online — the client mirror is GENERATED. `--check` asserts it is current
   and is run by the test suite. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'api/_data/leyva-families.json'), 'utf8'));

const out = `/* GENERATED FILE — DO NOT EDIT.
   Source: api/_data/leyva-families.json
   Regenerate: node scripts/build-families.js
   Verify:     node scripts/build-families.js --check

   The family lexicon, mirrored client-side so the offline responder routes a
   product exactly the way the server's output gate does. A term that resolved
   differently in the two places would mean the demo behaved one way with
   signal and another way without it. */
var LeyvaFamilies = ${JSON.stringify(src.familias, null, 2)};
if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaFamilies; }
`;

const target = path.join(root, 'js/leyva-families.js');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (cur !== out) { console.error('STALE: js/leyva-families.js does not match the JSON. Run: node scripts/build-families.js'); process.exit(1); }
  console.log('js/leyva-families.js is current');
} else {
  fs.writeFileSync(target, out);
  console.log('wrote js/leyva-families.js (' + Object.keys(src.familias).length + ' families)');
}
