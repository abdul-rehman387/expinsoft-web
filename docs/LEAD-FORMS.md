# Lead forms → email

Every inquiry form on the site emails `contact@aeseller.com` with the visitor as Reply-To.

| Form | Where | Form id |
|---|---|---|
| Contact Us | /contact | `contact` |
| Get a Quote | header button (modal, every page) | `quote` |
| Consultation | sidebar on service, portfolio, industries and other pages (`ConsultForm`) | `consult` |
| Start the Conversation | homepage | `home` |

`/checkout` is a payment form (Stripe/PayPal) and is not part of this flow.

## How it works

```
form (src/lib/useLeadForm.js)
  -> POST /api/lead  (same origin; firebase.json hosting rewrite)
  -> Cloud Function submitLead (functions/src/index.ts, us-central1)
       validate + spam checks (functions/src/lead.ts)
       -> Hostinger SMTP as contact@aeseller.com -> contact@aeseller.com
```

- Success is shown **only** after the function confirms the email was accepted by SMTP. Failures show an error and keep the visitor's input.
- Email contains: form, name, email, phone, service, message, page, submission time (UTC and Karachi).
- Spam protection: hidden honeypot field, minimum fill time (2.5 s), max 5 requests per IP per 10 minutes (per instance), Origin allowlist, JSON-only, length limits, control characters stripped (no header injection), link-stuffed messages dropped. Spam gets a fake success response and nothing is sent.
- `maxInstances: 3` caps cost and abuse.

## Configuration

| Setting | Where | Value |
|---|---|---|
| `SMTP_PASS` | Secret Manager (never in git or the browser) | password of the `contact@aeseller.com` mailbox |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `LEAD_TO`, `ALLOWED_ORIGINS` | `functions/.env` (committed, non-secret) | `smtp.hostinger.com`, `465`, `contact@aeseller.com`, ... |

To send leads to a different inbox, change `LEAD_TO` and redeploy the function.

## One-time setup (owner)

1. **Blaze plan.** Cloud Functions require it: Firebase console > project `ae-seler` > Upgrade. Set a budget alert (e.g. $5) under Google Cloud Billing > Budgets. A contact form stays far inside the free tier (2M invocations/month).
2. **Mailbox password as a secret** (you type it; it is never shown or stored in files):
   ```
   npx firebase-tools login
   npx firebase-tools functions:secrets:set SMTP_PASS
   ```
3. **Deploy function + site** (the predeploy step lints and builds the function):
   ```
   npm --prefix functions install
   npm run build
   npx firebase-tools deploy --only functions,hosting
   ```
   Hosting-only GitHub deploys do not deploy the function; redeploy it with `--only functions` after changing anything in `functions/`.
4. **Live test:** submit each form once (Contact, Get a Quote, a Consultation sidebar, homepage) and confirm 4 emails arrive in contact@aeseller.com, then press Reply on one and check it goes to the visitor address you entered. Logs: `npx firebase-tools functions:log --only submitLead`.

If emails don't arrive: check the log for `lead email failed` (wrong password -> `535 authentication failed`), and the mailbox's spam folder. Hostinger requires the sender to be the authenticated mailbox, which is why mail is sent *from* contact@aeseller.com with the visitor as Reply-To.

## Local testing

`functions/.env.local` and `functions/.secret.local` (git-ignored) point the emulator at a local SMTP catcher on `127.0.0.1:1025`:

```
npm run build && npm --prefix functions run build
npx firebase-tools emulators:start --only functions,hosting --project demo-aeseller
```

Unit tests: `npm --prefix functions test`.
