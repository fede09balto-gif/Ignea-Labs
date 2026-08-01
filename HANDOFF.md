# SESSION HANDOFF — Ignea Labs / onda-ai

Written at the end of a session that completed the entire previous handoff's §2 plan, then merged it to production. Everything in §1 is **live on www.ignealabs.com**; §2 is four approved-but-unbuilt work items. Read §1 and §2 before doing anything. The previous handoff's content is superseded — its plan is done.

**Start next session with §2.1 (Nicaragua cost model). It is now live and wrong on production.**

---

## 1. WHERE THINGS STAND

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

## 3. STANDING RULES

- **Nothing on the public site states a result, timeline, or figure attributed to a client until there's a real one.** `thesis.html`'s aggregate Latin-America market statistics (region GDP, population served, consulting pricing) are explicitly fine — they describe the market, not our client outcomes. A full sweep of the live merged state found nothing beyond the three groups already cleaned, plus the ROI footnote now fixed.
- Never print, echo, or ask for API keys/tokens in chat. Verify presence/scope via `vercel env ls` (names/scopes only), never values.
- **Confirm `.vercel/project.json` says `ignea-labs-w8bp` before any Vercel CLI work** — not the dead `ignea-labs` decoy project.
- Production now carries this work. To confirm what is live: `curl -sL https://www.ignealabs.com/ -o /tmp/p.html && diff -q /tmp/p.html index.html` from a clean `main`.
- Preview URLs sit behind Vercel's SSO wall (302 → `vercel.com/sso-api`) for static content but not `/api/*`. Expected, not a bug.
- **Verify by running things, not by reading code.** This session that caught: the reference file's own scroll-snap bug, a float-hide handler that silently no-op'd because `.wa-float` is parsed *after* the script tag, and a Supabase request failing only intermittently depending on when `networkidle` settled. All three looked fine in the source.
- Don't guess at missing user-supplied values (booking links, phone numbers, tokens) — ask, or report exactly what was and wasn't found.
- `.env.local` exists at repo root, is git-ignored, holds real values — never read it or surface its contents. If a real value is needed, use shell-variable substitution inside a single non-echoing Bash call piped straight into `curl`.

---

## 4. KNOWN ISSUES NOT BEING FIXED RIGHT NOW

- **DM Sans 600/700 are not imported.** `shared.css` imports only `wght@300;400;500`, so `.btn-primary` (600), the demo's `mark.ig-hl` (700) and the footer's `.f-brand` (800) all render **synthetic bold**. Site-wide and pre-existing. **Decision: leave it, noted deliberately.** Adding weights changes font rendering on every page.
- `demo.html` / `results.html` third savings card renders **"2.3 meses"** with a sub-label **"meses"** underneath — duplicated unit. Pre-existing, cosmetic.
- `contact.html` console shows Datadog / WebGL / `requestStorageAccess` noise. Verified **pre-existing** by running the unmodified page from `git HEAD` — identical 5 messages. Third-party, not ours.
- `results.html` is still marked BROKEN in `CLAUDE.md` (expects scoring data `diagnostic.js` no longer produces). Untouched this session.
- `js/supabase-config.js` still holds placeholder credentials — now guarded (§1) but not wired.

---

## 5. VERCEL / DEPLOYMENT REFERENCE

- Correct project: **`ignea-labs-w8bp`** (org `fedebaltoinvest-7282s-projects`). Dead decoy: `ignea-labs`.
- Env vars: `ANTHROPIC_API_KEY` (Prod/Preview/Dev), `IGNEA_OPS_TOKEN` (Preview/Prod), `ALLOWED_ORIGINS` (**Preview only — never set on Production**, which correctly uses the hardcoded fallback).
- Repo: `github.com/fede09balto-gif/Ignea-Labs` (renamed from `onda-ai`; old remote URL still redirects, push/pull both work). **The working directory is still named `onda-ai`.**
- `vercel.json` sets `cleanUrls:true`, which **308-redirects every `.html` path**. Canonicals, `sitemap.xml`, and internal links must point at the clean form. When curling to verify, fetch `/` not `/index.html` or you'll measure the redirect instead of the page.

---

## 6. HOW THIS SESSION VERIFIED THINGS

Reusable, in case the next session wants the same rigor. Playwright is not installed in the repo (no `package.json`); it resolves from the npx cache — symlink it into a scratch dir:

```bash
ln -sfn ~/.npm/_npx/*/node_modules "$SCRATCH/node_modules"
cd /Users/fedebalto/onda-ai && python3 -m http.server 8899 &
```

Checks worth repeating: console+overflow sweep at 375/768/1440 across all 7 pages; ES/EN round-trip asserting SVG/DOM survival rather than just absence of errors; baseline comparison by serving `git archive main` on a second port; Lighthouse before/after via `npx lighthouse --preset=desktop`; and for anything intermittent, **run it 3–4 times** — the Supabase failure appeared on run 3 of 3.
