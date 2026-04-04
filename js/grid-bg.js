(function() {
  var canvas = document.createElement('canvas');
  canvas.id = 'ignea-dots';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.prepend(canvas);

  var ctx = canvas.getContext('2d');
  var w, h;
  var cols, rows;
  var spacing = 18;
  var hexH = spacing * 1.732;
  var dotRadius = 0.9;

  // --- COLORS ---
  // Primary: teal glow (our accent)
  // Secondary: deeper teal
  // Tertiary: warm amber/coral hint (fire theme — Ignea = fire)
  // These are VISIBLE. Not 5% opacity. Real color.

  var orbs = [
    { x: 0.25, y: 0.35, vx: 0.00036, vy: 0.00024, r: 0.45, cr: 0, cg: 229, cb: 191, opacity: 0.28 },
    { x: 0.70, y: 0.55, vx: -0.0003, vy: 0.0003, r: 0.38, cr: 0, cg: 160, cb: 140, opacity: 0.18 },
    { x: 0.50, y: 0.75, vx: 0.00024, vy: -0.0003, r: 0.32, cr: 180, cg: 140, cb: 160, opacity: 0.12 },
    { x: 0.80, y: 0.20, vx: -0.00018, vy: 0.00024, r: 0.28, cr: 0, cg: 200, cb: 170, opacity: 0.14 }
  ];

  // Mouse tracking
  var mx = -9999, my = -9999;
  var smx = -9999, smy = -9999;
  var mouseOpacity = 0;
  var mouseTarget = 0;
  var lastMove = 0;
  var IDLE_MS = 1500;

  // Pointer events
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    lastMove = Date.now();
    mouseTarget = 0.20;
  });
  document.addEventListener('mouseleave', function() { mouseTarget = 0; });
  document.addEventListener('touchmove', function(e) {
    if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; lastMove = Date.now(); mouseTarget = 0.25; }
  }, { passive: true });
  document.addEventListener('touchend', function() { mouseTarget = 0; });

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cols = Math.ceil(w / spacing) + 2;
    rows = Math.ceil(h / hexH) + 2;
  }

  window.addEventListener('resize', resize);
  resize();

  // Low-res gradient sampling for performance
  var SAMPLE = 6;
  var sw, sh, samples;

  function rebuildSamples() {
    sw = Math.ceil(w / SAMPLE);
    sh = Math.ceil(h / SAMPLE);
    samples = new Float32Array(sw * sh * 3);
  }
  rebuildSamples();
  window.addEventListener('resize', rebuildSamples);

  function computeGradients() {
    var idle = (Date.now() - lastMove) > IDLE_MS;
    if (idle) mouseTarget = 0;

    // Smooth mouse
    smx += (mx - smx) * 0.1;
    smy += (my - smy) * 0.1;
    mouseOpacity += (mouseTarget - mouseOpacity) * 0.06;

    // Update orb positions — ALWAYS drift, never freeze
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];

      // Orbs ALWAYS drift
      o.x += o.vx;
      o.y += o.vy;

      // Bounce off edges with padding
      if (o.x < 0.08 || o.x > 0.92) o.vx *= -1;
      if (o.y < 0.08 || o.y > 0.92) o.vy *= -1;

      // ADDITIONALLY pull toward mouse when active (on top of drift)
      if (mouseTarget > 0.01) {
        o.x += ((mx / w) - o.x) * 0.006;
        o.y += ((my / h) - o.y) * 0.006;
      }
    }

    // Sample gradient field
    samples.fill(0);
    for (var sy = 0; sy < sh; sy++) {
      for (var sx = 0; sx < sw; sx++) {
        var px = (sx + 0.5) / sw;
        var py = (sy + 0.5) / sh;
        var r = 0, g = 0, b = 0;
        var idx = (sy * sw + sx) * 3;

        for (var i = 0; i < orbs.length; i++) {
          var o = orbs[i];
          var dx = px - o.x, dy = py - o.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var inf = Math.max(0, 1 - d / o.r);
          inf = inf * inf * inf * o.opacity; // cubic falloff
          r += o.cr * inf;
          g += o.cg * inf;
          b += o.cb * inf;
        }

        // Mouse spotlight
        if (mouseOpacity > 0.005) {
          var mxn = smx / w, myn = smy / h;
          var dx2 = px - mxn, dy2 = py - myn;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          var inf2 = Math.max(0, 1 - d2 / 0.25);
          inf2 = inf2 * inf2 * inf2 * mouseOpacity;
          r += 0 * inf2;   // teal r=0
          g += 229 * inf2;  // teal g=229
          b += 191 * inf2;  // teal b=191
        }

        samples[idx] = r;
        samples[idx + 1] = g;
        samples[idx + 2] = b;
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#09090F';
    ctx.fillRect(0, 0, w, h);

    computeGradients();

    // Draw dots
    for (var row = 0; row < rows; row++) {
      var offX = (row % 2) * (spacing * 0.5);
      var y = row * hexH;

      for (var col = 0; col < cols; col++) {
        var x = col * spacing + offX;

        // Sample gradient at this dot
        var si = Math.min(Math.floor(x / w * sw), sw - 1);
        var sj = Math.min(Math.floor(y / h * sh), sh - 1);
        if (si < 0) si = 0;
        if (sj < 0) sj = 0;
        var sIdx = (sj * sw + si) * 3;

        var cr = samples[sIdx];
        var cg = samples[sIdx + 1];
        var cb = samples[sIdx + 2];

        var brightness = Math.sqrt(cr * cr + cg * cg + cb * cb);

        if (brightness > 2) {
          // Colored dot — the gradient is showing through
          var alpha = Math.min(0.85, 0.12 + brightness / 120);
          var finalR = Math.min(255, Math.round(cr * 1.2 + 15));
          var finalG = Math.min(255, Math.round(cg * 1.2 + 15));
          var finalB = Math.min(255, Math.round(cb * 1.2 + 15));

          ctx.fillStyle = 'rgba(' + finalR + ',' + finalG + ',' + finalB + ',' + alpha + ')';

          // Dots near the gradient center are slightly larger
          var sizeBoost = Math.min(1, brightness / 200);
          var r = dotRadius + sizeBoost * 0.8;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.2832);
          ctx.fill();
        } else {
          // Base dot — dim but visible (the grid texture)
          ctx.fillStyle = 'rgba(30, 30, 46, 0.10)';
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, 6.2832);
          ctx.fill();
        }
      }
    }
  }

  // Animation
  var running = true;

  function loop() {
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || w < 768) {
    draw(); // Single static frame — no drift on mobile
  } else {
    loop();
  }

  document.addEventListener('visibilitychange', function() {
    running = !document.hidden;
    if (running) loop();
  });

  // Nav scroll detection — adds .scrolled class for border reveal
  var navEl = document.querySelector('nav');
  if (navEl) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) navEl.classList.add('scrolled');
      else navEl.classList.remove('scrolled');
    }, { passive: true });
  }
})();
