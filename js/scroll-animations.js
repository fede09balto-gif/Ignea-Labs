/* ============================================================
   IGNEA LABS — Scroll Animations, Parallax, Cursor Glow
   Pure vanilla JS. No libraries. Respects reduced-motion.
   ============================================================ */

(function() {

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  /* ---- SCROLL REVEAL ---- */
  function initScrollReveal() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur').forEach(function(el) {
      if (reducedMotion) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });
  }

  /* ---- PARALLAX ---- */
  function initParallax() {
    if (reducedMotion || isMobile) return;

    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;

    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var scrollY = window.pageYOffset;
          els.forEach(function(el) {
            var speed = parseFloat(el.dataset.parallax) || 0.1;
            var rect = el.getBoundingClientRect();
            var center = rect.top + rect.height / 2;
            var viewCenter = window.innerHeight / 2;
            var offset = (center - viewCenter) * speed;
            el.style.transform = 'translateY(' + offset + 'px)';
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---- CURSOR GLOW ---- */
  function initCursorGlow() {
    if (isMobile || reducedMotion) return;

    document.querySelectorAll('.cursor-glow').forEach(function(section) {
      section.addEventListener('mousemove', function(e) {
        var rect = section.getBoundingClientRect();
        section.style.setProperty('--glow-x', (e.clientX - rect.left) + 'px');
        section.style.setProperty('--glow-y', (e.clientY - rect.top) + 'px');
      });

      section.addEventListener('mouseleave', function() {
        section.style.setProperty('--glow-x', '-999px');
        section.style.setProperty('--glow-y', '-999px');
      });
    });
  }

  /* ---- INIT ---- */
  function init() {
    initScrollReveal();
    initParallax();
    initCursorGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
