/* ============================================================
   ONDA AI — Encryption Strip Animation
   Scrambling random characters, updates every 80ms.
   Call OndaEncrypt.init() with element IDs.
   ============================================================ */

var OndaEncrypt = (function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+={}[]<>~';
  var ids = [];
  var interval = null;

  function update() {
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var s = '/// E2E-ENCRYPTED /// ';
      for (var j = 0; j < 120; j++) {
        s += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = s;
    }
  }

  function init() {
    // Find all encrypt strips on the page
    ids = [];
    var strips = document.querySelectorAll('.encrypt-strip');
    strips.forEach(function(el) {
      if (el.id) ids.push(el.id);
    });

    if (ids.length > 0) {
      update();
      if (interval) clearInterval(interval);
      interval = setInterval(update, 80);
    }
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', OndaEncrypt.init);
