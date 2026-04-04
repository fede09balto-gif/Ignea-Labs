# Ignea Labs — AI Infrastructure for Puerto Rico SMBs

Static website + Supabase backend for Ignea Labs, an AI consultancy targeting small-to-medium businesses in Puerto Rico.

## Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Backend**: Supabase (PostgreSQL + PostgREST + Edge Functions)
- **Email**: Resend
- **AI**: Claude API (via Supabase Edge Function)
- **Analytics**: Plausible
- **Forms**: Formspree
- **Deployment**: Vercel (static)

## Local Development

```bash
python3 -m http.server 8765
# Open http://localhost:8765
```

No build step required.

## Deployment (Vercel)

1. Connect repo to Vercel
2. Framework: Other (static)
3. Build command: (none)
4. Output directory: `.`
5. Deploy

## Supabase Setup

See `supabase/README.md` for full setup instructions:
1. Run `supabase/schema.sql`
2. Run `supabase/seed-solutions.sql`
3. Update `js/supabase-config.js` with credentials
4. Deploy Edge Function
5. Set secrets

## File Structure

```
index.html          Homepage
diagnostic.html     11-question AI diagnostic
results.html        Scored results + AI insights
manifesto.html      Company manifesto
contact.html        Contact form
404.html            404 page
css/shared.css      Design system + shared styles
css/components.css  Score gauge + dimension bars
js/i18n.js          Bilingual translations (ES/EN)
js/diagnostic.js    Diagnostic flow logic
js/scoring.js       Score calculation engine
js/results.js       Results rendering + AI polling
js/analytics.js     Plausible/GA event wrapper
js/supabase-config.js  Supabase REST client
js/sheets-sync.js   Google Sheets mirror (optional)
js/grid-bg.js       Gradient dots background
js/terminal.js      Terminal typewriter animation
supabase/           Schema, seeds, Edge Functions
```

## Analytics Events

| Event | Trigger |
|-------|---------|
| `diagnostic_started` | Click "Start Diagnostic" |
| `diagnostic_info_completed` | Submit contact info |
| `diagnostic_industry_selected` | Industry chosen |
| `diagnostic_q[N]_completed` | Complete question N |
| `diagnostic_industry_branch_completed` | Complete industry question |
| `diagnostic_completed` | Submit final question |
| `results_viewed` | Results page loaded |
| `results_pdf_downloaded` | PDF button clicked |
| `results_cta_calendly` | Calendly CTA clicked |
| `results_cta_whatsapp` | WhatsApp CTA clicked |
| `calculator_used` | Homepage calculator used |
| `language_toggled` | Language switched |
