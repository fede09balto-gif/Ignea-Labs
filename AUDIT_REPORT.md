# Onda AI — Full Codebase Audit Report

**Date:** 2026-03-29
**Auditor:** Claude Code
**Overall Health Score: 78 / 100**

---

## 1. FILE INVENTORY

### Directory Tree
```
onda-ai/
├── .git/
├── assets/              (empty)
├── css/
│   └── shared.css
├── js/
│   ├── diagnostic.js
│   ├── encrypt.js
│   ├── grid-bg.js
│   ├── i18n.js
│   ├── neural-net.js
│   ├── results.js
│   ├── scoring.js
│   └── terminal.js
├── 404.html
├── BUILD_SPEC.md
├── CLAUDE.md
├── contact.html
├── diagnostic.html
├── index.html
├── manifesto.html
└── results.html
```

### Page Status
| Page | File | Status | Nav | Footer | Grid BG | Lang Toggle | Meta Tags |
|------|------|--------|-----|--------|---------|-------------|-----------|
| Homepage | index.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ✓ |
| Diagnostic | diagnostic.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ✓ |
| Results | results.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manifesto | manifesto.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contact | contact.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ✓ |
| 404 | 404.html | ✓ BUILT | ✓ | ✓ | ✓ | ✓ | ⚠ (no OG tags) |

### Missing Files
| File | Status | Impact |
|------|--------|--------|
| vercel.json | ✗ MISSING | No clean URLs, no 404 routing, no headers |
| assets/og-image.png | ✗ MISSING | OG image referenced in spec but no file exists |

---

## 2. DESIGN SYSTEM COMPLIANCE

### Colors ✓ PASS
All CSS custom properties match the design system exactly:
- `--bg:#08080D` ✓ | `--bg2:#0E0E16` ✓ | `--bg3:#14141E` ✓
- `--accent:#00E5BF` ✓ | `--accent2:#00E5BF22` ✓ | `--accent3:#00E5BF0A` ✓
- `--white:#EAEAF0` ✓ | `--gray:#6E6E88` ✓ | `--dimgray:#3A3A50` ✓
- `--border:#1A1A2A` ✓ | `--coral:#F0997B` ✓ | `--purple:#AFA9EC` ✓

**No rogue colors found.** All inline colors in canvas JS reference the correct palette.

### Typography ⚠ WARNING
- Fonts: Syne + JetBrains Mono ✓
- `display=swap` present on all pages ✓
- **Issue:** `index.html:12` loads `JetBrains+Mono:wght@400;700` (missing 300,500), while all other pages load `wght@300;400;500;700`. This means JetBrains Mono weight 300 (used in spec) won't render correctly on homepage.
- Hero size: `clamp(30px,4.5vw,54px)` ✓ (index.html:18)
- Section tags: 11px, uppercase, 3px letter-spacing, accent ✓
- Body: 14-15px ✓ | Stats: 28px ✓ | Stat labels: 10px ✓

### Borders & Corners ✓ PASS
`border-radius` usage found only on allowed exceptions:
- `shared.css:36` — `.brand-mark` (circle) ✓
- `shared.css:98` — `.mc-dot` (radio dot) ✓
- `shared.css:100` — `.mc-dot::after` (inner dot) ✓
- `shared.css:110-111` — `.range-input` slider thumb: `border-radius:0` ✓
- `shared.css:121` — `.dot` (terminal dots) ✓
- All buttons, cards, inputs: `border-radius` absent = 0 ✓

### Buttons ✓ PASS
- `btn-primary`: accent bg, dark text, weight 700, no border-radius ✓
- `btn-ghost`: transparent bg, 1px border, gray text, hover state ✓
- **Minor:** `contact.html:81` has inline style on nav-cta: `style="background:var(--accent);color:var(--bg)"` — this is a hardcoded active state that should be in CSS.

---

## 3. RESPONSIVE CHECK

### Media Queries
| Page | 768px | 480px | 375px-specific |
|------|-------|-------|----------------|
| index.html | ✓ | ✓ | — (via 480) |
| diagnostic.html | ✓ | ✓ | — |
| results.html | ✓ | ✓ | — |
| manifesto.html | ✓ | — | — |
| contact.html | ✓ | — | — |
| 404.html | ✓ | — | — |
| shared.css | ✓ | ✓ | — |

### Issues Found
- **[HIGH]** `index.html:68-70` — Stats grid 2x2 mobile: `.stat:nth-child(2){border-right:none}` and first two stats get `border-bottom`. But `.stat:nth-child(4)` still has `border-right:none` from `.stat:last-child{border-right:none}` on line 30. The **4th cell does NOT keep its right border** — the known bug is NOT fully fixed. The 2nd cell correctly loses right border, the 4th cell loses it via `:last-child` rule.
- **[MEDIUM]** `manifesto.html` and `contact.html` are missing 480px breakpoint. On 375px phones, some text may be tight but layout won't break.
- **[LOW]** No `min-width: 1440px` breakpoint anywhere — content is max-width constrained which is fine, but no verification at desktop widths.

### Tap Targets
- All buttons: `padding:13px 28px` = well over 44px ✓
- All inputs: `min-height:44px` explicitly set ✓
- MC options: `min-height:44px` ✓
- Language buttons: `padding:6px 12px` = ~28px tall ⚠ (below 44px minimum, but they're small toggles)
- Hamburger: `padding:8px` with 20px spans = ~38px ⚠ (slightly below 44px)

---

## 4. i18n COMPLETENESS

### Key Count
- **ES keys:** 121
- **EN keys:** 121
- **Parity:** ✓ FULL PARITY — all keys exist in both languages

### Hardcoded Strings (not using data-i18n)
| File | Line | String | Severity |
|------|------|--------|----------|
| manifesto.html | 85 | `// Manifiesto` (sec-tag without data-i18n) | **HIGH** — won't translate to `// Manifesto` |
| contact.html | 109 | `// Contacto` (sec-tag without data-i18n) | **HIGH** — won't translate to `// Contact` |
| contact.html | 139 | `// Enviar mensaje` (form-tag without data-i18n) | **HIGH** — won't translate to `// Send message` |
| contact.html | 120 | `+505 0000 0000` (WhatsApp number) | LOW — phone numbers stay same |
| diagnostic.html | 111 | `0 / 11` (progress text) | LOW — dynamically updated by JS |
| results.html | 181 | `downloadPDF()` button uses `data-i18n` not `data-i18n-btn` | ⚠ — `textContent` used instead of `innerHTML`, but no HTML entities in this string, so it works |

### i18n Keys Present in EN but Missing Translations for:
- `man.tag`, `ct.tag`, `ct.formTag` — keys exist in both ES/EN objects ✓ BUT the HTML elements on manifesto.html and contact.html don't use `data-i18n` to reference them.

### Language System
- Default: ES ✓
- Persists to `localStorage` key `onda_lang` ✓
- `data-i18n-btn` handler uses `innerHTML` for HTML entities ✓
- Custom `langchange` event dispatched ✓

---

## 5. INTERACTIVE ELEMENTS

### Grid Background (grid-bg.js)
- Uses `document.body.scrollHeight` in resize: ✓ (`Math.max(document.body.scrollHeight, window.innerHeight, 4000)` — line 42)
- Resize listener: ✓ (line 31)
- `requestAnimationFrame`: ✓ (line 35, 92)
- `will-change: transform`: ✓ (CSS line 30 + JS line 14)
- Mobile particle reduction: ✓ (line 17 — falls back to 8 if < 768px)
- Homepage: 20 particles ✓ | Interior: 10 particles ✓

### Neural Network (neural-net.js)
- Layer structure: `[4, 6, 8, 6, 3]` ✓ (line 8)
- `will-change: transform`: ✓ (line 16)
- `requestAnimationFrame`: ✓ (line 85)
- Bilingual labels: ✓ (lines 72-75)
- Homepage only: ✓ (only loaded in index.html)

### Terminal Typewriter (terminal.js)
- Line interval: `setTimeout(typeLine, 500)` ✓ (line 69)
- Initial delay: 1500ms (line 48) — slightly longer than spec, acceptable
- Fade-up animation: ✓ (lines 58-63)
- Colored output with spans: ✓
- Responds to `langchange`: ✓ (line 40)
- Restarts on language change: ✓

### Encryption Strip (encrypt.js)
- Character set matches spec: ✓ (line 8)
- Prefix `/// E2E-ENCRYPTED ///`: ✓ (line 16)
- Update interval: 80ms ✓ (line 34)
- Auto-discovers all `.encrypt-strip` elements: ✓

### Stat Counters (index.html inline)
- `requestAnimationFrame`: ✓ (line 257)
- Duration: ~1400ms (s1), ~1600ms (s2), ~1300ms (s3), ~1100ms (s4) — roughly matches spec ✓
- Triggered after 800ms delay: ✓

### Page Transitions
- `@keyframes up` fadeUp: opacity 0→1, translateY 16px→0 ✓ (shared.css:137)
- Staggered delays on hero elements: ✓
- `.fade-up` class with IntersectionObserver on manifesto.html: ✓

---

## 6. KNOWN BUGS CHECK

| # | Bug | Status | Details |
|---|-----|--------|---------|
| 1 | Grid canvas height = scrollHeight | ✓ FIXED | `grid-bg.js:42` uses `Math.max(document.body.scrollHeight, ...)` |
| 2 | Lang toggle restarts terminal + updates NN labels | ✓ FIXED | `terminal.js:40` listens for `langchange`; `neural-net.js:76` reads lang on each frame |
| 3 | CTA buttons with → use innerHTML | ✓ FIXED | `data-i18n-btn` attribute uses `innerHTML` in `i18n.js:564` |
| 4 | Mobile stats grid border on 2nd/4th | ⚠ PARTIAL | 2nd cell: ✓ (`border-right:none`). **4th cell still loses right border** via `:last-child` rule — needs explicit fix at 768px |
| 5 | Range slider uses `input` event | ✓ FIXED | `diagnostic.js:59` uses `'input'` event |
| 6 | Safari canvas `will-change: transform` | ✓ FIXED | Set on `.grid-bg` (CSS), `#nnCanvas` (JS), `.nn-canvas` (CSS) |
| 7 | Form submission: preventDefault + loading + errors | ✗ NOT FIXED | `contact.html:216` — `preventDefault` ✓ BUT: **no actual Formspree submission** (just hides form + shows success), **no loading state**, **no error handling** |

---

## 7. CODE QUALITY

### console.log
- **None found** ✓

### Hardcoded URLs
- `https://wa.me/5050000000` in `contact.html:120,129` — **placeholder phone number** (0000 0000). This needs a real number before launch.
- `https://onda.ai/` canonical URLs — fine if this is the planned domain.

### Meta Tags
| Page | title | description | og:title | og:description | og:type | og:image |
|------|-------|-------------|----------|----------------|---------|----------|
| index.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| diagnostic.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| results.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| manifesto.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| contact.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| 404.html | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

**og:image missing on ALL pages** — no `assets/og-image.png` exists either.

### HTML Semantics
- `index.html`: `<header>` for hero ✓, `<main>` wraps content ✓, `<nav>` ✓, `<footer>` ✓, `<section>` for each block ✓
- `diagnostic.html`: No `<main>` tag ✗ — content goes directly in `.page` div
- `results.html`: `<main>` ✓
- `manifesto.html`: `<section>` for hero ✓, but no `<main>` wrapping content ✗
- `contact.html`: No `<main>` tag ✗
- `404.html`: No `<main>` tag ✗

### Inline Styles
- `contact.html:81`: `style="background:var(--accent);color:var(--bg)"` on nav-cta — should be in CSS
- `index.html:179`: `style="margin-top:36px"` on terminal — minor
- `index.html:193`: `style="font-size:14px;color:var(--gray);line-height:1.7"` — duplicates `.sec p` styles, should use class

### External CDN Links
- All Google Fonts: `https://` ✓
- jsPDF: `https://cdnjs.cloudflare.com/...` ✓

---

## 8. PERFORMANCE

### CSS
- `shared.css`: Not minified but compact (154 lines). No dead rules detected. ✓ Acceptable for static site.
- Inline `<style>` on each page: Contains page-specific styles. Could be extracted but fine for static site performance.

### JavaScript
- Largest file: `i18n.js` (~596 lines) — contains all translations. Acceptable.
- All other JS files: < 200 lines each. ✓
- No unnecessary dependencies.

### Canvas Animations
- All use `requestAnimationFrame` ✓
- No `setInterval` for animations ✓

### Fonts
- `display=swap` on all pages ✓
- No `<link rel="preload">` for fonts ⚠ (would improve LCP)

### Render-blocking
- CSS file is render-blocking (normal, unavoidable)
- JS files at bottom of `<body>` ✓ (non-blocking)
- jsPDF loaded only on results.html ✓

---

## Priority Summary

### CRITICAL (breaks functionality)
1. Contact form doesn't submit to Formspree — no data captured

### HIGH (visual/UX impact)
2. Manifesto `// Manifiesto` sec-tag doesn't translate
3. Contact `// Contacto` sec-tag doesn't translate
4. Contact `// Enviar mensaje` form-tag doesn't translate
5. Mobile stats grid 4th cell missing right border
6. Placeholder WhatsApp number (0000 0000) in contact page
7. `vercel.json` missing — no 404 routing, no clean URLs
8. `og:image` missing on all pages

### MEDIUM (consistency)
9. index.html Google Fonts missing weight 300/500 for JetBrains Mono
10. Contact nav-cta inline style should be in CSS
11. Missing `<main>` semantic tag on diagnostic, manifesto, contact, 404
12. No font preloading
13. Hamburger and lang toggle slightly below 44px tap target

### LOW (nice to have)
14. Inline styles on index.html (margin-top, solution desc)
15. 404 page missing og: tags
16. No 480px breakpoint on manifesto/contact
17. `assets/` directory is empty
