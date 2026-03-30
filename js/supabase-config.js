/* ============================================================
   ONDA AI — Supabase Client Configuration
   Replace placeholders with your actual Supabase project values.
   See supabase/README.md for setup instructions.
   ============================================================ */

var OndaSupabase = (function() {
  var SUPABASE_URL = 'https://uqupiesctjvosvszovuq.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_wUXzJhf8mERI7m9hL4Th6g_GpWvSEMP';

  var _client = null;

  function init() {
    if (typeof supabase !== 'undefined' && supabase.createClient && !_client) {
      _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _client;
  }

  function getClient() {
    if (!_client) init();
    return _client;
  }

  // Auto-init when script loads
  init();

  return {
    get client() { return getClient(); },
    init: init
  };
})();
