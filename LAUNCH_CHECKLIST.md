# Launch Checklist — Ignea Labs

## Supabase
- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Run `supabase/seed-solutions.sql` in SQL Editor
- [ ] Copy Project URL + anon key into `js/supabase-config.js`
- [ ] Deploy Edge Function: `supabase functions deploy on-diagnostic-complete`
- [ ] Set secrets: `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `NOTIFY_EMAIL`, `SITE_URL`

## Resend
- [ ] Create Resend account, verify `ignealabs.com` domain
- [ ] Create API key, set as `RESEND_API_KEY` secret

## Formspree
- [ ] Create Formspree form
- [ ] Replace `PLACEHOLDER_ID` in `contact.html` with real form ID

## Analytics
- [ ] Verify Plausible script loads on all 6 pages
- [ ] Confirm `ignealabs.com` domain is set up in Plausible dashboard
- [ ] (Optional) Add Google Analytics gtag if needed

## Domain & Hosting
- [ ] Deploy to Vercel (static site, no build step)
- [ ] Point `ignealabs.com` DNS to Vercel
- [ ] Verify SSL certificate is active
- [ ] Verify all canonical URLs reference `https://ignealabs.com/`

## Content
- [ ] Replace `[FOUNDER NAME]` and `[BIO]` in index.html about section
- [ ] Replace WhatsApp number (`1787XXXXXXX`) in results.js
- [ ] Add real Calendly URL in results.html
- [ ] Replace OG image (`/assets/og-image.png`) with final design
- [ ] (Optional) Set up Google Sheets sync — deploy `google-apps-script/sync.gs`

## Testing
- [ ] Complete full diagnostic flow end-to-end
- [ ] Verify Supabase row created in `diagnostics` table
- [ ] Verify email notification arrives within 60s
- [ ] Verify AI analysis populates on results page
- [ ] Test contact form submission
- [ ] Test language toggle (ES/EN) on every page
- [ ] Test mobile layout at 375px width
- [ ] Test PDF download on results page
- [ ] Verify 404 page works
