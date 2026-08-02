<!-- CLAUDE.md — IGNEA LABS -->
<!-- Read on every task. Current state only. History lives in HANDOFF.md. -->

# What this is
AI consultancy site for SMBs in Nicaragua and Central America. Primary
vertical: ferreterías, clínicas, hoteles, restaurantes. Audience is
non-technical and mostly on mobile. Engagements $1,500–8,000.
Client-facing pages show the client's savings, never our prices.

# Architecture
- Vanilla HTML/CSS/JS static site. No build step, no framework, no package.json.
- Local directory: `~/ignea-labs`. Repo: github.com/fede09balto-gif/Ignea-Labs.
- Hosted on Vercel. The project serving www.ignealabs.com is **ignea-labs-w8bp**.
  `ignea-labs` is a DEAD decoy project that happens to share a name with the local
  directory — never trust CLI output without checking `.vercel/project.json` first.
- `vercel.json` sets `cleanUrls:true` — every `.html` path 308-redirects to the clean
  form. Canonicals, sitemap and internal links must use the clean form. When verifying
  with curl, fetch `/` not `/index.html`, or you measure the redirect.
- `Content-Security-Policy: frame-ancestors 'none'` is set. The site has zero iframes
  or embeds; keep it that way.
- Third-party at runtime: jsPDF (cdnjs) on results/demo/ops, Plausible analytics.
- Supabase is placeholder-only and guarded — queries short-circuit rather than firing
  at a hostname that cannot resolve. Do not remove the client object; callers
  dereference it after checking only that IgneaSupabase is defined.

# Money
`js/labor-cost.js` is the ONLY source of an hourly rate. Never hardcode one, never let
a model invent one. `counter` ($2.09/hr) is derived in code from the Nicaraguan minimum
wage, INSS patronal, INATEC, aguinaldo and vacaciones — see that file's header for the
full derivation and its caveats. `supervisor` and `professional` are judgment estimates
and are labelled as such. Any figure shown to a prospect carries the BCN-rate disclosure
via `IgneaLaborCost.disclosure(lang)`.

# Design tokens (css/shared.css — white editorial theme)
--bg:#FFFFFF  --bg-tint:#F7F7F5  --ink:#0A0A0C  --ink-2:#55555C  --ink-3:#8E8E94
--line:#E6E5E1  --red:#E8352A  --red-wash:rgba(232,53,42,.07)
--code-bg:#0A0A0C  --code-ink:#F5F5F2
--shadow-1:0 1px 2px rgba(10,10,12,.05)  --shadow-2:0 12px 32px rgba(10,10,12,.07)
--ff:'DM Sans'  --fs:'DM Serif Display'  --fm:'JetBrains Mono'
--ease:cubic-bezier(.22,.9,.28,1)   <- shared motion curve, use it
Older names (--accent, --border, --white, --gray, --bg2, --text-*) remain as aliases.
Prefer canonical names in new code; don't churn existing call sites.
Weights 600/700 are NOT imported — those render synthetic bold. Known, accepted.
Logo is an SVG image at /assets/logo.svg. No teal.

## Radius
Radius signals "you can touch this." Interactive surfaces get it: buttons 8px,
cards and tiles 10px. Everything structural stays square: sections, dividers, rules,
code blocks, tables, the proforma, form frames, containers.

# i18n
- `data-i18n` = textContent. `data-i18n-html` / `data-i18n-btn` = innerHTML. If an
  element contains an SVG, wrap the text in its own span — the innerHTML variants
  will destroy the icon.
- ~1000 keys in js/i18n.js, both languages. Spanish default. setLang writes
  `document.documentElement.lang`, so `html[lang="en"]` selectors work, and fires a
  `langchange` event — anything measuring laid-out geometry must re-measure on it.
- Every new string goes in BOTH languages. One approved exception: the WhatsApp demo's
  three scripted conversations are ES-only and live in js/wa-demo.js.
- All localStorage/sessionStorage keys are prefixed `ignea_`.

# Standing rules
1. Nothing on the public site states a result, timeline, or figure attributed to a
   client until there is a real one. thesis.html's Latin-America market statistics are
   fine — they describe the market, not our outcomes. Animation pacing is not a
   latency measurement.
2. Never print, echo, or ask for API keys or tokens. Verify env vars by name and scope
   (`vercel env ls`), never by value. Never read .env.local.
3. Client-facing output is Spanish first. English is secondary.
4. Verify by running things, not by reading code. Browser-check, don't assume.
5. Mobile-first: test 375 / 768 / 1440. Cards for multiple choice, never native
   radio/checkbox. 44px minimum tap target.
6. Don't guess at missing user-supplied values — ask.

# Where the real specs live
- HANDOFF.md — current state, open work, decisions and their reasoning. Start here.
- IGNEA_DIAGNOSTIC_SPEC_v3.md — diagnostic spec. The live form is the 4-question
  intake, NOT this 11-question v3.
- AUDIT_REPORT.md, QA_REPORT.md, LAUNCH_*.md — historical record. Do not "fix" them
  to match present state.

# Commits
feat: | fix: | refactor: | chore: | docs:
