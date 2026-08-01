/* ============================================================
   IGNEA LABS — capability ticker scroll hint
   On first entering the viewport, the rail nudges right ~120px
   over 900ms (ease-out) and stops. Signals "this scrolls"
   without perpetual motion competing with the reader.
   No nudge at all under prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var DISTANCE = 120;
  var DURATION = 900;

  var rail = document.getElementById('tickerRail');
  if (!rail || !('IntersectionObserver' in window)) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce && reduce.matches) return;

  var played = false;
  var frame = null;

  /* Any real user input cancels the hint mid-flight — the animation
     must never fight the person it is trying to inform. */
  function cancel() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    detach();
  }

  function detach() {
    rail.removeEventListener('pointerdown', cancel);
    rail.removeEventListener('touchstart', cancel);
    rail.removeEventListener('wheel', cancel);
    rail.removeEventListener('keydown', cancel);
  }

  function attach() {
    rail.addEventListener('pointerdown', cancel, { passive: true });
    rail.addEventListener('touchstart', cancel, { passive: true });
    rail.addEventListener('wheel', cancel, { passive: true });
    rail.addEventListener('keydown', cancel);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function nudge() {
    var max = rail.scrollWidth - rail.clientWidth;
    if (max <= 1) return; // nothing to reveal — cards already fit

    var from = rail.scrollLeft;
    var target = Math.min(DISTANCE, max - from);
    if (target <= 0) return;

    var start = null;
    attach();

    function step(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      rail.scrollLeft = from + target * easeOutCubic(t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = null;
        detach();
      }
    }

    frame = requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || played) return;
      played = true;
      io.disconnect();
      nudge();
    });
  }, { threshold: 0.4 });

  io.observe(rail);
})();
