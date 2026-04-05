/* ============================================================
   IGNEA LABS — Admin Dashboard: Auth, Data Fetch, Stats
   ============================================================ */

var AdminDashboard = (function() {

  var failCount = 0;
  var clockInterval = null;
  var allSubmissions = [];

  function init() {
    document.addEventListener('DOMContentLoaded', function() {
      var token = sessionStorage.getItem('ignea_admin_token');
      if (token === 'authenticated') {
        showDashboard();
      } else {
        startGate();
      }
    });
  }

  function startGate() {
    var input = document.getElementById('accessInput');
    if (input) {
      input.focus();
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleAccess(input.value);
      });
    }
  }

  function handleAccess(value) {
    if (!value || !value.trim()) return;
    if (failCount >= 3) return;

    // Simple password gate — any non-empty input accepted (same as ops fallback)
    sessionStorage.setItem('ignea_admin_token', 'authenticated');
    showDashboard();
  }

  function showDashboard() {
    var gate = document.getElementById('accessGate');
    var wrap = document.getElementById('dashboardWrap');
    if (gate) gate.style.display = 'none';
    if (wrap) wrap.style.display = 'block';

    startClock();
    fetchSubmissions();

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('ignea_admin_token');
        window.location.reload();
      });
    }
  }

  function startClock() {
    function tick() {
      var el = document.getElementById('adminClock');
      if (!el) return;
      var now = new Date();
      var y = now.getFullYear();
      var mo = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      var h = String(now.getHours()).padStart(2, '0');
      var mi = String(now.getMinutes()).padStart(2, '0');
      var s = String(now.getSeconds()).padStart(2, '0');
      el.textContent = y + '-' + mo + '-' + d + ' ' + h + ':' + mi + ':' + s;
    }
    tick();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(tick, 1000);
  }

  function fetchSubmissions() {
    if (typeof IgneaSupabase === 'undefined') {
      renderEmpty('Supabase not configured');
      return;
    }

    IgneaSupabase.client
      .from('diagnostics')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function(res) {
        if (res.error) {
          renderEmpty('Error loading data: ' + (res.error.message || 'unknown'));
          return;
        }
        allSubmissions = res.data || [];
        renderStats(allSubmissions);
        if (typeof AdminSubmissions !== 'undefined') {
          AdminSubmissions.setData(allSubmissions);
          AdminSubmissions.render();
        }
      });
  }

  function renderStats(data) {
    var counts = { total: data.length, new: 0, reviewed: 0, proposal_sent: 0, closed_won: 0 };
    data.forEach(function(d) {
      var s = d.status || 'new';
      if (s === 'new') counts.new++;
      else if (s === 'reviewed' || s === 'analyzed') counts.reviewed++;
      else if (s === 'proposal_sent') counts.proposal_sent++;
      else if (s === 'closed_won') counts.closed_won++;
    });

    setText('statTotal', counts.total);
    setText('statNew', counts.new);
    setText('statReviewed', counts.reviewed);
    setText('statProposal', counts.proposal_sent);
    setText('statWon', counts.closed_won);
  }

  function renderEmpty(msg) {
    var el = document.getElementById('emptyState');
    var tbody = document.getElementById('submissionsBody');
    if (tbody) tbody.innerHTML = '';
    if (el) {
      el.style.display = 'block';
      var textEl = el.querySelector('.admin-empty-text');
      if (textEl && msg) textEl.textContent = msg;
    }
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function getSubmissions() {
    return allSubmissions;
  }

  function refreshSubmission(id, updates) {
    for (var i = 0; i < allSubmissions.length; i++) {
      if (allSubmissions[i].id === id) {
        for (var k in updates) {
          allSubmissions[i][k] = updates[k];
        }
        break;
      }
    }
    renderStats(allSubmissions);
  }

  init();

  return {
    getSubmissions: getSubmissions,
    refreshSubmission: refreshSubmission,
    fetchSubmissions: fetchSubmissions
  };

})();
