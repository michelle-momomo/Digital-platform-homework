# Results sheet

The game still plays if this is skipped. Runs are saved in the browser, and `/admin` says the backend is not configured.

## Sheet

1. Create a Google Sheet.
2. Extensions → Apps Script.
3. Paste `docs/apps-script.gs` and save.
4. Deploy → New deployment → Web app.
5. Execute as **Me**. Who has access: **Anyone**.
6. Copy the web app URL.

## Vercel

On the preview project, set:

- `VITE_RESULTS_ENDPOINT` = that web app URL
- `VITE_ADMIN_PASSCODE` = a passcode you choose

Redeploy so Vite can inline the variables. Then open `/admin`, enter the passcode, and play one level. A row should appear on the Results tab.

The game sends JSON with `Content-Type: text/plain` so the browser does not send a CORS preflight. A failed post never stops the level.