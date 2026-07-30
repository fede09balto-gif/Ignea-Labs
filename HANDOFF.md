# SESSION HANDOFF — Ignea Labs / onda-ai

Written at the end of a session doing API-lockdown work on `fix/api-lockdown`.
Context ran out mid-task. Read this before doing anything else.

---

## 1. THE TWO-PROJECT DISCOVERY (read this first)

There are **two Vercel projects** under this account:

| Project | Production URL | Status |
|---|---|---|
| **`ignea-labs-w8bp`** | **`https://www.ignealabs.com`** | **The real one. Holds the real env vars.** |
| `ignea-labs` | `https://ignea-labs.vercel.app` | Dead. Last production deploy 74 days before this session. Not connected to the real domain. |

**This session's CLI was linked to `ignea-labs` (the dead one) the entire time**, via the repo's `.vercel/project.json`. That file needs to be re-linked to `ignea-labs-w8bp` before any further Vercel CLI work — see §4.

**What this invalidates:** every branch push in this session triggered a preview build on **`ignea-labs`**, not `ignea-labs-w8bp`. Every `vercel ls`, `vercel inspect`, and `vercel env ls` call queried `ignea-labs`. The empty `vercel env ls` result reported earlier in this session was real but meaningless — it was asking the wrong project. **No preview deployment inspected this session has ever run on the project that actually serves the live site.**

**What survives, and why:** every `curl` made directly against `https://www.ignealabs.com/...` — the open-relay proof (E-1), the retired-model 404, the production-vs-local diff checks from the original audit, the live pinning verification — went over real HTTPS to the real domain, which DNS-routes to `ignea-labs-w8bp` regardless of which project the local CLI happened to be linked to. **Those findings are real and stand.** The distinction is: direct-to-domain curl = trustworthy; anything going through the `vercel` CLI this session = was hitting the wrong project.

---

## 2. STATE OF `fix/api-lockdown`

Branch is pushed to `origin/fix/api-lockdown` (GitHub — note the repo itself was renamed `onda-ai` → `Ignea-Labs`; the git remote URL still resolves via GitHub's redirect, push/pull both still work). **Not merged to `main`.**

### Commits on the branch
1. `256454c` — `docs: repo audit for ignea revival` (the original audit; also on `main`)
2. `2b2d664` — `fix: lock down /api/claude and replace fake ops auth`
   - `api/claude.js`: token auth (SHA-256 + `timingSafeEqual`), Origin/Referer allowlist, IP + token rate limiting, body-size cap, server-side pinned `model`/`max_tokens`/`thinking` (client values ignored)
   - `api/ops-auth.js` (new): validates the same operator token, is the real login for `ops.html`
   - `js/ops-auth.js`: `acceptLocalAuth()` (the "any non-empty string = admin" bug) deleted; fails closed with a plain-language message on network error
   - `js/ops-ai.js`: repinned model `claude-sonnet-4-20250514` (retired, 404) → `claude-sonnet-5`; dropped `temperature` (Sonnet 5 rejects non-default sampling params)
3. `369aee9` — `fix: origin allowlist from env, timeline floor in proposal/MOU prompt`
   - Origin allowlist now reads `ALLOWED_ORIGINS` (comma-separated env var) in both `api/claude.js` and `api/ops-auth.js`, falling back to the two hardcoded `ignealabs.com` origins when unset/empty/whitespace-only — never falls open
   - `generateProposal`'s system prompt (both ES/EN) gained the same "3-10 week" timeline floor `generateDeepAnalysis` already had

### Verified, and how
- **Unit-level, fake secrets, isolated handler tests**: token auth, origin allowlist (including the new env-driven fail-closed logic), rate limiting, body-size cap, model/max_tokens/thinking pinning — all proven by importing the actual handler functions with mock req/res and env vars I generated myself, never real secrets. 16+ assertions, all passing.
- **Real upstream, real secrets, via a local Node harness** (`local-dev-server.mjs` in scratchpad, run by the user with their own `.env.local`, never by me directly with real values): confirmed a real completion works end-to-end, confirmed the model/max_tokens pin holds against the live Anthropic API, confirmed the ops-auth token gate works, confirmed the full `generateProposal` and `generateDeepAnalysis` outputs against a synthetic ferretería lead.
- **NOT verified**: anything against the actual deployed `ignea-labs-w8bp` project or its Preview environment — see §1. The `ALLOWED_ORIGINS` env var has never been confirmed to exist, let alone be scoped correctly, because it was checked on the wrong project.
- **Browser click-through of `ops.html`**: never completed. The user was going to run the 12-step list; that never happened before the two-project discovery interrupted the sequence.

**Bottom line: nothing about this branch is production-proven.** The code is unit-tested and tested against a real upstream call through a local proxy. It has never been exercised through the actual `ignea-labs-w8bp` deployment.

---

## 3. TWO PENDING CHANGES — NOT YET MADE

### 3a. Cap `generateProposal` at 3 solutions (small, agreed, not done)

`generateProposal`'s system prompt currently allows "3-5 soluciones específicas" / "3-5 specific solutions" (`js/ops-ai.js`, both ES and EN branches, section 4 of the prompt list). `generateDeepAnalysis` hard-caps at 3 ("Never list more than 3 phases"). After the 3-week timeline floor was added in commit `369aee9`, a real test run against a synthetic ferretería lead produced **5 phases totaling ~23 weeks** — a six-month engagement pitched to a 6-employee hardware store, a hard sell.

**Decision made, not yet executed:** change "3-5" to a hard "3" in both language branches of `generateProposal`'s prompt, matching `generateDeepAnalysis`. Re-run the same ferretería lead afterward and confirm phase count = 3 and total weeks reads credibly (rough target: well under the ~23-week result, ideally in the 8-15 week range given 3 phases × 3-10 weeks each).

### 3b. `generateDeepAnalysis` — queued, not started, real bug found

Confirmed broken for a realistic lead: a real test run hit `stop_reason: max_tokens` (output cut off mid-object) **and separately** failed `JSON.parse` with `Bad control character in string literal in JSON at position 465` — a raw unescaped newline inside a JSON string value, invalid on its own regardless of truncation. **This throws in front of a client today**, for any lead complex enough to need the full 3-phase schema.

Three-part fix, explicitly deferred so it doesn't get rushed:
1. Raise `max_tokens` in the client request (`js/ops-ai.js`, `generateDeepAnalysis`'s `callClaude` call, currently `4000`) **and** raise `MAX_TOKENS_CAP` in `api/claude.js` (currently `4096`) together — raising one without the other does nothing.
2. Replace the regex-strip-then-`JSON.parse` pattern with real structured-JSON enforcement. **Before proposing an approach, check current Anthropic API docs for the actual current parameter/feature name** — do not rely on training-data memory of a parameter name, it may be stale. (As of this session, the mechanism is `output_config.format` with `type: "json_schema"` — verify this is still accurate before using it, since the instruction to check docs first was explicit and deliberate.)
3. Add a defensive fallback for when parsing fails anyway — the failure that matters is an uncaught exception reaching the client, not the parse failure itself. Whatever the fix, it must degrade to something visible and non-crashing, not an unhandled throw.

---

## 4. EXACT NEXT SEQUENCE FOR A FRESH SESSION

Do these in order. Do not skip the verification steps to save time — that's exactly how this session ended up debugging the wrong project for most of its length.

1. **Re-link the CLI to `ignea-labs-w8bp`.** The repo's `.vercel/project.json` currently points at `ignea-labs`. Either `vercel link` interactively and select `ignea-labs-w8bp`, or hand-edit `.vercel/project.json` with the correct `projectId`/`orgId` (get these from `vercel project ls` or the dashboard) — then confirm with `vercel project ls` / `vercel inspect` that subsequent commands are hitting the right project.
2. **Confirm env vars, no values printed.** Run `vercel env ls` against the now-correctly-linked project. Confirm `ANTHROPIC_API_KEY` and `IGNEA_OPS_TOKEN` are present and check which environments (Production/Preview/Development) each is scoped to. Never print, echo, or log the actual values at any point.
3. **Set `ALLOWED_ORIGINS` for Preview only.** Value should be the three origins comma-separated: the two production `ignealabs.com` hosts plus whatever the actual current preview alias is for this branch — confirm the real alias in the Vercel dashboard (Project → this deployment → Domains); do not assume the git-branch-alias pattern guessed earlier in this session (`ignea-labs-git-fix-api-lockdown-...`) is correct — it was never confirmed and `vercel inspect` showed an empty `Aliases` block both times it was checked, against the wrong project besides. **Do not set `ALLOWED_ORIGINS` for Production** — production should stay on the code's hardcoded fallback (the two real origins), proving the fail-closed default actually engages when the var is absent.
4. **Redeploy** (push a trivial commit or use `vercel --prod=false` against the correct project) and confirm the new preview build is the one now under `ignea-labs-w8bp`, not `ignea-labs`.
5. **Twelve-step browser click-through** — the numbered list is already written and was given to the user earlier in this session; re-derive it from the conversation history if not otherwise saved (steps: gate wrong-token/lockout/correct-token, session persistence, all 4 tabs, empty-pipeline caveat, lead detail sub-tabs, both AI generation buttons, PDF download, logout). Run against the Preview URL (once its origin is allowlisted) or, more simply, just wait for step 6.
6. **Merge `fix/api-lockdown` to `main`.**
7. **Production health pass on `www.ignealabs.com` directly** — same twelve steps, plus a real diagnostic submission through the actual public funnel (Q1 → contact → hook), end to end. This is the first time any of this branch's behavior will have been proven against the project that actually matters.
8. Only after all of the above passes: proceed to item 3a (proposal cap) if not already done, then 3b (deep-analysis fix) if requested.

---

## 5. SPRINT 02B — untouched, prompt already written, needs a proposed plan before executing

Not started. The full prompt exists (from the original `IGNEA_SPRINT_02_HOTFIX.md` in `~/Downloads`). Scope:

- Canonicals on all pages pointing at the resolved `www` host (currently point at the apex, which redirects — self-defeating for indexing)
- `robots.txt` + `sitemap.xml` (neither exists)
- `og:image` made absolute (currently relative `/assets/og-image.png` — breaks link previews on WhatsApp/LinkedIn)
- The dead `#s1`–`#s4` stat counters on `index.html` — the IDs don't exist in the markup, so `anim()` throws a `TypeError` on every single homepage load
- WhatsApp number swap — currently a US `+1 949 373 6407` number across all CTAs, wrong for a Nicaragua-facing campaign
- Voice input failure states made visible — `no-speech` currently fails completely silently (tap, speak, nothing); the `voice_unsupported` i18n string exists in both languages but is never rendered by any code path
- Reconstructed diagnostic spec — `IGNEA_DIAGNOSTIC_SPEC_v3.md` doesn't exist anywhere; rebuild it from the 342 orphaned `dx.ind.*`/`dx.q*` i18n keys plus `~/Desktop/encuesta-diagnostico.jsx`, marked explicitly as reconstructed/inferred where the source material doesn't fully specify something

Explicitly out of scope for 02B per the original prompt: theme/color work, the WhatsApp demo, deleting the orphaned i18n keys, wiring Supabase, touching the shipped 4-question flow.

**Do not execute Sprint 02B without proposing a plan and getting explicit approval first** — this was the standing instruction before the session ended.

---

## 6. Things I'd tell my replacement that aren't captured above

- **The user pasted a live Anthropic API key into chat twice**, insisted it be reused rather than rotated ("I can assure you no one has used it," "JUST USE WHAT I GAVE YOU"), and set it in both Vercel and `.env.local` verbatim. I never wrote that value into any file, committed it, or echoed it back — but it exists in this conversation's transcript. If you have visibility into whether it was ever actually rotated, it's worth knowing it wasn't as of this session's end. This is the user's call to make about their own key; it's noted here only so a fresh session doesn't need to re-litigate the same conversation.
- **`.env.local` exists at repo root, is git-ignored, and currently holds real values** the user pasted in. Never read it, cat it, or otherwise surface its contents in conversation — every verification in this session that needed the real values used shell-variable substitution (`source .env.local` inside a single non-echoing Bash call, piped straight into `curl`) so the raw bytes never entered the model's context. Keep using that pattern, not `vercel dev` (which would pull the linked project's cloud env vars into a process I don't control) and not reading the file directly.
- **The local dev harness** (`local-dev-server.mjs`) lives in the session's scratchpad directory, not the repo — it's a throwaway Node server that runs `api/claude.js` and `api/ops-auth.js` as real handlers against `.env.local`, since a plain static server can't execute Vercel serverless functions. It was never committed and doesn't need to be recreated unless useful — the pattern (top-level static imports so module-level rate-limit state persists across requests, load env before anything reads `process.env`) is simple enough to rebuild in five minutes if the scratchpad is gone.
- **Do not add a build step, package manager, or framework to this repo.** It's intentionally vanilla static HTML/CSS/JS per the project's own `CLAUDE.md`.
- **The Supabase integration is still entirely placeholder** (`YOUR_PROJECT_ID.supabase.co`) — every "best-effort" write to Supabase in the codebase is a live DNS failure on every page load that touches it. Out of scope for both this branch and Sprint 02B; it's its own future integrations-sprint item.
- **The ops.html pipeline will likely be empty** on first real click-through unless a genuine lead has gone through the live `/diagnostic` funnel — earlier synthetic test data was seeded into a headless test browser's `localStorage`, which doesn't carry over to a real user's browser profile.
