/* ============================================================
   IGNEA LABS — Ops Scraper Module
   Business analysis via Claude API. Optional website fetch as
   context, but core intelligence comes from the LLM.
   ============================================================ */

var OpsScraper = (function() {

  var CORS_PROXY = 'https://api.allorigins.win/get?url=';
  var CLAUDE_MODEL = 'claude-sonnet-4-20250514';
  var collectedData = null;

  var loadingMessages = [
    'Analizando presencia web...',
    'Evaluando redes sociales...',
    'Investigando competencia...',
    'Generando reporte...'
  ];

  /* ---- Helpers ---- */

  function setStatus(msg, isError) {
    var el = document.getElementById('scraperStatus');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCacheKey(url) {
    try { return 'ignea_scrape_' + btoa(url); } catch (e) { return null; }
  }

  function getCachedResult(url) {
    var key = getCacheKey(url);
    if (!key) return null;
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function setCachedResult(url, data) {
    var key = getCacheKey(url);
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* quota */ }
  }

  /* ---- Populate lead select ---- */

  function populateLeadSelect() {
    var sel = document.getElementById('scraperLeadSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Seleccionar prospecto —</option>';
    var leads = typeof OpsDashboard !== 'undefined' ? OpsDashboard.getAllLeads() : [];
    leads.forEach(function(lead) {
      var opt = document.createElement('option');
      opt.value = lead.id;
      var label = [lead.company_name, lead.first_name, lead.last_name]
        .filter(Boolean).join(' · ');
      opt.textContent = label || lead.id;
      sel.appendChild(opt);
    });
  }

  function prefillFromLead(lead) {
    if (!lead) return;
    var urlEl = document.getElementById('scraperUrl');
    if (urlEl) urlEl.value = lead.website || lead.company_website || '';
    var nameEl = document.getElementById('scraperName');
    if (nameEl) nameEl.value = lead.company_name || '';
    var locEl = document.getElementById('scraperLocation');
    if (locEl) locEl.value = lead.location || lead.city || '';
    var selEl = document.getElementById('scraperLeadSelect');
    if (selEl) selEl.value = lead.id;
  }

  /* ---- Step 1: Website fetch (5s timeout, best-effort) ---- */

  function fetchWebsiteContent(url) {
    if (!url || !url.trim()) return Promise.resolve(null);

    var cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;

    var proxyUrl = CORS_PROXY + encodeURIComponent(cleanUrl);

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = setTimeout(function() { if (controller) controller.abort(); }, 5000);

    var fetchOpts = {};
    if (controller) fetchOpts.signal = controller.signal;

    return fetch(proxyUrl, fetchOpts)
      .then(function(res) { return res.json(); })
      .then(function(json) {
        clearTimeout(timeout);
        var html = json.contents || '';
        // Strip tags, get text content
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var text = (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim();
        return text.substring(0, 5000);
      })
      .catch(function() {
        clearTimeout(timeout);
        return null;
      });
  }

  /* ---- Step 2: Claude API analysis ---- */

  function analyzeWithClaude(companyName, url, location, industry, websiteContent) {
    var apiKey = localStorage.getItem('ignea_ops_claude_key') || '';
    if (!apiKey) {
      return Promise.reject(new Error('API key de Claude no configurada. Ve a Ajustes para añadirla.'));
    }

    var prompt = 'Analyze this business for a consulting pre-call preparation. Respond ONLY in valid JSON format, no markdown, no backticks.\n\n' +
      'Company: ' + (companyName || 'Unknown') + '\n' +
      'URL: ' + (url || 'Not provided') + '\n' +
      'Location: ' + (location || 'Not specified') + '\n' +
      'Industry: ' + (industry || 'Unknown') + '\n' +
      (websiteContent ? 'Website content (first 5000 chars): ' + websiteContent + '\n' : 'Website could not be accessed.\n') +
      '\nReturn this exact JSON structure:\n' +
      '{\n' +
      '  "website_analysis": {\n' +
      '    "has_website": true,\n' +
      '    "quality": "none|basic|moderate|professional",\n' +
      '    "mobile_friendly_likely": true,\n' +
      '    "has_online_booking": false,\n' +
      '    "has_ecommerce": false,\n' +
      '    "summary": "2-3 sentence assessment"\n' +
      '  },\n' +
      '  "social_media": {\n' +
      '    "facebook": {"likely_present": true, "url_guess": ""},\n' +
      '    "instagram": {"likely_present": true, "url_guess": ""},\n' +
      '    "linkedin": {"likely_present": false, "url_guess": ""},\n' +
      '    "tiktok": {"likely_present": false, "url_guess": ""},\n' +
      '    "twitter": {"likely_present": false, "url_guess": ""}\n' +
      '  },\n' +
      '  "business_profile": {\n' +
      '    "estimated_size": "micro|small|medium",\n' +
      '    "likely_services": ["service1", "service2"],\n' +
      '    "target_market": "description",\n' +
      '    "digital_maturity": "low|medium|high"\n' +
      '  },\n' +
      '  "opportunities": [\n' +
      '    {"area": "name", "priority": "high|medium|low", "description": "what we could build", "estimated_impact": "description"}\n' +
      '  ],\n' +
      '  "competitive_landscape": "2-3 sentences",\n' +
      '  "recommended_first_project": "1-2 sentences"\n' +
      '}';

    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 3000,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    .then(function(res) {
      if (!res.ok) {
        return res.json().catch(function() { return {}; }).then(function(err) {
          throw new Error((err.error && err.error.message) || 'HTTP ' + res.status);
        });
      }
      return res.json();
    })
    .then(function(data) {
      var text = data.content && data.content[0] ? data.content[0].text : '';
      // Strip markdown fences if present
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(text);
    });
  }

  /* ---- Loading animation ---- */

  function startLoadingAnimation(container) {
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'scraper-loading';
    wrap.innerHTML =
      '<div class="scraper-loading-pulse"></div>' +
      '<div class="scraper-loading-msg" id="scraperLoadingMsg">' + loadingMessages[0] + '</div>';
    container.appendChild(wrap);

    var idx = 0;
    var msgEl = document.getElementById('scraperLoadingMsg');
    var interval = setInterval(function() {
      idx = (idx + 1) % loadingMessages.length;
      if (msgEl) msgEl.textContent = loadingMessages[idx];
    }, 3000);

    return interval;
  }

  /* ---- Cache check UI ---- */

  function showCachePrompt(container, cached, onUseCached, onReanalyze) {
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'scraper-cache-prompt';
    wrap.innerHTML =
      '<div class="scraper-cache-icon">&#128462;</div>' +
      '<div class="scraper-cache-text">Resultados previos encontrados.</div>' +
      '<div class="scraper-cache-btns">' +
        '<button class="btn-primary" id="scraperUseCachedBtn">Usar caché</button>' +
        '<button class="btn-ghost" id="scraperReanalyzeBtn">Re-analizar</button>' +
      '</div>';
    container.appendChild(wrap);

    document.getElementById('scraperUseCachedBtn').addEventListener('click', function() { onUseCached(cached); });
    document.getElementById('scraperReanalyzeBtn').addEventListener('click', onReanalyze);
  }

  /* ---- Main runner ---- */

  function runScraper(forceRefresh) {
    var url         = (document.getElementById('scraperUrl')      || {}).value || '';
    var companyName = (document.getElementById('scraperName')     || {}).value || '';
    var location    = (document.getElementById('scraperLocation') || {}).value || '';

    url = url.trim();
    companyName = companyName.trim();
    location = location.trim();

    if (!companyName && !url) {
      setStatus('Ingresa al menos el nombre de la empresa o URL.', true);
      return;
    }

    var resultsEl = document.getElementById('scraperResults');
    if (!resultsEl) return;

    // Check cache
    if (!forceRefresh && url) {
      var cached = getCachedResult(url);
      if (cached) {
        showCachePrompt(resultsEl, cached,
          function(c) {
            collectedData = c;
            renderResults(c);
            setStatus('Mostrando resultados en caché.');
            var saveBtn = document.getElementById('scraperSaveBtn');
            if (saveBtn) saveBtn.disabled = false;
          },
          function() { runScraper(true); }
        );
        return;
      }
    }

    var runBtn    = document.getElementById('scraperRunBtn');
    var btnTextEl = runBtn ? runBtn.querySelector('.scraper-btn-text') : null;
    var origText  = btnTextEl ? btnTextEl.innerHTML : '';

    if (runBtn) runBtn.disabled = true;
    if (btnTextEl) btnTextEl.textContent = 'Analizando...';

    setStatus('Iniciando análisis...');
    var loadingInterval = startLoadingAnimation(resultsEl);

    // Detect industry from lead select or scraper context
    var industry = '';

    fetchWebsiteContent(url)
      .then(function(websiteContent) {
        setStatus('Consultando IA...');
        return analyzeWithClaude(companyName, url, location, industry, websiteContent);
      })
      .then(function(analysis) {
        clearInterval(loadingInterval);
        collectedData = analysis;

        // Cache
        if (url) setCachedResult(url, analysis);

        setStatus('Análisis completado.');
        renderResults(analysis);

        var saveBtn = document.getElementById('scraperSaveBtn');
        if (saveBtn) saveBtn.disabled = false;
      })
      .catch(function(err) {
        clearInterval(loadingInterval);
        setStatus('Error: ' + (err.message || 'Fallo en el análisis'), true);
        if (resultsEl) {
          resultsEl.innerHTML = '<div class="scraper-empty">' +
            '<div class="scraper-empty-icon" style="color:var(--coral)">!</div>' +
            '<div class="scraper-empty-msg">' + escHtml(err.message || 'Error desconocido') + '</div></div>';
        }
      })
      .finally(function() {
        if (runBtn) runBtn.disabled = false;
        if (btnTextEl) btnTextEl.innerHTML = origText;
      });
  }

  /* ---- Render results ---- */

  function renderResults(data) {
    var container = document.getElementById('scraperResults');
    if (!container) return;
    container.innerHTML = '';

    renderWebsiteSection(container, data.website_analysis);
    renderSocialSection(container, data.social_media);
    renderProfileSection(container, data.business_profile);
    renderOpportunitiesSection(container, data.opportunities);
    renderLandscapeSection(container, data.competitive_landscape);
    renderRecommendedSection(container, data.recommended_first_project);
  }

  /* ---- Section renderers ---- */

  function renderWebsiteSection(container, w) {
    w = w || {};
    var section = document.createElement('div');
    section.className = 'scraper-result-section';

    var qualityColors = { none: '#e8352a', basic: '#e87d3a', moderate: '#e8c93a', professional: '#3ae87d' };
    var qualityLabels = { none: 'Sin sitio', basic: 'Básico', moderate: 'Moderado', professional: 'Profesional' };
    var q = w.quality || 'none';
    var color = qualityColors[q] || qualityColors.none;

    var checks = '';
    checks += '<span class="scraper-badge ' + (w.mobile_friendly_likely ? 'ok' : 'fail') + '">Mobile ' + (w.mobile_friendly_likely ? '✓' : '✗') + '</span>';
    checks += '<span class="scraper-badge ' + (w.has_online_booking ? 'ok' : 'fail') + '">Reservas ' + (w.has_online_booking ? '✓' : '✗') + '</span>';
    checks += '<span class="scraper-badge ' + (w.has_ecommerce ? 'ok' : 'fail') + '">E-commerce ' + (w.has_ecommerce ? '✓' : '✗') + '</span>';

    section.innerHTML =
      '<div class="scraper-result-title">PRESENCIA WEB</div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
        '<span style="display:inline-block;padding:4px 12px;font-family:var(--fm);font-size:11px;letter-spacing:1px;text-transform:uppercase;' +
          'background:' + color + '20;color:' + color + ';border:1px solid ' + color + '40">' + escHtml(qualityLabels[q] || q) + '</span>' +
      '</div>' +
      '<div class="scraper-badges" style="margin-bottom:12px">' + checks + '</div>' +
      (w.summary ? '<div style="font-size:13px;color:var(--gray);line-height:1.6">' + escHtml(w.summary) + '</div>' : '');

    container.appendChild(section);
  }

  function renderSocialSection(container, social) {
    social = social || {};
    var section = document.createElement('div');
    section.className = 'scraper-result-section';

    var platforms = ['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'];
    var labels = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok', twitter: 'X / Twitter' };

    var grid = '';
    platforms.forEach(function(p) {
      var data = social[p] || {};
      var present = data.likely_present;
      var url = data.url_guess || '';

      var inner = '<span class="scraper-badge ' + (present ? 'ok' : 'fail') + '">' +
        escHtml(labels[p]) + ' ' + (present ? '✓' : '✗') + '</span>';

      if (present && url) {
        inner = '<a href="' + escHtml(url) + '" target="_blank" rel="noopener" style="text-decoration:none">' + inner + '</a>';
      }
      grid += inner;
    });

    section.innerHTML =
      '<div class="scraper-result-title">REDES SOCIALES</div>' +
      '<div class="scraper-social-badges" style="display:flex;flex-wrap:wrap;gap:8px">' + grid + '</div>';

    container.appendChild(section);
  }

  function renderProfileSection(container, profile) {
    profile = profile || {};
    var section = document.createElement('div');
    section.className = 'scraper-result-section';

    var sizeLabels = { micro: 'Micro', small: 'Pequeña', medium: 'Mediana' };
    var maturityColors = { low: '#e8352a', medium: '#e8c93a', high: '#3ae87d' };
    var maturityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' };
    var m = profile.digital_maturity || 'low';

    var services = (profile.likely_services || []).map(function(s) { return escHtml(s); }).join(', ');

    section.innerHTML =
      '<div class="scraper-result-title">PERFIL DEL NEGOCIO</div>' +
      '<div class="scraper-result-grid">' +
        '<div class="scraper-result-row"><div class="scraper-result-key">TAMAÑO</div><div class="scraper-result-val">' + escHtml(sizeLabels[profile.estimated_size] || profile.estimated_size || '—') + '</div></div>' +
        '<div class="scraper-result-row"><div class="scraper-result-key">SERVICIOS</div><div class="scraper-result-val">' + (services || '—') + '</div></div>' +
        '<div class="scraper-result-row"><div class="scraper-result-key">MERCADO</div><div class="scraper-result-val">' + escHtml(profile.target_market || '—') + '</div></div>' +
        '<div class="scraper-result-row"><div class="scraper-result-key">MADUREZ DIGITAL</div><div class="scraper-result-val"><span style="color:' + (maturityColors[m] || '#aaa') + '">' + escHtml(maturityLabels[m] || m) + '</span></div></div>' +
      '</div>';

    container.appendChild(section);
  }

  function renderOpportunitiesSection(container, opportunities) {
    if (!opportunities || !opportunities.length) return;
    var section = document.createElement('div');
    section.className = 'scraper-result-section';

    var priorityColors = { high: '#e8352a', medium: '#e87d3a', low: '#6e6e88' };
    var priorityLabels = { high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };

    var cards = opportunities.map(function(opp) {
      var pColor = priorityColors[opp.priority] || priorityColors.low;
      return '<div style="padding:16px;border:1px solid var(--border);margin-bottom:8px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="font-family:var(--fm);font-size:9px;letter-spacing:1.5px;padding:2px 8px;' +
            'background:' + pColor + '20;color:' + pColor + ';border:1px solid ' + pColor + '40">' +
            (priorityLabels[opp.priority] || 'BAJA') + '</span>' +
          '<span style="font-family:var(--ff);font-size:14px;font-weight:600;color:var(--white)">' + escHtml(opp.area) + '</span>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--gray);line-height:1.5;margin-bottom:6px">' + escHtml(opp.description) + '</div>' +
        '<div style="font-family:var(--fm);font-size:11px;color:var(--accent);letter-spacing:.5px">Impacto: ' + escHtml(opp.estimated_impact) + '</div>' +
      '</div>';
    }).join('');

    section.innerHTML =
      '<div class="scraper-result-title">OPORTUNIDADES</div>' + cards;

    container.appendChild(section);
  }

  function renderLandscapeSection(container, text) {
    if (!text) return;
    var section = document.createElement('div');
    section.className = 'scraper-result-section';
    section.innerHTML =
      '<div class="scraper-result-title">PANORAMA COMPETITIVO</div>' +
      '<div style="font-size:13px;color:var(--gray);line-height:1.65">' + escHtml(text) + '</div>';
    container.appendChild(section);
  }

  function renderRecommendedSection(container, text) {
    if (!text) return;
    var section = document.createElement('div');
    section.className = 'scraper-result-section';
    section.innerHTML =
      '<div class="scraper-result-title">PROYECTO RECOMENDADO</div>' +
      '<div style="padding:16px;border-left:3px solid var(--accent);background:var(--bg2)">' +
        '<div style="font-size:14px;color:var(--white);line-height:1.6">' + escHtml(text) + '</div>' +
      '</div>';
    container.appendChild(section);
  }

  /* ---- Save results to lead ---- */

  function saveResults() {
    if (!collectedData) return;

    var leadSel = document.getElementById('scraperLeadSelect');
    var leadId  = leadSel ? leadSel.value : null;
    if (!leadId) {
      setStatus('Selecciona un lead para guardar los resultados.', true);
      return;
    }

    // Save to localStorage leads
    var leadsRaw = localStorage.getItem('ignea_leads');
    if (leadsRaw) {
      try {
        var leads = JSON.parse(leadsRaw);
        var found = false;
        for (var i = 0; i < leads.length; i++) {
          if (String(leads[i].id) === String(leadId)) {
            leads[i].scraper_data = collectedData;
            leads[i].scraper_ran_at = new Date().toISOString();
            found = true;
            break;
          }
        }
        if (found) {
          localStorage.setItem('ignea_leads', JSON.stringify(leads));
          setStatus('Datos guardados en lead.');
        }
      } catch (e) {
        setStatus('Error al guardar.', true);
      }
    }

    // Also save to Supabase if available
    if (typeof IgneaSupabase !== 'undefined' && IgneaSupabase.client) {
      IgneaSupabase.client
        .from('leads')
        .update({
          scraper_data: collectedData,
          scraper_ran_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .then(function() {})
        .catch(function() {});
    }
  }

  /* ---- init ---- */

  function init() {
    populateLeadSelect();

    var leadSel = document.getElementById('scraperLeadSelect');
    if (leadSel) {
      leadSel.addEventListener('change', function() {
        var leads = typeof OpsDashboard !== 'undefined' ? OpsDashboard.getAllLeads() : [];
        var lead = leads.find(function(l) { return String(l.id) === leadSel.value; });
        if (lead) prefillFromLead(lead);
      });
    }

    var runBtn = document.getElementById('scraperRunBtn');
    if (runBtn) runBtn.addEventListener('click', function() { runScraper(false); });

    var saveBtn = document.getElementById('scraperSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveResults);

    document.addEventListener('ops:openScraper', function(e) {
      if (e.detail && e.detail.lead) prefillFromLead(e.detail.lead);
    });
  }

  /* ---- Public API ---- */

  return {
    init: init,
    prefillFromLead: prefillFromLead,
    saveResults: saveResults
  };

})();
