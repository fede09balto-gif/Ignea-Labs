# Onda AI — Supabase Setup

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), sign in, and create a new project.
Choose a strong database password and save it somewhere safe.

## 2. Run the schema

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Paste the entire contents of `schema.sql`.
4. Click **Run**.

All tables (`ops_users`, `leads`, `lead_activity`, `pricing_calculations`) will be created with indexes and Row Level Security enabled.

## 3. Get your project credentials

1. Go to **Settings > API** in your Supabase project.
2. Copy the **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`).
3. Copy the **anon / public** key (the long JWT string under "Project API keys").

## 4. Configure js/supabase-config.js

Open `js/supabase-config.js` and replace the two placeholders:

```javascript
var SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';   // ← your Project URL
var SUPABASE_ANON_KEY = 'eyJ...';                         // ← your anon key
```

## 5. Add the first admin user

In the Supabase SQL Editor, run:

```sql
INSERT INTO ops_users (name, email, password_hash, role, permissions)
VALUES ('Admin', 'admin@onda.ai', '<SHA-256 hash of your access code>', 'admin', '{"read","write","admin"}');
```

To generate a SHA-256 hash of your chosen access code, run in your terminal:

```bash
echo -n "your-access-code" | shasum -a 256
```

Copy the hex string (without the trailing ` -`) and paste it as the `password_hash` value.

## 6. Configure Google Sheets sync (optional)

1. Open `google-apps-script/sync.gs` in the Google Apps Script editor.
2. Deploy as a **Web App**: Execute as **Me**, Access: **Anyone**.
3. Copy the deployment URL.
4. Paste it into `js/sheets-sync.js` as the `SHEETS_SYNC_URL` value.

If `SHEETS_SYNC_URL` is left as the placeholder, the Sheets sync is silently skipped — Supabase remains the source of truth.

## Architecture Notes

- Leads are written to Supabase on every diagnostic submission from `diagnostic.html`.
- The write is fire-and-forget with silent failure — sessionStorage always has the data as a fallback.
- The ops dashboard (`ops.html`) reads and writes leads exclusively through `js/supabase-config.js`.
- RLS policies are permissive (`USING (true)`) for now; tighten them once Supabase Auth is integrated.
