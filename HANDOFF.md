# SESSION HANDOFF — Ignea Labs

Written at the end of a session that completed the entire previous handoff's §2 plan, then merged it to production. Everything in §1 is **live on www.ignealabs.com**; §2 is four approved-but-unbuilt work items. Read §1 and §2 before doing anything. The previous handoff's content is superseded — its plan is done.

**Start next session with §2.1 (Nicaragua cost model). It is now live and wrong on production.**

**Since that was written:** §2.4 (Calendly -> Google Calendar + Formspree) is DONE and live —
see §1b. `frame-ancestors 'none'` is also live. §2.1 is now the only thing left in §2 that
touches customer-facing numbers.

---

## 1. WHERE THINGS STAND

### `fix/diagnostic-enter-and-keyboard` — MERGED to `main` and DEPLOYED (most recent work)

Two mobile defects on `/diagnostic`, both browser-verified before and after, then
**tested by Fede on a real phone against a public preview** before merge.

**The Enter bug — the severe one.** The Enter-to-advance handler in `js/diagnostic.js` was
scoped `currentScreen >= 2 && currentScreen <= 5` with **no target check and no
preventDefault**. Screens 2, 4 and 5 are open text, so a prospect pressing return to start a
second line got bounced forward mid-sentence and the answer was silently truncated.

**It was worse than that, and this is the part to remember: on screen 5, return SUBMITTED the
form.** Screen 5's `.btn-next` *is* the submit button (`intake.submit` → `submitIntake()`),
so `nextBtn.click()` fired the Formspree POST with the truncated text. Reproduced in a
browser on the pre-fix code: `active` went to `hookScreen` and the POST was caught by the
harness. The old handler did not just misroute an answer, it mailed one.

**Two more with the same root cause**, both found while fixing it. The voice `.mic-card`
(`tabindex=0`, Enter starts/stops recording) and the custom-select **trigger** (Enter
opens/closes the dropdown) each handle Enter themselves and **neither calls
`stopPropagation`** — so Enter on either also advanced, and on screen 5, submitted. The
select's *search* and *other* inputs were already safe; they do stop propagation.

**The fix** is `enterAdvances(el)`, a target check excluding `textarea`, `button`, `a`,
`select`, contenteditable, `.custom-select` and `.mic-card`. `preventDefault()` fires only on
the path that actually advances. Scope widened `2..5` → **`1..5`**, with screen 1 dispatching
to `#infoNextBtn`.

**No `e.isComposing` guard, deliberately.** Gboard keeps the current word in composition, so
guarding on it risks return doing nothing on the exact screen the change exists to unblock.
The audience is Spanish-language; IME candidate-selection-with-Enter is not a real conflict.

**The keyboard-occlusion bug.** Screen 1 is eight fields deep and **its inline `.q-nav` is
`display:none`** (`diagnostic.html` line ~91, all widths) — so the fixed `#qNavFixed` bar is
the *only* Next button, and it lives in the last 74px of the viewport, exactly where an
on-screen keyboard lands. `interactive-widget=resizes-content` was added to
`diagnostic.html`'s viewport meta (and to `contact.html` for consistency — see below).

Measured on screen 1 at 375px wide, assuming a 405px Gboard:

| | layout viewport | Next bar | Siguiente | in view |
|---|---|---|---|---|
| No keyboard | 375×740 | y 666–740 | 163×49 @ y679 | yes |
| **resizes-content** | 375×**335** | y **261–335** | 163×49 @ y274 | **yes** |
| default `resizes-visual` | 375×740 | y 666–740, keyboard covers 335–740 | — | **occluded** |

**The meta key changed no measured geometry in the harness, and that is expected** — headless
Chromium never raises a virtual keyboard, so there is no interactive widget for the key to act
on. The table above was produced by setting the layout viewport directly to the two sizes the
key chooses between. Don't re-run it expecting a before/after delta; there isn't one to find.

**iOS LIMITATION — do not forget this.** `interactive-widget` is Chrome 108+ / Firefox 132+.
**WebKit has not implemented it** (WebKit/standards-positions#65), so on an iPhone the key is
a no-op and **Enter-to-advance is the entire mitigation**. Any future claim that the keyboard
problem is "fixed" is Android-only unless someone re-checks WebKit.

**`contact.html` got the key too, with a correction on the record:** that page does **not**
share the fixed-bottom-bar pattern. Its submit button is inline in the form flow and its only
`position:fixed` element is the 52px `.wa-float`. The key is near a no-op there; its one
visible effect is the float riding above the keyboard rather than behind it.

**Verified.** Ten behavior checks pass (screen-1 Enter advances; textarea Enter newlines and
does not advance on 2/4/5; screen-5 textarea and revenue-select Enter do not submit; mic-card
Enter does not advance) — all ten failed before the fix. Formspree path not regressed: full
funnel driven with the endpoint intercepted and stubbed 200, still `POST
https://formspree.io/f/xrenwoeo` carrying the company field and both open-text answers,
landing on `hookScreen`. Zero console errors and zero horizontal overflow at 375/768/1440.

**How the preview got onto Fede's phone, because the SSO wall makes this recur.** Preview
URLs are behind Vercel Authentication and he would not log into Vercel on his phone. The
route that worked, without touching `ignea-labs-w8bp`'s protection settings: **on Hobby,
Standard Protection covers previews but production domains stay public**, so the branch was
deployed as the *production* deployment of a throwaway project (`ignea-kbtest`,
`https://ignea-kbtest.vercel.app`) — public, no login, any network. Built from `git archive`
of the branch (tracked files only, so `.env.local` cannot leak), with `api/`, `supabase/`,
`scripts/`, `data/`, `ops.html` and the v4 prototypes stripped, plus `X-Robots-Tag: noindex,
nofollow, noarchive` and a `Disallow: /` robots.txt. **Delete it when done:
`vercel project rm ignea-kbtest`.** The per-deployment alternative, Deployment Protection
Exceptions, is a $150/month Pro add-on.

### `feat/hero-cta-ticker-nav-ghost` — MERGED to `main` and DEPLOYED to production

Fast-forward merge (zero conflicts), `main` = `1a4c87b`, deployed via `vercel --prod --yes`.

| Commit | What |
|---|---|
| `0f87109` | Hero CTA group + capability ticker + ghost nav CTA |
| `a2c27a1` | Industry-tab "ROI típico" column removed (Group 2) |
| `7090c49` | WhatsApp assistant demo on homepage (Phase B) + Supabase guard |
| `411e5ae` | Demo pacing tightened, ROI footnote rewritten, demo chrome i18n'd |

### Post-merge production verification (all passed on www.ignealabs.com)

- Served files **byte-identical to local `main`** — `index.html`, `shared.css`, `wa-demo.js`, `i18n.js`, `ticker-nudge.js`, `supabase-config.js`.
- All 7 pages: HTTP 200, **console clean**, no horizontal overflow at 375/768/1440, nav ghost confirmed on every one.
- Homepage body `rgb(255,255,255)`; exactly **1** filled-red element in the hero; 1 primary + 2 links + 3 SVG arrows.
- `#demo` autoplays once on scroll-in, **23.8s**, all four panels render (8 chat msgs / 10 rail steps / 4 ops cards / 3 proforma rows, total C$ 17,997.50). Tabs switch cleanly — one selected, one day divider each. Demo CTA → `diagnostic`.
- Ticker: 6 cards, rail 2200/1440 so it still bleeds, manual scroll works, nudge lands at 120.
- 375px: float hides over `#demo` and returns; demo renders fully; no overflow.
- EN toggle: chrome switches, conversation stays Spanish, `.ig__esnote` shows.
- Footnote live on `/demo` and `/results`; zero hits for the old "2-3x mayor" copy.
- SEO intact: `robots.txt` 200, `sitemap.xml` 200 with 5 locs each resolving **200 in 0 redirects**, canonical matches landed URL on all 5 pages, apex→www still a single hop.
- **Full diagnostic funnel driven end to end on production**: landing → info → 4 question screens → hook screen. Submission record written, correct company/industry/hours, zero console errors, no failed requests.

**Nothing behaved differently on production than in local verification.** Note that the *preview* could never be browser-verified — preview URLs sit behind Vercel's SSO wall — so all pre-merge browser testing ran against `localhost:8899` serving the same commit. The only production-only network call is `plausible.io` analytics, which is a pre-existing `<script>` tag from commit `dc493bd`, unrelated to this work.

### `feat/formspree-google-calendar` — MERGED and DEPLOYED (`73310c9`), plus `ee446cf`

- **Formspree live** at `f/xrenwoeo`. reCAPTCHA had to be disabled in the Formspree
  dashboard — it returns `403 {"error":"In order to submit via AJAX..."}` while enabled.
  Formshield ML filtering stays on. **Free tier: 50 submissions/month, 2 spent on tests.**
  No autoresponse exists, so the on-page state is the entire receipt; success and error
  states both carry a WhatsApp exit.
- **Calendly fully gone from code** (0 hits across all served html/js/css/json). Booking is
  `https://calendar.app.google/E4dfYkm8epTzdsiT7` at all five sites: contact, demo, results,
  the diagnostic hook, and the PDF.
- **contact.html is single-column**, 640px, both channels at equal weight. This removed the
  last third-party embed on the site, which is what made `ee446cf` possible.
- **`ee446cf`** adds `Content-Security-Policy: frame-ancestors 'none'` to `vercel.json`.
  The `X-Frame-Options` removal in `ccf4c28` was a misdiagnosis — that header governs whether
  *our* pages may be framed, not iframes we embed, and Calendly sent `ALLOWALL` anyway.
- **wa.me prefills fixed** — 4 context-appropriate messages replacing the single
  "completé el diagnóstico" that was claiming a completed diagnostic on the homepage float
  and thesis. The runtime score-injecting link in `results.js` was deliberately left alone.
- **Booking page language:** cannot be forced to Spanish. `?hl=es` returns `lang="en-US"`
  unchanged; the page follows the organiser's Google account language. Microcopy warns before
  the click. **Open question for Fede:** the booking window renders 7:00am-2:30pm Managua,
  which is exactly 9:00am-5:00pm Eastern — strong evidence the availability block was authored
  in Eastern hours. The page is pinned to Managua and does not convert for the viewer
  (verified across three forced browser timezones). Fede is checking it in Google Calendar.

### `feat/labor-cost-and-components` — MERGED into `main` (stale header, corrected)

This section previously said "IN PROGRESS, not merged." **That was wrong as of this
session's branch audit** — `git merge-base --is-ancestor` confirms both `dfb0d52` and
`fb3b0ee` are ancestors of current `main` (`7928e4e`). The branch ref (local and on origin)
is a stale pointer to already-absorbed work; see the branch audit near the end of this
document. **`dfb0d52` closes §2.1.** `js/labor-cost.js` is now the only hourly-rate
source on the site; `counter` is derived in code from the published figures (recomputes to
$2.09/hr, $434.36/month), and `supervisor`/`professional` are labelled in-file as judgment
estimates. All five disagreeing consumers were migrated — `TEAM_HOURLY`,
`getHourlyCostByTeamSize`, `getHourlyCost`, `demo.html`'s hardcoded 20 — and `ops-ai.js` no
longer contains a rate literal at all: the real rate is injected as `RATE_USD_PER_HOUR` with an
instruction not to substitute one, which removes the 10x contradiction between the site and the
proposals it generated.

Two things surfaced doing it. `demo.html` carried more old-rate arithmetic than the audit found —
`totalMonthlyCost: 2540`, `annualCost: 30480`, and four painpoint costs summing to exactly 2540,
all built from the $20 rate; those are now derived so the breakdown moves with the rate, and the
sample report drops from **$3,528/mo to $157/mo**. And a load-order bug was introduced and fixed:
`demo.html` evaluates its sample data inline near the top of `<head>`, so the script tag has to
precede it or the page throws and bounces to the diagnostic redirect.

**`fb3b0ee` adds the industry-panel copy**, additive only and not yet referenced by any markup:
the Ferretería trio plus nine `ind.*.out` output lines in both languages. Every timing from the
reference file was dropped — the demo demonstrates artifacts, not latency, and its 23.7s runtime
is animation pacing. Sample identifiers were left out too, since the panel has no "datos de
ejemplo" label. **The component port (A–D) was started and deliberately reverted**: the new
`.itabs`/`.ipanel` markup was in place before its CSS and JS existed, which left the page broken,
and the remaining work did not fit the session. `index.html` is back at HEAD and re-verified.

### What shipped, and the non-obvious decisions inside it

**Hero CTA + ticker.** Ported from `ignea-hero-cta-redesign.html` (now deleted). Two deliberate deviations from the reference:

- **`scroll-snap` was dropped from the rail.** Proximity snapping fires on load, jumps past the leading spacer, and flushes card 1 against the viewport edge — defeating the spacer's only purpose. **The reference file has this bug too** (measured: it rests at 188px with card 1 at x=0 while its own hero sits at 172). Without snap the rail rests at 0 and card 1 aligns with the hero text edge at every width 375→2560.
- Container math retargeted from the reference's 1160px/32px to this site's real hero box (960px/40px, 20px under 768px), with the leading spacer's flex gap cancelled via `margin-right:-16px` so alignment is exact rather than 16px off.
- The rail bleeds off the right edge at **every** width including 2560 — 6 cards never fit, so the fade is never an artifact.
- Ticker has a one-shot scroll nudge (`js/ticker-nudge.js`), 120px desktop / 64px below 768px. **§2.3 deletes this entirely** — do not invest in it.

**Nav CTA → ghost** on all 7 pages. While doing it, found and fixed a pre-existing bug: `.btn-nav` was declared *before* the button block in `shared.css`, so `.btn-ghost`'s padding beat it on equal specificity — the nav button was 48px on `index` (which had an `!important` patch) and 56px everywhere else. Same root cause existed under `.btn-primary`. Now 48px on all 7.

**Industry tabs.** ROI column gone; grid is now `1fr 1fr` (problem / what we build). Both columns carry real copy, nothing went empty. 18 i18n keys removed.

**WhatsApp demo (`#demo`, homepage, between industry tabs and calculator).** Ported from `ignea-wa-demo-v2.html` (now deleted). CSS in `shared.css`; the source's `:root` was dropped after verifying its Ignea tokens were byte-identical to ours value by value. The `--wa-*` chrome colors are genuinely new and live in `:root` marked as **not** Ignea tokens. Engine in `js/wa-demo.js`, unchanged below the ENGINE banner; the three scenarios stay isolated in the `S` config object.

- **ES-only for conversations, i18n'd chrome.** Title, intro, tab labels, column captions, chips, replay, note and CTA all switch language. Conversations stay Spanish; EN readers get one explanatory line (`.ig__esnote`, shown only on `html[lang="en"]`). In-device strings ("en línea", "Escribe un mensaje", the ops counter) stay Spanish deliberately — they are part of the rendered WhatsApp UI, not our chrome.
- **Run time 23.7s** (was 31.0s; clínica 16.1s, hotel 16.6s). The cut landed on the typing indicator specifically — 5 assistant replies were each parked on the 2400ms cap, putting 12 of 31 seconds into three animated dots.
- **The site's WhatsApp float hides while `#demo` is on screen** and returns after. At 375px it was landing directly under the demo phone's own green send button, reading as part of the mockup. Chosen over dropping it (loses a conversion path on 4 other pages) or moving it (relocates the collision into the ticker and calculator).
- Verified: 30 rapid tab switches + 8 mid-run replays leave exactly one scenario, one day divider, zero orphaned typing bubbles. `prefers-reduced-motion` renders the full transcript statically. Lighthouse desktop unchanged (perf 86, CLS 0, TBT 0); accessibility 84 → 87.

**Supabase placeholder guarded.** `js/supabase-config.js` still holds the literal `YOUR_PROJECT_ID`, so every load of demo/results/contact/diagnostic fired a request to a hostname that cannot resolve. Queries now short-circuit to the same `{data,error}` shape a failed request produced. **The client object is deliberately preserved** — `js/diagnostic.js:453` dereferences `.client` after checking only that `IgneaSupabase` is defined, so nulling it would throw. Verified with a positive control: with real values substituted it still fetches, so the guard is not dead code.

**Also fixed:** `.btn-primary` / `.btn-ghost` had no `:focus-visible` rule and fell back to the UA's 1px blue ring, invisible on the red fill.

**ROI footnote rewritten** (`res.roi.footnote`, both languages, renders on `demo.html` + `results.html`). The old copy claimed "el impacto real suele ser 2-3x mayor" — a multiplier that could only have come from client results we don't have. Now describes what the estimate counts instead of asserting an outcome.

---

## 2. APPROVED, NOT BUILT — the next session's work, in order

All four were proposed in detail and approved. §1 first, §2 after it, §3 and §4 independent.

### §2.1 — Nicaragua cost model (approved, DO THIS FIRST — it is live and wrong)

**This is now shipping to real visitors.** Every figure below is on production today. That is what makes it the first item rather than merely the next one.

**The headline finding: five sources compute labor cost and they all disagree.**

| Where | Keyed on | Values | vs real $2.10 |
|---|---|---|---|
| `index.html:745` `TEAM_HOURLY` | employees | $3 / $5 / $7 / $10 | 1.4x – 4.8x |
| `js/results.js:210` `getHourlyCostByTeamSize` | team-size idx | $12 / $18 / $25 / $35 | 5.7x – 16.7x |
| `js/ops-calculator.js:16` `getHourlyCost` | revenue idx | $12 / 15 / 22 / 30 / 40 / 55 / 75 | 5.7x – **35.7x** |
| `demo.html:56` | hardcoded | $20 | 9.5x |
| `js/ops-ai.js:116,185` prompt text | literal in prompt | "$3-4/hr" | 1.4x – 1.9x |

**The damaging one:** `ops-ai.js` instructs Claude to compute savings at **$3–4/hr** while `ops-calculator.js` feeds it numbers built on up to **$75/hr**. A prospect who reads the site and then the generated proposal sees a **10x contradiction in our own documents.** `js/scoring.js` has no labor cost in it at all.

**Verified Nicaraguan figures (2026).** Do not re-derive; these were checked against two independent sources:

- INSS patronal **21.50%** for employers with <50 workers (IVM 12.50 + Riesgos Profesionales 1.50 + Víctimas de Guerra 1.50 + Enfermedad/Maternidad 6.00); **22.50%** at ≥50 workers. INATEC **2.00%** for both.
- Load multiplier = 21.50 + 2.00 + aguinaldo 8.33 + vacaciones 8.33 = **40.16% → 1.4016x**
- `C$11,350.08 × 1.4016 = C$15,908 ÷ 36.6243 = $434.36/mo ÷ 208 h = $2.09/hour`
- Minimum wage C$11,350.08/mo (MITRAB, effective March 2026); FX 36.6243 fixed for all of 2026 (BCN, 0% crawl); 208 h/month = 48-hour legal week.
- **Caveat on the record:** neither source addressed whether aguinaldo/vacaciones themselves attract INSS. Modelled as not attracting it. If vacaciones does, true figure ≈ $2.13/hr. At ≥50 employees, ≈ $2.11/hr. Both inside rounding — use one table, do not branch on headcount.

**Approved implementation.** New `js/labor-cost.js` as the single source; everything reads from it:

```js
IgneaLaborCost = {
  FX_BCN_2026: 36.6243,        // BCN official, fixed, 0% crawl
  MIN_WAGE_COMERCIO: 11350.08, // C$/mo, MITRAB, effective March 2026
  LOAD: 1.4016,                // INSS 21.5 + INATEC 2 + aguinaldo 8.33 + vacaciones 8.33
  HOURS_PER_MONTH: 208,        // 48-h legal week
  bands: { counter: 2.10, supervisor: 3.10, professional: 4.75 }
}
```

- `counter` **$2.10** — derived from published figures above.
- `supervisor` **$3.10**, `professional` **$4.75** — **must be labeled in the code as judgment estimates, not derived.** No Nicaraguan wage survey backs them. Explicit instruction: **do not go hunting for one**; if one surfaces later, adjust then.
- Migration mapping: homepage employee counts → bands (3→counter, 8→counter, 25→supervisor, 75→professional). `results.js` and `ops-calculator.js` drop their tables and call the accessor. `demo.html`'s hardcoded 20 → `counter`. `ops-ai.js` gets the number **injected**, not written into prompt text as a literal.
- Keep everything in USD. Add: *"Cifras en USD al tipo de cambio oficial BCN (C$36.6243)."*

**Expect the visible numbers to fall ~10x.** `demo.html` currently shows $3,528/mo savings built on the hardcoded $20/hr. That is the whole reason §2.2 exists.

### §2.2 — Value model rebalance (shape approved, its own sprint, sequenced AFTER §2.1)

With honest wages, 20 recovered hours/week at $2.10 is **$182/month** — which does not justify a $1,500–8,000 engagement. The current pitch only worked because the wage was inflated 10x.

Approved shape — **revenue capture primary, labor savings secondary**:

| Line | Basis | Source of the number |
|---|---|---|
| 1. After-hours orders lost | their avg ticket × their estimate of after-hours enquiries | **prospect input** |
| 2. Quotes never followed up | their quotes/month × their estimate going cold | **prospect input** |
| 3. Quoting errors against margin | their avg ticket × their error frequency | **prospect input** |
| 4. Hours recovered | hours × `counter` rate | **we compute** — the only line we assert |

Lines 1–3 must be framed as *"you told us"*, never *"we estimate"*. Output reads as a mirror, not a claim. **No conversion rates, no industry benchmarks, no multipliers** — that is what keeps it inside the standing rule below. `ops-ai.js` prompts change to: rank revenue lines first, use only prospect-supplied figures, state explicitly when a number is theirs, and say "not enough information" rather than fill a gap.

Requires new calculator and diagnostic inputs (avg ticket, enquiry volume, quotes/month). **Do not fold this into §2.1.**

### §2.3 — Ticker auto-scroll (approved in full)

Continuous, slow, right-to-left ambient motion. Pause on `:hover` and `focus-within`. Keep manual scroll/swipe. **Delete the one-time nudge and `js/ticker-nudge.js` entirely** — redundant once this exists.

- **Drive `scrollLeft` with `requestAnimationFrame` (~22 px/s) over a duplicated card set**, resetting at one set-width for a seamless loop. Do *not* animate a CSS `transform` — it fights native swipe and kills the manual scroll.
- **Drop the leading spacer; rail goes full-bleed.** Approved. A seamless loop and a once-only spacer are geometrically incompatible, and once the rail never stops there is no resting position to align. The section *label* stays aligned with the hero.
- **Mask both edges** rather than the current single right-edge fade — with continuous motion a hard left edge reads as a clipping bug. (This is what the old `.sec-marquee` did.)
- `prefers-reduced-motion`: no rAF at all, static scrollable rail, single card set.
- Page-level overflow is structurally impossible (cards sit inside `overflow-x:auto` on the rail under `.ticker{overflow:hidden}`), but re-verify 375→2560 anyway.

### §2.4 — Calendly → two-channel contact (approved in shape, BLOCKED)

**BLOCKER: the Google Calendar booking link was never pasted.** The message said `[PASTE YOUR GOOGLE CALENDAR BOOKING LINK]` and the URL did not arrive. **Do not guess or invent a booking URL.** Ask for it first.

Confirmed live post-merge: the diagnostic hook screen's CTA still reads *"Agendar mi llamada estratégica →"* and points at `https://calendly.com/ignealabs/30min`. That is the primary funnel exit, and it is the highest-value of the five replacements below.

Rationale: Calendly assumes a US B2B booking habit. A ferretero in León will WhatsApp; he will not open a scheduling page. Larger prospects do expect a booking link. Both channels stay, chosen by page context, never three competing contact CTAs in one viewport.

**Full inventory — live user-facing (5):**

| Location | Form | Context |
|---|---|---|
| `contact.html:129-132` | **embedded iframe** + `assets.calendly.com/widget.js` | right half of hero split; carries `background_color=ffffff&text_color=0a0a0c&primary_color=e8352a` (re-themed during Phase A) |
| `demo.html:388` | `<a id="ctaCalendly">` | sample-report CTA |
| `results.html:320` | `<a id="ctaCalendly">` | real-report CTA |
| `js/diagnostic.js:373` | injected `<a class="btn-primary hook-cta">` | post-diagnostic hook — **the primary funnel exit** |
| `js/results.js:859` | `doc.text('calendly.com/ignealabs/30min', …)` | printed into the **generated PDF** |

**Supporting (4):** `js/results.js:470,486` (`ctaCalendly` lookup + `results_cta_calendly` analytics event), `js/i18n.js:649,1779` (`res.cta.calendly`, both languages), `css/shared.css` `.calendly-section`, plus `// ---- CONTACT: CALENDLY ----` comment blocks.
**Docs only (5):** `AUDIT_REPORT.md`, `QA_REPORT.md`, `LAUNCH_BLOCKERS.md`, `LAUNCH_CHECKLIST.md`, `README.md`.

**Layout: `contact.html` is the only real change — approved to go single-column and centred.** Its hero is `grid-template-columns:1fr 1fr` with a 1000px-tall widget filling the right column against a `border-left`. Replace the iframe with a link and the right column collapses beside a 1000px-tall left column. Delete `.ct-split`, `.ct-right`, and the `.calendly-inline-widget` height rules; the left column's content stands alone and gains a booking button plus a WhatsApp button. The other four are inline links — no layout impact.

**Channel by context:** homepage (incl. `#demo`), `demo.html`, `results.html`, diagnostic hook → **WhatsApp primary**, booking secondary. `contact.html` → **both plainly, equal weight**, email below. Generated PDF → booking link only (a `wa.me` URL is useless in print).

**The `wa.me` prefill bug is real and approved for fixing regardless of the booking link.** All 8 existing links use one message — *"Hola, completé el diagnóstico en ignealabs.com…"* — including the homepage float and `thesis.html`, where nobody completed anything. Approved per-context messages:

| Origin | Message |
|---|---|
| Homepage float / thesis | `Hola, vi el sitio de Ignea Labs y quiero saber más.` |
| `#demo` section | `Hola, vi la demo del asistente de WhatsApp y quiero uno para mi negocio.` |
| Post-diagnostic / results | keep existing "completé el diagnóstico" wording — accurate there |
| Contact page | `Hola, quiero hablar con Ignea Labs.` |

Verify accents encode (`completé` → `complet%C3%A9`, `más` → `m%C3%A1s`) and each opens a real chat with **+505 8942 3985**.

**Formspree:** currently posts to a placeholder ID and always shows the error branch — a *visible* failure, which is the accepted state. Re-confirm it still fails visibly after the contact-page restructure; the restructure must not swallow the error branch.

**Follow-up item, tracked separately:** `X-Frame-Options` was deliberately removed in commit `ccf4c28` so the Calendly iframe would load. Removing the last third-party embed makes restoring that header possible. **The user wants this as its own item, not folded into §2.4.**

---

## 2b. V4 LANDING PROTOTYPE — local trial done, VIABLE

`ignea-landing-v4.html` (now in the repo, was in ~/Downloads). Trial page built at
`index-v4-test.html`, untracked, `index.html` untouched. Served at
`localhost:8899/index-v4-test.html`.

**position:sticky SURVIVES in our real DOM — this was the make-or-break and it passes.**
The stage pins at `top:0` and holds through 2,400px of scroll. Do not re-derive this from
the CSS; it is counter-intuitive. `body{overflow-x:hidden}` (shared.css:58) DOES force
`overflow-y` to compute to `auto`, which normally breaks sticky — it does not here because
body's scrollHeight equals its clientHeight (both 7510px), so body never becomes a real
scrollport and sticky resolves against the viewport. A control run with
`body{overflow-x:visible}` forced gave identical results.

**Trap for whoever tests this next:** `html{scroll-behavior:smooth}` (shared.css:57) makes
`window.scrollTo` animate, so any measurement taken immediately after a scroll reads a
mid-animation position. My first test reported sticky FAILING because of this and the
verdict was wrong. Disable smooth scrolling before measuring; the tell is `window.scrollY`
returning 0 right after a 500px scroll.

**Standing caveat:** sticky works today by a margin that depends on body never gaining its
own scrollbar. If we commit to the pinned story, remove `body{overflow-x:hidden}` and fix
horizontal overflow at source instead — otherwise a future change breaks the story silently.

Other measured findings: nav is `position:sticky; top:0; z-index:100; height 85px`, so the
stage needs `top:85px` / `height:calc(100svh - 85px)`. Frame time during pinned scroll was
**16.7ms median, 16.9ms max** — identical to baseline, no jank from adding a per-frame rAF
loop alongside the existing observers (caveat: the ticker and wa-demo observers had not
fired yet at that scroll depth, so re-measure with all of them live). `100svh` and `100dvh`
both supported; the `*` reset does not interfere. Exactly two class collisions — `.hero`
and `.in`, namespaced to `.v4-*`. The prototype's `:root` is otherwise a verbatim copy of
ours and needs only two tokens we lack: `--shadow-3` and `--out`.

**The real cost is not technical.** The prototype needs ~30-40 new i18n keys x2 languages
(act narration, inventory rail, proforma labels, bridge copy) — none exist — and it replaces
the rotating-word hero we have iterated on repeatedly. Decide whether the pinned story earns
that before paying for it. The trial page also throws two console errors from the
prototype's own script reaching for the nav I stripped when swapping in the real one; those
are assembly artifacts, not design problems, so judge layout and pinning, not interactions.

## 2c. /PROBALO GUIDED DEMO — steps 1-6 done on `feat/probalo-data`, pushed, preview deployed

**Branch pushed to origin, commit `b1eb8de`.** Preview:
`https://ignea-labs-w8bp-invct35sg-fedebaltoinvest-7282s-projects.vercel.app` —
**not merged, stopped deliberately for review.** `probalo.html` and `ignea-landing-v4.html`
are now IN the repo (both were in ~/Downloads).

**Correction to a stale note below:** §3's standing rule claims "Preview URLs sit behind
Vercel's SSO wall for static content but not `/api/*`." **That is no longer true for this
project — re-verified directly, don't trust the old claim.** `curl`ing this preview's
`/api/tryit` returns `401 {"protection":{"vercel_auth_enabled":true,...}}`, same as the
static pages. The whole deployment is SSO-walled, no `VERCEL_AUTOMATION_BYPASS_SECRET` is
configured. Whoever reviews this preview needs to open it in a browser logged into the
`fedebaltoinvest-7282s-projects` Vercel team to get past the wall.

**probalo.html is now wired to the real data files — no longer two things that happened to
agree by construction.** The embedded `TREE`/`CAT` objects are gone; the page fetches
`/data/tryit-tree.json` and `/data/ferreteria-catalog.json` at boot, builds
`IgneaTryItResolver.make(catalog)`, and both the deterministic chip path and the
`fallback()` responder read through it. `askServer()` was already a real `fetch()` to
`/api/tryit`, not a stub — only the doc comment calling it "stubbed" was stale.

**Architecture decision (settled, do not re-open): option A.** The prototype's TREE replies
were JavaScript functions doing real arithmetic, so they could not be JSON at all. They are
now templates with a deliberately small placeholder vocabulary, resolved by
`js/tryit-resolver.js`. The property that decided it: the whitelist of named calculations is
simultaneously what makes JSON extraction possible AND what makes the eval walker able to
recompute and assert — one mechanism, both jobs.

**`data/ferreteria-catalog.json`** — 44 SKUs, 9 categories. Fede's original 12 keep their
prices, `source:"fede-estimate"`, still UNVERIFIED until a ferretero in Leon confirms them.
The other 32 have real names/units/categories/codes but **`p:null`, `source:"TODO"`** — those
were never estimated by anyone. **Do not fill them in by guessing.** The reason is not
squeamishness: the eval asserts replies against this file, so invented prices would be
validated against themselves and pass at 100%. Cordobas deliberately; the site calculator
stays USD because engagement pricing is USD.

**`data/tryit-tree.json`** — 19 nodes, 4 entry points, verified: no dangling chips, no
unreachable nodes, no dead ends. No price literal in any copy string. Scenario quantities
that ARE legitimately literal (40 m2, 14 bolsas, proforma numbers) are declared per-node in
`allowDigits`, so the bare-digit walker can distinguish a scripted quantity from a leaked
price instead of guessing. Widen that list only deliberately.

**`js/tryit-resolver.js`** — `price()` is the single chokepoint for reading a price, so a
null-priced SKU cannot reach a prospect: `PriceUnavailable` throws on localhost and returns
null in production so the engine drops the chip rather than rendering a broken quote.
Verified: all 19 nodes render, arithmetic matches the prototype exactly (PRO-1043 totals
C$23,756.70 both ways), and the guard fires on a TODO SKU.

**Step 4 — done.** `scripts/tryit-walker.js` (Node, CommonJS, `node scripts/tryit-walker.js`).
**19/19 nodes PASS, BUILD OK.** Asserts, per node: (1) every `{{calc ...}}` figure is
recomputed by a SECOND, independent implementation of the whitelist — not a call into
`js/tryit-resolver.js`'s own `CALC` map, so a wrong formula there can't validate itself
against its own bug (this is literally what that file's CALC comment asks for); (2) every
chip id resolves to a real node; (3) every node reachable from the 4 entries (BFS); (4) no
dead ends — `fin` is the sole node with empty chips, and it alone carries `closes:true`;
(5) the bare-digit guard — every digit in a node's STATIC template text (outside `{{...}}`
spans) must be declared in that node's `allowDigits`, proving it's a scripted quantity, not
a leaked price literal. Verified the checks are real, not vacuous, with three positive
controls (stray digit, dangling chip id, a deliberately wrong `bolsasLosa` formula planted in
the resolver) — all three caught, all three reverted; `git status` clean afterward.

**Step 5 — done.** `api/tryit.js`, modeled on the existing `api/claude.js` pattern
(same origin-allowlist/rate-limit/`safeEqual` shapes, so the two routes read the same way).
Contract from `probalo.html`'s `askServer()` comment, all satisfied:

- Origin allowlist from `ALLOWED_ORIGINS`, fails closed to the two production hosts (403)
  when unset — same `loadAllowedOrigins()` as `api/claude.js`.
- Per-IP rate limit (429, 20/60s) + a **session turn cap** (429, 8 — matches
  `CFG.MAX_TURNS`) enforced server-side via in-memory maps; the client's own counter was
  never trusted for either.
- 400-char message cap enforced server-side (400) — the client's `maxlength` was never
  trusted either.
- Model (`llama-3.1-8b-instant`), `max_tokens` (220), `temperature` (0.4) pinned in the
  route. The client sends only `{message, sessionId}`; nothing else is read off the body,
  so there's no system-prompt/model override surface to close.
- System prompt is built server-side, once, at module load, from `data/ferreteria-
  catalog.json` — only the 12 **priced** SKUs are injected (the 32 `source:"TODO"` items
  are never mentioned), so the model has nothing to invent a price for. Same principle as
  `js/labor-cost.js`'s rate injection.
- `GROQ_API_KEY` read from `process.env` only, added to `.env.example` (name only, no
  value). **Not yet set in Vercel — Fede sets it, per standing rule never ask for the value.**
- Daily token ceiling: **40,000 tokens/day**, hardcoded, well inside the verified 500K TPD
  free-tier budget for `llama-3.1-8b-instant` (`console.groq.com/docs/rate-limits`,
  checked directly, not trusted from a prior handoff's numbers — see the resolved 70-80%
  question above). Deliberately not sized to an assumed call volume, since that volume is
  unproven; see above.
- Any failure path — budget spent, missing key, Groq non-2xx, malformed reply, thrown
  exception/timeout (8s `AbortSignal.timeout`) — returns HTTP 200 `{degraded:true}`, never a
  broken state. 403/429/400 are ordinary HTTP statuses, visible in Vercel's own metrics, and
  are deliberately NOT counted below — the counter exists for the failure mode that is
  otherwise invisible.
- **Non-user-facing failure counter**: in-memory `degradedCount`, incremented only on the
  `{degraded:true}` paths. Read via `GET /api/tryit` gated by the existing
  `IGNEA_OPS_TOKEN` header (reuses the secret already in Vercel rather than adding a new
  one) — returns `{degradedCount, dayKey, dayTokens, dailyTokenCeiling, sessionsTracked,
  ipsTracked}`. No `console.log` anywhere in the route.

Verified with a mock req/res harness (not deployed — no preview for this branch, see
above): wrong method → 405; missing/wrong origin → 403; missing `sessionId` → 400;
message > 400 chars → 400; no `GROQ_API_KEY` (true locally) → 200 `{degraded:true}`;
25 rapid requests from one IP → 429; 10 requests on one `sessionId` → 429; `GET` without
`IGNEA_OPS_TOKEN` configured → 500; `GET` with the wrong token → 401; `GET` with the right
token → 200 showing `degradedCount` correctly incremented. **Not yet tested against the
real Groq endpoint** — no `GROQ_API_KEY` was available in this session (never asked for
one, per standing rule). First live test needs a real key in `.env.local` or Vercel Preview.

**Step 6 next** — style `probalo.html` onto `shared.css` tokens, AND (unstarted, noted
above) actually wire the page's inline `TREE`/`CAT`/`askServer()` to
`data/tryit-tree.json` / `data/ferreteria-catalog.json` / `js/tryit-resolver.js` /
`api/tryit.js` — right now the validated data files and the live page are two separate
things that happen to agree by construction, not by reference.

### Voice rewrite — "sound like a person at the counter" (this session)

All 19 nodes plus a new 20th rewritten into Nicaraguan ferretería-counter register:
short bubbles (2-3 per node, most under 15 words), reactive openers trimmed to about
half the nodes and varied (no repeated filler), banned corporate-Spanish phrases,
`ocupa`/`le mando`/`a cómo` register throughout. `node.say` changed from a single
template string to an **array of 1-3 bubble templates**, one per chat message — this
is the actual mechanism behind the rhythm, not just wording. `js/tryit-resolver.js`'s
`renderNode()` now returns an array (or `null`, unchanged contract otherwise);
`scripts/tryit-walker.js` updated to check every bubble in the array, not one string.

**Two real bugs caught in review, both fixed at the source:**

1. **Grammar: "dentro de el casco urbano" instead of "dentro del..."** —
   `catalog.terms.flete.cobertura` stored the leading article ("el casco urbano de
   León"), and two templates composed it as `"dentro de {{cobertura}}"`. Fixed by
   dropping the article from the catalog value (`cobertura` is now the bare noun
   phrase "casco urbano de León") and requiring `"dentro del {{cobertura}}"` at every
   call site — including the Groq system prompt in `api/tryit.js`, which had the
   identical bug in its own string concatenation. Swept the whole repo with a
   word-boundary regex (`\b(de|a) el\b`) for other instances: **none found**, this
   was the only one.
2. **cem_cuantas arithmetic — caught before it shipped, not after.** A rewrite I
   presented in chat (not yet in any file) showed 147 bolsas / C$56,595 for a 30 m²
   losa; correct is **3.0 m³, 21 bolsas, C$8,085**, matching the original prototype
   exactly. Root cause: a hand-arithmetic slip composing the example text for
   presentation, not a code bug — `js/tryit-resolver.js`'s `CALC.m3Losa` /
   `bolsasLosa` / `bolsasLosaCosto` were never touched and were already correct; the
   walker's independent recompute had already validated this exact `{{calc m3Losa 30
   0.10}}` invocation against a from-scratch second implementation when it originally
   passed step 4. The walker never got a chance to catch or miss the chat-only error
   because the error never reached a file the walker reads. Re-verified by hand
   (`(30*0.10).toFixed(1)` = `"3.0"`, `Math.ceil(30*0.10*7)` = `21`,
   `21*385` = `8085`) and by re-running the walker against the corrected file.

**New node: `identidad`** — the one thing the assistant discloses, and only when
asked directly: *"Soy el asistente de la ferretería, pero le resuelvo igual.|||¿Qué
ocupa?"* (verbatim, approved copy, not paraphrased). Flagged `freeTextEntry: true` in
`data/tryit-tree.json` — reachable only via `isBotIdentity()` regex detection in
`probalo.html`'s `sendFree()`, checked *before* `askServer()` is ever called, so the
honest answer never depends on Groq being up. Same check duplicated in `fallback()`
as a second layer. The walker's reachability BFS now seeds from the 4 chip entries
**plus** any `freeTextEntry`-flagged nodes, and separately verifies the node id is
actually referenced in `probalo.html` (caught its own regex bug mid-implementation:
the check only looked for quoted-string references like `TREE['identidad']`, missed
the idiomatic `TREE.identidad` dot-access the code actually uses — fixed to match
both forms, then re-confirmed the real wiring was correct all along).

**Sequencer** (`sayBubbles()` in `probalo.html`): shared by the chip path, the Groq
path, and `fallback()` — all three now return the same array-of-bubbles shape.
Typing-indicator timing is `400ms + 25ms/char`, capped at `2000ms` (`3000ms` for a
proforma's bubble specifically — assembling a quote takes a moment), `±10%` jitter so
it isn't metronomic. **Groq's contract changed too**: `reply` is now 1-3 bubbles
joined with `"|||"`, per the rewritten system prompt, split client-side into the same
array shape before hitting the sequencer — rhythm applies to both paths, not just the
scripted tree.

Verified end-to-end on `localhost:8899` (Playwright): greeting renders as 2 separate
bubbles; `cem_precio`'s 2 bubbles arrive **2149ms then 4442ms** after the chip tap —
a real sequenced gap, not instant; the bot-identity question answers correctly and
instantly with zero dependency on `/api/tryit` (which 501s on this static test
server — the intercept fires before that call would even happen) and routes to
`identidad`'s own chips, not the generic `nearest()` set; zero console errors. Walker
re-run against the new format: **20/20 nodes pass** (19 + `identidad`), including
three fresh positive controls (stray digit, dangling chip, and the freeTextEntry
wiring check specifically) to confirm the updated checks are real, not vacuous.

### Closing-card fix (this session, second pass)

**Root cause of the first attempt's bug: `#close` was a DOM sibling of `.screen`,
not a child of it.** `.screen{overflow:hidden}` only clips its own descendants —
positioned outside that subtree, the hidden card (`translateY(105%)`) rendered
below `.phone`'s own bounds, unclipped, parking in open page space instead of
disappearing. Fixed properly this time, not patched:

- `#close` and a new `#scrim` moved to be actual DOM children of `.screen`, after
  `.bar`. `.screen` gained `position:relative` so `#close{position:absolute;
  left:0;right:0;bottom:0}` resolves against `.screen`'s own box, not `.phone`'s
  (which has 10px of padding `.screen` doesn't) — previously `left:10px;right:10px;
  bottom:10px` were relative to the wrong box entirely.
- Hidden state is `translateY(100%)` (was `105%`, no longer needed now that it's
  flush to the correct container) — verified by measuring the actual computed
  `transform` matrix at load: it resolves to exactly the card's own rendered
  height (e.g. `434.98px` at 375px viewport), and the card's bounding-box top
  lands exactly on `.screen`'s bounding-box bottom at all of 375/768/1440 —
  zero pixels inside the visible frame, confirmed both by bounding-box math and
  by screenshotting just the `.phone` element at each width (`/tmp/probalo-phone-
  {375,768,1440}.png` during this session — not committed, local verification
  artifacts).
- New `.scrim` (also a `.screen` child, `rgba(10,10,12,.35)`, fades independently
  of the card's slide) dims the visible conversation above the card while it's
  open, toggled by the same `endDemo()` / `start()` calls that toggle `#close`.
- `border-radius:24px 24px 29px 29px` unchanged — bottom corners already matched
  `.screen`'s own `29px`, so the card doesn't square off inside the rounded frame.
- Reduced-motion override simplified: previously forced `position:static` on
  `#close`, which — now that it's a real flex child of `.screen` instead of a
  block child of unconstrained `.phone` — would have broken out of `.screen`'s
  fixed `660px` height. Transition-killing alone (already global under
  `prefers-reduced-motion`) is sufficient: the slide becomes an instant cut
  instead of an animation, with no layout change needed.

Verified at 375/768/1440 (Playwright, screenshots + computed-style + bounding-box
inspection, not just visual spot-check): hidden and fully clipped at load on all
three; triggered via the turn cap (8 chip taps) at 375px, card renders **fully
within `.screen`'s bounds**, does **not** overlap the `.meta` "mensajes restantes"
line below the phone (card bottom at `781.4px`, meta top at `805.4px`); `#scrim`
correctly toggles `.on` alongside the card; **Repetir la demostración** resets both
`#close` and `#scrim` cleanly, card returns to its fully-clipped off-screen
position. Zero console errors throughout.

**End-to-end verification (this session).** Vercel's build compiled `tryit.js` from ESM to
CommonJS cleanly (confirms the `import catalog from '...json' with {type:'json'}` syntax
works in the real build, not just local Node). Since the deployed preview is fully
SSO-walled (see above), verification split across the venue that actually proves each
claim:

- **Chip path, deterministic and correct** — browser-verified on `localhost:8899` serving
  the exact committed code (same equivalence argument §1 already used for this reason).
  Walked cot_pared → pared_m2 → pared_agrega → cot_final: **PRO-1043 total C$23,756.70**,
  byte-identical to the walker's and the old prototype's number. Zero console errors.
- **Free text hitting Groq, for real** — `vercel dev` locally (real routing, real
  functions, real `GROQ_API_KEY`, no SSO wall since it's a local session). 8 real calls
  through the actual route, all correct and catalog-grounded (e.g. "¿A cómo está el
  bloque de 15?" → "El bloque de 15 cm cuesta C$26" — exact catalog match).
- **Fallback firing when the API is unavailable** — two distinct paths, both verified:
  network-unreachable (browser test, static server has no `/api/tryit` → client's `catch`
  block fires `fallback()`, correct price returned, turn counter still decremented, zero
  console errors beyond the expected network-level 501 noise from the test harness itself)
  and explicit `{degraded:true}` from a **deliberately broken `GROQ_API_KEY`, tested purely
  locally** — Groq correctly 401s, the route catches `!response.ok` and returns
  `200 {degraded:true}` exactly per contract. Vercel's real key was never touched.
- **Session turn cap enforced server-side** — `vercel dev` can't prove this (see above,
  resets module state per request). Re-confirmed instead with a direct single-process
  handler harness: 10 calls on one `sessionId` → 200 ×8 then **429 ×2**, matching
  `SESSION_TURN_CAP`.
- **Closing card** — all three options resolve: `optWa` → real `wa.me` link with correct
  percent-encoding, `optDx` → `/diagnostic`, `optCal` → the real Google Calendar booking
  URL. Zero console errors.
- **375/768/1440** — no horizontal overflow at any width, `.nav__links` correctly hides
  under 900px, console clean at all three.

**Tokens-per-turn — measured, not modeled. This is the number that was missing.**
8 representative free-text messages sent to the real Groq endpoint (mirroring the route's
exact system-prompt construction), reading `usage` directly off Groq's response:

| | prompt | completion | total |
|---|---|---|---|
| average per turn | 603.9 | 31.3 | **635.1** |

**The system prompt (~604 tokens) is nearly the whole cost of every turn**, not the reply —
this route is stateless with no conversation history and no prompt caching, so the full
catalog-grounded prompt is resent on every single free-text message regardless of how short
the question or answer is. Consequences for the free-tier question still marked UNPROVEN
above:

- At the current **40,000/day ceiling**: ≈ **63 free-text turns/day** before the route
  degrades to `fallback()` for the rest of the day.
- Against the full verified Groq free-tier budget (500,000 TPD for
  `llama-3.1-8b-instant`): ≈ **787 free-text turns/day** if the ceiling were raised to use
  the whole account budget.
- This makes the ceiling choice legible for the first time: it is not "40K tokens," it is
  roughly **"63 free-text turns before fallback."** Whether that is enough in a real day
  depends entirely on the still-unmeasured chip-vs-free-text split — the number this section
  keeps deferring to instrumented live sessions. If real data later shows free-text turns
  are rarer than 63/day, the ceiling is already generous; if a busy day produces more than
  that, prospects after #63 get the fallback responder, not a broken page, so the standing
  design goal (wrong-but-graceful) holds either way.
- **Cheap lever if this turns out too tight**: prompt caching (Groq supports it) or
  trimming the injected catalog would cut the ~604-token floor substantially, since it's
  fixed overhead unrelated to the actual question. Not done this session — flagged for
  whoever revisits the ceiling once real usage data exists.

**70-80% LLM-call reduction — resolved, do not re-open.** A synthetic/branching-factor
measurement was considered and dropped: it describes the shape of the tree, not what real
users do, and reports ~100% chip usage by construction because it never free-types — it
cannot answer the question it would be built to answer. The only real measurement is
instrumented live sessions (chip-turn vs free-text-turn counts, already the exact fields
`logChoice()` collects — see `probalo.html`'s `chipCount`/`freeCount`/`entry`). That
instrumentation does not exist yet and free-tier viability is **UNPROVEN** until it does.

**Design consequence for step 5:** the API route cannot assume the 70-80% figure holds.
Build `/api/tryit` so being wrong about it degrades gracefully instead of breaking:
the daily token ceiling is a hard server-side cap picked well inside Groq's free-tier
budget (not sized to "expected" call volume), and every failure path — budget spent, rate
limited, upstream error, timeout — returns `{degraded:true}` and lets the client's existing
`fallback()` responder answer silently. A prospect never sees an error state; worst case
the demo quietly runs on keyword-matched fallback replies instead of the LLM for the rest
of the day. Re-open this only once real session data exists to size the ceiling against.

## 3. STANDING RULES

- **TEST DATA MUST NEVER IMPERSONATE A REAL PROSPECT. Mark it `ZZTEST` in the name AND the
  company, always.** Never a real person's name, never a real business name, and **never a
  real phone number** — use `8000-0000`. Emails stay `@example.com`.

  **Why, because the rule is useless without the reason:** a test submission arrives through
  *the same channel as real leads*, and it is convincing in exact proportion to how realistic
  you made it. A test that impersonates a live prospect is therefore **worse than no test at
  all** — it doesn't just fail to help, it actively corrupts the lead pipeline with something
  indistinguishable from the real thing.

  This happened. On 2026-08-27 a timing-measurement script submitted `Luis Herrera` /
  `Ferreteria Roberto Leyva` / the real published WhatsApp `8935-9013` to production, and it
  landed in Fede's inbox as an apparently-genuine lead from the live deal he was mid-
  negotiation on. He nearly acted on it. The realism was the whole problem: the script used
  real data *specifically* to make the measurement representative, and that is exactly what
  made the resulting email indistinguishable from a real one. The measurement (character
  count and pause length) would have been byte-identical with `ZZTEST Ferretería Ejemplo` and
  a fake number. There was never a reason to use his.

- **The test-data rule applies to anything that can reach a human — not just "production".**
  The line is **not** "is this production?" but **"can this reach a person?"** That includes
  Formspree or any email path, `wa.me` links, the Google Calendar booking page, and any API
  that logs or notifies. A localhost page POSTing to a live endpoint still reaches a human;
  a production page with the network intercepted does not. Judge by where the request lands,
  not by which host served the page.


- **Nothing on the public site states a result, timeline, or figure attributed to a client until there's a real one.** `thesis.html`'s aggregate Latin-America market statistics (region GDP, population served, consulting pricing) are explicitly fine — they describe the market, not our client outcomes. A full sweep of the live merged state found nothing beyond the three groups already cleaned, plus the ROI footnote now fixed.
- Never print, echo, or ask for API keys/tokens in chat. Verify presence/scope via `vercel env ls` (names/scopes only), never values.
- **Confirm `.vercel/project.json` says `ignea-labs-w8bp` before any Vercel CLI work** — not the dead `ignea-labs` decoy project.
- Production now carries this work. To confirm what is live: `curl -sL https://www.ignealabs.com/ -o /tmp/p.html && diff -q /tmp/p.html index.html` from a clean `main`.
- **Preview URLs sit behind Vercel's SSO wall for EVERYTHING, `/api/*` included** — corrected 2c: the previous claim that `/api/*` was exempt was checked directly against the `feat/probalo-data` preview and is false for this project's current protection settings. No automation bypass secret is configured. To test a preview's API without a browser session, use `vercel dev` locally instead (same routing/functions, no wall) — but note `vercel dev` does NOT reliably persist in-memory module state (rate-limit/turn-cap counters) across requests the way a warm deployed instance does, so use a direct single-process handler harness for anything that depends on that.
- **Verify by running things, not by reading code.** This session that caught: the reference file's own scroll-snap bug, a float-hide handler that silently no-op'd because `.wa-float` is parsed *after* the script tag, and a Supabase request failing only intermittently depending on when `networkidle` settled. All three looked fine in the source.
- Don't guess at missing user-supplied values (booking links, phone numbers, tokens) — ask, or report exactly what was and wasn't found.
- `.env.local` exists at repo root, is git-ignored, holds real values — never read it or surface its contents. If a real value is needed, use shell-variable substitution inside a single non-echoing Bash call piped straight into `curl`.

---

## 3a. THE i18n FIRST-VISIT BUG — no Spanish first-time visitor ever saw the i18n layer

**Fixed 2026-08-28. Read this before making any copy change.**

**The bug.** `js/i18n.js`'s `init()` was:

```js
var saved = localStorage.getItem('ignea_lang');
if (saved && saved !== currentLang) { setLang(saved); }
else { /* only reveal the elements, do not translate */ }
```

`currentLang` initialises to `'es'`. So the translate branch fired **only** when a *saved*
language differed from Spanish — i.e. only for `saved === 'en'`. For every Spanish visitor,
first-time or returning, `setLang` was never called on load and the **static HTML in the
markup is what rendered**. The ES values in `js/i18n.js` were applied only after someone
actively clicked the ES toggle mid-session.

**The implication, which is the part that matters:** **any copy correction made only in
`js/i18n.js` was invisible in production to Spanish visitors.** A string could be fixed in
the i18n file, verified by reading that file, and still never reach a single real user,
because the stale static HTML kept rendering. Several corrections had drifted this way —
23 strings across 5 pages rendered differently depending on whether the visitor had ever
touched the language toggle.

The worst example, found the same night: the homepage's `process.s1d` still rendered the dead
v3 spec's *"11 preguntas que mapean tus brechas operativas…"* on a first visit, while the
i18n value said something completely different. A prospect arriving cold read the wrong
thing; a developer checking `i18n.js` read the right thing.

**The fix.** The DOM work was split out of `setLang` into `applyTranslations(lang)`, and
`init()` now **always** applies translations regardless of language. `setLang` keeps the
user-initiated side effects it should own — `localStorage` write, the `language_toggled`
analytics event, the `langchange` dispatch — so ordinary page loads no longer fire a
spurious analytics event or a `langchange` on every visit. `applyTranslations` also does the
anti-flash reveal, so both entry paths un-hide correctly.

**Verified on production** as a genuine first visit (cleared `localStorage`, hard reload):
first-visit and post-toggle render identically, elements visible, zero console errors.

**Consequence for future sessions:** the static HTML in each page is now a **fallback shell
only** — an SEO/no-JS backstop, never the thing a visitor reads. Copy changes belong in
`js/i18n.js`, in both languages. Where a static string and its i18n value disagree, the i18n
value is what ships. When correcting copy, updating the static HTML too is still good
hygiene, but the i18n value is authoritative.

## 3b. VOICE INPUT ON /diagnostic — ALREADY BUILT AND LIVE, previously undocumented

**This exists in production and always did. It was missing from this file, which caused a
later sprint to plan it as new work.** Found by grepping for `SpeechRecognition` while
researching whether to build it.

Web Speech API voice-to-text on the three free-text screens (Q2 business description, Q4
headache, Q5 tried-before) — never on name/email/phone or the checkbox screens. Implemented
in `js/diagnostic.js` (`initVoiceInputs`), styled as `.mic-card` in `css/shared.css`, markup
hook is `.voice-wrap` in `diagnostic.html`. i18n keys `voice_*` exist in **both** languages.

Git trail:

| Commit | What |
|---|---|
| `86e08d2` | feat: add voice-to-text input on diagnostic textareas via Web Speech API |
| `ffd37f9` | fix: restyle sub-labels, move mic below textarea, enable continuous recording |
| `20655b1` | feat: redesign voice recording as prominent full-width card with title + subtitle |
| `98b2c09` | fix: SEO discoverability, dead stat counters, **voice failure states** |

**Verified live** (production, Playwright): mic card renders at 335×128px (≥48px target),
tap-to-start/tap-to-stop with an `MM:SS` timer, transcript lands in the textarea fully
editable. With `SpeechRecognition` spoofed away it degrades correctly — no mic card, the
Spanish "Tu navegador no soporta entrada de voz" message shows, textarea stays typeable.

**KNOWN GAP — re-recording appends, it does not replace.** `finalTranscript` is seeded from
`field.value` at start, so tapping the mic a second time concatenates onto the existing text.
There is no "clear and redo"; a prospect with a bad take has to select-and-delete the text by
hand. Not fixed — decide deliberately whether that matters.

**ACCURACY CONFIRMED ON A REAL DEVICE — 2026-08-28, by Fede, on his own phone.**
Real Android Chrome, against the public preview of `fix/diagnostic-enter-and-keyboard`.
He drove the **full flow end to end**, the submission arrived, and **voice dictation captured
connected Nicaraguan Spanish correctly in all three free-text fields** (Q2 business, Q4
headache, Q7 tried-before). This supersedes the "UNMEASURED" note below — the feature works
on the device class a prospect actually uses.

**Scope of that test, stated honestly so nobody over-claims it:** one speaker, one device, one
session, connected natural speech. It is *not* a measurement of our domain vocabulary
specifically — nobody has yet confirmed "proforma / existencia / varilla / quintal / Holcim /
cotización" transcribe correctly as isolated terms. Treat "voice input works" as supported;
treat "voice input handles ferretería jargon" as still unverified.

**The re-recording gap is still open and was NOT fixed.** `finalTranscript` is seeded from
`field.value` at start, so a second tap of the mic **appends** to the existing text rather
than replacing it. There is no "clear and redo" — a prospect with a bad take must
select-and-delete by hand. Known, deliberate, unfixed; see the KNOWN GAP note above.

**Superseded background, kept because the failure mode is worth knowing:** an earlier attempt
to measure accuracy in CI (real Spanish TTS piped into Chromium as a fake mic) failed for an
environmental reason, not a product one. `getUserMedia` delivered the audio correctly (1
track, peak level 255) but `SpeechRecognition` returned no transcript and no error, because
Playwright's bundled Chromium is a non-branded build without Google's Speech API keys.
**Voice input cannot be tested in Playwright at all — it needs a real device.**

## 4. KNOWN ISSUES NOT BEING FIXED RIGHT NOW

- **`results.html` has never actually been browser-verified, and every sweep that claimed
  otherwise measured the wrong page.** `js/results.js:58` redirects to `diagnostic.html`
  whenever `sessionStorage.ignea_diagnostic_scores` / `_answers` are absent. In a browser
  that redirect always fires, so Playwright sweeps reporting "/results console clean,
  no overflow" were silently measuring `diagnostic.html`. Curl-based content checks of
  `results.html` (the ROI footnote, the Calendly strings) were valid, since curl runs no JS.
  **Only `demo.html` writes those two sessionStorage keys**, with hardcoded sample data —
  `js/diagnostic.js`, the live funnel, never writes them. Nothing anywhere links to
  `results.html`, and `robots.txt` disallows it. So it is reachable only by visiting
  `demo.html` first and then typing the URL by hand. Effectively dead; `demo.html` is
  serving the sample-report role. Do not trust any historical "results.html verified" claim.
- **`js/grid-bg.js` still paints the Onda-era teal palette** — `rgb(0,229,191)`,
  `rgb(0,160,140)`, `rgb(0,200,170)`, with a comment reading "Primary: teal glow (our
  accent)". This contradicts the no-teal rule. Blast radius is tiny and measured:
  `index.html` only references it in a stale comment and never loads it; `results.html`
  loads it but redirects away; only auth-gated `ops.html` actually renders the canvas, where
  1 of 2,598 sampled pixels was teal-family. **Filed deliberately, not fixed.**
- **12 orphaned `stats.*` i18n keys.** The homepage STATS section no longer exists
  (`<!-- STATS -->` is an empty comment; only dead `.stats-row` CSS remains) but the keys
  and their translations are still in `js/i18n.js`. **Left deliberately**, same reasoning as
  the `dx.*` keys — harmless, and removal risks touching live paths for no user benefit.


- **DM Sans 600/700 are not imported.** `shared.css` imports only `wght@300;400;500`, so `.btn-primary` (600), the demo's `mark.ig-hl` (700) and the footer's `.f-brand` (800) all render **synthetic bold**. Site-wide and pre-existing. **Decision: leave it, noted deliberately.** Adding weights changes font rendering on every page.
- `demo.html` / `results.html` third savings card renders **"2.3 meses"** with a sub-label **"meses"** underneath — duplicated unit. Pre-existing, cosmetic.
- `contact.html` console shows Datadog / WebGL / `requestStorageAccess` noise. Verified **pre-existing** by running the unmodified page from `git HEAD` — identical 5 messages. Third-party, not ours.
- `results.html` is still marked BROKEN in `CLAUDE.md` (expects scoring data `diagnostic.js` no longer produces). Untouched this session.
- `js/supabase-config.js` still holds placeholder credentials — now guarded (§1) but not wired.

---

## 5. VERCEL / DEPLOYMENT REFERENCE

- Correct project: **`ignea-labs-w8bp`** (org `fedebaltoinvest-7282s-projects`). Dead decoy Vercel
  project: `ignea-labs`. **Name collision warning:** the local working directory is now also
  called `ignea-labs` (`~/ignea-labs`). They are unrelated — the directory is fine, the Vercel
  project of that name is the dead one. Judge by context: a path means the folder, a Vercel
  project name means the decoy.
- Env vars: `ANTHROPIC_API_KEY` (Prod/Preview/Dev), `IGNEA_OPS_TOKEN` (Preview/Prod), `ALLOWED_ORIGINS` (**Preview only — never set on Production**, which correctly uses the hardcoded fallback).
- Repo: `github.com/fede09balto-gif/Ignea-Labs` (renamed from `onda-ai`; old remote URL still redirects, push/pull both work). **The working directory was renamed to `~/ignea-labs` (was `~/onda-ai`).**
- `vercel.json` sets `cleanUrls:true`, which **308-redirects every `.html` path**. Canonicals, `sitemap.xml`, and internal links must point at the clean form. When curling to verify, fetch `/` not `/index.html` or you'll measure the redirect instead of the page.

---

## 5b. BRANCH AUDIT (this session) — only 1 branch actually has unmerged work

Git-verified, not narrative-verified — this doc's own prose about branch status had drifted
from reality (see the `feat/labor-cost-and-components` correction above). Trust `git
branch --merged main` / `git rev-list --count`, not old handoff text, when this next goes
stale too.

| Branch | Commits ahead of `main` | Status |
|---|---|---|
| `feat/probalo-data` | **3** (`379112c`, `b9c82ae`, `b1eb8de`) | **The only real unmerged work.** Preview deployed, awaiting review before merge. |
| `feat/formspree-google-calendar` | 0 | Fully absorbed into `main`. Stale ref. |
| `feat/hero-cta-ticker-nav-ghost` | 0 | Fully absorbed into `main`. Stale ref. |
| `feat/labor-cost-and-components` | 0 | Fully absorbed into `main`. Stale ref (see correction above). |
| `fix/api-lockdown` | 0 | Fully absorbed into `main`. Stale ref. |
| `fix/seo-and-deadcode` | 0 | Fully absorbed into `main`. Stale ref. |
| `revamp/light-theme` | 0 | Fully absorbed into `main`. Stale ref. |
| `claude/amazing-chaplygin` (origin only, no local ref) | 0 | Fully absorbed into `main`. Stale ref, dated 2026-04-12. |

**Recommended consolidation, in order:**
1. Review and merge `feat/probalo-data` (this session's preview) — the only branch with
   anything left to do.
2. Delete the other 7 refs, local and on origin — they're pointers to work `main` already
   contains, not backups of anything at risk. `git branch -d <name>` locally (safe: `-d`
   refuses to delete anything not fully merged, so it can't accidentally discard work) and
   `git push origin --delete <name>` remotely.
3. Nothing else needs sequencing — there is no second line of unmerged work waiting behind
   this one. The "archaeology" risk was the stale narrative in this file claiming otherwise,
   not the actual git state.

---

## 6. HOW THIS SESSION VERIFIED THINGS

Reusable, in case the next session wants the same rigor. Playwright is not installed in the repo (no `package.json`); it resolves from the npx cache — symlink it into a scratch dir:

```bash
ln -sfn ~/.npm/_npx/*/node_modules "$SCRATCH/node_modules"
cd /Users/fedebalto/ignea-labs && python3 -m http.server 8899 &
```

Checks worth repeating: console+overflow sweep at 375/768/1440 across all 7 pages; ES/EN round-trip asserting SVG/DOM survival rather than just absence of errors; baseline comparison by serving `git archive main` on a second port; Lighthouse before/after via `npx lighthouse --preset=desktop`; and for anything intermittent, **run it 3–4 times** — the Supabase failure appeared on run 3 of 3.
