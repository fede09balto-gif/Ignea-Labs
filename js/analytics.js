/* ============================================================
   IGNEA LABS — Analytics Wrapper
   Supports Plausible (primary) and Google Analytics (optional).
   Usage: IgneaAnalytics.track('event_name', { key: 'value' })
   ============================================================ */

var IgneaAnalytics = (function() {
  function track(name, props) {
    if (window.plausible) {
      plausible(name, props ? { props: props } : undefined);
    }
    if (window.gtag) {
      gtag('event', name, props || {});
    }
  }

  return { track: track };
})();
