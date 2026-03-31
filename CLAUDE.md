<!-- CLAUDE.md — IGNEA LABS -->
<!-- Claude Code reads this file before every task. Follow these rules on every change. -->

# Architecture

- **Framework:** Vanilla HTML/CSS/JS (static site, no framework — keep it lightweight for slow connections in Nicaragua)
- **Database:** None for MVP. Diagnostic answers stored in localStorage/sessionStorage. Future: Supabase for storing diagnostic results + contact info.
- **APIs:** Google Fonts CDN (Plus Jakarta Sans + JetBrains Mono), Formspree (contact form submission), jsPDF (client-side PDF report generation)
- **Auth:** None for MVP. Future: Supabase Auth for admin dashboard to view diagnostics.
- **Styling:** Vanilla CSS with CSS custom properties. No Tailwind, no preprocessors. Single shared stylesheet + page-specific styles.
- **i18n:** Custom JS i18n system using data-i18n attributes. Spanish is PRIMARY language. English is secondary. Every string must exist in both ES and EN. Default: ES. Language choice persisted in localStorage.
- **Deployment:** Vercel (static site) or Netlify
- **Repo:** github.com/fede09balto-gif/onda-ai

## Database Tables (Future — Supabase)
- `diagnostics` (id, created_at, language, answers_json, scores_json, total_score, level, contact_name, contact_email, contact_whatsapp, company_name, status)
- `contacts` (id, created_at, name, email, whatsapp, company, message, source)

# Design System

## Colors
- Background primary: `#08080D`
- Background surface 1: `#0E0E16`
- Background surface 2: `#14141E`
- Accent: `#00E5BF`
- Accent transparent: `#00E5BF22`
- Accent subtle glow: `#00E5BF0A`
- Text primary: `#EAEAF0`
- Text secondary: `#6E6E88`
- Text dim: `#3A3A50`
- Border: `#1A1A2A`
- Code string color: `#F0997B` (coral)
- Code keyword color: `#AFA9EC` (purple)

## Typography
- Display font: `'Plus Jakarta Sans', sans-serif` (weights 400, 500, 600, 700)
- Monospace font: `'JetBrains Mono', monospace` (weights 300, 400, 500, 700)
- Headlines: Plus Jakarta Sans 700, letter-spacing -0.02em, line-height 1.15
- Hero headlines: clamp(32px, 4.5vw, 56px)
- Section tags: JetBrains Mono 11px, uppercase, letter-spacing 3px, accent color, prefixed with "//"
- Stat values: JetBrains Mono 28px, bold, accent color
- Stat labels: 10px, uppercase, letter-spacing 1px, dim gray
- Body text: 15px, Plus Jakarta Sans 400, secondary gray, line-height 1.7
- Manifesto body: 16-17px, #8E8EA0 (lighter for readability), line-height 1.8

## Visual Rules
- Border radius: 0px everywhere. Sharp corners. Engineering aesthetic. Exception: brand mark circle and dots in terminal bar.
- Borders: 0.5px solid var(--border) throughout.
- Hover states: background shifts to accent subtle glow (#00E5BF0A).

## Logo
- Text: "IGNEA" in white (#EAEAF0), ".LABS" in accent (#00E5BF)
- Letter spacing: 3px, Weight: 800
- Logo is text-only: "IGNEA.LABS" — no mark/circle

## Interactive Elements
- Gradient dots background (CSS radial-gradients with slow drift animation, js/grid-bg.js) — all pages
- Terminal typewriter simulation (lines appear every 600ms with fade-up) — homepage only
- Static encryption badge (lock SVG + "ENCRYPTED" text) — replaces old animated strip
- Stat counters (animate from 0 to target value on page load)
- NOTE: Neural network animation and encryption strip animation were REMOVED

# Pre-edit Checklist

1. Read the BUILD_SPEC.md file for full page specs, copy, and scoring logic before building any new page.
2. Every new user-facing string → add to BOTH es and en translation objects in js/i18n.js. Never hardcode text.
3. Every page must include: shared nav, shared footer, gradient dots background (js/grid-bg.js), language toggle, responsive mobile layout.
4. Every input element: dark surface background (#0E0E16), 0.5px border, accent border on focus, minimum 44px tap target on mobile.
5. Every multiple-choice option: styled as a card (dark surface, 0.5px border, accent border + subtle glow on selection). Never use native radio/checkbox styling.
6. Every button: either btn-primary (accent bg, dark text, 700 weight, 16px/32px padding) or btn-ghost (transparent bg, border, gray text, 500 weight). No other button styles.
7. Gradient dots background is self-initializing (IIFE in grid-bg.js). No init() call needed. Drift animation disabled on mobile (< 768px).
8. Every page: proper semantic HTML (header, nav, main, section, footer). Proper meta tags.
9. Every page transition: subtle fade-in on load (opacity 0 → 1).
10. Solutions section was REMOVED from homepage (reveals playbook). Replaced with "What We Do" prose section.
11. Spanish is always written FIRST, English second. Default language is ES.
12. No external JS frameworks. No jQuery. No React. Vanilla JS only.
13. No images required for MVP — all visuals are CSS/Canvas/SVG.
14. Mobile responsive: test at 375px (iPhone SE), 768px (tablet), 1440px (desktop).
15. Navigation on mobile: hamburger menu with slide-in panel from right.
16. Forms submit to Formspree endpoint. Show success state with encryption animation after submission.
17. localStorage keys prefixed with "ignea_" (e.g., ignea_lang, ignea_diagnostic_answers, ignea_diagnostic_scores).
18. All console.log statements removed before committing.

# Known Bugs (verify on every change)

- Language toggle must restart the terminal animation in the correct language.
- Hero CTA buttons with HTML entities (→) must use innerHTML, not textContent, when switching languages. Use data-i18n-btn attribute.
- Range slider on diagnostic page must show current value in real-time. Use 'input' event, not 'change' event.
- Formspree form submission: must prevent default, show loading state, handle errors gracefully.
- Diagnostic info collection is now BEFORE questions (screen 1), not after. Contact fields use dxFirstName/dxEmail/dxCompany IDs.

# Code Patterns

## i18n system
- All translations in js/i18n.js: `{ es: { "key": "value" }, en: { "key": "value" } }`
- Text elements: `<span data-i18n="key">Default Spanish text</span>`
- HTML elements: `<h1 data-i18n-html="key">Default <em>Spanish</em> text</h1>`
- setLang(lang) function updates all elements, saves to localStorage, updates document.lang
- On page load: check localStorage for ignea_lang, default to 'es'

## Shared components (loaded via JS/CSS on every page)
- Nav: sticky, backdrop-filter blur, logo + links + lang toggle
- Footer: brand + links + copyright
- Grid background: canvas#bg with particle animation
- Encryption strip: div.encrypt-strip with scrambling characters

## CSS custom properties
```
--bg: #08080D
--bg2: #0E0E16
--bg3: #14141E
--accent: #00E5BF
--accent2: #00E5BF22
--accent3: #00E5BF0A
--white: #EAEAF0
--gray: #6E6E88
--dimgray: #3A3A50
--border: #1A1A2A
--coral: #F0997B
--purple: #AFA9EC
--ff: 'Plus Jakarta Sans', sans-serif
--fm: 'JetBrains Mono', monospace
```

# Commit Rules

- Format: feat:, fix:, refactor:, chore:, docs:
- Before committing: verify no hardcoded Spanish/English strings outside of translation objects. Verify both language versions render correctly. Verify mobile layout at 375px width.
- Push to: origin main

# File Structure

```
onda-ai/
├── CLAUDE.md
├── BUILD_SPEC.md
├── index.html
├── diagnostic.html
├── results.html
├── manifesto.html
├── contact.html
├── 404.html
├── css/
│   └── shared.css
├── js/
│   ├── i18n.js
│   ├── grid-bg.js
│   ├── neural-net.js
│   ├── terminal.js
│   ├── encrypt.js
│   ├── diagnostic.js
│   ├── scoring.js
│   └── results.js
└── assets/
    └── og-image.png
```

# Pages & Status

| Page | File | Status |
|------|------|--------|
| Homepage | index.html | DONE |
| Diagnostic Survey | diagnostic.html | TO BUILD |
| Results Report | results.html | TO BUILD |
| Manifesto | manifesto.html | TO BUILD |
| Contact | contact.html | TO BUILD |
| 404 | 404.html | TO BUILD |

# Key Business Context

- Company operates in NICARAGUA targeting local SMBs (restaurants, clinics, hotels, law firms).
- Partner Gatun Labs (gatunlabs.com) runs the same model in Panama at $15-30K.
- Prices are $1,500-8,000 per project, adapted for Nicaraguan purchasing power.
- The diagnostic survey is the lead magnet and sales tool — it must feel premium, professional, and trustworthy.
- Low scores on the diagnostic = HIGH opportunity for the client (frame positively, never judgmentally).
- The sales pitch: "We save you X hours and $Y per month. Our solution pays for itself in Z months."
- Target audience is NOT technical. The site must feel impressive but not intimidating.
- Most clients will view on mobile phones, many on slower connections.
