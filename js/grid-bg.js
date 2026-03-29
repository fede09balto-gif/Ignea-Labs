/* ============================================================
   ONDA AI — Animated Grid Background
   Canvas-based grid with floating glowing particles.
   Pass particleCount to init() — 20 for homepage, 10 for interior.
   ============================================================ */

var OndaGrid = (function() {
  var c, x, W, H, pts, running = false;

  function init(particleCount) {
    c = document.getElementById('bg');
    if (!c) return;
    x = c.getContext('2d');
    c.style.willChange = 'transform';
    pts = [];

    var count = particleCount || (window.innerWidth < 768 ? 8 : 10);

    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * 1400,
        y: Math.random() * 5000,
        vx: (Math.random() - .5) * .2,
        vy: (Math.random() - .5) * .2,
        r: 80 + Math.random() * 160,
        p: Math.random() * 6.28
      });
    }

    resize();
    window.addEventListener('resize', resize);

    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
  }

  function resize() {
    if (!c) return;
    W = c.width = window.innerWidth;
    H = c.height = Math.max(document.body.scrollHeight, window.innerHeight, 4000);
  }

  function draw(t) {
    if (!c || !x) { running = false; return; }
    x.clearRect(0, 0, W, H);

    for (var i = 0; i < pts.length; i++) {
      var d = pts[i];
      d.x += d.vx; d.y += d.vy;
      if (d.x < -200) d.x = W + 200;
      if (d.x > W + 200) d.x = -200;
      if (d.y < -200) d.y = H + 200;
      if (d.y > H + 200) d.y = -200;
    }

    var S = 50;
    var cols = Math.ceil(W / S);
    var rows = Math.ceil(H / S);

    // Grid lines
    x.strokeStyle = 'rgba(26,26,42,0.3)';
    x.lineWidth = .5;
    for (var ci = 0; ci <= cols; ci++) {
      x.beginPath(); x.moveTo(ci * S, 0); x.lineTo(ci * S, H); x.stroke();
    }
    for (var ri = 0; ri <= rows; ri++) {
      x.beginPath(); x.moveTo(0, ri * S); x.lineTo(W, ri * S); x.stroke();
    }

    // Glowing intersections
    for (var ci = 0; ci <= cols; ci++) {
      for (var ri = 0; ri <= rows; ri++) {
        var px = ci * S, py = ri * S, b = 0;
        for (var k = 0; k < pts.length; k++) {
          var d = pts[k], dx = px - d.x, dy = py - d.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var pulse = .7 + .3 * Math.sin(t * .001 + d.p);
          if (dist < d.r * pulse) {
            b += (1 - dist / (d.r * pulse)) * .1;
          }
        }
        b = Math.min(b, .18);
        if (b > .015) {
          x.fillStyle = 'rgba(0,229,191,' + b + ')';
          x.fillRect(px - .5, py - .5, 1.5, 1.5);
        }
      }
    }

    requestAnimationFrame(draw);
  }

  return { init: init, resize: resize };
})();
