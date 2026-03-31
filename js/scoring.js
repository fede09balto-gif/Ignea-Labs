/* ============================================================
   ONDA AI — Diagnostic Scoring Engine v2
   4 Value Streams: Customer Flow, Operations Flow,
   Information Flow, Growth Flow. Each 0-25, total 0-100.
   ============================================================ */

var OndaScoring = (function() {

  function calculate(answers) {
    var streams = {
      customerFlow: 0,
      operationsFlow: 0,
      informationFlow: 0,
      growthFlow: 0
    };

    // Q1: Customer Journey (Customer Flow)
    var q1Cards = answers.q1_cards || [];
    var channelCount = q1Cards.length;
    var q1Score = 0;
    if (channelCount === 0) q1Score = 0;
    else if (channelCount === 1) q1Score = 2;
    else if (channelCount === 2) q1Score = 4;
    else if (channelCount === 3) q1Score = 6;
    else if (channelCount === 4) q1Score = 8;
    else q1Score = 10;

    var digitalChannels = ['website_form', 'google_search', 'social_media', 'email'];
    var hasDigital = false;
    for (var i = 0; i < q1Cards.length; i++) {
      if (digitalChannels.indexOf(q1Cards[i]) !== -1) { hasDigital = true; break; }
    }
    if (hasDigital) q1Score += 2;
    if (!hasDigital && channelCount > 0) q1Score = Math.min(q1Score, 3);

    // Q2: Response Time (Customer Flow)
    var q2Scores = [12, 9, 6, 3, 0];
    var q2Score = q2Scores[answers.q2_card !== undefined ? answers.q2_card : 4] || 0;

    streams.customerFlow = Math.min(25, q1Score + q2Score);

    // Q3: Repetitive Tasks (Operations Flow)
    var q3Cards = answers.q3_cards || [];
    var taskPenalties = [2, 2, 2, 2, 1, 3, 2, 2];
    var q3Score = 16;
    for (var j = 0; j < q3Cards.length; j++) {
      var idx = parseInt(q3Cards[j]);
      if (taskPenalties[idx] !== undefined) q3Score -= taskPenalties[idx];
    }
    q3Score = Math.max(0, q3Score);

    // Q4: Order-to-Fulfillment (Operations Flow)
    var q4Scores = [0, 3, 6, 9];
    var q4Score = q4Scores[answers.q4_card !== undefined ? answers.q4_card : 0] || 0;

    streams.operationsFlow = Math.min(25, q3Score + q4Score);

    // Q5: Financial Flow (Information Flow)
    var q5Cards = answers.q5_cards || [];
    var q5AllAuto = q5Cards.indexOf('all_automated') !== -1 || q5Cards.indexOf(5) !== -1;
    var q5Score = 12;
    if (!q5AllAuto) {
      var financePenalties = { '0': 2, '1': 2, '2': 3, '3': 2, '4': 3 };
      for (var k = 0; k < q5Cards.length; k++) {
        var pen = financePenalties[String(q5Cards[k])];
        if (pen) q5Score -= pen;
      }
      q5Score = Math.max(0, q5Score);
    }

    // Q6: Systems & Integration (Information Flow)
    var q6Cards = answers.q6_cards || [];
    var toolScores = { '0': 0, '1': 1, '2': 2, '3': 2, '4': 3, '5': 3, '6': 4, '7': 5 };
    var q6Score = 0;
    for (var m = 0; m < q6Cards.length; m++) {
      q6Score += (toolScores[String(q6Cards[m])] || 0);
    }
    if (q6Cards.indexOf(7) !== -1 || q6Cards.indexOf('integrated') !== -1) q6Score += 2;
    q6Score = Math.min(13, q6Score);

    // Q7: Decision-Making (Information Flow)
    var q7Scores = [0, 3, 5, 8, 12];
    var q7Score = q7Scores[answers.q7_card !== undefined ? answers.q7_card : 0] || 0;

    streams.informationFlow = Math.min(25, q5Score + q6Score + q7Score);

    // Q8: Revenue Leakage (Growth Flow)
    var q8Scores = [12, 9, 5, 2, 0];
    var q8Score = q8Scores[answers.q8_card !== undefined ? answers.q8_card : 4] || 0;

    // Q9: Scale Stress Test (Growth Flow)
    var q9Scores = [0, 3, 7, 12];
    var q9Score = q9Scores[answers.q9_card !== undefined ? answers.q9_card : 0] || 0;

    streams.growthFlow = Math.min(25, q8Score + q9Score);

    // Total
    var total = streams.customerFlow + streams.operationsFlow + streams.informationFlow + streams.growthFlow;

    var level;
    if (total <= 25) level = 'critical';
    else if (total <= 50) level = 'developing';
    else if (total <= 75) level = 'competent';
    else level = 'advanced';

    return { streams: streams, total: total, level: level };
  }

  function getRecommendations(streams) {
    var recs = [];
    var ranked = Object.keys(streams).sort(function(a, b) { return streams[a] - streams[b]; });

    ranked.forEach(function(stream) {
      var score = streams[stream];
      if (stream === 'customerFlow' && score < 15) {
        recs.push({ key: 'whatsapp_bot', stream: 'customerFlow' });
      }
      if (stream === 'customerFlow' && score < 12) {
        recs.push({ key: 'website_ai_chat', stream: 'customerFlow' });
      }
      if (stream === 'operationsFlow' && score < 15) {
        recs.push({ key: 'internal_automation', stream: 'operationsFlow' });
      }
      if (stream === 'informationFlow' && score < 15) {
        recs.push({ key: 'data_integration', stream: 'informationFlow' });
      }
      if (stream === 'growthFlow' && score < 12) {
        recs.push({ key: 'full_transformation', stream: 'growthFlow' });
      }
    });

    return recs.slice(0, 3);
  }

  function calculateROI(answers, formData, streams) {
    var teamSizes = [3, 10, 30, 75];
    var teamSize = teamSizes[formData.size_index || 0] || 10;
    var hourlyCosts = [1.5, 2.5, 4, 6, 10, 3];
    var hourlyCost = hourlyCosts[formData.revenue_index || 5] || 3;

    var tasksSelected = (answers.q3_cards || []).length;
    var weeklyWastedHours = tasksSelected * 7;
    var monthlyWastedHours = weeklyWastedHours * 4;

    var responseTimePenalty = [0, 50, 150, 300, 500][answers.q2_card || 4] || 0;
    var leakageEstimate = [0, 100, 300, 600, 800][answers.q8_card || 4] || 0;

    var totalMonthlyCost = (monthlyWastedHours * hourlyCost) + responseTimePenalty + leakageEstimate;

    var recommendedInvestment = Math.round(totalMonthlyCost * 4 * 0.35);
    var paybackMonths = totalMonthlyCost > 0 ? Math.round((recommendedInvestment / totalMonthlyCost) * 10) / 10 : 0;
    var roi12 = recommendedInvestment > 0 ? Math.round(((totalMonthlyCost * 12) - recommendedInvestment) / recommendedInvestment * 100) : 0;

    return {
      monthlyWastedHours: monthlyWastedHours,
      weeklyWastedHours: weeklyWastedHours,
      totalMonthlyCost: Math.round(totalMonthlyCost),
      annualCost: Math.round(totalMonthlyCost * 12),
      recommendedInvestment: recommendedInvestment,
      paybackMonths: paybackMonths,
      roi12: roi12,
      hourlyCost: hourlyCost,
      fteEquivalent: Math.round((weeklyWastedHours / 40) * 10) / 10
    };
  }

  return {
    calculate: calculate,
    getRecommendations: getRecommendations,
    calculateROI: calculateROI
  };
})();
