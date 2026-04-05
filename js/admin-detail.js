/* ============================================================
   IGNEA LABS — Admin Detail Panel: Overview, Answers, AI tabs
   ============================================================ */

var AdminDetail = (function() {

  var current = null;

  // Question labels (English — admin is internal)
  var QUESTIONS = {
    q1: { num: 1, label: 'How do customers find you?', type: 'cards' },
    q2: { num: 2, label: 'What tasks waste the most time?', type: 'cards+slider' },
    q3: { num: 3, label: 'Customer response time & channel', type: 'card' },
    q4: { num: 4, label: 'Order-to-delivery process', type: 'card' },
    q5: { num: 5, label: 'Manual financial processes', type: 'cards' },
    q6: { num: 6, label: 'Existing systems & tools', type: 'cards' },
    q7: { num: 7, label: 'Decision-making data sources', type: 'card' },
    q8: { num: 8, label: 'Customer loss frequency', type: 'card' },
    q9: { num: 9, label: 'Growth capacity', type: 'card' },
    q10: { num: 10, label: 'Automatable tasks', type: 'cards' },
    q11: { num: 11, label: 'Biggest profitability problem', type: 'text' }
  };

  var DIMS = [
    { key: 'customerFlow', label: 'Customer Flow', max: 25 },
    { key: 'operationsFlow', label: 'Operations Flow', max: 25 },
    { key: 'informationFlow', label: 'Information Flow', max: 25 },
    { key: 'growthFlow', label: 'Growth Flow', max: 25 }
  ];

  function open(item) {
    current = item;
    var panel = document.getElementById('detailPanel');
    var overlay = document.getElementById('detailOverlay');
    if (!panel || !overlay) return;

    renderOverview(item);
    renderAnswers(item);

    // Reset to overview tab
    switchTab('overview');

    // Reset AI output sections
    document.getElementById('reportOutput').innerHTML = '';
    document.getElementById('promptsOutput').innerHTML = '';
    var pdfBtn = document.getElementById('btnDownloadPDF');
    if (pdfBtn) pdfBtn.disabled = !item.consulting_report;

    overlay.classList.add('open');
    panel.classList.add('open');

    bindPanelEvents();
  }

  function close() {
    var panel = document.getElementById('detailPanel');
    var overlay = document.getElementById('detailOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    current = null;
  }

  function getCurrent() {
    return current;
  }

  function switchTab(name) {
    var tabs = document.querySelectorAll('.detail-tab');
    var contents = document.querySelectorAll('.detail-tab-content');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === name);
    }
    for (var j = 0; j < contents.length; j++) {
      contents[j].classList.toggle('active', contents[j].getAttribute('data-tab-content') === name);
    }
  }

  function bindPanelEvents() {
    // Close
    var closeBtn = document.getElementById('detailClose');
    var overlay = document.getElementById('detailOverlay');
    if (closeBtn) closeBtn.onclick = close;
    if (overlay) overlay.onclick = close;

    // Tabs
    var tabs = document.querySelectorAll('.detail-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].onclick = function() {
        switchTab(this.getAttribute('data-tab'));
      };
    }

    // Status change
    var statusSelect = document.getElementById('detailStatus');
    if (statusSelect) {
      statusSelect.onchange = function() {
        if (!current) return;
        var newStatus = this.value;
        IgneaSupabase.client
          .from('diagnostics')
          .update({ status: newStatus })
          .eq('id', current.id)
          .then(function(res) {
            if (!res.error) {
              current.status = newStatus;
              if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.refreshSubmission(current.id, { status: newStatus });
              }
              if (typeof AdminSubmissions !== 'undefined') {
                AdminSubmissions.render();
              }
            }
          });
      };
    }

    // Save notes
    var saveBtn = document.getElementById('saveNotesBtn');
    if (saveBtn) {
      saveBtn.onclick = function() {
        if (!current) return;
        var notes = (document.getElementById('detailNotes') || {}).value || '';
        IgneaSupabase.client
          .from('diagnostics')
          .update({ admin_notes: notes })
          .eq('id', current.id)
          .then(function(res) {
            if (!res.error) {
              current.admin_notes = notes;
              saveBtn.textContent = 'SAVED';
              setTimeout(function() { saveBtn.textContent = 'SAVE'; }, 1500);
            }
          });
      };
    }
  }

  /* ---- OVERVIEW TAB ---- */

  function renderOverview(item) {
    // Title
    var titleEl = document.getElementById('detailTitle');
    if (titleEl) titleEl.textContent = item.company_name || item.contact_name || 'Submission';

    // Score
    var scoreEl = document.getElementById('detailScore');
    if (scoreEl) scoreEl.textContent = item.total_score != null ? item.total_score : '--';

    // Score color
    if (scoreEl) {
      var score = item.total_score || 0;
      if (score <= 25) scoreEl.style.color = 'var(--coral)';
      else if (score <= 50) scoreEl.style.color = '#EF9F27';
      else if (score <= 75) scoreEl.style.color = 'var(--accent)';
      else scoreEl.style.color = '#F07A3A';
    }

    // Level
    var levelEl = document.getElementById('detailLevel');
    if (levelEl) {
      levelEl.textContent = item.level || '--';
      levelEl.className = 'detail-score-level';
      if (item.level) levelEl.classList.add('l-' + item.level);
    }

    // Gauge
    var gaugeEl = document.getElementById('detailGauge');
    if (gaugeEl && typeof createScoreGauge === 'function') {
      gaugeEl.innerHTML = '';
      createScoreGauge(gaugeEl, item.total_score || 0, 100);
    }

    // Dimension bars
    var dimContainer = document.getElementById('detailDimBars');
    if (dimContainer) {
      var scores = item.scores_json || {};
      var html = '';
      for (var i = 0; i < DIMS.length; i++) {
        var dim = DIMS[i];
        var val = scores[dim.key] != null ? scores[dim.key] : 0;
        var pct = Math.round((val / dim.max) * 100);
        html += '<div class="dim-bar">' +
          '<div class="dim-bar-header">' +
            '<span class="dim-bar-name">' + dim.label + '</span>' +
            '<span class="dim-bar-score">' + val + '/' + dim.max + '</span>' +
          '</div>' +
          '<div class="dim-bar-track"><div class="dim-bar-fill" style="width:' + pct + '%"></div></div>' +
          '</div>';
      }
      dimContainer.innerHTML = html;
    }

    // ROI
    var roiContainer = document.getElementById('detailROI');
    if (roiContainer) {
      var roi = item.roi_json || {};
      roiContainer.innerHTML =
        roiStat(roi.weeklyWastedHours, 'hrs/week') +
        roiStat(roi.totalMonthlyCost ? '$' + fmtNum(roi.totalMonthlyCost) : '--', '/month') +
        roiStat(roi.annualCost ? '$' + fmtNum(roi.annualCost) : '--', '/year');
    }

    // Contact
    var contactContainer = document.getElementById('detailContact');
    if (contactContainer) {
      contactContainer.innerHTML =
        contactField('Name', item.contact_name) +
        contactField('Email', item.contact_email, 'mailto:' + item.contact_email) +
        contactField('Phone', item.contact_phone, 'tel:' + item.contact_phone) +
        contactField('Company', item.company_name) +
        contactField('Industry', item.industry) +
        contactField('Size', item.company_size) +
        contactField('Language', (item.language || 'es').toUpperCase()) +
        contactField('Date', item.created_at ? new Date(item.created_at).toLocaleString() : '--');
    }

    // Status
    var statusSelect = document.getElementById('detailStatus');
    if (statusSelect) statusSelect.value = item.status || 'new';

    // Notes
    var notesEl = document.getElementById('detailNotes');
    if (notesEl) notesEl.value = item.admin_notes || '';
  }

  function roiStat(val, label) {
    return '<div style="text-align:center">' +
      '<div style="font-family:var(--fm);font-size:22px;font-weight:700;color:var(--coral)">' + (val != null ? val : '--') + '</div>' +
      '<div style="font-family:var(--fm);font-size:11px;color:var(--dimgray);letter-spacing:1px;text-transform:uppercase;margin-top:4px">' + label + '</div>' +
      '</div>';
  }

  function contactField(label, value, href) {
    var valHtml = value || '--';
    if (href && value) {
      valHtml = '<a href="' + esc(href) + '">' + esc(value) + '</a>';
    } else {
      valHtml = esc(valHtml);
    }
    return '<div class="contact-field">' +
      '<span class="contact-label">' + label + '</span>' +
      '<span class="contact-value">' + valHtml + '</span>' +
      '</div>';
  }

  /* ---- ANSWERS TAB ---- */

  function renderAnswers(item) {
    var container = document.getElementById('detailAnswers');
    if (!container) return;

    var answers = item.answers_json || {};
    var html = '';

    for (var qKey in QUESTIONS) {
      var q = QUESTIONS[qKey];
      html += '<div class="answer-block">';
      html += '<div class="answer-q">Q' + q.num + ' — ' + esc(q.label) + '</div>';

      if (q.type === 'cards' || q.type === 'cards+slider') {
        // Multi-select cards
        var cards = answers[qKey + '_cards'] || [];
        if (cards.length > 0) {
          html += '<div class="answer-chips">';
          for (var c = 0; c < cards.length; c++) {
            html += '<span class="answer-chip selected">' + esc(cards[c]) + '</span>';
          }
          html += '</div>';
        } else {
          html += '<div class="answer-val" style="color:var(--dimgray)">No selection</div>';
        }

        // Slider value for Q2
        if (q.type === 'cards+slider' && answers[qKey + '_slider'] != null) {
          html += '<div style="margin-top:12px"><span class="answer-slider-val">' + answers[qKey + '_slider'] + '</span>' +
            '<span style="font-size:13px;color:var(--dimgray);margin-left:8px">hrs/week wasted</span></div>';
        }
      } else if (q.type === 'card') {
        // Single select
        var val = answers[qKey + '_card'];
        if (val != null) {
          html += '<div class="answer-chips"><span class="answer-chip selected">' + esc(String(val)) + '</span></div>';
        } else {
          html += '<div class="answer-val" style="color:var(--dimgray)">No selection</div>';
        }
      } else if (q.type === 'text') {
        var text = answers[qKey + '_text'] || '';
        if (text) {
          html += '<div class="answer-text">' + esc(text) + '</div>';
        } else {
          html += '<div class="answer-val" style="color:var(--dimgray)">No response</div>';
        }
      }

      // Free text for any question
      if (q.type !== 'text' && answers[qKey + '_text']) {
        html += '<div class="answer-text">' + esc(answers[qKey + '_text']) + '</div>';
      }

      html += '</div>';
    }

    // Industry-specific answers
    var indKeys = Object.keys(answers).filter(function(k) { return k.indexOf('ind_') === 0; });
    if (indKeys.length > 0) {
      html += '<div class="answer-block">';
      html += '<div class="answer-q">INDUSTRY-SPECIFIC ANSWERS</div>';
      for (var ik = 0; ik < indKeys.length; ik++) {
        var key = indKeys[ik];
        var v = answers[key];
        var display = Array.isArray(v) ? v.join(', ') : String(v);
        html += '<div style="margin-bottom:8px"><span style="font-family:var(--fm);font-size:11px;color:var(--dimgray)">' + esc(key) + ':</span> ' +
          '<span class="answer-chip selected">' + esc(display) + '</span></div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /* ---- HELPERS ---- */

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function fmtNum(n) {
    return Number(n).toLocaleString();
  }

  return {
    open: open,
    close: close,
    getCurrent: getCurrent
  };

})();
