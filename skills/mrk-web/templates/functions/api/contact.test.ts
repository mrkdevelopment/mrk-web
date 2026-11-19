/**
 * Tests for the enquiry endpoint. fetch is replaced with a stub, so nothing leaves the machine.
 * Run with Node's own runner (Node 22.18+ runs TypeScript directly):
 *   node --test functions/api/contact.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, webhookFor, type Env } from './contact.ts';
import { HONEYPOT_FIELD, readEnquiry } from '../../src/lib/enquiry.ts';

const SITE = 'https://www.example.com';
const BASE: Env = { CONTACT_TO: 'inbox@example.com', CONTACT_FROM: 'Example Site <forms@example.com>' };
const MAILGUN: Env = { ...BASE, EMAIL_PROVIDER: 'mailgun', MAILGUN_API_KEY: 'test-key', MAILGUN_DOMAIN: 'mg.example.com' };
const VALID = { name: 'Jo Citizen', email: 'jo@example.com', message: 'Hello there', form: 'contact' };

interface Call {
  url: string;
  init: RequestInit;
}

/** What the stub answers, keyed by a piece of the URL; anything else gets 200 {} */
type Answers = Record<string, () => Response | Promise<Response>>;

async function post(
  body: unknown,
  env: Env,
  { answers = {}, form = false, headers = {} }: { answers?: Answers; form?: boolean; headers?: Record<string, string> } = {}
) {
  const calls: Call[] = [];
  const pending: Promise<unknown>[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ url, init });
    const match = Object.keys(answers).find((part) => url.includes(part));
    return match ? answers[match]() : new Response('{}', { status: 200 });
  }) as typeof fetch;

  const request = new Request(`${SITE}/api/contact`, {
    method: 'POST',
    headers: {
      Origin: SITE,
      'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json',
      ...(form ? {} : { Accept: 'application/json' }),
      ...headers,
    },
    body: form ? new URLSearchParams(body as Record<string, string>) : JSON.stringify(body),
  });
  const res = await onRequestPost({ request, env, waitUntil: (p) => pending.push(p) });
  await Promise.all(pending);
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    // HTML or empty body
  }
  return { status: res.status, location: res.headers.get('Location'), text, json, calls };
}

const sentTo = (calls: Call[], part: string) => calls.filter((c) => c.url.includes(part));

// --- providers ---------------------------------------------------------------------------------

test('mailgun: posts a form with Basic auth to the US host', async () => {
  const { status, calls } = await post(VALID, MAILGUN);
  assert.equal(status, 200);
  const [call] = sentTo(calls, 'mailgun');
  assert.equal(call.url, 'https://api.mailgun.net/v3/mg.example.com/messages');
  assert.equal(new Headers(call.init.headers).get('Authorization'), `Basic ${btoa('api:test-key')}`);
  const body = call.init.body as FormData;
  assert.equal(body.get('to'), 'inbox@example.com');
  assert.equal(body.get('h:Reply-To'), 'jo@example.com');
  assert.match(String(body.get('text')), /Hello there/);
});

test('mailgun: MAILGUN_REGION=eu uses the EU host', async () => {
  const { calls } = await post(VALID, { ...MAILGUN, MAILGUN_REGION: 'EU' });
  assert.equal(sentTo(calls, 'mailgun')[0].url, 'https://api.eu.mailgun.net/v3/mg.example.com/messages');
});

test('sendgrid: posts JSON with Bearer auth and accepts 202', async () => {
  const env: Env = { ...BASE, EMAIL_PROVIDER: 'sendgrid', SENDGRID_API_KEY: 'test-key' };
  const { status, calls } = await post(VALID, env, { answers: { sendgrid: () => new Response(null, { status: 202 }) } });
  assert.equal(status, 200);
  const [call] = sentTo(calls, 'sendgrid');
  assert.equal(call.url, 'https://api.sendgrid.com/v3/mail/send');
  assert.equal(new Headers(call.init.headers).get('Authorization'), 'Bearer test-key');
  const body = JSON.parse(String(call.init.body));
  assert.deepEqual(body.personalizations, [{ to: [{ email: 'inbox@example.com' }] }]);
  assert.deepEqual(body.from, { email: 'forms@example.com', name: 'Example Site' });
  assert.deepEqual(body.reply_to, { email: 'jo@example.com' });
  assert.equal(body.content[0].type, 'text/plain');
});

test('cloudflare: posts JSON to the Email Service REST API', async () => {
  const env: Env = { ...BASE, EMAIL_PROVIDER: 'cloudflare', CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_EMAIL_API_TOKEN: 'test-token' };
  const { status, calls } = await post(VALID, env);
  assert.equal(status, 200);
  const [call] = sentTo(calls, 'api.cloudflare.com');
  assert.equal(call.url, 'https://api.cloudflare.com/client/v4/accounts/acct/email/sending/send');
  assert.equal(new Headers(call.init.headers).get('Authorization'), 'Bearer test-token');
  const body = JSON.parse(String(call.init.body));
  assert.deepEqual(body.to, ['inbox@example.com']);
  assert.equal(body.reply_to, 'jo@example.com');
});

test('a provider error becomes a plain 502: no provider text or secrets reach the visitor', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const { status, text } = await post(VALID, { ...MAILGUN, CONTACT_FALLBACK_EMAIL: 'hello@example.com' }, {
      answers: { mailgun: () => new Response('Forbidden: domain mg.example.com key test-key', { status: 401 }) },
    });
    assert.equal(status, 502);
    assert.doesNotMatch(text, /Forbidden|test-key|mg\.example\.com/);
    assert.match(text, /mailto:hello@example.com/);
  } finally {
    console.error = original;
  }
});

// --- not configured ------------------------------------------------------------------------------

test('unconfigured email → 503 with the mailto fallback, and nothing is sent', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    for (const env of [{}, { ...BASE, EMAIL_PROVIDER: 'mailgun' }, { ...MAILGUN, EMAIL_PROVIDER: 'carrier-pigeon' }] as Env[]) {
      const { status, json, calls } = await post(VALID, { ...env, CONTACT_FALLBACK_EMAIL: 'hello@example.com' });
      assert.equal(status, 503);
      assert.equal(json.mailto, 'mailto:hello@example.com');
      assert.equal(calls.length, 0);
    }
  } finally {
    console.error = original;
  }
});

// --- honeypot, bad input, origin -----------------------------------------------------------------

test('honeypot filled → 200 and nothing is sent (JSON and plain form posts)', async () => {
  const json = await post({ ...VALID, [HONEYPOT_FIELD]: 'spam' }, MAILGUN);
  assert.equal(json.status, 200);
  assert.equal(json.calls.length, 0);
  const form = await post({ ...VALID, [HONEYPOT_FIELD]: 'spam', redirect: '/thank-you/' }, MAILGUN, { form: true });
  assert.equal(form.status, 303);
  assert.equal(form.calls.length, 0);
});

test('bad input → 400 with one message per field', async () => {
  const { status, json, calls } = await post({ name: '', email: 'jo@example', message: '', phone: 'call me' }, MAILGUN);
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(json.errors as object).sort(), ['email', 'message', 'name', 'phone']);
  assert.equal(calls.length, 0);
});

test('a body that is not JSON → 400', async () => {
  const request = new Request(`${SITE}/api/contact`, { method: 'POST', headers: { Origin: SITE, 'Content-Type': 'application/json' }, body: '{nope' });
  const res = await onRequestPost({ request, env: MAILGUN, waitUntil: () => {} });
  assert.equal(res.status, 400);
});

test('another website posting → 403', async () => {
  const { status, calls } = await post(VALID, MAILGUN, { headers: { Origin: 'https://elsewhere.example.net' } });
  assert.equal(status, 403);
  assert.equal(calls.length, 0);
});

test('a plain form post redirects to the thank-you page, and only to a path on this site', async () => {
  const ok = await post({ ...VALID, redirect: '/thanks/' }, MAILGUN, { form: true });
  assert.equal(ok.status, 303);
  assert.equal(ok.location, '/thanks/');
  const evil = await post({ ...VALID, redirect: '//evil.example.net/' }, MAILGUN, { form: true });
  assert.equal(evil.location, '/thank-you/');
  const bad = await post({ ...VALID, email: 'nope' }, MAILGUN, { form: true });
  assert.equal(bad.status, 400);
  assert.match(bad.text, /<li>Please check your email address/);
});

// --- Turnstile -----------------------------------------------------------------------------------

test('Turnstile off: no siteverify call', async () => {
  const { calls } = await post(VALID, MAILGUN);
  assert.equal(sentTo(calls, 'siteverify').length, 0);
});

test('Turnstile on and passing: token is verified, then the email is sent', async () => {
  const { status, calls } = await post({ ...VALID, 'cf-turnstile-response': 'token' }, { ...MAILGUN, TURNSTILE_SECRET_KEY: 'test-secret' }, {
    answers: { siteverify: () => Response.json({ success: true }) },
    headers: { 'CF-Connecting-IP': '203.0.113.7' },
  });
  assert.equal(status, 200);
  const verify = JSON.parse(String(sentTo(calls, 'siteverify')[0].init.body));
  assert.deepEqual(verify, { secret: 'test-secret', response: 'token', remoteip: '203.0.113.7' });
  assert.equal(sentTo(calls, 'mailgun').length, 1);
});

test('Turnstile on and failing, missing or unreachable → 400 and no email', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const env = { ...MAILGUN, TURNSTILE_SECRET_KEY: 'test-secret' };
    const failing = await post({ ...VALID, 'cf-turnstile-response': 'token' }, env, { answers: { siteverify: () => Response.json({ success: false }) } });
    const missing = await post(VALID, env);
    const down = await post({ ...VALID, 'cf-turnstile-response': 'token' }, env, { answers: { siteverify: () => Promise.reject(new Error('down')) } });
    for (const r of [failing, missing, down]) {
      assert.equal(r.status, 400);
      assert.equal(sentTo(r.calls, 'mailgun').length, 0);
    }
  } finally {
    console.error = original;
  }
});

// --- webhook -------------------------------------------------------------------------------------

test('webhook: the enquiry is posted to FORM_WEBHOOK_URL', async () => {
  const { calls } = await post(VALID, { ...MAILGUN, FORM_WEBHOOK_URL: 'https://hooks.example.com/all' });
  const [hook] = sentTo(calls, 'hooks.example.com');
  assert.equal(hook.url, 'https://hooks.example.com/all');
  const body = JSON.parse(String(hook.init.body));
  assert.equal(body.email, 'jo@example.com');
  assert.equal(body.form, 'contact');
});

test('webhook: FORM_WEBHOOK_<FORM> overrides the default for that form only', () => {
  const env: Env = { FORM_WEBHOOK_URL: 'https://hooks.example.com/all', FORM_WEBHOOK_SITE_VISIT: 'https://hooks.example.com/visit' };
  assert.equal(webhookFor(env, 'site-visit'), 'https://hooks.example.com/visit');
  assert.equal(webhookFor(env, 'contact'), 'https://hooks.example.com/all');
  assert.equal(webhookFor({ FORM_WEBHOOK_URL: 'http://insecure.example.com' }, 'contact'), '');
});

test('webhook failing or throwing does not change the visitor’s answer', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const env = { ...MAILGUN, FORM_WEBHOOK_URL: 'https://hooks.example.com/all' };
    const failing = await post(VALID, env, { answers: { 'hooks.example.com': () => new Response('boom', { status: 500 }) } });
    const throwing = await post(VALID, env, { answers: { 'hooks.example.com': () => Promise.reject(new Error('timeout')) } });
    assert.equal(failing.status, 200);
    assert.equal(throwing.status, 200);
    assert.equal(sentTo(throwing.calls, 'mailgun').length, 1);
  } finally {
    console.error = original;
  }
});

// --- shared checks -------------------------------------------------------------------------------

test('readEnquiry trims, clips and keeps a safe form name', () => {
  const { enquiry, errors } = readEnquiry({ ...VALID, name: '  Jo  ', form: 'Bad Form!', message: 'x'.repeat(9000) });
  assert.equal(enquiry.name, 'Jo');
  assert.equal(enquiry.form, 'contact');
  assert.equal(enquiry.message.length, 5000);
  assert.deepEqual(errors, {});
});
