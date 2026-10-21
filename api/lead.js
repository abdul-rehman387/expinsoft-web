/**
 * Website lead forms -> email notification (Vercel Serverless Function).
 *
 * POST /api/lead is same origin, so no CORS. Mail goes out through Hostinger
 * SMTP as the site mailbox; the visitor's address is set as Reply-To.
 * The SMTP password is the Vercel environment variable SMTP_PASS and never
 * reaches the browser or git.
 */
import nodemailer from 'nodemailer'
import { formatEmail, validate } from './_lib/lead.js'

const env = (name, fallback) => process.env[name] || fallback

// Production domains, plus this deployment's own *.vercel.app URLs so preview
// deployments can be tested.
function allowedOrigins() {
  const list = env('ALLOWED_ORIGINS', 'https://expinsoft.com,https://www.expinsoft.com')
    .split(',').map(s => s.trim()).filter(Boolean)
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) list.push(`https://${host}`)
  }
  return list
}

// Per-instance sliding window: a cheap abuse ceiling, not a hard guarantee.
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5
const hits = new Map()

function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > RATE_MAX
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  return (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.headers['x-real-ip'] || 'unknown'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' })
    return
  }
  const origin = req.headers.origin || ''
  if (!allowedOrigins().includes(origin)) {
    console.warn('lead rejected: origin', origin)
    res.status(403).json({ ok: false, error: 'Forbidden.' })
    return
  }
  if (!String(req.headers['content-type'] || '').startsWith('application/json') ||
      !req.body || typeof req.body !== 'object') {
    res.status(415).json({ ok: false, error: 'Expected JSON.' })
    return
  }
  if (rateLimited(clientIp(req), Date.now())) {
    res.status(429).json({ ok: false, error: 'Too many submissions. Please try again in a few minutes.' })
    return
  }

  const verdict = validate(req.body)
  if (verdict.ok === 'spam') {
    // Look successful so bots learn nothing; nothing is sent.
    console.info('lead dropped as spam', verdict.reason)
    res.json({ ok: true })
    return
  }
  if (verdict.ok === false) {
    res.status(verdict.status).json({ ok: false, error: verdict.error })
    return
  }

  const lead = verdict.lead
  const { subject, text, html } = formatEmail(lead, new Date())
  const user = env('SMTP_USER', 'contact@expinsoft.com')
  const port = Number(env('SMTP_PORT', '465'))
  try {
    if (!process.env.SMTP_PASS) throw new Error('SMTP_PASS is not set')
    const transport = nodemailer.createTransport({
      host: env('SMTP_HOST', 'smtp.hostinger.com'),
      port,
      secure: port === 465,
      auth: { user, pass: process.env.SMTP_PASS },
    })
    const info = await transport.sendMail({
      from: { name: 'ExpinSoft Website', address: user },
      to: env('LEAD_TO', 'contact@expinsoft.com'),
      replyTo: { name: lead.name, address: lead.email },
      subject,
      text,
      html,
    })
    console.info('lead sent', lead.form, info.messageId)
    res.json({ ok: true })
  } catch (err) {
    console.error('lead email failed', err)
    res.status(502).json({ ok: false, error: "We couldn't send your message right now. Please email contact@expinsoft.com directly." })
  }
}
