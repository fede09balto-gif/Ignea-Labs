/* ============================================================
   IGNEA LABS — Pre-Call Intake Form v2.0
   7-screen flow: Landing → Info → Q2 → Q3 → Q4 → Q5 → Hook
   No scoring. No branching. Collect, submit, show hook.
   ============================================================ */

(function() {
  var currentScreen = 0;
  var answers = {};
  var TOTAL_STEPS = 5; // progress bar steps (info + 4 question screens)

  var landingScreen, infoScreen, hookScreen;
  var progWrap, progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    landingScreen = document.getElementById('landingScreen');
    infoScreen    = document.getElementById('infoScreen');
    hookScreen    = document.getElementById('hookScreen');
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
    ['dxFirstName', 'dxEmail', 'dxCompany', 'dxPhone'].forEach(function(id) {
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
    // 0=landing, 1=info, 2=Q2(data-q=1), 3=Q3(data-q=2), 4=Q4(data-q=3), 5=Q5(data-q=4), 6=hook
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
    screens.push(document.getElementById('hookScreen'));       // 6
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
        // Q2: business description textarea required (>5 chars)
        valid = !!(answers.q2_business && answers.q2_business.trim().length > 5);
      } else if (dq === '2') {
        // Q3: at least one card selected in time leaks
        valid = !!(answers.q5_timeleaks && answers.q5_timeleaks.length > 0);
      } else if (dq === '3') {
        // Q4: headache textarea required (>5 chars)
        valid = !!(answers.q4_headache && answers.q4_headache.trim().length > 5);
      } else if (dq === '4') {
        // Q5: tried before — always valid (optional)
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
    var phone = (document.getElementById('dxPhone') || {}).value || '';
    if (!name.trim() || !email.trim() || !company.trim() || !phone.trim()) return false;
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

      // Restore screen position (don't restore to hook screen)
      var savedScreen = sessionStorage.getItem('ignea_intake_screen');
      if (savedScreen && parseInt(savedScreen) > 0 && parseInt(savedScreen) < 6) {
        goTo(parseInt(savedScreen));
      }
    } catch(e) {}

    updateNav();
  }

  function buildHookScreen() {
    var hook = document.getElementById('hookScreen');
    if (!hook) return;
    var lang = (typeof IgneaI18n !== 'undefined' && IgneaI18n.getLang) ? IgneaI18n.getLang() : 'es';

    var company = (document.getElementById('dxCompany') || {}).value || '';
    var website = (document.getElementById('dxWebsite') || {}).value || '';
    var timeSinks = answers.q5_timeleaks || [];
    var tools = answers.q6_tools || [];

    // Calculate opportunity count (min 3, max 6)
    var opp = 0;
    if (timeSinks.indexOf('same_questions') !== -1) opp++;
    if (timeSinks.indexOf('scheduling') !== -1) opp++;
    if (tools.indexOf('paper') !== -1) opp++;
    if (tools.indexOf('whatsapp') !== -1) opp++;
    if (tools.indexOf('crm') === -1 && tools.indexOf('booking') === -1) opp++;
    if (!website) opp++;
    opp = Math.max(3, Math.min(6, opp));

    var hoursLost = Math.max(10, timeSinks.length * 5);

    // Build opportunity cards based on answers
    var opportunities = [];
    if (timeSinks.indexOf('same_questions') !== -1) opportunities.push({ tag: lang === 'es' ? 'AUTOMATIZACIÓN DE WHATSAPP' : 'WHATSAPP AUTOMATION', desc: lang === 'es' ? 'Tus clientes hacen las mismas preguntas una y otra vez' : 'Your customers ask the same questions over and over' });
    if (timeSinks.indexOf('scheduling') !== -1) opportunities.push({ tag: lang === 'es' ? 'SISTEMA DE AGENDAMIENTO' : 'SCHEDULING SYSTEM', desc: lang === 'es' ? 'Tu equipo pierde horas coordinando citas manualmente' : 'Your team wastes hours coordinating appointments manually' });
    if (timeSinks.indexOf('followups') !== -1) opportunities.push({ tag: lang === 'es' ? 'SEGUIMIENTO DE CLIENTES' : 'CLIENT FOLLOW-UP', desc: lang === 'es' ? 'Los seguimientos se pierden entre mensajes y correos' : 'Follow-ups get lost between messages and emails' });
    if (tools.indexOf('paper') !== -1) opportunities.push({ tag: lang === 'es' ? 'DIGITALIZACIÓN' : 'DIGITIZATION', desc: lang === 'es' ? 'Información crítica atrapada en papel y cuadernos' : 'Critical information trapped on paper and notebooks' });
    if (timeSinks.indexOf('data_entry') !== -1) opportunities.push({ tag: lang === 'es' ? 'AUTOMATIZACIÓN DE DATOS' : 'DATA AUTOMATION', desc: lang === 'es' ? 'Datos se copian manualmente entre sistemas' : 'Data is copied manually between systems' });
    if (timeSinks.indexOf('invoicing') !== -1) opportunities.push({ tag: lang === 'es' ? 'FACTURACIÓN AUTOMÁTICA' : 'AUTOMATED INVOICING', desc: lang === 'es' ? 'Cotizaciones y facturas se hacen a mano' : 'Quotes and invoices are done manually' });
    // Ensure minimum 3
    if (opportunities.length < 3) {
      opportunities.push({ tag: lang === 'es' ? 'GESTIÓN DE INVENTARIO' : 'INVENTORY MANAGEMENT', desc: lang === 'es' ? 'Sin visibilidad en tiempo real de tu inventario' : 'No real-time visibility into your inventory' });
    }
    if (opportunities.length < 3) {
      opportunities.push({ tag: lang === 'es' ? 'DASHBOARD OPERATIVO' : 'OPERATIONS DASHBOARD', desc: lang === 'es' ? 'Sin métricas claras para tomar decisiones' : 'No clear metrics for decision-making' });
    }
    opportunities = opportunities.slice(0, 4);

    var heading = lang === 'es' ? 'Diagnóstico completo.' : 'Diagnostic complete.';
    var subTemplate = lang === 'es'
      ? 'Identificamos <strong>' + opp + ' áreas de automatización</strong> para ' + (company || 'tu empresa') + '.'
      : 'We identified <strong>' + opp + ' automation areas</strong> for ' + (company || 'your business') + '.';
    var hoursText = lang === 'es'
      ? 'Tu equipo pierde aproximadamente <strong>' + hoursLost + ' horas/semana</strong> en trabajo manual.'
      : 'Your team loses approximately <strong>' + hoursLost + ' hours/week</strong> on manual work.';
    var lockText = lang === 'es' ? 'Desbloquear en tu llamada' : 'Unlock in your call';
    var ctaText = lang === 'es' ? 'Agendar mi llamada estratégica →' : 'Book my strategy call →';
    var ctaNote = lang === 'es' ? '15 minutos. Sin compromiso.' : '15 minutes. No commitment.';

    var lockSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><rect x="3" y="11" width="18" height="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

    var cardsHtml = '';
    opportunities.forEach(function(o) {
      cardsHtml += '<div class="hook-card">' +
        '<div class="hook-card-tag">' + o.tag + '</div>' +
        '<div class="hook-card-desc">' + o.desc + '</div>' +
        '<div class="hook-card-blur">' +
          '<div class="hook-blur-text">' + (lang === 'es' ? 'Ahorro estimado: $X,XXX/mes' : 'Estimated savings: $X,XXX/mo') + '</div>' +
        '</div>' +
        '<div class="hook-card-lock">' + lockSvg + ' ' + lockText + '</div>' +
      '</div>';
    });

    hook.innerHTML =
      '<div class="hook-inner">' +
        '<h2 class="hook-heading">' + heading + '</h2>' +
        '<p class="hook-sub">' + subTemplate + '</p>' +
        '<p class="hook-hours">' + hoursText + '</p>' +
        '<div class="hook-cards">' + cardsHtml + '</div>' +
        '<a href="https://calendly.com/ignealabs/discovery" target="_blank" rel="noopener" class="btn-primary hook-cta">' + ctaText + '</a>' +
        '<p class="hook-note">' + ctaNote + '</p>' +
      '</div>';

    return { opp: opp, hoursLost: hoursLost };
  }

  function submitIntake() {
    var lang = (typeof IgneaI18n !== 'undefined' ? IgneaI18n.getLang() : 'es');

    var formData = {
      first_name: (document.getElementById('dxFirstName') || {}).value || '',
      email: (document.getElementById('dxEmail') || {}).value || '',
      company_name: (document.getElementById('dxCompany') || {}).value || '',
      phone: (document.getElementById('dxPhone') || {}).value || '',
      website: (document.getElementById('dxWebsite') || {}).value || '',
      linkedin: (document.getElementById('dxLinkedin') || {}).value || '',
      industry: (document.getElementById('dxIndustry') || {}).value || '',
      company_size: (document.getElementById('dxSize') || {}).value || '',
      revenue: (document.getElementById('dxRevenue') || {}).value || '',
    };

    // Build hook screen and get computed values
    var hookData = buildHookScreen();
    var opp = hookData ? hookData.opp : 3;
    var hoursLost = hookData ? hookData.hoursLost : 10;

    var payload = {
      created_at: new Date().toISOString(),
      language: lang,
      contact_name: formData.first_name,
      contact_email: formData.email,
      contact_phone: formData.phone,
      company_name: formData.company_name,
      website: formData.website,
      linkedin: formData.linkedin,
      industry: formData.industry,
      company_size: formData.company_size,
      revenue: formData.revenue,
      business_description: answers.q2_business || '',
      headache: answers.q4_headache || '',
      time_leaks: (answers.q5_timeleaks || []).join(', '),
      tools: (answers.q6_tools || []).join(', '),
      tried_before: answers.q7_tried || '',
      opportunity_count: opp,
      estimated_hours_lost: hoursLost,
      source: 'intake_form'
    };

    // Save to localStorage for ops pipeline
    try {
      var submissions = JSON.parse(localStorage.getItem('ignea_submissions') || '[]');
      var submission = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString(),
        name: formData.first_name,
        email: formData.email,
        company: formData.company_name,
        website: formData.website,
        linkedin: formData.linkedin,
        whatsapp: formData.phone,
        industry: formData.industry,
        teamSize: formData.company_size,
        revenue: formData.revenue,
        q2_businessDescription: answers.q2_business || '',
        q3_timeSinks: answers.q5_timeleaks || [],
        q3_tools: answers.q6_tools || [],
        q4_headache: answers.q4_headache || '',
        q5_triedBefore: answers.q7_tried || '',
        opportunityCount: opp,
        estimatedHoursLost: hoursLost,
        status: 'new',
        pipeline_stage: 'new',
        language: lang
      };
      submissions.push(submission);
      localStorage.setItem('ignea_submissions', JSON.stringify(submissions));
    } catch(e) {}

    // Save to Supabase (best-effort)
    if (typeof IgneaSupabase !== 'undefined') {
      IgneaSupabase.client.from('leads').insert(payload).then(function() {});
    }

    // Mirror to Google Sheets
    if (typeof IgneaSheetsSync !== 'undefined') {
      IgneaSheetsSync.sync(payload);
    }

    // Analytics
    if (typeof IgneaAnalytics !== 'undefined') {
      IgneaAnalytics.track('intake_completed', {
        industry: formData.industry,
        size: formData.company_size,
        opportunityCount: opp,
        estimatedHoursLost: hoursLost
      });
    }

    // Clear session
    try {
      sessionStorage.removeItem('ignea_intake_answers');
      sessionStorage.removeItem('ignea_intake_screen');
    } catch(e) {}

    // Go to hook screen
    goTo(6);
  }

  // ---- VOICE INPUT (Web Speech API) ----
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function initVoiceInputs() {
    if (!SpeechRecognition) return;

    document.querySelectorAll('.voice-wrap').forEach(function(wrap) {
      var field = wrap.querySelector('textarea, input[type="text"]');
      if (!field) return;

      // Build mic row below the field
      var micRow = document.createElement('div');
      micRow.className = 'mic-row';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mic-btn';
      btn.setAttribute('aria-label', 'Voice input');
      btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 2v0a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>' +
        '<path d="M19 10v1a7 7 0 0 1-14 0v-1"/>' +
        '<line x1="12" y1="18" x2="12" y2="22"/>' +
        '<line x1="8" y1="22" x2="16" y2="22"/>' +
        '</svg>' +
        '<span class="mic-btn-label"></span>' +
        '<span class="mic-waveform">' +
          '<span class="mic-wave-bar"></span>' +
          '<span class="mic-wave-bar"></span>' +
          '<span class="mic-wave-bar"></span>' +
        '</span>';

      var timer = document.createElement('span');
      timer.className = 'mic-timer';
      timer.textContent = '00:00';

      var errorEl = document.createElement('div');
      errorEl.className = 'voice-error';

      micRow.appendChild(btn);
      micRow.appendChild(timer);
      wrap.appendChild(micRow);
      wrap.insertAdjacentElement('afterend', errorEl);

      var labelEl = btn.querySelector('.mic-btn-label');

      var recognition = null;
      var timerInterval = null;
      var startTime = 0;

      function getLang() {
        var lang = localStorage.getItem('ignea_lang') || 'es';
        return lang === 'en' ? 'en-US' : 'es-MX';
      }

      function t(key) {
        if (typeof IgneaI18n !== 'undefined' && IgneaI18n.t) return IgneaI18n.t(key);
        return key;
      }

      function updateLabel() {
        if (labelEl) labelEl.textContent = t('voice_cta');
      }

      function setIdle() {
        btn.classList.remove('recording', 'processing');
        timer.textContent = '00:00';
        clearInterval(timerInterval);
        timerInterval = null;
        updateLabel();
      }

      function setRecording() {
        btn.classList.add('recording');
        btn.classList.remove('processing');
        if (labelEl) labelEl.textContent = t('voice_recording');
        errorEl.classList.remove('visible');
        errorEl.textContent = '';
        startTime = Date.now();
        timerInterval = setInterval(function() {
          var elapsed = Math.floor((Date.now() - startTime) / 1000);
          var m = String(Math.floor(elapsed / 60)).padStart(2, '0');
          var s = String(elapsed % 60).padStart(2, '0');
          timer.textContent = m + ':' + s;
        }, 250);
      }

      function setProcessing() {
        btn.classList.remove('recording');
        btn.classList.add('processing');
        clearInterval(timerInterval);
        timerInterval = null;
      }

      function showError(key) {
        errorEl.textContent = t(key);
        errorEl.classList.add('visible');
        setTimeout(function() { errorEl.classList.remove('visible'); }, 4000);
      }

      // Set initial label
      updateLabel();

      // Update label on language change
      document.addEventListener('langchange', updateLabel);

      btn.addEventListener('click', function() {
        // Toggle: if recording, stop
        if (recognition) {
          recognition.stop();
          return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = getLang();
        recognition.continuous = true;
        recognition.interimResults = true;

        var finalTranscript = field.value;

        recognition.onstart = function() {
          setRecording();
        };

        recognition.onresult = function(event) {
          var interim = '';
          for (var i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += (finalTranscript ? ' ' : '') + event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          field.value = finalTranscript + (interim ? ' ' + interim : '');
          field.dispatchEvent(new Event('input', { bubbles: true }));
        };

        recognition.onend = function() {
          setIdle();
          recognition = null;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        };

        recognition.onerror = function(event) {
          setIdle();
          recognition = null;
          if (event.error === 'not-allowed') {
            showError('voice_permission_denied');
          } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
            showError('voice_error');
          }
        };

        recognition.start();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initVoiceInputs);

})();
