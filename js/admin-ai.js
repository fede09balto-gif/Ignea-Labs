/* ============================================================
   IGNEA LABS — Admin AI Tools: Consulting Report, Build Prompts
   ============================================================ */

(function() {

  var CLAUDE_MODEL = 'claude-sonnet-4-20250514';

  function getApiKey() {
    return window.CLAUDE_API_KEY || '';
  }

  async function callClaude(systemPrompt, userMessage, maxTokens) {
    var key = getApiKey();
    if (!key || key === 'PLACEHOLDER_CLAUDE_API_KEY') {
      throw new Error('Set window.CLAUDE_API_KEY in admin.html before using AI tools.');
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
        max_tokens: maxTokens || 4000,
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

  /* ---- Build context from submission ---- */

  function buildContext(item) {
    var parts = [];
    parts.push('Company: ' + (item.company_name || 'Unknown'));
    parts.push('Contact: ' + (item.contact_name || 'Unknown'));
    parts.push('Email: ' + (item.contact_email || ''));
    parts.push('Phone: ' + (item.contact_phone || ''));
    parts.push('Industry: ' + (item.industry || 'Unknown'));
    parts.push('Company size: ' + (item.company_size || 'Unknown'));
    parts.push('Language: ' + (item.language || 'es'));
    parts.push('Total Score: ' + (item.total_score || 0) + '/100');
    parts.push('Level: ' + (item.level || 'unknown'));

    var scores = item.scores_json || {};
    parts.push('\nDimension Scores:');
    parts.push('- Customer Flow: ' + (scores.customerFlow || 0) + '/25');
    parts.push('- Operations Flow: ' + (scores.operationsFlow || 0) + '/25');
    parts.push('- Information Flow: ' + (scores.informationFlow || 0) + '/25');
    parts.push('- Growth Flow: ' + (scores.growthFlow || 0) + '/25');

    var roi = item.roi_json || {};
    if (roi.weeklyWastedHours) {
      parts.push('\nROI Analysis:');
      parts.push('- Weekly wasted hours: ' + roi.weeklyWastedHours);
      parts.push('- Monthly cost of inaction: $' + (roi.totalMonthlyCost || 0).toLocaleString());
      parts.push('- Annual cost: $' + (roi.annualCost || 0).toLocaleString());
      parts.push('- Hourly cost: $' + (roi.hourlyCost || 0));
    }

    var answers = item.answers_json || {};
    parts.push('\nDiagnostic Answers:');

    var qLabels = {
      q1: 'Customer discovery channels',
      q2: 'Time-wasting tasks',
      q3: 'Response time & channel',
      q4: 'Order-to-delivery process',
      q5: 'Manual financial processes',
      q6: 'Existing systems',
      q7: 'Decision-making data',
      q8: 'Customer loss frequency',
      q9: 'Growth capacity',
      q10: 'Automatable tasks',
      q11: 'Biggest profitability problem'
    };

    for (var q = 1; q <= 11; q++) {
      var key = 'q' + q;
      var label = qLabels[key] || 'Q' + q;
      var vals = [];

      if (answers[key + '_cards']) vals.push('Selected: ' + answers[key + '_cards'].join(', '));
      if (answers[key + '_card'] != null) vals.push('Selected: ' + answers[key + '_card']);
      if (answers[key + '_slider'] != null) vals.push('Slider: ' + answers[key + '_slider'] + ' hrs/week');
      if (answers[key + '_text']) vals.push('Text: "' + answers[key + '_text'] + '"');

      if (vals.length > 0) {
        parts.push('Q' + q + ' (' + label + '): ' + vals.join(' | '));
      }
    }

    // Industry-specific
    var indKeys = Object.keys(answers).filter(function(k) { return k.indexOf('ind_') === 0; });
    if (indKeys.length > 0) {
      parts.push('\nIndustry-Specific Answers:');
      indKeys.forEach(function(k) {
        var v = answers[k];
        parts.push('- ' + k + ': ' + (Array.isArray(v) ? v.join(', ') : String(v)));
      });
    }

    if (item.admin_notes) {
      parts.push('\nAdmin Notes: ' + item.admin_notes);
    }

    return parts.join('\n');
  }

  /* ---- GENERATE CONSULTING REPORT ---- */

  async function generateReport(item) {
    var lang = item.language || 'es';

    var systemPrompt = 'You are a senior AI consultant at Ignea Labs, a boutique AI infrastructure firm in Puerto Rico serving SMBs with $3M-$250M ARR.\n\n' +
      'Generate a comprehensive CONSULTING REPORT for this client based on their diagnostic data.\n\n' +
      'Structure:\n' +
      '## Executive Summary\n2-3 paragraphs: what we found, what it costs them, what we can do\n\n' +
      '## Diagnostic Results\n- Overall score and level interpretation\n- Each dimension breakdown with specific findings\n- Direct quotes from their answers\n\n' +
      '## Pain Points & Cost Analysis\n- Top 3-5 pain points ranked by financial impact\n- Monthly/annual cost estimates per pain point\n- Citation of their own words\n\n' +
      '## Recommended Solutions\n- 3-5 specific solutions tied to pain points\n- Expected hours recovered per week\n- Implementation timeline (weeks)\n- Priority ranking\n\n' +
      '## ROI Projection\n- Total savings projection (monthly + annual)\n- Break-even timeline\n- Efficiency gains\n\n' +
      '## Next Steps\n- Proposed engagement process\n- Quick wins vs. long-term initiatives\n\n' +
      'Rules:\n' +
      '- Be SPECIFIC to this business — cite their exact answers\n' +
      '- Use concrete numbers and estimates\n' +
      '- Professional but accessible tone (client is not technical)\n' +
      '- Do NOT include Ignea Labs pricing\n' +
      '- Write in ' + (lang === 'es' ? 'Spanish' : 'English');

    var userMessage = 'Generate a consulting report for this diagnostic submission:\n\n' + buildContext(item);

    return await callClaude(systemPrompt, userMessage, 6000);
  }

  /* ---- GENERATE BUILD PROMPTS ---- */

  async function generateBuildPrompts(item) {
    var systemPrompt = 'You are a senior solutions architect at Ignea Labs. Based on a client\'s diagnostic results, generate 3-5 specific Claude build prompts that an AI developer would paste into Claude to build the exact software solutions this business needs.\n\n' +
      'Each prompt must:\n' +
      '1. Be a complete, standalone prompt ready to paste into Claude\n' +
      '2. Include specific business context (industry, team size, current pain points)\n' +
      '3. Define the tech stack (prefer: Supabase, Next.js, vanilla JS for lightweight tools)\n' +
      '4. Describe exact features needed\n' +
      '5. Include deployment requirements\n\n' +
      'Return ONLY valid JSON in this format:\n' +
      '{"prompts":[{"title":"Short title","complexity":"simple|medium|complex","estimated_hours":8,"description":"What this solves in 1-2 sentences","prompt":"The full build prompt ready to paste into Claude..."}]}\n\n' +
      'Order by priority — the first prompt should solve the biggest pain point.';

    var userMessage = 'Generate build prompts for:\n\n' + buildContext(item);

    var result = await callClaude(systemPrompt, userMessage, 6000);
    var cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  /* ---- PDF GENERATION ---- */

  function generateReportPDF(reportText, item) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) { alert('jsPDF not loaded'); return; }

    var doc = new jsPDF();
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
    doc.text('AI Infrastructure for Puerto Rico Businesses', margin, y);
    doc.text('hola@ignealabs.com', margin, y + 4);

    y += 12;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + pageWidth, y);
    y += 8;

    // Client info
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Client: ' + (item.company_name || 'N/A') + ' | Score: ' + (item.total_score || 0) + '/100 | Level: ' + (item.level || '--'), margin, y);
    y += 5;
    doc.text('Contact: ' + (item.contact_name || '') + ' | ' + (item.contact_email || ''), margin, y);
    y += 5;
    doc.text('Date: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
    y += 10;

    // Body
    doc.setTextColor(0);
    var lines = reportText.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) { y += 4; continue; }

      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (line.startsWith('##')) {
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(line.replace(/^#+\s*/, ''), margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        var bulletText = line.replace(/^[-*]\s*/, '');
        var wrapped = doc.splitTextToSize(bulletText, pageWidth - 8);
        doc.text('•', margin, y);
        doc.text(wrapped, margin + 8, y);
        y += wrapped.length * 5 + 2;
      } else {
        var wrapped2 = doc.splitTextToSize(line, pageWidth);
        doc.text(wrapped2, margin, y);
        y += wrapped2.length * 5 + 2;
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
    doc.text('This document is confidential and was prepared exclusively for ' + (item.company_name || 'the client') + '.', margin, y + 4);

    doc.save('ConsultingReport_' + (item.company_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  /* ---- UI WIRING ---- */

  document.addEventListener('DOMContentLoaded', function() {

    // Generate Report button
    var btnReport = document.getElementById('btnGenReport');
    if (btnReport) {
      btnReport.addEventListener('click', async function() {
        var item = typeof AdminDetail !== 'undefined' ? AdminDetail.getCurrent() : null;
        if (!item) return;

        btnReport.disabled = true;
        btnReport.innerHTML = '<span class="ai-spinner"></span> Generating...';
        var output = document.getElementById('reportOutput');

        try {
          var report = await generateReport(item);

          // Save to Supabase
          IgneaSupabase.client
            .from('diagnostics')
            .update({ consulting_report: { text: report, generated_at: new Date().toISOString() } })
            .eq('id', item.id)
            .then(function(res) {
              if (!res.error) {
                item.consulting_report = { text: report, generated_at: new Date().toISOString() };
                var pdfBtn = document.getElementById('btnDownloadPDF');
                if (pdfBtn) pdfBtn.disabled = false;
                if (typeof AdminDashboard !== 'undefined') {
                  AdminDashboard.refreshSubmission(item.id, { consulting_report: item.consulting_report, status: 'report_generated' });
                }
              }
            });

          // Update status
          IgneaSupabase.client
            .from('diagnostics')
            .update({ status: 'report_generated' })
            .eq('id', item.id)
            .then(function() {
              item.status = 'report_generated';
              var statusSelect = document.getElementById('detailStatus');
              if (statusSelect) statusSelect.value = 'report_generated';
            });

          // Render report
          output.innerHTML = '<div class="ai-report">' + markdownToHTML(report) + '</div>';

        } catch (err) {
          output.innerHTML = '<div style="color:var(--coral);margin-top:16px;font-size:14px">Error: ' + escHTML(err.message) + '</div>';
        }

        btnReport.disabled = false;
        btnReport.innerHTML = '<span>Regenerate Report</span>';
      });
    }

    // Generate Build Prompts button
    var btnPrompts = document.getElementById('btnGenPrompts');
    if (btnPrompts) {
      btnPrompts.addEventListener('click', async function() {
        var item = typeof AdminDetail !== 'undefined' ? AdminDetail.getCurrent() : null;
        if (!item) return;

        btnPrompts.disabled = true;
        btnPrompts.innerHTML = '<span class="ai-spinner"></span> Generating...';
        var output = document.getElementById('promptsOutput');

        try {
          var result = await generateBuildPrompts(item);
          var prompts = result.prompts || [];

          // Save to Supabase
          IgneaSupabase.client
            .from('diagnostics')
            .update({ build_prompts: { prompts: prompts, generated_at: new Date().toISOString() } })
            .eq('id', item.id)
            .then(function(res) {
              if (!res.error) {
                item.build_prompts = { prompts: prompts, generated_at: new Date().toISOString() };
              }
            });

          // Render prompt cards
          var html = '<div class="prompt-cards">';
          for (var i = 0; i < prompts.length; i++) {
            var p = prompts[i];
            html += '<div class="prompt-card">' +
              '<div class="prompt-card-header">' +
                '<span class="prompt-card-title">' + escHTML(p.title) + '</span>' +
                '<div class="prompt-card-meta">' +
                  '<span class="prompt-card-complexity">' + escHTML(p.complexity || 'medium') + '</span>' +
                  (p.estimated_hours ? '<span style="font-family:var(--fm);font-size:11px;color:var(--dimgray)">' + p.estimated_hours + 'h</span>' : '') +
                  '<span class="prompt-card-copy" data-idx="' + i + '">COPY</span>' +
                '</div>' +
              '</div>' +
              (p.description ? '<div style="font-size:13px;color:var(--gray);margin-bottom:10px">' + escHTML(p.description) + '</div>' : '') +
              '<div class="prompt-card-body" id="promptBody' + i + '">' + escHTML(p.prompt) + '</div>' +
              '<span class="prompt-card-expand" data-idx="' + i + '">show more</span>' +
              '</div>';
          }
          html += '</div>';
          output.innerHTML = html;

          // Copy buttons
          var copyBtns = output.querySelectorAll('.prompt-card-copy');
          for (var c = 0; c < copyBtns.length; c++) {
            copyBtns[c].addEventListener('click', function(e) {
              e.stopPropagation();
              var idx = parseInt(this.getAttribute('data-idx'));
              var text = prompts[idx] ? prompts[idx].prompt : '';
              navigator.clipboard.writeText(text).then(function() {});
              this.textContent = 'COPIED';
              this.classList.add('copied');
              var el = this;
              setTimeout(function() {
                el.textContent = 'COPY';
                el.classList.remove('copied');
              }, 2000);
            });
          }

          // Expand toggles
          var expandBtns = output.querySelectorAll('.prompt-card-expand');
          for (var e = 0; e < expandBtns.length; e++) {
            expandBtns[e].addEventListener('click', function() {
              var idx = this.getAttribute('data-idx');
              var body = document.getElementById('promptBody' + idx);
              if (body) {
                body.classList.toggle('expanded');
                this.textContent = body.classList.contains('expanded') ? 'show less' : 'show more';
              }
            });
          }

        } catch (err) {
          output.innerHTML = '<div style="color:var(--coral);margin-top:16px;font-size:14px">Error: ' + escHTML(err.message) + '</div>';
        }

        btnPrompts.disabled = false;
        btnPrompts.innerHTML = '<span>Regenerate Prompts</span>';
      });
    }

    // Download PDF button
    var btnPDF = document.getElementById('btnDownloadPDF');
    if (btnPDF) {
      btnPDF.addEventListener('click', function() {
        var item = typeof AdminDetail !== 'undefined' ? AdminDetail.getCurrent() : null;
        if (!item || !item.consulting_report) return;
        generateReportPDF(item.consulting_report.text || '', item);
      });
    }
  });

  /* ---- HELPERS ---- */

  function markdownToHTML(md) {
    var lines = md.split('\n');
    var html = '';
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (line.match(/^#{1,3}\s/)) {
        if (inList) { html += '</ul>'; inList = false; }
        var text = line.replace(/^#+\s*/, '');
        html += '<h3>' + escHTML(text) + '</h3>';
      } else if (line.match(/^[-*]\s/)) {
        if (!inList) { html += '<ul>'; inList = true; }
        var bullet = line.replace(/^[-*]\s*/, '');
        // Bold text within **
        bullet = bullet.replace(/\*\*(.+?)\*\*/g, '<span class="report-highlight">$1</span>');
        html += '<li>' + bullet + '</li>';
      } else if (line.trim() === '') {
        if (inList) { html += '</ul>'; inList = false; }
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        line = line.replace(/\*\*(.+?)\*\*/g, '<span class="report-highlight">$1</span>');
        html += '<p>' + line + '</p>';
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  function escHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

})();
