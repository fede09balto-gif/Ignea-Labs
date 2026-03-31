/* ============================================================
   IGNEA LABS — Results Page Renderer
   Reads scores from sessionStorage, renders premium report.
   NO PRICES. Only time wasted, cost of inaction, and savings.
   ============================================================ */

(function() {

  var scoreData, answerData, contact, answers;

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

    renderHeader();
    renderGauge();
    renderDimensions();
    renderCostOfInaction();
    renderRecommendations();
    renderROI();
    setupCTA();
    setupPDF();
    setupIntersectionAnimations();
  });

  function t(key) { return IgneaI18n.t(key); }
  function lang() { return IgneaI18n.getLang(); }

  function fmt(n) { return Number(n).toLocaleString('es-NI'); }

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
    return [2, 3, 4.5, 6][teamSizeIdx] || 3;
  }

  /* ---- SECTION 1: HEADER ---- */
  function renderHeader() {
    var nameEl = document.getElementById('resName');
    var compEl = document.getElementById('resCompany');
    if (nameEl) {
      var fullName = (contact.first_name || '') + (contact.last_name ? ' ' + contact.last_name : '');
      nameEl.textContent = fullName || t('res.defaultName');
    }
    if (compEl) compEl.textContent = contact.company || '';
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

      var row = document.createElement('div');
      row.className = 'dim-row';
      row.innerHTML =
        '<div class="dim-header">' +
          '<span class="dim-name">' + t('res.stream.' + dim) + '</span>' +
          '<span class="dim-score">' + score + ' / 25</span>' +
        '</div>' +
        '<div class="dim-bar"><div class="dim-fill level-' + dimLevel + '" data-width="' + pct + '"></div></div>';

      container.appendChild(row);
    });
  }

  /* ---- SECTION 4: COST OF INACTION ---- */
  function renderCostOfInaction() {
    var hours = parseInt(answers.q4) || 20;
    var teamSizeIdx = parseInt(answers.q2) || 0;
    var hourlyCost = getHourlyCostByTeamSize(teamSizeIdx);

    var wastedHoursWeek = Math.round(hours * 0.7) + 20;
    var monthlyCost = Math.round(wastedHoursWeek * hourlyCost * 4);
    var annualCost = monthlyCost * 12;

    var hoursEl = document.getElementById('costHours');
    var monthEl = document.getElementById('costMonth');
    var yearEl = document.getElementById('costYear');

    var hrsLabel = lang() === 'es' ? ' hrs/sem' : ' hrs/wk';
    var mesLabel = lang() === 'es' ? '/mes' : '/mo';
    var yearLabel = lang() === 'es' ? '/año' : '/yr';

    if (hoursEl) animateNumber(hoursEl, wastedHoursWeek, 1200, '', hrsLabel);
    if (monthEl) animateNumber(monthEl, monthlyCost, 1200, '$', mesLabel);
    if (yearEl) animateNumber(yearEl, annualCost, 1500, '$', yearLabel);

    // Store for PDF and ROI
    scoreData._wastedHoursWeek = wastedHoursWeek;
    scoreData._monthlyCost = monthlyCost;
    scoreData._annualCost = annualCost;
    scoreData._hourlyCost = hourlyCost;
  }

  /* ---- SECTION 5: RECOMMENDATIONS ---- */
  function renderRecommendations() {
    var container = document.getElementById('recoList');
    if (!container) return;
    container.innerHTML = '';

    var recos = scoreData.recommendations || [];
    if (!recos.length) recos = [{ key: 'automation' }, { key: 'whatsapp' }];

    var hours = parseInt(answers.q4) || 20;
    var timeRecovered = {
      whatsapp: Math.round(hours * 0.7),
      website: '15–25',
      automation: '20',
      analytics: '5–10',
      training: '10–15'
    };

    recos.forEach(function(reco, i) {
      var recovered = timeRecovered[reco.key] || '10–15';
      var hrsLabel = lang() === 'es' ? ' hrs/semana' : ' hrs/week';
      var recoveredStr = (typeof recovered === 'number' ? recovered : recovered) + hrsLabel;

      var card = document.createElement('div');
      card.className = 'reco-card';
      card.innerHTML =
        '<div class="reco-step">0' + (i + 1) + '</div>' +
        '<div class="reco-body">' +
          '<div class="reco-title">' + t('res.reco.' + reco.key + '.t') + '</div>' +
          '<div class="reco-desc">' + t('res.reco.' + reco.key + '.d2') + '</div>' +
          '<div class="reco-meta">' +
            '<div class="reco-meta-item">' +
              '<span class="reco-meta-label" data-i18n="res.reco.timeRecLabel">' + t('res.reco.timeRecLabel') + '</span>' +
              '<span class="reco-meta-val">' + recoveredStr + '</span>' +
            '</div>' +
            '<div class="reco-meta-item">' +
              '<span class="reco-meta-label" data-i18n="res.reco.implLabel">' + t('res.reco.implLabel') + '</span>' +
              '<span class="reco-meta-val">' + t('res.reco.' + reco.key + '.time') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';

      container.appendChild(card);
    });
  }

  /* ---- SECTION 6: ROI ---- */
  function renderROI() {
    var wastedHoursWeek = scoreData._wastedHoursWeek || 40;
    var monthlyCost = scoreData._monthlyCost || 600;

    var hoursMonth = wastedHoursWeek * 4;
    var hoursYear = hoursMonth * 12;
    var valueMonth = monthlyCost;
    var valueYear = monthlyCost * 12;

    var hm = document.getElementById('roiHoursMonth');
    var hy = document.getElementById('roiHoursYear');
    var vm = document.getElementById('roiValueMonth');
    var vy = document.getElementById('roiValueYear');

    var mesLabel = lang() === 'es' ? ' hrs/mes' : ' hrs/mo';
    var yearLabel = lang() === 'es' ? ' hrs/año' : ' hrs/yr';

    if (hm) animateNumber(hm, hoursMonth, 1200, '', mesLabel);
    if (hy) hy.textContent = fmt(hoursYear) + (lang() === 'es' ? ' hrs/año' : ' hrs/yr');
    if (vm) animateNumber(vm, valueMonth, 1200, '$', lang() === 'es' ? '/mes' : '/mo');
    if (vy) vy.textContent = '$' + fmt(valueYear) + (lang() === 'es' ? '/año' : '/yr');
  }

  /* ---- SECTION 7: CTA ---- */
  function setupCTA() {
    var score = scoreData.total || 0;
    var waLink = document.getElementById('ctaWhatsApp');
    if (waLink) {
      var msg = encodeURIComponent(
        'Hola, completé el diagnóstico de Ignea Labs y me gustaría agendar una llamada. Mi puntuación fue ' + score + '/100.'
      );
      waLink.href = 'https://wa.me/50500000000?text=' + msg;
      waLink.setAttribute('target', '_blank');
      waLink.setAttribute('rel', 'noopener');
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
  }

  /* ---- PDF ---- */
  function setupPDF() {
    var btn = document.getElementById('pdfBtn');
    if (btn) btn.addEventListener('click', generatePDF);
  }

  function generatePDF() {
    var jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDF) return;

    var doc = new jsPDF();
    var y = 20;
    var score = scoreData.total || 0;
    var level = scoreData.level || 'developing';
    var scores = scoreData.scores || {};
    var fullName = (contact.first_name || '') + (contact.last_name ? ' ' + contact.last_name : '');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 229, 191);
    doc.text('IGNEA.LABS', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);
    doc.text(lang() === 'es' ? 'Reporte de Preparación Digital' : 'Digital Readiness Report', 20, y);
    y += 16;

    // Client info
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text(fullName, 20, y);
    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 136);
    doc.text(contact.company || '', 20, y);
    y += 14;

    // Score
    doc.setFontSize(40);
    doc.setTextColor(0, 229, 191);
    doc.text(score + '/100', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.level.' + level), 20, y);
    y += 16;

    // Dimensions
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(t('res.dimTag').replace('// ', ''), 20, y);
    y += 10;

    var dims = ['customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow'];
    dims.forEach(function(dim) {
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 136);
      doc.text(t('res.stream.' + dim), 20, y);
      doc.setTextColor(0, 229, 191);
      doc.text((scores[dim] || 0) + '/25', 170, y);
      y += 8;
    });
    y += 10;

    // Cost of inaction
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(t('res.costTag').replace('// ', ''), 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);

    var wastedLabel = lang() === 'es' ? 'Tiempo perdido: ' : 'Time wasted: ';
    var monthLabel = lang() === 'es' ? 'Costo mensual: ' : 'Monthly cost: ';
    var yearLabel = lang() === 'es' ? 'Costo anual: ' : 'Annual cost: ';

    doc.text(wastedLabel + (scoreData._wastedHoursWeek || 0) + ' hrs/' + (lang() === 'es' ? 'semana' : 'week'), 20, y);
    y += 7;
    doc.text(monthLabel + '$' + fmt(scoreData._monthlyCost || 0) + '/' + (lang() === 'es' ? 'mes' : 'mo'), 20, y);
    y += 7;
    doc.text(yearLabel + '$' + fmt(scoreData._annualCost || 0) + '/' + (lang() === 'es' ? 'año' : 'yr'), 20, y);
    y += 14;

    // Recommendations
    var recos = scoreData.recommendations || [];
    if (recos.length) {
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(t('res.recoTag').replace('// ', ''), 20, y);
      y += 10;
      recos.forEach(function(r, i) {
        doc.setFontSize(10);
        doc.setTextColor(0, 229, 191);
        doc.text('0' + (i + 1) + '. ' + t('res.reco.' + r.key + '.t'), 20, y);
        y += 6;
        doc.setTextColor(110, 110, 136);
        var desc = t('res.reco.' + r.key + '.d2');
        var lines = doc.splitTextToSize(desc, 160);
        doc.text(lines, 24, y);
        y += lines.length * 5 + 6;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 136);
    doc.text('hola@ignealabs.com — ignealabs.com', 20, 282);

    var pdfName = (contact.first_name || 'reporte');
    doc.save('ignea-labs-diagnostico-' + pdfName.replace(/\s+/g, '-').toLowerCase() + '.pdf');
  }

  /* ---- RE-RENDER ON LANGUAGE CHANGE ---- */
  document.addEventListener('langchange', function() {
    if (!scoreData) return;
    renderHeader();
    renderGauge();
    renderDimensions();
    renderCostOfInaction();
    renderRecommendations();
    renderROI();
    setupCTA();
    setupIntersectionAnimations();
  });

})();
