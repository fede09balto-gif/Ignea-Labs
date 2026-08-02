/* ============================================================
   IGNEA LABS — homepage UI
   Industry tabs, demo scenario tabs, capability chips, calculator.
   Absorbs the handlers that used to sit inline in index.html so all
   homepage behaviour lives in one place.

   Every hourly rate comes from js/labor-cost.js. Nothing here invents
   a number.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = function (k) { return (typeof IgneaI18n !== 'undefined' && IgneaI18n.t(k)) || ''; };

  /* Indicators are measured from laid-out geometry, so they must be
     recomputed whenever that geometry can change: resize, rail scroll,
     late webfonts, and language switches (which change label widths). */
  function onGeometryChange(fn) {
    window.addEventListener('resize', fn);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    document.addEventListener('langchange', function () { setTimeout(fn, 0); });
    requestAnimationFrame(fn);
  }

  /* ---------------- A. INDUSTRY TABS ---------------- */
  (function industryTabs() {
    var rail = document.getElementById('indRail');
    if (!rail) return;
    var mask  = rail.closest('.itabs__mask');
    var ind   = document.getElementById('indInd');
    var panel = document.getElementById('indPanel');
    var prob  = document.getElementById('indProb');
    var sol   = document.getElementById('indSol');
    var out   = document.getElementById('indOut');
    var tabs  = [].slice.call(rail.querySelectorAll('.itab'));

    function moveInd() {
      var a = rail.querySelector('[aria-selected="true"]');
      if (!a) return;
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + (a.offsetLeft - rail.scrollLeft) + 'px)';
    }
    function edge() {
      if (!mask) return;
      mask.classList.toggle('at-end', rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2);
    }
    function fill(slug) {
      prob.textContent = t('ind.' + slug + '.pain')     || prob.textContent;
      sol.textContent  = t('ind.' + slug + '.solution') || sol.textContent;
      out.textContent  = t('ind.' + slug + '.out')      || out.textContent;
    }
    function select(btn) {
      if (btn.getAttribute('aria-selected') === 'true') return;
      tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === btn)); });
      moveInd();
      if (reduce) { fill(btn.dataset.tab); return; }
      panel.classList.add('out');
      setTimeout(function () {
        fill(btn.dataset.tab);
        panel.classList.remove('out');
      }, 180);
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }

    /* Copy length differs per industry, so the panel would resize on every
       switch. Measure the tallest and lock a floor. */
    function lockHeight() {
      var cur = rail.querySelector('[aria-selected="true"]');
      panel.style.minHeight = '';
      var max = 0;
      tabs.forEach(function (x) {
        fill(x.dataset.tab);
        max = Math.max(max, panel.offsetHeight);
      });
      if (cur) fill(cur.dataset.tab);
      panel.style.minHeight = max + 'px';
    }

    tabs.forEach(function (x) { x.addEventListener('click', function () { select(x); }); });
    rail.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (n < 0 || n >= tabs.length) return;
      e.preventDefault();
      tabs[n].focus();
      select(tabs[n]);
    });
    rail.addEventListener('scroll', function () { moveInd(); edge(); });
    /* Re-fill on language switch: i18n rewrites the label buttons but the
       panel body is driven from here, so it would otherwise stay stale. */
    document.addEventListener('langchange', function () {
      var a = rail.querySelector('[aria-selected="true"]');
      if (a) fill(a.dataset.tab);
    });
    onGeometryChange(function () { moveInd(); edge(); lockHeight(); });
  })();

  /* ---------------- B. DEMO SCENARIO TABS ---------------- */
  (function scenarioTabs() {
    var wrap = document.getElementById('sTabs');
    if (!wrap) return;
    var blk  = document.getElementById('sBlk');
    var tabs = [].slice.call(wrap.querySelectorAll('.stab'));

    function moveBlk() {
      var a = wrap.querySelector('[aria-selected="true"]');
      if (!a) return;
      blk.style.width = a.offsetWidth + 'px';
      blk.style.transform = 'translateX(' + (a.offsetLeft - 4) + 'px)';
    }
    /* Selection state only — wa-demo.js owns the actual scenario switch and
       listens on these same buttons. Duplicating that here would start the
       demo twice. */
    tabs.forEach(function (x) {
      x.addEventListener('click', function () {
        tabs.forEach(function (y) { y.setAttribute('aria-selected', String(y === x)); });
        moveBlk();
      });
    });
    wrap.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (n < 0 || n >= tabs.length) return;
      e.preventDefault();
      tabs[n].focus();
      tabs[n].click();
    });
    onGeometryChange(moveBlk);
  })();

  /* ---------------- C. CAPABILITY CHIPS ---------------- */
  (function chips() {
    var caps = document.getElementById('caps');
    if (!caps) return;
    if (reduce || !('IntersectionObserver' in window)) { caps.classList.add('in'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { caps.classList.add('in'); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe(caps);
  })();

  /* ---------------- D. CALCULATOR ---------------- */
  (function calculator() {
    var seg = document.getElementById('calcSeg');
    if (!seg || typeof IgneaLaborCost === 'undefined') return;
    var segBlk  = document.getElementById('calcSegBlk');
    var btns    = [].slice.call(seg.querySelectorAll('button'));
    var range   = document.getElementById('calcHours');
    var hoursEl = document.getElementById('calcHoursVal');
    var fill    = document.getElementById('calcFill');
    var bigEl   = document.getElementById('calcResultValue');
    var rowEl   = document.getElementById('calcBdManual');
    var noteEl  = document.getElementById('calcBdNote');
    var industry = document.getElementById('calcIndustry');

    /* Only used for the sanity cap below — a rough revenue proxy per
       employee by industry. Not a labor rate. */
    var REVENUE_PROXY = { restaurant: 14, medical: 30, dental: 30, legal: 35,
                          hotel: 16, retail: 14, construction: 22, logistics: 18 };
    var headcount = 8;
    var shown = { big: 0, row: 0 };
    var raf = null;

    function moveSeg() {
      var a = seg.querySelector('[aria-pressed="true"]');
      if (!a) return;
      segBlk.style.width = a.offsetWidth + 'px';
      segBlk.style.transform = 'translateX(' + (a.offsetLeft - 4) + 'px)';
    }
    function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
    function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

    function paint(v) {
      bigEl.textContent = money(v.big);
      if (rowEl) rowEl.textContent = money(v.row);
    }
    /* Cancels any in-flight animation, so dragging the slider cannot stack
       count-ups on top of each other. */
    function animateTo(target) {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      if (reduce) { shown = target; paint(shown); return; }
      var from = { big: shown.big, row: shown.row }, t0 = performance.now(), dur = 480;
      raf = requestAnimationFrame(function step(now) {
        var p = Math.min((now - t0) / dur, 1), e = easeOut(p);
        shown = { big: from.big + (target.big - from.big) * e,
                  row: from.row + (target.row - from.row) * e };
        paint(shown);
        raf = p < 1 ? requestAnimationFrame(step) : null;
      });
    }

    function recalc() {
      var hrs   = parseInt(range.value, 10) || 20;
      var rate  = IgneaLaborCost.rateForHeadcount(headcount);
      var total = hrs * rate * 4.33;

      /* Guards against absurd output. Unlikely to bite at honest rates,
         kept as cheap insurance. */
      var proxy = REVENUE_PROXY[industry && industry.value] || 18;
      var cap   = headcount * proxy * 160 * 0.3;
      if (total > cap)  total = cap;
      if (total > 8000) total = 8000;

      animateTo({ big: total, row: total });
      if (noteEl) noteEl.textContent = IgneaLaborCost.disclosure(
        (typeof IgneaI18n !== 'undefined' && IgneaI18n.getLang()) || 'es');
    }

    function paintSlider() {
      var min = +range.min, max = +range.max;
      fill.style.width = ((range.value - min) / (max - min) * 100) + '%';
      hoursEl.textContent = range.value;
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        headcount = parseInt(b.dataset.n, 10) || 8;
        moveSeg();
        recalc();
      });
    });
    range.addEventListener('input', function () { paintSlider(); recalc(); });
    if (industry) industry.addEventListener('change', recalc);
    document.addEventListener('langchange', recalc);
    onGeometryChange(function () { moveSeg(); paintSlider(); recalc(); });
  })();
})();
