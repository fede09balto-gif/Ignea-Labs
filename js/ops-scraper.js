/* ============================================================
   IGNEA LABS — Ops Scraper Module
   Website analysis, social presence detection, Google Places
   lookup, and competitor analysis for the ops dashboard.
   ============================================================ */

var OpsScraper = (function() {

  var CORS_PROXY = 'https://api.allorigins.win/get?url=';
  var GOOGLE_PLACES_API_KEY = 'GOOGLE_PLACES_API_KEY'; // placeholder

  var collectedData = null;

  /* ---- Helpers ---- */

  function setStatus(msg) {
    var el = document.getElementById('scraperStatus');
    if (el) el.textContent = msg;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasGoogleKey() {
    return GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'GOOGLE_PLACES_API_KEY';
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
    if (locEl) locEl.value = lead.location || lead.city || 'Managua, Nicaragua';

    var selEl = document.getElementById('scraperLeadSelect');
    if (selEl) selEl.value = lead.id;
  }

  /* ---- Step 1: Website Analysis ---- */

  function analyzeWebsite(url) {
    if (!url || !url.trim()) {
      return Promise.resolve({ error: 'no_url' });
    }

    var cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setStatus('Paso 1/4 — Analizando sitio web...');

    var proxyUrl = CORS_PROXY + encodeURIComponent(cleanUrl);

    return fetch(proxyUrl)
      .then(function(res) { return res.json(); })
      .then(function(json) {
        var html = json.contents || '';
        var parser   = new DOMParser();
        var doc      = parser.parseFromString(html, 'text/html');
        var lowerHtml = html.toLowerCase();

        // Title
        var titleEl = doc.querySelector('title');
        var title   = titleEl ? titleEl.textContent.trim() : '';

        // Meta description
        var descEl      = doc.querySelector('meta[name="description"]');
        var description = descEl ? (descEl.getAttribute('content') || '') : '';

        // Social links
        var anchors     = doc.querySelectorAll('a[href]');
        var socialLinks = {};
        var socialDomains = {
          facebook:  'facebook.com',
          instagram: 'instagram.com',
          twitter:   'twitter.com',
          linkedin:  'linkedin.com',
          tiktok:    'tiktok.com'
        };

        Array.prototype.forEach.call(anchors, function(a) {
          var href = (a.getAttribute('href') || '').toLowerCase();
          Object.keys(socialDomains).forEach(function(platform) {
            if (href.indexOf(socialDomains[platform]) !== -1 && !socialLinks[platform]) {
              socialLinks[platform] = a.getAttribute('href');
            }
          });
        });

        // Tech signals
        var hasAnalytics      = lowerHtml.indexOf('google-analytics.com') !== -1 ||
                                 lowerHtml.indexOf('googletagmanager.com') !== -1 ||
                                 lowerHtml.indexOf('gtag(') !== -1;
        var hasFBPixel         = lowerHtml.indexOf('facebook.net/en_us/fbevents.js') !== -1 ||
                                 lowerHtml.indexOf('fbq(') !== -1;
        var hasWhatsAppWidget  = lowerHtml.indexOf('wa.me') !== -1 ||
                                 lowerHtml.indexOf('api.whatsapp.com') !== -1 ||
                                 lowerHtml.indexOf('whatsapp') !== -1;
        var hasLiveChat        = lowerHtml.indexOf('tawk.to') !== -1 ||
                                 lowerHtml.indexOf('intercom') !== -1 ||
                                 lowerHtml.indexOf('drift') !== -1 ||
                                 lowerHtml.indexOf('crisp') !== -1 ||
                                 lowerHtml.indexOf('livechat') !== -1;
        var hasBooking         = lowerHtml.indexOf('calendly') !== -1 ||
                                 lowerHtml.indexOf('booking') !== -1 ||
                                 lowerHtml.indexOf('reserv') !== -1;
        var hasViewportMeta    = !!doc.querySelector('meta[name="viewport"]');
        var isSSL              = /^https:\/\//i.test(cleanUrl);

        var copyrightMatch = html.match(/(?:©|&copy;|copyright)\s*(\d{4})/i);
        var copyrightYear  = copyrightMatch ? copyrightMatch[1] : null;

        return {
          url:              cleanUrl,
          title:            title,
          description:      description,
          socialLinks:      socialLinks,
          hasAnalytics:     hasAnalytics,
          hasFBPixel:       hasFBPixel,
          hasWhatsAppWidget: hasWhatsAppWidget,
          hasLiveChat:      hasLiveChat,
          hasBooking:       hasBooking,
          hasViewportMeta:  hasViewportMeta,
          isSSL:            isSSL,
          copyrightYear:    copyrightYear
        };
      })
      .catch(function() {
        return { url: cleanUrl, error: 'fetch_failed' };
      });
  }

  /* ---- Step 2: Social Media Presence ---- */

  function analyzeSocial(websiteData, companyName, location) {
    setStatus('Paso 2/4 — Verificando redes sociales...');

    try {
      var socialDomains = {
        facebook:  'facebook.com',
        instagram: 'instagram.com',
        twitter:   'twitter.com',
        linkedin:  'linkedin.com',
        tiktok:    'tiktok.com'
      };

      var platforms = [];

      Object.keys(socialDomains).forEach(function(platform) {
        var found = false;
        var url   = null;

        if (websiteData && websiteData.socialLinks && websiteData.socialLinks[platform]) {
          found = true;
          url   = websiteData.socialLinks[platform];
        }

        platforms.push({ platform: platform, url: url, found: found });
      });

      return Promise.resolve(platforms);
    } catch (e) {
      return Promise.resolve([]);
    }
  }

  /* ---- Step 3: Google Places ---- */

  function fetchGooglePlaces(companyName, location) {
    setStatus('Paso 3/4 — Consultando Google Places...');

    if (!hasGoogleKey()) {
      return Promise.resolve({ skipped: true, reason: 'API key de Google Places no configurada' });
    }

    var input  = encodeURIComponent((companyName || '') + ' ' + (location || ''));
    var fields = 'place_id,name,formatted_address,rating,user_ratings_total,photos,types,opening_hours,geometry';
    var url    = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json' +
                 '?input=' + input +
                 '&inputtype=textquery' +
                 '&fields=' + fields +
                 '&key=' + GOOGLE_PLACES_API_KEY;

    return fetch(CORS_PROXY + encodeURIComponent(url))
      .then(function(res) { return res.json(); })
      .then(function(wrapper) {
        var data = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
        if (!data.candidates || !data.candidates.length) {
          return { skipped: true, reason: 'No se encontró el negocio en Google Places' };
        }
        var place = data.candidates[0];
        return {
          placeId:     place.place_id,
          name:        place.name,
          address:     place.formatted_address,
          rating:      place.rating,
          reviewCount: place.user_ratings_total,
          types:       place.types || [],
          hasPhotos:   !!(place.photos && place.photos.length),
          isOpen:      place.opening_hours ? place.opening_hours.open_now : null,
          geometry:    place.geometry
        };
      })
      .catch(function() {
        return { skipped: true, reason: 'Error al consultar Google Places' };
      });
  }

  /* ---- Step 4: Competitor Analysis ---- */

  function fetchCompetitors(placesData) {
    setStatus('Paso 4/4 — Analizando competidores...');

    if (!hasGoogleKey()) {
      return Promise.resolve({ skipped: true, reason: 'Requiere API key de Google Places' });
    }

    if (!placesData || placesData.skipped || !placesData.geometry) {
      return Promise.resolve({ skipped: true, reason: 'Se requieren datos de Google Places primero' });
    }

    var lat  = placesData.geometry.location.lat;
    var lng  = placesData.geometry.location.lng;
    var type = placesData.types && placesData.types[0] ? placesData.types[0] : 'establishment';

    var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
              '?location=' + lat + ',' + lng +
              '&radius=5000' +
              '&type=' + encodeURIComponent(type) +
              '&key=' + GOOGLE_PLACES_API_KEY;

    return fetch(CORS_PROXY + encodeURIComponent(url))
      .then(function(res) { return res.json(); })
      .then(function(wrapper) {
        var data = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
        if (!data.results || !data.results.length) {
          return { skipped: true, reason: 'No se encontraron competidores cercanos' };
        }

        var competitors = data.results
          .filter(function(p) { return p.place_id !== placesData.placeId; })
          .slice(0, 5)
          .map(function(p) {
            return {
              name:        p.name,
              rating:      p.rating || 0,
              reviewCount: p.user_ratings_total || 0
            };
          });

        var avgRating = competitors.length
          ? Math.round(competitors.reduce(function(sum, c) { return sum + c.rating; }, 0) / competitors.length * 10) / 10
          : 0;

        var insight = '';
        if (placesData.rating && avgRating) {
          if (placesData.rating < avgRating - 0.3) {
            insight = 'Su rating (' + placesData.rating + '★) está por debajo del promedio de competidores (' + avgRating + '★). Oportunidad de mejorar reputación online.';
          } else if (placesData.rating >= avgRating + 0.3) {
            insight = 'Su rating (' + placesData.rating + '★) supera el promedio de competidores (' + avgRating + '★). Ventaja competitiva a aprovechar.';
          } else {
            insight = 'Su rating (' + placesData.rating + '★) está al nivel del promedio del mercado (' + avgRating + '★).';
          }
        }

        return { competitors: competitors, avgRating: avgRating, insight: insight };
      })
      .catch(function() {
        return { skipped: true, reason: 'Error al buscar competidores' };
      });
  }

  /* ---- Main runner ---- */

  function runScraper() {
    var url         = (document.getElementById('scraperUrl')      || {}).value || '';
    var companyName = (document.getElementById('scraperName')     || {}).value || '';
    var location    = (document.getElementById('scraperLocation') || {}).value || '';

    url = url.trim();
    companyName = companyName.trim();
    location = location.trim();

    var resultsEl = document.getElementById('scraperResults');
    if (resultsEl) resultsEl.innerHTML = '';

    var runBtn     = document.getElementById('scraperRunBtn');
    var btnTextEl  = runBtn ? runBtn.querySelector('.scraper-btn-text') : null;
    var origBtnText = btnTextEl ? btnTextEl.innerHTML : '';

    if (runBtn) runBtn.disabled = true;
    if (btnTextEl) btnTextEl.textContent = 'Escaneando...';

    setStatus('Iniciando análisis...');

    var websiteData = null;
    var socialData  = null;
    var placesData  = null;
    var compData    = null;

    analyzeWebsite(url)
      .then(function(wd) {
        websiteData = wd;
        return analyzeSocial(websiteData, companyName, location);
      })
      .then(function(sd) {
        socialData = sd;
        return fetchGooglePlaces(companyName, location);
      })
      .then(function(pd) {
        placesData = pd;
        return fetchCompetitors(placesData);
      })
      .then(function(cd) {
        compData = cd;

        collectedData = {
          website:     websiteData,
          social:      socialData,
          places:      placesData,
          competitors: compData
        };

        setStatus('Análisis completado.');
        renderResults(collectedData);

        var saveBtn = document.getElementById('scraperSaveBtn');
        if (saveBtn) saveBtn.disabled = false;
      })
      .catch(function() {
        setStatus('Error durante el análisis. Intenta de nuevo.');
      })
      .finally(function() {
        if (runBtn) runBtn.disabled = false;
        if (btnTextEl) btnTextEl.innerHTML = origBtnText;
      });
  }

  /* ---- Render results ---- */

  function renderResults(data) {
    var container = document.getElementById('scraperResults');
    if (!container) return;
    container.innerHTML = '';

    // ---- Card 1: Website ----
    renderWebsiteCard(container, data.website);

    // ---- Card 2: Social Media ----
    renderSocialCard(container, data.social);

    // ---- Card 3: Google Places ----
    renderPlacesCard(container, data.places);

    // ---- Card 4: Competitors ----
    renderCompetitorsCard(container, data.competitors, data.places);

    // ---- Card 5: Opportunities ----
    renderOpportunities(container, data);
  }

  function renderWebsiteCard(container, w) {
    w = w || {};
    var card = document.createElement('div');
    card.className = 'scraper-card';

    function badge(label, ok) {
      return '<span class="scraper-badge ' + (ok ? 'ok' : 'fail') + '">' +
             escHtml(label) + ' ' + (ok ? '✓' : '✗') + '</span>';
    }

    var content = '<div class="scraper-card-title">1. Website</div>';

    if (w.error === 'no_url') {
      content += '<div class="scraper-msg">No se proporcionó URL de sitio web.</div>';
    } else if (w.error === 'fetch_failed') {
      content += '<div class="scraper-msg scraper-msg--warn">No se pudo acceder al sitio — verifica la URL e intenta de nuevo.</div>';
    } else {
      content +=
        (w.url ? '<div class="scraper-card-url"><a href="' + escHtml(w.url) + '" target="_blank" rel="noopener">' + escHtml(w.url) + '</a></div>' : '') +
        (w.title ? '<div class="scraper-card-meta"><strong>' + escHtml(w.title) + '</strong></div>' : '') +
        (w.description ? '<div class="scraper-card-meta">' + escHtml(w.description) + '</div>' : '') +
        '<div class="scraper-badges">' +
          badge('SSL', w.isSSL) +
          badge('Mobile', w.hasViewportMeta) +
          badge('Analytics', w.hasAnalytics) +
          badge('WhatsApp', w.hasWhatsAppWidget) +
          badge('Chat', w.hasLiveChat) +
          badge('Reservas', w.hasBooking) +
        '</div>';
    }

    card.innerHTML = content;
    container.appendChild(card);
  }

  function renderSocialCard(container, platforms) {
    var card = document.createElement('div');
    card.className = 'scraper-card';

    var content = '<div class="scraper-card-title">2. Redes Sociales</div>';

    if (!platforms || !platforms.length) {
      content += '<div class="scraper-msg">No se detectaron redes sociales.</div>';
    } else {
      var labels = {
        facebook:  'Facebook',
        instagram: 'Instagram',
        twitter:   'Twitter/X',
        linkedin:  'LinkedIn',
        tiktok:    'TikTok'
      };

      content += '<div class="scraper-social-badges">';
      platforms.forEach(function(p) {
        if (p.found && p.url) {
          content += '<a href="' + escHtml(p.url) + '" target="_blank" rel="noopener" class="scraper-badge ok">' +
                     escHtml(labels[p.platform] || p.platform) + ' ✓</a>';
        } else {
          content += '<span class="scraper-badge fail">' +
                     escHtml(labels[p.platform] || p.platform) + ' ✗</span>';
        }
      });
      content += '</div>';

      var found = platforms.filter(function(p) { return p.found; });
      content += '<div class="scraper-card-meta">' + found.length + ' de ' + platforms.length + ' plataformas detectadas</div>';
    }

    card.innerHTML = content;
    container.appendChild(card);
  }

  function renderPlacesCard(container, places) {
    var card = document.createElement('div');
    card.className = 'scraper-card';

    var content = '<div class="scraper-card-title">3. Google Places</div>';

    if (!places) {
      content += '<div class="scraper-msg">Sin datos de Google Places.</div>';
    } else if (places.skipped) {
      content += '<div class="scraper-msg scraper-msg--warn">' + escHtml(places.reason) + '</div>';
    } else {
      var mapsQuery = encodeURIComponent((places.name || '') + ' ' + (places.address || ''));
      content +=
        '<div class="scraper-card-meta"><strong>' + escHtml(places.name) + '</strong></div>' +
        (places.rating
          ? '<div class="scraper-rating">' + places.rating + ' ★ (' + (places.reviewCount || 0) + ' reseñas)</div>'
          : '<div class="scraper-rating">Sin calificación</div>') +
        '<div class="scraper-address">' + escHtml(places.address || '') + '</div>' +
        '<a href="https://maps.google.com/?q=' + mapsQuery + '" target="_blank" rel="noopener" class="scraper-link">Ver en Maps →</a>';
    }

    card.innerHTML = content;
    container.appendChild(card);
  }

  function renderCompetitorsCard(container, compData, placesData) {
    var card = document.createElement('div');
    card.className = 'scraper-card';

    var content = '<div class="scraper-card-title">4. Competidores</div>';

    if (!compData) {
      content += '<div class="scraper-msg">Sin datos de competidores.</div>';
    } else if (compData.skipped) {
      content += '<div class="scraper-msg scraper-msg--warn">' + escHtml(compData.reason) + '</div>';
    } else if (!compData.competitors || !compData.competitors.length) {
      content += '<div class="scraper-msg">No se encontraron competidores cercanos.</div>';
    } else {
      var rows = compData.competitors.map(function(comp) {
        return '<tr>' +
          '<td>' + escHtml(comp.name) + '</td>' +
          '<td>' + (comp.rating ? comp.rating + ' ★' : '—') + '</td>' +
          '<td>' + (comp.reviewCount || '—') + '</td>' +
        '</tr>';
      }).join('');

      content +=
        '<table class="scraper-comp-table">' +
          '<thead><tr><th>Nombre</th><th>Rating</th><th>Reseñas</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        (compData.insight ? '<div class="scraper-insight">' + escHtml(compData.insight) + '</div>' : '');
    }

    card.innerHTML = content;
    container.appendChild(card);
  }

  function renderOpportunities(container, data) {
    var opportunities = [];
    var w = data.website || {};

    if (w.error === 'no_url' || !w.url) {
      opportunities.push('No tiene sitio web — oportunidad de Website + Chat IA');
    }

    var hasSocial = data.social && data.social.some(function(p) { return p.found; });
    if (!hasSocial) {
      opportunities.push('Sin presencia en redes sociales detectada — oportunidad de marketing digital');
    }

    if (data.places && !data.places.skipped && data.competitors && !data.competitors.skipped &&
        data.competitors.avgRating && data.places.rating && data.places.rating < data.competitors.avgRating - 0.3) {
      opportunities.push('Rating bajo vs competidores — oportunidad de mejorar reputación online');
    }

    if (!w.error && !w.hasAnalytics) {
      opportunities.push('Sin analytics — no está midiendo el tráfico web');
    }

    if (!w.error && !w.hasWhatsAppWidget) {
      opportunities.push('Sin WhatsApp en web — oportunidad de Bot de WhatsApp');
    }

    if (!w.error && !w.hasBooking) {
      opportunities.push('Sin sistema de reservas — oportunidad de automatización');
    }

    if (!opportunities.length) return;

    var card = document.createElement('div');
    card.className = 'scraper-card scraper-summary';

    var liItems = opportunities.map(function(o) {
      return '<li>' + escHtml(o) + '</li>';
    }).join('');

    card.innerHTML =
      '<div class="scraper-card-title">Oportunidades detectadas</div>' +
      '<ul class="scraper-opportunities">' + liItems + '</ul>';

    container.appendChild(card);
  }

  /* ---- Save results to Supabase ---- */

  function saveResults() {
    if (!collectedData) return;

    if (typeof IgneaSupabase === 'undefined' || !IgneaSupabase.client) {
      alert('Supabase no configurado — configura las credenciales primero');
      return;
    }

    var leadSel = document.getElementById('scraperLeadSelect');
    var leadId  = leadSel ? leadSel.value : null;
    if (!leadId) {
      alert('Selecciona un lead para guardar los resultados');
      return;
    }

    IgneaSupabase.client
      .from('leads')
      .update({
        scraper_data:   collectedData,
        scraper_ran_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .then(function(result) {
        if (result.error) return;

        setStatus('Datos guardados en lead.');

        var user = OpsAuth.getUser ? OpsAuth.getUser() : null;
        if (user) {
          IgneaSupabase.client
            .from('lead_activity')
            .insert([{
              lead_id:    leadId,
              user_id:    user.id,
              action:     'scraper_ran',
              details:    collectedData.website ? collectedData.website.url : null
            }]);
        }
      });
  }

  /* ---- init ---- */

  function init() {
    populateLeadSelect();

    var leadSel = document.getElementById('scraperLeadSelect');
    if (leadSel) {
      leadSel.addEventListener('change', function() {
        var leads = typeof OpsDashboard !== 'undefined' ? OpsDashboard.getAllLeads() : [];
        var lead  = leads.find(function(l) { return String(l.id) === leadSel.value; });
        if (lead) prefillFromLead(lead);
      });
    }

    var runBtn = document.getElementById('scraperRunBtn');
    if (runBtn) runBtn.addEventListener('click', runScraper);

    var saveBtn = document.getElementById('scraperSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveResults);

    document.addEventListener('ops:openScraper', function(e) {
      if (e.detail && e.detail.lead) {
        prefillFromLead(e.detail.lead);
      }
    });
  }

  /* ---- Public API ---- */

  return {
    init:            init,
    prefillFromLead: prefillFromLead,
    saveResults:     saveResults
  };

})();
