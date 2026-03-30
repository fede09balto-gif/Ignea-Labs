/* ============================================================
   ONDA AI — Diagnostic Survey Flow
   Handles question navigation, validation, answer storage.
   On submit: calculates scores, stores in sessionStorage,
   redirects to results.html.
   ============================================================ */

(function() {
  var currentQ = 0; // 0 = intro screen, 1-11 = questions, 12 = contact
  var totalQ = 11;
  var answers = {};

  var introScreen, questionScreens, contactScreen, processingScreen;
  var progBar, progText;

  document.addEventListener('DOMContentLoaded', function() {
    introScreen = document.getElementById('introScreen');
    contactScreen = document.getElementById('contactScreen');
    processingScreen = document.getElementById('processingScreen');
    questionScreens = document.querySelectorAll('.q-screen');
    progBar = document.getElementById('progFill');
    progText = document.getElementById('progText');

    // Start button
    var startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', function() { goTo(1); });

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
    var rangeVal = document.getElementById('rangeQ4Val');
    if (rangeInput && rangeVal) {
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

    // Contact fields
    document.querySelectorAll('.contact-field').forEach(function(input) {
      input.addEventListener('input', updateNav);
    });

    // Nav buttons
    document.querySelectorAll('.btn-next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (currentQ === 12) {
          submitDiag();
        } else {
          goTo(currentQ + 1);
        }
      });
    });
    document.querySelectorAll('.btn-prev').forEach(function(btn) {
      btn.addEventListener('click', function() { goTo(currentQ - 1); });
    });

    // Keyboard enter to advance
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && currentQ >= 1) {
        var nextBtn = document.querySelector('.q-wrap.active .btn-next');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
      }
    });
  });

  function goTo(n) {
    currentQ = n;

    // Hide all
    if (introScreen) introScreen.classList.remove('active');
    questionScreens.forEach(function(s) { s.classList.remove('active'); });
    if (contactScreen) contactScreen.classList.remove('active');

    if (n === 0) {
      introScreen.classList.add('active');
    } else if (n >= 1 && n <= 11) {
      var target = document.querySelector('.q-screen[data-q="' + n + '"]');
      if (target) target.classList.add('active');
    } else if (n === 12) {
      contactScreen.classList.add('active');
    }

    // Progress
    var pct = n === 0 ? 0 : Math.min(100, Math.round(((n - 1) / totalQ) * 100));
    if (progBar) progBar.style.width = pct + '%';
    if (progText) progText.textContent = (n === 0 ? 0 : Math.min(n, 11)) + ' / ' + totalQ;

    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateNav() {
    // Enable/disable next buttons based on whether current Q is answered
    var active = document.querySelector('.q-wrap.active');
    if (!active) return;
    var nextBtn = active.querySelector('.btn-next');
    if (!nextBtn) return;

    var valid = false;
    if (currentQ === 0) {
      valid = true;
    } else if (currentQ >= 1 && currentQ <= 11) {
      valid = isAnswered(currentQ);
    } else if (currentQ === 12) {
      var name = document.getElementById('cName');
      var email = document.getElementById('cEmail');
      var company = document.getElementById('cCompany');
      valid = name && name.value.trim() && email && email.value.trim() && company && company.value.trim();
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
    // Collect contact info
    var contact = {
      name: document.getElementById('cName').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      whatsapp: document.getElementById('cWhatsapp').value.trim(),
      company: document.getElementById('cCompany').value.trim()
    };

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
        first_name: contact.name.split(' ')[0] || contact.name,
        last_name: contact.name.split(' ').slice(1).join(' ') || '',
        email: contact.email,
        phone: contact.whatsapp,
        company_name: contact.company,
        company_website: document.getElementById('cWebsite') ? document.getElementById('cWebsite').value.trim() : '',
        company_linkedin: document.getElementById('cLinkedin') ? document.getElementById('cLinkedin').value.trim() : '',
        diagnostic_answers: answers,
        total_score: result.total,
        score_breakdown: result.scores,
        score_level: result.level,
        recommendations: recos,
        roi_estimate: roi,
        pipeline_stage: 'new',
        priority: 'medium'
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
    // Hide everything, show processing
    if (introScreen) introScreen.classList.remove('active');
    questionScreens.forEach(function(s) { s.classList.remove('active'); });
    if (contactScreen) contactScreen.classList.remove('active');
    if (processingScreen) processingScreen.classList.add('active');

    if (progBar) progBar.style.width = '100%';

    // Animate processing messages
    var msgs = document.querySelectorAll('.proc-msg');
    var delay = 0;
    msgs.forEach(function(msg, i) {
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
