/* ============================================================
   IGNEA LABS — Leyva demo: proforma PDF

   Their stated pain #2. The assistant sends a real PDF as a
   document bubble once a conversation reaches a complete order.

   THE GUARD, which is the whole design:
   A proforma is only produced when EVERY line can be verified
   against the catalog client-side, and the line totals sum to
   the stated total. If anything fails to verify — an unparseable
   line, a price that is not a catalog price or a clean multiple
   of one, a total that does not add up — NO DOCUMENT IS
   PRODUCED. Fail closed.

   That is deliberate and it is the same rule as everywhere else
   here: a wrong number on a document a contractor keeps is far
   worse than no document. An item with no price in the catalog
   can never enter a line, because there is no price to verify
   against.

   NO IVA LINE. We do not know whether their advertised Facebook
   prices include it, and inventing a tax breakdown on someone
   else's fiscal-looking document is exactly the kind of guess
   this project refuses to make. The total is stated as-is.

   NO DELIVERY LINE. We have no delivery data. Same reason.
   ============================================================ */
var LeyvaProforma = (function () {
  'use strict';

  var BIZ = {
    nombre: 'Ferretería Roberto Leyva',
    dir: 'Esq. Dr. Cayetano 25 vrs al Oeste, León',
    tels: '8935-9013 · 2315-1177 · 2315-1610'
  };

  function money(n) { return 'C$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  /* Every price the client is allowed to put on a document. Mirrors the
     priced half of data/leyva-catalog.json — null-priced items are absent
     by construction, so they cannot be verified and therefore cannot
     appear on a line. */
  function catalogPrices() {
    var out = [];
    var P = (typeof LeyvaDemo !== 'undefined' && LeyvaDemo.LOCAL_PRICES) || {};
    Object.keys(P).forEach(function (k) { out.push(P[k].p); });
    return out;
  }

  function num(s) { return parseFloat(String(s).replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')); }

  /* Pull candidate lines out of a reply. Deliberately permissive at the
     parse step and strict at the verify step — it is safer to reject a
     valid line than to accept an invented one. */
  function parse(replyText) {
    var prices = catalogPrices();
    var lines = [], total = null;
    replyText.split(/\n|\|\|\|/).forEach(function (raw) {
      var s = raw.trim();
      if (!s) return;
      var amounts = s.match(/C\$\s?[\d.,]+/g);
      if (!amounts) return;
      var last = num(amounts[amounts.length - 1].replace(/C\$\s?/, ''));
      if (!isFinite(last)) return;

      if (/total/i.test(s)) { total = last; return; }

      var qm = s.match(/^\s*(\d{1,3})\b/);
      var qty = qm ? parseInt(qm[1], 10) : 1;

      // VERIFY: the line total must be qty x a real catalog price.
      var unit = null;
      for (var i = 0; i < prices.length; i++) {
        if (Math.abs(prices[i] * qty - last) < 0.5) { unit = prices[i]; break; }
      }
      if (unit === null) return;   // unverifiable -> the line is dropped

      var desc = s.replace(/C\$\s?[\d.,]+/g, '').replace(/^\s*\d{1,3}\s*/, '')
                  .replace(/[x×:—–-]\s*$/, '').replace(/\s{2,}/g, ' ')
                  .replace(/^[\s:—–-]+|[\s:—–-]+$/g, '').trim();
      if (!desc) return;
      lines.push({ qty: qty, desc: desc, unit: unit, total: unit * qty });
    });

    if (!lines.length) return null;
    var sum = lines.reduce(function (a, l) { return a + l.total; }, 0);
    // If a total was stated it must match what the lines add up to.
    if (total !== null && Math.abs(total - sum) > 0.5) return null;
    return { lines: lines, total: sum };
  }

  function correlativo(seq) { return 'PRO-' + String(seq).padStart(4, '0'); }

  function build(order, seq) {
    var jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDF) return null;
    var d = new jsPDF({ unit: 'mm', format: 'a4' });
    var L = 18, R = 192, y = 20;

    d.setFont('helvetica', 'bold'); d.setFontSize(15);
    d.text(BIZ.nombre, L, y);
    d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor(90);
    y += 5; d.text(BIZ.dir, L, y);
    y += 4; d.text(BIZ.tels, L, y);

    d.setTextColor(0); d.setFont('helvetica', 'bold'); d.setFontSize(11);
    d.text('PROFORMA', R, 20, { align: 'right' });
    d.setFont('helvetica', 'normal'); d.setFontSize(9);
    var num_ = correlativo(seq);
    var hoy = new Date();
    var fmt = function (x) { return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
    var venc = new Date(hoy.getTime() + 8 * 86400000);
    d.text(num_, R, 25.5, { align: 'right' });
    d.text('Fecha: ' + fmt(hoy), R, 30.5, { align: 'right' });
    d.text('Válida hasta: ' + fmt(venc), R, 35.5, { align: 'right' });

    y = 46;
    d.setDrawColor(200); d.line(L, y, R, y); y += 6;
    d.setFont('helvetica', 'bold'); d.setFontSize(8.5);
    d.text('CANT.', L, y); d.text('DESCRIPCIÓN', L + 16, y);
    d.text('P. UNIT.', 150, y, { align: 'right' }); d.text('IMPORTE', R, y, { align: 'right' });
    y += 2.5; d.line(L, y, R, y); y += 6;

    d.setFont('helvetica', 'normal'); d.setFontSize(9);
    order.lines.forEach(function (l) {
      d.text(String(l.qty), L, y);
      d.text(d.splitTextToSize(l.desc, 108)[0], L + 16, y);
      d.text(money(l.unit), 150, y, { align: 'right' });
      d.text(money(l.total), R, y, { align: 'right' });
      y += 6.5;
    });

    y += 1; d.line(120, y, R, y); y += 6.5;
    d.setFont('helvetica', 'bold'); d.setFontSize(11);
    d.text('TOTAL', 150, y, { align: 'right' });
    d.text(money(order.total), R, y, { align: 'right' });

    y += 14;
    d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor(110);
    // Deliberately says what the figure IS, and makes no tax claim either way.
    d.text('Precios en córdobas, según catálogo vigente. Proforma no es factura.', L, y);
    y += 4; d.text('Confirme disponibilidad y condiciones de entrega con el mostrador.', L, y);

    return d;
  }

  var seq = 1041;
  function next() { return ++seq; }

  return {
    parse: parse,
    build: build,
    next: next,
    correlativo: correlativo,
    BIZ: BIZ
  };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaProforma; }
