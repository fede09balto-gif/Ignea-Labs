/* ============================================================
   IGNEA LABS — Scoring Engine
   Calculates operational maturity scores from intake data.
   4 dimensions × 25 points each = 100 max.
   ============================================================ */
var IgneaScoring = (function() {

  function calculate(data) {
    var sinks = data.timeSinks || data.q5_timeleaks || [];
    var tools = data.currentTools || data.q6_tools || [];
    var teamSize = data.teamSize || data.company_size || '';
    var website = data.website || '';
    var revenue = data.revenue || '';

    // Customer Flow (0-25): manual customer work = lower score
    var customerFlow = 25;
    if (sinks.indexOf('same_questions') !== -1) customerFlow -= 8;
    if (sinks.indexOf('followups') !== -1) customerFlow -= 7;
    if (sinks.indexOf('scheduling') !== -1) customerFlow -= 5;
    customerFlow = Math.max(0, customerFlow);

    // Operations Flow (0-25): primitive tools = lower score
    var operationsFlow = 5;
    if (tools.indexOf('accounting') !== -1) operationsFlow += 5;
    if (tools.indexOf('crm') !== -1) operationsFlow += 5;
    if (tools.indexOf('pos') !== -1) operationsFlow += 4;
    if (tools.indexOf('booking') !== -1) operationsFlow += 4;
    if (tools.indexOf('paper') !== -1) operationsFlow -= 3;
    operationsFlow = Math.max(0, Math.min(25, operationsFlow));

    // Information Flow (0-25): data tools present?
    var informationFlow = 3;
    if (tools.indexOf('accounting') !== -1) informationFlow += 6;
    if (tools.indexOf('crm') !== -1) informationFlow += 6;
    if (tools.indexOf('pos') !== -1) informationFlow += 5;
    if (tools.indexOf('excel') !== -1) informationFlow += 3;
    informationFlow = Math.max(0, Math.min(25, informationFlow));

    // Growth Flow (0-25): team size + website + revenue
    var growthFlow = 8;
    if (website) growthFlow += 6;
    if (teamSize === '16-50' || teamSize === '50+') growthFlow += 4;
    if (revenue === '15k50k' || revenue === 'over50k') growthFlow += 4;
    growthFlow = Math.max(0, Math.min(25, growthFlow));

    var total = customerFlow + operationsFlow + informationFlow + growthFlow;

    return {
      total: total,
      customerFlow: customerFlow,
      operationsFlow: operationsFlow,
      informationFlow: informationFlow,
      growthFlow: growthFlow
    };
  }

  function getLevel(total) {
    if (total <= 25) return 'critical';
    if (total <= 50) return 'developing';
    if (total <= 75) return 'competent';
    return 'advanced';
  }

  return {
    calculate: calculate,
    getLevel: getLevel
  };
})();
