/* ============================================================
   ONDA AI — Interactive Gradient Dots Background
   Self-initializing IIFE. Canvas-based hexagonal dot grid with
   drifting color orbs + mouse-follow spotlight effect.
   ============================================================ */

(function() {
  var container = document.getElementById('gradientBg');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gradientBg';
    document.body.prepend(container);
  }

  container.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  container.innerHTML = '';
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var spacing = 12;
  var hexSpacing = spacing * 1.732;
  var bgColor = { r: 8, g: 8, b: 13 };
  var accentColor = { r: 0, g: 229, b: 191 };
  var secondaryColor = { r: 0, g: 140, b: 120 };
  var tertiaryColor = { r: 90, g: 70, b: 180 };

  var mouse = { x: -1000, y: -1000, active: false };
  var smoothMouse = { x: -1000, y: -1000 };
  var lastActivity = Date.now();
  var idleTimeout = 2000;

  var orbs = [
    { x: 0.3, y: 0.4, vx: 0.0003, vy: 0.0002, radius: 0.4, color: accentColor, opacity: 0.18 },
    { x: 0.7, y: 0.6, vx: -0.0002, vy: 0.0003, radius: 0.35, color: secondaryColor, opacity: 0.12 },
    { x: 0.5, y: 0.3, vx: 0.0001, vy: -0.0002, radius: 0.3, color: tertiaryColor, opacity: 0.09 }
  ];

  var mouseOrb = { radius: 0.2, color: accentColor, opacity: 0 };
  var targetMouseOpacity = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  setTimeout(resize, 50);
  resize();

  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    lastActivity = Date.now();
    targetMouseOpacity = 0.2;
  });

  document.addEventListener('mouseleave', function() {
    mouse.active = false;
    targetMouseOpacity = 0;
  });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
      lastActivity = Date.now();
      targetMouseOpacity = 0.15;
    }
  }, { passive: true });

  document.addEventListener('touchend', function() {
    targetMouseOpacity = 0;
  });

  function drawDotGrid() {
    var w = canvas.width;
    var h = canvas.height;

    ctx.fillStyle = 'rgb(' + bgColor.r + ',' + bgColor.g + ',' + bgColor.b + ')';
    ctx.fillRect(0, 0, w, h);

    var isIdle = (Date.now() - lastActivity) > idleTimeout;
    if (isIdle) targetMouseOpacity = 0;

    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;

    mouseOrb.opacity += (targetMouseOpacity - mouseOrb.opacity) * 0.05;

    for (var o = 0; o < orbs.length; o++) {
      var orb = orbs[o];
      if (mouse.active && !isIdle) {
        var targetX = mouse.x / w;
        var targetY = mouse.y / h;
        orb.x += (targetX - orb.x) * 0.005;
        orb.y += (targetY - orb.y) * 0.005;
      } else {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < 0.1 || orb.x > 0.9) orb.vx *= -1;
        if (orb.y < 0.1 || orb.y > 0.9) orb.vy *= -1;
      }
    }

    var sampleScale = 4;
    var sw = Math.ceil(w / sampleScale);
    var sh = Math.ceil(h / sampleScale);
    var samples = new Float32Array(sw * sh * 3);

    for (var sy = 0; sy < sh; sy++) {
      for (var sx = 0; sx < sw; sx++) {
        var px = (sx + 0.5) / sw;
        var py = (sy + 0.5) / sh;
        var r = 0, g = 0, b = 0;

        for (var oi = 0; oi < orbs.length; oi++) {
          var ob = orbs[oi];
          var dx = px - ob.x;
          var dy = py - ob.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var influence = Math.max(0, 1 - dist / ob.radius);
          influence = influence * influence * ob.opacity;
          r += ob.color.r * influence;
          g += ob.color.g * influence;
          b += ob.color.b * influence;
        }

        if (mouseOrb.opacity > 0.001) {
          var mx = smoothMouse.x / w;
          var my = smoothMouse.y / h;
          var dx2 = px - mx;
          var dy2 = py - my;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          var influence2 = Math.max(0, 1 - dist2 / mouseOrb.radius);
          influence2 = influence2 * influence2 * influence2 * mouseOrb.opacity;
          r += mouseOrb.color.r * influence2;
          g += mouseOrb.color.g * influence2;
          b += mouseOrb.color.b * influence2;
        }

        var idx = (sy * sw + sx) * 3;
        samples[idx] = r;
        samples[idx + 1] = g;
        samples[idx + 2] = b;
      }
    }

    var dotRadius = 1.5;

    for (var row = 0; row * hexSpacing < h + spacing; row++) {
      var offsetX = (row % 2) * (spacing / 2);

      for (var col = 0; col * spacing < w + spacing; col++) {
        var x = col * spacing + offsetX;
        var y = row * hexSpacing;

        var sx2 = Math.min(Math.floor(x / w * sw), sw - 1);
        var sy2 = Math.min(Math.floor(y / h * sh), sh - 1);
        var sIdx = (sy2 * sw + sx2) * 3;

        var cr = samples[sIdx];
        var cg = samples[sIdx + 1];
        var cb = samples[sIdx + 2];

        var baseAlpha = 0.22;
        var colorAlpha = Math.min(1, Math.sqrt(cr * cr + cg * cg + cb * cb) / 150);

        if (colorAlpha > 0.01) {
          ctx.fillStyle = 'rgba(' +
            Math.round(cr + bgColor.r * 0.3) + ',' +
            Math.round(cg + bgColor.g * 0.3) + ',' +
            Math.round(cb + bgColor.b * 0.3) + ',' +
            Math.min(0.7, baseAlpha + colorAlpha * 0.6) + ')';
        } else {
          ctx.fillStyle = 'rgba(30, 30, 45, ' + baseAlpha + ')';
        }

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  var animating = true;
  var frameCount = 0;

  function animate() {
    if (!animating) return;

    frameCount++;
    if (window.innerWidth < 768 && frameCount % 2 !== 0) {
      requestAnimationFrame(animate);
      return;
    }

    drawDotGrid();
    requestAnimationFrame(animate);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawDotGrid();
  } else {
    requestAnimationFrame(animate);
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      animating = false;
    } else {
      animating = true;
      requestAnimationFrame(animate);
    }
  });
})();
