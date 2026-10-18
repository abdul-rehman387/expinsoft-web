/**
 * Website lead forms -> email notification to contact@aeseller.com.
 *
 * Firebase Hosting rewrites POST /api/lead to this function (same origin, so
 * no CORS). Mail goes out through Hostinger SMTP as the site mailbox; the
 * visitor's address is set as Reply-To. The SMTP password lives in Secret
 * Manager (SMTP_PASS) and never reaches the browser or git.
 */
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {defineSecret, defineString} from "firebase-functions/params";
import nodemailer from "nodemailer";
import {formatEmail, validate} from "./lead.js";

// Cost and abuse ceiling: a contact form never needs more than this.
setGlobalOptions({maxInstances: 3});

const SMTP_PASS = defineSecret("SMTP_PASS");
const SMTP_HOST = defineString("SMTP_HOST", {default: "smtp.hostinger.com"});
const SMTP_PORT = defineString("SMTP_PORT", {default: "465"});
const SMTP_USER = defineString("SMTP_USER",
  {default: "contact@aeseller.com"});
const LEAD_TO = defineString("LEAD_TO", {default: "contact@aeseller.com"});
const ALLOWED_ORIGINS = defineString("ALLOWED_ORIGINS", {
  default: "https://aeseller.com,https://ae-seler.web.app," +
    "https://ae-seler.firebaseapp.com",
});

// Per-instance sliding window. With maxInstances 3 this bounds abuse cheaply.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

/**
 * Records a request from an IP and reports whether it is over the limit.
 * @param {string} ip Client IP.
 * @param {number} now Current time in ms.
 * @return {boolean} True when the IP exceeded the limit.
 */
function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_MAX;
}

export const submitLead = onRequest(
  {secrets: [SMTP_PASS], region: "us-central1", timeoutSeconds: 30,
    memory: "256MiB"},
  async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.status(405).json({ok: false, error: "Method not allowed."});
      return;
    }
    const origin = req.get("origin") || "";
    const allowed = ALLOWED_ORIGINS.value().split(",").map((s) => s.trim());
    if (!allowed.includes(origin)) {
      logger.warn("lead rejected: origin", {origin});
      res.status(403).json({ok: false, error: "Forbidden."});
      return;
    }
    if (!req.is("application/json") || typeof req.body !== "object") {
      res.status(415).json({ok: false, error: "Expected JSON."});
      return;
    }
    if (rateLimited(req.ip || "unknown", Date.now())) {
      res.status(429).json({ok: false,
        error: "Too many submissions. Please try again in a few minutes."});
      return;
    }

    const verdict = validate(req.body as Record<string, unknown>);
    if (verdict.ok === "spam") {
      // Look successful so bots learn nothing; nothing is sent.
      logger.info("lead dropped as spam", {reason: verdict.reason});
      res.json({ok: true});
      return;
    }
    if (verdict.ok === false) {
      res.status(verdict.status).json({ok: false, error: verdict.error});
      return;
    }

    const lead = verdict.lead;
    const {subject, text, html} = formatEmail(lead, new Date());
    const port = Number(SMTP_PORT.value());
    try {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST.value(),
        port,
        secure: port === 465,
        auth: {user: SMTP_USER.value(), pass: SMTP_PASS.value()},
      });
      const info = await transport.sendMail({
        from: {name: "AE Seller Website", address: SMTP_USER.value()},
        to: LEAD_TO.value(),
        replyTo: {name: lead.name, address: lead.email},
        subject,
        text,
        html,
      });
      logger.info("lead sent", {form: lead.form, messageId: info.messageId});
      res.json({ok: true});
    } catch (err) {
      logger.error("lead email failed", err);
      res.status(502).json({ok: false, error: "We couldn't send your " +
        "message right now. Please email contact@aeseller.com directly."});
    }
  },
);
