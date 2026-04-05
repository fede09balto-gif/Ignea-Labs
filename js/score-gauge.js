/* ============================================================
   IGNEA LABS — Score Gauge (half-circle SVG with gradient fill)
   Usage: createScoreGauge(container, score, max)
   ============================================================ */

function createScoreGauge(container, score, max) {
  if (!container) return;
  var radius = 45;
  var circumference = 2 * Math.PI * radius;
  var halfCirc = circumference / 2;
  var scorePercent = Math.min(score / max, 1);
  var offset = -scorePercent * halfCirc;

  var colors;
  if (score <= 25) {
    colors = ['#F0997B', '#E85D30'];
  } else if (score <= 50) {
    colors = ['#F0997B', '#EF9F27'];
  } else if (score <= 75) {
    colors = ['#F07A3A', '#E5531A'];
  } else {
    colors = ['#E5531A', '#CC3A0D'];
  }

  var gradId = 'gauge-grad-' + Math.random().toString(36).substr(2, 6);

  var svg = '<svg viewBox="0 0 100 55" style="display:block;margin:0 auto;max-width:280px;">';
  svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="0">';
  svg += '<stop offset="0%" stop-color="' + colors[0] + '"/>';
  svg += '<stop offset="100%" stop-color="' + colors[1] + '"/>';
  svg += '</linearGradient></defs>';
  svg += '<g fill="none" stroke-width="8" transform="translate(50,50)">';
  svg += '<circle r="' + radius + '" stroke="#1A1A2A" stroke-dasharray="' + halfCirc + ' ' + halfCirc + '"/>';
  svg += '<circle r="' + radius + '" stroke="url(#' + gradId + ')" stroke-dasharray="' + halfCirc + ' ' + halfCirc + '" stroke-dashoffset="0" stroke-linecap="round" class="gauge-fill" style="transition:stroke-dashoffset 1.4s cubic-bezier(0.65,0,0.35,1) 0.4s;"/>';
  svg += '</g></svg>';

  container.innerHTML = svg;

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var fill = container.querySelector('.gauge-fill');
      if (fill) fill.style.strokeDashoffset = offset;
    });
  });
}
