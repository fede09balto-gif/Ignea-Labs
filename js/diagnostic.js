/* ============================================================
   ONDA AI — Diagnostic Survey Flow (v2 — dual-mode, 10 questions)
   Flow: Landing (0) → Info (1) → Q1-Q10 (2-11) → Processing (12) → results.html

   Answer storage:
     Multi-select: answers.q1_cards = [0, 3, 5]   (array of selected indices)
     Single-select: answers.q2_card = 1            (single index or undefined)
     Open text: answers.q1_text = "..."
     Q10 text only: answers.q10_text = "..."

   Scoring compatibility: legacy keys (q5, q6, q7, q8) are kept in sync
   so OndaScoring.calculate() still works without modification.
   ============================================================ */

(function() {
  var currentQ = 0;
  var totalQ = 10;
  var answers = {};

  var landingScreen, infoScreen, questionScreens, processingScreen;
  var progWrap, progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    landingScreen    = document.getElementById('landingScreen');
    infoScreen       = document.getElementById('infoScreen');
    processingScreen = document.getElementById('processingScreen');
    questionScreens  = document.querySelectorAll('.q-screen');
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
    ['dxFirstName', 'dxEmail', 'dxCompany'].forEach(function(id) {
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
        answers[qKey + '_card'] = parseInt(this.getAttribute('data-val'));
        syncLegacyKeys(qKey, answers[qKey + '_card']);
        saveProgress();
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
        answers[qKey + '_cards'] = selected;
        syncLegacyKeys(qKey, selected);
        saveProgress();
        updateNav();
      });
    });

    // Textarea handlers (open text fields)
    document.querySelectorAll('.q-textarea').forEach(function(ta) {
      ta.addEventListener('input', function() {
        var qKey = this.getAttribute('data-q');
        answers[qKey] = this.value;
        saveProgress();
        updateNav();
      });
    });

    // Question nav — next buttons
    document.querySelectorAll('.q-screen .btn-next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var qNum = parseInt(this.closest('.q-screen').getAttribute('data-q'));
        if (qNum === totalQ) {
          submitDiag();
        } else {
          goTo(currentQ + 1);
        }
      });
    });

    // Question nav — prev buttons
    document.querySelectorAll('.q-screen .btn-prev').forEach(function(btn) {
      btn.addEventListener('click', function() { goTo(currentQ - 1); });
    });

    // Keyboard: Enter to advance
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && currentQ >= 2 && currentQ <= 11) {
        var nextBtn = document.querySelector('.q-wrap.active .btn-next');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      }
    });

    // Initial state
    updateInfoBtn();
  });

  /* ----------------------------------------------------------
     syncLegacyKeys: keep answers.q5 / q6 / q7 / q8 in sync
     so OndaScoring.calculate() works without changes.
     Mapping:
       Q7 (new) = digital presence → maps to old q5 (website)
       Q6 (new) = tech stack       → maps to old q7 (tools)
       Q8 (new) = AI familiarity   → maps to old q8
     ---------------------------------------------------------- */
  function syncLegacyKeys(qKey, val) {
    if (qKey === 'q7') {
      // Q7 single-select: 0=none, 1=social only, 2=site no leads, 3=site some, 4=site main
      // Map to old q5: 0=none, 1=no leads, 2=some, 3=main
      var legacyMap = [0, 1, 1, 2, 3];
      answers.q5 = legacyMap[val] !== undefined ? legacyMap[val] : 0;
    }
    if (qKey === 'q6') {
      // Q6 multi-select indices map to old q7 tool indices:
      // new: 0=none, 1=social, 2=WA Business, 3=Excel, 4=accounting, 5=CRM, 6=POS, 7=other
      // old: 0=None, 1=Social, 2=WA Business, 3=Excel, 4=Accounting, 5=CRM, 6=POS, 7=Other
      answers.q7 = val; // Same indices — direct pass-through
    }
    if (qKey === 'q8') {
      // Q8 single: 0=never heard, 1=heard, 2=tried, 3=regular, 4=integrated
      // Old q8: 0=never heard, 1=heard, 2=tried, 3=regular
      answers.q8 = Math.min(val, 3);
    }
  }

  /* ----------------------------------------------------------
     goTo: navigate to screen n
  ---------------------------------------------------------- */
  function goTo(n) {
    currentQ = n;

    if (landingScreen) landingScreen.classList.remove('active');
    if (infoScreen) infoScreen.classList.remove('active');
    questionScreens.forEach(function(s) { s.classList.remove('active'); });
    if (processingScreen) processingScreen.classList.remove('active');

    if (n === 0) {
      landingScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'hidden';
    } else if (n === 1) {
      infoScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      if (progBar) progBar.style.width = '0%';
      if (progText) progText.textContent = '0 / ' + totalQ;
    } else if (n >= 2 && n <= 11) {
      // n=2 → data-q="1", n=11 → data-q="10"
      var qNum = n - 1;
      var target = document.querySelector('.q-screen[data-q="' + qNum + '"]');
      if (target) target.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      var pct = Math.round((qNum / totalQ) * 100);
      if (progBar) progBar.style.width = pct + '%';
      if (progText) progText.textContent = qNum + ' / ' + totalQ;
    } else if (n === 12) {
      processingScreen.classList.add('active');
      if (progBar) progBar.style.width = '100%';
    }

    renderStepProgress(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateNav();
  }

  /* ----------------------------------------------------------
     renderStepProgress: dots + top bar
  ---------------------------------------------------------- */
  function renderStepProgress(n) {
    var stepContainer = document.getElementById('stepProgress');
    var topBar = document.getElementById('progressBarTop');

    if (n <= 1) {
      if (stepContainer) stepContainer.style.display = 'none';
      if (topBar) topBar.style.width = '0';
      return;
    }

    if (n >= 2 && n <= 11) {
      var qNum = n - 1;
      var currentStep = qNum - 1;

      if (stepContainer) {
        stepContainer.style.display = 'flex';
        var html = '';
        for (var i = 0; i < totalQ; i++) {
          var dotClass = 'step-dot';
          if (i < currentStep) dotClass += ' completed';
          if (i === currentStep) dotClass += ' active';
          html += '<div class="' + dotClass + '"></div>';
          if (i < totalQ - 1) {
            var lineClass = 'step-line';
            if (i < currentStep) lineClass += ' completed';
            html += '<div class="' + lineClass + '"></div>';
          }
        }
        stepContainer.innerHTML = html;
      }

      if (topBar) topBar.style.width = Math.round((qNum / totalQ) * 100) + '%';
    }

    if (n === 12) {
      if (stepContainer) stepContainer.style.display = 'none';
      if (topBar) topBar.style.width = '100%';
    }
  }

  /* ----------------------------------------------------------
     Info screen validation
  ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     updateNav: enable/disable the active screen's next button
  ---------------------------------------------------------- */
  function updateNav() {
    var active = document.querySelector('.q-wrap.active');
    if (!active) return;
    var nextBtn = active.querySelector('.btn-next');
    if (!nextBtn) return;

    var valid = false;
    if (currentQ >= 2 && currentQ <= 11) {
      var qNum = currentQ - 1;
      valid = isAnswered(qNum);
    }

    nextBtn.disabled = !valid;
  }

  /* ----------------------------------------------------------
     isAnswered: check if question qNum has any content
  ---------------------------------------------------------- */
  function isAnswered(n) {
    if (n === 10) {
      // Text-only, min 10 chars
      var txt = answers['q10_text'] || '';
      return txt.trim().length >= 10;
    }
    // Q1-Q9: card selected OR text has any content
    var cardsKey = 'q' + n + '_cards';
    var cardKey  = 'q' + n + '_card';
    var textKey  = 'q' + n + '_text';

    var hasCard  = (answers[cardsKey] && answers[cardsKey].length > 0) ||
                   (answers[cardKey] !== undefined);
    var hasText  = (answers[textKey] || '').trim().length > 0;
    return hasCard || hasText;
  }

  /* ----------------------------------------------------------
     saveProgress: persist answers to sessionStorage
  ---------------------------------------------------------- */
  function saveProgress() {
    sessionStorage.setItem('onda_diagnostic_progress', JSON.stringify(answers));
  }

  /* ----------------------------------------------------------
     submitDiag: score, save, and redirect
  ---------------------------------------------------------- */
  function submitDiag() {
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

    Object.keys(contact).forEach(function(k) {
      if (typeof contact[k] === 'string') contact[k] = contact[k].trim();
    });

    var formData = {
      size_index:    ['1-5', '6-15', '16-50', '50+'].indexOf(contact.size),
      revenue_index: parseInt(contact.revenue) || 5
    };

    var data = { answers: answers, contact: contact };
    sessionStorage.setItem('onda_diagnostic_answers', JSON.stringify(data));

    var result = OndaScoring.calculate(answers);
    var recos  = OndaScoring.getRecommendations(result.streams);
    var roi    = OndaScoring.calculateROI(answers, formData, result.streams);

    var scoreData = {
      streams:         result.streams,
      scores:          result.streams,
      total:           result.total,
      level:           result.level,
      recommendations: recos,
      roi:             roi
    };
    sessionStorage.setItem('onda_diagnostic_scores', JSON.stringify(scoreData));

    // Supabase write (fire-and-forget)
    if (typeof OndaSupabase !== 'undefined' && OndaSupabase.client) {
      try {
        var leadData = {
          first_name:          contact.first_name,
          last_name:           contact.last_name,
          email:               contact.email,
          phone:               contact.phone,
          company_name:        contact.company,
          position:            contact.position,
          industry:            contact.industry,
          company_size:        contact.size,
          company_website:     contact.website,
          company_linkedin:    contact.linkedin,
          diagnostic_answers:  answers,
          total_score:         result.total,
          score_breakdown:     result.streams,
          score_level:         result.level,
          recommendations:     recos,
          roi_estimate:        roi,
          pipeline_stage:      'new',
          priority:            'medium'
        };
        OndaSupabase.client.from('leads').insert([leadData]).then(function() {
          if (typeof OndaSheetsSync !== 'undefined') OndaSheetsSync.sync(leadData);
        });
      } catch(e) {}
    }

    showProcessing();
  }

  /* ----------------------------------------------------------
     showProcessing: animate messages, then redirect
  ---------------------------------------------------------- */
  function showProcessing() {
    goTo(12);

    var msgs = document.querySelectorAll('.proc-msg');
    var delay = 0;
    msgs.forEach(function(msg) {
      setTimeout(function() {
        msg.classList.add('visible');
      }, delay);
      delay += 1200;
    });

    setTimeout(function() {
      window.location.href = 'results.html';
    }, delay + 800);
  }
})();
