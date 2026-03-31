/* ============================================================
   IGNEA LABS — Google Sheets Sync
   Mirrors lead data to a Google Sheet for quick access.
   Supabase is source of truth — this is best-effort only.
   Deploy google-apps-script/sync.gs as a web app and paste
   the deployment URL below.
   ============================================================ */

var IgneaSheetsSync = (function() {
  var SHEETS_SYNC_URL = 'SHEETS_SYNC_URL';

  function sync(leadData) {
    if (!SHEETS_SYNC_URL || SHEETS_SYNC_URL === 'SHEETS_SYNC_URL') return;

    var row = {
      timestamp: new Date().toISOString(),
      name: (leadData.first_name || '') + ' ' + (leadData.last_name || ''),
      email: leadData.email || '',
      phone: leadData.phone || '',
      company: leadData.company_name || '',
      industry: leadData.industry || '',
      size: leadData.company_size || '',
      website: leadData.company_website || '',
      revenue: leadData.annual_revenue || '',
      score: leadData.total_score || '',
      level: leadData.score_level || '',
      stage: leadData.pipeline_stage || 'new',
      deal_value: leadData.deal_value || ''
    };

    try {
      fetch(SHEETS_SYNC_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
    } catch (e) {
      // Silent fail — Supabase is source of truth
    }
  }

  return { sync: sync };
})();
