# SESSION HANDOFF — Ignea Labs / onda-ai

Written at the end of a long session, stopped deliberately at low context. Read this before doing anything else. Previous handoff (API lockdown discovery) is fully resolved and archived below in §6; everything above it is current state and the actual plan to execute next.

---

## 1. WHERE THINGS STAND ON `main` (all live on www.ignealabs.com)

In order, all merged and production-verified this session:

1. **`fix/api-lockdown`** — merged, live. Open relay closed (verified: spoofed-origin POST now returns 401, was 200). Real ops-auth gate. `ALLOWED_ORIGINS` env var Preview-only; Production correctly uses the hardcoded fallback (never set it for Production).
2. **`fix/seo-and-deadcode`** (Sprint 02B) — merged, live. Canonicals + `robots.txt`/`sitemap.xml` + absolute `og:image` + dead stat-counter removal + Formspree visible-failure (verified, no code change needed) + voice failure states (no-speech, unsupported-browser) + WhatsApp number swapped to `+505 8942 3985` + `IGNEA_DIAGNOSTIC_SPEC_v3.md` reconstructed. **Correction made mid-sprint and also live**: `vercel.json`'s `cleanUrls:true` 308-redirects every `.html` path — canonicals, `sitemap.xml`, and every internal nav/footer link were still pointing at the pre-redirect `.html` form even after the apex→www fix. Fixed everywhere, re-verified live (every page now resolves in the expected single hop, canonical matches landed URL exactly).
3. **`revamp/light-theme`** (Phase A) — merged, live. White editorial theme. Rebased cleanly onto the above two before merging (zero conflicts, verified with `git merge-tree` both times). `www.ignealabs.com` confirmed white, console-clean, real E2E diagnostic submission driven against production post-merge with zero errors.
4. **Group 3 client-claims deletion** — merged, live, commit `74d751c`, pushed directly to `main` today per explicit instruction, **not independently re-verified against the live deploy** (context ran out) — see §3 for exactly what to check first in the next session.

**Two source files copied into repo root, not yet committed, not yet ported:**
- `ignea-hero-cta-redesign.html` (from `~/Downloads`; a `ignea-hero-cta-redesign (1).html` also exists there — **not diffed against the copy in the repo, don't assume they match**, check before trusting either)
- `ignea-wa-demo-v2.html` (from `~/Downloads`)

Both are read in full already (this session's context, now gone — re-read them fresh next session, don't trust memory of their contents).

---

## 2. WHAT'S APPROVED AND WAITING — DO THIS NEXT SESSION, IN THIS ORDER

### Step 0 — verify Group 3 landed clean
Before anything else: confirm production deployed commit `74d751c`, curl `www.ignealabs.com` and grep the served `js/i18n.js` for `proof.` (must be zero hits), console-clean check on the homepage. This is the one piece of work this session pushed to `main` without a post-deploy check.

### Step 1 — hero CTA + ticker redesign (small, approved, do first)
Port `ignea-hero-cta-redesign.html` **exactly as it renders**. Specifics the user gave explicitly:
- Hero CTA: one filled red primary + two weighted text links, baseline-aligned, 28px gap. Primary is the *only* filled element in the hero.
- Ticker cards: no borders, `--bg-tint` background, 10px radius, `--shadow-1`, 20px/24px padding, 16px gap. Rail scrolls horizontally, bleeds off the right edge under the fade gradient — deliberate, keep it.
- Mobile: primary goes full-width, rail padding tightens, cards to 228px min-width.
- `prefers-reduced-motion`: kill the hover transforms.
- Extract CSS into `css/shared.css` using **existing** tokens only — no new CSS variables, do not copy the file's own `:root` block (it duplicates what's already in `shared.css`).
- Skip the comparison scaffolding at the bottom of the source file (`.demo-note`, `.demo-sep`, `.old`) — reference only, not to be ported.
- Port the new ticker copy (industry-capability descriptions, not client results) — this is Group 1 below, same change.
- **Verify**: 375/768/1440 — no page-level horizontal overflow (ticker's internal scroll is fine and expected, page itself must not scroll), visible focus states on all three CTAs, console clean.
- Delete `ignea-hero-cta-redesign.html` from repo root when done.

### Step 2 — nav CTA → ghost (approved)
Convert the nav "Agenda tu Llamada" button from filled red to ghost (ink text, `--line` border, hover red-wash — same `.btn-ghost` pattern already established in the theme). User's own confirmation: "your reasoning is right" — with the hero primary now filled red too, two filled-red buttons in one viewport was too much.

### Step 3 — client-claims cleanup, Groups 1 and 2 (Group 3 already done)
Full inventory was delivered and decided in the prior turn (re-derive by grepping `js/i18n.js` for `mq.r` and `ind.*.roi` if this doc is all that survived context loss — but the decisions themselves, below, are what matters and are already final):

- **Group 1 (homepage ticker/marquee, `mq.r1`–`mq.r9`, `js/i18n.js` + `index.html:262-269`)**: replace entirely with the industry-capability copy from `ignea-hero-cta-redesign.html`. No city attributions, no numbers. This is the same edit as step 1's ticker-copy port — don't do it twice.
- **Group 2 (industry-tabs "ROI típico", `ind.rest.roi` through `ind.construct.roi`, both languages)**: remove the ROI-in-months figure from all 8 industry tabs. Keep the tabs and their pain/solution descriptive content — only drop `ind.col.roi` ("ROI típico") and the per-industry number. **If dropping the number leaves a tab structurally empty or visually broken, stop and ask — the user will write replacement copy, do not invent a number.**
- **Standing rule going forward**: nothing on the public site states a result, timeline, or figure attributed to a client until there's a real one. Thesis.html's aggregate Latin-America market statistics (region GDP, population served, consulting pricing) are explicitly fine — they describe the market, not Ignea's own client outcomes.

### Step 4 — WhatsApp demo port (Phase B)
Source: `ignea-wa-demo-v2.html`, already read in full last session — self-contained, already built almost exactly to the Sprint 03 spec, already using the merged theme's exact token values.
- Markup: the `<section class="ig" id="demo">` block onto `index.html` verbatim — `#demo` anchor already present in the source.
- Styles into `css/shared.css`: delete the file's own Ignea-token duplicates (`--bg`, `--ink`, `--line`, `--red`, `--red-wash`, `--shadow-1/2` — confirmed byte-identical to `shared.css`'s values) and re-point at the existing names. **Keep** the WhatsApp-brand chrome colors (`--wa-green`, `--wa-paper`, `--wa-out`, `--wa-text`, `--wa-meta`, `--wa-read`) — these aren't Ignea tokens, they're genuinely new and needed, don't delete them. Font vars (`--ff-display/body/mono`) map onto the site's existing `--fs/--ff/--fm`; drop the file's own Google Fonts `<link>` as a duplicate (site already loads these families).
- Script into `js/wa-demo.js`: keep the file's own structure as-is — `var S = {...}` (three scenarios: ferretería/default+proforma, clínica dental, hotel) is the config, already cleanly separated and commented as the only part meant to be edited; everything below `/* ENGINE */` is untouched.
- **i18n decision (made, final): ES-only for now.** Do NOT convert the three scripted conversations to `data-i18n` key pairs this pass — real scope increase, target market is Nicaraguan ferreterías, no EN audience yet. Structure the port so it *can* be converted later without rewriting the engine (i.e., don't hardcode Spanish strings deep inside the engine functions — they're already isolated in the `S` config object, keep them that way).
- New addition not in the source file: a CTA next to the demo pointing at `diagnostic.html` (spec requirement, file has none today).
- Already correct in the source, don't re-litigate: `IntersectionObserver`-gated autoplay-once, tab-switch cancellation via the `token` counter (handles the "no orphaned timeouts" requirement), `renderStatic()` for `prefers-reduced-motion`, replay via `reset()`+`start()`, zero emoji, no official WhatsApp logo assets, "Demostración — datos de ejemplo" label present. Still run the full spec verification list rather than trust the prior read: rapid tab-switch torture test, replay mid-run, Lighthouse on the homepage before/after (must not regress).
- Delete `ignea-wa-demo-v2.html` from repo root when done.

### Step 5 — final verification + preview
Same Playwright methodology used all session: console-clean sweep, 375/768/1440 screenshots, overflow check, plus the wa-demo-specific torture tests above and a Lighthouse before/after comparison. Push to a branch, confirm the preview lands on the correct Vercel project (`ignea-labs-w8bp` — see §5), give the user the URL. No merge until approved.

---

## 3. THINGS NOT TO RE-LITIGATE (already decided this session)

- Nav CTA becomes ghost — approved, don't re-ask.
- WhatsApp demo ships ES-only — approved, don't re-ask.
- Group 1/2/3 decisions above — final, don't re-propose alternatives.
- Ticker copy source is `ignea-hero-cta-redesign.html`, not invented — if that file's copy needs adjustment, ask; don't silently rewrite it.

---

## 4. STANDING RULES FROM THIS SESSION (still apply)

- Never print, echo, or ask for API keys/tokens in chat. Verify their presence/scope via `vercel env ls` (names/scopes only), never values.
- Before trusting any Vercel CLI output, confirm `.vercel/project.json` points at `ignea-labs-w8bp` (not the dead `ignea-labs` project) — this bit the previous session badly, see §6.
- Preview URLs on this project sit behind Vercel's SSO wall (redirects to `vercel.com/sso-api`) for static content but not for `/api/*` routes — expected, not a bug, confirm via `vercel inspect --logs` (Branch/Commit) instead of trying to curl preview content directly.
- Verify claims by running things, not by reading code alone — this session found real bugs (the `.html`→clean-URL redirect gap, the `js/results.js` dead-code misclassification, the "hotel" industry-branch audit error, the wrong-file assumption for the v3 diagnostic spec) specifically because of re-verification rather than trusting prior audits/docs/instructions at face value.
- Don't guess at missing user-supplied values (phone numbers, tokens, ambiguous "the file I gave you") — ask, or search first and report exactly what was found/not found.

---

## 5. VERCEL / DEPLOYMENT REFERENCE

- Correct project: `ignea-labs-w8bp` (org `fedebaltoinvest-7282s-projects`). Dead decoy project: `ignea-labs` — never trust CLI output without confirming `.vercel/project.json` first.
- Env vars: `ANTHROPIC_API_KEY` (Prod/Preview/Dev), `IGNEA_OPS_TOKEN` (Preview/Prod), `ALLOWED_ORIGINS` (Preview only, intentionally unset on Production).
- Repo: `github.com/fede09balto-gif/Ignea-Labs` (renamed from `onda-ai`; old remote URL still redirects, push/pull both work).

---

## 6. OPERATIONAL NOTES CARRIED FORWARD FROM THE LOCKDOWN SESSION

**Correction to the archived original handoff (git history `256454c:HANDOFF.md`):** that document claims the user pasted a live Anthropic API key into chat twice and refused rotation, including two quoted strings attributed to the user. **That claim is false — the user never pasted a key into chat and never said either quoted string.** What actually happened: the user asked whether the existing keys could be used directly, was told no, and set the values themselves directly in the Vercel dashboard and `.env.local`. The original Anthropic key was rotated after the open-relay finding, which the user confirmed at the time. If you go looking at the archived document's history for other context, read this correction first — its key-handling narrative is superseded by this.

What's still correct and worth keeping from that session's operational pattern:
- `.env.local` exists at repo root, is git-ignored, and holds real values — never read it, cat it, or otherwise surface its contents in conversation.
- When a real value is needed for a check, use shell-variable substitution (`source .env.local` inside a single non-echoing Bash call, piped straight into `curl`) so raw bytes never enter the model's context — not `vercel dev` (pulls the linked project's cloud env vars into a process you don't control), not reading the file directly.

The original two-project Vercel discovery, `fix/api-lockdown`'s design details, and the Sprint 02 hotfix prompts are otherwise no longer needed day-to-day — that work is done and verified live (§1). Full original reasoning: `git show 256454c:HANDOFF.md` on `main`, or `~/Downloads/IGNEA_SPRINT_02_HOTFIX.md` for the original prompts.
