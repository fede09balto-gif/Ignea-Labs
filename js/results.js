/* ============================================================
   ONDA AI — Results Page Renderer
   Reads scores from sessionStorage, renders report with
   animated score, radar chart, dimension breakdown,
   recommendations, ROI summary, and PDF download.
   ============================================================ */

(function() {

  document.addEventListener('DOMContentLoaded', function() {
    var raw = sessionStorage.getItem('onda_diagnostic_scores');
    var rawAnswers = sessionStorage.getItem('onda_diagnostic_answers');

    if (!raw || !rawAnswers) {
      // No data — redirect to diagnostic
      window.location.href = 'diagnostic.html';
      return;
    }

    var data = JSON.parse(raw);
    var answerData = JSON.parse(rawAnswers);

    renderHeader(data, answerData.contact);
    renderRadar(data.scores);
    renderBreakdown(data.scores);
    renderRecommendations(data.recommendations, data.roi);
    renderROI(data.roi);
  });

  function t(key) { return OndaI18n.t(key); }

  function renderHeader(data, contact) {
    // Name
    var nameEl = document.getElementById('resName');
    if (nameEl && contact) nameEl.textContent = contact.name;

    // Animated score
    var scoreEl = document.getElementById('scoreNum');
    if (scoreEl) animateNumber(scoreEl, data.total, 1500);

    // Score ring
    var ring = document.getElementById('ringFill');
    if (ring) {
      var circumference = 2 * Math.PI * 70; // r=70
      var offset = circumference - (data.total / 100) * circumference;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = circumference;
      setTimeout(function() {
        ring.style.strokeDashoffset = offset;
      }, 300);
    }

    // Level label + description
    var levelEl = document.getElementById('levelLabel');
    var levelDescEl = document.getElementById('levelDesc');
    if (levelEl) levelEl.textContent = t('res.level.' + data.level);
    if (levelDescEl) levelDescEl.textContent = t('res.level.' + data.level + '.desc');
  }

  function animateNumber(el, target, duration) {
    var start = 0;
    var step = target / (duration / 16);
    function tick() {
      start += step;
      if (start >= target) { el.textContent = Math.round(target); return; }
      el.textContent = Math.round(start);
      requestAnimationFrame(tick);
    }
    setTimeout(tick, 500);
  }

  // ---- RADAR CHART ----
  function renderRadar(scores) {
    var canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var size = 300;
    canvas.width = size;
    canvas.height = size;

    var cx = size / 2, cy = size / 2, r = 110;
    var dims = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
    var angles = dims.map(function(_, i) { return (Math.PI * 2 * i / dims.length) - Math.PI / 2; });

    // Grid rings
    [0.25, 0.5, 0.75, 1].forEach(function(pct) {
      ctx.beginPath();
      for (var i = 0; i <= dims.length; i++) {
        var a = angles[i % dims.length];
        var px = cx + Math.cos(a) * r * pct;
        var py = cy + Math.sin(a) * r * pct;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(26,26,42,0.6)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Axis lines
    angles.forEach(function(a) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = 'rgba(26,26,42,0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Data polygon
    ctx.beginPath();
    dims.forEach(function(dim, i) {
      var val = (scores[dim] || 0) / 20;
      var px = cx + Math.cos(angles[i]) * r * val;
      var py = cy + Math.sin(angles[i]) * r * val;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,229,191,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,191,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Data points
    dims.forEach(function(dim, i) {
      var val = (scores[dim] || 0) / 20;
      var px = cx + Math.cos(angles[i]) * r * val;
      var py = cy + Math.sin(angles[i]) * r * val;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00E5BF';
      ctx.fill();
    });

    // Labels
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#6E6E88';
    ctx.textAlign = 'center';
    var labelR = r + 22;
    dims.forEach(function(dim, i) {
      var px = cx + Math.cos(angles[i]) * labelR;
      var py = cy + Math.sin(angles[i]) * labelR + 4;
      var label = t('res.dim.' + dim);
      // Wrap long labels
      if (label.length > 14) {
        var words = label.split(' ');
        var mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), px, py - 6);
        ctx.fillText(words.slice(mid).join(' '), px, py + 6);
      } else {
        ctx.fillText(label, px, py);
      }
    });
  }

  // ---- DIMENSION BREAKDOWN ----
  function renderBreakdown(scores) {
    var container = document.getElementById('breakdown');
    if (!container) return;
    container.innerHTML = '';

    var dims = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];

    dims.forEach(function(dim) {
      var score = scores[dim] || 0;
      var pct = (score / 20) * 100;
      var row = document.createElement('div');
      row.className = 'bd-row';
      row.innerHTML =
        '<div class="bd-info">' +
          '<div class="bd-name">' + t('res.dim.' + dim) + '</div>' +
          '<div class="bd-score">' + score + ' / 20</div>' +
        '</div>' +
        '<div class="bd-bar"><div class="bd-fill" style="width:0%"></div></div>';
      container.appendChild(row);

      // Animate bar
      setTimeout(function() {
        row.querySelector('.bd-fill').style.width = pct + '%';
      }, 600);
    });
  }

  // ---- RECOMMENDATIONS ----
  function renderRecommendations(recos, roi) {
    var container = document.getElementById('recoCards');
    if (!container) return;
    container.innerHTML = '';

    var savingsEstimates = {
      whatsapp: { min: 800, max: 1200 },
      website: { min: 400, max: 600 },
      automation: { min: 300, max: 500 },
      analytics: { min: 200, max: 400 },
      training: { min: 100, max: 300 }
    };

    recos.forEach(function(reco, i) {
      var est = savingsEstimates[reco.key] || { min: 200, max: 400 };
      var lang = OndaI18n.getLang();
      var savingsLabel = lang === 'es' ? 'Ahorro estimado' : 'Estimated savings';
      var timeLabel = lang === 'es' ? 'Implementación' : 'Implementation';

      var card = document.createElement('div');
      card.className = 'reco-card fade-up';
      card.innerHTML =
        '<div class="reco-num">0' + (i + 1) + '</div>' +
        '<div class="reco-content">' +
          '<div class="reco-title">' + t('res.reco.' + reco.key + '.t') + '</div>' +
          '<div class="reco-desc">' + t('res.reco.' + reco.key + '.d') + '</div>' +
          '<div class="reco-meta">' +
            '<span>' + savingsLabel + ': <strong>$' + est.min + '–' + est.max + '/mes</strong></span>' +
            '<span>' + timeLabel + ': <strong>' + t('res.reco.' + reco.key + '.time') + '</strong></span>' +
          '</div>' +
        '</div>';
      container.appendChild(card);

      setTimeout(function() { card.classList.add('visible'); }, 200 * (i + 1));
    });
  }

  // ---- ROI ----
  function renderROI(roi) {
    var el = document.getElementById('roiGrid');
    if (!el || !roi) return;

    el.innerHTML =
      '<div class="roi-item">' +
        '<div class="roi-val">$' + roi.savingsMin.toLocaleString() + ' – ' + roi.savingsMax.toLocaleString() + '/mes</div>' +
        '<div class="roi-label">' + t('res.roiSavings') + '</div>' +
      '</div>' +
      '<div class="roi-item">' +
        '<div class="roi-val">$' + roi.investMin.toLocaleString() + ' – ' + roi.investMax.toLocaleString() + '</div>' +
        '<div class="roi-label">' + t('res.roiInvestment') + '</div>' +
      '</div>' +
      '<div class="roi-item">' +
        '<div class="roi-val">' + roi.paybackMonths + ' ' + t('res.roiMonths') + '</div>' +
        '<div class="roi-label">' + t('res.roiPayback') + '</div>' +
      '</div>' +
      '<div class="roi-item">' +
        '<div class="roi-val">+' + roi.roi12 + '%</div>' +
        '<div class="roi-label">' + t('res.roi12') + '</div>' +
      '</div>';
  }

  // ---- PDF DOWNLOAD ----
  window.downloadPDF = function() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      // Load jsPDF dynamically
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = generatePDF;
      document.head.appendChild(script);
    } else {
      generatePDF();
    }
  };

  function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();
    var raw = sessionStorage.getItem('onda_diagnostic_scores');
    var rawAnswers = sessionStorage.getItem('onda_diagnostic_answers');
    if (!raw || !rawAnswers) return;

    var data = JSON.parse(raw);
    var answerData = JSON.parse(rawAnswers);
    var lang = OndaI18n.getLang();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 229, 191);
    doc.text('ONDA.AI', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);
    doc.text(lang === 'es' ? 'Reporte de Preparación Digital' : 'Digital Readiness Report', 20, 33);

    // Name + Score
    doc.setFontSize(14);
    doc.setTextColor(234, 234, 240);
    doc.text(answerData.contact.name, 20, 48);

    doc.setFontSize(36);
    doc.setTextColor(0, 229, 191);
    doc.text(data.total + '/100', 20, 68);

    doc.setFontSize(12);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.level.' + data.level), 20, 78);

    // Dimensions
    var y = 95;
    doc.setFontSize(11);
    doc.setTextColor(234, 234, 240);
    doc.text(lang === 'es' ? 'Desglose por Dimensión' : 'Dimension Breakdown', 20, y);
    y += 10;

    var dims = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
    dims.forEach(function(dim) {
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 136);
      doc.text(t('res.dim.' + dim), 20, y);
      doc.setTextColor(0, 229, 191);
      doc.text(data.scores[dim] + '/20', 170, y);
      y += 8;
    });

    // ROI
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(234, 234, 240);
    doc.text(t('res.roiTag').replace('// ', ''), 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 136);
    doc.text(t('res.roiSavings') + ': $' + data.roi.savingsMin + '–' + data.roi.savingsMax + '/mes', 20, y); y += 8;
    doc.text(t('res.roiInvestment') + ': $' + data.roi.investMin + '–' + data.roi.investMax, 20, y); y += 8;
    doc.text(t('res.roiPayback') + ': ' + data.roi.paybackMonths + ' ' + t('res.roiMonths'), 20, y); y += 8;
    doc.text(t('res.roi12') + ': +' + data.roi.roi12 + '%', 20, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(58, 58, 80);
    doc.text('hola@onda.ai — onda.ai', 20, 280);

    doc.save('onda-ai-diagnostic-' + (answerData.contact.name || 'report').replace(/\s+/g, '-').toLowerCase() + '.pdf');
  }

})();
