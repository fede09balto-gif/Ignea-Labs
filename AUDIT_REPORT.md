# IGNEA LABS — REPO AUDIT FOR REVIVAL

**Date:** 2026-07-30
**Repo:** `/Users/fedebalto/onda-ai` — github.com/fede09balto-gif/onda-ai
**Commit audited:** `55edf47` "feat: rebuild scraper with Claude API analysis, remove CORS dependency" (2026-04-12)
**Branch:** `main`, clean tree, in sync with `origin/main`
**Deployed:** https://www.ignealabs.com (Vercel project `ignea-labs`, `prj_VzLJ…`)
**Method:** static analysis + local server (`python3 -m http.server 8899`) + headless Chromium (Playwright 1.62.1, installed to scratchpad only — **not** added to the repo)

**Scope note:** discovery only. The only writes this session were `git mv AUDIT_REPORT.md AUDIT_REPORT_ONDA_2026-04.md` and the creation of this file.

---

## 0. TWO EXISTENTIAL FINDINGS (READ FIRST)

Elevated out of the general lists because each can sink the revival on its own.

### E-1 — `/api/claude` is an open, unauthenticated LLM relay billing your Anthropic key

**Severity: CRITICAL. Fix before the site gets any traffic at all.**

`api/claude.js` is a Vercel serverless function that forwards `model`, `system`, `messages`, `max_tokens` and `temperature` straight to `api.anthropic.com` using `process.env.ANTHROPIC_API_KEY`. It has **no authentication, no origin check, no rate limit, and no model or token allowlist**. Every field is caller-controlled.

The key itself is handled correctly — it lives in a Vercel env var, is never sent to the browser, and is not in the repo or in git history (see §6). The defect is not key *leakage*; it is that the key's **spending capability** is published to the internet.

Verified live, unauthenticated, from a spoofed third-party origin:

```
$ curl -s -X POST https://www.ignealabs.com/api/claude \
    -H "Content-Type: application/json" \
    -H "Origin: https://evil-third-party.example" \
    -d '{"model":"claude-haiku-4-5-20251001","max_tokens":1,
         "messages":[{"role":"user","content":"hi"}]}' -w "\nHTTP %{http_code}\n"

{"model":"claude-haiku-4-5-20251001","id":"msg_011CdYqnsEbZtxGEA1d6BQMZ","type":"message",
 "role":"assistant","content":[{"type":"text","text":"Hello"}],"stop_reason":"max_tokens",
 "usage":{"input_tokens":8,"output_tokens":1,"service_tier":"standard"}}
HTTP 200
```

Anyone who discovers this URL has a free Claude endpoint on your account, at any model they name, until the credit runs out. The whole of `api/claude.js` is 37 lines; lines 12–16 accept the caller's `model` and `max_tokens` verbatim.

**What breaks if you change it:** `js/ops-ai.js:21` is the only in-repo caller (`fetch('/api/claude')`). Any auth you add — a shared secret header, a Vercel deployment-protection bypass token, an origin check — must be mirrored there. That is the entire blast radius; nothing else calls it. Diagnosis only, no fix applied.

### E-2 — `results.html` is orphaned; the flow never reaches it

**Severity: HIGH (dead asset + wasted maintenance), but not a live user-facing break.**

`CLAUDE.md:20` records this as "BROKEN — expects scoring data diagnostic.js no longer produces." Confirmed by driving the flow, not by reading code, and the real behavior is more specific than "broken."

Where the contract broke:

- `js/results.js:54-55` reads `sessionStorage['ignea_diagnostic_scores']` and `['ignea_diagnostic_answers']`.
- `js/diagnostic.js` **never writes either key.** Its `submitIntake()` (line 380) writes `localStorage['ignea_submissions']` and `sessionStorage['ignea_intake_answers']` / `['ignea_intake_screen']`, then calls `goTo(6)` — the in-page hook screen. There is no navigation to `results.html` anywhere in the file.
- The only writer of `ignea_diagnostic_scores` in the whole repo is `demo.html:74-76`, which hardcodes `ignea_diagnostic_id = 'demo'`.

Driven evidence — after a complete real submission:

```
after Q5 submit: hookScreen
URL after submit: http://localhost:8899/diagnostic.html
ignea_submissions count: 1
ignea_diagnostic_scores (what results.js needs) = null
```

Loading `/results.html` directly with no scores present:

```
FINAL URL after loading /results.html directly = http://localhost:8899/diagnostic.html
redirected away from results.html? true
```

So it does not error — it silently redirects to `diagnostic.html`. **The current post-diagnostic path is: Q5 → `submitIntake()` → in-page `hookScreen` → Calendly CTA (`https://calendly.com/ignealabs/30min`).** The user never leaves `diagnostic.html`.

Collateral: `js/results.js` (899 lines) and `js/scoring.js` (68 lines) are dead in production. `IgneaScoring` is *defined* in `scoring.js`, loaded by `results.html:360` and `demo.html:428`, and **never called by anything** — `grep -rn "IgneaScoring"` returns only its own definition. The live scoring is a second, duplicated copy inside `js/ops-dashboard.js:calculateScores()` (ops.html does not load `scoring.js` at all).

---

## 1. INVENTORY

### Annotated file tree

```
onda-ai/
├── index.html          45.7 KB  Home: hero, animated terminal, industry cards, stat counters (BROKEN §3),
│                                inline ROI calculator, marquee, WhatsApp float
├── diagnostic.html     25.3 KB  THE live funnel. 7 screens: landing → info(contact) → Q2 → Q3 → Q4 → Q5 → hook
├── results.html        21.7 KB  ORPHANED (§E-2). Redirects to diagnostic.html when scores absent
├── demo.html           25.2 KB  Sample report. Only writer of ignea_diagnostic_* sessionStorage keys
├── thesis.html         12.0 KB  "Nuestra Tesis" static narrative page
├── contact.html        14.5 KB  Split layout: intro + embedded Calendly iframe; Formspree form (BROKEN §4)
├── ops.html            30.0 KB  Internal CRM. 4 tabs: Pipeline / Leads / Calculadora / Scraper
├── 404.html             5.6 KB  Error page; also the Vercel catch-all target
├── api/claude.js         37 L   Vercel serverless Anthropic proxy — OPEN RELAY (§E-1)
├── css/
│   ├── shared.css       398 L   Design-token layer (:root) + base typography, forms, footer, WA float
│   ├── components.css   110 L   Shared component bits
│   ├── ops.css         2655 L   Ops DARK theme
│   └── ops-light.css   1118 L   Ops LIGHT theme — loaded AFTER ops.css, overrides it (§8)
├── js/                 (20 modules, ~9.5 K lines)
├── assets/             favicon.svg, logo.svg, og-image.png
├── supabase/           schema.sql, seed-solutions.sql, migrations/, functions/on-diagnostic-complete/
├── google-apps-script/sync.gs   Sheets mirror — Onda-era header (§5)
├── vercel.json         redirects + rewrites + 2 security headers
└── docs: CLAUDE.md, BUILD_SPEC.md, README.md, QA_REPORT.md, FIX_TASKS.md,
         LAUNCH_BLOCKERS.md, LAUNCH_CHECKLIST.md, AUDIT_REPORT_ONDA_2026-04.md (archived this session)
```

### Every page and what it does

| Page | Live? | What it actually does |
|---|---|---|
| `index.html` | ✅ | Marketing home. Terminal typewriter, industry cards (8 verticals), inline savings calculator, stats row that throws on every load (§3) |
| `diagnostic.html` | ✅ | The only working funnel. Collects contact + 4 questions, writes `ignea_submissions`, renders blurred hook screen, CTA → Calendly |
| `thesis.html` | ✅ | Static brand narrative |
| `contact.html` | ⚠️ | Calendly iframe works; the Formspree form posts to `PLACEHOLDER_ID` and always shows the error branch |
| `demo.html` | ✅ | Sample report; seeds fake diagnostic data into sessionStorage |
| `ops.html` | ⚠️ | CRM works; auth is fake (§6); scraper unusable (§4) |
| `results.html` | ❌ | Orphaned, redirects away (§E-2) |
| `404.html` | ✅ | Serves with a real 404 status |

### Every JS module and its responsibility

| Module | Lines | Responsibility | State |
|---|---|---|---|
| `i18n.js` | 2399 | ES/EN dictionary (~958 unique keys) + `data-i18n` binding | ⚠️ ~60% orphaned (§5) |
| `ops-leads.js` | 1542 | Lead detail panel, notes, activity, stage changes | ⚠️ renders 2 scoring models (§3) |
| `results.js` | 899 | Results rendering + jsPDF report | ❌ dead (§E-2) |
| `ops-calculator.js` | 767 | Pricing/proposal calculator | ✅ verified working |
| `diagnostic.js` | 655 | Intake state machine, hook screen, voice input, submission | ✅ working |
| `ops-scraper.js` | 547 | Company scraper + Claude analysis | ❌ unreachable (§4) |
| `ops-ai.js` | 383 | AI recommendations / proposal-MOU via `/api/claude` | ⚠️ depends on E-1 endpoint |
| `ops-dashboard.js` | 341 | Pipeline board, `getLocalSubmissions()`, **duplicate** `calculateScores()` | ✅ working |
| `ops-auth.js` | 303 | Access gate | ❌ accepts anything (§6) |
| `custom-select.js` | 266 | Replaces native `<select>` with styled dropdown | ✅ working |
| `grid-bg.js` | 218 | Full-page canvas dot grid + 4 drifting orbs | ⚠️ **teal** palette (§5, §8) |
| `supabase-config.js` | 153 | Hand-rolled PostgREST client | ❌ placeholder creds (§4) |
| `scroll-animations.js` | 92 | IntersectionObserver fade-ups | ✅ |
| `terminal.js` | 73 | Hero typewriter | ✅ |
| `scoring.js` | 68 | `IgneaScoring` 4×25 model | ❌ **never called** |
| `score-gauge.js` | 45 | SVG gauge | ❌ results-only, dead |
| `sheets-sync.js` | 40 | Google Apps Script mirror | ⚠️ unverified endpoint |
| `card-tilt.js` | 36 | Pointer tilt effect | ✅ |
| `analytics.js` | 18 | Plausible wrapper (`IgneaAnalytics.track`) | ✅ |

### Third-party deps and CDNs

Full origin census (`grep -rhoE "https?://[a-zA-Z0-9.-]+"`, counts = occurrences):

| Origin | Uses | Purpose |
|---|---|---|
| `fonts.googleapis.com` / `fonts.gstatic.com` | 14 / 7 | DM Sans, DM Serif Display, JetBrains Mono, Plus Jakarta Sans |
| `plausible.io` | 7 | Analytics, `data-domain="ignealabs.com"` |
| `wa.me` | 8 | WhatsApp float + CTAs → **+1 949 373 6407 (a US number)** |
| `calendly.com` / `assets.calendly.com` | 4 / 1 | `ignealabs/30min` booking + widget script |
| `cdnjs.cloudflare.com` | 3 | jsPDF 2.5.2 |
| `unpkg.com` | 1 | jsPDF 2.5.2 **again** — `ops-ai.js:283` lazy-loads from a *different* CDN than `ops.html:595` |
| `api.anthropic.com` | 2 | `api/claude.js:17` (server, correct) + `ops-scraper.js:163` (**direct from browser**, §4) |
| `api.allorigins.win` | 1 | `ops-scraper.js:9` CORS proxy — still present despite the commit message claiming its removal |
| `formspree.io` | 1 | Contact form → `PLACEHOLDER_ID` |

No package manager. No build step. No lockfile. Nothing to `npm audit`.

### localStorage / sessionStorage keys in use

Complete census. **There are no legacy `onda_*` keys — all 12 are correctly `ignea_*` prefixed.**

| Key | Store | Written by | Read by |
|---|---|---|---|
| `ignea_lang` | local | i18n toggle | i18n, diagnostic, ops-ai, index |
| `ignea_submissions` | local | `diagnostic.js:449` | `ops-dashboard.js:72`, `ops-leads.js:1352` |
| `ignea_leads` | local | `ops-scraper.js:492` | `ops-scraper.js:478` |
| `ignea_ai_cache` | local | `ops-ai.js:93` | `ops-ai.js:84,91` |
| `ignea_ops_claude_key` | local | *(no UI writes it — §4)* | `ops-scraper.js:122` |
| `ignea_ops_token` | session | `ops-auth.js` | `ops-auth.js:15` |
| `ignea_ops_user` | session | `ops-auth.js` | `ops-auth.js:16` |
| `ignea_intake_answers` | session | `diagnostic.js:259` | `diagnostic.js:265` |
| `ignea_intake_screen` | session | `diagnostic.js:189` | `diagnostic.js:294` |
| `ignea_diagnostic_answers` | session | **`demo.html:74` only** | `results.js:55` |
| `ignea_diagnostic_scores` | session | **`demo.html:75` only** | `results.js:54` |
| `ignea_diagnostic_id` | session | **`demo.html:76` only** | `results.js:96,885` |

The last three are the E-2 contract break made visible: only `demo.html` ever writes them.

---

## 2. WHAT WORKS — verified by driving the site

Served locally on `:8899`, driven in headless Chromium. Not inferred from code.

### ✅ Full diagnostic flow Q1 → contact → hook

```
screen 0: landingScreen
after start: infoScreen
infoNextBtn disabled? null
industry <select> options: |restaurant|medical|legal|hotel|retail|construction|logistics|
  accounting|realestate|education|agriculture|manufacturing|tech|consulting|ecommerce|
  insurance|pharma|energy|automotive|media|government|other
after info: q-screen data-q=1
Q2 next disabled? false
after Q2: q-screen data-q=2
Q3 next disabled? false
after Q3: q-screen data-q=3
after Q4: q-screen data-q=4
after Q5 submit: hookScreen
```

Validation gating works correctly: the Next button stays disabled until each screen's requirement is met (`>5` chars for Q2/Q4 textareas, ≥1 card for Q3, Q5 optional).

### ✅ Hook screen renders correctly

```json
{
  "heading": "Diagnóstico completo.",
  "sub": "Identificamos 5 áreas de automatización para Ferreteria El Martillo.",
  "hours": "Tu equipo pierde aproximadamente 10 horas/semana en trabajo manual.",
  "cards": 3,
  "blur": "Ahorro estimado: $X,XXX/mes",
  "cta": "https://calendly.com/ignealabs/30min"
}
```

Note the `$X,XXX` is **intentional** — a blurred teaser, not an unfilled placeholder (`diagnostic.js:361`).

### ✅ Submission lands in the ops pipeline

`ignea_submissions` after one real run — full record, correctly shaped:

```json
{
  "id": "sub_1785442216077_w6vj68",
  "name": "Federico", "email": "fede@ferreteriatest.ni",
  "company": "Ferreteria El Martillo", "whatsapp": "+505 8888 8888",
  "industry": "retail",
  "q2_businessDescription": "Vendemos herramientas, cemento y materiales…",
  "q3_timeSinks": ["same_questions","scheduling"], "q3_tools": ["whatsapp"],
  "q4_headache": "Perdemos ventas porque no sabemos que hay en bodega.",
  "opportunityCount": 5, "estimatedHoursLost": 10,
  "status": "new", "pipeline_stage": "new", "language": "es"
}
```

Session cleanup works: `intake_answers=null` after submit. Mid-flow resume also works — reloading `/diagnostic.html` restores both answers and screen position via `restoreProgress()`.

### ✅ Voice recording states (Web Speech API)

**This is `SpeechRecognition`, not `MediaRecorder`** — no audio is uploaded, no Whisper, no server round-trip. State machine driven with a stubbed recognizer:

```
IDLE:        {"cls":"mic-card","title":"Habla tu respuesta","sub":"Más rápido que escribir…","timer":"00:00"}
RECORDING:   {"cls":"mic-card recording","sub":"Escuchando... toca para detener","timer":"00:00"}
config:      {"lang":"es-MX","continuous":true,"interim":true}
after result, textarea = "somos una ferreteria"
DONE:        {"cls":"mic-card","sub":"¡Listo! Puedes editar el texto arriba.","timer":"00:01"}
PERM-DENIED: {"errText":"Permiso de micrófono denegado"}
NO-SPEECH:   {"errText":null}          ← silent, see §3
```

Idle → recording → transcript → done → permission-denied all behave correctly, in Spanish, with `es-MX` locale.

### ✅ Ops dashboard — CRM / pricing

Pipeline renders seeded leads into the correct stage column:

```
// PIPELINE DE VENTAS  NUEVO 1  Ferreteria El Martillo Federico 34 5 opp 0d
CONTACTADO 0  REUNIÓN 0  PROPUESTA 0  NEGOCIANDO 0  CERRADO ✓ 0  PERDIDO ✗ 0  PAUSADO 0
1 TOTAL LEADS  $0 VALOR PIPELINE  0 CERRADOS GANADOS  0% TASA CONVERSIÓN
```

Tab switching works correctly (visibility swaps cleanly between the four panels — I initially misread this as a stacking bug; hit-tested and it is fine).

Calculator is live and reactive — driving `calcHours` updates the rendered value:

```
BEFORE: … HORAS DESPERDICIADAS / SEMANA 20 hrs/semana …
AFTER:  … HORAS DESPERDICIADAS / SEMANA 80 hrs/semana …
```

Lead detail panel opens with four working tabs — Resumen, Respuestas, Análisis IA, Acciones — exposing: `Calcular precio`, `Ejecutar scraper`, `Descargar PDF del diagnóstico`, `Generar recomendaciones IA`, `Generar propuesta / MOU`, and all 7 stage transitions.

### ✅ Deploy is current

`index.html` and `js/ops-scraper.js` served from production are **byte-identical** to local `HEAD`:

```
live  sha: f15a2e40304dbefe  bytes: 45663      (index.html)
local sha: f15a2e40304dbefe  bytes: 45663      → IDENTICAL
live  sha: f0ec1438eb8631ad  bytes: 21361      (js/ops-scraper.js)
local sha: f0ec1438eb8631ad  bytes: 21361
```

### ⚠️ Could not verify

- **Proposal / PDF export end-to-end.** jsPDF loads from `cdnjs.cloudflare.com`, which was ORB-blocked in the sandbox: `typeof window.jspdf → "undefined"`. The buttons exist and are wired; the generated PDF was never produced. **Unverified.**
- **Scraper happy path.** Requires a real Anthropic key in `localStorage`; per your instruction I did not supply one. Only the no-key path was exercised.

---

## 3. WHAT'S BROKEN

### 3.1 `index.html` throws a `TypeError` on every single page load — HIGH

Console error captured on every load of the homepage:

```
[pageerror] Cannot set properties of null (setting 'textContent')
  STACK:
    TypeError: Cannot set properties of null (setting 'textContent')
    at tick (http://localhost:8899/index.html:630:22)
    at anim (http://localhost:8899/index.html:633:5)
    at http://localhost:8899/index.html:636:5
```

Root cause — `index.html:636-639` animates four stat counters:

```js
anim(document.getElementById('s1'), 72, '', 1400);
anim(document.getElementById('s2'), 32, '', 1600);
…
```

But those elements do not exist:

```
$ grep -on 'id="s[0-9]"' index.html
(no output)
```

All four IDs were removed from the markup at some point; the script was not. `getElementById` returns `null`, `tick()` dereferences it, and the throw aborts the whole `setTimeout` callback — so `s2`, `s3` and `s4` never even attempt to run. **All four homepage stat counters are dead, and every visitor gets a console exception.** This is the first thing a technical prospect would see in devtools.

### 3.2 Ops detail panel renders two incompatible scoring models side by side — MEDIUM

Captured from the live Resumen tab for one lead:

```
33/100 developing   Interacción cliente 0/20   Ma…
```
and, in the Respuestas tab for the *same* lead:
```
Flujo de Clientes 17/25  Flujo de Operaciones 5/25  Flujo de Información 3/25  Flujo de Crecimiento 8/25
```

The live model is **4 dimensions × 25** (`ops-dashboard.js:calculateScores`, mirroring `scoring.js`). But `ops-leads.js:1281` still carries the retired **5-dimension** label array from the 11-question v3 model:

```js
: ['Customer interaction', 'Process maturity', 'Digital presence', 'Data utilization', 'AI readiness'];
```

Five labels are zipped against four values, so the panel shows a bogus `0/20` row. Cosmetic but visible in a client-facing internal tool.

### 3.3 Duplicated scoring logic — MEDIUM

`js/scoring.js` defines `IgneaScoring.calculate()`. `js/ops-dashboard.js:~40-68` defines a byte-equivalent `calculateScores()`. `ops.html` never loads `scoring.js`; `results.html`/`demo.html` load it but never call it. Two copies of the same business rule, one of them unreachable. Any tuning of the scoring model must be done twice or it silently diverges.

### 3.4 Voice `no-speech` fails silently — MEDIUM (see §3.5 for the platform question)

`diagnostic.js:638`:

```js
} else if (event.error !== 'aborted' && event.error !== 'no-speech') {
```

`no-speech` is deliberately swallowed. Verified: firing `no-speech` returns the card to idle with `errText: null` — **zero feedback**. A user in a noisy ferretería taps the mic, speaks, gets nothing, and has no idea whether it failed, is still listening, or never started. For a mobile-first, non-technical, Spanish-speaking audience this is the single worst UX defect in the funnel.

### 3.5 Voice is invisible on unsupported browsers, with a written-but-never-shown message — MEDIUM

With `SpeechRecognition` and `webkitSpeechRecognition` both undefined (Firefox; iOS before 14.5):

```json
{ "voiceWraps": 3, "micCards": 0, "voiceErrorEls": 0, "unsupportedMsgShown": false }
```

`diagnostic.js:486` bails with `if (!SpeechRecognition) return;`, so the mic card is never constructed. The degradation is *graceful* — the textarea still works and nothing looks broken — but the i18n strings `voice_unsupported` ("Tu navegador no soporta entrada de voz" / "Your browser doesn't support voice input") exist in both languages at `i18n.js:1052` / `:2188` and are **never rendered by any code path**. Someone intended to tell the user; the wiring was never done.

**Correction to the brief's premise, stated plainly:** iOS Safari *does* support `webkitSpeechRecognition` from iOS 14.5 onward, so a current iPhone will show and run the mic. The "sees nothing" case is Firefox and pre-14.5 iOS, which is a much smaller slice of Nicaraguan mobile traffic than the brief assumed. The genuine iOS risk is different: `diagnostic.js:605` sets `continuous = true`, which Safari implements unreliably — it tends to stop after a pause where Chrome keeps listening. **I could not verify Safari's actual behavior — no iOS device or Safari build was available in this environment. Flagged as unverified, and it needs a real-iPhone test before the demo sprint.**

### 3.6 `ops.html` tab `aria-selected` never updates — LOW (a11y)

```
after clicking "scraper":
  aria-selected: ["pipeline=true","leads=false","calculator=false","scraper=false(.active)"]
```

`pipeline` stays `aria-selected="true"` forever while the `.active` class moves correctly. Screen readers will announce the wrong tab. `panelPipeline` also retains its `.active` class while invisible.

### 3.7 `contact.html` never reaches network idle — LOW

The Calendly widget keeps connections open indefinitely; `waitUntil: 'networkidle'` timed out at 20 s. Harmless for users (the page renders), but it means the page never fires a quiescent state — worth knowing for any future automated testing.

### 3.8 Console sweep — all 8 pages

| Page | Local errors |
|---|---|
| `index.html` | **1 pageerror** (§3.1) |
| `diagnostic.html` | none |
| `results.html` | none |
| `thesis.html` | none |
| `contact.html` | none local (navigation timeout only) |
| `demo.html` | `ERR_NAME_NOT_RESOLVED` → `https://your_project_id.supabase.co/rest/v1/diagnostics?select=ai_analysis&id=eq.demo` |
| `ops.html` | `ERR_BLOCKED_BY_ORB` → cdnjs jsPDF (sandbox artifact) |
| `404.html` | none |

The `demo.html` entry is real and ships to production: the placeholder Supabase hostname is resolved as a live DNS lookup on every visit, failing loudly in the console. Same on `diagnostic.html` submit (`…/rest/v1/leads?select=*`).

### 3.9 Dead code inventory

| Item | Status |
|---|---|
| `js/results.js` (899 L) | dead — page orphaned |
| `js/score-gauge.js` (45 L) | dead — results-only |
| `js/scoring.js` (68 L) | dead — never invoked |
| `results.html` (21.7 KB) | dead |
| `dx.*` v3 i18n namespace | dead — 342 lines (§5) |
| `voice_unsupported`, `voice_recording`, `voice_transcribing`, `voice_cta` | dead strings |
| `assets/favicon.svg` | superseded by root `favicon.svg`, which is what all 8 pages reference |
| `css/ops.css` (2655 L) | largely overridden by `ops-light.css` (§8) |

### 3.10 Broken links — none

Every internal `href` resolves. All assets return 200 both locally and in production:

```
/favicon.svg             live=200  local=200
/assets/og-image.png     live=200  local=200
/assets/favicon.svg      live=200  local=200
/assets/logo.svg         live=200  local=200
```

### 3.11 Race conditions — none found

`diagnostic.js` registers two separate `DOMContentLoaded` handlers (line 15 and line 653). Ordering is deterministic in the DOM spec and `initVoiceInputs` does not depend on the first handler's state, so this is untidy but not racy. `window.syncFixedNav` is defined in `diagnostic.html` before `diagnostic.js` loads and is always called through a `typeof` guard. No initialization races observed across 30+ page loads.

### 3.12 375px layout — no breakage

No horizontal overflow on any page (`scrollWidth === innerWidth` everywhere; the off-canvas mobile menu and marquee are intentional transforms):

```
--- /index.html @375 --- scrollWidth=417 innerWidth=417 OK
--- /diagnostic.html @375 --- scrollWidth=417 innerWidth=417 OK
--- /ops.html @375 --- scrollWidth=375 innerWidth=375 OK
… (all 8 pages OK)
```

**Tap-target violations** against CLAUDE.md rule 4 ("48px min tap target"):

| Element | Height | Pages |
|---|---|---|
| `#langES` / `#langEN` | 29 px | all 7 public pages |
| footer links | 17–24 px | all |
| `#calcHours` (range slider) | **3 px** | `index.html` |
| `#detailClose` | 32 px | `ops.html` |

The 3 px slider thumb track on the homepage calculator is effectively un-draggable on a phone.

**One retraction, for the record:** an early automated run reported `#dxLinkedin` intercepting pointer events on `#fixedNextBtn` at 375px, which would have been a funnel-blocking mobile bug. I chased it down and it was a Playwright actionability artifact, not a real defect. Decisive hit-test at five scroll offsets, three points across the button:

```
{"scrollY":0,  "barPos":"fixed","barZ":"50","hitTargets":["0.2=>button#fixedNextBtn","0.5=>button#fixedNextBtn","0.8=>button#fixedNextBtn"]}
{"scrollY":839,"barPos":"fixed","barZ":"50","hitTargets":["0.2=>button#fixedNextBtn","0.5=>button#fixedNextBtn","0.8=>button#fixedNextBtn"]}
```

The fixed nav bar is correctly layered. **Not a bug.**

---

## 4. PLACEHOLDERS & UNWIRED INTEGRATIONS

### `grep -rn "wa.me" .`

```
index.html:763:<a href="https://wa.me/19493736407?text=Hola%2C%20complet%C3%A9%20el%20diagn%C3%B3stico%20en%20ignealabs.com…
contact.html:294:<a href="https://wa.me/19493736407?text=…
thesis.html:197:<a href="https://wa.me/19493736407?text=…
results.html:321:  <a id="ctaWhatsApp" href="https://wa.me/19493736407?text=…
results.html:382:<a href="https://wa.me/19493736407?text=…
demo.html:389:  <a id="ctaWhatsApp" href="https://wa.me/19493736407?text=…
demo.html:450:<a href="https://wa.me/19493736407?text=…
js/results.js:477:      waLink.href = 'https://wa.me/19493736407?text=' + msg;
FIX_TASKS.md:34:- **Problem:** WhatsApp links use `+1 787 000 0000` … placeholder numbers
LAUNCH_BLOCKERS.md:10:- **Issue:** `wa.me/50500000000` — fake number.
AUDIT_REPORT_ONDA_2026-04.md:208:- `https://wa.me/17870000000` … **placeholder phone number**
```

**Not a placeholder any more** — the old fake numbers survive only in the docs. All 8 live references use one consistent number. **But it is `+1 949 373 6407`, a US (California) number.** For a WhatsApp-first outreach campaign to Nicaraguan ferreterías, a `+1` number materially depresses trust and reply rates versus a `+505` number. Product decision, not a bug — flagged for the demo sprint.

### `grep -rni "formspree" .`

```
contact.html:252:  fetch('https://formspree.io/f/PLACEHOLDER_ID', {
.env.example:14:FORMSPREE_ID=your_formspree_id
LAUNCH_BLOCKERS.md:16-17, LAUNCH_CHECKLIST.md:15-16, FIX_TASKS.md:5-8,
QA_REPORT.md:129,267, CLAUDE.md:22,44, README.md:12, BUILD_SPEC.md:381,
supabase/README.md:136, .clinerules:6,45, AUDIT_REPORT_ONDA_2026-04.md:198
```

**Still broken.** The submit *mechanics* were fixed since the archived audit — `contact.html:240-275` now does `preventDefault` → disable button → "Enviando…" → real `fetch` → success/error branches → best-effort Supabase mirror. But the endpoint is literally `PLACEHOLDER_ID`, so every submission takes the error branch. **The contact form has never captured a single lead.**

### `grep -rni "calendly" .`

```
contact.html:130:  data-url="https://calendly.com/ignealabs/30min?back=1&hide_gdpr_banner=1&background_color=0a0a0c&text_color=f5f4f2&primary_color=e8352a"
contact.html:132:  <script src="https://assets.calendly.com/assets/external/widget.js" async>
demo.html:388:    <a id="ctaCalendly" href="https://calendly.com/ignealabs/30min" …
results.html:320:  <a id="ctaCalendly" href="https://calendly.com/ignealabs/30min" …
js/diagnostic.js:373:  '<a href="https://calendly.com/ignealabs/30min" … class="btn-primary hook-cta">'
js/results.js:859:  doc.text('calendly.com/ignealabs/30min', M + 45, y);
css/shared.css:396-397, js/results.js:470,486, js/i18n.js:678,1835
```

**Fully wired and real.** One consistent account. Note the widget's `background_color=0a0a0c` is hardcoded dark and is a light-theme item (§8).

### `grep -rnE "XXXX|TODO|FIXME|PLACEHOLDER|YOUR_|CHANGEME" --include="*.html" --include="*.js" --include="*.css" .`

```
contact.html:252:  fetch('https://formspree.io/f/PLACEHOLDER_ID', {
js/supabase-config.js:9:  var PROJECT_URL = 'https://YOUR_PROJECT_ID.supabase.co';
js/supabase-config.js:11:  var KEY = 'YOUR_ANON_KEY';  // eyJ... format from Supabase Dashboard > Settings > API
```

Only three hits, and the codebase is otherwise free of TODO/FIXME debris. (`$X,XXX` in `diagnostic.js:361` is the deliberate blur teaser, not a placeholder.)

### Unwired integrations

| Integration | Status |
|---|---|
| **Supabase** | ❌ Placeholder host/key. Every write is a live DNS failure to `your_project_id.supabase.co`. `schema.sql`, `seed-solutions.sql`, migrations and the `on-diagnostic-complete` edge function all exist and are unused. **All persistence is localStorage-only — data lives in one browser profile and dies with it.** |
| **Formspree** | ❌ `PLACEHOLDER_ID` |
| **Google Sheets sync** | ⚠️ `sheets-sync.js` posts to an Apps Script URL; endpoint liveness unverified |
| **Ops scraper** | ❌ **Unreachable.** See below |
| **Plausible** | ✅ Wired, `data-domain="ignealabs.com"` |
| **Calendly** | ✅ Wired |

### The scraper is unusable, and it regressed the security fix

Three compounding problems in `js/ops-scraper.js`:

1. **It bypasses the server proxy.** Commit `198dc8a` ("move Claude API key server-side via Vercel serverless proxy") created `api/claude.js`. The *next-but-one* commit `55edf47` rebuilt the scraper to call `https://api.anthropic.com/v1/messages` **directly from the browser** (line 163) with `'anthropic-dangerous-direct-browser-access': 'true'` and a raw key read from `localStorage['ignea_ops_claude_key']` (line 122). `ops-ai.js` correctly uses `/api/claude`; the scraper does not. The security fix was undone for this one module.

2. **There is no UI to set the key.** The error is explicit:
   ```
   Error: API key de Claude no configurada. Ve a Ajustes para añadirla.
   ```
   `grep -rni "ajustes\|settings"` finds **no Ajustes/Settings screen anywhere** — the ops tabs are only Pipeline / Leads / Calculadora / Scraper. The error directs the operator to a page that does not exist, and nothing in the codebase ever writes `ignea_ops_claude_key`. The feature is 100% dead through the UI.

3. **The CORS proxy is still there.** Commit `55edf47` says "remove CORS dependency", but `ops-scraper.js:9` still defines `CORS_PROXY = 'https://api.allorigins.win/get?url='` and it fires on every run — captured live:
   ```
   >> OUTBOUND: GET https://api.allorigins.win/get?url=https%3A%2F%2Fexample.com
   ```
   Prospect URLs are being routed through an unaffiliated third-party proxy.

---

## 5. LEGACY DEBRIS

### `grep -rni "onda" .` — judgment per hit

The raw grep is dominated by false positives: `--text-secondary`, `.cta-secondary`, `hero.cta.secondary`, `"Spanish is PRIMARY … English is secondary"` — the substring "onda" inside "sec**onda**ry". Filtering those out leaves **five real hits**:

| Hit | Verdict | Note |
|---|---|---|
| `google-apps-script/sync.gs:1` — `// Google Apps Script — Onda AI Sheets Sync` | **RENAME** | Cosmetic, but it is the header of a file you may hand to a client's ops person |
| `google-apps-script/sync.gs:47` — `'Onda AI Sheets Sync is running.'` | **RENAME** | This string is returned by a live HTTP endpoint |
| `js/grid-bg.js:16` — `// Secondary: deeper teal` | **KILL** | See below — the comment is the least of it |
| `CLAUDE.md:6` / `.clinerules:10` — `Repo: github.com/fede09balto-gif/onda-ai` | **KEEP** | Factually correct; the GitHub repo really is still named `onda-ai`. Renaming the repo is a separate decision with redirect implications |
| `.claude/settings.local.json:7` — a stale allowlisted grep command | **KILL** | Zero risk, zero value |

### The real Onda debris is the canvas palette

`js/grid-bg.js:16-27` — the full-page animated background on **every page**:

```js
// --- COLORS ---
// Primary: teal glow (our accent)
// Secondary: deeper teal
// Tertiary: warm amber/coral hint (fire theme — Ignea = fire)
// These are VISIBLE. Not 5% opacity. Real color.

var orbs = [
  { …, cr: 0, cg: 229, cb: 191, opacity: 0.28 },   // teal   #00E5BF
  { …, cr: 0, cg: 160, cb: 140, opacity: 0.18 },   // teal   #00A08C
  { …, cr: 180, cg: 140, cb: 160, opacity: 0.12 }, // mauve
  { …, cr: 0, cg: 200, cb: 170, opacity: 0.14 }    // teal   #00C8AA
];
```

Three of four orbs are **teal** — the Onda palette — in direct violation of `CLAUDE.md:13` ("No teal"). The comment even admits "These are VISIBLE. Not 5% opacity. Real color." The Ignea rebrand changed the tokens in `shared.css` but never touched the canvas. **Verdict: KILL** — and it is the highest-value single item in the light-theme sprint (§8).

### Dead i18n keys

Static reference analysis across all HTML `data-i18n*` attributes and all `t()` / `IgneaI18n.t()` call sites:

```
defined (unique, ES+EN merged): 958
referenced:                     380
orphaned (upper bound):         579
```

**Caveat, stated honestly:** 579 is an upper bound. Some keys are referenced through variables (e.g. `showError('voice_permission_denied')`) that a static grep cannot see — I confirmed `voice_permission_denied` works in the browser despite being counted as an orphan. The number to trust is the fully-verified subset below.

**Definitively dead — the retired 11-question v3 diagnostic:**

```
defined dx.ind.*:    168 lines      referenced dx.ind.*:  0
defined dx.q[0-9]*:  174 lines      referenced dx.q[0-9]*: 0
```

**342 lines of `i18n.js` (≈14% of the file) serve a question set that no longer ships.** These are the per-industry branch questions (`dx.ind.construction.q2.c4`, `dx.ind.legal.q1.c3`, …) plus `dx.q7`–`dx.q10`. Zero references outside `i18n.js` itself. **Verdict: KILL** — but see §9, because these are the closest thing you have to a written record of the v3 industry-branching design, and they are worth reading before deletion.

Note `dx.industry.*` (the industry dropdown labels) **is** still used by `index.html:414-421` — do not blanket-delete the `dx.` prefix.

**Orphan concentration by prefix:** `dx` 217 · `ops` 155 · `res` 121 · `proof` 15 · `intake` 15 · `ct` 13.

### Missing spec files

`IGNEA_DIAGNOSTIC_SPEC_v3.md` and `IGNEA_ADAPTIVE_DIAGNOSTIC_PLAN.md` **do not exist anywhere on this machine.** Searched:

- Repo working tree — absent
- Full git history: `git log --all --diff-filter=A --name-only` across all 84 commits → the only `*SPEC*` file ever added is `BUILD_SPEC.md`
- `ls -la ~/Downloads ~/Documents ~/Desktop | grep -i "ignea\|diagnostic\|adaptive"` →
  ```
  encuesta-diagnostico.jsx                                    (Desktop, 51 KB, Mar 19)
  ignea-labs-diagnostico-federico.pdf                         (Downloads, Mar 31)
  ignea-labs-reporte-restaurante-—-latinoamérica.pdf          (Downloads, Apr 8)
  ignea-labs-logo{,(1),(2)}.svg                               (Downloads, Apr 8)
  ```
- `find ~ -maxdepth 4 -iname "*.md" \( -iname "*ignea*" -o -iname "*adaptive*" -o -iname "*diagnostic*" \)` → nothing
- `grep -rli "ADAPTIVE_DIAGNOSTIC\|DIAGNOSTIC_SPEC" ~/Downloads ~/Documents ~/Desktop` → nothing

**Closest surviving artifacts, not copied into the repo per your instruction:**
- `/Users/fedebalto/Desktop/encuesta-diagnostico.jsx` — 51 KB, dated 2026-03-19, almost certainly the v3 survey prototype
- `/Users/fedebalto/Downloads/ignea-labs-diagnostico-federico.pdf`

The authoritative in-repo spec is `BUILD_SPEC.md` (18.7 KB) plus `CLAUDE.md`. **Finding: the v3 diagnostic design exists only as a `.jsx` prototype on your Desktop and 342 orphaned i18n keys. If ferreterías need their own question set, that is the material to recover first.**

---

## 6. SECURITY & HYGIENE

### No secrets committed — working tree

```
$ grep -rnE "sk-ant-[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{35}" . --exclude-dir=.git
supabase/README.md:81:supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxx***REDACTED***
```

Single hit, and it is a documentation placeholder. Classified without printing the value:

```
token length: 19
CLASSIFICATION: pure placeholder (sk-ant- followed only by literal x characters)
  charset: [x]
```

`sk-ant-` + 12 literal `x` characters. A real Anthropic key is ~100 characters. **Not a secret.**

### No secrets committed — full git history

```
commits scanned: 84
$ git grep -nE "sk-ant-[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{35}" $(git rev-list --all)
55edf47…:supabase/README.md:81:… sk-ant-xxxx***REDACTED***
198dc8a…:supabase/README.md:81:… sk-ant-xxxx***REDACTED***
0c2983e…:supabase/README.md:81:… sk-ant-xxxx***REDACTED***
… (same placeholder line, all 84 commits)
```

Every historical hit is the same placeholder line in `supabase/README.md`. **No live credential has ever been committed to this repo.** No history rewrite is needed.

### `.gitignore`

```
.DS_Store
node_modules/
.env
.env.local
.env.production
supabase/.temp/
.vercel
.netlify
*.log
test-api.html
```

Adequate. Two notes: `.DS_Store` is listed but a stale one is tracked at repo root (harmless, worth a one-line cleanup); `.vercel` is correctly ignored and `.vercel/project.json` on disk holds only non-secret project/org IDs.

### How the Claude API key is injected — two different mechanisms

| Consumer | Mechanism | Verdict |
|---|---|---|
| `js/ops-ai.js` (recommendations, proposal/MOU) | `fetch('/api/claude')` → Vercel function reads `process.env.ANTHROPIC_API_KEY` → server-side call to Anthropic. Key never reaches the browser. | ✅ Correct pattern, ❌ but the endpoint is an open relay (§E-1) |
| `js/ops-scraper.js` (company analysis) | Reads a raw key from `localStorage['ignea_ops_claude_key']` and calls `api.anthropic.com` **directly from the page** with `anthropic-dangerous-direct-browser-access: true` | ❌ Regression. Requires pasting a live key into browser storage, where any XSS or extension can read it |

Both `.env.example` and `supabase/README.md` document the variable by name only, with placeholder values. Correct.

### Exposed endpoints

| Endpoint | Auth | Assessment |
|---|---|---|
| `POST /api/claude` | **none** | **CRITICAL — §E-1.** Verified exploitable in production |
| `ops.html` (lead PII: names, emails, WhatsApp numbers, business descriptions) | **none in practice** | **HIGH — see below** |
| `api.allorigins.win` | n/a | Prospect URLs leak to an unaffiliated third party |

### The ops dashboard has no working authentication

`js/ops-auth.js` looks like a gate: it hashes the input with SHA-256 and queries a Supabase `ops_users` table for a matching `password_hash`. But Supabase is unconfigured (`YOUR_PROJECT_ID.supabase.co`), so the request always fails DNS, and control lands in the fallback — whose own comments say it plainly:

```js
} else {
  // Supabase returned no match — accept any non-empty string as local fallback
  acceptLocalAuth(value);
}
}).catch(function() {
  // Supabase unreachable — accept any non-empty string as local fallback
  acceptLocalAuth(value);
});

function acceptLocalAuth(value) {
  if (!value || !value.trim()) { handleFailedAttempt(); return; }
  var userData = { id: 'local-…', name: 'Operador', email: '', role: 'admin',
                   permissions: ['read', 'write'] };
  sessionStorage.setItem('ignea_ops_token', 'authenticated');
  showDashboard(userData);
}
```

Verified live — submitting the single character `x`:

```
-- AUTH: submitting a single character as the access code --
accessInput present: true
session token set: authenticated
granted role: admin
```

**Any non-empty string grants `role: admin` with `['read','write']`.** `/ops` is reachable on the public domain. The saving grace is that lead data lives in `localStorage`, so a stranger sees an *empty* dashboard rather than your pipeline — the exposure is the tool and its logic, not (today) the data. That changes the moment Supabase is wired up, which is exactly what the integrations sprint intends to do. **Fix auth before connecting a real database.**

`ops.html` does correctly carry `<meta name="robots" content="noindex, nofollow">`.

### Security headers

`vercel.json` sets `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. There is **no CSP** and no `X-Frame-Options` — the latter was deliberately removed in commit `ccf4c28` so the Calendly iframe would load, which is a reasonable trade but leaves every page frameable. A `frame-ancestors` CSP would restore protection without breaking Calendly.

---

## 7. DEPLOY & DISCOVERABILITY

### Is the site live and serving the latest commit? — Yes

Confirmed byte-identical to `HEAD` (§2). The deployment is current.

### Why Google surfaces nothing — diagnosis

I set out to confirm a soft-404 hypothesis from `vercel.json`'s catch-all rewrite. **The hypothesis was wrong, and I am reporting the measurement rather than the guess.**

```
$ curl -sI https://www.ignealabs.com/this-path-does-not-exist-audit-test
HTTP/2 404
content-type: text/html; charset=utf-8
content-disposition: inline; filename="404"
```

```
$ curl -s https://www.ignealabs.com/this-path-does-not-exist-audit-test | head -7
<!DOCTYPE html>
<html lang="es">
<head>
…
<title>404 | Ignea Labs</title>
```

Vercel special-cases `404.html` and returns a genuine **404 status**, not 200. The catch-all rewrite `{ "source": "/(.*)", "destination": "/404.html" }` is behaving correctly and is **not** an indexing problem. Nothing to change here.

The actual causes are four, and they compound:

**7.1 — Every canonical URL points at a host that redirects. (This is the big one.)**

The apex 307-redirects to `www`:

```
$ curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://ignealabs.com/
307 -> https://www.ignealabs.com/
```

But every page's canonical points at the **apex**:

```
/           <link rel="canonical" href="https://ignealabs.com/">
/thesis     <link rel="canonical" href="https://ignealabs.com/thesis.html">
/contact    <link rel="canonical" href="https://ignealabs.com/contact.html">
/diagnostic <link rel="canonical" href="https://ignealabs.com/diagnostic.html">
/results    <link rel="canonical" href="https://ignealabs.com/results.html">
/demo       <link rel="canonical" href="https://ignealabs.com/demo">
```

Google crawls `www.ignealabs.com/thesis`, is told the canonical is `ignealabs.com/thesis.html`, follows it, and gets a 307 to `www.ignealabs.com/thesis.html`. Self-referential canonicals that resolve through a redirect chain are a well-known reason for pages to be crawled and then dropped rather than indexed.

Two further inconsistencies in the same tags: canonicals use `.html` extensions while `cleanUrls: true` makes the extensionless form the real URL (so `/thesis` and `/thesis.html` both resolve — classic duplicate-content); and `/demo` uniquely has no `.html`, so the set is not even internally consistent.

**7.2 — No `robots.txt`, no `sitemap.xml`.**

```
=== /robots.txt ===  status=404  type=text/html  size=5599
=== /sitemap.xml ===  status=404  type=text/html  size=5599
```

Neither exists on disk (`ls robots.txt sitemap.xml` → No such file). Both requests fall through to the 404 page. With no sitemap and no internal-link equity from anywhere, Google has almost no crawl signal.

**7.3 — `og:image` is a relative path on all 8 pages.**

```
index.html:12:<meta property="og:image" content="/assets/og-image.png">
contact.html:12, ops.html:10, thesis.html:12, 404.html:12,
results.html:12, diagnostic.html:12, demo.html:12   — all identical
```

The Open Graph spec requires an absolute URL. Facebook, LinkedIn and WhatsApp will not resolve `/assets/og-image.png`. **Every link you have shared on WhatsApp or LinkedIn has rendered without a preview image** — which matters a great deal for a WhatsApp-first outreach motion. The file itself is fine (`live=200`); only the tag is wrong.

**7.4 — The apex→www redirect is 307 (temporary), not 301 (permanent).** Temporary redirects do not consolidate ranking signal.

**7.5 — Search Console: cannot be determined from here.** There is no verification meta tag in any page and no `google*.html` verification file in the repo. Those are the two repo-visible methods; DNS-TXT verification would leave no trace in the codebase. **Status unknown — you need to check the Search Console account directly.** Note that even a correctly verified property would show almost nothing given 7.1–7.2.

Metadata quality is otherwise good: every page has a unique, well-written `<title>` and `<meta name="description">` in Spanish, plus `og:title`/`og:description`/`twitter:card`. The problem is purely structural.

---

## 8. LIGHT-THEME IMPACT MAP

Where the dark palette is load-bearing, with effort estimates for the theme sprint.

### The token layer (the good news)

`css/shared.css:1-22` is a genuine token layer, and `CLAUDE.md` documents it:

```css
:root{
  --bg:#0a0a0c;  --bg2:#141416;  --bg3:#1c1c22;
  --accent:#e8352a;  --accent2:rgba(232,53,42,0.12);  --accent3:rgba(232,53,42,0.06);
  --white:rgba(245,244,242,0.95);  --gray:rgba(245,244,242,0.55);
  --dimgray:rgba(245,244,242,0.35);  --border:rgba(245,244,242,0.09);
  --coral:#E5634B;  --purple:#AFA9EC;
  --body-light:rgba(245,244,242,0.7);
  --text-primary/-secondary/-dim: rgba(245,244,242,…);
}
```

Most of the public site consumes these variables. Re-pointing them gets you a long way — but note that **every text token is a translucent near-white** (`rgba(245,244,242,α)`), which is not a simple inversion: on white you need opaque dark values, not `rgba(10,10,12,α)`, or antialiasing and contrast both degrade.

### Hardcoded hex counts outside the token layer

```
312  css/ops-light.css
 29  js/ops-calculator.js
 24  css/ops.css
 18  css/shared.css
 17  results.html
 17  demo.html
 12  js/ops-scraper.js
 10  js/results.js
  9  js/score-gauge.js
  2  css/components.css
  1  each: ops.html, js/ops-leads.js, js/ops-auth.js, js/grid-bg.js, index.html, contact.html, 404.html
```

### Item-by-item

| # | Item | Location | Why it's load-bearing | Effort |
|---|---|---|---|---|
| 1 | **Canvas dot-grid + 4 orbs** | `js/grid-bg.js:1-30` | Renders on **every page**. RGB triplets in JS, invisible to CSS. Additive-looking glow tuned for `#0a0a0c`; on white the dots vanish and the orbs turn to grey smears. Also still **teal** (§5). Needs a palette *and* a compositing rethink, not a recolor | **L** |
| 2 | **Ops dual stylesheets** | `ops.html:` loads `ops.css` (2655 L) **then** `ops-light.css` (1118 L) | A previous light migration was done by *stacking an override sheet* rather than re-theming. 3773 lines where ~1100 should do; 312 hardcoded hexes in the override alone. Extending this pattern to the public site would compound the debt | **L** |
| 3 | **Blurred hook-screen cards** | `js/diagnostic.js:355-365` + `.hook-card-blur` | The paywall-tease effect depends on a dark blur over dark. On white, blurred light-grey text reads as "broken render", not "locked". Needs redesign, not restyling — and it is the money moment of the funnel | **M** |
| 4 | **Score gauge + cluster charts** | `js/score-gauge.js` (9 hexes), `js/results.js` (10) | Chart strokes/fills chosen for dark. Currently dead code (§E-2) — **only matters if results.html is revived**; otherwise delete instead of re-theming | **S** (or zero) |
| 5 | **Calculator result colors** | `js/ops-calculator.js` (29 hexes) | Highest hex density outside CSS. Inline color decisions in JS for savings/cost states | **M** |
| 6 | **Calendly widget params** | `contact.html:130` — `background_color=0a0a0c&text_color=f5f4f2&primary_color=e8352a` | Hardcoded in the iframe URL; the embed will stay dark inside a white page until changed | **S** |
| 7 | **Fixed nav bar scrim** | `diagnostic.html:77` — `background:rgba(10,10,12,0.96)` + `backdrop-filter:blur(12px)` | Hardcoded dark, bypasses tokens; sits over the funnel on mobile | **S** |
| 8 | **`shared.css` non-token hexes** | 18 occurrences outside `:root` | Leaked past the token layer; each needs individual judgment | **S** |
| 9 | **Page-level hexes** | `results.html` 17, `demo.html` 17, 1 each in `index/contact/404/ops.html` | `demo.html` is client-facing (the sample report) so it must be migrated; `results.html` is dead | **M** |
| 10 | **Scraper result styling** | `js/ops-scraper.js` (12 hexes) | Internal-only, and the feature is dead (§4). Deprioritize | **S** |
| 11 | **`--accent` contrast** | `#e8352a` on `#0a0a0c` vs on white | Computed: **4.69:1 on the current dark bg (passes AA), 4.22:1 on white (fails AA 4.5:1 for body text)**. The accent survives the theme flip for fills and large text but not for body copy — needs a darker red in the text ramp while `#e8352a` stays for fills | **S** but **blocking** — decide the ramp before any migration |

**Sequencing recommendation:** settle item 11 (the accent ramp) and item 1 (canvas) first. Everything else is mechanical once the palette is decided; those two are design decisions that will otherwise force rework.

---

## 9. FERRETERÍA READINESS

### Current shipped question count vs. what v3 intended

| | Screens | Questions | Branching |
|---|---|---|---|
| **Shipped today** (`diagnostic.js:1-4`) | 7 (landing, info, Q2–Q5, hook) | **4** + a contact form | **None.** "No scoring. No branching. Collect, submit, show hook." |
| **v3 as evidenced by orphaned i18n** | — | **11** (`dx.q1`–`dx.q11`) | Per-industry branches: `dx.ind.construction.q2.c4`, `dx.ind.legal.q1.c3`, `dx.ind.medical.q2.c2`, … |

The i18n file still carries **342 lines** of v3 keys with **zero** references (§5). The gap is confirmed and it is large: the product shipped a generic 4-question form and abandoned a designed 11-question industry-branching instrument. **The `dx.ind.*` keys are the surviving specification of that design** — read them before deleting, because they are exactly the per-vertical question logic a ferretería set would need.

Two consequences for the vertical:

1. **No branching means no vertical.** A ferretería and a law firm answer literally the same four questions today. There is no mechanism to ask a hardware store about anything hardware-specific.
2. **The v3 industry list never included ferreterías either.** `dx.ind.*` covers construction, legal, medical, restaurant, hotel — reviving v3 verbatim would not solve this.

### Where the diagnostic clusters fall short

`js/scoring.js` / `ops-dashboard.js:calculateScores()` — 4 dimensions × 25:

| Cluster | Driven by | Fit for a ferretería |
|---|---|---|
| Customer Flow | `same_questions`, `followups`, `scheduling` | ⚠️ Partial. `same_questions` (price/stock queries on WhatsApp) is the #1 ferretería pain and *is* captured. `scheduling` is close to irrelevant |
| Operations Flow | `accounting`, `crm`, `pos`, `booking`, `paper` | ❌ Weak. `pos` is the only relevant tool. **No inventory-system option at all** |
| Information Flow | `accounting`, `crm`, `pos`, `excel` | ❌ Weak. Inventory accuracy is *the* information problem in a hardware store and is unrepresented |
| Growth Flow | website, team size, revenue | ⚠️ Neutral. Most Nicaraguan ferreterías have no website, so this scores near-zero for structural rather than diagnostic reasons |

The available answer options (`diagnostic.html:293-324`):

```
time sinks: same_questions | scheduling | followups | data_entry | invoicing | coordination | reports | other
tools:      whatsapp | excel | accounting | pos | crm | booking | paper | social
```

**Missing for hardware retail:** inventory/stock control, quoting (*cotizaciones*), customer credit accounts (*crédito* / *fiado*), supplier & purchase orders, price-list maintenance, delivery coordination. These are not edge cases — for a ferretería, inventory and cotizaciones *are* the business.

Telling detail: `diagnostic.js:335` hardcodes an **inventory** opportunity card —

```js
if (opportunities.length < 3) {
  opportunities.push({ tag: 'GESTIÓN DE INVENTARIO',
                       desc: 'Sin visibilidad en tiempo real de tu inventario' });
}
```

— but only as **filler** when fewer than three opportunities were derived. The single most relevant ferretería insight can only appear by accident, never because the prospect said so.

### Industry labels

`grep -rniE "ferreter|hardware"` across all HTML and JS (excluding `i18n.js`): **zero hits.** In `i18n.js`: **zero hits.**

The `diagnostic.html` dropdown has 22 options — `restaurant, medical, legal, hotel, retail, construction, logistics, accounting, realestate, education, agriculture, manufacturing, tech, consulting, ecommerce, insurance, pharma, energy, automotive, media, government, other`. A ferretería straddles **retail** ("Comercio / retail") and **construction** ("Construcción") and belongs cleanly to neither. `index.html`'s vertical showcase covers 8 industries (`ind.agro`, `ind.clinic`, `ind.construct`, `ind.hotel`, `ind.law`, `ind.mfg`, `ind.rest`, `ind.school`) — again no hardware, and no retail card at all.

### Recommendation

**Does the Retail cluster cover it? No — and ferreterías should get their own question set.**

Reasoning: the generic Retail path collects nothing about inventory, quoting, or credit, which are precisely the three pains a WhatsApp assistant would address. Running the current diagnostic on a ferretería produces a hook screen whose opportunity cards are generated from `same_questions`/`scheduling`/`paper` — a pitch that will not describe the prospect's actual day. Worse, the hook is the moment you ask for the meeting; generic output there is where the funnel leaks.

Concretely, for the demo sprint:

1. **Add `ferreteria` / "Ferretería y materiales de construcción"** as a first-class industry option in `diagnostic.html` and `i18n.js` (both languages). Cheap, and it lets you segment the leads you are about to generate.
2. **Extend the two option sets** with `inventory`, `quotes`, `credit`, `suppliers` (time sinks) and `inventory_system`, `quoting_tool` (tools). Additive — no branching machinery required, and it immediately makes Operations Flow and Information Flow meaningful for this vertical.
3. **Wire the inventory opportunity card to an actual answer** instead of using it as filler (`diagnostic.js:335`).
4. **Recover the v3 branching design from `dx.ind.*` before deleting those keys** (§5), and add a `dx.ind.ferreteria.*` branch if you decide to revive branching at all.
5. **Reconsider the WhatsApp number.** A `+1` California number (§4) is a poor fit for a campaign whose entire premise is WhatsApp-native trust with Nicaraguan hardware stores.

Point 2 is the highest value-per-hour item in this section: it is additive, needs no new architecture, and converts two dead scoring clusters into real signal for the exact vertical you are targeting.

---

## 10. PRIORITIZED PLAN

Severity: **S1** = fix before any traffic · **S2** = fix before outreach · **S3** = quality/debt · **S4** = optional
Effort: **S** < 2 h · **M** ½–2 days · **L** > 2 days

| # | Finding | Sev | Eff | Sprint |
|---|---|---|---|---|
| 1 | `/api/claude` open unauthenticated LLM relay on your Anthropic key (§E-1) | **S1** | S | **integrations** — do first, independent of everything |
| 2 | Ops auth accepts any non-empty string as `role: admin` (§6) | **S1** | M | **integrations** — must land *before* Supabase |
| 3 | `og:image` relative on all 8 pages → no WhatsApp/LinkedIn previews (§7.3) | **S1** | S | **integrations** — one-line fix, directly blocks outreach |
| 4 | Canonicals point at redirecting apex; `.html` vs cleanUrls mismatch (§7.1) | **S2** | S | **integrations** |
| 5 | No `robots.txt`, no `sitemap.xml` (§7.2) | **S2** | S | **integrations** |
| 6 | Contact form posts to `formspree.io/f/PLACEHOLDER_ID` — never captured a lead (§4) | **S2** | S | **integrations** |
| 7 | Supabase unconfigured → all data localStorage-only, dies with the browser profile (§4) | **S2** | L | **integrations** |
| 8 | `index.html` `TypeError` on every load; 4 dead stat counters (§3.1) | **S2** | S | **theme** (it is markup/JS in the file you are already rewriting) |
| 9 | Voice `no-speech` gives zero feedback (§3.4) | **S2** | S | **demo** |
| 10 | Ferretería: no industry option, no inventory/quotes/credit answers (§9) | **S2** | M | **demo** |
| 11 | Scraper bypasses `/api/claude`, needs a key with no UI to set it, still uses allorigins (§4) | **S2** | M | **integrations** |
| 12 | Canvas orbs are teal, contradict "No teal", break on white (§5, §8-1) | **S3** | L | **theme** |
| 13 | `ops.css` + `ops-light.css` stacked override, 3773 lines (§8-2) | **S3** | L | **theme** |
| 14 | Blurred hook cards depend on dark-on-dark (§8-3) | **S3** | M | **theme** |
| 15 | `--accent` `#e8352a` = 4.22:1 on white, below AA 4.5:1 (§8-11) | **S3** | S | **theme** — decide first, it gates the rest |
| 16 | `results.html` + `results.js` + `scoring.js` + `score-gauge.js` orphaned (§E-2) | **S3** | M | **later** — decide revive vs delete |
| 17 | Duplicated scoring in `scoring.js` and `ops-dashboard.js` (§3.3) | **S3** | S | **later** |
| 18 | Ops detail panel shows 5-dim and 4-dim scores together (§3.2) | **S3** | S | **later** |
| 19 | 342 dead `dx.*` i18n lines — **read before deleting** (§5, §9) | **S3** | M | **demo** (harvest) → **later** (delete) |
| 20 | Sub-48px tap targets; 3px `#calcHours` slider (§3.12) | **S3** | S | **theme** |
| 21 | WhatsApp CTA is a US `+1` number for a Nicaragua campaign (§4) | **S3** | S | **demo** — business decision |
| 22 | Voice `continuous:true` unreliable on Safari — **unverified** (§3.5) | **S3** | S | **demo** — test on a real iPhone first |
| 23 | `ops.html` `aria-selected` never updates (§3.6) | **S4** | S | **later** |
| 24 | jsPDF loaded from cdnjs *and* unpkg (§1) | **S4** | S | **later** |
| 25 | Onda-era strings in `sync.gs`; stale `.DS_Store`; unused `assets/favicon.svg` (§5) | **S4** | S | **later** |
| 26 | Apex→www is 307 not 301 (§7.4) | **S4** | S | **integrations** |
| 27 | No CSP / `frame-ancestors` (§6) | **S4** | S | **later** |

### What Prompts 2 and 3 must NOT touch

**Prompt 2 — theme sprint (dark → white editorial):**

- ❌ **`api/claude.js`** — do not touch. Fixing #1 is an integrations task; a theme PR must not change auth surface.
- ❌ **`js/ops-auth.js`** — #2 is security, not styling.
- ❌ **`js/diagnostic.js` flow logic** (`goTo`, `updateNav`, `validateInfo`, `submitIntake`, `restoreProgress`). The funnel is verified working end-to-end; style the hook screen's *markup and CSS*, do not refactor its state machine.
- ❌ **The `ignea_submissions` record shape** (`diagnostic.js:425-447`). `ops-dashboard.js:getLocalSubmissions()` maps every field; changing one silently breaks the CRM.
- ❌ **Do not delete `results.html`/`results.js`/`scoring.js` yet** — #16 is a product decision, not a theme cleanup. Leave them dark and dead.
- ❌ **Do not delete the `dx.*` i18n keys** — they are the only surviving record of the v3 design and the demo sprint needs to read them first (#19).
- ❌ **Do not add a build step, framework, or package manager.** Vanilla static is the architecture (`CLAUDE.md:5`).
- ⚠️ **Decide #15 (the accent ramp) before writing any CSS**, or the whole migration gets redone.

**Prompt 3 — demo sprint (WhatsApp assistant + ferreterías):**

- ❌ **Do not re-theme anything.** If the theme sprint has landed, build on it; if not, build dark. No palette work in this PR.
- ❌ **`api/claude.js`** — again off-limits. A live WhatsApp demo will be tempting to wire through it; **do not, until #1 is fixed**, or you are hanging a public demo off an unmetered relay on your own key.
- ❌ **`js/ops-*.js`** — the CRM is not part of the demo. Ferretería question changes touch `diagnostic.html`, `i18n.js`, and `scoring.js`/`ops-dashboard.js` *only* if you extend the clusters (and then **both** copies — #17).
- ❌ **Do not revive the 11-question v3 flow wholesale.** Harvest `dx.ind.*` for design intent; ship additive options (§9 item 2) rather than resurrecting the branching engine.
- ❌ **Do not migrate voice to `MediaRecorder`/Whisper** as part of this sprint. It is a real upgrade and a real project; #9 and #22 are the cheap correct fixes for now.
- ⚠️ **Verify #22 on a physical iPhone before designing any voice-first demo interaction.**

---

## AUDIT VERIFICATION TABLE

| § | Section | Verification method | Status |
|---|---|---|---|
| E-1 | Open `/api/claude` relay | `curl` POST to production, spoofed `Origin`, no auth → HTTP 200 + real completion. Source read | **Confident** |
| E-2 | `results.html` orphaned | Drove the full funnel in Chromium; `ignea_diagnostic_scores → null`; direct load redirects to `diagnostic.html`. Cross-checked all writers by grep | **Confident** |
| 1 | Inventory | `find`/`ls`/`wc -l` on every file; origin census by grep; storage keys by grep on all get/set/removeItem calls | **Confident** |
| 2 | What works — funnel | Playwright, 1440×900, full Q1→hook run; submission JSON dumped from `localStorage` | **Confident** |
| 2 | What works — voice states | Playwright with stubbed `SpeechRecognition`; idle/recording/result/done/denied/no-speech captured | **Confident** |
| 2 | What works — ops CRM/pricing | Playwright; auth bypassed via the discovered fallback; pipeline render, tab switching, calculator reactivity observed | **Confident** |
| 2 | Proposal / PDF export | jsPDF CDN ORB-blocked in sandbox (`typeof window.jspdf → "undefined"`). Buttons exist and are wired; no PDF produced | **UNVERIFIED** |
| 2 | Scraper happy path | Requires a live Anthropic key; deliberately not supplied. Only the no-key path exercised | **UNVERIFIED** |
| 2 | Deploy currency | `shasum` of production-served `index.html` + `js/ops-scraper.js` vs local `HEAD` → identical | **Confident** |
| 3.1 | `index.html` TypeError | Captured `pageerror` + stack; `grep -on 'id="s[0-9]"'` returns empty | **Confident** |
| 3.2 | Dual scoring models in ops | Both renderings read out of the live detail panel; source at `ops-leads.js:1281` | **Confident** |
| 3.4/3.5 | Voice defects | Driven state machine; `voice_unsupported` never rendered (`micCards: 0`) | **Confident** |
| 3.5 | Safari `continuous:true` behavior | No iOS device or Safari build available in this environment | **UNVERIFIED — flagged** |
| 3.12 | 375px layout | Playwright mobile emulation, all 8 pages; overflow + tap-target measurement; obstruction claim **retracted** after 5-offset hit-test | **Confident** |
| 4 | Placeholder greps | All four greps run verbatim, output pasted unedited | **Confident** |
| 4 | Scraper unreachable | Live click → error string captured; `grep -rni "ajustes\|settings"` → no such UI; allorigins request captured on the wire | **Confident** |
| 5 | Onda debris | `grep -rni "onda"` with per-hit judgment; false positives ("secondary") identified | **Confident** |
| 5 | Dead i18n keys | Static reference analysis. `dx.ind.*`/`dx.q*` = 0 references, **verified**. The 579 aggregate is an **upper bound** — dynamic `t(var)` call sites can't be seen statically | **Confident (subset) / bounded (aggregate)** |
| 5 | Missing spec files | Repo, all 84 commits, `~/Downloads ~/Documents ~/Desktop`, plus `find ~ -maxdepth 4` and a content grep. All negative | **Confident** |
| 6 | No committed secrets | Working-tree grep + `git grep` across all 84 commits; single hit classified as `sk-ant-` + 12 literal `x` without printing it | **Confident** |
| 6 | Ops auth bypass | Submitted the single character `x` → `token: authenticated`, `role: admin`. Source comments confirm intent | **Confident** |
| 6 | Key injection mechanisms | Read `api/claude.js`, `ops-ai.js:21`, `ops-scraper.js:122,163`. All values redacted | **Confident** |
| 7 | 404 status | `curl -sI` + `curl -s` on a known-bad path → genuine 404. **Original soft-404 hypothesis disproved and retracted** | **Confident** |
| 7 | Canonical/robots/sitemap/OG | `curl` per page for canonicals; `robots.txt`/`sitemap.xml` → 404 live and absent on disk; `og:image` relative on all 8 | **Confident** |
| 7 | Search Console setup | No verification tag or file in repo; DNS-TXT would be invisible from here | **UNVERIFIED — needs your account** |
| 8 | Light-theme map | Read `:root`; per-file hex census; read `grid-bg.js` orb RGB; confirmed `ops.html` loads both stylesheets. Effort estimates are **my judgment**, not measurements | **Confident (findings) / estimates are judgment** |
| 8 | `--accent` contrast | WCAG relative-luminance formula computed in Python: **4.22:1 on white, 4.69:1 on `#0a0a0c`**. (An earlier hand estimate of 3.9:1 was wrong and was corrected against the computation.) | **Confident** |
| 9 | Ferretería readiness | Read `scoring.js` clusters + both option sets from `diagnostic.html:293-324`; 22-option dropdown dumped from the live DOM; `grep -rniE "ferreter\|hardware"` → zero. v3 count from the orphaned key namespace | **Confident** |
| 10 | Prioritized plan | Derived from the findings above. Severity/effort/sprint assignment is **my judgment** | **Judgment** |

### Honest limitations

1. **No PDF/proposal verification** — external CDN blocked in the sandbox.
2. **No scraper happy path** — no API key supplied, by instruction.
3. **No Safari or iOS testing** — Chromium only. The `continuous:true` concern is theory-informed, not measured.
4. **No real-device testing** — 375px results are Chromium mobile emulation.
5. **The 579 orphaned-key figure is an upper bound.** Only the `dx.ind.*` / `dx.q*` subset (342 lines, 0 references) is fully verified.
6. **Effort estimates in §8 and §10 are judgment**, not measured against this codebase's history.
7. **Two hypotheses of mine were wrong and are retracted in place** rather than quietly dropped: the `vercel.json` soft-404 theory (§7) and the 375px `#fixedNextBtn` obstruction (§3.12). Both are documented with the evidence that disproved them.
