/**
 * Pure helpers for website lead submissions: validation, spam heuristics and
 * email formatting. No Firebase or network dependencies, so they unit-test.
 */

export const FORMS = {
  contact: "Contact Us",
  quote: "Get a Quote",
  consult: "Consultation",
  home: "Homepage Contact",
} as const;

export type FormId = keyof typeof FORMS;

export interface Lead {
  form: FormId;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  page: string;
}

export type Verdict =
  | {ok: true; lead: Lead}
  | {ok: false; status: number; error: string}
  | {ok: "spam"; reason: string};

const LIMITS = {name: 120, email: 254, phone: 40, service: 120,
  message: 5000, page: 300};

// Faster than this from first render to submit is treated as a bot.
export const MIN_FILL_MS = 2500;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

/**
 * Trims a value to a single-line string within a length limit.
 * Strips control characters so values are safe in headers.
 * @param {unknown} v Raw value.
 * @param {number} max Maximum length.
 * @return {string} Clean string.
 */
export function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
    .trim().slice(0, max);
}

/**
 * Validates a raw JSON body from the website forms.
 * @param {Record<string, unknown>} body Parsed request body.
 * @return {Verdict} Accepted lead, a client error, or a spam verdict.
 */
export function validate(body: Record<string, unknown>): Verdict {
  // Honeypot: hidden from people, filled in by naive bots.
  if (clean(body.website, 200)) return {ok: "spam", reason: "honeypot"};
  const elapsed = Number(body.elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return {ok: "spam", reason: "too-fast"};
  }

  const form = clean(body.form, 20) as FormId;
  if (!(form in FORMS)) {
    return {ok: false, status: 400, error: "Unknown form."};
  }

  const lead: Lead = {
    form,
    name: clean(body.name, LIMITS.name).replace(/[\r\n]+/g, " "),
    email: clean(body.email, LIMITS.email).replace(/[\r\n]+/g, ""),
    phone: clean(body.phone, LIMITS.phone).replace(/[\r\n]+/g, " "),
    service: clean(body.service, LIMITS.service).replace(/[\r\n]+/g, " "),
    message: typeof body.message === "string" ?
      body.message.replace(/\r\n/g, "\n").trim().slice(0, LIMITS.message) :
      "",
    page: clean(body.page, LIMITS.page),
  };

  if (!lead.name) {
    return {ok: false, status: 400, error: "Please enter your name."};
  }
  if (!EMAIL_RE.test(lead.email)) {
    return {ok: false, status: 400,
      error: "Please enter a valid email address."};
  }
  if ((form === "contact" || form === "quote") && !lead.service) {
    return {ok: false, status: 400, error: "Please select a service."};
  }
  // Link-stuffed messages are almost always spam.
  if ((lead.message.match(/https?:\/\//gi) || []).length > 3) {
    return {ok: "spam", reason: "links"};
  }
  return {ok: true, lead};
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Builds the notification email for a lead.
 * @param {Lead} lead Validated lead.
 * @param {Date} at Submission time.
 * @return {{subject: string, text: string, html: string}} Email parts.
 */
export function formatEmail(lead: Lead, at: Date) {
  const utc = at.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const pkt = at.toLocaleString("en-GB", {timeZone: "Asia/Karachi",
    dateStyle: "medium", timeStyle: "short"}) + " (Karachi)";
  const rows: [string, string][] = [
    ["Form", FORMS[lead.form]],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "-"],
    ["Service", lead.service || "-"],
    ["Message", lead.message || "-"],
    ["Page", lead.page || "-"],
    ["Submitted", `${utc} / ${pkt}`],
  ];
  const subject = `New ${FORMS[lead.form]} enquiry from ${lead.name}`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    "\n\nReply to this email to respond to the visitor directly.\n";
  const html = "<table cellpadding=\"8\" style=\"border-collapse:collapse;" +
    "font-family:Arial,sans-serif;font-size:14px\">" +
    rows.map(([k, v]) => "<tr><th align=\"left\" valign=\"top\" " +
      "style=\"border-bottom:1px solid #eee;color:#55657A\">" + k +
      "</th><td style=\"border-bottom:1px solid #eee;white-space:pre-wrap\">" +
      esc(v) + "</td></tr>").join("") +
    "</table><p style=\"font-family:Arial,sans-serif;color:#55657A\">" +
    "Reply to this email to respond to the visitor directly.</p>";
  return {subject, text, html};
}
