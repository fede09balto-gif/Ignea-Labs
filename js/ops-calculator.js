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

  function formatMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function formatPercent(n) {
    var prefix = n > 0 ? '+' : '';
    return prefix + Math.round(n) + '%';
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
    var i18nKeys = {
      critical:   'ops.calc.level.critical',
      developing: 'ops.calc.level.developing',
      competent:  'ops.calc.level.competent',
      advanced:   'ops.calc.level.advanced'
    };
    var fallback = {
      critical:   'Crítico',
      developing: 'En Desarrollo',
      competent:  'Competente',
      advanced:   'Avanzado'
    };
    if (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) {
      var translated = IgneaI18n.t(i18nKeys[level]);
      if (translated && translated !== i18nKeys[level]) return translated;
    }
    return fallback[level] || level;
  }

  function dimLabel(key) {
    var i18nKeys = {
      customerInteraction: 'ops.calc.dim.customerInteraction',
      processMaturity:     'ops.calc.dim.processMaturity',
      digitalPresence:     'ops.calc.dim.digitalPresence',
      dataUtilization:     'ops.calc.dim.dataUtilization',
      aiReadiness:         'ops.calc.dim.aiReadiness'
    };
    var fallback = {
      customerInteraction: 'Interacción con clientes',
      processMaturity:     'Madurez de procesos',
      digitalPresence:     'Presencia digital',
      dataUtilization:     'Uso de datos',
      aiReadiness:         'Preparación IA'
    };
    if (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) {
      var translated = IgneaI18n.t(i18nKeys[key]);
      if (translated && translated !== i18nKeys[key]) return translated;
    }
    return fallback[key] || key;
  }

  function scoreColor(level) {
    var colors = {
      critical:   'var(--coral, #F0997B)',
      developing: 'var(--purple, #AFA9EC)',
      competent:  'var(--accent, #00E5BF)',
      advanced:   'var(--accent, #00E5BF)'
    };
    return colors[level] || 'var(--accent, #00E5BF)';
  }

  function renderScoreSection(scoreResult) {
    var el = document.getElementById('calcScoreSection');
    if (!el) return;

    var color = scoreColor(scoreResult.level);

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
          '<div class="calc-dim-track">' +
            '<div class="calc-dim-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
          '</div>' +
        '</div>';
    });

    var t = function(k) { return (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) ? IgneaI18n.t(k) : ''; };

    el.innerHTML =
      '<div class="calc-card-header">' + (t('ops.calc.card.score') || 'PUNTUACIÓN DEL PROSPECTO') + '</div>' +
      '<div style="text-align:center;margin-bottom:16px">' +
        '<span class="calc-score-big" style="font-size:36px;font-weight:800;color:' + color + '">' +
          scoreResult.total +
        '</span>' +
        '<span class="calc-score-suffix" style="font-size:16px;color:var(--gray,#6E6E88);margin-left:2px">/100</span>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:20px">' +
        '<span class="calc-level-pill" style="display:inline-block;padding:4px 14px;font-size:11px;font-weight:700;' +
          'text-transform:uppercase;letter-spacing:1.5px;border-radius:20px;' +
          'background:' + color + ';color:var(--bg,#08080D)">' +
          escHtml(levelLabel(scoreResult.level)) +
        '</span>' +
      '</div>' +
      '<div class="calc-dims">' + dimsHtml + '</div>';
  }

  function renderSavingsSection(roi) {
    var el = document.getElementById('calcSavingsSection');
    if (!el) return;

    var solutions = [
      {
        name: 'Bot WhatsApp',
        desc: roi.botHoursSaved + ' hrs/semana automatizadas',
        amount: roi.botMonthlySavings
      },
      {
        name: 'Website + Chat',
        desc: 'Presencia digital con captura de leads',
        amount: roi.webMonthlySavings
      },
      {
        name: 'Automatización',
        desc: roi.autoHoursSaved + ' hrs/semana en procesos',
        amount: roi.autoMonthlySavings
      }
    ];

    var rowsHtml = '';
    solutions.forEach(function(sol, i) {
      rowsHtml +=
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;' +
          (i < solutions.length - 1 ? 'border-bottom:0.5px solid var(--border,#1A1A2A);' : '') + '">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:700;color:var(--white,#EAEAF0)">' + escHtml(sol.name) + '</div>' +
            '<div style="font-size:13px;color:var(--gray,#6E6E88);margin-top:2px">' + escHtml(sol.desc) + '</div>' +
          '</div>' +
          '<div style="font-size:14px;font-weight:600;color:var(--white,#EAEAF0);white-space:nowrap;margin-left:16px">' +
            formatMoney(sol.amount) + '/mes' +
          '</div>' +
        '</div>';
    });

    var t = function(k) { return (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) ? IgneaI18n.t(k) : ''; };

    el.innerHTML =
      '<div class="calc-card-header">' + (t('ops.calc.card.savings') || 'AHORRO PARA EL CLIENTE') + '</div>' +
      rowsHtml +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;' +
        'margin-top:4px;border-top:2px solid var(--accent,#00E5BF)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--white,#EAEAF0)">Total Ahorro Mensual</div>' +
        '<div style="font-size:20px;font-weight:800;color:var(--accent,#00E5BF)">' +
          formatMoney(roi.totalMonthlySavings) + '/mes' +
        '</div>' +
      '</div>';
  }

  function renderPricingSection(roi) {
    var el = document.getElementById('calcPricingSection');
    if (!el) return;

    var statRows = [
      {
        label: 'Período de recuperación',
        value: roi.paybackMonths + ' meses',
        color: 'var(--white,#EAEAF0)'
      },
      {
        label: 'ROI a 12 meses',
        value: formatPercent(roi.roi12),
        color: 'var(--accent,#00E5BF)'
      },
      {
        label: 'Cliente conserva',
        value: formatMoney(roi.clientKeeps) + '/mes',
        color: 'var(--white,#EAEAF0)'
      }
    ];

    var statsHtml = '';
    statRows.forEach(function(row, i) {
      statsHtml +=
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;' +
          (i < statRows.length - 1 ? 'border-bottom:0.5px solid var(--border,#1A1A2A);' : '') + '">' +
          '<span style="font-size:13px;color:var(--gray,#6E6E88)">' + escHtml(row.label) + '</span>' +
          '<span style="font-size:14px;font-weight:700;color:' + row.color + '">' + escHtml(row.value) + '</span>' +
        '</div>';
    });

    var t = function(k) { return (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) ? IgneaI18n.t(k) : ''; };

    el.innerHTML =
      '<div class="calc-card-header">' + (t('ops.calc.card.pricing') || 'PRECIO RECOMENDADO') + '</div>' +
      '<div style="text-align:center;margin-bottom:8px">' +
        '<div style="font-size:42px;font-weight:800;color:var(--accent,#00E5BF);line-height:1">' +
          formatMoney(roi.recommendedPrice) +
        '</div>' +
        '<div style="font-family:var(--fm);font-size:12px;color:var(--gray,#6E6E88);margin-top:8px">' +
          formatMoney(roi.totalMonthlySavings) + '/mes &times; 4 meses &times; ' + roi.captureRate + '%' +
        '</div>' +
      '</div>' +
      '<div style="border-top:0.5px solid var(--border,#1A1A2A);margin:16px 0"></div>' +
      statsHtml;
  }

  function renderComparisonBar(roi) {
    var el = document.getElementById('calcComparisonBar');
    if (!el) return;

    var value12m    = roi.totalMonthlySavings * 12;
    var maxVal      = Math.max(roi.recommendedPrice, value12m, 1);
    var investPct   = Math.max(8, Math.round((roi.recommendedPrice / maxVal) * 100));
    var valuePct    = Math.max(8, Math.round((value12m / maxVal) * 100));
    var ratio       = roi.recommendedPrice > 0
      ? ((roi.totalMonthlySavings * 12) / roi.recommendedPrice).toFixed(2)
      : '0.00';

    var t = function(k) { return (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) ? IgneaI18n.t(k) : ''; };

    el.innerHTML =
      '<div class="calc-card-header">' + (t('ops.calc.card.compare') || 'COMPARACIÓN') + '</div>' +
      '<div style="margin-bottom:16px">' +
        '<div style="display:flex;align-items:center;margin-bottom:8px">' +
          '<div style="width:' + investPct + '%;height:28px;background:var(--coral,#F0997B);border-radius:0;' +
            'min-width:60px;transition:width .3s ease"></div>' +
          '<span style="font-size:13px;color:var(--gray,#6E6E88);margin-left:10px;white-space:nowrap">' +
            'Inversión ' + formatMoney(roi.recommendedPrice) +
          '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center">' +
          '<div style="width:' + valuePct + '%;height:28px;background:var(--accent,#00E5BF);border-radius:0;' +
            'min-width:60px;transition:width .3s ease"></div>' +
          '<span style="font-size:13px;color:var(--gray,#6E6E88);margin-left:10px;white-space:nowrap">' +
            'Valor a 12 meses ' + formatMoney(value12m) +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;padding:12px 0;border-top:0.5px solid var(--border,#1A1A2A)">' +
        '<span style="font-size:13px;color:var(--gray,#6E6E88)">Por cada $1 invertido, el cliente recibe </span>' +
        '<span style="font-size:22px;font-weight:800;color:var(--accent,#00E5BF)">$' + ratio + '</span>' +
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
        if (hoursValEl) hoursValEl.innerHTML = answers.q4 + ' <span class="range-val-unit">hrs/semana</span>';
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
      'Ahorro mensual estimado: ' + formatMoney(roi.totalMonthlySavings) + '/mes\n' +
      'ROI a 12 meses: ' + formatPercent(roi.roi12) + '\n' +
      'Período de recuperación: ' + roi.paybackMonths + ' meses\n\n' +
      'Soluciones recomendadas:\n' +
      '1. Bot de WhatsApp — ' + formatMoney(roi.botMonthlySavings) + '/mes ahorro\n' +
      '2. Website + Chat — ' + formatMoney(roi.webMonthlySavings) + '/mes ahorro\n' +
      '3. Automatización — ' + formatMoney(roi.autoMonthlySavings) + '/mes ahorro\n\n' +
      'Precio recomendado: ' + formatMoney(roi.recommendedPrice);

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
      hoursValSpan.innerHTML = hoursRange.value + ' <span class="range-val-unit">hrs/semana</span>';
      hoursRange.addEventListener('input', function() {
        hoursValSpan.innerHTML = hoursRange.value + ' <span class="range-val-unit">hrs/semana</span>';
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
    prefillFromLead: prefillFromLead,
    get _lastResult() { return lastResult ? lastResult.roi : null; }
  };

})();
