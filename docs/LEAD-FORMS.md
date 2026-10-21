# Lead forms → email

Every inquiry form on the site emails `contact@expinsoft.com` with the visitor as Reply-To.

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
  -> POST /api/lead  (same origin)
  -> Vercel Serverless Function api/lead.js
       validate + spam checks (api/_lib/lead.js)
       -> Hostinger SMTP as contact@expinsoft.com -> contact@expinsoft.com
```

- Success is shown **only** after the function confirms the email was accepted by SMTP. Failures show an error and keep the visitor's input.
- Spam protection: hidden honeypot field, minimum fill time (2.5 s), max 5 requests per IP per 10 minutes (per instance), Origin allowlist, JSON-only, length limits, control characters stripped (no header injection), link-stuffed messages dropped. Spam gets a fake success response and nothing is sent.

## Configuration (Vercel > Project > Settings > Environment Variables)

| Variable | Required | Default |
|---|---|---|
| `SMTP_PASS` | **yes** (secret) | - password of the `contact@expinsoft.com` mailbox |
| `SMTP_HOST` | no | `smtp.hostinger.com` |
| `SMTP_PORT` | no | `465` |
| `SMTP_USER` | no | `contact@expinsoft.com` |
| `LEAD_TO` | no | `contact@expinsoft.com` |
| `ALLOWED_ORIGINS` | no | `https://expinsoft.com,https://www.expinsoft.com` (the deployment's own `*.vercel.app` URLs are always allowed) |

Redeploy after changing a variable.

## Testing

- Unit tests: `npm run test:lead`.
- Live: submit each form once and confirm the emails arrive; logs are in Vercel > Project > Logs (look for `lead email failed`; a wrong password shows `535 authentication failed`).
- Local end-to-end: `npx vercel dev` (plain `npm run dev` does not serve `/api`).
