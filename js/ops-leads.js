/* ============================================================
   IGNEA LABS — Ops Leads Module
   Lead table with filters, detail panel, inline editing.
   ============================================================ */

var OpsLeads = (function() {

  var currentDetailId = null;
  var debounceTimer = null;
  var currentSort = { col: 'created_at', asc: false };

  var STAGE_I18N_MAP = {
    'new':               'ops.stage.new',
    'contacted':         'ops.stage.contacted',
    'meeting_scheduled': 'ops.stage.meeting',
    'proposal_sent':     'ops.stage.proposal',
    'negotiating':       'ops.stage.negotiating',
    'closed_won':        'ops.stage.won',
    'closed_lost':       'ops.stage.lost',
    'on_hold':           'ops.stage.hold'
  };

  var STAGE_FLOW = [
    'new',
    'contacted',
    'meeting_scheduled',
    'proposal_sent',
    'negotiating',
    'closed_won',
    'closed_lost',
    'on_hold'
  ];

  var CONTACT_FIELDS = [
    { key: 'first_name',        label: 'Nombre' },
    { key: 'email',             label: 'Email' },
    { key: 'phone',             label: 'WhatsApp / Teléfono' },
    { key: 'company_name',      label: 'Empresa' },
    { key: 'industry',          label: 'Industria' },
    { key: 'company_size',      label: 'Tamaño empresa' },
    { key: 'company_website',   label: 'Sitio web' },
    { key: 'company_linkedin',  label: 'LinkedIn' },
    { key: 'revenue',           label: 'Ingresos mensuales' }
  ];

  var DIMENSION_LABELS = {
    customerInteraction: 'Interacción cliente',
    processMaturity:     'Madurez procesos',
    digitalPresence:     'Presencia digital',
    dataUtilization:     'Uso de datos',
    aiReadiness:         'Preparación IA'
  };

  var QUESTION_LABELS = {
    es: {
      q1: '¿A qué se dedica tu negocio?',
      q2: '¿Cuántos empleados tiene tu empresa?',
      q3: '¿Cuáles son las 3 tareas que más tiempo consumen en tu operación diaria?',
      q4: '¿Cuántas horas a la semana dedica tu equipo a responder consultas de clientes?',
      q5: '¿Tu negocio tiene presencia digital?',
      q6: '¿Cómo gestionan la agenda y coordinación de tu equipo?',
      q7: '¿Qué herramientas tecnológicas usan actualmente?',
      q8: '¿Qué tan familiarizado estás con la inteligencia artificial?',
      q9: '¿Cuál es el mayor cuello de botella en tu operación?',
      q10: '¿Si pudieras automatizar UNA cosa en tu negocio, cuál sería?',
      q11: '¿Cuál es el rango de ingresos mensuales de tu empresa?'
    },
    en: {
      q1: 'What does your business do?',
      q2: 'How many employees does your company have?',
      q3: 'What are the 3 most time-consuming tasks in your daily operation?',
      q4: 'How many hours per week does your team spend answering client inquiries?',
      q5: 'Does your business have a digital presence?',
      q6: 'How do you manage scheduling and team coordination?',
      q7: 'What technology tools do you currently use?',
      q8: 'How familiar are you with artificial intelligence?',
      q9: 'What is the biggest bottleneck in your operation?',
      q10: 'If you could automate ONE thing in your business, what would it be?',
      q11: 'What is your company\'s monthly revenue range?'
    }
  };

  function init() {
    setupFilters();
    setupSortHeaders();
    renderTable({});

    var closeBtn = document.getElementById('detailClose');
    if (closeBtn) closeBtn.addEventListener('click', closeDetail);

    var overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.addEventListener('click', closeDetail);

    // Delegated click handler for pipeline cards
    var pipeBoard = document.getElementById('pipelineBoard');
    if (pipeBoard) {
      pipeBoard.addEventListener('click', function(e) {
        var card = e.target.closest('.pipe-card');
        if (!card) return;
        if (card.classList.contains('dragging')) return;
        var leadId = card.getAttribute('data-lead-id');
        if (leadId) openDetail(leadId);
      });
    }
  }

  function setupFilters() {
    var search = document.getElementById('leadsSearch');
    var stageFilter = document.getElementById('stageFilter');
    var priorityFilter = document.getElementById('priorityFilter');

    if (search) {
      search.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          renderTable(getFilters());
        }, 300);
      });
    }

    if (stageFilter) {
      stageFilter.addEventListener('change', function() {
        renderTable(getFilters());
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', function() {
        renderTable(getFilters());
      });
    }
  }

  function getFilters() {
    var search = document.getElementById('leadsSearch');
    var stageFilter = document.getElementById('stageFilter');
    var priorityFilter = document.getElementById('priorityFilter');

    return {
      search: search ? search.value.trim() : '',
      stage: stageFilter ? stageFilter.value : '',
      priority: priorityFilter ? priorityFilter.value : ''
    };
  }

  function setupSortHeaders() {
    var headers = document.querySelectorAll('.leads-table th[data-sort]');
    headers.forEach(function(th) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', function() {
        var col = th.getAttribute('data-sort');
        if (currentSort.col === col) {
          currentSort.asc = !currentSort.asc;
        } else {
          currentSort.col = col;
          currentSort.asc = true;
        }
        // Update visual indicator (CSS uses aria-sort)
        headers.forEach(function(h) { h.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', currentSort.asc ? 'ascending' : 'descending');
        renderTable(getFilters());
      });
    });
  }

  function sortLeads(leads) {
    var col = currentSort.col;
    var asc = currentSort.asc;

    return leads.sort(function(a, b) {
      var va, vb;
      if (col === 'created_at') {
        va = new Date(a.created_at || 0).getTime();
        vb = new Date(b.created_at || 0).getTime();
      } else if (col === 'score') {
        va = Number(a.total_score) || 0;
        vb = Number(b.total_score) || 0;
      } else if (col === 'deal_value') {
        va = Number(a.deal_value) || 0;
        vb = Number(b.deal_value) || 0;
      } else if (col === 'company') {
        va = (a.company_name || '').toLowerCase();
        vb = (b.company_name || '').toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      } else if (col === 'contact') {
        va = ((a.first_name || '') + ' ' + (a.last_name || '')).toLowerCase();
        vb = ((b.first_name || '') + ' ' + (b.last_name || '')).toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      } else if (col === 'stage') {
        va = a.pipeline_stage || '';
        vb = b.pipeline_stage || '';
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      } else if (col === 'priority') {
        var pOrder = { hot: 0, high: 1, medium: 2, low: 3 };
        va = pOrder[a.priority] !== undefined ? pOrder[a.priority] : 9;
        vb = pOrder[b.priority] !== undefined ? pOrder[b.priority] : 9;
      } else if (col === 'industry') {
        va = (a.industry || '').toLowerCase();
        vb = (b.industry || '').toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      } else {
        va = 0; vb = 0;
      }
      return asc ? va - vb : vb - va;
    });
  }

  function renderTable(filters) {
    var leads = typeof OpsDashboard !== 'undefined' ? OpsDashboard.getAllLeads() : [];
    var f = filters || {};

    var filtered = leads.filter(function(lead) {
      if (f.search) {
        var q = f.search.toLowerCase();
        var match =
          (lead.company_name  || '').toLowerCase().indexOf(q) !== -1 ||
          (lead.first_name    || '').toLowerCase().indexOf(q) !== -1 ||
          (lead.last_name     || '').toLowerCase().indexOf(q) !== -1 ||
          (lead.email         || '').toLowerCase().indexOf(q) !== -1;
        if (!match) return false;
      }

      if (f.stage && lead.pipeline_stage !== f.stage) return false;
      if (f.priority && lead.priority !== f.priority) return false;

      return true;
    });

    filtered = sortLeads(filtered);

    var tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!filtered.length) {
      var emptyRow = document.createElement('tr');
      emptyRow.className = 'leads-empty-state';
      emptyRow.innerHTML = '<td colspan="9"><span>No hay leads aún. Los diagnósticos completados aparecerán aquí.</span></td>';
      tbody.appendChild(emptyRow);
      return;
    }

    filtered.forEach(function(lead) {
      var tr = document.createElement('tr');

      var score = lead.total_score || 0;
      var level = getScoreLevel(score);
      var dateStr = lead.created_at
        ? lead.created_at.substring(0, 10)
        : '—';
      var priority = lead.priority || 'medium';
      var stageLabel = getStageLabel(lead.pipeline_stage);
      var dealDisplay = lead.deal_value
        ? '$' + Number(lead.deal_value).toLocaleString()
        : '—';

      tr.innerHTML =
        '<td>' + escHtml(dateStr) + '</td>' +
        '<td class="lead-company">' + escHtml(lead.company_name || '') + '</td>' +
        '<td>' + escHtml((lead.first_name || '') + ' ' + (lead.last_name || '')) + '</td>' +
        '<td>' + escHtml(lead.industry || '') + '</td>' +
        '<td><span class="score-badge score-' + level + '">' + score + '</span></td>' +
        '<td><span class="stage-badge">' + escHtml(stageLabel) + '</span></td>' +
        '<td><span class="priority-dot priority-' + priority + '"></span> ' + escHtml(priority) + '</td>' +
        '<td class="lead-value">' + dealDisplay + '</td>' +
        '<td><button class="btn-detail" data-id="' + lead.id + '">&rarr;</button></td>';

      tr.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-detail')) return;
        openDetail(lead.id);
      });

      var detailBtn = tr.querySelector('.btn-detail');
      if (detailBtn) {
        detailBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          openDetail(lead.id);
        });
      }

      tbody.appendChild(tr);
    });
  }

  function openDetail(leadId) {
    var lead = (typeof OpsDashboard !== 'undefined' ? OpsDashboard.getAllLeads() : []).find(function(l) {
      return String(l.id) === String(leadId);
    });
    if (!lead) return;

    currentDetailId = leadId;

    var panel = document.getElementById('detailPanel');
    if (panel) {
      panel.removeAttribute('hidden');
      panel.classList.add('open');
    }

    var overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.add('visible');

    populateDetail(lead);
  }

  function populateDetail(lead) {
    var content = document.getElementById('detailContent');
    if (!content) return;

    content.innerHTML = '';

    var lang = (typeof IgneaI18n !== 'undefined' && IgneaI18n.getLang) ? IgneaI18n.getLang() : 'es';
    var score = lead.total_score || 0;
    var level = lead.score_level || getScoreLevel(score);

    // ── Panel Header (always visible) ──
    var header = document.createElement('div');
    header.className = 'detail-header';
    header.innerHTML =
      '<div class="detail-name">' + escHtml((lead.first_name || '') + ' ' + (lead.last_name || '')) + '</div>' +
      '<div class="detail-company-name">' + escHtml(lead.company_name || '') + '</div>' +
      '<span class="score-badge score-' + escHtml(level) + '">' + score + '</span>';
    content.appendChild(header);

    // ── Tab Navigation ──
    var tabNav = document.createElement('div');
    tabNav.className = 'detail-tabs';
    tabNav.innerHTML =
      '<button class="detail-tab active" data-dtab="summary">' + (lang === 'es' ? 'Resumen' : 'Summary') + '</button>' +
      '<button class="detail-tab" data-dtab="answers">' + (lang === 'es' ? 'Respuestas' : 'Answers') + '</button>' +
      '<button class="detail-tab" data-dtab="ai">' + (lang === 'es' ? 'Análisis IA' : 'AI Analysis') + '</button>' +
      '<button class="detail-tab" data-dtab="actions">' + (lang === 'es' ? 'Acciones' : 'Actions') + '</button>';
    content.appendChild(tabNav);

    // ── TAB 1: Summary ──
    var tabSummary = document.createElement('div');
    tabSummary.className = 'detail-tab-content';
    tabSummary.setAttribute('data-dtab', 'summary');
    tabSummary.style.display = 'block';

    // Contact grid
    var contactGrid = document.createElement('div');
    contactGrid.className = 'detail-contact-grid';
    CONTACT_FIELDS.forEach(function(fieldDef) {
      var cell = document.createElement('div');
      cell.className = 'detail-contact-cell';

      var label = document.createElement('div');
      label.className = 'form-label';
      label.textContent = fieldDef.label;

      var valueEl = document.createElement('div');
      valueEl.className = 'detail-contact-value';
      valueEl.textContent = lead[fieldDef.key] || '—';
      valueEl.setAttribute('data-field', fieldDef.key);

      // Click to edit
      valueEl.addEventListener('click', function() {
        if (valueEl.querySelector('input')) return;
        var currentVal = lead[fieldDef.key] || '';
        var input = document.createElement('input');
        input.className = 'form-input detail-inline-edit';
        input.value = currentVal;
        valueEl.textContent = '';
        valueEl.appendChild(input);
        input.focus();

        input.addEventListener('blur', function() {
          var newVal = input.value;
          valueEl.textContent = newVal || '—';
          if (newVal !== currentVal) {
            lead[fieldDef.key] = newVal;
            saveLeadField(lead.id, fieldDef.key, newVal);
          }
        });

        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') input.blur();
          if (e.key === 'Escape') {
            input.value = currentVal;
            input.blur();
          }
        });
      });

      cell.appendChild(label);
      cell.appendChild(valueEl);
      contactGrid.appendChild(cell);
    });
    tabSummary.appendChild(contactGrid);

    // Score section
    var scoreSection = document.createElement('div');
    scoreSection.className = 'detail-section';
    var scoreHeader = document.createElement('div');
    scoreHeader.className = 'detail-score';
    scoreHeader.innerHTML =
      '<span class="detail-score-value">' + score + '</span>' +
      '<span class="detail-score-max">/100</span> ' +
      '<span class="score-badge score-' + escHtml(level) + '">' + escHtml(level) + '</span>';
    scoreSection.appendChild(scoreHeader);

    var dims = lead.score_breakdown || {};
    var dimKeys = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
    dimKeys.forEach(function(dim) {
      var dimScore = Number(dims[dim]) || 0;
      var dimPct = Math.round((dimScore / 20) * 100);
      var row = document.createElement('div');
      row.className = 'bd-row';
      row.innerHTML =
        '<div class="bd-label">' + escHtml(DIMENSION_LABELS[dim] || dim) + '</div>' +
        '<div class="bd-bar-wrap">' +
          '<div class="bd-bar" style="width:' + dimPct + '%"></div>' +
        '</div>' +
        '<div class="bd-val">' + dimScore + '/20</div>';
      scoreSection.appendChild(row);
    });
    tabSummary.appendChild(scoreSection);

    // Pipeline section
    var pipeSection = document.createElement('div');
    pipeSection.className = 'detail-section';
    var pipeTag = document.createElement('div');
    pipeTag.className = 'detail-section-tag';
    pipeTag.textContent = '// Pipeline';
    pipeSection.appendChild(pipeTag);

    var currentStage = lead.pipeline_stage || 'new';
    var stageBadge = document.createElement('div');
    stageBadge.className = 'detail-pipeline-info';
    stageBadge.innerHTML = '<span class="stage-badge">' + escHtml(getStageLabel(currentStage)) + '</span>';
    pipeSection.appendChild(stageBadge);

    // Priority selector
    var priorityRow = document.createElement('div');
    priorityRow.className = 'detail-field-row';
    var priorityLabel = document.createElement('label');
    priorityLabel.className = 'form-label';
    priorityLabel.textContent = lang === 'es' ? 'Prioridad' : 'Priority';
    var prioritySelect = document.createElement('select');
    prioritySelect.className = 'form-input';
    ['hot', 'high', 'medium', 'low'].forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if ((lead.priority || 'medium') === p) opt.selected = true;
      prioritySelect.appendChild(opt);
    });
    prioritySelect.addEventListener('change', function() {
      lead.priority = prioritySelect.value;
      saveLeadField(lead.id, 'priority', prioritySelect.value);
    });
    priorityRow.appendChild(priorityLabel);
    priorityRow.appendChild(prioritySelect);
    pipeSection.appendChild(priorityRow);

    // Deal value
    var dealRow = document.createElement('div');
    dealRow.className = 'detail-field-row';
    var dealLabel = document.createElement('label');
    dealLabel.className = 'form-label';
    dealLabel.textContent = lang === 'es' ? 'Valor del deal' : 'Deal value';
    var dealInput = document.createElement('input');
    dealInput.className = 'form-input';
    dealInput.type = 'number';
    dealInput.value = lead.deal_value || '';
    dealInput.placeholder = '$0';
    dealInput.addEventListener('blur', function() {
      var val = dealInput.value ? Number(dealInput.value) : null;
      lead.deal_value = val;
      saveLeadField(lead.id, 'deal_value', val);
    });
    dealRow.appendChild(dealLabel);
    dealRow.appendChild(dealInput);
    pipeSection.appendChild(dealRow);

    // Days in stage
    var daysInStage = Math.floor((Date.now() - new Date(lead.updated_at || lead.created_at).getTime()) / 86400000);
    var daysEl = document.createElement('div');
    daysEl.className = 'detail-days-in-stage';
    daysEl.textContent = (lang === 'es' ? 'Días en etapa: ' : 'Days in stage: ') + daysInStage;
    pipeSection.appendChild(daysEl);

    tabSummary.appendChild(pipeSection);

    // Notes textarea
    var notesSection = document.createElement('div');
    notesSection.className = 'detail-section';
    var notesTag = document.createElement('div');
    notesTag.className = 'detail-section-tag';
    notesTag.textContent = IgneaI18n.t('ops.detail.notes') || '// Notas';
    notesSection.appendChild(notesTag);

    var textarea = document.createElement('textarea');
    textarea.className = 'form-input detail-notes';
    textarea.value = lead.notes || '';
    textarea.addEventListener('blur', function() {
      saveLeadField(lead.id, 'notes', textarea.value);
    });
    notesSection.appendChild(textarea);
    tabSummary.appendChild(notesSection);

    content.appendChild(tabSummary);

    // ── TAB 2: Answers ──
    var tabAnswers = document.createElement('div');
    tabAnswers.className = 'detail-tab-content';
    tabAnswers.setAttribute('data-dtab', 'answers');
    tabAnswers.style.display = 'none';

    var answers = lead.diagnostic_answers || {};

    // Detect format: new intake (q4_headache etc.) vs old diagnostic (q1-q11)
    var isIntakeFormat = answers.q4_headache !== undefined || answers.q5_timeleaks !== undefined || answers.q2_business !== undefined;

    if (isIntakeFormat) {
      // Show quick stats if available
      if (lead.opportunityCount || lead.estimatedHoursLost) {
        var statsBlock = document.createElement('div');
        statsBlock.className = 'answer-block';
        statsBlock.innerHTML =
          '<div class="answer-q">' + (lang === 'es' ? 'Resumen rápido' : 'Quick stats') + '</div>' +
          '<div class="answer-chips">' +
            '<span class="answer-chip">' + (lead.opportunityCount || 0) + ' ' + (lang === 'es' ? 'oportunidades' : 'opportunities') + '</span>' +
            '<span class="answer-chip">' + (lead.estimatedHoursLost || 0) + ' hrs/' + (lang === 'es' ? 'semana perdidas' : 'week lost') + '</span>' +
          '</div>';
        tabAnswers.appendChild(statsBlock);
      }

      // Show scores if available
      if (lead.score_breakdown) {
        var sb = lead.score_breakdown;
        var dimNames = lang === 'es'
          ? { customerFlow: 'Flujo de Clientes', operationsFlow: 'Flujo de Operaciones', informationFlow: 'Flujo de Información', growthFlow: 'Flujo de Crecimiento' }
          : { customerFlow: 'Customer Flow', operationsFlow: 'Operations Flow', informationFlow: 'Information Flow', growthFlow: 'Growth Flow' };
        var scoreBlock = document.createElement('div');
        scoreBlock.className = 'answer-block';
        var scoreHtml = '<div class="answer-q">' + (lang === 'es' ? 'Puntuación: ' : 'Score: ') + (lead.total_score || 0) + '/100</div>';
        ['customerFlow', 'operationsFlow', 'informationFlow', 'growthFlow'].forEach(function(dim) {
          var val = sb[dim] || 0;
          var pct = Math.round((val / 25) * 100);
          scoreHtml += '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray);margin-bottom:3px"><span>' + (dimNames[dim] || dim) + '</span><span style="font-family:var(--fm)">' + val + '/25</span></div>' +
            '<div style="height:4px;background:var(--border);width:100%"><div style="height:100%;width:' + pct + '%;background:var(--accent);transition:width .5s"></div></div></div>';
        });
        scoreBlock.innerHTML = scoreHtml;
        tabAnswers.appendChild(scoreBlock);
      }

      var INTAKE_QUESTIONS = lang === 'es' ? [
        { key: 'q2_business',    label: 'Sobre su negocio' },
        { key: 'q5_timeleaks',   label: 'Dónde pierden más tiempo' },
        { key: 'q6_tools',       label: 'Herramientas actuales' },
        { key: 'q4_headache',    label: 'Problema operativo principal' },
        { key: 'q7_tried',       label: 'Intentos previos de resolver el problema' }
      ] : [
        { key: 'q2_business',    label: 'About their business' },
        { key: 'q5_timeleaks',   label: 'Where the team loses time' },
        { key: 'q6_tools',       label: 'Current tools' },
        { key: 'q4_headache',    label: 'Biggest operational headache' },
        { key: 'q7_tried',       label: 'Previous attempts to solve the problem' }
      ];

      INTAKE_QUESTIONS.forEach(function(qDef, idx) {
        var val = answers[qDef.key];
        var block = document.createElement('div');
        block.className = 'answer-block';

        var qText = document.createElement('div');
        qText.className = 'answer-q';
        qText.textContent = (idx + 1) + '. ' + qDef.label;
        block.appendChild(qText);

        if (Array.isArray(val) && val.length) {
          var chipsWrap = document.createElement('div');
          chipsWrap.className = 'answer-chips';
          val.forEach(function(item) {
            var chip = document.createElement('span');
            chip.className = 'answer-chip';
            chip.textContent = String(item);
            chipsWrap.appendChild(chip);
          });
          block.appendChild(chipsWrap);
        } else if (val && typeof val === 'string' && val.trim()) {
          var ansEl = document.createElement('div');
          ansEl.className = 'answer-text';
          ansEl.textContent = val;
          // Collapsible if long
          if (val.length > 200) {
            ansEl.style.maxHeight = '80px';
            ansEl.style.overflow = 'hidden';
            ansEl.style.cursor = 'pointer';
            ansEl.title = lang === 'es' ? 'Clic para expandir' : 'Click to expand';
            ansEl.addEventListener('click', function() {
              if (ansEl.style.maxHeight) {
                ansEl.style.maxHeight = '';
                ansEl.style.overflow = '';
              } else {
                ansEl.style.maxHeight = '80px';
                ansEl.style.overflow = 'hidden';
              }
            });
          }
          block.appendChild(ansEl);
        } else {
          var empty = document.createElement('div');
          empty.className = 'answer-choice answer-empty';
          empty.textContent = '—';
          block.appendChild(empty);
        }

        tabAnswers.appendChild(block);
      });
    } else {
      // Legacy q1-q11 format
      var qLabels = QUESTION_LABELS[lang] || QUESTION_LABELS.es;
      for (var q = 1; q <= 11; q++) {
        var qKey = 'q' + q;
        var answer = answers[qKey];
        var openAnswer = answers[qKey + '_open'];

        var block = document.createElement('div');
        block.className = 'answer-block';

        var qText = document.createElement('div');
        qText.className = 'answer-q';
        qText.textContent = 'Q' + q + ': ' + (qLabels[qKey] || '');
        block.appendChild(qText);

        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            var chipsWrap = document.createElement('div');
            chipsWrap.className = 'answer-chips';
            answer.forEach(function(item) {
              var chip = document.createElement('span');
              chip.className = 'answer-chip';
              chip.textContent = String(item);
              chipsWrap.appendChild(chip);
            });
            block.appendChild(chipsWrap);
          } else {
            var choiceEl = document.createElement('div');
            choiceEl.className = 'answer-choice';
            choiceEl.textContent = String(answer);
            block.appendChild(choiceEl);
          }
        } else {
          var noAnswer = document.createElement('div');
          noAnswer.className = 'answer-choice answer-empty';
          noAnswer.textContent = '—';
          block.appendChild(noAnswer);
        }

        if (openAnswer) {
          var openEl = document.createElement('div');
          openEl.className = 'answer-text';
          openEl.textContent = '"' + String(openAnswer) + '"';
          block.appendChild(openEl);
        }

        tabAnswers.appendChild(block);
      }
    }

    // Copy answers button
    var copyBtn = document.createElement('button');
    copyBtn.className = 'btn-ghost';
    copyBtn.style.marginTop = '16px';
    copyBtn.textContent = lang === 'es' ? 'Copiar respuestas' : 'Copy answers';
    copyBtn.addEventListener('click', function() {
      var text = '';
      if (isIntakeFormat) {
        var copyQs = lang === 'es'
          ? { q2_business: 'Sobre su negocio', q5_timeleaks: 'Pérdidas de tiempo', q6_tools: 'Herramientas', q4_headache: 'Problema principal', q7_tried: 'Intentos previos' }
          : { q2_business: 'About their business', q5_timeleaks: 'Time sinks', q6_tools: 'Tools', q4_headache: 'Main problem', q7_tried: 'Previous attempts' };
        Object.keys(copyQs).forEach(function(k) {
          var v = answers[k];
          text += copyQs[k] + ': ' + (Array.isArray(v) ? v.join(', ') : (v || '—')) + '\n\n';
        });
      } else {
      var qLabels = QUESTION_LABELS[lang] || QUESTION_LABELS.es;
      for (var i = 1; i <= 11; i++) {
        var key = 'q' + i;
        var label = (qLabels[key] || 'Q' + i);
        var ans = answers[key];
        var openAns = answers[key + '_open'];
        text += 'Q' + i + ': ' + label + '\n';
        if (ans !== undefined && ans !== null) {
          text += (Array.isArray(ans) ? ans.join(', ') : String(ans)) + '\n';
        } else {
          text += '—\n';
        }
        if (openAns) text += '"' + String(openAns) + '"\n';
        text += '\n';
      }
      } // end else (legacy format)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          copyBtn.textContent = lang === 'es' ? 'Copiado' : 'Copied';
          setTimeout(function() {
            copyBtn.textContent = lang === 'es' ? 'Copiar respuestas' : 'Copy answers';
          }, 2000);
        });
      }
    });
    tabAnswers.appendChild(copyBtn);

    content.appendChild(tabAnswers);

    // ── TAB: AI ANALYSIS ──
    var tabAI = document.createElement('div');
    tabAI.className = 'detail-tab-content';
    tabAI.setAttribute('data-dtab', 'ai');
    tabAI.style.display = 'none';

    // Toggle buttons
    var aiToggleRow = document.createElement('div');
    aiToggleRow.className = 'ai-toggle-row';
    var btnSummaryMode = document.createElement('button');
    btnSummaryMode.className = 'btn-ghost btn-sm ai-mode-btn active';
    btnSummaryMode.textContent = lang === 'es' ? 'Resumen rápido' : 'Quick Summary';
    var btnDeepMode = document.createElement('button');
    btnDeepMode.className = 'btn-ghost btn-sm ai-mode-btn';
    btnDeepMode.textContent = lang === 'es' ? 'Análisis profundo' : 'Deep Analysis';
    aiToggleRow.appendChild(btnSummaryMode);
    aiToggleRow.appendChild(btnDeepMode);
    tabAI.appendChild(aiToggleRow);

    var aiResultContainer = document.createElement('div');
    aiResultContainer.className = 'ai-result-container';
    tabAI.appendChild(aiResultContainer);

    var currentAIMode = 'summary';

    function renderSummaryResult(data) {
      var h = '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// RESUMEN EJECUTIVO' : '// EXECUTIVE SUMMARY') + '</div>' +
        '<p class="ai-card-body">' + escHtml(data.overview) + '</p>' +
      '</div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// PUNTOS DE DOLOR' : '// PAIN POINTS') + '</div>' +
        '<ul class="ai-card-list">';
      (data.pain_points || []).forEach(function(p) { h += '<li>' + escHtml(p) + '</li>'; });
      h += '</ul></div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// PRIMER PROYECTO RECOMENDADO' : '// RECOMMENDED FIRST PROJECT') + '</div>' +
        '<p class="ai-card-body ai-card-highlight">' + escHtml(data.recommended_project) + '</p>' +
      '</div>';

      // Savings with calculation
      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// AHORRO ESTIMADO' : '// ESTIMATED SAVINGS') + '</div>' +
        '<div class="ai-card-stat">$' + (data.monthly_savings_min || 0).toLocaleString() + ' – $' + (data.monthly_savings_max || 0).toLocaleString() + '/mo</div>';
      if (data.savings_calculation) {
        h += '<p class="ai-card-body" style="margin-top:8px;font-family:var(--fm);font-size:13px;white-space:pre-line">' + escHtml(data.savings_calculation) + '</p>';
      }
      h += '</div>';

      // Price with formula
      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// PRECIO SUGERIDO' : '// SUGGESTED PRICE') + '</div>' +
        '<div class="ai-card-stat">$' + (data.suggested_price_min || 0).toLocaleString() + ' – $' + (data.suggested_price_max || 0).toLocaleString() + '</div>';
      if (data.price_calculation) {
        h += '<p class="ai-card-body" style="margin-top:8px;font-family:var(--fm);font-size:13px">' + escHtml(data.price_calculation) + '</p>';
      }
      h += '</div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// PREGUNTAS PARA LA LLAMADA' : '// DISCOVERY CALL QUESTIONS') + '</div>' +
        '<ol class="ai-card-list">';
      (data.discovery_questions || []).forEach(function(q) { h += '<li>' + escHtml(q) + '</li>'; });
      h += '</ol></div>';

      // Unknowns
      if (data.unknowns) {
        h += '<div class="ai-card" style="border-color:rgba(239,159,39,0.2)">' +
          '<div class="ai-card-tag" style="color:#EF9F27">' + (lang === 'es' ? '// LO QUE NO SABEMOS' : '// WHAT WE DON\'T KNOW') + '</div>' +
          '<p class="ai-card-body">' + escHtml(data.unknowns) + '</p>' +
        '</div>';
      }

      return h;
    }

    function renderDeepResult(data) {
      var h = '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// EVALUACIÓN DEL NEGOCIO' : '// BUSINESS ASSESSMENT') + '</div>' +
        '<p class="ai-card-body">' + escHtml(data.assessment).replace(/\n/g, '<br>') + '</p>' +
      '</div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// SOLUCIONES — ROADMAP POR FASES' : '// SOLUTIONS — PHASED ROADMAP') + '</div>';
      (data.solutions || []).forEach(function(sol, idx) {
        var phaseLabel = sol.phase ? (lang === 'es' ? 'FASE ' : 'PHASE ') + sol.phase : '' + (idx + 1);
        var weeksLabel = sol.weeks ? ' (' + (lang === 'es' ? 'semanas ' : 'weeks ') + sol.weeks + ')' : '';
        h += '<div class="ai-sol-card">' +
          '<div class="ai-sol-rank">' + phaseLabel + '</div>' +
          '<div class="ai-sol-body">' +
            '<div class="ai-sol-name">' + escHtml(sol.name) + weeksLabel + '</div>' +
            '<div class="ai-sol-desc">' + escHtml(sol.description) + '</div>';
        if (sol.build_hours_breakdown) {
          h += '<div style="font-family:var(--fm);font-size:12px;color:var(--dimgray);margin:4px 0">' + escHtml(sol.build_hours_breakdown) + '</div>';
        }
        if (sol.savings_calculation) {
          h += '<div style="font-family:var(--fm);font-size:12px;color:var(--gray);margin:4px 0;white-space:pre-line">' + escHtml(sol.savings_calculation) + '</div>';
        }
        if (sol.why_this_order) {
          h += '<div style="font-size:13px;color:var(--dimgray);font-style:italic;margin:4px 0">' + escHtml(sol.why_this_order) + '</div>';
        }
        h += '<div class="ai-sol-meta">' +
              '<span>' + (sol.build_hours || '?') + 'h build</span>' +
              '<span>$' + (sol.monthly_savings || 0).toLocaleString() + '/mo saved</span>' +
              '<span>$' + (sol.suggested_price || 0).toLocaleString() + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      h += '</div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// ANÁLISIS COMPETITIVO' : '// COMPETITIVE ANALYSIS') + '</div>' +
        '<p class="ai-card-body">' + escHtml(data.competitive_analysis || '').replace(/\n/g, '<br>') + '</p>' +
      '</div>';

      // Discovery script — handle both array and structured object formats
      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// GUIÓN DE DESCUBRIMIENTO' : '// DISCOVERY SCRIPT') + '</div>';
      var ds = data.discovery_script;
      if (ds && typeof ds === 'object' && !Array.isArray(ds)) {
        // Structured format: { quantify: [], validate: [], close: [] }
        if (ds.quantify && ds.quantify.length) {
          h += '<div style="font-family:var(--fm);font-size:11px;color:var(--accent);letter-spacing:1px;margin:12px 0 6px">' + (lang === 'es' ? 'CUANTIFICAR' : 'QUANTIFY') + '</div><ol class="ai-card-list">';
          ds.quantify.forEach(function(q) { h += '<li>' + escHtml(q) + '</li>'; });
          h += '</ol>';
        }
        if (ds.validate && ds.validate.length) {
          h += '<div style="font-family:var(--fm);font-size:11px;color:var(--accent);letter-spacing:1px;margin:12px 0 6px">' + (lang === 'es' ? 'VALIDAR' : 'VALIDATE') + '</div><ol class="ai-card-list">';
          ds.validate.forEach(function(q) { h += '<li>' + escHtml(q) + '</li>'; });
          h += '</ol>';
        }
        if (ds.close && ds.close.length) {
          h += '<div style="font-family:var(--fm);font-size:11px;color:var(--accent);letter-spacing:1px;margin:12px 0 6px">' + (lang === 'es' ? 'CERRAR' : 'CLOSE') + '</div><ol class="ai-card-list">';
          ds.close.forEach(function(q) { h += '<li>' + escHtml(q) + '</li>'; });
          h += '</ol>';
        }
      } else if (Array.isArray(ds)) {
        h += '<ol class="ai-card-list">';
        ds.forEach(function(q) { h += '<li>' + escHtml(q) + '</li>'; });
        h += '</ol>';
      }
      h += '</div>';

      h += '<div class="ai-card">' +
        '<div class="ai-card-tag">' + (lang === 'es' ? '// PUNTOS DE PROPUESTA' : '// PROPOSAL TALKING POINTS') + '</div>' +
        '<ul class="ai-card-list">';
      (data.proposal_talking_points || []).forEach(function(p) { h += '<li>' + escHtml(p) + '</li>'; });
      h += '</ul></div>';

      if (data.red_flags && data.red_flags.length) {
        h += '<div class="ai-card ai-card-warn">' +
          '<div class="ai-card-tag">' + (lang === 'es' ? '// BANDERAS ROJAS / OBJECIONES' : '// RED FLAGS / OBJECTIONS') + '</div>';
        data.red_flags.forEach(function(f) {
          if (typeof f === 'object' && f.objection) {
            h += '<div style="margin:10px 0"><div style="font-weight:600;color:var(--coral);font-size:14px;margin-bottom:4px">' + escHtml(f.objection) + '</div>' +
              '<div style="font-size:13px;color:var(--gray);line-height:1.5">' + escHtml(f.response) + '</div></div>';
          } else {
            h += '<div style="margin:6px 0;font-size:14px;color:var(--gray)">' + escHtml(typeof f === 'string' ? f : JSON.stringify(f)) + '</div>';
          }
        });
        h += '</div>';
      }

      return h;
    }

    function runAIMode(mode) {
      currentAIMode = mode;
      btnSummaryMode.classList.toggle('active', mode === 'summary');
      btnDeepMode.classList.toggle('active', mode === 'deep_analysis');

      aiResultContainer.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div>' +
        (lang === 'es' ? 'Analizando...' : 'Analyzing...') + '</div>';

      var promise;
      if (mode === 'summary') {
        promise = IgneaAI.generateSummary(lead);
      } else {
        // For deep analysis, try to get scraper data
        var scraperData = lead.scraper_data || null;
        promise = IgneaAI.generateDeepAnalysis(lead, scraperData);
      }

      promise.then(function(data) {
        var html = mode === 'summary' ? renderSummaryResult(data) : renderDeepResult(data);

        // Copy all button
        html += '<button class="btn-ghost ai-copy-all" style="width:100%;margin-top:12px">' +
          (lang === 'es' ? 'Copiar todo al portapapeles' : 'Copy all to clipboard') + '</button>';

        aiResultContainer.innerHTML = html;

        var copyAllBtn = aiResultContainer.querySelector('.ai-copy-all');
        if (copyAllBtn) {
          copyAllBtn.addEventListener('click', function() {
            var text = aiResultContainer.innerText;
            navigator.clipboard.writeText(text).then(function() {
              copyAllBtn.textContent = lang === 'es' ? 'Copiado ✓' : 'Copied ✓';
              setTimeout(function() {
                copyAllBtn.textContent = lang === 'es' ? 'Copiar todo al portapapeles' : 'Copy all to clipboard';
              }, 2000);
            });
          });
        }

        // Auto-fill calculator
        if (mode === 'summary' || mode === 'deep_analysis') {
          document.dispatchEvent(new CustomEvent('ops:autoFillCalc', { detail: { lead: lead, ai: data } }));
        }
      }).catch(function(err) {
        aiResultContainer.innerHTML = '<div class="ai-error">' + escHtml(err.message) + '</div>';
      });
    }

    btnSummaryMode.addEventListener('click', function() { runAIMode('summary'); });
    btnDeepMode.addEventListener('click', function() { runAIMode('deep_analysis'); });

    content.appendChild(tabAI);

    // ── TAB 3: Actions ──
    var tabActions = document.createElement('div');
    tabActions.className = 'detail-tab-content';
    tabActions.setAttribute('data-dtab', 'actions');
    tabActions.style.display = 'none';

    // Calculate price button
    var btnCalc = document.createElement('button');
    btnCalc.className = 'btn-gradient';
    btnCalc.textContent = (lang === 'es' ? 'Calcular precio' : 'Calculate price') + ' →';
    btnCalc.addEventListener('click', function() {
      closeDetail();
      switchToTab('calculator');
      document.dispatchEvent(new CustomEvent('ops:openCalculator', { detail: { lead: lead } }));
    });
    tabActions.appendChild(btnCalc);

    // Run scraper button
    var btnScraper = document.createElement('button');
    btnScraper.className = 'btn-ghost';
    btnScraper.style.marginTop = '8px';
    btnScraper.textContent = (lang === 'es' ? 'Ejecutar scraper' : 'Run scraper') + ' →';
    btnScraper.addEventListener('click', function() {
      closeDetail();
      switchToTab('scraper');
      document.dispatchEvent(new CustomEvent('ops:openScraper', { detail: { lead: lead } }));
    });
    tabActions.appendChild(btnScraper);

    // Download PDF button
    var btnPDF = document.createElement('button');
    btnPDF.className = 'btn-ghost';
    btnPDF.style.marginTop = '8px';
    btnPDF.textContent = lang === 'es' ? 'Descargar PDF del diagnóstico' : 'Download diagnostic PDF';
    btnPDF.addEventListener('click', function() {
      generateDiagnosticPDF(lead);
    });
    tabActions.appendChild(btnPDF);

    // ── AI: Generate Recommendations ──
    var aiRecoSection = document.createElement('div');
    aiRecoSection.className = 'ai-section';
    var aiRecoHeader = document.createElement('div');
    aiRecoHeader.className = 'ai-section-header';
    aiRecoHeader.textContent = lang === 'es' ? '// INTELIGENCIA ARTIFICIAL' : '// ARTIFICIAL INTELLIGENCE';
    aiRecoSection.appendChild(aiRecoHeader);

    var btnRecos = document.createElement('button');
    btnRecos.className = 'btn-gradient';
    btnRecos.style.width = '100%';
    btnRecos.style.marginBottom = '8px';
    btnRecos.textContent = lang === 'es' ? 'Generar recomendaciones IA →' : 'Generate AI recommendations →';
    var recoResultsDiv = document.createElement('div');

    btnRecos.addEventListener('click', function() {
      btnRecos.disabled = true;
      recoResultsDiv.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div>' +
        (lang === 'es' ? 'Analizando diagnóstico...' : 'Analyzing diagnostic...') + '</div>';

      IgneaAI.generateRecommendations(lead).then(function(data) {
        var html = '';
        if (data.summary) {
          html += '<div class="ai-reco-summary">' + escHtml(data.summary) + '</div>';
        }
        html += '<div class="ai-reco-cards">';
        (data.recommendations || []).forEach(function(rec) {
          html += '<div class="ai-reco-card">' +
            '<div class="ai-reco-card-top">' +
              '<div class="ai-reco-title">' + escHtml(rec.title) + '</div>' +
              '<div class="ai-reco-priority priority-' + (rec.priority || 'media') + '">' + escHtml(rec.priority || '') + '</div>' +
            '</div>' +
            '<div class="ai-reco-desc">' + escHtml(rec.description) + '</div>' +
            '<div class="ai-reco-meta">' +
              '<span class="ai-reco-stat">' + (rec.hours_recovered_weekly || 0) + ' hrs/' + (lang === 'es' ? 'semana recuperadas' : 'week recovered') + '</span>' +
              '<span class="ai-reco-stat dim">' + (rec.implementation_weeks || 0) + ' ' + (lang === 'es' ? 'semanas impl.' : 'weeks impl.') + '</span>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';

        // Save button
        html += '<button class="btn-ghost" style="margin-top:12px;width:100%" id="saveRecosBtn">' +
          (lang === 'es' ? 'Guardar recomendaciones en lead' : 'Save recommendations to lead') + '</button>';

        recoResultsDiv.innerHTML = html;
        btnRecos.disabled = false;

        var saveBtn = recoResultsDiv.querySelector('#saveRecosBtn');
        if (saveBtn) {
          saveBtn.addEventListener('click', function() {
            saveLeadField(lead.id, 'recommendations', data.recommendations);
            logActivity(lead.id, 'ai_recommendations', (data.recommendations || []).length + ' recommendations generated');
            saveBtn.textContent = lang === 'es' ? 'Guardado ✓' : 'Saved ✓';
            saveBtn.disabled = true;
          });
        }
      }).catch(function(err) {
        recoResultsDiv.innerHTML = '<div class="ai-error">' + escHtml(err.message) + '</div>';
        btnRecos.disabled = false;
      });
    });

    aiRecoSection.appendChild(btnRecos);
    aiRecoSection.appendChild(recoResultsDiv);

    // ── AI: Generate Proposal ──
    var btnProposal = document.createElement('button');
    btnProposal.className = 'btn-gradient';
    btnProposal.style.width = '100%';
    btnProposal.style.marginBottom = '8px';
    btnProposal.textContent = lang === 'es' ? 'Generar propuesta / MOU →' : 'Generate proposal / MOU →';
    var proposalResultsDiv = document.createElement('div');

    btnProposal.addEventListener('click', function() {
      btnProposal.disabled = true;
      proposalResultsDiv.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div>' +
        (lang === 'es' ? 'Redactando propuesta personalizada...' : 'Drafting personalized proposal...') + '</div>';

      // Get calculator data if available
      var calcData = null;
      if (typeof OpsCalculator !== 'undefined' && OpsCalculator._lastResult) {
        calcData = OpsCalculator._lastResult;
      }

      IgneaAI.generateProposal(lead, calcData).then(function(text) {
        logActivity(lead.id, 'ai_proposal', 'Proposal/MOU generated');
        var proposalText = text;
        var previewDiv = document.createElement('div');
        previewDiv.className = 'ai-proposal-preview';
        previewDiv.textContent = proposalText;

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'ai-proposal-actions';

        var btnPdfProp = document.createElement('button');
        btnPdfProp.className = 'btn-gradient';
        btnPdfProp.textContent = lang === 'es' ? 'Descargar PDF' : 'Download PDF';
        btnPdfProp.addEventListener('click', function() {
          IgneaAI.generateProposalPDF(proposalText, lead);
        });

        var btnCopy = document.createElement('button');
        btnCopy.className = 'btn-ghost';
        btnCopy.textContent = lang === 'es' ? 'Copiar texto' : 'Copy text';
        btnCopy.addEventListener('click', function() {
          navigator.clipboard.writeText(proposalText).then(function() {
            btnCopy.textContent = lang === 'es' ? 'Copiado ✓' : 'Copied ✓';
            setTimeout(function() { btnCopy.textContent = lang === 'es' ? 'Copiar texto' : 'Copy text'; }, 2000);
          });
        });

        var btnEdit = document.createElement('button');
        btnEdit.className = 'btn-ghost';
        btnEdit.textContent = lang === 'es' ? 'Editar' : 'Edit';
        btnEdit.addEventListener('click', function() {
          // Replace preview with editable textarea
          proposalResultsDiv.innerHTML = '';
          var textarea = document.createElement('textarea');
          textarea.className = 'ai-proposal-edit';
          textarea.value = proposalText;
          proposalResultsDiv.appendChild(textarea);

          var editActions = document.createElement('div');
          editActions.className = 'ai-proposal-actions';

          var btnSaveEdit = document.createElement('button');
          btnSaveEdit.className = 'btn-gradient';
          btnSaveEdit.textContent = lang === 'es' ? 'Descargar PDF editado' : 'Download edited PDF';
          btnSaveEdit.addEventListener('click', function() {
            IgneaAI.generateProposalPDF(textarea.value, lead);
          });

          var btnCopyEdit = document.createElement('button');
          btnCopyEdit.className = 'btn-ghost';
          btnCopyEdit.textContent = lang === 'es' ? 'Copiar texto editado' : 'Copy edited text';
          btnCopyEdit.addEventListener('click', function() {
            navigator.clipboard.writeText(textarea.value).then(function() {
              btnCopyEdit.textContent = lang === 'es' ? 'Copiado ✓' : 'Copied ✓';
              setTimeout(function() { btnCopyEdit.textContent = lang === 'es' ? 'Copiar texto editado' : 'Copy edited text'; }, 2000);
            });
          });

          editActions.appendChild(btnSaveEdit);
          editActions.appendChild(btnCopyEdit);
          proposalResultsDiv.appendChild(editActions);
        });

        actionsDiv.appendChild(btnPdfProp);
        actionsDiv.appendChild(btnCopy);
        actionsDiv.appendChild(btnEdit);

        proposalResultsDiv.innerHTML = '';
        proposalResultsDiv.appendChild(previewDiv);
        proposalResultsDiv.appendChild(actionsDiv);
        btnProposal.disabled = false;
      }).catch(function(err) {
        proposalResultsDiv.innerHTML = '<div class="ai-error">' + escHtml(err.message) + '</div>';
        btnProposal.disabled = false;
      });
    });

    aiRecoSection.appendChild(btnProposal);
    aiRecoSection.appendChild(proposalResultsDiv);
    tabActions.appendChild(aiRecoSection);

    // Stage change section
    var stageSection = document.createElement('div');
    stageSection.className = 'detail-section';
    stageSection.style.marginTop = '24px';
    var stageLabel = document.createElement('div');
    stageLabel.className = 'detail-section-tag';
    stageLabel.textContent = lang === 'es' ? '// Cambiar etapa' : '// Change stage';
    stageSection.appendChild(stageLabel);

    var stageWrap = document.createElement('div');
    stageWrap.className = 'detail-stage-actions';
    var stageIdx = STAGE_FLOW.indexOf(currentStage);

    STAGE_FLOW.forEach(function(stage, idx) {
      if (stage === currentStage) return;
      var btn = document.createElement('button');
      btn.className = 'btn-ghost btn-sm';
      btn.textContent = getStageLabel(stage);
      btn.addEventListener('click', function() {
        changeLeadStage(lead.id, stage);
      });
      stageWrap.appendChild(btn);
    });
    stageSection.appendChild(stageWrap);
    tabActions.appendChild(stageSection);

    // Priority change
    var actionPrioritySection = document.createElement('div');
    actionPrioritySection.className = 'detail-section';
    actionPrioritySection.style.marginTop = '16px';
    var actionPriorityLabel = document.createElement('div');
    actionPriorityLabel.className = 'detail-section-tag';
    actionPriorityLabel.textContent = lang === 'es' ? '// Prioridad' : '// Priority';
    actionPrioritySection.appendChild(actionPriorityLabel);

    var actionPrioritySelect = document.createElement('select');
    actionPrioritySelect.className = 'form-input';
    ['hot', 'high', 'medium', 'low'].forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if ((lead.priority || 'medium') === p) opt.selected = true;
      actionPrioritySelect.appendChild(opt);
    });
    actionPrioritySelect.addEventListener('change', function() {
      lead.priority = actionPrioritySelect.value;
      saveLeadField(lead.id, 'priority', actionPrioritySelect.value);
      // Sync the summary tab priority select
      if (prioritySelect) prioritySelect.value = actionPrioritySelect.value;
    });
    actionPrioritySection.appendChild(actionPrioritySelect);
    tabActions.appendChild(actionPrioritySection);

    // Activity log
    var activitySection = document.createElement('div');
    activitySection.className = 'detail-section';
    activitySection.style.marginTop = '24px';
    var activityTag = document.createElement('div');
    activityTag.className = 'detail-section-tag';
    activityTag.textContent = IgneaI18n.t('ops.detail.activity') || '// Actividad';
    activitySection.appendChild(activityTag);

    var activityLog = document.createElement('div');
    activityLog.id = 'activityLog';
    activityLog.textContent = '...';
    activitySection.appendChild(activityLog);
    tabActions.appendChild(activitySection);

    loadActivityLog(lead.id, activityLog);

    content.appendChild(tabActions);

    // ── Setup tab switching ──
    setupDetailTabs(content);
  }

  function setupDetailTabs(container) {
    var tabs = container.querySelectorAll('.detail-tab');
    var panels = container.querySelectorAll('.detail-tab-content');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-dtab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        panels.forEach(function(p) {
          p.style.display = p.getAttribute('data-dtab') === target ? 'block' : 'none';
        });
      });
    });
  }

  function generateDiagnosticPDF(lead) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) { alert('jsPDF not loaded'); return; }
    var doc = new jsPDF();
    var lang = (typeof IgneaI18n !== 'undefined' && IgneaI18n.getLang) ? IgneaI18n.getLang() : 'es';
    var y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('IGNEA LABS', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(lang === 'es' ? 'Diagnóstico de Preparación Digital' : 'Digital Readiness Diagnostic', 20, y);

    // Client
    y += 16;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text((lead.first_name || '') + ' ' + (lead.last_name || ''), 20, y);
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(lead.company_name || '', 20, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(new Date().toLocaleDateString(lang === 'es' ? 'es-PR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 20, y);

    // Score
    y += 16;
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(String(lead.total_score || 0), 20, y);
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('/ 100', 55, y);
    y += 8;
    doc.setFontSize(11);
    var levelMap = { critical: lang === 'es' ? 'Crítico' : 'Critical', developing: lang === 'es' ? 'En Desarrollo' : 'Developing', competent: lang === 'es' ? 'Competente' : 'Competent', advanced: lang === 'es' ? 'Avanzado' : 'Advanced' };
    doc.text(levelMap[lead.score_level] || '', 20, y);

    // Dimensions
    y += 14;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(lang === 'es' ? 'DESGLOSE POR DIMENSIÓN' : 'DIMENSION BREAKDOWN', 20, y);
    y += 8;
    var dims = lead.score_breakdown || {};
    var dimLabels = lang === 'es'
      ? ['Interacción con clientes', 'Madurez de procesos', 'Presencia digital', 'Uso de datos', 'Preparación IA']
      : ['Customer interaction', 'Process maturity', 'Digital presence', 'Data utilization', 'AI readiness'];
    var dimKeys = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
    for (var i = 0; i < dimKeys.length; i++) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(dimLabels[i] + ': ' + (dims[dimKeys[i]] || 0) + '/20', 24, y);
      y += 6;
    }

    // Answers
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(lang === 'es' ? 'RESPUESTAS DEL DIAGNÓSTICO' : 'DIAGNOSTIC ANSWERS', 20, y);
    y += 8;
    var answers = lead.diagnostic_answers || {};
    var qLabels = lang === 'es'
      ? ['Negocio', 'Empleados', 'Tareas que consumen tiempo', 'Horas en consultas', 'Presencia digital', 'Gestión de agenda', 'Herramientas actuales', 'Familiaridad con IA', 'Cuello de botella', 'Automatización deseada', 'Ingresos mensuales']
      : ['Business', 'Employees', 'Time-consuming tasks', 'Hours on inquiries', 'Digital presence', 'Scheduling', 'Current tools', 'AI familiarity', 'Bottleneck', 'Desired automation', 'Monthly revenue'];
    for (var q = 1; q <= 11; q++) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Q' + q + ': ' + (qLabels[q - 1] || ''), 24, y);
      y += 5;
      doc.setTextColor(0);
      var answer = answers['q' + q];
      if (answer === undefined || answer === null) answer = '—';
      if (typeof answer === 'object') answer = Array.isArray(answer) ? answer.join(', ') : JSON.stringify(answer);
      var lines = doc.splitTextToSize(String(answer), 160);
      doc.text(lines, 28, y);
      y += lines.length * 5 + 4;
    }

    // Footer
    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generado por Ignea Labs — ignealabs.ai@gmail.com', 20, y);
    doc.text(lang === 'es' ? 'Este documento es confidencial.' : 'This document is confidential.', 20, y + 4);

    doc.save('Diagnostico_' + (lead.company_name || 'Lead').replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  function saveLeadField(leadId, fieldKey, value) {
    (async function() {
      try {
        var now = new Date().toISOString();
        var updateObj = {};
        updateObj[fieldKey] = value;
        updateObj.updated_at = now;

        await IgneaSupabase.client
          .from('leads')
          .update(updateObj)
          .eq('id', leadId);

        // Update local cache
        var lead = OpsDashboard.getAllLeads().find(function(l) {
          return String(l.id) === String(leadId);
        });
        if (lead) {
          lead[fieldKey] = value;
          lead.updated_at = now;
        }

        // Persist local submissions back to localStorage
        if (lead && lead._local) {
          try {
            var subs = JSON.parse(localStorage.getItem('ignea_submissions') || '[]');
            var sub = subs.find(function(s) { return s.id === leadId; });
            if (sub) {
              if (fieldKey === 'pipeline_stage') sub.pipeline_stage = value;
              else if (fieldKey === 'notes') sub.notes = value;
              else sub[fieldKey] = value;
              localStorage.setItem('ignea_submissions', JSON.stringify(subs));
            }
          } catch(e) {}
        }

        var user = OpsAuth.getUser();
        if (user) {
          await IgneaSupabase.client
            .from('lead_activity')
            .insert({
              lead_id: leadId,
              user_id: user.id,
              action: 'field_edit',
              details: fieldKey + ' actualizado'
            });
        }
      } catch (e) {
        // Silently fail
      }
    })();
  }

  function changeLeadStage(leadId, newStage) {
    var lead = OpsDashboard.getAllLeads().find(function(l) {
      return String(l.id) === String(leadId);
    });
    if (!lead) return;

    var oldStage = lead.pipeline_stage;
    var now = new Date().toISOString();

    (async function() {
      try {
        await IgneaSupabase.client
          .from('leads')
          .update({ pipeline_stage: newStage, updated_at: now })
          .eq('id', leadId);

        var user = OpsAuth.getUser();
        if (user) {
          await IgneaSupabase.client
            .from('lead_activity')
            .insert({
              lead_id: leadId,
              user_id: user.id,
              action: 'stage_change',
              details: oldStage + ' → ' + newStage
            });
        }

        lead.pipeline_stage = newStage;
        lead.updated_at = now;

        if (typeof IgneaSheetsSync !== 'undefined' && IgneaSheetsSync.sync) {
          IgneaSheetsSync.sync(Object.assign({}, lead)).catch(function() {});
        }

        OpsDashboard.refresh();
        renderTable(getFilters());
        openDetail(leadId);
      } catch (e) {
        // Silently fail
      }
    })();
  }

  function logActivity(leadId, action, details) {
    (async function() {
      try {
        var user = typeof OpsAuth !== 'undefined' && OpsAuth.getUser ? OpsAuth.getUser() : null;
        await IgneaSupabase.client
          .from('lead_activity')
          .insert({
            lead_id: leadId,
            user_id: user ? user.id : null,
            action: action,
            details: details || ''
          });
      } catch (e) {
        // Best-effort logging
      }
    })();
  }

  function loadActivityLog(leadId, container) {
    (async function() {
      try {
        var result = await IgneaSupabase.client
          .from('lead_activity')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: true });

        if (result.error) throw result.error;

        var activities = result.data || [];
        container.innerHTML = '';

        if (!activities.length) {
          container.textContent = IgneaI18n.t('ops.detail.noActivity') || 'Sin actividad registrada.';
          return;
        }

        activities.forEach(function(act) {
          var item = document.createElement('div');
          item.className = 'activity-item';

          var dateStr = act.created_at ? act.created_at.substring(0, 10) : '';
          item.innerHTML =
            '<span class="activity-date">' + escHtml(dateStr) + '</span>' +
            '<span class="activity-action">' + escHtml(act.action || '') + '</span>' +
            '<span class="activity-details">' + escHtml(act.details || '') + '</span>';

          container.appendChild(item);
        });
      } catch (e) {
        container.textContent = '';
      }
    })();
  }

  function closeDetail() {
    var panel = document.getElementById('detailPanel');
    if (panel) {
      panel.classList.remove('open');
      // Restore hidden after transition completes
      setTimeout(function() {
        if (!panel.classList.contains('open')) {
          panel.setAttribute('hidden', '');
        }
      }, 350);
    }

    var overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.remove('visible');

    currentDetailId = null;
  }

  function switchToTab(tabName) {
    var tabs = document.querySelectorAll('.ops-tab[data-tab]');
    var panels = ['pipeline', 'leads', 'calculator', 'scraper'];

    tabs.forEach(function(tab) {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    panels.forEach(function(name) {
      var panel = document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1));
      if (panel) panel.style.display = name === tabName ? 'block' : 'none';
    });
  }

  function getStageLabel(stage) {
    var i18nKey = STAGE_I18N_MAP[stage];
    if (i18nKey) return IgneaI18n.t(i18nKey) || stage;
    return stage || '';
  }

  function getScoreLevel(score) {
    if (score <= 25) return 'critical';
    if (score <= 50) return 'developing';
    if (score <= 75) return 'competent';
    return 'advanced';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    init: init,
    openDetail: openDetail,
    renderTable: renderTable,
    generateDiagnosticPDF: generateDiagnosticPDF
  };

})();
