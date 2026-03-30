/* ============================================================
   ONDA AI — Gradient Dots Background
   Self-initializing. Creates its own container element.
   No canvas, no particles. Pure CSS radial-gradients + JS drift.
   ============================================================ */

(function() {
  var container = document.getElementById('gradientBg');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gradientBg';
    document.body.prepend(container);
  }

  container.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;';

  var dotSize = 8;
  var spacing = 10;
  var hexSpacing = spacing * 1.732;
  var bg = '#08080D';

  container.style.backgroundColor = bg;
  container.style.backgroundImage = [
    'radial-gradient(circle at 50% 50%, transparent 1.5px, ' + bg + ' 0 ' + dotSize + 'px, transparent ' + dotSize + 'px)',
    'radial-gradient(circle at 50% 50%, transparent 1.5px, ' + bg + ' 0 ' + dotSize + 'px, transparent ' + dotSize + 'px)',
    'radial-gradient(circle at 50% 50%, rgba(0,229,191,0.07), transparent 60%)',
    'radial-gradient(circle at 50% 50%, rgba(0,180,150,0.05), transparent 60%)',
    'radial-gradient(circle at 50% 50%, rgba(0,229,191,0.03), transparent 60%)'
  ].join(',');

  container.style.backgroundSize = [
    spacing + 'px ' + hexSpacing + 'px',
    spacing + 'px ' + hexSpacing + 'px',
    '200% 200%',
    '200% 200%',
    '200% 200%'
  ].join(',');

  container.style.backgroundPosition = [
    '0px 0px',
    (spacing / 2) + 'px ' + (hexSpacing / 2) + 'px',
    '50% 50%',
    '50% 50%',
    '50% 50%'
  ].join(',');

  var startTime = null;
  var duration = 30000;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = ((timestamp - startTime) % duration) / duration;

    container.style.backgroundPosition = [
      '0px 0px',
      (spacing / 2) + 'px ' + (hexSpacing / 2) + 'px',
      (progress * 800) + '% ' + (progress * 400) + '%',
      (progress * 1000) + '% ' + (progress * -400) + '%',
      (progress * -1200) + '% ' + (progress * -600) + '%'
    ].join(',');

    requestAnimationFrame(animate);
  }

  if (window.innerWidth > 768) {
    requestAnimationFrame(animate);
  }
})();
