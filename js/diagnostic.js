/* ============================================================
   ONDA AI — Diagnostic Survey Flow
   Flow: Landing (0) → Info (1) → Q1-Q11 (2-12) → Processing (13) → results.html
   ============================================================ */

(function() {
  // currentQ: 0 = landing, 1 = info screen, 2-12 = questions 1-11, 13 = processing
  var currentQ = 0;
  var totalQ = 11;
  var answers = {};

  var landingScreen, infoScreen, questionScreens, processingScreen;
  var progWrap, progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    landingScreen   = document.getElementById('landingScreen');
    infoScreen      = document.getElementById('infoScreen');
    processingScreen = document.getElementById('processingScreen');
    questionScreens = document.querySelectorAll('.q-screen');
    progWrap = document.getElementById('progressWrap');
    progBar  = document.getElementById('progFill');
    progText = document.getElementById('progText');

    // Landing start button
    var landingStartBtn = document.getElementById('landingStartBtn');
    if (landingStartBtn) landingStartBtn.addEventListener('click', function() { goTo(1); });

    // Info next button
    var infoNextBtn = document.getElementById('infoNextBtn');
    if (infoNextBtn) infoNextBtn.addEventListener('click', function() {
      if (validateInfo()) goTo(2);
    });

    // Info prev button (back to landing)
    var infoEl = document.getElementById('infoScreen');
    if (infoEl) {
      var infoPrev = infoEl.querySelector('.btn-prev');
      if (infoPrev) infoPrev.addEventListener('click', function() { goTo(0); });
    }

    // Info field live validation
    var infoRequired = ['dxFirstName', 'dxEmail', 'dxCompany'];
    infoRequired.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateInfoBtn);
    });

    // MC single-select handlers
    document.querySelectorAll('.mc-group[data-type="single"] .mc-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        var group = this.closest('.mc-group');
        group.querySelectorAll('.mc-opt').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
        var qKey = group.getAttribute('data-q');
        answers[qKey] = parseInt(this.getAttribute('data-val'));
        updateNav();
      });
    });

    // MC multi-select handlers
    document.querySelectorAll('.mc-group[data-type="multi"] .mc-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        this.classList.toggle('selected');
        var group = this.closest('.mc-group');
        var qKey = group.getAttribute('data-q');
        var selected = [];
        group.querySelectorAll('.mc-opt.selected').forEach(function(o) {
          selected.push(parseInt(o.getAttribute('data-val')));
        });
        answers[qKey] = selected;
        updateNav();
      });
    });

    // Range slider
    var rangeInput = document.getElementById('rangeQ4');
    var rangeVal   = document.getElementById('rangeQ4Val');
    if (rangeInput && rangeVal) {
      // Pre-set default value
      answers.q4 = parseInt(rangeInput.value);
      rangeInput.addEventListener('input', function() {
        var v = parseInt(this.value);
        rangeVal.textContent = v + (v >= 80 ? '+' : '') + ' hrs';
        answers.q4 = v;
        updateNav();
      });
    }

    // Text inputs
    document.querySelectorAll('.q-text-input').forEach(function(input) {
      input.addEventListener('input', function() {
        var qKey = this.getAttribute('data-q');
        answers[qKey] = this.value.trim();
        updateNav();
      });
    });

    // Textarea inputs
    document.querySelectorAll('.q-textarea').forEach(function(input) {
      input.addEventListener('input', function() {
        var qKey = this.getAttribute('data-q');
        answers[qKey] = this.value.trim();
        updateNav();
      });
    });

    // Question nav next buttons
    document.querySelectorAll('.q-screen .btn-next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var qNum = parseInt(this.closest('.q-screen').getAttribute('data-q'));
        if (qNum === 11) {
          submitDiag();
        } else {
          goTo(currentQ + 1);
        }
      });
    });

    // Question nav prev buttons
    document.querySelectorAll('.q-screen .btn-prev').forEach(function(btn) {
      btn.addEventListener('click', function() { goTo(currentQ - 1); });
    });

    // Keyboard enter to advance (questions only)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && currentQ >= 2 && currentQ <= 12) {
        var nextBtn = document.querySelector('.q-wrap.active .btn-next');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      }
    });

    // Initial state
    updateInfoBtn();
  });

  function goTo(n) {
    currentQ = n;

    // Hide all screens
    if (landingScreen) landingScreen.classList.remove('active');
    if (infoScreen) infoScreen.classList.remove('active');
    questionScreens.forEach(function(s) { s.classList.remove('active'); });
    if (processingScreen) processingScreen.classList.remove('active');

    if (n === 0) {
      // Landing — hide progress
      landingScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'hidden';
    } else if (n === 1) {
      // Info screen — show progress at 0
      infoScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      if (progBar) progBar.style.width = '0%';
      if (progText) progText.textContent = '0 / ' + totalQ;
    } else if (n >= 2 && n <= 12) {
      // Question screen — n=2 maps to data-q="1", n=12 maps to data-q="11"
      var qNum = n - 1;
      var target = document.querySelector('.q-screen[data-q="' + qNum + '"]');
      if (target) target.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      var pct = Math.round((qNum / totalQ) * 100);
      if (progBar) progBar.style.width = pct + '%';
      if (progText) progText.textContent = qNum + ' / ' + totalQ;
    } else if (n === 13) {
      // Processing
      processingScreen.classList.add('active');
      if (progBar) progBar.style.width = '100%';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateNav();
  }

  function updateInfoBtn() {
    var btn = document.getElementById('infoNextBtn');
    if (!btn) return;
    btn.disabled = !validateInfo();
  }

  function validateInfo() {
    var first   = document.getElementById('dxFirstName');
    var email   = document.getElementById('dxEmail');
    var company = document.getElementById('dxCompany');
    return first && first.value.trim() &&
           email && email.value.trim() &&
           company && company.value.trim();
  }

  function updateNav() {
    var active = document.querySelector('.q-wrap.active');
    if (!active) return;
    var nextBtn = active.querySelector('.btn-next');
    if (!nextBtn) return;

    var valid = false;
    if (currentQ >= 2 && currentQ <= 12) {
      var qNum = currentQ - 1;
      valid = isAnswered(qNum);
    }

    nextBtn.disabled = !valid;
  }

  function isAnswered(n) {
    switch (n) {
      case 1: return !!answers.q1;
      case 2: return answers.q2 !== undefined;
      case 3: return !!answers.q3;
      case 4: return answers.q4 !== undefined;
      case 5: return answers.q5 !== undefined;
      case 6: return answers.q6 && answers.q6.length > 0;
      case 7: return answers.q7 && answers.q7.length > 0;
      case 8: return answers.q8 !== undefined;
      case 9: return !!answers.q9;
      case 10: return !!answers.q10;
      case 11: return answers.q11 !== undefined;
      default: return false;
    }
  }

  function submitDiag() {
    // Collect contact info from info screen
    var contact = {
      first_name: (document.getElementById('dxFirstName') || {}).value || '',
      last_name:  (document.getElementById('dxLastName')  || {}).value || '',
      email:      (document.getElementById('dxEmail')     || {}).value || '',
      phone:      (document.getElementById('dxPhone')     || {}).value || '',
      company:    (document.getElementById('dxCompany')   || {}).value || '',
      position:   (document.getElementById('dxPosition')  || {}).value || '',
      industry:   (document.getElementById('dxIndustry')  || {}).value || '',
      size:       (document.getElementById('dxSize')      || {}).value || '',
      website:    (document.getElementById('dxWebsite')   || {}).value || '',
      revenue:    (document.getElementById('dxRevenue')   || {}).value || '',
      linkedin:   (document.getElementById('dxLinkedin')  || {}).value || ''
    };

    // Trim all string values
    Object.keys(contact).forEach(function(k) {
      if (typeof contact[k] === 'string') contact[k] = contact[k].trim();
    });

    // Store answers + contact
    var data = { answers: answers, contact: contact };
    sessionStorage.setItem('onda_diagnostic_answers', JSON.stringify(data));

    // Calculate scores
    var result = OndaScoring.calculate(answers);
    var roi = OndaScoring.calculateROI(answers, result.scores);
    var recos = OndaScoring.getRecommendations(result.scores);

    var scoreData = {
      scores: result.scores,
      total: result.total,
      level: result.level,
      roi: roi,
      recommendations: recos
    };
    sessionStorage.setItem('onda_diagnostic_scores', JSON.stringify(scoreData));

    // Write to Supabase if available
    if (typeof OndaSupabase !== 'undefined' && OndaSupabase.client) {
      var leadData = {
        first_name:       contact.first_name,
        last_name:        contact.last_name,
        email:            contact.email,
        phone:            contact.phone,
        company_name:     contact.company,
        position:         contact.position,
        industry:         contact.industry,
        company_size:     contact.size,
        company_website:  contact.website,
        company_linkedin: contact.linkedin,
        diagnostic_answers: answers,
        total_score:      result.total,
        score_breakdown:  result.scores,
        score_level:      result.level,
        recommendations:  recos,
        roi_estimate:     roi,
        pipeline_stage:   'new',
        priority:         'medium'
      };

      try {
        OndaSupabase.client.from('leads').insert([leadData]).then(function() {
          if (typeof OndaSheetsSync !== 'undefined') {
            OndaSheetsSync.sync(leadData);
          }
        });
      } catch (e) {
        // Silent fail — sessionStorage still has the data
      }
    }

    // Show processing animation
    showProcessing();
  }

  function showProcessing() {
    goTo(13);

    // Animate processing messages
    var msgs = document.querySelectorAll('.proc-msg');
    var delay = 0;
    msgs.forEach(function(msg) {
      setTimeout(function() {
        msg.classList.add('visible');
      }, delay);
      delay += 1200;
    });

    // Redirect after animation
    setTimeout(function() {
      window.location.href = 'results.html';
    }, delay + 800);
  }
})();
