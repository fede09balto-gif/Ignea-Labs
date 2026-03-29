/* ============================================================
   ONDA AI — Scoring Algorithm + Recommendation Engine + ROI
   Per BUILD_SPEC section 8.
   5 dimensions, each 0-20, total 0-100.
   ============================================================ */

var OndaScoring = (function() {

  function calculate(answers) {
    var scores = {
      customerInteraction: 0,
      processMaturity: 0,
      digitalPresence: 0,
      dataUtilization: 0,
      aiReadiness: 0
    };

    // Q4: Customer interaction hours (0-80, step 5)
    // Higher hours = lower score = more opportunity
    var hours = parseInt(answers.q4) || 0;
    if (hours >= 60) scores.customerInteraction += 2;
    else if (hours >= 40) scores.customerInteraction += 5;
    else if (hours >= 20) scores.customerInteraction += 10;
    else if (hours >= 10) scores.customerInteraction += 15;
    else scores.customerInteraction += 20;

    // Q5: Digital presence (index 0-3)
    // 0="No tenemos", 1="Sí pero no genera", 2="Genera algunos", 3="Principal fuente"
    var web = parseInt(answers.q5) || 0;
    scores.digitalPresence += [0, 5, 12, 20][web] || 0;

    // Also factor Q5 into customer interaction
    if (web <= 1) {
      scores.customerInteraction = Math.max(0, scores.customerInteraction - 5);
    }

    // Q6: Scheduling methods (array of indices)
    // 0=Notebook, 1=Excel, 2=Software, 3=WhatsApp, 4=Memory
    var methods = answers.q6 || [];
    var processScore = 20;
    if (methods.indexOf(0) !== -1) processScore -= 8;  // Notebook
    if (methods.indexOf(3) !== -1) processScore -= 5;  // WhatsApp
    if (methods.indexOf(4) !== -1) processScore -= 7;  // Memory
    if (methods.indexOf(1) !== -1) processScore -= 2;  // Excel
    scores.processMaturity = Math.max(0, processScore);

    // Q7: Tech stack (array of indices)
    // 0=None, 1=Social, 2=WA Business, 3=Excel, 4=Accounting, 5=CRM, 6=POS, 7=Other
    var tools = answers.q7 || [];
    var techScore = 0;
    if (tools.indexOf(1) !== -1) techScore += 3;  // Social media
    if (tools.indexOf(2) !== -1) techScore += 4;  // WhatsApp Business
    if (tools.indexOf(3) !== -1) techScore += 3;  // Excel
    if (tools.indexOf(4) !== -1) techScore += 5;  // Accounting
    if (tools.indexOf(5) !== -1) techScore += 8;  // CRM
    if (tools.indexOf(6) !== -1) techScore += 5;  // POS
    scores.dataUtilization = Math.min(20, techScore);

    // Q8: AI familiarity (index 0-3)
    // 0="Never heard", 1="Heard not used", 2="Tried", 3="Use regularly"
    var ai = parseInt(answers.q8) || 0;
    scores.aiReadiness = [2, 6, 12, 20][ai] || 2;

    // Digital presence also gets boost from social/WA Business in Q7
    if (tools.indexOf(1) !== -1) scores.digitalPresence = Math.min(20, scores.digitalPresence + 3);
    if (tools.indexOf(2) !== -1) scores.digitalPresence = Math.min(20, scores.digitalPresence + 2);

    var total = 0;
    for (var key in scores) total += scores[key];

    var level;
    if (total <= 25) level = 'critical';
    else if (total <= 50) level = 'developing';
    else if (total <= 75) level = 'competent';
    else level = 'advanced';

    return { scores: scores, total: total, level: level };
  }

  function getRecommendations(scores) {
    var recos = [];

    if (scores.customerInteraction < 10) {
      recos.push({ key: 'whatsapp', priority: 'high' });
    }
    if (scores.digitalPresence < 10) {
      recos.push({ key: 'website', priority: 'high' });
    }
    if (scores.processMaturity < 10) {
      recos.push({ key: 'automation', priority: 'high' });
    }
    if (scores.dataUtilization < 10) {
      recos.push({ key: 'analytics', priority: 'medium' });
    }
    if (scores.aiReadiness < 10) {
      recos.push({ key: 'training', priority: 'medium' });
    }

    // Ensure at least 2 recommendations
    if (recos.length === 0) {
      recos.push({ key: 'automation', priority: 'medium' });
      recos.push({ key: 'analytics', priority: 'medium' });
    }

    return recos.slice(0, 4);
  }

  function getHourlyCost(revenueIndex) {
    // Map Q11 revenue brackets to estimated hourly employee cost (USD)
    // 0=<$2K, 1=$2-5K, 2=$5-15K, 3=$15-50K, 4=>$50K, 5=prefer not to say
    return [1.5, 2.5, 4, 6, 10, 3][revenueIndex] || 3;
  }

  function calculateROI(answers, scores) {
    var teamSizes = [3, 10, 30, 75]; // midpoints for Q2 options
    var teamSize = teamSizes[parseInt(answers.q2) || 0] || 10;
    var hours = parseInt(answers.q4) || 20;
    var revenueIdx = parseInt(answers.q11) || 5;
    var hourlyCost = getHourlyCost(revenueIdx);
    var web = parseInt(answers.q5) || 0;

    // WhatsApp bot savings (handles ~70% of routine inquiries)
    var botHoursSaved = hours * 0.7;
    var botMonthlySavings = botHoursSaved * hourlyCost * 4;

    // Website savings (lead generation value)
    var webMonthlySavings = web <= 1 ? 400 : 200;

    // Automation savings (~20 hrs/month conservative)
    var autoMonthlySavings = 20 * hourlyCost * 4;

    var totalMonthlySavings = Math.round(botMonthlySavings + webMonthlySavings + autoMonthlySavings);

    // Investment range based on revenue tier
    var investMin, investMax;
    if (revenueIdx <= 1) { investMin = 1500; investMax = 3000; }
    else if (revenueIdx <= 3) { investMin = 3000; investMax = 5000; }
    else { investMin = 5000; investMax = 8000; }

    var avgInvestment = (investMin + investMax) / 2;
    var paybackMonths = Math.max(1, Math.round(avgInvestment / totalMonthlySavings * 10) / 10);
    var roi12 = Math.round(((totalMonthlySavings * 12) - avgInvestment) / avgInvestment * 100);

    // Savings range (±20%)
    var savingsMin = Math.round(totalMonthlySavings * 0.8);
    var savingsMax = Math.round(totalMonthlySavings * 1.2);

    return {
      savingsMin: savingsMin,
      savingsMax: savingsMax,
      investMin: investMin,
      investMax: investMax,
      paybackMonths: paybackMonths,
      roi12: roi12
    };
  }

  return {
    calculate: calculate,
    getRecommendations: getRecommendations,
    calculateROI: calculateROI
  };
})();
