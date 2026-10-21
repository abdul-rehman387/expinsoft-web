// Unit tests for lead validation and email formatting. Run: npm run test:lead
import test from "node:test";
import assert from "node:assert/strict";
import {validate, formatEmail} from "../api/_lib/lead.js";

const base = {
  form: "contact", name: "Jane Doe", email: "jane@example.com",
  phone: "+1 555", service: "Web Development", message: "Hi,\nneed a site",
  page: "/contact", elapsedMs: 5000, website: "",
};

test("accepts a complete submission", () => {
  const v = validate(base);
  assert.equal(v.ok, true);
  assert.equal(v.lead.email, "jane@example.com");
});

test("silently drops spam", () => {
  assert.equal(validate({...base, website: "http://x"}).ok, "spam");
  assert.equal(validate({...base, elapsedMs: 800}).ok, "spam");
  assert.equal(validate({...base, elapsedMs: undefined}).ok, "spam");
  const links = "http://a http://b http://c http://d";
  assert.equal(validate({...base, message: links}).ok, "spam");
});

test("rejects invalid input with a message", () => {
  for (const bad of [{email: "nope"}, {name: "  "}, {form: "evil"},
    {service: ""}]) {
    const v = validate({...base, ...bad});
    assert.equal(v.ok, false);
    assert.equal(v.status, 400);
  }
});

test("service is optional on consult and home forms", () => {
  assert.equal(validate({...base, form: "consult", service: ""}).ok, true);
  assert.equal(validate({...base, form: "home", service: ""}).ok, true);
});

test("strips header injection and truncates long input", () => {
  const v = validate({...base, name: "Eve\r\nBcc: x@y.com",
    message: "x".repeat(9000)});
  assert.equal(v.ok, true);
  assert.doesNotMatch(v.lead.name, /[\r\n]/);
  assert.equal(v.lead.message.length, 5000);
});

test("email lists every field and escapes HTML", () => {
  const e = formatEmail({...base, name: "<b>Jane</b>", form: "quote"},
    new Date("2026-10-18T09:30:00Z"));
  assert.equal(e.subject, "New Get a Quote enquiry from <b>Jane</b>");
  for (const s of ["Name: <b>Jane</b>", "Email: jane@example.com",
    "Phone: +1 555", "Service: Web Development", "Page: /contact",
    "2026-10-18 09:30:00 UTC", "(Karachi)"]) {
    assert.ok(e.text.includes(s), s);
  }
  assert.ok(e.html.includes("&lt;b&gt;Jane"));
  assert.ok(!e.html.includes("<b>Jane"));
});
