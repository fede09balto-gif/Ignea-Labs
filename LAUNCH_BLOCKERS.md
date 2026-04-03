# Ignea Labs — Launch Blockers
**Must fix before sharing with contact**

---

## BLOCKERS (things that would look broken or unprofessional)

### 1. WhatsApp CTA uses placeholder phone number
- **File:** `js/results.js:276`
- **Issue:** `wa.me/50500000000` — fake number. When a lead finishes the diagnostic and clicks "Agendar llamada", the WhatsApp link goes nowhere.
- **Fix:** Replace `50500000000` with Federico's real WhatsApp number (country code + number, no dashes).
- **Priority:** BLOCKER — this is the conversion point of the entire diagnostic funnel.

### 2. Contact form submission is broken
- **File:** `contact.html:186`
- **Issue:** `formspree.io/f/PLACEHOLDER_ID` — form submits to a non-existent endpoint. Contact form will silently fail or show error.
- **Fix:** Create a Formspree form at formspree.io, get the form ID, replace `PLACEHOLDER_ID`.
- **Priority:** BLOCKER — the contact page is one of 4 main nav links.

---

## HIGH PRIORITY (should fix, won't crash but looks incomplete)

### 3. No WhatsApp link on contact page
- **File:** `contact.html`
- **Issue:** Email is shown but no WhatsApp link. In Nicaragua, WhatsApp is the primary business communication channel.
- **Fix:** Add a WhatsApp button/link below the email: `<a href="https://wa.me/505XXXXXXXX">WhatsApp: +505 XXXX-XXXX</a>`
- **Priority:** HIGH — missing a key contact method for the market.

### 4. No language toggle in ops dashboard
- **File:** `ops.html`
- **Issue:** The ops dashboard has no visible language toggle. All i18n translations exist but there's no UI to switch between ES/EN.
- **Fix:** Add language toggle buttons to the ops topbar (same as public pages).
- **Priority:** MEDIUM — ops is internal, currently defaults to ES which is fine for Federico. Fix if sharing with English-speaking partners.

---

## OPTIONAL (nice to have, won't affect first impression)

### 5. Google Places API not configured
- **File:** `js/ops-scraper.js:10`
- **Issue:** Scraper geocoding/Places data disabled. Web scraping still works.
- **Priority:** LOW — internal tool, web scraping covers 90% of use cases.

### 6. Google Sheets sync not configured
- **File:** `js/sheets-sync.js:10`
- **Issue:** Placeholder URL. Fails silently — no impact on user experience.
- **Priority:** LOW — can set up later.

### 7. No Calendly integration
- **Issue:** "Agendar llamada" goes to WhatsApp, not Calendly. This is fine for now.
- **Priority:** LOW — WhatsApp is more natural for Nicaraguan market.

### 8. No Google OAuth for diagnostic
- **Issue:** No "Sign in with Google" option. Users go directly to info form.
- **Priority:** LOW — manual form entry works fine. OAuth is a future enhancement.

### 9. Pipeline empty state could be clearer
- **File:** `ops.html` pipeline columns
- **Issue:** Empty columns just show blank space. Could show "No leads in this stage" message.
- **Priority:** LOW — internal tool, not visible to clients.

---

## WHAT NEEDS FIXING BEFORE SHARING

| # | Fix | Time | Impact |
|---|-----|------|--------|
| 1 | Replace WhatsApp placeholder number | 1 min | BLOCKER — diagnostic funnel broken |
| 2 | Set up Formspree + replace placeholder | 5 min | BLOCKER — contact form broken |
| 3 | Add WhatsApp link to contact page | 2 min | HIGH — missing key contact method |

**Total time to fix blockers: ~8 minutes**
