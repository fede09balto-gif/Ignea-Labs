/* ============================================================
   IGNEA LABS — Ops Calculator Module
   ROI calculator for the ops dashboard. Replicates scoring.js
   formulas exactly for use in an interactive UI context.
   ============================================================ */

var OpsCalculator = (function() {

  /* ---- Internal state ---- */
  var currentLead = null;
  var lastResult = null;

  /* ---- Helpers ---- */

  function getHourlyCost(revenueIndex) {
    return [1.5, 2.5, 4, 6, 10, 3][revenueIndex] || 3;
  }

  var teamSizes = [3, 10, 30, 75];

  function fmt(n) {
    return Number(n).toLocaleString('es-NI');
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSelectedVals(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return [];
    var selected = container.querySelectorAll('.mc-opt.selected');
    return Array.prototype.map.call(selected, function(el) {
      return el.getAttribute('data-val');
    });
  }

  function getSingleSelectedVal(containerId) {
    var vals = getSelectedVals(containerId);
    return vals.length ? vals[0] : null;
  }

  /* ---- Score calculation (exact replica of scoring.js) ---- */

  function calculateScore(hours, web, methods, tools, ai) {
    var scores = {
      customerInteraction: 0,
      processMaturity: 0,
      digitalPresence: 0,
      dataUtilization: 0,
      aiReadiness: 0
    };

    // Q4: customer interaction hours
    if (hours >= 60) scores.customerInteraction += 2;
    else if (hours >= 40) scores.customerInteraction += 5;
    else if (hours >= 20) scores.customerInteraction += 10;
    else if (hours >= 10) scores.customerInteraction += 15;
    else scores.customerInteraction += 20;

    // Q5: digital presence
    scores.digitalPresence += [0, 5, 12, 20][web] || 0;

    // Q5 also affects customerInteraction
    if (web <= 1) {
      scores.customerInteraction = Math.max(0, scores.customerInteraction - 5);
    }

    // Q6: scheduling methods
    // data-val mapping: paper=0, excel=1, software=2, whatsapp=3, memory=4
    var processScore = 20;
    if (methods.indexOf('paper') !== -1)    processScore -= 8;  // notebook/paper = 0
    if (methods.indexOf('whatsapp') !== -1) processScore -= 5;  // whatsapp = 3
    if (methods.indexOf('memory') !== -1)   processScore -= 7;  // memory = 4
    if (methods.indexOf('excel') !== -1)    processScore -= 2;  // excel = 1
    scores.processMaturity = Math.max(0, processScore);

    // Q7: tech stack
    // data-val mapping: none=0, social=1, wa_business=2, excel=3, accounting=4, crm=5, pos=6
    var techScore = 0;
    if (tools.indexOf('social') !== -1)      techScore += 3;
    if (tools.indexOf('wa_business') !== -1) techScore += 4;
    if (tools.indexOf('excel') !== -1)       techScore += 3;
    if (tools.indexOf('accounting') !== -1)  techScore += 5;
    if (tools.indexOf('crm') !== -1)         techScore += 8;
    if (tools.indexOf('pos') !== -1)         techScore += 5;
    scores.dataUtilization = Math.min(20, techScore);

    // Q8: AI familiarity
    scores.aiReadiness = [2, 6, 12, 20][ai] || 2;

    // Q7 social/wa_business boost for digitalPresence
    if (tools.indexOf('social') !== -1)
      scores.digitalPresence = Math.min(20, scores.digitalPresence + 3);
    if (tools.indexOf('wa_business') !== -1)
      scores.digitalPresence = Math.min(20, scores.digitalPresence + 2);

    var total = 0;
    for (var key in scores) total += scores[key];

    var level;
    if (total <= 25)      level = 'critical';
    else if (total <= 50) level = 'developing';
    else if (total <= 75) level = 'competent';
    else                  level = 'advanced';

    return { scores: scores, total: total, level: level };
  }

  /* ---- ROI calculation (exact replica of scoring.js) ---- */

  function calculateROI(hours, web, revenueIdx, captureRate) {
    var hourlyCost = getHourlyCost(revenueIdx);
    var capture    = (captureRate || 35) / 100;

    var botHoursSaved       = hours * 0.7;
    var botMonthlySavings   = botHoursSaved * hourlyCost * 4;
    var webMonthlySavings   = (web <= 1) ? 400 : 200;
    var autoHoursSaved      = 20;
    var autoMonthlySavings  = autoHoursSaved * hourlyCost * 4;
    var totalMonthlySavings = botMonthlySavings + webMonthlySavings + autoMonthlySavings;

    var recommendedPrice = totalMonthlySavings * 4 * capture;
    var paybackMonths    = totalMonthlySavings > 0
      ? Math.round((recommendedPrice / totalMonthlySavings) * 10) / 10
      : 0;
    var roi12 = recommendedPrice > 0
      ? Math.round(((totalMonthlySavings * 12) - recommendedPrice) / recommendedPrice * 100)
      : 0;

    var clientKeeps = totalMonthlySavings - Math.round(recommendedPrice / 12);

    return {
      botHoursSaved:       Math.round(botHoursSaved),
      botMonthlySavings:   Math.round(botMonthlySavings),
      webMonthlySavings:   Math.round(webMonthlySavings),
      autoHoursSaved:      autoHoursSaved,
      autoMonthlySavings:  Math.round(autoMonthlySavings),
      totalMonthlySavings: Math.round(totalMonthlySavings),
      recommendedPrice:    Math.round(recommendedPrice),
      paybackMonths:       paybackMonths,
      roi12:               roi12,
      captureRate:         captureRate || 35,
      clientKeeps:         Math.max(0, clientKeeps),
      hourlyCost:          hourlyCost
    };
  }

  /* ---- MC card toggle logic ---- */

  function setupMcGroup(containerId, multiSelect) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', function(e) {
      var opt = e.target.closest('.mc-opt');
      if (!opt || !container.contains(opt)) return;

      if (multiSelect) {
        opt.classList.toggle('selected');
      } else {
        var current = container.querySelectorAll('.mc-opt.selected');
        Array.prototype.forEach.call(current, function(el) {
          el.classList.remove('selected');
        });
        opt.classList.add('selected');
      }
      recalculate();
    });
  }

  /* ---- Read all inputs ---- */

  function gatherInputs() {
    var hours      = parseInt(document.getElementById('calcHours')   ? document.getElementById('calcHours').value   : 0)   || 0;
    var revenueEl  = document.getElementById('calcRevenue');
    var revenueIdx = revenueEl ? (parseInt(revenueEl.value) || 0) : 0;
    var captureEl  = document.getElementById('calcCapture');
    var captureRate = captureEl ? (parseInt(captureEl.value) || 35) : 35;

    var web     = parseInt(getSingleSelectedVal('calcWebsite') || '0') || 0;
    var ai      = parseInt(getSingleSelectedVal('calcAI')      || '0') || 0;
    var methods = getSelectedVals('calcMethods');
    var tools   = getSelectedVals('calcTech');

    return { hours: hours, web: web, ai: ai, methods: methods, tools: tools, revenueIdx: revenueIdx, captureRate: captureRate };
  }

  /* ---- Render helpers ---- */

  function levelLabel(level) {
    var labels = {
      critical:   'Crítico',
      developing: 'En Desarrollo',
      competent:  'Competente',
      advanced:   'Avanzado'
    };
    return labels[level] || level;
  }

  function dimLabel(key) {
    var labels = {
      customerInteraction: 'Interacción con clientes',
      processMaturity:     'Madurez de procesos',
      digitalPresence:     'Presencia digital',
      dataUtilization:     'Uso de datos',
      aiReadiness:         'Preparación IA'
    };
    return labels[key] || key;
  }

  function renderScoreSection(scoreResult) {
    var el = document.getElementById('calcScoreSection');
    if (!el) return;

    var dimsHtml = '';
    var dimOrder = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
    dimOrder.forEach(function(key) {
      var val = scoreResult.scores[key];
      var pct = Math.round((val / 20) * 100);
      dimsHtml +=
        '<div class="calc-dim">' +
          '<div class="calc-dim-header">' +
            '<span class="calc-dim-name">' + escHtml(dimLabel(key)) + '</span>' +
            '<span class="calc-dim-val">' + val + '/20</span>' +
          '</div>' +
          '<div class="calc-dim-bar"><div class="calc-dim-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
    });

    el.innerHTML =
      '<div class="calc-total">' + scoreResult.total +
        '<span class="calc-of"> / 100</span>' +
      '</div>' +
      '<div class="calc-level score-badge score-' + scoreResult.level + '">' +
        escHtml(levelLabel(scoreResult.level)) +
      '</div>' +
      '<div class="calc-dims">' + dimsHtml + '</div>';
  }

  function renderSavingsSection(roi) {
    var el = document.getElementById('calcSavingsSection');
    if (!el) return;

    el.innerHTML =
      '<div class="calc-savings-title" data-i18n="ops.calc.savingsTitle">Desglose de Ahorro</div>' +
      '<div class="calc-line">' +
        '<span>Bot de WhatsApp (' + roi.botHoursSaved + ' hrs)</span>' +
        '<span class="calc-val">$' + fmt(roi.botMonthlySavings) + '/mes</span>' +
      '</div>' +
      '<div class="calc-line">' +
        '<span>Website + Chat</span>' +
        '<span class="calc-val">$' + fmt(roi.webMonthlySavings) + '/mes</span>' +
      '</div>' +
      '<div class="calc-line">' +
        '<span>Automatización (' + roi.autoHoursSaved + ' hrs)</span>' +
        '<span class="calc-val">$' + fmt(roi.autoMonthlySavings) + '/mes</span>' +
      '</div>' +
      '<div class="calc-line calc-total-line">' +
        '<span>Total Ahorro Mensual</span>' +
        '<span class="calc-val-big">$' + fmt(roi.totalMonthlySavings) + '/mes</span>' +
      '</div>';
  }

  function renderPricingSection(roi) {
    var el = document.getElementById('calcPricingSection');
    if (!el) return;

    el.innerHTML =
      '<div class="calc-pricing-title">Precio y Retorno</div>' +
      '<div class="calc-line">' +
        '<span>Precio recomendado</span>' +
        '<span class="calc-val-big">$' + fmt(roi.recommendedPrice) + '</span>' +
      '</div>' +
      '<div class="calc-formula">' +
        '($' + fmt(roi.totalMonthlySavings) + ' × 4 meses) × ' + roi.captureRate + '% captura' +
      '</div>' +
      '<div class="calc-line">' +
        '<span>Período de recuperación</span>' +
        '<span>' + roi.paybackMonths + ' meses</span>' +
      '</div>' +
      '<div class="calc-line">' +
        '<span>ROI a 12 meses</span>' +
        '<span class="calc-roi">+' + fmt(roi.roi12) + '%</span>' +
      '</div>' +
      '<div class="calc-line">' +
        '<span>Cliente conserva</span>' +
        '<span>$' + fmt(roi.clientKeeps) + '/mes en ahorros</span>' +
      '</div>';
  }

  function renderComparisonBar(roi) {
    var el = document.getElementById('calcComparisonBar');
    if (!el) return;

    var value12m    = roi.totalMonthlySavings * 12;
    var total       = roi.recommendedPrice + value12m;
    var investPct   = total > 0 ? Math.round((roi.recommendedPrice / total) * 100) : 0;
    var valuePct    = 100 - investPct;

    el.innerHTML =
      '<div class="comp-bar">' +
        '<div class="comp-invest" style="width:' + investPct + '%">Inversión $' + fmt(roi.recommendedPrice) + '</div>' +
        '<div class="comp-value"  style="width:' + valuePct  + '%">Valor 12m $' + fmt(value12m) + '</div>' +
      '</div>';
  }

  /* ---- Main recalculate ---- */

  function recalculate() {
    var inp = gatherInputs();

    var scoreResult = calculateScore(inp.hours, inp.web, inp.methods, inp.tools, inp.ai);
    var roi         = calculateROI(inp.hours, inp.web, inp.revenueIdx, inp.captureRate);

    lastResult = {
      scoreResult: scoreResult,
      roi:         roi,
      inputs:      inp
    };

    renderScoreSection(scoreResult);
    renderSavingsSection(roi);
    renderPricingSection(roi);
    renderComparisonBar(roi);
  }

  /* ---- Prefill from lead data ---- */

  function prefillFromLead(lead) {
    if (!lead) return;
    currentLead = lead;

    var industryEl = document.getElementById('calcIndustry');
    if (industryEl) industryEl.value = lead.industry || lead.company_name || '';

    var teamSizeEl = document.getElementById('calcTeamSize');
    if (teamSizeEl) {
      var tsIdx = lead.diagnostic_answers ? (parseInt(lead.diagnostic_answers.q2) || 0) : 0;
      teamSizeEl.value = teamSizes[tsIdx] || 10;
    }

    var answers = lead.diagnostic_answers || {};

    // Hours (q4)
    if (answers.q4 !== undefined) {
      var hoursEl = document.getElementById('calcHours');
      if (hoursEl) {
        hoursEl.value = answers.q4;
        var hoursValEl = document.getElementById('calcHoursVal');
        if (hoursValEl) hoursValEl.textContent = answers.q4 + ' hrs';
      }
    }

    // Revenue (q11)
    if (answers.q11 !== undefined) {
      var revEl = document.getElementById('calcRevenue');
      if (revEl) revEl.value = answers.q11;
    }

    // Website / Q5 (single select) — data-val 0-3
    if (answers.q5 !== undefined) {
      setSingleSelect('calcWebsite', String(answers.q5));
    }

    // AI readiness / Q8 (single select) — data-val 0-3
    if (answers.q8 !== undefined) {
      setSingleSelect('calcAI', String(answers.q8));
    }

    // Scheduling methods / Q6 (multi) — q6 is array of indices
    // scoring.js: 0=paper, 1=excel, 2=software, 3=whatsapp, 4=memory
    if (Array.isArray(answers.q6)) {
      var methodMap = { 0: 'paper', 1: 'excel', 2: 'software', 3: 'whatsapp', 4: 'memory' };
      var methodVals = answers.q6.map(function(i) { return methodMap[i]; }).filter(Boolean);
      setMultiSelect('calcMethods', methodVals);
    }

    // Tech stack / Q7 (multi) — q7 is array of indices
    // scoring.js: 0=none, 1=social, 2=wa_business, 3=excel, 4=accounting, 5=crm, 6=pos
    if (Array.isArray(answers.q7)) {
      var techMap = { 0: 'none', 1: 'social', 2: 'wa_business', 3: 'excel', 4: 'accounting', 5: 'crm', 6: 'pos' };
      var techVals = answers.q7.map(function(i) { return techMap[i]; }).filter(Boolean);
      setMultiSelect('calcTech', techVals);
    }

    recalculate();
  }

  function setSingleSelect(containerId, val) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var opts = container.querySelectorAll('.mc-opt');
    Array.prototype.forEach.call(opts, function(el) {
      if (el.getAttribute('data-val') === val) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  function setMultiSelect(containerId, vals) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var opts = container.querySelectorAll('.mc-opt');
    Array.prototype.forEach.call(opts, function(el) {
      if (vals.indexOf(el.getAttribute('data-val')) !== -1) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  /* ---- Populate lead select ---- */

  function populateLeadSelect(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Seleccionar prospecto —</option>';
    var leads = OpsDashboard.getAllLeads();
    leads.forEach(function(lead) {
      var opt = document.createElement('option');
      opt.value = lead.id;
      var label = [lead.company_name, lead.first_name, lead.last_name]
        .filter(Boolean).join(' · ');
      opt.textContent = label || lead.id;
      sel.appendChild(opt);
    });
  }

  /* ---- Save pricing to Supabase ---- */

  function savePricing() {
    if (!lastResult) return;

    if (typeof IgneaSupabase === 'undefined' || !IgneaSupabase.client) {
      alert('Supabase no configurado — configura las credenciales primero');
      return;
    }

    var leadSel = document.getElementById('calcLeadSelect');
    var leadId  = leadSel ? leadSel.value : null;
    var user    = OpsAuth.getUser ? OpsAuth.getUser() : {};
    var inp     = lastResult.inputs;
    var roi     = lastResult.roi;
    var score   = lastResult.scoreResult;

    var solutions = {
      methods: inp.methods,
      tools:   inp.tools
    };

    IgneaSupabase.client
      .from('pricing_calculations')
      .insert([{
        lead_id:            leadId || null,
        calculated_by:      user ? user.id : null,
        team_size:          parseInt(document.getElementById('calcTeamSize') ? document.getElementById('calcTeamSize').value : 0) || 0,
        hours_on_inquiries: inp.hours,
        hourly_cost:        roi.hourlyCost,
        revenue_bracket:    inp.revenueIdx,
        monthly_savings:    roi.totalMonthlySavings,
        recommended_price:  roi.recommendedPrice,
        payback_months:     roi.paybackMonths,
        roi_12_months:      roi.roi12,
        capture_rate:       inp.captureRate,
        solutions:          solutions,
        status:             'draft'
      }])
      .then(function(result) {
        if (result.error) return;

        var btn = document.getElementById('calcSaveBtn');
        if (btn) {
          var orig = btn.textContent;
          btn.textContent = '¡Guardado!';
          setTimeout(function() { btn.textContent = orig; }, 2000);
        }

        if (typeof IgneaSheetsSync !== 'undefined' && IgneaSheetsSync.sync) {
          IgneaSheetsSync.sync({
            type:   'pricing_calculation',
            leadId: leadId,
            roi:    roi,
            score:  score
          });
        }
      });
  }

  /* ---- Copy summary to clipboard ---- */

  function copySummary() {
    if (!lastResult) return;

    var leadSel  = document.getElementById('calcLeadSelect');
    var company  = '';
    if (leadSel && leadSel.value) {
      var opt = leadSel.options[leadSel.selectedIndex];
      company = opt ? opt.textContent : '';
    }

    var score = lastResult.scoreResult;
    var roi   = lastResult.roi;

    var text =
      'Diagnóstico: ' + (company || 'Prospecto') + '\n' +
      'Puntuación: ' + score.total + '/100 (' + levelLabel(score.level) + ')\n\n' +
      'Ahorro mensual estimado: $' + fmt(roi.totalMonthlySavings) + '/mes\n' +
      'ROI a 12 meses: +' + fmt(roi.roi12) + '%\n' +
      'Período de recuperación: ' + roi.paybackMonths + ' meses\n\n' +
      'Soluciones recomendadas:\n' +
      '1. Bot de WhatsApp — $' + fmt(roi.botMonthlySavings) + '/mes ahorro\n' +
      '2. Website + Chat — $' + fmt(roi.webMonthlySavings) + '/mes ahorro\n' +
      '3. Automatización — $' + fmt(roi.autoMonthlySavings) + '/mes ahorro\n\n' +
      'Precio recomendado: $' + fmt(roi.recommendedPrice);

    var btn = document.getElementById('calcCopyBtn');
    navigator.clipboard.writeText(text).then(function() {
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(function() { btn.textContent = orig; }, 2000);
      }
    }).catch(function() {
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = 'Error';
        setTimeout(function() { btn.textContent = orig; }, 2000);
      }
    });
  }

  /* ---- init ---- */

  function init() {
    populateLeadSelect('calcLeadSelect');

    // Lead select change → prefill
    var leadSel = document.getElementById('calcLeadSelect');
    if (leadSel) {
      leadSel.addEventListener('change', function() {
        var leads = OpsDashboard.getAllLeads();
        var lead  = leads.find(function(l) { return String(l.id) === leadSel.value; });
        if (lead) prefillFromLead(lead);
      });
    }

    // Range sliders: update display + recalculate
    var hoursRange   = document.getElementById('calcHours');
    var hoursValSpan = document.getElementById('calcHoursVal');
    if (hoursRange && hoursValSpan) {
      hoursValSpan.textContent = hoursRange.value + ' hrs';
      hoursRange.addEventListener('input', function() {
        hoursValSpan.textContent = hoursRange.value + ' hrs';
        recalculate();
      });
    }

    var captureRange   = document.getElementById('calcCapture');
    var captureValSpan = document.getElementById('calcCaptureVal');
    if (captureRange && captureValSpan) {
      captureValSpan.textContent = captureRange.value + '%';
      captureRange.addEventListener('input', function() {
        captureValSpan.textContent = captureRange.value + '%';
        recalculate();
      });
    }

    // Text / number inputs
    ['calcIndustry', 'calcTeamSize'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recalculate);
    });

    // Revenue select
    var revSel = document.getElementById('calcRevenue');
    if (revSel) revSel.addEventListener('change', recalculate);

    // MC card groups
    setupMcGroup('calcMethods', true);   // multi-select
    setupMcGroup('calcTech',    true);   // multi-select
    setupMcGroup('calcWebsite', false);  // single-select
    setupMcGroup('calcAI',      false);  // single-select

    // Action buttons
    var saveBtn = document.getElementById('calcSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', savePricing);

    var copyBtn = document.getElementById('calcCopyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copySummary);

    // External event — open calculator and prefill from a specific lead
    document.addEventListener('ops:openCalculator', function(e) {
      if (e.detail && e.detail.lead) {
        prefillFromLead(e.detail.lead);
        // Select the lead in the dropdown
        var sel = document.getElementById('calcLeadSelect');
        if (sel) sel.value = e.detail.lead.id;
      }
    });

    // Initial render with default values
    recalculate();
  }

  /* ---- Public API ---- */

  return {
    init:            init,
    prefillFromLead: prefillFromLead
  };

})();
