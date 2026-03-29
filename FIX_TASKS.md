# Onda AI — Fix Tasks (Priority Ordered)

---

## 1. [CRITICAL] Contact form doesn't submit to Formspree
- **File:** `contact.html`, lines 215-223
- **Problem:** `handleSubmit()` calls `e.preventDefault()` and hides the form, but **never actually sends data** to Formspree or any endpoint. It just shows the success message with no network request. Zero leads captured.
- **Fix:** Add `fetch()` POST to a Formspree endpoint (e.g., `https://formspree.io/f/YOUR_ID`), add a loading state (disable button, show spinner), handle errors gracefully (show error message, re-enable form), only show success on 200 response.
- **Effort:** Moderate

---

## 2. [HIGH] Hardcoded sec-tag strings don't translate (manifesto + contact)
- **Files:** `manifesto.html:85`, `contact.html:109`, `contact.html:139`
- **Problem:** Three `sec-tag` / `form-tag` elements have hardcoded Spanish text without `data-i18n` attributes:
  - `<div class="sec-tag">// Manifiesto</div>` — should reference `man.tag`
  - `<div class="sec-tag">// Contacto</div>` — should reference `ct.tag`
  - `<div class="form-tag">// Enviar mensaje</div>` — should reference `ct.formTag`
- **Fix:** Add `data-i18n="man.tag"`, `data-i18n="ct.tag"`, and `data-i18n="ct.formTag"` attributes respectively. Keys already exist in i18n.js.
- **Effort:** Quick fix

---

## 3. [HIGH] Mobile stats grid — 4th cell loses right border
- **File:** `index.html`, lines 66-78 (inline `<style>`)
- **Problem:** At `<768px`, stats become 2x2. The `:last-child` rule (line 30 in the same styles) removes border-right from the 4th stat, but in a 2x2 grid the 4th cell (bottom-right) should keep its natural position without border-right — actually in the 2x2 layout, cells 2 and 4 (right column) should have NO right border. **However**, the CLAUDE.md known bug says "2nd and 4th stat cells lose their right border — fix this." The spec wants them to KEEP the right border.
- **Fix:** In the 768px media query, add `.stat:nth-child(4){border-right:.5px solid var(--border)}` to override the `:last-child` rule. Or better: explicitly set `.stat{border-right:.5px solid var(--border)}` and only remove it from `.stat:nth-child(2n)` in the 2x2 context if that's the desired look. Clarify intent with design.
- **Effort:** Quick fix

---

## 4. [HIGH] Placeholder WhatsApp number in contact page
- **File:** `contact.html`, lines 120, 129
- **Problem:** WhatsApp links use `+505 0000 0000` and `wa.me/5050000000` — these are placeholder numbers that won't work for real users.
- **Fix:** Replace with actual Onda AI WhatsApp number before launch.
- **Effort:** Quick fix (needs business info)

---

## 5. [HIGH] Missing vercel.json — no 404 routing or clean URLs
- **Files:** Project root (missing `vercel.json`)
- **Problem:** Without `vercel.json`, Vercel won't route 404s to `404.html`, and there are no cache headers or redirects configured.
- **Fix:** Create `vercel.json` with:
  ```json
  {
    "cleanUrls": true,
    "trailingSlash": false,
    "headers": [
      { "source": "/(.*)", "headers": [{ "key": "X-Frame-Options", "value": "DENY" }] }
    ]
  }
  ```
- **Effort:** Quick fix

---

## 6. [HIGH] Missing og:image on all pages
- **Files:** All 6 HTML files
- **Problem:** No `og:image` meta tag and no `assets/og-image.png`. Social sharing will show no preview image.
- **Fix:** Create an OG image (1200x630px) with Onda AI branding, place in `assets/`, add `<meta property="og:image" content="https://onda.ai/assets/og-image.png">` to all pages.
- **Effort:** Moderate (needs design asset)

---

## 7. [MEDIUM] index.html Google Fonts missing JetBrains Mono weights
- **File:** `index.html:12`
- **Problem:** Loads `JetBrains+Mono:wght@400;700` but other pages load `wght@300;400;500;700`. Homepage is missing weights 300 and 500.
- **Fix:** Change to `JetBrains+Mono:wght@300;400;500;700` to match other pages.
- **Effort:** Quick fix

---

## 8. [MEDIUM] Contact page nav-cta has inline style
- **File:** `contact.html:81`
- **Problem:** `style="background:var(--accent);color:var(--bg)"` hardcoded on the active contact nav link. This should be a CSS class.
- **Fix:** Add `.nav-cta.active{background:var(--accent);color:var(--bg)}` to `shared.css` and remove the inline style.
- **Effort:** Quick fix

---

## 9. [MEDIUM] Missing `<main>` semantic tag on 4 pages
- **Files:** `diagnostic.html`, `manifesto.html`, `contact.html`, `404.html`
- **Problem:** These pages lack a `<main>` element wrapping primary content. Bad for accessibility and SEO.
- **Fix:** Wrap primary content in `<main>` tags (after nav, before footer).
- **Effort:** Quick fix

---

## 10. [MEDIUM] No font preloading
- **Files:** All HTML files `<head>`
- **Problem:** Google Fonts CSS is render-blocking. Adding preload hints would improve LCP.
- **Fix:** Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` to all pages' `<head>` (before the font stylesheet link).
- **Effort:** Quick fix

---

## 11. [MEDIUM] Hamburger and lang toggle below 44px tap target
- **Files:** `css/shared.css:51,56`
- **Problem:** `.lang-btn` is ~28px tall, `.hamburger` is ~38px tall. Both below 44px minimum.
- **Fix:** Increase `.lang-btn` padding to `8px 12px` (min-height:44px). Add `min-height:44px;min-width:44px` to `.hamburger`.
- **Effort:** Quick fix

---

## 12. [LOW] Inline styles on index.html
- **File:** `index.html:179,193`
- **Problem:** Terminal wrapper has `style="margin-top:36px"` and solutions desc paragraph has inline font/color styles that duplicate `.sec p`.
- **Fix:** Move to page-specific `<style>` block or use existing class.
- **Effort:** Quick fix

---

## 13. [LOW] 404 page missing og: meta tags
- **File:** `404.html`
- **Problem:** No `og:title`, `og:description`, or `og:type` meta tags.
- **Fix:** Add basic OG tags (less important for a 404 page but good for completeness).
- **Effort:** Quick fix

---

## 14. [LOW] No 480px breakpoint on manifesto and contact
- **Files:** `manifesto.html`, `contact.html`
- **Problem:** No 480px media query. On very small screens (375px), text may be slightly tight.
- **Fix:** Add `@media(max-width:480px)` rules for smaller headline sizes if needed after visual testing.
- **Effort:** Quick fix

---

## 15. [LOW] Empty assets/ directory
- **File:** `assets/`
- **Problem:** Directory exists but is empty. Spec expects `og-image.png`.
- **Fix:** Related to Task #6 — create OG image.
- **Effort:** N/A (depends on #6)

---

## 16. [LOW] Hamburger menu code duplicated across all pages
- **Files:** All HTML files (inline `<script>`)
- **Problem:** The hamburger toggle code is copy-pasted in every page's inline script block (~10 lines each). Not DRY.
- **Fix:** Extract to a shared `js/nav.js` file loaded on all pages. Low priority — it works, just repetitive.
- **Effort:** Quick fix

---

## Summary

| Priority | Count | Effort |
|----------|-------|--------|
| CRITICAL | 1 | Moderate |
| HIGH | 5 | 3 quick, 1 moderate, 1 needs biz info |
| MEDIUM | 5 | All quick |
| LOW | 5 | All quick |
| **Total** | **16** | |
