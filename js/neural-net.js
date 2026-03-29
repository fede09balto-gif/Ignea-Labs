/* ============================================================
   ONDA AI — Neural Network Canvas Animation (homepage only)
   ============================================================ */

var OndaNN = (function() {
  var nc, nx, ncW = 700, ncH = 280;
  var nodes = [], xOff = 80, gap;
  var layers = [4, 6, 8, 6, 3];

  function init() {
    nc = document.getElementById('nnCanvas');
    if (!nc) return;
    nx = nc.getContext('2d');
    nc.width = ncW;
    nc.height = ncH;
    nc.style.willChange = 'transform';

    gap = (ncW - 160) / (layers.length - 1);
    nodes = [];

    for (var l = 0; l < layers.length; l++) {
      var col = [];
      var yGap = 220 / (layers[l] + 1);
      for (var n = 0; n < layers[l]; n++) {
        col.push({ x: xOff + l * gap, y: 30 + yGap * (n + 1), pulse: Math.random() * 6.28 });
      }
      nodes.push(col);
    }

    requestAnimationFrame(draw);
  }

  function draw(t) {
    if (!nc || !nx) return;
    nx.clearRect(0, 0, ncW, ncH);

    // Connections
    for (var l = 0; l < nodes.length - 1; l++) {
      for (var a = 0; a < nodes[l].length; a++) {
        for (var b = 0; b < nodes[l + 1].length; b++) {
          var n1 = nodes[l][a], n2 = nodes[l + 1][b];
          var signal = (.5 + .5 * Math.sin(t * .002 + n1.pulse + n2.pulse)) * .12;
          nx.strokeStyle = 'rgba(0,229,191,' + signal + ')';
          nx.lineWidth = .5;
          nx.beginPath(); nx.moveTo(n1.x, n1.y); nx.lineTo(n2.x, n2.y); nx.stroke();

          // Traveling data point
          var travel = (t * .001 + n1.pulse) % 1;
          var mx = n1.x + (n2.x - n1.x) * travel;
          var my = n1.y + (n2.y - n1.y) * travel;
          if (Math.random() > .94) {
            nx.fillStyle = 'rgba(0,229,191,0.5)';
            nx.beginPath(); nx.arc(mx, my, 1.5, 0, 6.28); nx.fill();
          }
        }
      }
    }

    // Nodes
    for (var l = 0; l < nodes.length; l++) {
      for (var n = 0; n < nodes[l].length; n++) {
        var nd = nodes[l][n];
        var glow = .25 + .2 * Math.sin(t * .003 + nd.pulse);
        nx.fillStyle = 'rgba(0,229,191,' + glow + ')';
        nx.beginPath(); nx.arc(nd.x, nd.y, 3, 0, 6.28); nx.fill();
        nx.fillStyle = 'rgba(0,229,191,' + (glow * .25) + ')';
        nx.beginPath(); nx.arc(nd.x, nd.y, 8, 0, 6.28); nx.fill();
      }
    }

    // Labels
    var labels = {
      es: ['entrada', 'oculta', 'procesamiento', 'oculta', 'salida'],
      en: ['input', 'hidden', 'processing', 'hidden', 'output']
    };
    var lang = (typeof OndaI18n !== 'undefined') ? OndaI18n.getLang() : 'es';
    nx.fillStyle = 'rgba(110,110,136,0.4)';
    nx.font = '10px JetBrains Mono';
    nx.textAlign = 'center';
    var lb = labels[lang] || labels['es'];
    for (var l = 0; l < nodes.length; l++) {
      nx.fillText(lb[l], xOff + l * gap, 270);
    }

    requestAnimationFrame(draw);
  }

  return { init: init };
})();
