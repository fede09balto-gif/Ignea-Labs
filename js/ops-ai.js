/* ============================================================
   IGNEA LABS — AI Module (Claude API)
   Generates recommendations and proposals from diagnostic data.
   Requires: window.CLAUDE_API_KEY to be set.
   ============================================================ */

(function() {
  var CLAUDE_MODEL = 'claude-sonnet-4-20250514';

  function getApiKey() {
    return window.CLAUDE_API_KEY || localStorage.getItem('ignea_ops_claude_key') || '';
  }

  async function callClaude(systemPrompt, userMessage, opts) {
    var key = getApiKey();
    if (!key) {
      throw new Error('Claude API key not configured. Click "API Key" in the ops nav to set it.');
    }
    opts = opts || {};

    var body = {
      model: CLAUDE_MODEL,
      max_tokens: opts.max_tokens || 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    };
    if (opts.temperature !== undefined) body.temperature = opts.temperature;

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      var errorData = await response.json().catch(function() { return {}; });
      var msg = (errorData.error && errorData.error.message) || ('HTTP ' + response.status);
      throw new Error(msg);
    }

    var data = await response.json();
    return data.content[0].text;
  }

  /* ---- Build diagnostic context string ---- */

  function buildDiagnosticContext(lead) {
    var parts = [];
    parts.push('Company: ' + (lead.company_name || 'Unknown'));
    parts.push('Industry: ' + (lead.industry || 'Unknown'));
    parts.push('Team size: ' + (lead.company_size || 'Unknown'));

    var answers = lead.diagnostic_answers || {};
    var isIntake = answers.q4_headache !== undefined || answers.q5_timeleaks !== undefined || answers.q2_business !== undefined;

    if (isIntake) {
      parts.push('\nIntake answers:');
      if (answers.q2_business) parts.push('About their business: ' + answers.q2_business);
      if (answers.q4_headache) parts.push('Biggest operational headache: ' + answers.q4_headache);
      if (answers.q5_timeleaks) parts.push('Where team loses time: ' + (Array.isArray(answers.q5_timeleaks) ? answers.q5_timeleaks.join(', ') : answers.q5_timeleaks));
      if (answers.q6_tools) parts.push('Current tools: ' + (Array.isArray(answers.q6_tools) ? answers.q6_tools.join(', ') : answers.q6_tools));
      if (answers.q7_tried) parts.push('Previous attempts to solve: ' + answers.q7_tried);
      if (lead.opportunityCount) parts.push('Opportunities identified: ' + lead.opportunityCount);
      if (lead.estimatedHoursLost) parts.push('Estimated hours lost/week: ' + lead.estimatedHoursLost);
      if (lead.revenue) parts.push('Monthly revenue range: ' + lead.revenue);
    } else {
      parts.push('Score: ' + (lead.total_score || 0) + '/100 (' + (lead.score_level || 'unknown') + ')');
      if (lead.score_breakdown) {
        parts.push('\nDimension scores:');
        var dims = lead.score_breakdown;
        ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'].forEach(function(k) {
          if (dims[k] !== undefined) parts.push('- ' + k + ': ' + dims[k] + '/20');
        });
      }
      parts.push('\nDiagnostic answers:');
      for (var q = 1; q <= 11; q++) {
        var val = answers['q' + q];
        if (val !== undefined && val !== null) {
          parts.push('Q' + q + ': ' + (typeof val === 'object' ? JSON.stringify(val) : String(val)));
        }
      }
    }

    if (lead.company_website) parts.push('\nWebsite: ' + lead.company_website);
    return parts.join('\n');
  }

  /* ---- Cache helpers ---- */

  function getCached(leadId, type) {
    try {
      var cache = JSON.parse(localStorage.getItem('ignea_ai_cache') || '{}');
      return cache[leadId + '_' + type] || null;
    } catch(e) { return null; }
  }

  function setCache(leadId, type, data) {
    try {
      var cache = JSON.parse(localStorage.getItem('ignea_ai_cache') || '{}');
      cache[leadId + '_' + type] = { data: data, ts: Date.now() };
      localStorage.setItem('ignea_ai_cache', JSON.stringify(cache));
    } catch(e) {}
  }

  /* ================================================
     SUMMARY MODE — quick 1-call analysis
     ================================================ */

  async function generateSummary(lead) {
    var cached = getCached(lead.id, 'summary');
    if (cached) return cached.data;

    var systemPrompt =
      'You are a senior business analyst at a top-tier consulting firm preparing a pre-call brief. You are direct, precise, and never pad your analysis.\n\n' +
      'INPUT: Diagnostic intake form from a Latin American SMB.\n\n' +
      'OUTPUT: Respond ONLY in valid JSON, in the same language as the input (Spanish if Spanish, English if English).\n\n' +
      'Return this exact structure:\n' +
      '{\n' +
      '  "overview": "2-3 sentences. What the business does, their core operational bottleneck, and the estimated scale of the problem. No fluff.",\n' +
      '  "pain_points": ["Each bullet with a SPECIFIC metric from their answers. Not \\"they waste time on WhatsApp\\" but \\"Staff spends ~3hrs/day on 30-50 repetitive WhatsApp messages, displacing in-person service.\\""],\n' +
      '  "recommended_project": "One project only. Name it, describe what it does in one sentence, and explain why THIS one goes first.",\n' +
      '  "savings_calculation": "Show your math step by step. Example: 3 hrs/day x 6 days/week x 4 weeks = 72 hrs/month. At estimated $3-4/hr = $216-$288/month in direct labor. Plus revenue recovery: $200-400/month. Total: $416-$688/month. Never give a savings number without showing the calculation.",\n' +
      '  "monthly_savings_min": 0,\n' +
      '  "monthly_savings_max": 0,\n' +
      '  "price_calculation": "Formula: (monthly savings x 4 months) x 30% capture rate. Show the formula with actual numbers.",\n' +
      '  "suggested_price_min": 0,\n' +
      '  "suggested_price_max": 0,\n' +
      '  "discovery_questions": ["Questions that QUANTIFY the problem. Not \\"how do you feel about technology\\" but \\"How many reservation requests came in after 10pm last month, and what was the average party size?\\""],\n' +
      '  "unknowns": "What you DON\'T know from the intake alone that matters for the proposal."\n' +
      '}\n\n' +
      'RULES:\n' +
      '- Never hallucinate competitor names or market data. If you don\'t know, say "requires research."\n' +
      '- Never list more than 4 solutions in a summary. Less is more.\n' +
      '- Every dollar figure must have a calculation behind it.\n' +
      '- Be honest about what you DON\'T know from the intake alone.\n' +
      '- Frame the opportunity positively but never exaggerate.\n' +
      '- Maximum 3 pain points, maximum 3 discovery questions.';

    var userMessage = buildDiagnosticContext(lead);
    var result = await callClaude(systemPrompt, userMessage, { max_tokens: 2000, temperature: 0 });
    var cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    var parsed = JSON.parse(cleaned);
    setCache(lead.id, 'summary', parsed);
    return parsed;
  }

  /* ================================================
     DEEP ANALYSIS MODE — comprehensive multi-call
     ================================================ */

  async function generateDeepAnalysis(lead, scraperData) {
    var cached = getCached(lead.id, 'deep_analysis');
    if (cached) return cached.data;

    var context = buildDiagnosticContext(lead);
    var hasWebsiteData = false;

    if (scraperData && !scraperData.error) {
      hasWebsiteData = true;
      context += '\n\nWebsite analysis:\n';
      var w = scraperData.website || {};
      if (w.title) context += '- Title: ' + w.title + '\n';
      if (w.description) context += '- Description: ' + w.description + '\n';
      context += '- Has analytics: ' + (w.hasAnalytics ? 'yes' : 'no') + '\n';
      context += '- Has WhatsApp: ' + (w.hasWhatsAppWidget ? 'yes' : 'no') + '\n';
      context += '- Has booking system: ' + (w.hasBooking ? 'yes' : 'no') + '\n';
      context += '- Has live chat: ' + (w.hasLiveChat ? 'yes' : 'no') + '\n';
      context += '- SSL: ' + (w.isSSL ? 'yes' : 'no') + '\n';
      context += '- Mobile-friendly: ' + (w.hasViewportMeta ? 'yes' : 'no') + '\n';
      var social = scraperData.social || [];
      var foundSocial = social.filter(function(s) { return s.found; }).map(function(s) { return s.platform; });
      if (foundSocial.length) context += '- Social media: ' + foundSocial.join(', ') + '\n';
    }

    var systemPrompt =
      'You are a managing consultant preparing a comprehensive pre-engagement analysis. Your output will be used internally to prepare a client proposal and discovery call. Be rigorous.\n\n' +
      'INPUT: Diagnostic intake form' + (hasWebsiteData ? ' + website analysis' : '') + ' from a Latin American SMB.\n\n' +
      'OUTPUT: Respond ONLY in valid JSON, in the same language as the input.\n\n' +
      'Return this exact structure:\n' +
      '{\n' +
      '  "assessment": "3-4 paragraphs. Current state of operations, what is working, what is broken, and the ROOT CAUSE (not symptoms). Reference specific details from their intake answers.",\n' +
      '  "solutions": [\n' +
      '    {\n' +
      '      "phase": 1,\n' +
      '      "name": "Phase name",\n' +
      '      "weeks": "1-4",\n' +
      '      "description": "What it does (2 sentences)",\n' +
      '      "build_hours": 40,\n' +
      '      "build_hours_breakdown": "20h for component A + 15h for component B + 5h testing",\n' +
      '      "monthly_savings": 1200,\n' +
      '      "savings_calculation": "Show calculation from their specific numbers. Example: 3 hrs/day x 6 days x 4 wks = 72 hrs/mo x $4/hr = $288 labor + $400 revenue recovery = $688/mo",\n' +
      '      "suggested_price": 3500,\n' +
      '      "price_formula": "savings x 4 months x 30% = price",\n' +
      '      "why_this_order": "Why this phase comes at this position in the sequence"\n' +
      '    }\n' +
      '  ],\n' +
      '  "competitive_analysis": "' + (hasWebsiteData ? 'Analysis based on website data provided.' : 'Competitive analysis requires additional research — website scraping recommended before the call.') + '",\n' +
      '  "discovery_script": {\n' +
      '    "quantify": ["3-4 questions to get specific numbers about their problem"],\n' +
      '    "validate": ["2-3 questions to validate your savings estimates"],\n' +
      '    "close": ["2-3 questions about budget, timeline, decision process"]\n' +
      '  },\n' +
      '  "proposal_talking_points": ["5-6 points that use THE CLIENT\'S OWN WORDS from their intake. Mirror their language. Example: They said \\"lost a 15-person reservation\\" → \\"With our system, that 15-person reservation at 11pm would have been auto-confirmed.\\""],\n' +
      '  "red_flags": [\n' +
      '    {\n' +
      '      "objection": "What they will push back on",\n' +
      '      "response": "Prepared response referencing their specific history"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'RULES:\n' +
      '- Every savings number needs a calculation. No "$1,200/mo saved" without showing how.\n' +
      '- Build hours must be realistic. WhatsApp chatbot with menu = 20-30h. Full POS replacement = 60-80h. Simple dashboard = 15-25h.\n' +
      '- Never list more than 3 phases. Bundle related work into single phases.\n' +
      '- Never hallucinate competitor names or market data. If you need website analysis or competitive research, say so.\n' +
      '- Pricing formula: (monthly savings x 3-4 months) x 25-35% capture rate.\n' +
      '- All build timelines minimum 3 weeks, maximum 10 weeks.\n' +
      '- Be direct about risks and what could go wrong.\n' +
      '- Proposal talking points must quote or closely mirror the client\'s actual words from the intake.';

    var result = await callClaude(systemPrompt, context, { max_tokens: 4000, temperature: 0 });
    var cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    var parsed = JSON.parse(cleaned);
    setCache(lead.id, 'deep_analysis', parsed);
    return parsed;
  }

  /* ================================================
     GENERATE RECOMMENDATIONS
     ================================================ */

  async function generateRecommendations(lead) {
    var lang = localStorage.getItem('ignea_lang') || 'es';

    var systemPrompt = lang === 'es'
      ? 'Eres un consultor senior de IA en Ignea Labs, una firma de infraestructura de IA en América Latina. Tu trabajo es analizar los resultados de un diagnóstico empresarial y generar recomendaciones específicas, accionables y personalizadas.\n\nReglas:\n- Sé específico al negocio del cliente — no des consejos genéricos\n- Cada recomendación debe tener: título, descripción de 2-3 oraciones, tiempo estimado de recuperación en horas/semana, y plazo de implementación\n- Prioriza por impacto — la recomendación #1 debe ser la de mayor ROI\n- Usa lenguaje profesional pero accesible — el dueño del negocio no es técnico\n- Genera entre 3 y 5 recomendaciones\n- NO menciones precios ni costos de implementación\n- Responde SOLO en formato JSON con esta estructura:\n{"summary":"Resumen ejecutivo de 2-3 oraciones","recommendations":[{"title":"Título","description":"Descripción detallada","hours_recovered_weekly":20,"implementation_weeks":3,"priority":"alta"}]}'
      : 'You are a senior AI consultant at Ignea Labs, an AI infrastructure firm in Latin America. Your job is to analyze business diagnostic results and generate specific, actionable, personalized recommendations.\n\nRules:\n- Be specific to this client\'s business — no generic advice\n- Each recommendation must have: title, 2-3 sentence description, estimated hours recovered per week, and implementation timeline\n- Prioritize by impact — recommendation #1 should have the highest ROI\n- Use professional but accessible language — the business owner is not technical\n- Generate 3 to 5 recommendations\n- Do NOT mention prices or implementation costs\n- Respond ONLY in JSON format with this structure:\n{"summary":"Executive summary in 2-3 sentences","recommendations":[{"title":"Title","description":"Detailed description","hours_recovered_weekly":20,"implementation_weeks":3,"priority":"high"}]}';

    var userMessage = 'Diagnostic data:\n\n' + buildDiagnosticContext(lead);

    var result = await callClaude(systemPrompt, userMessage);

    // Parse JSON — handle markdown code blocks
    var cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  /* ================================================
     GENERATE PROPOSAL / MOU
     ================================================ */

  async function generateProposal(lead, calculatorData) {
    var lang = localStorage.getItem('ignea_lang') || 'es';
    var dateStr = new Date().toLocaleDateString(
      lang === 'es' ? 'es-PR' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    var systemPrompt = lang === 'es'
      ? 'Eres un redactor de propuestas comerciales en Ignea Labs. Genera una propuesta profesional / Memorándum de Entendimiento (MOU) para un cliente potencial.\n\nLa propuesta debe incluir:\n1. Encabezado con fecha y datos del cliente\n2. Resumen ejecutivo (2-3 párrafos explicando la situación del cliente y la oportunidad)\n3. Hallazgos del diagnóstico (score, dimensiones clave, citas textuales de sus respuestas)\n4. Soluciones propuestas (3-5 soluciones específicas con descripción, plazo de implementación, y horas que recuperarán)\n5. Retorno estimado (ahorro mensual, ahorro anual — NO incluir nuestro precio, eso se negocia aparte)\n6. Próximos pasos (llamada de alineación, timeline propuesto)\n7. Cierre profesional\n\nReglas:\n- Tono: profesional, confiado, específico al negocio del cliente\n- Cita directamente las respuestas del cliente cuando refuercen el punto\n- Usa datos concretos del diagnóstico\n- NO incluyas precios de Ignea Labs ni costos de implementación\n- SÍ incluye el ahorro estimado para el cliente\n- Formato: texto con encabezados claros marcados con ##\n- Largo: 1.5-2 páginas'
      : 'You are a proposal writer at Ignea Labs. Generate a professional proposal / Memorandum of Understanding (MOU) for a potential client.\n\nThe proposal must include:\n1. Header with date and client details\n2. Executive summary (2-3 paragraphs explaining the client\'s situation and opportunity)\n3. Diagnostic findings (score, key dimensions, direct quotes from their answers)\n4. Proposed solutions (3-5 specific solutions with description, implementation timeline, and hours recovered)\n5. Estimated return (monthly savings, annual savings — do NOT include our price, that\'s negotiated separately)\n6. Next steps (alignment call, proposed timeline)\n7. Professional closing\n\nRules:\n- Tone: professional, confident, specific to the client\'s business\n- Directly quote the client\'s answers when they reinforce the point\n- Use concrete data from the diagnostic\n- Do NOT include Ignea Labs prices or implementation costs\n- DO include estimated savings for the client\n- Format: text with clear headers marked with ##\n- Length: 1.5-2 pages';

    var calcInfo = '';
    if (calculatorData) {
      calcInfo = '\n\nCalculator data (include savings amounts but NOT our pricing):\n' +
        '- Monthly savings: $' + (Math.round(calculatorData.totalMonthlySavings) || 0).toLocaleString() + '\n' +
        '- Bot savings: $' + (Math.round(calculatorData.botMonthlySavings) || 0) + '/month\n' +
        '- Web savings: $' + (Math.round(calculatorData.webMonthlySavings) || 0) + '/month\n' +
        '- Automation savings: $' + (Math.round(calculatorData.autoMonthlySavings) || 0) + '/month';
    }

    var userMessage = 'Generate a proposal for:\n\n' +
      'Client: ' + (lead.first_name || '') + ' ' + (lead.last_name || '') + '\n' +
      'Company: ' + (lead.company_name || '') + '\n' +
      'Email: ' + (lead.email || '') + '\n' +
      'Date: ' + dateStr + '\n\n' +
      buildDiagnosticContext(lead) + calcInfo;

    return await callClaude(systemPrompt, userMessage);
  }

  /* ================================================
     PROPOSAL PDF
     ================================================ */

  function generateProposalPDF(proposalText, lead) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) {
      // Try loading dynamically as fallback
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js';
      script.onload = function() {
        jsPDF = window.jspdf && window.jspdf.jsPDF;
        if (jsPDF) generateProposalPDF(proposalText, lead);
        else alert('Could not load PDF library. Check your connection.');
      };
      script.onerror = function() { alert('Could not load PDF library. Check your connection.'); };
      document.head.appendChild(script);
      return;
    }

    var doc = new jsPDF();
    var lang = localStorage.getItem('ignea_lang') || 'es';
    var margin = 20;
    var pageWidth = 170;
    var y = 20;

    // Header — match logo: "ignea" serif + red dot + "labs" sans
    doc.setFontSize(18);
    doc.setFont('times', 'normal');
    doc.setTextColor(234, 234, 240);
    doc.text('ignea', margin, y);
    var dotX = margin + doc.getTextWidth('ignea') + 2;
    doc.setFillColor(232, 53, 42);
    doc.circle(dotX + 2, y - 4, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(142, 142, 158);
    doc.text('labs', dotX + 6, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(lang === 'es' ? 'Infraestructura de IA para empresas en América Latina' : 'AI Infrastructure for Latin American Businesses', margin, y);
    doc.text('hola@ignealabs.com', margin, y + 4);

    // Separator
    y += 12;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + pageWidth, y);
    y += 10;

    // Body
    doc.setTextColor(0);
    var lines = proposalText.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) { y += 4; continue; }

      if (y > 270) { doc.addPage(); y = 20; }

      // Detect headers
      if (line.startsWith('#')) {
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(line.replace(/^#+\s*/, ''), margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      } else if (line.match(/^[A-Z\u00C0-\u00DC\s]{5,}$/) || (line.endsWith(':') && line.length < 60 && !line.includes('.'))) {
        y += 3;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(line, margin, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      } else {
        var wrapped = doc.splitTextToSize(line, pageWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5 + 2;
      }
    }

    // Footer
    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setDrawColor(200);
    doc.line(margin, y, margin + pageWidth, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('ignea.labs — hola@ignealabs.com — ignealabs.com', margin, y);
    var confText = lang === 'es'
      ? 'Este documento es confidencial y fue preparado exclusivamente para ' + (lead.company_name || 'el cliente') + '.'
      : 'This document is confidential and was prepared exclusively for ' + (lead.company_name || 'the client') + '.';
    doc.text(confText, margin, y + 4);

    doc.save('Propuesta_' + (lead.company_name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  /* ---- Expose globally ---- */
  window.IgneaAI = {
    generateRecommendations: generateRecommendations,
    generateProposal: generateProposal,
    generateProposalPDF: generateProposalPDF,
    generateSummary: generateSummary,
    generateDeepAnalysis: generateDeepAnalysis,
    callClaude: callClaude
  };
})();
