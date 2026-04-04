# Ignea Labs — Supabase Backend Setup

## Architecture

```
Frontend (static HTML/JS)
  ↓ POST via PostgREST (anon key)
Supabase DB (4 tables: diagnostics, contacts, solutions, engagements)
  ↓ Edge Function triggered from frontend
on-diagnostic-complete
  ├─→ Resend (email notification < 60s)
  ├─→ Claude API (AI analysis)
  ├─→ diagnostics.ai_analysis (JSONB update)
  └─→ engagements (new CRM row)
```

- **Source of truth**: Supabase PostgreSQL
- **Fallback**: sessionStorage (if Supabase is unreachable, diagnostic flow works normally)
- **Sync**: Google Sheets mirror (best-effort, optional)

## Tables

| Table | Purpose | Public Access |
|-------|---------|---------------|
| `diagnostics` | Every diagnostic submission + AI analysis | anon INSERT only |
| `contacts` | Contact form submissions | anon INSERT only |
| `solutions` | Industry-specific solution recommendations | anon SELECT only |
| `engagements` | CRM pipeline tracking | service_role only |

---

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com), sign in, create a new project.
Save the database password.

### 2. Run the Schema

1. Open **SQL Editor** in Supabase Dashboard.
2. Paste contents of `schema.sql` → **Run**.
3. Paste contents of `seed-solutions.sql` → **Run**.

This creates all 4 tables with indexes, RLS policies, and seeds ~76 solution rows.

### 3. Get Credentials

In **Settings > API**:
- Copy **Project URL** (`https://xxxxxxxxxxxx.supabase.co`)
- Copy **anon / public** key (the `eyJ...` JWT string)
- Copy **service_role** key (for Edge Functions only — never expose in frontend)

### 4. Configure Frontend

Edit `js/supabase-config.js`:
```javascript
var PROJECT_URL = 'https://xxxxxxxxxxxx.supabase.co';  // ← your Project URL
var URL = PROJECT_URL + '/rest/v1';
var KEY = 'eyJ...';                                     // ← your anon key
var EDGE_FN_URL = PROJECT_URL + '/functions/v1';
```

### 5. Deploy Edge Function

Install the Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Link to your project:
```bash
cd supabase
supabase login
supabase link --project-ref xxxxxxxxxxxx
```

Set required secrets:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
supabase secrets set NOTIFY_EMAIL=team@ignealabs.com
supabase secrets set SITE_URL=https://ignealabs.com
```

Deploy:
```bash
supabase functions deploy on-diagnostic-complete
```

### 6. Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain (`ignealabs.com`)
3. Create an API key
4. Set it as `RESEND_API_KEY` secret (step 5 above)

### 7. Google Sheets Sync (Optional)

1. Open `google-apps-script/sync.gs` in Google Apps Script editor
2. Deploy as **Web App**: Execute as **Me**, Access: **Anyone**
3. Copy the deployment URL
4. Paste into `js/sheets-sync.js` as the `SHEETS_SYNC_URL` value

If `SHEETS_SYNC_URL` is left as placeholder, sync is silently skipped.

---

## Data Flow

### Diagnostic Submission
1. User completes diagnostic on `diagnostic.html`
2. `submitDiag()` calculates scores client-side, saves to sessionStorage
3. Inserts row into `diagnostics` table via PostgREST
4. On success, stores `diagnostic_id` in sessionStorage
5. Fires POST to `on-diagnostic-complete` Edge Function (fire-and-forget)
6. Mirrors data to Google Sheet (best-effort)
7. Redirects to `results.html`

### Edge Function (`on-diagnostic-complete`)
1. Receives `{ diagnostic_id }` from frontend
2. Fetches full row using service_role key
3. **In parallel**:
   - Sends email notification via Resend
   - Calls Claude API (claude-sonnet-4-20250514) for AI analysis
4. Updates `diagnostics.ai_analysis` with Claude's response
5. Creates `engagements` row for CRM pipeline

### Results Page
1. Renders standard report from sessionStorage (immediate)
2. If `diagnostic_id` exists, polls Supabase every 3s for `ai_analysis`
3. When AI analysis arrives, fades in bonus "AI ANALYSIS" section
4. If AI never arrives (timeout after ~30s), report is still complete

### Contact Form
1. Submits to Formspree (primary)
2. On success, mirrors to `contacts` table (best-effort)

---

## RLS Policies

| Table | anon | service_role |
|-------|------|-------------|
| diagnostics | INSERT | ALL |
| contacts | INSERT | ALL |
| solutions | SELECT | ALL |
| engagements | (none) | ALL |

---

## Testing Checklist

- [ ] Run `schema.sql` — no errors
- [ ] Run `seed-solutions.sql` — verify rows: `SELECT count(*) FROM solutions;` → 76+
- [ ] Complete diagnostic → row in `diagnostics` table
- [ ] Wrong API key → diagnostic still works (sessionStorage fallback)
- [ ] Edge Function deployed → email arrives within 60s
- [ ] Edge Function → `ai_analysis` column populated
- [ ] Results page → AI insights section fades in
- [ ] Contact form → row in `contacts` table
- [ ] `SELECT * FROM solutions WHERE industry='restaurant'` → 12 rows (3 per stream)
- [ ] RLS: anon cannot SELECT from engagements
