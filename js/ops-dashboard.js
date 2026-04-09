/* ============================================================
   IGNEA LABS — Ops Dashboard Module
   Pipeline board with drag-and-drop, stats bar.
   ============================================================ */

var OpsDashboard = (function() {

  var allLeads = [];

  var STAGES = [
    'new',
    'contacted',
    'meeting_scheduled',
    'proposal_sent',
    'negotiating',
    'closed_won',
    'closed_lost',
    'on_hold'
  ];

  var CLOSED_STAGES = ['closed_won', 'closed_lost'];

  function calculateScores(s) {
    var customer = 25, operations = 25, information = 25, growth = 25;
    var sinks = s.q3_timeSinks || s.timeSinks || [];
    var tools = s.q3_tools || s.currentTools || [];

    // Customer Flow: manual customer work = lower score
    if (sinks.indexOf('same_questions') !== -1) customer -= 8;
    if (sinks.indexOf('followups') !== -1) customer -= 7;
    if (sinks.indexOf('scheduling') !== -1) customer -= 5;
    customer = Math.max(0, customer);

    // Operations Flow: primitive tools = lower score
    operations = 5;
    if (tools.indexOf('accounting') !== -1) operations += 5;
    if (tools.indexOf('crm') !== -1) operations += 5;
    if (tools.indexOf('pos') !== -1) operations += 4;
    if (tools.indexOf('booking') !== -1) operations += 4;
    if (tools.indexOf('paper') !== -1) operations -= 3;
    operations = Math.max(0, Math.min(25, operations));

    // Information Flow: data tools present?
    information = 3;
    if (tools.indexOf('accounting') !== -1) information += 6;
    if (tools.indexOf('crm') !== -1) information += 6;
    if (tools.indexOf('pos') !== -1) information += 5;
    if (tools.indexOf('excel') !== -1) information += 3;
    information = Math.max(0, Math.min(25, information));

    // Growth Flow: team size + website presence
    var size = s.teamSize || s.company_size || '';
    var website = s.website || '';
    growth = 8;
    if (website) growth += 6;
    if (size === '16-50' || size === '50+') growth += 4;
    if (s.revenue === '15k50k' || s.revenue === 'over50k') growth += 4;
    growth = Math.max(0, Math.min(25, growth));

    var total = customer + operations + information + growth;
    return {
      total: total,
      customerFlow: customer,
      operationsFlow: operations,
      informationFlow: information,
      growthFlow: growth
    };
  }

  function getLocalSubmissions() {
    try {
      var subs = JSON.parse(localStorage.getItem('ignea_submissions') || '[]');
      return subs.map(function(s) {
        var scores = calculateScores(s);
        return {
          id: s.id,
          created_at: s.timestamp,
          updated_at: s.timestamp,
          first_name: s.name || '',
          last_name: '',
          email: s.email || '',
          phone: s.whatsapp || '',
          company_name: s.company || '',
          company_website: s.website || '',
          company_linkedin: s.linkedin || '',
          industry: s.industry || '',
          company_size: s.teamSize || '',
          revenue: s.revenue || '',
          pipeline_stage: s.pipeline_stage || s.status || 'new',
          priority: 'medium',
          total_score: scores.total,
          score_breakdown: scores,
          deal_value: null,
          notes: s.notes || '',
          diagnostic_answers: {
            q2_business: s.q2_businessDescription || s.businessDescription || '',
            q4_headache: s.q4_headache || s.headache || '',
            q5_timeleaks: s.q3_timeSinks || s.timeSinks || [],
            q6_tools: s.q3_tools || s.currentTools || [],
            q7_tried: s.q5_triedBefore || s.triedBefore || ''
          },
          opportunityCount: s.opportunityCount || 0,
          estimatedHoursLost: s.estimatedHoursLost || 0,
          source: 'intake_form',
          _local: true
        };
      });
    } catch(e) { return []; }
  }

  function init() {
    (async function() {
      var supabaseLeads = [];
      try {
        var result = await IgneaSupabase.client
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!result.error) {
          supabaseLeads = result.data || [];
        }
      } catch (e) {}

      // Merge: Supabase leads + localStorage submissions (dedup by email)
      var localSubs = getLocalSubmissions();
      var seenEmails = {};
      supabaseLeads.forEach(function(l) { if (l.email) seenEmails[l.email.toLowerCase()] = true; });

      var merged = supabaseLeads.slice();
      localSubs.forEach(function(s) {
        if (s.email && seenEmails[s.email.toLowerCase()]) return;
        merged.push(s);
        if (s.email) seenEmails[s.email.toLowerCase()] = true;
      });

      // Sort by created_at descending
      merged.sort(function(a, b) {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      allLeads = merged;
      renderPipeline();
      renderStats();
    })();
  }

  function renderPipeline() {
    var columns = document.querySelectorAll('.pipe-col[data-stage]');

    columns.forEach(function(col) {
      var body = col.querySelector('.pipe-col-body');
      var countEl = col.querySelector('.pipe-count');
      if (!body) return;

      var stage = col.getAttribute('data-stage');
      var stageLeads = allLeads.filter(function(lead) {
        return lead.pipeline_stage === stage;
      });

      body.innerHTML = '';

      stageLeads.forEach(function(lead) {
        body.appendChild(createCard(lead));
      });

      if (countEl) countEl.textContent = stageLeads.length;

      setupDropZone(body, stage);
    });
  }

  function getScoreLevel(score) {
    if (score <= 25) return 'critical';
    if (score <= 50) return 'developing';
    if (score <= 75) return 'competent';
    return 'advanced';
  }

  function createCard(lead) {
    var card = document.createElement('div');
    card.className = 'pipe-card';
    card.setAttribute('data-lead-id', lead.id);
    card.setAttribute('draggable', 'true');

    var days = Math.floor(
      (Date.now() - new Date(lead.updated_at || lead.created_at).getTime()) / 86400000
    );

    var score = lead.total_score || 0;
    var level = getScoreLevel(score);
    var priority = lead.priority || 'medium';
    var dealValue = lead.deal_value
      ? '$' + Number(lead.deal_value).toLocaleString()
      : '—';

    var oppCount = lead.opportunityCount || 0;
    var oppBadge = oppCount ? '<span style="font-family:var(--fm);font-size:11px;color:var(--accent);letter-spacing:.5px">' + oppCount + ' opp</span>' : '';

    card.innerHTML =
      '<div class="pipe-card-company">' + escHtml(lead.company_name || '') + '</div>' +
      '<div class="pipe-card-contact">' + escHtml((lead.first_name || '') + ' ' + (lead.last_name || '')) + '</div>' +
      '<div class="pipe-card-meta">' +
        '<span class="score-badge score-' + level + '">' + score + '</span>' +
        (dealValue !== '—' ? '<span class="pipe-card-value">' + dealValue + '</span>' : oppBadge) +
      '</div>' +
      '<div class="pipe-card-footer">' +
        '<span class="priority-dot priority-' + priority + '"></span>' +
        '<span class="pipe-card-days">' + days + 'd</span>' +
      '</div>';

    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', lead.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', function() {
      card.classList.remove('dragging');
    });

    // Open detail panel on click (not during drag)
    card.addEventListener('click', function() {
      if (card.classList.contains('dragging')) return;
      if (typeof OpsLeads !== 'undefined' && OpsLeads.openDetail) {
        OpsLeads.openDetail(lead.id);
      }
    });

    return card;
  }

  function setupDropZone(body, stage) {
    body.addEventListener('dragover', function(e) {
      e.preventDefault();
      body.classList.add('drag-over');
    });

    body.addEventListener('dragleave', function() {
      body.classList.remove('drag-over');
    });

    body.addEventListener('drop', function(e) {
      e.preventDefault();
      body.classList.remove('drag-over');

      var leadId = e.dataTransfer.getData('text/plain');
      if (!leadId) return;

      var lead = allLeads.find(function(l) { return String(l.id) === String(leadId); });
      if (!lead) return;

      var oldStage = lead.pipeline_stage;
      var newStage = stage;

      if (oldStage === newStage) return;

      var now = new Date().toISOString();

      // Always update local state first
      lead.pipeline_stage = newStage;
      lead.updated_at = now;
      renderPipeline();
      renderStats();

      // Then try Supabase (best-effort)
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

          if (typeof IgneaSheetsSync !== 'undefined' && IgneaSheetsSync.sync) {
            IgneaSheetsSync.sync(Object.assign({}, lead)).catch(function() {});
          }
        } catch (e) {
          // Supabase failed — local state already updated
        }
      })();
    });
  }

  function renderStats() {
    var activeLeads = allLeads.filter(function(l) {
      return CLOSED_STAGES.indexOf(l.pipeline_stage) === -1;
    });

    var totalValue = activeLeads.reduce(function(sum, l) {
      return sum + (Number(l.deal_value) || 0);
    }, 0);

    var avgScore = allLeads.length
      ? Math.round(allLeads.reduce(function(sum, l) {
          return sum + (Number(l.total_score) || 0);
        }, 0) / allLeads.length)
      : 0;

    var won = allLeads.filter(function(l) { return l.pipeline_stage === 'closed_won'; }).length;
    var lost = allLeads.filter(function(l) { return l.pipeline_stage === 'closed_lost'; }).length;
    var winRate = (won + lost) > 0
      ? Math.round((won / (won + lost)) * 100)
      : 0;

    var totalLeadsEl = document.getElementById('pipeStatTotal');
    var totalValueEl = document.getElementById('pipeStatValue');
    var wonEl = document.getElementById('pipeStatWon');
    var conversionEl = document.getElementById('pipeStatConversion');

    if (totalLeadsEl) totalLeadsEl.textContent = allLeads.length;
    if (totalValueEl) totalValueEl.textContent = '$' + totalValue.toLocaleString();
    if (wonEl) wonEl.textContent = won;
    if (conversionEl) conversionEl.textContent = winRate + '%';
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
    refresh: function() { init(); },
    getAllLeads: function() { return allLeads; }
  };

})();
