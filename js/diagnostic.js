/* ============================================================
   IGNEA LABS — Diagnostic Survey v3.0
   11 questions, dual-mode UX, 4 value streams.
   Flow: Landing(0) → Info(1) → Q1-Q4(2-5) → Transition(6) →
         Q5-Q11(7-13) → Processing(14)
   ============================================================ */

(function() {
  var currentScreen = 0;
  var totalQ = 11;
  var answers = {};

  // Screen sequence: goTo index → data-q on .q-screen
  var SEQ = [
    null,          // 0 = landing
    null,          // 1 = info
    '1','2','3','4',  // 2-5 = Q1-Q4
    'transition',     // 6
    '5','6','7','8','9','10','11', // 7-13 = Q5-Q11
    null           // 14 = processing
  ];

  function screenToQNum(idx) {
    if (idx >= 2 && idx <= 5) return idx - 1;
    if (idx >= 7 && idx <= 13) return idx - 2;
    return 0;
  }

  var landingScreen, infoScreen, processingScreen, transitionScreen;
  var progWrap, progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    landingScreen    = document.getElementById('landingScreen');
    infoScreen       = document.getElementById('infoScreen');
    processingScreen = document.getElementById('processingScreen');
    transitionScreen = document.querySelector('.q-screen[data-q="transition"]');
    progWrap = document.getElementById('progressWrap');
    progBar  = document.getElementById('progFill');
    progText = document.getElementById('progText');

    // Restore progress
    restoreProgress();

    // Landing start
    var startBtn = document.getElementById('landingStartBtn');
    if (startBtn) startBtn.addEventListener('click', function() { goTo(1); });

    // Info next/prev
    var infoNext = document.getElementById('infoNextBtn');
    if (infoNext) infoNext.addEventListener('click', function() {
      if (validateInfo()) goTo(2);
    });
    var infoPrev = document.querySelector('#infoScreen .btn-prev');
    if (infoPrev) infoPrev.addEventListener('click', function() { goTo(0); });

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

    // Q2 time slider
    var slider = document.getElementById('q2Slider');
    var sliderVal = document.getElementById('q2SliderVal');
    var sliderFte = document.getElementById('q2Fte');
    if (slider) {
      answers.q2_slider = parseInt(slider.value);
      slider.addEventListener('input', function() {
        var v = parseInt(this.value);
        answers.q2_slider = v;
        updateSliderDisplay(v);
        saveProgress();
        updateNav();
      });
      updateSliderDisplay(parseInt(slider.value));
    }

    // Next buttons
    document.querySelectorAll('.q-screen .btn-next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (currentScreen === 13) {
          submitDiag();
        } else {
          goTo(currentScreen + 1);
        }
      });
    });

    // Prev buttons
    document.querySelectorAll('.q-screen .btn-prev').forEach(function(btn) {
      btn.addEventListener('click', function() {
        goTo(currentScreen - 1);
      });
    });

    // Enter to advance
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && currentScreen >= 2 && currentScreen <= 13) {
        var nextBtn = document.querySelector('.q-wrap.active .btn-next');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      }
    });

    updateInfoBtn();
  });

  function updateSliderDisplay(v) {
    var valEl = document.getElementById('q2SliderVal');
    var fteEl = document.getElementById('q2Fte');
    var lang = typeof IgneaI18n !== 'undefined' ? IgneaI18n.getLang() : 'es';
    var unit = lang === 'es' ? ' hrs/semana' : ' hrs/week';
    if (valEl) valEl.textContent = v + unit;
    if (fteEl) {
      var fte = Math.round((v / 40) * 10) / 10;
      fteEl.textContent = fte + (lang === 'es'
        ? ' empleados de tiempo completo dedicados a trabajo repetitivo'
        : ' full-time employees dedicated to repetitive work');
    }
  }

  /* ---- Navigation ---- */

  function goTo(n) {
    currentScreen = n;
    var allScreens = document.querySelectorAll('.q-screen');

    if (landingScreen) landingScreen.classList.remove('active');
    if (infoScreen) infoScreen.classList.remove('active');
    if (processingScreen) processingScreen.classList.remove('active');
    allScreens.forEach(function(s) { s.classList.remove('active'); });

    if (n === 0) {
      if (landingScreen) landingScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'hidden';
    } else if (n === 1) {
      if (infoScreen) infoScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      if (progBar) progBar.style.width = '0%';
      if (progText) progText.textContent = '0 / ' + totalQ;
    } else if (n === 6) {
      if (transitionScreen) transitionScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      if (progBar) progBar.style.width = Math.round((4 / totalQ) * 100) + '%';
      if (progText) progText.textContent = '4 / ' + totalQ;
    } else if (n === 14) {
      if (processingScreen) processingScreen.classList.add('active');
      if (progBar) progBar.style.width = '100%';
    } else if (n >= 2 && n <= 13) {
      var dq = SEQ[n];
      var target = document.querySelector('.q-screen[data-q="' + dq + '"]');
      if (target) target.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      var qNum = screenToQNum(n);
      if (progBar) progBar.style.width = Math.round((qNum / totalQ) * 100) + '%';
      if (progText) progText.textContent = qNum + ' / ' + totalQ;
    }

    renderStepProgress(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateNav();
  }

  function renderStepProgress(n) {
    var stepEl = document.getElementById('stepProgress');
    var topBar = document.getElementById('progressBarTop');

    if (n <= 1) {
      if (stepEl) stepEl.style.display = 'none';
      if (topBar) topBar.style.width = '0';
      return;
    }

    var qNum = screenToQNum(n);
    if (n === 6) qNum = 4;
    if (n === 14) qNum = totalQ;

    if (qNum > 0 && qNum <= totalQ && stepEl) {
      stepEl.style.display = 'flex';
      var html = '';
      for (var i = 0; i < totalQ; i++) {
        var cls = 'step-dot';
        if (i < qNum - 1) cls += ' completed';
        if (i === qNum - 1) cls += ' active';
        html += '<div class="' + cls + '"></div>';
        if (i < totalQ - 1) {
          html += '<div class="step-line' + (i < qNum - 1 ? ' completed' : '') + '"></div>';
        }
      }
      stepEl.innerHTML = html;
    }

    if (topBar) topBar.style.width = Math.round((qNum / totalQ) * 100) + '%';

    if (n === 14 && stepEl) stepEl.style.display = 'none';
  }

  /* ---- Validation ---- */

  function updateInfoBtn() {
    var btn = document.getElementById('infoNextBtn');
    if (btn) btn.disabled = !validateInfo();
  }

  function validateInfo() {
    var f = document.getElementById('dxFirstName');
    var e = document.getElementById('dxEmail');
    var c = document.getElementById('dxCompany');
    return f && f.value.trim() && e && e.value.trim() && c && c.value.trim();
  }

  function updateNav() {
    var active = document.querySelector('.q-wrap.active');
    if (!active) return;
    var nextBtn = active.querySelector('.btn-next');
    if (!nextBtn) return;

    if (currentScreen === 6) { nextBtn.disabled = false; return; }

    if (currentScreen >= 2 && currentScreen <= 13) {
      nextBtn.disabled = !isAnswered(currentScreen);
    }
  }

  function isAnswered(screenIdx) {
    var dq = SEQ[screenIdx];
    if (!dq || dq === 'transition') return true;

    // Check for any content: text, cards, or card
    var textKey = 'q' + dq + '_text';
    var cardsKey = 'q' + dq + '_cards';
    var cardKey = 'q' + dq + '_card';

    var hasText = (answers[textKey] || '').trim().length >= 2;
    var hasCards = answers[cardsKey] && answers[cardsKey].length > 0;
    var hasCard = answers[cardKey] !== undefined;
    var hasSlider = dq === '2'; // Q2 always has slider

    // Q11 requires 10+ chars
    if (dq === '11') {
      return (answers.q11_text || '').trim().length >= 10;
    }

    return hasText || hasCards || hasCard || hasSlider;
  }

  /* ---- Progressive save ---- */

  function saveProgress() {
    sessionStorage.setItem('ignea_diagnostic_answers', JSON.stringify(answers));
  }

  function restoreProgress() {
    var saved = sessionStorage.getItem('ignea_diagnostic_answers');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !parsed.contact) {
          answers = parsed;
          restoreUI();
        }
      } catch (e) {}
    }
  }

  function restoreUI() {
    // Restore textareas
    document.querySelectorAll('.q-textarea[data-q]').forEach(function(ta) {
      var key = ta.getAttribute('data-q');
      if (answers[key]) ta.value = answers[key];
    });

    // Restore multi-select cards
    document.querySelectorAll('.q-cards[data-type="multi"]').forEach(function(group) {
      var key = group.getAttribute('data-q');
      var vals = answers[key] || [];
      group.querySelectorAll('.q-card').forEach(function(card) {
        if (vals.indexOf(card.getAttribute('data-val')) !== -1) {
          card.classList.add('selected');
        }
      });
    });

    // Restore single-select cards
    document.querySelectorAll('.q-cards[data-type="single"]').forEach(function(group) {
      var key = group.getAttribute('data-q');
      var val = answers[key];
      if (val !== undefined) {
        group.querySelectorAll('.q-card').forEach(function(card) {
          if (card.getAttribute('data-val') === String(val)) {
            card.classList.add('selected');
          }
        });
      }
    });

    // Restore slider
    var slider = document.getElementById('q2Slider');
    if (slider && answers.q2_slider !== undefined) {
      slider.value = answers.q2_slider;
      updateSliderDisplay(answers.q2_slider);
    }
  }

  /* ---- Submit ---- */

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

    var fullData = { answers: answers, contact: contact };
    sessionStorage.setItem('ignea_diagnostic_answers', JSON.stringify(fullData));

    var formData = {
      size_index: ['1-5', '6-15', '16-50', '50+'].indexOf(contact.size),
      revenue_index: parseInt(contact.revenue) || 5
    };

    try {
      var result = IgneaScoring.calculate(answers);
      var recos  = IgneaScoring.getRecommendations(result.streams);
      var roi    = IgneaScoring.calculateROI(answers, formData);

      var scoreData = {
        streams: result.streams,
        scores:  result.streams,
        total:   result.total,
        level:   result.level,
        recommendations: recos,
        roi: roi
      };
      sessionStorage.setItem('ignea_diagnostic_scores', JSON.stringify(scoreData));
    } catch (e) {
      sessionStorage.setItem('ignea_diagnostic_scores', JSON.stringify({
        streams: {}, scores: {}, total: 0, level: 'developing', recommendations: [], roi: {}
      }));
    }

    // Supabase
    if (typeof IgneaSupabase !== 'undefined' && IgneaSupabase.client) {
      try {
        var sd = JSON.parse(sessionStorage.getItem('ignea_diagnostic_scores'));
        IgneaSupabase.client.from('leads').insert([{
          first_name: contact.first_name, last_name: contact.last_name,
          email: contact.email, phone: contact.phone,
          company_name: contact.company, position: contact.position,
          industry: contact.industry, company_size: contact.size,
          company_website: contact.website, company_linkedin: contact.linkedin,
          diagnostic_answers: answers, total_score: sd.total,
          score_breakdown: sd.streams, score_level: sd.level,
          recommendations: sd.recommendations, roi_estimate: sd.roi,
          pipeline_stage: 'new', priority: 'medium'
        }]).then(function() {
          if (typeof IgneaSheetsSync !== 'undefined') IgneaSheetsSync.sync(contact);
        });
      } catch (e) {}
    }

    showProcessing();
  }

  function showProcessing() {
    goTo(14);
    var msgs = document.querySelectorAll('.proc-msg');
    var delay = 0;
    msgs.forEach(function(msg) {
      setTimeout(function() { msg.classList.add('visible'); }, delay);
      delay += 1200;
    });
    setTimeout(function() {
      window.location.href = 'results.html';
    }, delay + 800);
  }
})();
