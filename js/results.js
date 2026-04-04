/* ============================================================
   IGNEA LABS — Operational Health Report Renderer
   Reads scores from sessionStorage, renders professional report
   with painpoints, industry-specific solutions, and savings.
   ============================================================ */

(function() {

  var scoreData, answerData, contact, answers;
  var top3Data = [];

  /* ---- SOLUTIONS DATA (industry-specific) ---- */
  var SOLUTIONS = {
    customerFlow: {
      generic: { nameKey: 'res.sol.customer.name', descKey: 'res.sol.customer.desc', time: '2-3', savingsPct: 0.35 },
      restaurant: { nameKey: 'res.sol.customer.restaurant.name', descKey: 'res.sol.customer.restaurant.desc', time: '2-3', savingsPct: 0.35 },
      medical: { nameKey: 'res.sol.customer.medical.name', descKey: 'res.sol.customer.medical.desc', time: '3-4', savingsPct: 0.30 },
      legal: { nameKey: 'res.sol.customer.legal.name', descKey: 'res.sol.customer.legal.desc', time: '2-3', savingsPct: 0.30 },
      logistics: { nameKey: 'res.sol.customer.logistics.name', descKey: 'res.sol.customer.logistics.desc', time: '2-3', savingsPct: 0.30 },
      construction: { nameKey: 'res.sol.customer.construction.name', descKey: 'res.sol.customer.construction.desc', time: '3-4', savingsPct: 0.25 },
      retail: { nameKey: 'res.sol.customer.retail.name', descKey: 'res.sol.customer.retail.desc', time: '2-3', savingsPct: 0.35 }
    },
    operationsFlow: {
      generic: { nameKey: 'res.sol.operations.name', descKey: 'res.sol.operations.desc', time: '3-5', savingsPct: 0.40 },
      restaurant: { nameKey: 'res.sol.operations.restaurant.name', descKey: 'res.sol.operations.restaurant.desc', time: '3-4', savingsPct: 0.40 },
      medical: { nameKey: 'res.sol.operations.medical.name', descKey: 'res.sol.operations.medical.desc', time: '4-6', savingsPct: 0.35 },
      legal: { nameKey: 'res.sol.operations.legal.name', descKey: 'res.sol.operations.legal.desc', time: '3-5', savingsPct: 0.35 },
      logistics: { nameKey: 'res.sol.operations.logistics.name', descKey: 'res.sol.operations.logistics.desc', time: '4-6', savingsPct: 0.40 },
      construction: { nameKey: 'res.sol.operations.construction.name', descKey: 'res.sol.operations.construction.desc', time: '4-6', savingsPct: 0.35 },
      retail: { nameKey: 'res.sol.operations.retail.name', descKey: 'res.sol.operations.retail.desc', time: '3-5', savingsPct: 0.40 }
    },
    informationFlow: {
      generic: { nameKey: 'res.sol.information.name', descKey: 'res.sol.information.desc', time: '2-3', savingsPct: 0.25 },
      restaurant: { nameKey: 'res.sol.information.restaurant.name', descKey: 'res.sol.information.restaurant.desc', time: '2-3', savingsPct: 0.25 },
      medical: { nameKey: 'res.sol.information.medical.name', descKey: 'res.sol.information.medical.desc', time: '3-4', savingsPct: 0.25 },
      legal: { nameKey: 'res.sol.information.legal.name', descKey: 'res.sol.information.legal.desc', time: '2-3', savingsPct: 0.25 },
      logistics: { nameKey: 'res.sol.information.logistics.name', descKey: 'res.sol.information.logistics.desc', time: '2-3', savingsPct: 0.25 },
      construction: { nameKey: 'res.sol.information.construction.name', descKey: 'res.sol.information.construction.desc', time: '3-4', savingsPct: 0.25 },
      retail: { nameKey: 'res.sol.information.retail.name', descKey: 'res.sol.information.retail.desc', time: '2-3', savingsPct: 0.25 }
    },
    growthFlow: {
      generic: { nameKey: 'res.sol.growth.name', descKey: 'res.sol.growth.desc', time: '4-6', savingsPct: 0.20 },
      restaurant: { nameKey: 'res.sol.growth.restaurant.name', descKey: 'res.sol.growth.restaurant.desc', time: '4-6', savingsPct: 0.20 },
      medical: { nameKey: 'res.sol.growth.medical.name', descKey: 'res.sol.growth.medical.desc', time: '4-6', savingsPct: 0.20 },
      legal: { nameKey: 'res.sol.growth.legal.name', descKey: 'res.sol.growth.legal.desc', time: '4-6', savingsPct: 0.20 },
      logistics: { nameKey: 'res.sol.growth.logistics.name', descKey: 'res.sol.growth.logistics.desc', time: '4-6', savingsPct: 0.20 },
      construction: { nameKey: 'res.sol.growth.construction.name', descKey: 'res.sol.growth.construction.desc', time: '5-8', savingsPct: 0.20 },
      retail: { nameKey: 'res.sol.growth.retail.name', descKey: 'res.sol.growth.retail.desc', time: '4-6', savingsPct: 0.20 }
    }
  };

  /* ---- INIT ---- */
  document.addEventListener('DOMContentLoaded', function() {
    var raw = sessionStorage.getItem('ignea_diagnostic_scores');
    var rawAnswers = sessionStorage.getItem('ignea_diagnostic_answers');

    if (!raw || !rawAnswers) {
      window.location.href = 'diagnostic.html';
      return;
    }

    scoreData = JSON.parse(raw);
    answerData = JSON.parse(rawAnswers);
    contact = answerData.contact || {};
    answers = answerData.answers || {};

    // Loading state orchestration
    var msg1 = document.getElementById('loadMsg1');
    var msg2 = document.getElementById('loadMsg2');
    if (msg1) setTimeout(function() { msg1.style.opacity = '1'; }, 200);
    if (msg2) setTimeout(function() { msg2.style.opacity = '1'; }, 1200);

    setTimeout(function() {
      var loader = document.getElementById('resLoading');
      var page = document.getElementById('resPage');
      if (loader) loader.style.display = 'none';
      if (page) page.style.display = '';

      renderReportHeader();
      renderGauge();
      renderDimensions();
      renderCostOfInaction();
      renderPainpoints();
      renderSolutions();
      renderSavings();
      setupCTA();
      setupPDF();
      setupIntersectionAnimations();

      // Track results viewed
      if (typeof IgneaAnalytics !== 'undefined' && scoreData) {
        IgneaAnalytics.track('results_viewed', { score: scoreData.total, level: scoreData.level });
      }

      // Poll for AI analysis if we have a diagnostic ID
      var diagId = sessionStorage.getItem('ignea_diagnostic_id');
      if (diagId && typeof IgneaSupabase !== 'undefined' && IgneaSupabase.client) {
        pollForAIAnalysis(diagId, 0);
      }
    }, 2500);
  });

  /* ---- AI INSIGHTS POLLING ---- */

  function pollForAIAnalysis(id, attempt) {
    if (attempt > 10) return; // give up after ~30s

    IgneaSupabase.client.from('diagnostics')
      .select('ai_analysis')
      .eq('id', id)
      .single()
      .then(function(res) {
        if (res.data && res.data.ai_analysis && !res.data.ai_analysis.parse_error) {
          renderAIInsights(res.data.ai_analysis);
        } else {
          setTimeout(function() { pollForAIAnalysis(id, attempt + 1); }, 3000);
        }
      });
  }

  function renderAIInsights(ai) {
    var section = document.getElementById('resAIInsights');
    var container = document.getElementById('aiInsightsContent');
    if (!section || !container) return;

    var isEN = lang() === 'en';
    var html = '';

    // Executive Summary
    var summary = isEN ? ai.executive_summary_en : ai.executive_summary_es;
    if (summary) {
      html += '<div style="background:var(--bg2);border:0.5px solid var(--border);padding:20px;margin-bottom:16px">'
        + '<p style="font-family:var(--fm);font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">'
        + t('res.ai.summary') + '</p>'
        + '<p style="font-size:15px;color:var(--white);line-height:1.7">' + summary + '</p>'
        + '</div>';
    }

    // Top Opportunities
    if (ai.top_opportunities && ai.top_opportunities.length) {
      html += '<p style="font-family:var(--fm);font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px">'
        + t('res.ai.opportunities') + '</p>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">';
      for (var i = 0; i < ai.top_opportunities.length; i++) {
        var opp = ai.top_opportunities[i];
        var impact = isEN ? opp.impact_en : opp.impact_es;
        html += '<div style="background:var(--bg2);border:0.5px solid var(--border);padding:16px">'
          + '<p style="font-family:var(--fm);font-size:12px;color:var(--white);font-weight:600;margin-bottom:6px">' + opp.area + '</p>'
          + '<p style="font-size:13px;color:var(--gray);line-height:1.6;margin-bottom:8px">' + impact + '</p>'
          + (opp.estimated_savings ? '<p style="font-family:var(--fm);font-size:14px;color:var(--accent);font-weight:600">$' + Number(opp.estimated_savings).toLocaleString('en-US') + '/mo</p>' : '')
          + '</div>';
      }
      html += '</div>';
    }

    // Quick Wins
    if (ai.quick_wins && ai.quick_wins.length) {
      html += '<p style="font-family:var(--fm);font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px">'
        + t('res.ai.quickWins') + '</p>';
      html += '<ul style="list-style:none;padding:0;margin:0">';
      for (var j = 0; j < ai.quick_wins.length; j++) {
        html += '<li style="background:var(--bg2);border:0.5px solid var(--border);padding:12px 16px;margin-bottom:8px;font-size:14px;color:var(--white);line-height:1.5">'
          + '<span style="color:var(--accent);margin-right:8px;font-family:var(--fm)">&#10003;</span>'
          + ai.quick_wins[j]
          + '</li>';
      }
      html += '</ul>';
    }

    // Risk Assessment
    var risk = isEN ? ai.risk_assessment_en : ai.risk_assessment_es;
    if (risk) {
      html += '<div style="background:var(--bg2);border:0.5px solid rgba(240,153,123,0.3);padding:16px;margin-top:16px">'
        + '<p style="font-family:var(--fm);font-size:11px;color:var(--coral);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">'
        + t('res.ai.risk') + '</p>'
        + '<p style="font-size:14px;color:var(--gray);line-height:1.6">' + risk + '</p>'
        + '</div>';
    }

    container.innerHTML = html;
    section.style.display = '';
    section.style.opacity = '0';
    section.style.transition = 'opacity 0.6s ease';
    setTimeout(function() { section.style.opacity = '1'; }, 50);
  }

  /* ---- HELPERS ---- */
  function t(key) { return IgneaI18n.t(key); }
  function lang() { return IgneaI18n.getLang(); }

  function fmt(n) { return Number(n).toLocaleString('es-PR'); }

  function animateNumber(el, target, duration, prefix, suffix) {
    prefix = prefix || '';
    suffix = suffix || '';
    var start = 0;
    var startTime = null;
    function tick(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = prefix + fmt(current) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    setTimeout(function() { requestAnimationFrame(tick); }, 400);
  }

  /* ---- HOURLY COST BY TEAM SIZE (NOT revenue) ---- */
  function getHourlyCostByTeamSize(teamSizeIdx) {
    return [12, 18, 25, 35][teamSizeIdx] || 18;
  }

  /* ---- SECTION 1: REPORT HEADER ---- */
  function renderReportHeader() {
    var titleEl = document.getElementById('resReportTitle');
    var compEl = document.getElementById('resCompany');
    var dateEl = document.getElementById('resDate');
    var nameEl = document.getElementById('resName');
    if (titleEl) titleEl.textContent = t('res.reportTitle');
    if (compEl) compEl.textContent = contact.company || '';
    if (nameEl) {
      var fullName = (contact.first_name || '') + (contact.last_name ? ' ' + contact.last_name : '');
      nameEl.textContent = fullName || t('res.defaultName');
    }
    if (dateEl) {
      var now = new Date();
      var options = { year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = t('res.reportDate') + ' ' + now.toLocaleDateString(lang() === 'es' ? 'es-PR' : 'en-US', options);
    }
  }

  /* ---- SECTION 2: SCORE GAUGE ---- */
  function renderGauge() {
    var container = document.getElementById('gaugeCanvas');
    if (!container) return;

    var score = scoreData.total || 0;
    var level = scoreData.level || 'developing';

    var colors;
    if (score <= 25) colors = ['#F0997B', '#E85D30'];
    else if (score <= 50) colors = ['#EF9F27', '#F0997B'];
    else if (score <= 75) colors = ['#5DCAA5', '#00E5BF'];
    else colors = ['#00E5BF', '#00B89A'];

    var radius = 45;
    var circumference = 2 * Math.PI * radius;
    var halfCirc = circumference / 2;
    var scorePercent = Math.min(score / 100, 1);
    var targetOffset = -scorePercent * halfCirc;

    var gradId = 'gauge-grad';

    var svg = '<svg viewBox="0 0 100 55" style="display:block;width:100%;max-width:280px;margin:0 auto;">';
    svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="0">';
    svg += '<stop offset="0%" stop-color="' + colors[0] + '"/>';
    svg += '<stop offset="100%" stop-color="' + colors[1] + '"/>';
    svg += '</linearGradient></defs>';
    svg += '<g fill="none" stroke-width="7" transform="translate(50,50)">';
    svg += '<circle r="' + radius + '" stroke="#1A1A2A" stroke-dasharray="' + halfCirc + ' ' + halfCirc + '"/>';
    svg += '<circle r="' + radius + '" stroke="url(#' + gradId + ')" stroke-dasharray="' + halfCirc + ' ' + halfCirc + '" stroke-dashoffset="0" stroke-linecap="round" id="gaugeFill" style="transition:stroke-dashoffset 1.4s cubic-bezier(0.65,0,0.35,1) 0.5s;"/>';
    svg += '</g></svg>';

    container.innerHTML = svg;

    // Animate gauge fill
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var fill = document.getElementById('gaugeFill');
        if (fill) fill.style.strokeDashoffset = targetOffset;
      });
    });

    // Animate score number
    var scoreEl = document.getElementById('scoreNum');
    if (scoreEl) {
      scoreEl.style.color = colors[1];
      animateNumber(scoreEl, score, 1500, '', '');
    }

    // Level badge
    var badgeEl = document.getElementById('levelBadge');
    if (badgeEl) {
      badgeEl.className = 'level-badge level-' + level;
      badgeEl.textContent = t('res.level.' + level);
    }

    // Level description
    var descEl = document.getElementById('levelDesc');
    if (descEl) descEl.textContent = t('res.level.' + level + '.desc');
  }

  /* ---- SECTION 3: DIMENSIONS ---- */
  function renderDimensions() {
    var container = document.getElementById('dimList');
    if (!container) return;
    container.innerHTML = '';

    var dims = ['customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow'];
    var scores = scoreData.scores || scoreData.streams || {};

    dims.forEach(function(dim) {
      var score = scores[dim] || 0;
      var pct = Math.round((score / 25) * 100);

      var dimLevel;
      if (score <= 6) dimLevel = 'critical';
      else if (score <= 12) dimLevel = 'developing';
      else if (score <= 18) dimLevel = 'competent';
      else dimLevel = 'advanced';

      var insightKey = score < 12 ? 'res.stream.' + dim + '.low' : 'res.stream.' + dim + '.high';

      var row = document.createElement('div');
      row.className = 'dim-row';
      row.innerHTML =
        '<div class="dim-header">' +
          '<span class="dim-name">' + t('res.stream.' + dim) + '</span>' +
          '<span class="dim-score">' + score + ' / 25</span>' +
        '</div>' +
        '<div class="dim-bar"><div class="dim-fill level-' + dimLevel + '" data-width="' + pct + '"></div></div>' +
        '<div class="dim-insight">' + t(insightKey) + '</div>';

      container.appendChild(row);
    });
  }

  /* ---- SECTION 4: COST OF INACTION ---- */
  function renderCostOfInaction() {
    var roi = scoreData.roi || {};
    var wastedHoursWeek = roi.weeklyWastedHours || (answers.q2_slider || 20);
    var hourlyCost = roi.hourlyCost || getHourlyCostByTeamSize(0);
    var monthlyCost = roi.totalMonthlyCost || Math.round(wastedHoursWeek * hourlyCost * 4);
    var annualCost = roi.annualCost || (monthlyCost * 12);

    var hoursEl = document.getElementById('costHours');
    var monthEl = document.getElementById('costMonth');
    var yearEl = document.getElementById('costYear');

    var hrsLabel = lang() === 'es' ? ' hrs/sem' : ' hrs/wk';
    var mesLabel = lang() === 'es' ? '/mes' : '/mo';
    var yearLabel = lang() === 'es' ? '/año' : '/yr';

    if (hoursEl) animateNumber(hoursEl, wastedHoursWeek, 1200, '', hrsLabel);
    if (monthEl) animateNumber(monthEl, monthlyCost, 1200, '$', mesLabel);
    if (yearEl) animateNumber(yearEl, annualCost, 1500, '$', yearLabel);

    // Store for PDF and other sections
    scoreData._wastedHoursWeek = wastedHoursWeek;
    scoreData._monthlyCost = monthlyCost;
    scoreData._annualCost = annualCost;
    scoreData._hourlyCost = hourlyCost;
  }

  /* ---- SECTION 5: PAINPOINTS ---- */
  function renderPainpoints() {
    var container = document.getElementById('painpointList');
    if (!container) return;
    container.innerHTML = '';

    var streams = scoreData.scores || scoreData.streams || {};
    var monthlyCost = scoreData._monthlyCost || 1000;

    var streamList = ['customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow'];
    var ranked = streamList.map(function(stream) {
      var score = streams[stream] || 0;
      var gap = 25 - score;
      var cost = Math.round((gap / 25) * monthlyCost * 0.25 * (1 + gap / 25));
      return { stream: stream, score: score, gap: gap, cost: cost };
    }).sort(function(a, b) { return b.cost - a.cost; });

    top3Data = ranked.slice(0, 3);

    top3Data.forEach(function(item, i) {
      var card = document.createElement('div');
      card.className = 'pain-card';
      card.innerHTML =
        '<div class="pain-rank">0' + (i + 1) + '</div>' +
        '<div class="pain-body">' +
          '<div class="pain-name">' + t('res.stream.' + item.stream) + '</div>' +
          '<div class="pain-cost">$' + fmt(item.cost) + '<span class="pain-unit">' + t('res.pain.perMonth') + '</span></div>' +
          '<div class="pain-desc">' + t('res.pain.' + item.stream) + '</div>' +
        '</div>';
      container.appendChild(card);
    });
  }

  /* ---- SECTION 6: SOLUTIONS ---- */
  function renderSolutions() {
    var container = document.getElementById('solutionList');
    if (!container) return;
    container.innerHTML = '';

    var industry = (contact.industry || '').toLowerCase();

    top3Data.forEach(function(item, i) {
      var streamSols = SOLUTIONS[item.stream] || {};
      var sol = streamSols[industry] || streamSols.generic;
      if (!sol) return;

      var projectedSavings = Math.round(item.cost * sol.savingsPct * (1 / 0.25));
      item.projectedSavings = projectedSavings;
      item.solution = sol;

      var card = document.createElement('div');
      card.className = 'sol-card';
      card.innerHTML =
        '<div class="sol-step">0' + (i + 1) + '</div>' +
        '<div class="sol-body">' +
          '<div class="sol-title">' + t(sol.nameKey) + '</div>' +
          '<div class="sol-desc">' + t(sol.descKey) + '</div>' +
          '<div class="sol-meta">' +
            '<div class="sol-meta-item">' +
              '<span class="sol-meta-label">' + t('res.sol.implTime') + '</span>' +
              '<span class="sol-meta-val">' + sol.time + ' ' + t('res.sol.weeks') + '</span>' +
            '</div>' +
            '<div class="sol-meta-item">' +
              '<span class="sol-meta-label">' + t('res.sol.projSavings') + '</span>' +
              '<span class="sol-meta-val">$' + fmt(projectedSavings) + (lang() === 'es' ? '/mes' : '/mo') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      container.appendChild(card);
    });
  }

  /* ---- SECTION 7: SAVINGS PROJECTION ---- */
  function renderSavings() {
    var totalMonthly = 0;
    top3Data.forEach(function(item) {
      totalMonthly += (item.projectedSavings || 0);
    });
    var totalAnnual = totalMonthly * 12;

    // Break-even calculation
    var implCost;
    if (totalMonthly < 2000) implCost = 3500;
    else if (totalMonthly < 5000) implCost = 8000;
    else implCost = 15000;

    var breakeven = totalMonthly > 0 ? Math.round(implCost / totalMonthly * 10) / 10 : 0;

    var monthEl = document.getElementById('savingsMonth');
    var yearEl = document.getElementById('savingsYear');
    var beEl = document.getElementById('savingsBreakeven');

    var mesLabel = lang() === 'es' ? '/mes' : '/mo';
    var yearLabel = lang() === 'es' ? '/año' : '/yr';

    if (monthEl) animateNumber(monthEl, totalMonthly, 1200, '$', mesLabel);
    if (yearEl) animateNumber(yearEl, totalAnnual, 1500, '$', yearLabel);
    if (beEl) {
      setTimeout(function() {
        beEl.textContent = breakeven + ' ' + t('res.savings.breakevenUnit');
      }, 600);
    }

    // Store for PDF
    scoreData._totalMonthlySavings = totalMonthly;
    scoreData._totalAnnualSavings = totalAnnual;
    scoreData._implCost = implCost;
    scoreData._breakeven = breakeven;
  }

  /* ---- SECTION 8: CTA ---- */
  function setupCTA() {
    var score = scoreData.total || 0;
    var waLink = document.getElementById('ctaWhatsApp');
    var calLink = document.getElementById('ctaCalendly');
    if (waLink) {
      var msg = encodeURIComponent(
        lang() === 'es'
          ? 'Hola, completé el diagnóstico de Ignea Labs. Mi puntuación fue ' + score + '/100. Me gustaría agendar una llamada estratégica.'
          : 'Hi, I completed the Ignea Labs diagnostic. My score was ' + score + '/100. I\'d like to book a strategy call.'
      );
      waLink.href = 'https://wa.me/1787XXXXXXX?text=' + msg;
      waLink.setAttribute('target', '_blank');
      waLink.setAttribute('rel', 'noopener');
      waLink.addEventListener('click', function() {
        if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('results_cta_whatsapp');
      });
    }
    if (calLink) {
      calLink.addEventListener('click', function() {
        if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('results_cta_calendly');
      });
    }
  }

  /* ---- INTERSECTION OBSERVER FOR ANIMATIONS ---- */
  function setupIntersectionAnimations() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Animate dimension bars
          var bars = entry.target.querySelectorAll('.dim-fill');
          bars.forEach(function(bar, i) {
            setTimeout(function() {
              bar.style.width = bar.getAttribute('data-width') + '%';
            }, i * 150);
          });

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    var dimList = document.getElementById('dimList');
    if (dimList) observer.observe(dimList);

    var painList = document.getElementById('painpointList');
    if (painList) observer.observe(painList);

    var solList = document.getElementById('solutionList');
    if (solList) observer.observe(solList);
  }

  /* ---- PDF ---- */
  function setupPDF() {
    var btn = document.getElementById('pdfBtn');
    if (btn) btn.addEventListener('click', function() {
      if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('results_pdf_downloaded');
      generatePDF();
    });
  }

  function generatePDF() {
    var jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDF) return;

    var doc = new jsPDF();
    var y = 20;
    var score = scoreData.total || 0;
    var level = scoreData.level || 'developing';
    var scores = scoreData.scores || scoreData.streams || {};
    var fullName = (contact.first_name || '') + (contact.last_name ? ' ' + contact.last_name : '');
    var isES = lang() === 'es';

    /* ---- PAGE 1: HEADER + SCORE + DIMENSIONS ---- */

    // Brand
    doc.setFontSize(20);
    doc.setTextColor(0, 229, 191);
    doc.text('IGNEA.LABS', 20, y);
    y += 8;

    // Report title
    doc.setFontSize(14);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.reportTitle'), 20, y);
    y += 10;

    // Client info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text((contact.company || '') + (fullName ? ' — ' + fullName : ''), 20, y);
    y += 6;

    // Date
    var now = new Date();
    var dateStr = now.toLocaleDateString(isES ? 'es-PR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.reportDate') + ' ' + dateStr, 20, y);
    y += 4;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 12;

    // Score
    doc.setFontSize(36);
    doc.setTextColor(0, 229, 191);
    doc.text(score + '/100', 20, y);
    doc.setFontSize(12);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.level.' + level), 80, y);
    y += 14;

    // Dimensions
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(isES ? 'Desglose por Dimensión' : 'Dimension Breakdown', 20, y);
    y += 8;

    var dims = ['customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow'];
    dims.forEach(function(dim) {
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 136);
      doc.text(t('res.stream.' + dim), 24, y);
      var dimScore = scores[dim] || 0;
      doc.setTextColor(0, 229, 191);
      doc.text(dimScore + '/25', 170, y);
      // Draw bar
      var barWidth = 80;
      var barX = 80;
      doc.setDrawColor(220, 220, 220);
      doc.rect(barX, y - 3, barWidth, 3);
      doc.setFillColor(0, 229, 191);
      doc.rect(barX, y - 3, barWidth * (dimScore / 25), 3, 'F');
      y += 8;
    });
    y += 6;

    // Cost of inaction
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(isES ? 'Costo de No Actuar' : 'Cost of Inaction', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);
    doc.text((isES ? 'Tiempo perdido: ' : 'Time wasted: ') + (scoreData._wastedHoursWeek || 0) + ' hrs/' + (isES ? 'semana' : 'week'), 24, y);
    y += 6;
    doc.text((isES ? 'Costo mensual: $' : 'Monthly cost: $') + fmt(scoreData._monthlyCost || 0), 24, y);
    y += 6;
    doc.text((isES ? 'Costo anual: $' : 'Annual cost: $') + fmt(scoreData._annualCost || 0), 24, y);
    y += 12;

    // Top 3 Painpoints
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(isES ? 'Puntos de Mayor Impacto Financiero' : 'Highest Financial Impact Areas', 20, y);
    y += 8;

    top3Data.forEach(function(item, i) {
      doc.setFontSize(10);
      doc.setTextColor(0, 229, 191);
      doc.text('0' + (i + 1) + '. ' + t('res.stream.' + item.stream), 24, y);
      doc.setTextColor(240, 153, 123);
      doc.text('$' + fmt(item.cost) + (isES ? '/mes' : '/mo'), 140, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 136);
      var descLines = doc.splitTextToSize(t('res.pain.' + item.stream), 155);
      doc.text(descLines, 28, y);
      y += descLines.length * 4 + 4;
    });
    y += 4;

    // Solutions
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(isES ? 'Soluciones Recomendadas' : 'Recommended Solutions', 20, y);
    y += 8;

    top3Data.forEach(function(item, i) {
      if (y > 250) { doc.addPage(); y = 20; }
      var sol = item.solution;
      if (!sol) return;
      doc.setFontSize(10);
      doc.setTextColor(0, 229, 191);
      doc.text('0' + (i + 1) + '. ' + t(sol.nameKey), 24, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 136);
      var solLines = doc.splitTextToSize(t(sol.descKey), 155);
      doc.text(solLines, 28, y);
      y += solLines.length * 4 + 2;
      doc.text((isES ? 'Implementación: ' : 'Implementation: ') + sol.time + ' ' + t('res.sol.weeks'), 28, y);
      doc.text((isES ? 'Ahorro proyectado: $' : 'Projected savings: $') + fmt(item.projectedSavings || 0) + (isES ? '/mes' : '/mo'), 100, y);
      y += 8;
    });
    y += 4;

    // Savings summary
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(isES ? 'Proyección de Ahorro' : 'Savings Projection', 20, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 229, 191);
    doc.text((isES ? 'Ahorro mensual: $' : 'Monthly savings: $') + fmt(scoreData._totalMonthlySavings || 0), 24, y);
    y += 8;
    doc.text((isES ? 'Ahorro anual: $' : 'Annual savings: $') + fmt(scoreData._totalAnnualSavings || 0), 24, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(110, 110, 136);
    doc.text((isES ? 'Retorno de inversión: ' : 'ROI: ') + (scoreData._breakeven || 0) + ' ' + t('res.savings.breakevenUnit'), 24, y);
    y += 14;

    // Footer on every page
    var pageCount = doc.internal.getNumberOfPages();
    for (var p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('IGNEA.LABS — hola@ignealabs.com — ignealabs.com — San Juan, Puerto Rico', 20, 285);
    }

    var pdfName = (contact.company || contact.first_name || 'reporte').replace(/\s+/g, '-').toLowerCase();
    doc.save('ignea-labs-reporte-' + pdfName + '.pdf');
  }

  /* ---- RE-RENDER ON LANGUAGE CHANGE ---- */
  document.addEventListener('langchange', function() {
    if (!scoreData) return;
    renderReportHeader();
    renderGauge();
    renderDimensions();
    renderCostOfInaction();
    renderPainpoints();
    renderSolutions();
    renderSavings();
    setupCTA();
    setupIntersectionAnimations();

    // Re-render AI insights if available
    var diagId = sessionStorage.getItem('ignea_diagnostic_id');
    if (diagId && typeof IgneaSupabase !== 'undefined' && IgneaSupabase.client) {
      IgneaSupabase.client.from('diagnostics')
        .select('ai_analysis')
        .eq('id', diagId)
        .single()
        .then(function(res) {
          if (res.data && res.data.ai_analysis && !res.data.ai_analysis.parse_error) {
            renderAIInsights(res.data.ai_analysis);
          }
        });
    }
  });

})();
