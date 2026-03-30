/* ============================================================
   ONDA AI — Gradient Dots Background
   CSS-based animated gradient dots. No canvas, no particles.
   Call OndaGradientDots.init() on every page.
   ============================================================ */

var OndaGradientDots = (function() {
  function init(opacity) {
    var el = document.getElementById('gradientBg');
    if (!el) return;

    var op = opacity || 0.08;
    var bg = '#08080D';
    var dotSize = 10;
    var hexSpacing = dotSize * 1.732;

    el.style.backgroundColor = bg;
    el.style.backgroundImage = [
      'radial-gradient(circle at 50% 50%, transparent 1px, ' + bg + ' 1px, ' + bg + ' ' + dotSize + 'px, transparent ' + dotSize + 'px)',
      'radial-gradient(circle at 50% 50%, transparent 1px, ' + bg + ' 1px, ' + bg + ' ' + dotSize + 'px, transparent ' + dotSize + 'px)',
      'radial-gradient(circle at 30% 40%, rgba(0,229,191,' + op + '), transparent 50%)',
      'radial-gradient(circle at 70% 60%, rgba(10,74,63,' + (op * 1.5) + '), transparent 50%)',
      'radial-gradient(circle at 50% 80%, rgba(0,229,191,' + (op * 0.5) + '), transparent 50%)'
    ].join(',');

    el.style.backgroundSize = [
      dotSize + 'px ' + hexSpacing + 'px',
      dotSize + 'px ' + hexSpacing + 'px',
      '120% 120%',
      '120% 120%',
      '120% 120%'
    ].join(',');

    el.style.backgroundPosition = [
      '0 0',
      (dotSize/2) + 'px ' + (hexSpacing/2) + 'px',
      '0% 0%',
      '100% 100%',
      '50% 50%'
    ].join(',');

    // Very slow drift animation
    var start = null;
    function animate(ts) {
      if (!start) start = ts;
      var p = ((ts - start) % 60000) / 60000; // 60s cycle

      var x1 = Math.sin(p * Math.PI * 2) * 15;
      var y1 = Math.cos(p * Math.PI * 2) * 10;
      var x2 = Math.cos(p * Math.PI * 2 + 1) * 20;
      var y2 = Math.sin(p * Math.PI * 2 + 1) * 15;
      var x3 = Math.sin(p * Math.PI * 2 + 2) * 10;
      var y3 = Math.cos(p * Math.PI * 2 + 2) * 20;

      el.style.backgroundPosition = [
        '0 0',
        (dotSize/2) + 'px ' + (hexSpacing/2) + 'px',
        (50 + x1) + '% ' + (50 + y1) + '%',
        (50 + x2) + '% ' + (50 + y2) + '%',
        (50 + x3) + '% ' + (50 + y3) + '%'
      ].join(',');

      requestAnimationFrame(animate);
    }

    // Skip animation on mobile
    if (window.innerWidth > 768) {
      requestAnimationFrame(animate);
    }
  }

  return { init: init };
})();
