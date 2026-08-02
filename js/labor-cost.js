/* ============================================================
   IGNEA LABS — labor cost, single source of truth

   Every hourly rate on this site comes from here. Before this file
   existed there were five tables that disagreed by up to 36x, and
   ops-ai.js was told to compute savings at $3-4/hr while the
   calculator feeding it used up to $75/hr — a 10x contradiction
   between the site and the proposal it generated.

   DERIVATION (Nicaragua, 2026 — verified against two sources):
     Minimum wage, comercio/restaurantes/hoteles  C$11,350.08/month
       (MITRAB, effective March 2026)
     INSS patronal, employers <50 workers               21.50%
       (IVM 12.50 + Riesgos Prof. 1.50 + Victimas de Guerra 1.50
        + Enfermedad/Maternidad 6.00; it is 22.50% at 50+ workers,
        which moves the hourly rate by ~$0.02 — not worth branching)
     INATEC                                              2.00%
     Aguinaldo (1 month / 12)                            8.33%
     Vacaciones (1 month / 12)                           8.33%
     -------------------------------------------------- -------
     Total load                                         40.16%  -> 1.4016

     C$11,350.08 x 1.4016 = C$15,908 / 36.6243 = $434.36/month
     $434.36 / 208 h = $2.09/hour        (208 h = 48-hour legal week)

   CAVEAT ON THE RECORD: neither source addressed whether aguinaldo
   and vacaciones themselves attract INSS. They are modelled here as
   not attracting it, which matches the common treatment of aguinaldo.
   If vacaciones does attract it the true figure is ~$2.13/hour. That
   difference is inside the rounding of a prospect-facing estimate.
   ============================================================ */

var IgneaLaborCost = (function () {
  'use strict';

  var FX_BCN_2026      = 36.6243;   // BCN official rate, fixed for 2026 (0% crawl)
  var MIN_WAGE_COMERCIO = 11350.08; // C$/month, MITRAB, effective March 2026
  var LOAD              = 1.4016;   // INSS 21.5 + INATEC 2 + aguinaldo 8.33 + vacaciones 8.33
  var HOURS_PER_MONTH   = 208;      // 48-hour legal week

  /* counter is DERIVED from the figures above — recomputed, not typed.
     supervisor and professional are JUDGMENT ESTIMATES, not derived:
     no Nicaraguan wage survey backs them. Treat them as placeholders
     with a defensible shape, and adjust if real data ever surfaces. */
  var bands = {
    counter:      +((MIN_WAGE_COMERCIO * LOAD / FX_BCN_2026) / HOURS_PER_MONTH).toFixed(2),
    supervisor:   3.10,  // JUDGMENT ESTIMATE — experienced / supervisory
    professional: 4.75   // JUDGMENT ESTIMATE — administrative / professional
  };

  /* Map a headcount to a band. Small operations are counter-wage
     businesses; the rate should not climb just because the team grew
     by two people. */
  function bandForHeadcount(n) {
    if (n <= 15) return 'counter';
    if (n <= 50) return 'supervisor';
    return 'professional';
  }

  function rate(band) {
    return bands[band] || bands.counter;
  }

  function rateForHeadcount(n) {
    return rate(bandForHeadcount(n));
  }

  /* The note that must accompany any figure derived from these rates. */
  function disclosure(lang) {
    return lang === 'en'
      ? 'Figures in USD at the official BCN rate (C$' + FX_BCN_2026 + '). Based on loaded labor cost in Nicaragua.'
      : 'Cifras en USD al tipo de cambio oficial BCN (C$' + FX_BCN_2026 + '). Estimación basada en el costo laboral cargado en Nicaragua.';
  }

  return {
    FX_BCN_2026: FX_BCN_2026,
    MIN_WAGE_COMERCIO: MIN_WAGE_COMERCIO,
    LOAD: LOAD,
    HOURS_PER_MONTH: HOURS_PER_MONTH,
    bands: bands,
    rate: rate,
    bandForHeadcount: bandForHeadcount,
    rateForHeadcount: rateForHeadcount,
    disclosure: disclosure
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = IgneaLaborCost;
