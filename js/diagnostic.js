/* ============================================================
   IGNEA LABS — Diagnostic Survey v4.0
   11 core questions + 3 industry-specific branching questions,
   dual-mode UX, 4 value streams, real-time money leak counter.
   Flow: Landing(0) → Info(1) → Q1-Q4(2-5) → [Ind1-Ind3(6-8)] →
         Transition(6|9) → Q5-Q11(7-13|10-16) → Processing(14|17)
   ============================================================ */

(function() {
  var currentScreen = 0;
  var totalQ = 11;
  var answers = {};
  var industryInjected = false;
  var selectedIndustry = '';

  // Screen sequence: goTo index → data-q on .q-screen
  // Will be rebuilt dynamically when industry questions are injected
  var SEQ = [
    null,          // 0 = landing
    null,          // 1 = info
    '1','2','3','4',  // 2-5 = Q1-Q4
    'transition',     // 6
    '5','6','7','8','9','10','11', // 7-13 = Q5-Q11
    null           // 14 = processing
  ];

  var INDUSTRY_QUESTIONS = {
    restaurant: [
      { id: 'ind_restaurant_q1', type: 'single', textKey: 'dx.ind.restaurant.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.restaurant.q1.c1' },
          { val: '1', labelKey: 'dx.ind.restaurant.q1.c2' },
          { val: '2', labelKey: 'dx.ind.restaurant.q1.c3' },
          { val: '3', labelKey: 'dx.ind.restaurant.q1.c4' }
        ]},
      { id: 'ind_restaurant_q2', type: 'multi', textKey: 'dx.ind.restaurant.q2.text',
        cards: [
          { val: 'orders_paper', labelKey: 'dx.ind.restaurant.q2.c1' },
          { val: 'kitchen_verbal', labelKey: 'dx.ind.restaurant.q2.c2' },
          { val: 'inventory_hand', labelKey: 'dx.ind.restaurant.q2.c3' },
          { val: 'menu_manual', labelKey: 'dx.ind.restaurant.q2.c4' },
          { val: 'delivery_phone', labelKey: 'dx.ind.restaurant.q2.c5' },
          { val: 'tips_manual', labelKey: 'dx.ind.restaurant.q2.c6' }
        ]},
      { id: 'ind_restaurant_q3', type: 'slider', textKey: 'dx.ind.restaurant.q3.text',
        sliderLabelKey: 'dx.ind.restaurant.q3.sliderLabel', min: 0, max: 100, step: 5, defaultVal: 30 }
    ],
    medical: [
      { id: 'ind_medical_q1', type: 'single', textKey: 'dx.ind.medical.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.medical.q1.c1' },
          { val: '1', labelKey: 'dx.ind.medical.q1.c2' },
          { val: '2', labelKey: 'dx.ind.medical.q1.c3' },
          { val: '3', labelKey: 'dx.ind.medical.q1.c4' }
        ]},
      { id: 'ind_medical_q2', type: 'multi', textKey: 'dx.ind.medical.q2.text',
        cards: [
          { val: 'intake_paper', labelKey: 'dx.ind.medical.q2.c1' },
          { val: 'reminders_phone', labelKey: 'dx.ind.medical.q2.c2' },
          { val: 'insurance_manual', labelKey: 'dx.ind.medical.q2.c3' },
          { val: 'labs_manual', labelKey: 'dx.ind.medical.q2.c4' },
          { val: 'prescriptions_manual', labelKey: 'dx.ind.medical.q2.c5' },
          { val: 'records_paper', labelKey: 'dx.ind.medical.q2.c6' }
        ]},
      { id: 'ind_medical_q3', type: 'slider', textKey: 'dx.ind.medical.q3.text',
        sliderLabelKey: 'dx.ind.medical.q3.sliderLabel', min: 0, max: 30, step: 1, defaultVal: 5 }
    ],
    legal: [
      { id: 'ind_legal_q1', type: 'single', textKey: 'dx.ind.legal.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.legal.q1.c1' },
          { val: '1', labelKey: 'dx.ind.legal.q1.c2' },
          { val: '2', labelKey: 'dx.ind.legal.q1.c3' },
          { val: '3', labelKey: 'dx.ind.legal.q1.c4' }
        ]},
      { id: 'ind_legal_q2', type: 'multi', textKey: 'dx.ind.legal.q2.text',
        cards: [
          { val: 'intake_conflicts', labelKey: 'dx.ind.legal.q2.c1' },
          { val: 'drafting_scratch', labelKey: 'dx.ind.legal.q2.c2' },
          { val: 'deadlines_manual', labelKey: 'dx.ind.legal.q2.c3' },
          { val: 'invoices_manual', labelKey: 'dx.ind.legal.q2.c4' },
          { val: 'files_paper', labelKey: 'dx.ind.legal.q2.c5' },
          { val: 'comms_tracking', labelKey: 'dx.ind.legal.q2.c6' }
        ]},
      { id: 'ind_legal_q3', type: 'slider', textKey: 'dx.ind.legal.q3.text',
        sliderLabelKey: 'dx.ind.legal.q3.sliderLabel', min: 0, max: 100, step: 5, defaultVal: 40 }
    ],
    logistics: [
      { id: 'ind_logistics_q1', type: 'single', textKey: 'dx.ind.logistics.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.logistics.q1.c1' },
          { val: '1', labelKey: 'dx.ind.logistics.q1.c2' },
          { val: '2', labelKey: 'dx.ind.logistics.q1.c3' },
          { val: '3', labelKey: 'dx.ind.logistics.q1.c4' }
        ]},
      { id: 'ind_logistics_q2', type: 'multi', textKey: 'dx.ind.logistics.q2.text',
        cards: [
          { val: 'routes_manual', labelKey: 'dx.ind.logistics.q2.c1' },
          { val: 'delivery_confirm_phone', labelKey: 'dx.ind.logistics.q2.c2' },
          { val: 'warehouse_manual', labelKey: 'dx.ind.logistics.q2.c3' },
          { val: 'notifications_manual', labelKey: 'dx.ind.logistics.q2.c4' },
          { val: 'driver_scheduling', labelKey: 'dx.ind.logistics.q2.c5' },
          { val: 'fuel_manual', labelKey: 'dx.ind.logistics.q2.c6' }
        ]},
      { id: 'ind_logistics_q3', type: 'slider', textKey: 'dx.ind.logistics.q3.text',
        sliderLabelKey: 'dx.ind.logistics.q3.sliderLabel', min: 0, max: 50, step: 1, defaultVal: 5 }
    ],
    construction: [
      { id: 'ind_construction_q1', type: 'single', textKey: 'dx.ind.construction.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.construction.q1.c1' },
          { val: '1', labelKey: 'dx.ind.construction.q1.c2' },
          { val: '2', labelKey: 'dx.ind.construction.q1.c3' },
          { val: '3', labelKey: 'dx.ind.construction.q1.c4' }
        ]},
      { id: 'ind_construction_q2', type: 'multi', textKey: 'dx.ind.construction.q2.text',
        cards: [
          { val: 'materials_phone', labelKey: 'dx.ind.construction.q2.c1' },
          { val: 'progress_paper', labelKey: 'dx.ind.construction.q2.c2' },
          { val: 'safety_manual', labelKey: 'dx.ind.construction.q2.c3' },
          { val: 'subs_whatsapp', labelKey: 'dx.ind.construction.q2.c4' },
          { val: 'budget_spreadsheet', labelKey: 'dx.ind.construction.q2.c5' },
          { val: 'permits_manual', labelKey: 'dx.ind.construction.q2.c6' }
        ]},
      { id: 'ind_construction_q3', type: 'slider', textKey: 'dx.ind.construction.q3.text',
        sliderLabelKey: 'dx.ind.construction.q3.sliderLabel', min: 0, max: 100, step: 5, defaultVal: 60 }
    ],
    retail: [
      { id: 'ind_retail_q1', type: 'single', textKey: 'dx.ind.retail.q1.text',
        cards: [
          { val: '0', labelKey: 'dx.ind.retail.q1.c1' },
          { val: '1', labelKey: 'dx.ind.retail.q1.c2' },
          { val: '2', labelKey: 'dx.ind.retail.q1.c3' },
          { val: '3', labelKey: 'dx.ind.retail.q1.c4' }
        ]},
      { id: 'ind_retail_q2', type: 'multi', textKey: 'dx.ind.retail.q2.text',
        cards: [
          { val: 'prices_manual', labelKey: 'dx.ind.retail.q2.c1' },
          { val: 'reorder_gut', labelKey: 'dx.ind.retail.q2.c2' },
          { val: 'loyalty_manual', labelKey: 'dx.ind.retail.q2.c3' },
          { val: 'reports_manual', labelKey: 'dx.ind.retail.q2.c4' },
          { val: 'supplier_whatsapp', labelKey: 'dx.ind.retail.q2.c5' },
          { val: 'scheduling_manual', labelKey: 'dx.ind.retail.q2.c6' }
        ]},
      { id: 'ind_retail_q3', type: 'slider', textKey: 'dx.ind.retail.q3.text',
        sliderLabelKey: 'dx.ind.retail.q3.sliderLabel', min: 0, max: 100, step: 5, defaultVal: 20 }
    ]
  };

  var LEAK_RATES = {
    restaurant: 14, medical: 30, dental: 30, legal: 35,
    hotel: 16, retail: 14, construction: 22, logistics: 18,
    accounting: 22, realestate: 20, agriculture: 14, education: 16, other: 18
  };

  var leakAnimFrame = null;
  var leakCurrentVal = 0;

  function screenToQNum(idx) {
    var count = 0;
    for (var i = 2; i <= idx; i++) {
      if (SEQ[i] && SEQ[i] !== 'transition') count++;
    }
    return count;
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
    if (startBtn) startBtn.addEventListener('click', function() {
      if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('diagnostic_started');
      goTo(1);
    });

    // Info next/prev
    var infoNext = document.getElementById('infoNextBtn');
    if (infoNext) infoNext.addEventListener('click', function() {
      if (validateInfo()) {
        var ind = (document.getElementById('dxIndustry') || {}).value || '';
        if (typeof IgneaAnalytics !== 'undefined') {
          IgneaAnalytics.track('diagnostic_info_completed', { industry: ind });
          IgneaAnalytics.track('diagnostic_industry_selected', { industry: ind });
        }
        injectIndustryScreens(ind);
        goTo(2);
      }
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
        if (currentScreen === SEQ.length - 2) {
          if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('diagnostic_completed');
          submitDiag();
        } else {
          if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('diagnostic_q' + currentScreen + '_completed');
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
      if (e.key === 'Enter' && currentScreen >= 2 && currentScreen < SEQ.length - 1) {
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

  /* ---- Industry branching ---- */

  function injectIndustryScreens(industry) {
    // If previously injected, remove old screens first
    if (industryInjected) {
      removeIndustryScreens();
    }

    // If industry not in INDUSTRY_QUESTIONS, keep original SEQ and return
    if (!INDUSTRY_QUESTIONS[industry]) {
      SEQ = [null, null, '1','2','3','4', 'transition', '5','6','7','8','9','10','11', null];
      totalQ = 11;
      industryInjected = false;
      selectedIndustry = '';
      return;
    }

    var indQuestions = INDUSTRY_QUESTIONS[industry];
    var transEl = document.querySelector('.q-screen[data-q="transition"]');
    if (!transEl) return;

    var lang = typeof IgneaI18n !== 'undefined' ? IgneaI18n.getLang() : 'es';

    // Build 3 industry screen elements
    for (var qi = 0; qi < indQuestions.length; qi++) {
      var q = indQuestions[qi];
      var dqAttr = 'ind' + (qi + 1);
      var screenDiv = document.createElement('div');
      screenDiv.className = 'q-wrap q-screen';
      screenDiv.setAttribute('data-q', dqAttr);

      var counterNum = qi + 5; // Q1-Q4 are 1-4, industry starts at 5
      var html = '<div class="q-counter">' + (counterNum < 10 ? '0' : '') + counterNum + ' / 14</div>';
      html += '<div class="q-text" data-i18n="' + q.textKey + '">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t(q.textKey) : '') + '</div>';

      if (q.type === 'single') {
        html += '<div class="q-cards" data-q="' + q.id + '" data-type="single">';
        for (var ci = 0; ci < q.cards.length; ci++) {
          html += '<div class="q-card" data-val="' + q.cards[ci].val + '">';
          html += '<span class="q-card-check"></span>';
          html += '<span data-i18n="' + q.cards[ci].labelKey + '">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t(q.cards[ci].labelKey) : '') + '</span>';
          html += '</div>';
        }
        html += '</div>';
      } else if (q.type === 'multi') {
        html += '<div class="q-cards" data-q="' + q.id + '" data-type="multi">';
        for (var ci2 = 0; ci2 < q.cards.length; ci2++) {
          html += '<div class="q-card" data-val="' + q.cards[ci2].val + '">';
          html += '<span class="q-card-check"></span>';
          html += '<span data-i18n="' + q.cards[ci2].labelKey + '">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t(q.cards[ci2].labelKey) : '') + '</span>';
          html += '</div>';
        }
        html += '</div>';
      } else if (q.type === 'slider') {
        html += '<div class="q-slider-wrap">';
        html += '<div class="q-slider-label" data-i18n="' + q.sliderLabelKey + '">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t(q.sliderLabelKey) : '') + '</div>';
        html += '<div class="q-slider-val" id="indSliderVal">' + q.defaultVal + '</div>';
        html += '<input type="range" class="q-slider" id="indSlider" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + q.defaultVal + '">';
        html += '</div>';
      }

      // Nav buttons
      html += '<div class="q-nav">';
      html += '<button class="btn-ghost btn-prev" data-i18n-btn="q.back">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t('q.back') : '&larr; Anterior') + '</button>';
      if (q.type === 'slider') {
        html += '<button class="btn-primary btn-next" data-i18n-btn="q.next">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t('q.next') : 'Siguiente &rarr;') + '</button>';
      } else {
        html += '<button class="btn-primary btn-next" disabled data-i18n-btn="q.next">' + (typeof IgneaI18n !== 'undefined' ? IgneaI18n.t('q.next') : 'Siguiente &rarr;') + '</button>';
      }
      html += '</div>';

      screenDiv.innerHTML = html;
      transEl.parentNode.insertBefore(screenDiv, transEl);
    }

    // Rebuild SEQ
    SEQ = [null, null, '1','2','3','4', 'ind1','ind2','ind3', 'transition', '5','6','7','8','9','10','11', null];
    totalQ = 14;

    // Store default slider answer
    var sliderQ = indQuestions[2];
    if (sliderQ && sliderQ.type === 'slider') {
      answers[sliderQ.id] = sliderQ.defaultVal;
    }

    // Bind event handlers on new elements
    bindIndustryHandlers(industry);

    // Re-apply translations
    if (typeof IgneaI18n !== 'undefined') {
      IgneaI18n.setLang(IgneaI18n.getLang());
    }

    industryInjected = true;
    selectedIndustry = industry;
  }

  function removeIndustryScreens() {
    var indScreens = document.querySelectorAll('.q-screen[data-q="ind1"], .q-screen[data-q="ind2"], .q-screen[data-q="ind3"]');
    for (var i = 0; i < indScreens.length; i++) {
      indScreens[i].parentNode.removeChild(indScreens[i]);
    }
    // Remove industry answers
    if (selectedIndustry && INDUSTRY_QUESTIONS[selectedIndustry]) {
      var indQ = INDUSTRY_QUESTIONS[selectedIndustry];
      for (var j = 0; j < indQ.length; j++) {
        delete answers[indQ[j].id];
      }
    }
    SEQ = [null, null, '1','2','3','4', 'transition', '5','6','7','8','9','10','11', null];
    totalQ = 11;
    industryInjected = false;
    selectedIndustry = '';
  }

  function bindIndustryHandlers(industry) {
    var indQuestions = INDUSTRY_QUESTIONS[industry];
    if (!indQuestions) return;

    // Bind single-select card handlers on injected screens
    var indScreens = document.querySelectorAll('.q-screen[data-q="ind1"], .q-screen[data-q="ind2"], .q-screen[data-q="ind3"]');

    indScreens.forEach(function(screen) {
      // Single-select cards
      screen.querySelectorAll('.q-cards[data-type="single"] .q-card').forEach(function(card) {
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

      // Multi-select cards
      screen.querySelectorAll('.q-cards[data-type="multi"] .q-card').forEach(function(card) {
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

      // Next buttons
      screen.querySelectorAll('.btn-next').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof IgneaAnalytics !== 'undefined') IgneaAnalytics.track('diagnostic_industry_branch_completed', { industry: selectedIndustry });
          if (currentScreen === SEQ.length - 2) {
            submitDiag();
          } else {
            goTo(currentScreen + 1);
          }
        });
      });

      // Prev buttons
      screen.querySelectorAll('.btn-prev').forEach(function(btn) {
        btn.addEventListener('click', function() {
          goTo(currentScreen - 1);
        });
      });
    });

    // Bind slider handler
    var indSlider = document.getElementById('indSlider');
    var indSliderVal = document.getElementById('indSliderVal');
    if (indSlider) {
      var sliderQ = indQuestions[2];
      indSlider.addEventListener('input', function() {
        var v = parseInt(this.value);
        answers[sliderQ.id] = v;
        if (indSliderVal) indSliderVal.textContent = v;
        saveProgress();
        updateNav();
      });
    }
  }

  /* ---- Money Leak Counter ---- */

  function updateMoneyLeak() {
    var el = document.getElementById('moneyLeak');
    var valEl = document.getElementById('moneyLeakVal');
    if (!el || !valEl) return;

    var industry = (document.getElementById('dxIndustry') || {}).value || 'other';
    var rate = LEAK_RATES[industry] || 18;
    var hours = answers.q2_slider || 0;
    var leak = hours * rate * 4.33;

    var q3val = answers.q3_card !== undefined ? parseInt(answers.q3_card) : -1;
    if (q3val >= 0 && q3val <= 4) leak += [0, 200, 600, 1200, 2000][q3val];

    var q8val = answers.q8_card !== undefined ? parseInt(answers.q8_card) : -1;
    if (q8val >= 0 && q8val <= 4) leak += [0, 400, 1200, 2400, 3200][q8val];

    var q5cards = answers.q5_cards || [];
    var manualCount = q5cards.filter(function(c) { return c !== 'all_automated'; }).length;
    leak += manualCount * 300;

    // 30% revenue cap
    var size = (document.getElementById('dxSize') || {}).value || '1-5';
    var employees = { '1-5': 3, '6-15': 10, '16-50': 30, '50+': 75 }[size] || 10;
    var estRevenue = employees * rate * 160;
    var cap = estRevenue * 0.3;
    if (leak > cap) leak = cap;
    leak = Math.round(leak);

    if (leak > 0 && currentScreen >= 2 && currentScreen < SEQ.length - 1) {
      el.classList.add('visible');
      animateLeakValue(valEl, leak);
    } else {
      el.classList.remove('visible');
    }
  }

  function animateLeakValue(el, target) {
    if (leakAnimFrame) cancelAnimationFrame(leakAnimFrame);
    var start = leakCurrentVal;
    var diff = target - start;
    if (diff === 0) return;
    var duration = 400;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      var current = Math.round(start + diff * eased);
      el.textContent = '$' + current.toLocaleString('en-US');
      leakCurrentVal = current;
      if (progress < 1) {
        leakAnimFrame = requestAnimationFrame(step);
      }
    }
    leakAnimFrame = requestAnimationFrame(step);
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
    } else if (SEQ[n] === 'transition') {
      if (transitionScreen) transitionScreen.classList.add('active');
      if (progWrap) progWrap.style.visibility = 'visible';
      var transQNum = screenToQNum(n);
      if (progBar) progBar.style.width = Math.round((transQNum / totalQ) * 100) + '%';
      if (progText) progText.textContent = transQNum + ' / ' + totalQ;
    } else if (n === SEQ.length - 1) {
      if (processingScreen) processingScreen.classList.add('active');
      if (progBar) progBar.style.width = '100%';
    } else if (n >= 2 && n < SEQ.length - 1) {
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
    updateMoneyLeak();
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
    if (SEQ[n] === 'transition') qNum = screenToQNum(n);
    if (n === SEQ.length - 1) qNum = totalQ;

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

    if (n === SEQ.length - 1 && stepEl) stepEl.style.display = 'none';
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

    if (SEQ[currentScreen] === 'transition') { nextBtn.disabled = false; return; }

    if (currentScreen >= 2 && currentScreen < SEQ.length - 1) {
      nextBtn.disabled = !isAnswered(currentScreen);
    }
  }

  function isAnswered(screenIdx) {
    var dq = SEQ[screenIdx];
    if (!dq || dq === 'transition') return true;

    // Industry screens
    if (dq.indexOf('ind') === 0) {
      var qIdx = parseInt(dq.replace('ind', '')) - 1; // 0, 1, 2
      var indQ = INDUSTRY_QUESTIONS[selectedIndustry] ? INDUSTRY_QUESTIONS[selectedIndustry][qIdx] : null;
      if (!indQ) return true;
      var ansKey = indQ.id;
      if (indQ.type === 'single') return answers[ansKey] !== undefined;
      if (indQ.type === 'multi') return answers[ansKey] && answers[ansKey].length > 0;
      if (indQ.type === 'slider') return true; // sliders always have a value
      return true;
    }

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
    updateMoneyLeak();
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

  /* ---- Post-Diagnostic Edge Function Trigger ---- */

  function triggerPostDiagnostic(diagnosticId) {
    var edgeFnUrl = (typeof IgneaSupabase !== 'undefined' && IgneaSupabase.edgeFnUrl)
      ? IgneaSupabase.edgeFnUrl : null;
    if (!edgeFnUrl) return;
    try {
      fetch(edgeFnUrl + '/on-diagnostic-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnostic_id: diagnosticId })
      });
    } catch (e) { /* fire and forget */ }
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

    // Supabase — write to diagnostics table
    if (typeof IgneaSupabase !== 'undefined' && IgneaSupabase.client) {
      try {
        var sd = JSON.parse(sessionStorage.getItem('ignea_diagnostic_scores'));
        var diagLang = localStorage.getItem('ignea_lang') || 'es';

        IgneaSupabase.client.from('diagnostics').insert([{
          language: diagLang,
          contact_name: (contact.first_name + ' ' + (contact.last_name || '')).trim(),
          contact_email: contact.email,
          contact_phone: contact.phone,
          company_name: contact.company,
          industry: contact.industry,
          company_size: contact.size,
          answers_json: answers,
          scores_json: sd.streams || sd.scores,
          total_score: sd.total,
          level: sd.level,
          roi_json: sd.roi
        }]).then(function(res) {
          // Store diagnostic ID for AI insights polling on results page
          if (res.data && res.data[0] && res.data[0].id) {
            sessionStorage.setItem('ignea_diagnostic_id', res.data[0].id);
            triggerPostDiagnostic(res.data[0].id);
          }
          // Google Sheets sync (best-effort)
          if (typeof IgneaSheetsSync !== 'undefined') {
            IgneaSheetsSync.sync({
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              company_name: contact.company,
              industry: contact.industry,
              company_size: contact.size,
              total_score: sd.total,
              score_level: sd.level
            });
          }
        });
      } catch (e) { /* silent — sessionStorage is fallback */ }
    }

    showProcessing();
  }

  function showProcessing() {
    goTo(SEQ.length - 1);
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
