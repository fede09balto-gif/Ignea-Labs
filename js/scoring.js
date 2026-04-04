/* ============================================================
   IGNEA LABS — Scoring Engine v3.0
   4 Value Streams: Customer Flow, Operations Flow,
   Information Flow, Growth Flow. Each 0-25, total 0-100.
   ============================================================ */

var IgneaScoring = (function() {

  function calculate(answers) {
    var streams = {
      customerFlow: 0,
      operationsFlow: 0,
      informationFlow: 0,
      growthFlow: 0
    };

    // === CUSTOMER FLOW (Q1 cards + Q3 card) ===
    var q1cards = answers.q1_cards || [];
    var q1count = q1cards.length;
    var q1score = 0;
    if (q1count === 1) q1score = 2;
    else if (q1count === 2) q1score = 4;
    else if (q1count === 3) q1score = 6;
    else if (q1count === 4) q1score = 8;
    else if (q1count >= 5) q1score = 10;

    var digitalVals = ['website', 'google', 'social', 'email'];
    var hasDigital = q1cards.some(function(c) {
      return digitalVals.indexOf(c) !== -1;
    });
    if (hasDigital) q1score += 2;
    if (!hasDigital && q1count > 0) q1score = Math.min(q1score, 3);
    q1score = Math.min(q1score, 12);

    var q3val = answers.q3_card !== undefined ? parseInt(answers.q3_card) : 4;
    var q3map = [12, 9, 6, 3, 0];
    var q3score = q3map[q3val] || 0;

    streams.customerFlow = Math.min(25, q1score + q3score);

    // === OPERATIONS FLOW (Q2 cards + Q2 slider + Q4 card) ===
    var q2cards = answers.q2_cards || [];
    var q2cardScore = 16;
    q2cards.forEach(function() { q2cardScore -= 2; });
    q2cardScore = Math.max(0, q2cardScore);

    var slider = answers.q2_slider || 20;
    var sliderAdj = 0;
    if (slider <= 10) sliderAdj = 4;
    else if (slider <= 25) sliderAdj = 2;
    else if (slider <= 50) sliderAdj = 0;
    else if (slider <= 75) sliderAdj = -2;
    else sliderAdj = -4;

    var q4val = answers.q4_card !== undefined ? parseInt(answers.q4_card) : 0;
    var q4map = [0, 3, 6, 9];
    var q4score = q4map[q4val] || 0;

    streams.operationsFlow = Math.min(25, Math.max(0, q2cardScore + sliderAdj + q4score));

    // === INFORMATION FLOW (Q5 cards + Q6 cards + Q7 card) ===
    var q5cards = answers.q5_cards || [];
    var q5automated = q5cards.indexOf('all_automated') !== -1;
    var q5score = 12;
    if (!q5automated) {
      q5cards.forEach(function(c) {
        if (c === 'quotes_manual') q5score -= 2;
        else if (c === 'invoices_manual') q5score -= 2;
        else if (c === 'collections_manual') q5score -= 3;
        else if (c === 'supplier_whatsapp') q5score -= 2;
        else if (c === 'no_debt_tracking') q5score -= 3;
      });
      q5score = Math.max(0, q5score);
    }

    var q6cards = answers.q6_cards || [];
    var q6score = 0;
    var q6vals = {
      paper: 0, whatsapp_work: 1, excel: 2, social_selling: 2,
      accounting: 3, pos: 3, crm: 4, inventory_sys: 3,
      booking: 3, website_form: 2, unused_system: 0, connected_systems: 5
    };
    q6cards.forEach(function(c) {
      q6score += (q6vals[c] || 0);
    });
    q6score = Math.min(13, q6score);

    var q7val = answers.q7_card !== undefined ? parseInt(answers.q7_card) : 0;
    var q7map = [0, 3, 5, 8, 12];
    var q7score = q7map[q7val] || 0;

    var infoRaw = q5score + q6score + q7score;
    streams.informationFlow = Math.min(25, Math.round(infoRaw * 25 / 37));

    // === GROWTH FLOW (Q8 card + Q9 card) ===
    var q8val = answers.q8_card !== undefined ? parseInt(answers.q8_card) : 4;
    var q8map = [12, 9, 5, 2, 0];
    var q8score = q8map[q8val] || 0;

    var q9val = answers.q9_card !== undefined ? parseInt(answers.q9_card) : 0;
    var q9map = [0, 3, 7, 12];
    var q9score = q9map[q9val] || 0;

    streams.growthFlow = Math.min(25, q8score + q9score);

    // === TOTAL ===
    var total = streams.customerFlow + streams.operationsFlow +
                streams.informationFlow + streams.growthFlow;

    var level;
    if (total <= 25) level = 'critical';
    else if (total <= 50) level = 'developing';
    else if (total <= 75) level = 'competent';
    else level = 'advanced';

    return { streams: streams, scores: streams, total: total, level: level };
  }

  function getRecommendations(streams) {
    var recs = [];
    var ranked = Object.keys(streams).sort(function(a, b) {
      return streams[a] - streams[b];
    });

    ranked.forEach(function(stream) {
      var score = streams[stream];
      if (stream === 'customerFlow' && score < 15)
        recs.push({ key: 'whatsapp', stream: 'customerFlow' });
      if (stream === 'customerFlow' && score < 12)
        recs.push({ key: 'website', stream: 'customerFlow' });
      if (stream === 'operationsFlow' && score < 15)
        recs.push({ key: 'automation', stream: 'operationsFlow' });
      if (stream === 'informationFlow' && score < 15)
        recs.push({ key: 'analytics', stream: 'informationFlow' });
      if (stream === 'growthFlow' && score < 12)
        recs.push({ key: 'training', stream: 'growthFlow' });
    });

    if (recs.length === 0) {
      recs.push({ key: 'automation' });
      recs.push({ key: 'analytics' });
    }

    return recs.slice(0, 4);
  }

  function calculateROI(answers, formData) {
    var teamSizes = [3, 10, 30, 75];
    var hourlyCosts = [12, 15, 22, 30, 40, 18];

    var sizeIdx = formData.size_index || 0;
    var revIdx = formData.revenue_index || 5;
    var teamSize = teamSizes[sizeIdx] || 10;
    var hourlyCost = hourlyCosts[revIdx] || 18;

    var weeklyWasted = answers.q2_slider || 20;
    var monthlyWasted = weeklyWasted * 4;
    var fte = Math.round((weeklyWasted / 40) * 10) / 10;

    var q3val = answers.q3_card !== undefined ? parseInt(answers.q3_card) : 0;
    var q8val = answers.q8_card !== undefined ? parseInt(answers.q8_card) : 0;
    var responseCost = [0, 300, 900, 2000, 3500][q3val] || 0;
    var leakageCost = [0, 600, 2000, 4000, 6000][q8val] || 0;

    var totalMonthlyCost = (monthlyWasted * hourlyCost) + responseCost + leakageCost;
    var recInvestment = Math.round(totalMonthlyCost * 4 * 0.35);
    var payback = totalMonthlyCost > 0 ? Math.round(recInvestment / totalMonthlyCost * 10) / 10 : 0;
    var roi12 = recInvestment > 0 ? Math.round(((totalMonthlyCost * 12) - recInvestment) / recInvestment * 100) : 0;

    return {
      weeklyWastedHours: weeklyWasted,
      monthlyWastedHours: monthlyWasted,
      fteEquivalent: fte,
      totalMonthlyCost: Math.round(totalMonthlyCost),
      annualCost: Math.round(totalMonthlyCost * 12),
      hourlyCost: hourlyCost,
      recommendedInvestment: recInvestment,
      paybackMonths: payback,
      roi12: roi12
    };
  }

  return {
    calculate: calculate,
    getRecommendations: getRecommendations,
    calculateROI: calculateROI
  };
})();
