/* ============================================================
   IGNEA LABS — Pre-Call Intake Form v1.0
   Linear 5-screen flow: Landing → Info → Q1-Q4 → Success
   No scoring. No branching. Just collect and submit.
   ============================================================ */

(function() {
  var currentScreen = 0;
  var totalScreens = 6; // 0=landing, 1=info, 2-5=questions, 6=success
  var answers = {};

  // Screen sequence: index → data-q attribute on .q-screen (null = non-question screen)
  // 0=landing, 1=info, 2=Q4(headache), 3=Q5+Q6(time+tools), 4=Q7+Q8(tried+budget), 5=Q9(wildcard), 6=success
  var TOTAL_STEPS = 5; // progress bar steps (info + 4 question screens)

  var landingScreen, infoScreen, successScreen;
  var progWrap, progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    landingScreen = document.getElementById('landingScreen');
    infoScreen    = document.getElementById('infoScreen');
    successScreen = document.getElementById('successScreen');
    progWrap = document.getElementById('progressWrap');
    progBar  = document.getElementById('progFill');
    progText = document.getElementById('progText');

    // Restore progress
    restoreProgress();

    // Landing start
    var startBtn = document.getElementById('landingStartBtn');
    if (startBtn) startBtn.addEventListener('click', function() {
      if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('intake_started');
      goTo(1);
    });

    // Info next/prev
    var infoNext = document.getElementById('infoNextBtn');
    if (infoNext) infoNext.addEventListener('click', function() {
      if (validateInfo()) {
        if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('intake_info_completed');
        goTo(2);
      }
    });
    var infoPrev = document.querySelector('#infoScreen .btn-prev');
    if (infoPrev) infoPrev.addEventListener('click', function() { goTo(0); });

    // Required fields enable info button
    ['dxFirstName', 'dxEmail', 'dxCompany'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateInfoBtn);
    });

    // Card click handlers — multi-select
    document.querySelectorAll('.q-cards[data-type="multi"] .q-card').forEach(function(card) {
      card.addEventListener('click', function() {
        this.classList.toggle('selected');
        var group = this.closest('.q-cards');
        var qKey = group.getAttribute('data-q');
        var selected = [];
        group.querySelectorAll('.q-card.selected').forEach(function(c) {
          selected.push(c.getAttribute('data-val'));
        });
        answers[qKey] = selected;
        saveProgress();
        updateNav();
      });
    });

    // Card click handlers — single-select
    document.querySelectorAll('.q-cards[data-type="single"] .q-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var group = this.closest('.q-cards');
        group.querySelectorAll('.q-card').forEach(function(c) { c.classList.remove('selected'); });
        this.classList.add('selected');
        var qKey = group.getAttribute('data-q');
        answers[qKey] = this.getAttribute('data-val');
        saveProgress();
        updateNav();
      });
    });

    // Textarea handlers
    document.querySelectorAll('.q-textarea').forEach(function(ta) {
      ta.addEventListener('input', function() {
        var qKey = this.getAttribute('data-q');
        if (qKey) answers[qKey] = this.value;
        saveProgress();
        updateNav();
      });
    });

    // Next buttons
    document.querySelectorAll('.q-screen .btn-next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var screen = this.closest('.q-screen');
        var dq = screen.getAttribute('data-q');
        var idx = getScreenIndex(dq);

        // Last question screen → submit
        if (dq === '4') {
          submitIntake();
        } else {
          goTo(idx + 1);
        }
      });
    });

    // Prev buttons
    document.querySelectorAll('.q-screen .btn-prev').forEach(function(btn) {
      btn.addEventListener('click', function() {
        goTo(currentScreen - 1);
      });
    });

    // Fixed nav bar buttons
    var fixedNext = document.getElementById('fixedNextBtn');
    var fixedPrev = document.getElementById('fixedPrevBtn');
    if (fixedNext) fixedNext.addEventListener('click', function() {
      var active = document.querySelector('.q-wrap.active');
      if (!active) return;
      if (active.id === 'infoScreen') {
        var infoBtn = document.getElementById('infoNextBtn');
        if (infoBtn && !infoBtn.disabled) infoBtn.click();
      } else {
        var nextBtn = active.querySelector('.btn-next');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      }
    });
    if (fixedPrev) fixedPrev.addEventListener('click', function() {
      goTo(currentScreen - 1);
    });

    // Enter to advance
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && currentScreen >= 2 && currentScreen <= 5) {
        var active = document.querySelector('.q-wrap.active');
        if (active) {
          var nextBtn = active.querySelector('.btn-next');
          if (nextBtn && !nextBtn.disabled) nextBtn.click();
        }
      }
    });

    updateInfoBtn();
  });

  function getScreenIndex(dq) {
    // Map data-q values to screen indices
    var map = { '1': 2, '2': 3, '3': 4, '4': 5 };
    return map[dq] || 0;
  }

  function getAllScreens() {
    var screens = [];
    screens.push(document.getElementById('landingScreen'));   // 0
    screens.push(document.getElementById('infoScreen'));       // 1
    screens.push(document.querySelector('[data-q="1"]'));      // 2
    screens.push(document.querySelector('[data-q="2"]'));      // 3
    screens.push(document.querySelector('[data-q="3"]'));      // 4
    screens.push(document.querySelector('[data-q="4"]'));      // 5
    screens.push(document.getElementById('successScreen'));    // 6
    return screens;
  }

  function goTo(idx) {
    if (idx < 0 || idx > 6) return;
    var screens = getAllScreens();

    // Hide all
    screens.forEach(function(s) {
      if (s) s.classList.remove('active');
    });

    // Show target
    var target = screens[idx];
    if (target) {
      target.classList.add('active');
      // Force reflow for animation
      void target.offsetWidth;
    }

    currentScreen = idx;
    updateProgressBar();
    updateNav();
    if (typeof window.syncFixedNav === 'function') window.syncFixedNav();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save current position
    try { sessionStorage.setItem('ignea_intake_screen', idx); } catch(e) {}
  }

  function updateProgressBar() {
    if (!progWrap || !progBar || !progText) return;

    if (currentScreen === 0 || currentScreen === 6) {
      progWrap.style.visibility = 'hidden';
      return;
    }
    progWrap.style.visibility = 'visible';

    // Screen 1 = step 1, screen 2 = step 2, etc.
    var step = currentScreen;
    var pct = Math.round((step / TOTAL_STEPS) * 100);
    progBar.style.width = pct + '%';
    var padded = step < 10 ? '0' + step : '' + step;
    var totalPadded = TOTAL_STEPS < 10 ? '0' + TOTAL_STEPS : '' + TOTAL_STEPS;
    progText.textContent = padded + ' / ' + totalPadded;
  }

  function updateNav() {
    var screens = getAllScreens();
    for (var i = 2; i <= 5; i++) {
      var screen = screens[i];
      if (!screen) continue;
      var nextBtn = screen.querySelector('.btn-next');
      if (!nextBtn) continue;

      var dq = screen.getAttribute('data-q');
      var valid = false;

      if (dq === '1') {
        // Q4: headache textarea required
        valid = !!(answers.q4_headache && answers.q4_headache.trim().length > 5);
      } else if (dq === '2') {
        // Q5+Q6: at least one card selected in time leaks
        valid = !!(answers.q5_timeleaks && answers.q5_timeleaks.length > 0);
      } else if (dq === '3') {
        // Q7: tried before (optional text) — always valid
        valid = true;
      } else if (dq === '4') {
        // Q9: always valid (optional)
        valid = true;
      }

      nextBtn.disabled = !valid;
    }

    if (typeof window.syncFixedNav === 'function') window.syncFixedNav();
  }

  function validateInfo() {
    var name = (document.getElementById('dxFirstName') || {}).value || '';
    var email = (document.getElementById('dxEmail') || {}).value || '';
    var company = (document.getElementById('dxCompany') || {}).value || '';
    if (!name.trim() || !email.trim() || !company.trim()) return false;
    if (email.indexOf('@') === -1) return false;
    return true;
  }

  function updateInfoBtn() {
    var btn = document.getElementById('infoNextBtn');
    if (btn) btn.disabled = !validateInfo();
    if (typeof window.syncFixedNav === 'function') window.syncFixedNav();
  }

  function saveProgress() {
    try {
      sessionStorage.setItem('ignea_intake_answers', JSON.stringify(answers));
    } catch(e) {}
  }

  function restoreProgress() {
    try {
      var saved = sessionStorage.getItem('ignea_intake_answers');
      if (saved) {
        answers = JSON.parse(saved);

        // Restore card selections
        Object.keys(answers).forEach(function(key) {
          var val = answers[key];
          var group = document.querySelector('.q-cards[data-q="' + key + '"]');
          if (!group) return;

          if (Array.isArray(val)) {
            val.forEach(function(v) {
              var card = group.querySelector('.q-card[data-val="' + v + '"]');
              if (card) card.classList.add('selected');
            });
          } else if (typeof val === 'string' && group.getAttribute('data-type') === 'single') {
            var card = group.querySelector('.q-card[data-val="' + val + '"]');
            if (card) card.classList.add('selected');
          }
        });

        // Restore textareas
        document.querySelectorAll('.q-textarea[data-q]').forEach(function(ta) {
          var key = ta.getAttribute('data-q');
          if (answers[key]) ta.value = answers[key];
        });
      }

      // Restore screen position
      var savedScreen = sessionStorage.getItem('ignea_intake_screen');
      if (savedScreen && parseInt(savedScreen) > 0 && parseInt(savedScreen) < 6) {
        goTo(parseInt(savedScreen));
      }
    } catch(e) {}

    updateNav();
  }

  function submitIntake() {
    var formData = {
      first_name: (document.getElementById('dxFirstName') || {}).value || '',
      email: (document.getElementById('dxEmail') || {}).value || '',
      company_name: (document.getElementById('dxCompany') || {}).value || '',
      phone: (document.getElementById('dxPhone') || {}).value || '',
      industry: (document.getElementById('dxIndustry') || {}).value || '',
      company_size: (document.getElementById('dxSize') || {}).value || '',
    };

    var payload = {
      created_at: new Date().toISOString(),
      language: (typeof IgneaI18n !== 'undefined' ? IgneaI18n.getLang() : 'es'),
      contact_name: formData.first_name,
      contact_email: formData.email,
      contact_phone: formData.phone,
      company_name: formData.company_name,
      industry: formData.industry,
      company_size: formData.company_size,
      headache: answers.q4_headache || '',
      time_leaks: (answers.q5_timeleaks || []).join(', '),
      tools: (answers.q6_tools || []).join(', '),
      tried_before: answers.q7_tried || '',
      wildcard: answers.q9_wildcard || '',
      source: 'intake_form'
    };

    // Save to Supabase
    if (typeof IgneaSupabase !== 'undefined') {
      IgneaSupabase.client.from('leads').insert(payload).then(function(result) {
        if (result.error) {
          console.error('Supabase insert error:', result.error);
        }
      });
    }

    // Mirror to Google Sheets
    if (typeof IgneaSheetsSync !== 'undefined') {
      IgneaSheetsSync.sync(payload);
    }

    // Analytics
    if (typeof IgneaAnalytics !== 'undefined') {
      IgneaAnalytics.track('intake_completed', {
        industry: formData.industry,
        size: formData.company_size
      });
    }

    // Clear session
    try {
      sessionStorage.removeItem('ignea_intake_answers');
      sessionStorage.removeItem('ignea_intake_screen');
    } catch(e) {}

    // Go to success
    goTo(6);
  }

})();
