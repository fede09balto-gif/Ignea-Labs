/* ============================================================
   ONDA AI — Supabase Client Configuration
   Replace placeholders with your actual Supabase project values.
   See supabase/README.md for setup instructions.
   ============================================================ */

var OndaSupabase = (function() {
  var SUPABASE_URL = 'PLACEHOLDER_SUPABASE_URL';
  var SUPABASE_ANON_KEY = 'PLACEHOLDER_SUPABASE_KEY';

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
