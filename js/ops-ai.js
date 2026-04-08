/* ============================================================
   IGNEA LABS — AI Module (Claude API)
   Generates recommendations and proposals from diagnostic data.
   Requires: window.CLAUDE_API_KEY to be set.
   ============================================================ */

(function() {
  var CLAUDE_MODEL = 'claude-sonnet-4-20250514';

  function getApiKey() {
    return window.CLAUDE_API_KEY || 'PLACEHOLDER_CLAUDE_API_KEY';
  }

  async function callClaude(systemPrompt, userMessage) {
    var key = getApiKey();
    if (!key || key === 'PLACEHOLDER_CLAUDE_API_KEY') {
      throw new Error('Claude API key not configured. Set window.CLAUDE_API_KEY in ops.html.');
    }

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
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
    parts.push('Score: ' + (lead.total_score || 0) + '/100 (' + (lead.score_level || 'unknown') + ')');

    if (lead.score_breakdown) {
      parts.push('\nDimension scores:');
      var dims = lead.score_breakdown;
      var keys = ['customerInteraction', 'processMaturity', 'digitalPresence', 'dataUtilization', 'aiReadiness'];
      keys.forEach(function(k) {
        if (dims[k] !== undefined) parts.push('- ' + k + ': ' + dims[k] + '/20');
      });
    }

    if (lead.diagnostic_answers) {
      parts.push('\nDiagnostic answers:');
      var answers = lead.diagnostic_answers;
      for (var q = 1; q <= 11; q++) {
        var val = answers['q' + q];
        if (val !== undefined && val !== null) {
          var display = typeof val === 'object' ? JSON.stringify(val) : String(val);
          parts.push('Q' + q + ': ' + display);
        }
      }
    }

    if (lead.company_website) parts.push('\nWebsite: ' + lead.company_website);

    return parts.join('\n');
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
    if (!jsPDF) { alert('jsPDF not loaded'); return; }

    var doc = new jsPDF();
    var lang = localStorage.getItem('ignea_lang') || 'es';
    var margin = 20;
    var pageWidth = 170;
    var y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('IGNEA LABS', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
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
    doc.text('Ignea Labs — hola@ignealabs.com — ignealabs.com', margin, y);
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
    callClaude: callClaude
  };
})();
