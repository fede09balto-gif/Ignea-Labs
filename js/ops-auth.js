/* ============================================================
   IGNEA LABS — Ops Auth Module
   Handles access gate, session management, tab navigation.
   ============================================================ */

var OpsAuth = (function() {

  var failCount = 0;
  var clockInterval = null;
  var currentUser = null;

  function init() {
    document.addEventListener('DOMContentLoaded', function() {
      // Check for existing session first
      var token = sessionStorage.getItem('ignea_ops_token');
      var userData = sessionStorage.getItem('ignea_ops_user');

      if (token && userData) {
        try {
          var user = JSON.parse(userData);
          showDashboard(user);
        } catch (e) {
          startGate();
        }
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
        if (e.key === 'Enter') {
          handleAccessAttempt(input.value);
        }
      });
    }

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  function handleAccessAttempt(value) {
    if (!value) return;
    if (failCount >= 3) return;

    fetch('/api/ops-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: value })
    }).then(function(res) {
      // The demo credential (scope 'demo') must NOT open the back office.
      // /api/ops-auth now returns a scope; anything but 'ops' is a denial
      // here, treated exactly like a wrong token.
      if (res.ok) {
        return res.json().then(function(data) {
          if (!data || data.scope !== 'ops') { handleFailedAttempt(); return null; }
          return data;
        });
      }
      return res.status === 401 ? Promise.resolve(false) : Promise.resolve(undefined);
    }).then(function(ok) {
      if (ok === null) return;
      if (ok === false) { handleFailedAttempt(); return; }
      if (ok === undefined) { showNetworkError(); return; }
      {
        var userData = {
          id: 'operator',
          name: 'Operador',
          email: '',
          role: 'admin',
          permissions: ['read', 'write']
        };
        sessionStorage.setItem('ignea_ops_token', value);
        sessionStorage.setItem('ignea_ops_user', JSON.stringify(userData));
        showDashboard(userData);
      }
    }).catch(function() {
      // The verification endpoint is unreachable — fail closed rather than
      // silently degrading. There is no local fallback path.
      showNetworkError();
    });
  }

  function showNetworkError() {
    var denied = document.getElementById('accessDenied');
    if (denied) {
      denied.textContent = (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t('ops.gate.network_error') : null) || 'No se pudo verificar la sesión.';
      denied.style.color = 'var(--coral, #F0997B)';
      denied.style.display = 'block';
    }
  }

  function handleFailedAttempt() {
    failCount++;

    var input = document.getElementById('accessInput');
    var denied = document.getElementById('accessDenied');
    var terminated = document.getElementById('accessTerminated');

    if (failCount >= 3) {
      if (input) input.style.display = 'none';
      if (denied) denied.style.display = 'none';
      if (terminated) {
        terminated.textContent = 'connection terminated';
        terminated.style.display = 'block';
      }

      setTimeout(function() {
        failCount = 0;
        if (input) {
          input.style.display = '';
          input.value = '';
          input.focus();
        }
        if (terminated) terminated.style.display = 'none';
        if (denied) denied.style.display = 'none';
      }, 30000);

      return;
    }

    if (denied) {
      denied.textContent = IgneaI18n.t('ops.access.denied') || 'acceso denegado';
      denied.style.color = 'var(--coral, #F0997B)';
      denied.style.display = 'block';

      setTimeout(function() {
        denied.style.display = 'none';
      }, 2000);
    }

    if (input) {
      input.classList.add('shake');
      input.value = '';
      input.focus();
      setTimeout(function() {
        input.classList.remove('shake');
      }, 500);
    }
  }

  function showDashboard(user) {
    currentUser = user;

    var gate = document.getElementById('accessGate');
    var wrap = document.getElementById('dashboardWrap');

    if (gate) gate.style.display = 'none';
    if (wrap) wrap.style.display = 'block';

    var nameEl = document.getElementById('opsUserName');
    var roleEl = document.getElementById('opsUserRole');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;

    startClock();
    initTabs();
    initDashboard();

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  function startClock() {
    function updateClock() {
      var el = document.getElementById('opsTime');
      if (!el) return;

      var now = new Date();
      var yyyy = now.getFullYear();
      var mm = String(now.getMonth() + 1).padStart(2, '0');
      var dd = String(now.getDate()).padStart(2, '0');
      var hh = String(now.getHours()).padStart(2, '0');
      var min = String(now.getMinutes()).padStart(2, '0');
      var ss = String(now.getSeconds()).padStart(2, '0');

      el.textContent = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':' + ss;
    }

    updateClock();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  }

  function initTabs() {
    var tabs = document.querySelectorAll('.ops-tab[data-tab]');
    var panels = {
      pipeline: document.getElementById('panelPipeline'),
      leads: document.getElementById('panelLeads'),
      calculator: document.getElementById('panelCalculator'),
      scraper: document.getElementById('panelScraper')
    };

    // Remove hidden attribute from all panels (hidden overrides display:block)
    Object.keys(panels).forEach(function(key) {
      if (panels[key]) {
        panels[key].removeAttribute('hidden');
        panels[key].style.display = 'none';
      }
    });
    if (panels.pipeline) panels.pipeline.style.display = 'block';

    // Set first tab active
    tabs.forEach(function(tab) {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === 'pipeline') {
        tab.classList.add('active');
      }
    });

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var targetTab = this.getAttribute('data-tab');

        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        Object.keys(panels).forEach(function(key) {
          if (panels[key]) panels[key].style.display = 'none';
        });

        if (panels[targetTab]) panels[targetTab].style.display = 'block';
      });
    });
  }

  function initDashboard() {
    if (typeof OpsDashboard !== 'undefined' && OpsDashboard.init) {
      OpsDashboard.init();
    }
    if (typeof OpsLeads !== 'undefined' && OpsLeads.init) {
      OpsLeads.init();
    }
    if (typeof OpsCalculator !== 'undefined' && OpsCalculator.init) {
      OpsCalculator.init();
    }
    if (typeof OpsScraper !== 'undefined' && OpsScraper.init) {
      OpsScraper.init();
    }
  }

  function logout() {
    sessionStorage.removeItem('ignea_ops_token');
    sessionStorage.removeItem('ignea_ops_user');
    window.location.reload();
  }

  function getUser() {
    if (currentUser) return currentUser;
    var userData = sessionStorage.getItem('ignea_ops_user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  init();

  return {
    init: init,
    showDashboard: showDashboard,
    getUser: getUser
  };

})();
