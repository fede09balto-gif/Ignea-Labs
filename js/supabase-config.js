/* ============================================================
   ONDA AI — Supabase Client Configuration
   Replace placeholders with your actual Supabase project values.
   See supabase/README.md for setup instructions.
   ============================================================ */

var OndaSupabase = (function() {
  var SUPABASE_URL = 'https://uqupiesctjvosvszovuq.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_wUXzJhf8mERI7m9hL4Th6g_GpWvSEMP';

  var client = null;

  function init() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  // Auto-init when script loads
  if (typeof supabase !== 'undefined') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  return {
    get client() { return client; },
    init: init
  };
})();
