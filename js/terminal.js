/* ============================================================
   ONDA AI — Terminal Typewriter Effect (homepage only)
   Lines appear sequentially with fade-up.
   ============================================================ */

var OndaTerminal = (function() {
  var lines = {
    es: [
      { t: 'c', s: '$ onda diagnose --target="tu-negocio"' },
      { t: 'cm', s: '// Escaneando flujos de trabajo...' },
      { t: 'cm', s: '// Mapeando canales de interacción con clientes...' },
      { t: 'cm', s: '// Analizando asignación de tiempo del equipo...' },
      { t: 'o', s: '> Encontrado: <span class="s">4 oportunidades de automatización de alto impacto</span>' },
      { t: 'o', s: '> Ahorro mensual estimado: <span class="s">$2,400</span>' },
      { t: 'o', s: '> Período de recuperación: <span class="k">3.2 meses</span>' },
      { t: 'o', s: '> ROI a 12 meses: <span class="k">+340%</span>' },
      { t: 'c', s: '$ onda deploy --solution="whatsapp-ai" --market="NI" <span class="blink">|</span>' },
    ],
    en: [
      { t: 'c', s: '$ onda diagnose --target="your-business"' },
      { t: 'cm', s: '// Scanning operational workflows...' },
      { t: 'cm', s: '// Mapping customer interaction channels...' },
      { t: 'cm', s: '// Analyzing team time allocation...' },
      { t: 'o', s: '> Found: <span class="s">4 high-impact automation targets</span>' },
      { t: 'o', s: '> Estimated monthly savings: <span class="s">$2,400</span>' },
      { t: 'o', s: '> Payback period: <span class="k">3.2 months</span>' },
      { t: 'o', s: '> 12-month ROI: <span class="k">+340%</span>' },
      { t: 'c', s: '$ onda deploy --solution="whatsapp-ai" --market="NI" <span class="blink">|</span>' },
    ]
  };

  var tb, idx, timer;

  function init() {
    tb = document.getElementById('tBody');
    if (!tb) return;
    restart();

    // Restart on language change
    document.addEventListener('langchange', restart);
  }

  function restart() {
    clearTimeout(timer);
    if (tb) tb.innerHTML = '';
    idx = 0;
    timer = setTimeout(typeLine, 1500);
  }

  function typeLine() {
    var lang = (typeof OndaI18n !== 'undefined') ? OndaI18n.getLang() : 'es';
    var ln = lines[lang] || lines['es'];
    if (idx >= ln.length) return;

    var l = ln[idx];
    var d = document.createElement('div');
    d.innerHTML = '<span class="' + (l.t === 'c' ? 'c' : l.t === 'cm' ? 'cm' : '') + '">' + l.s + '</span>';
    d.style.opacity = '0';
    d.style.transform = 'translateY(5px)';
    tb.appendChild(d);

    requestAnimationFrame(function() {
      d.style.transition = 'all .35s';
      d.style.opacity = '1';
      d.style.transform = 'translateY(0)';
    });

    idx++;
    timer = setTimeout(typeLine, 500);
  }

  return { init: init, restart: restart };
})();
