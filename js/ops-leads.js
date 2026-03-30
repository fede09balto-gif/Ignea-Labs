/* ============================================================
   ONDA AI — Ops Leads Module
   Lead table with filters, detail panel, inline editing.
   ============================================================ */

var OpsLeads = (function() {

  var currentDetailId = null;
  var debounceTimer = null;

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
    { key: 'last_name',         label: 'Apellido' },
    { key: 'email',             label: 'Email' },
    { key: 'phone',             label: 'Teléfono' },
    { key: 'company_name',      label: 'Empresa' },
    { key: 'position',          label: 'Cargo' },
    { key: 'industry',          label: 'Industria' },
    { key: 'company_size',      label: 'Tamaño empresa' },
    { key: 'company_website',   label: 'Sitio web' },
    { key: 'company_linkedin',  label: 'LinkedIn' },
    { key: 'annual_revenue',    label: 'Ingresos anuales' }
  ];

  var DIMENSION_LABELS = {
    customerInteraction: 'Interacción cliente',
    processMaturity:     'Madurez procesos',
    digitalPresence:     'Presencia digital',
    dataUtilization:     'Uso de datos',
    aiReadiness:         'Preparación IA'
  };

  function init() {
    setupFilters();
    renderTable({});

    var closeBtn = document.getElementById('detailClose');
    if (closeBtn) closeBtn.addEventListener('click', closeDetail);
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

  function renderTable(filters) {
    var leads = OpsDashboard.getAllLeads();
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

    filtered.sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    var tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

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
    var lead = OpsDashboard.getAllLeads().find(function(l) {
      return String(l.id) === String(leadId);
    });
    if (!lead) return;

    currentDetailId = leadId;

    var panel = document.getElementById('detailPanel');
    if (panel) panel.classList.add('open');

    populateDetail(lead);
  }

  function populateDetail(lead) {
    var content = document.getElementById('detailContent');
    if (!content) return;

    content.innerHTML = '';

    // Section 1: Contact Info
    var sec1 = document.createElement('div');
    sec1.className = 'detail-section';

    var tag1 = document.createElement('div');
    tag1.className = 'detail-section-tag';
    tag1.setAttribute('data-i18n', 'ops.detail.contact');
    tag1.textContent = OndaI18n.t('ops.detail.contact') || '// Contacto';
    sec1.appendChild(tag1);

    CONTACT_FIELDS.forEach(function(fieldDef) {
      var fieldDiv = document.createElement('div');
      fieldDiv.className = 'detail-field';

      var label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = fieldDef.label;

      var input = document.createElement('input');
      input.className = 'form-input detail-edit';
      input.setAttribute('data-field', fieldDef.key);
      input.value = lead[fieldDef.key] || '';

      input.addEventListener('blur', function() {
        var fieldKey = this.getAttribute('data-field');
        var newValue = this.value;
        saveLeadField(lead.id, fieldKey, newValue);
      });

      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      sec1.appendChild(fieldDiv);
    });

    content.appendChild(sec1);

    // Section 2: Diagnostic Summary
    var sec2 = document.createElement('div');
    sec2.className = 'detail-section';

    var tag2 = document.createElement('div');
    tag2.className = 'detail-section-tag';
    tag2.textContent = OndaI18n.t('ops.detail.diagnostic') || '// Diagnóstico';
    sec2.appendChild(tag2);

    var score = lead.total_score || 0;
    var level = getScoreLevel(score);

    var scoreEl = document.createElement('div');
    scoreEl.className = 'detail-score';
    scoreEl.textContent = score + ' / 100';
    sec2.appendChild(scoreEl);

    var levelEl = document.createElement('div');
    levelEl.className = 'detail-level';
    var levelBadge = document.createElement('span');
    levelBadge.className = 'score-badge score-' + level;
    levelBadge.textContent = level;
    levelEl.appendChild(levelBadge);
    sec2.appendChild(levelEl);

    // Dimension bars
    var scores = lead.scores_json || {};
    Object.keys(DIMENSION_LABELS).forEach(function(dim) {
      var dimScore = Number(scores[dim]) || 0;
      var dimPct = Math.round((dimScore / 20) * 100);

      var row = document.createElement('div');
      row.className = 'bd-row';
      row.innerHTML =
        '<div class="bd-label">' + escHtml(DIMENSION_LABELS[dim]) + '</div>' +
        '<div class="bd-bar-wrap">' +
          '<div class="bd-bar" style="width:' + dimPct + '%"></div>' +
        '</div>' +
        '<div class="bd-val">' + dimScore + '/20</div>';
      sec2.appendChild(row);
    });

    // Recommendations
    var recos = lead.recommendations_json || [];
    if (recos.length) {
      var recoList = document.createElement('ul');
      recoList.className = 'detail-recos';
      recos.forEach(function(r) {
        var li = document.createElement('li');
        li.textContent = OndaI18n.t('reco.' + r.key) || r.key;
        li.className = 'reco-' + (r.priority || 'medium');
        recoList.appendChild(li);
      });
      sec2.appendChild(recoList);
    }

    content.appendChild(sec2);

    // Section 3: Scraper Results
    var sec3 = document.createElement('div');
    sec3.className = 'detail-section';

    var tag3 = document.createElement('div');
    tag3.className = 'detail-section-tag';
    tag3.textContent = OndaI18n.t('ops.detail.scraper') || '// Datos del Scraper';
    sec3.appendChild(tag3);

    if (lead.scraper_data) {
      try {
        var scraperData = typeof lead.scraper_data === 'string'
          ? JSON.parse(lead.scraper_data)
          : lead.scraper_data;

        Object.keys(scraperData).forEach(function(key) {
          var card = document.createElement('div');
          card.className = 'scraper-card';
          card.innerHTML =
            '<span class="scraper-key">' + escHtml(key) + '</span>' +
            '<span class="scraper-val">' + escHtml(String(scraperData[key])) + '</span>';
          sec3.appendChild(card);
        });
      } catch (e) {
        var noData = document.createElement('div');
        noData.className = 'detail-empty';
        noData.textContent = OndaI18n.t('ops.detail.noData') || 'Sin datos';
        sec3.appendChild(noData);
      }
    } else {
      var noScraper = document.createElement('div');
      noScraper.className = 'detail-empty';
      noScraper.textContent = OndaI18n.t('ops.detail.noData') || 'Sin datos';
      sec3.appendChild(noScraper);
    }

    content.appendChild(sec3);

    // Section 4: Notes
    var sec4 = document.createElement('div');
    sec4.className = 'detail-section';

    var tag4 = document.createElement('div');
    tag4.className = 'detail-section-tag';
    tag4.textContent = OndaI18n.t('ops.detail.notes') || '// Notas';
    sec4.appendChild(tag4);

    var textarea = document.createElement('textarea');
    textarea.className = 'form-input detail-notes';
    textarea.id = 'detailNotes';
    textarea.value = lead.notes || '';

    textarea.addEventListener('blur', function() {
      saveLeadField(lead.id, 'notes', this.value);
    });

    sec4.appendChild(textarea);
    content.appendChild(sec4);

    // Section 5: Activity Log
    var sec5 = document.createElement('div');
    sec5.className = 'detail-section';

    var tag5 = document.createElement('div');
    tag5.className = 'detail-section-tag';
    tag5.textContent = OndaI18n.t('ops.detail.activity') || '// Actividad';
    sec5.appendChild(tag5);

    var activityLog = document.createElement('div');
    activityLog.id = 'activityLog';
    activityLog.textContent = '...';
    sec5.appendChild(activityLog);

    content.appendChild(sec5);

    loadActivityLog(lead.id, activityLog);

    // Section 6: Action Buttons
    var sec6 = document.createElement('div');
    sec6.className = 'detail-section detail-actions';

    var btnCalc = document.createElement('button');
    btnCalc.className = 'btn-ghost';
    btnCalc.textContent = OndaI18n.t('ops.detail.goCalc') || 'Calcular Precio →';
    btnCalc.addEventListener('click', function() {
      switchToTab('calculator');
      document.dispatchEvent(new CustomEvent('onda:prefill:calculator', { detail: lead }));
    });

    var btnScraper = document.createElement('button');
    btnScraper.className = 'btn-ghost';
    btnScraper.textContent = OndaI18n.t('ops.detail.goScraper') || 'Ejecutar Scraper →';
    btnScraper.addEventListener('click', function() {
      switchToTab('scraper');
      document.dispatchEvent(new CustomEvent('onda:prefill:scraper', { detail: lead }));
    });

    sec6.appendChild(btnCalc);
    sec6.appendChild(btnScraper);

    // Stage change buttons
    var currentStage = lead.pipeline_stage;
    var stageIdx = STAGE_FLOW.indexOf(currentStage);

    var stageWrap = document.createElement('div');
    stageWrap.className = 'detail-stage-actions';

    if (stageIdx > 0) {
      var btnPrev = document.createElement('button');
      btnPrev.className = 'btn-ghost';
      btnPrev.textContent = '← ' + getStageLabel(STAGE_FLOW[stageIdx - 1]);
      btnPrev.addEventListener('click', function() {
        changeLeadStage(lead.id, STAGE_FLOW[stageIdx - 1]);
      });
      stageWrap.appendChild(btnPrev);
    }

    if (stageIdx < STAGE_FLOW.length - 1) {
      var btnNext = document.createElement('button');
      btnNext.className = 'btn-primary';
      btnNext.textContent = getStageLabel(STAGE_FLOW[stageIdx + 1]) + ' →';
      btnNext.addEventListener('click', function() {
        changeLeadStage(lead.id, STAGE_FLOW[stageIdx + 1]);
      });
      stageWrap.appendChild(btnNext);
    }

    sec6.appendChild(stageWrap);
    content.appendChild(sec6);
  }

  function saveLeadField(leadId, fieldKey, value) {
    (async function() {
      try {
        var now = new Date().toISOString();
        var updateObj = {};
        updateObj[fieldKey] = value;
        updateObj.updated_at = now;

        await OndaSupabase.client
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

        var user = OpsAuth.getUser();
        if (user) {
          await OndaSupabase.client
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
        await OndaSupabase.client
          .from('leads')
          .update({ pipeline_stage: newStage, updated_at: now })
          .eq('id', leadId);

        var user = OpsAuth.getUser();
        if (user) {
          await OndaSupabase.client
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

        if (typeof OndaSheetsSync !== 'undefined' && OndaSheetsSync.sync) {
          OndaSheetsSync.sync(Object.assign({}, lead)).catch(function() {});
        }

        OpsDashboard.refresh();
        renderTable(getFilters());
        openDetail(leadId);
      } catch (e) {
        // Silently fail
      }
    })();
  }

  function loadActivityLog(leadId, container) {
    (async function() {
      try {
        var result = await OndaSupabase.client
          .from('lead_activity')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: true });

        if (result.error) throw result.error;

        var activities = result.data || [];
        container.innerHTML = '';

        if (!activities.length) {
          container.textContent = OndaI18n.t('ops.detail.noActivity') || 'Sin actividad registrada.';
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
    if (panel) panel.classList.remove('open');
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
    if (i18nKey) return OndaI18n.t(i18nKey) || stage;
    return stage || '';
  }

  function getScoreLevel(score) {
    if (score <= 25) return 'critical';
    if (score <= 50) return 'developing';
    if (score <= 75) return 'competent';
    return 'advanced';
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
    renderTable: renderTable
  };

})();
