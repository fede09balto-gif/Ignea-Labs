/* ============================================================
   ONDA AI — Ops Scraper Module
   Website analysis, social presence detection, Google Places
   lookup, and competitor analysis for the ops dashboard.
   ============================================================ */

var OpsScraper = (function() {

  var CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  var GOOGLE_PLACES_API_KEY = 'GOOGLE_PLACES_API_KEY'; // placeholder

  /* ---- Collected data from last run ---- */
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

  /* ---- Populate lead select ---- */

  function populateLeadSelect() {
    var sel = document.getElementById('scraperLeadSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Seleccionar prospecto —</option>';
    var leads = OpsDashboard.getAllLeads();
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
    if (urlEl) urlEl.value = lead.website || '';

    var nameEl = document.getElementById('scraperName');
    if (nameEl) nameEl.value = lead.company_name || '';

    var locEl = document.getElementById('scraperLocation');
    if (locEl) locEl.value = lead.location || lead.city || '';

    var selEl = document.getElementById('scraperLeadSelect');
    if (selEl) selEl.value = lead.id;
  }

  /* ---- Step 1: Website Analysis ---- */

  function analyzeWebsite(url) {
    return new Promise(function(resolve) {
      if (!url || !url.trim()) {
        resolve({ error: 'no_url' });
        return;
      }

      var cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }

      setStatus('Analizando sitio web...');

      var proxyUrl = CORS_PROXY + encodeURIComponent(cleanUrl);

      fetch(proxyUrl)
        .then(function(res) { return res.text(); })
        .then(function(html) {
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

          resolve({
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
          });
        })
        .catch(function() {
          resolve({ url: cleanUrl, error: 'fetch_failed' });
        });
    });
  }

  /* ---- Step 2: Social Media Presence ---- */

  function analyzeSocial(websiteData, companyName, location) {
    var platforms = [];
    var socialDomains = {
      facebook:  'facebook.com',
      instagram: 'instagram.com',
      twitter:   'twitter.com',
      linkedin:  'linkedin.com',
      tiktok:    'tiktok.com'
    };

    setStatus('Verificando presencia en redes sociales...');

    if (websiteData && websiteData.socialLinks) {
      Object.keys(socialDomains).forEach(function(platform) {
        if (websiteData.socialLinks[platform]) {
          platforms.push({ platform: platform, url: websiteData.socialLinks[platform], found: true });
        } else {
          var query = encodeURIComponent((companyName || '') + ' ' + (location || ''));
          var searchUrl;
          if (platform === 'facebook') {
            searchUrl = 'https://facebook.com/search/top?q=' + query;
          } else if (platform === 'instagram') {
            var slug = (companyName || '').toLowerCase().replace(/\s+/g, '');
            searchUrl = 'https://instagram.com/' + encodeURIComponent(slug);
          } else {
            searchUrl = null;
          }
          platforms.push({ platform: platform, url: searchUrl, found: false });
        }
      });
    } else {
      var query = encodeURIComponent((companyName || '') + ' ' + (location || ''));
      platforms.push({ platform: 'facebook',  url: 'https://facebook.com/search/top?q=' + query, found: false });
      var slug = (companyName || '').toLowerCase().replace(/\s+/g, '');
      platforms.push({ platform: 'instagram', url: 'https://instagram.com/' + encodeURIComponent(slug), found: false });
    }

    return Promise.resolve(platforms);
  }

  /* ---- Step 3: Google Places ---- */

  function fetchGooglePlaces(companyName, location) {
    return new Promise(function(resolve) {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'GOOGLE_PLACES_API_KEY') {
        setStatus('API key no configurada — omitiendo Google Places');
        resolve(null);
        return;
      }

      setStatus('Consultando Google Places...');

      var input  = encodeURIComponent((companyName || '') + ' ' + (location || ''));
      var fields = 'place_id,name,formatted_address,rating,user_ratings_total,photos,types,opening_hours,geometry';
      var url    = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json' +
                   '?input=' + input +
                   '&inputtype=textquery' +
                   '&fields=' + fields +
                   '&key=' + GOOGLE_PLACES_API_KEY;

      fetch(CORS_PROXY + encodeURIComponent(url))
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (!data.candidates || !data.candidates.length) {
            resolve(null);
            return;
          }
          var place = data.candidates[0];
          resolve({
            placeId:     place.place_id,
            name:        place.name,
            address:     place.formatted_address,
            rating:      place.rating,
            reviewCount: place.user_ratings_total,
            types:       place.types || [],
            hasPhotos:   !!(place.photos && place.photos.length),
            isOpen:      place.opening_hours ? place.opening_hours.open_now : null,
            geometry:    place.geometry
          });
        })
        .catch(function() { resolve(null); });
    });
  }

  /* ---- Step 4: Competitor Analysis ---- */

  function fetchCompetitors(placesData) {
    return new Promise(function(resolve) {
      if (!placesData || !placesData.geometry || GOOGLE_PLACES_API_KEY === 'GOOGLE_PLACES_API_KEY') {
        resolve(null);
        return;
      }

      setStatus('Analizando competidores cercanos...');

      var lat  = placesData.geometry.location.lat;
      var lng  = placesData.geometry.location.lng;
      var type = placesData.types && placesData.types[0] ? placesData.types[0] : 'establishment';

      var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
                '?location=' + lat + ',' + lng +
                '&radius=5000' +
                '&type=' + encodeURIComponent(type) +
                '&key=' + GOOGLE_PLACES_API_KEY;

      fetch(CORS_PROXY + encodeURIComponent(url))
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (!data.results) { resolve(null); return; }

          var competitors = data.results
            .filter(function(p) { return p.place_id !== placesData.placeId; })
            .slice(0, 5)
            .map(function(p) {
              return {
                name:        p.name,
                rating:      p.rating || 0,
                reviewCount: p.user_ratings_total || 0,
                website:     p.website || null
              };
            });

          var avgRating = competitors.length
            ? (competitors.reduce(function(sum, c) { return sum + c.rating; }, 0) / competitors.length)
            : 0;
          avgRating = Math.round(avgRating * 10) / 10;

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

          resolve({ competitors: competitors, avgRating: avgRating, insight: insight });
        })
        .catch(function() { resolve(null); });
    });
  }

  /* ---- Main runner ---- */

  function runScraper() {
    var url         = (document.getElementById('scraperUrl')      ? document.getElementById('scraperUrl').value      : '').trim();
    var companyName = (document.getElementById('scraperName')     ? document.getElementById('scraperName').value     : '').trim();
    var location    = (document.getElementById('scraperLocation') ? document.getElementById('scraperLocation').value : '').trim();

    var resultsEl = document.getElementById('scraperResults');
    if (resultsEl) resultsEl.innerHTML = '';

    var runBtn = document.getElementById('scraperRunBtn');
    if (runBtn) runBtn.disabled = true;

    setStatus('Iniciando análisis...');

    analyzeWebsite(url)
      .then(function(websiteData) {
        return analyzeSocial(websiteData, companyName, location)
          .then(function(socialData) {
            return fetchGooglePlaces(companyName, location)
              .then(function(placesData) {
                return fetchCompetitors(placesData)
                  .then(function(compData) {
                    return {
                      website:     websiteData,
                      social:      socialData,
                      places:      placesData,
                      competitors: compData
                    };
                  });
              });
          });
      })
      .then(function(data) {
        collectedData = data;
        setStatus('Análisis completado.');
        renderResults(data);
        var saveBtn = document.getElementById('scraperSaveBtn');
        if (saveBtn) saveBtn.disabled = false;
      })
      .catch(function() {
        setStatus('Error durante el análisis. Intenta de nuevo.');
      })
      .finally(function() {
        if (runBtn) runBtn.disabled = false;
      });
  }

  /* ---- Render results ---- */

  function renderResults(data) {
    var container = document.getElementById('scraperResults');
    if (!container) return;
    container.innerHTML = '';

    // ---- Card 1: Website ----
    var w = data.website || {};
    var websiteCard = document.createElement('div');
    websiteCard.className = 'scraper-card';

    var badgesHtml = '';
    function badge(label, ok) {
      return '<span class="scraper-badge ' + (ok ? 'ok' : 'fail') + '">' +
             escHtml(label) + ' ' + (ok ? '✓' : '✗') + '</span>';
    }

    if (w.error === 'no_url') {
      badgesHtml = '<div class="scraper-no-url">No se proporcionó URL de sitio web.</div>';
    } else if (w.error === 'fetch_failed') {
      badgesHtml = '<div class="scraper-no-url">No se pudo acceder al sitio web.</div>';
    } else {
      badgesHtml =
        badge('SSL',       w.isSSL) +
        badge('Mobile',    w.hasViewportMeta) +
        badge('Analytics', w.hasAnalytics) +
        badge('WhatsApp',  w.hasWhatsAppWidget) +
        badge('Chat',      w.hasLiveChat) +
        badge('Booking',   w.hasBooking);
    }

    var socialsHtml = '';
    if (w.socialLinks) {
      var socialLabels = {
        facebook:  'Facebook',
        instagram: 'Instagram',
        twitter:   'Twitter/X',
        linkedin:  'LinkedIn',
        tiktok:    'TikTok'
      };
      Object.keys(w.socialLinks).forEach(function(platform) {
        socialsHtml +=
          '<a href="' + escHtml(w.socialLinks[platform]) + '" target="_blank" rel="noopener" class="scraper-social-link">' +
            escHtml(socialLabels[platform] || platform) + ' →' +
          '</a> ';
      });
    }

    websiteCard.innerHTML =
      '<div class="scraper-card-title">Website</div>' +
      (w.url ? '<div class="scraper-card-url"><a href="' + escHtml(w.url) + '" target="_blank" rel="noopener">' + escHtml(w.url) + '</a></div>' : '') +
      (w.title ? '<div class="scraper-card-meta">' + escHtml(w.title) + '</div>' : '') +
      '<div class="scraper-badges">' + badgesHtml + '</div>' +
      (socialsHtml ? '<div class="scraper-socials">' + socialsHtml + '</div>' : '');

    container.appendChild(websiteCard);

    // ---- Card 2: Google Maps ----
    if (data.places) {
      var p = data.places;
      var mapsCard = document.createElement('div');
      mapsCard.className = 'scraper-card';

      var mapsQuery = encodeURIComponent((p.name || '') + ' ' + (p.address || ''));

      mapsCard.innerHTML =
        '<div class="scraper-card-title">Google Maps</div>' +
        (p.rating
          ? '<div class="scraper-rating">' + p.rating + ' ★ (' + (p.reviewCount || 0) + ' reseñas)</div>'
          : '<div class="scraper-rating">Sin calificación</div>') +
        '<div class="scraper-address">' + escHtml(p.address || '') + '</div>' +
        '<a href="https://maps.google.com/?q=' + mapsQuery + '" target="_blank" rel="noopener" class="scraper-link">Ver en Maps →</a>';

      container.appendChild(mapsCard);
    }

    // ---- Card 3: Competitors ----
    if (data.competitors && data.competitors.competitors && data.competitors.competitors.length) {
      var c   = data.competitors;
      var compCard = document.createElement('div');
      compCard.className = 'scraper-card';

      var rows = c.competitors.map(function(comp) {
        return '<tr>' +
          '<td>' + escHtml(comp.name) + '</td>' +
          '<td>' + (comp.rating ? comp.rating + ' ★' : '—') + '</td>' +
          '<td>' + (comp.reviewCount || '—') + '</td>' +
        '</tr>';
      }).join('');

      compCard.innerHTML =
        '<div class="scraper-card-title">Competidores</div>' +
        '<table class="scraper-comp-table">' +
          '<thead><tr><th>Nombre</th><th>Rating</th><th>Reseñas</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        (c.insight ? '<div class="scraper-insight">' + escHtml(c.insight) + '</div>' : '');

      container.appendChild(compCard);
    }

    // ---- Card 4: Opportunities ----
    var opportunities = [];
    var w2 = data.website || {};

    if (w2.error === 'no_url' || !w2.url) {
      opportunities.push('No tiene sitio web — oportunidad de Website + Chat IA');
    }

    var hasSocial = w2.socialLinks && Object.keys(w2.socialLinks).length > 0;
    if (!hasSocial) {
      opportunities.push('Sin presencia en redes sociales detectada — oportunidad de marketing digital');
    }

    if (data.places && data.competitors && data.competitors.avgRating &&
        data.places.rating && data.places.rating < data.competitors.avgRating - 0.3) {
      opportunities.push('Rating bajo vs competidores — oportunidad de mejorar reputación online');
    }

    if (!w2.hasAnalytics && !w2.error) {
      opportunities.push('Sin analytics — no está midiendo el tráfico web');
    }

    if (!w2.hasWhatsAppWidget && !w2.error) {
      opportunities.push('Sin WhatsApp en web — oportunidad de Bot de WhatsApp');
    }

    if (!w2.hasBooking && !w2.error) {
      opportunities.push('Sin sistema de reservas — oportunidad de automatización');
    }

    if (opportunities.length) {
      var summCard = document.createElement('div');
      summCard.className = 'scraper-card scraper-summary';

      var liItems = opportunities.map(function(o) {
        return '<li>' + escHtml(o) + '</li>';
      }).join('');

      summCard.innerHTML =
        '<div class="scraper-card-title">Oportunidades</div>' +
        '<ul class="scraper-opportunities">' + liItems + '</ul>';

      container.appendChild(summCard);
    }
  }

  /* ---- Save results to Supabase ---- */

  function saveResults() {
    if (!collectedData) return;

    var leadSel = document.getElementById('scraperLeadSelect');
    var leadId  = leadSel ? leadSel.value : null;
    if (!leadId) return;

    OndaSupabase.client
      .from('leads')
      .update({
        scraper_data:   collectedData,
        scraper_ran_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .then(function(result) {
        if (result.error) return;

        var saveBtn = document.getElementById('scraperSaveBtn');
        if (saveBtn) {
          var orig = saveBtn.textContent;
          saveBtn.textContent = 'Guardado ✓';
          setTimeout(function() { saveBtn.textContent = orig; }, 2000);
        }

        // Log activity
        var user = OpsAuth.getUser ? OpsAuth.getUser() : {};
        OndaSupabase.client
          .from('activity_log')
          .insert([{
            lead_id:    leadId,
            user_id:    user ? user.id : null,
            action:     'scraper_ran',
            details:    JSON.stringify({ url: collectedData.website ? collectedData.website.url : null }),
            created_at: new Date().toISOString()
          }]);
      });
  }

  /* ---- init ---- */

  function init() {
    populateLeadSelect();

    var leadSel = document.getElementById('scraperLeadSelect');
    if (leadSel) {
      leadSel.addEventListener('change', function() {
        var leads = OpsDashboard.getAllLeads();
        var lead  = leads.find(function(l) { return String(l.id) === leadSel.value; });
        if (lead) prefillFromLead(lead);
      });
    }

    var runBtn = document.getElementById('scraperRunBtn');
    if (runBtn) runBtn.addEventListener('click', runScraper);

    var saveBtn = document.getElementById('scraperSaveBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.addEventListener('click', saveResults);
    }

    document.addEventListener('ops:openScraper', function(e) {
      if (e.detail && e.detail.lead) {
        prefillFromLead(e.detail.lead);
      }
    });
  }

  /* ---- Public API ---- */

  return {
    init:            init,
    prefillFromLead: prefillFromLead
  };

})();
