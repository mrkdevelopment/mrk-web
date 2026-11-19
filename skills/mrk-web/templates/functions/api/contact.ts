/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Takes an enquiry from src/components/ContactForm.astro and emails it to the business.
 * Works two ways:
 *   - with JavaScript, the form posts JSON and gets JSON back (inline errors, no page change);
 *   - without JavaScript, the browser posts the form normally and gets a redirect to the
 *     thank-you page, or a short HTML page explaining what went wrong.
 *
 * No npm packages: every provider is one fetch() call, so there is nothing to update or audit.
 *
 * Environment variables (Cloudflare dashboard > the Pages project > Settings > Variables and Secrets).
 * Mark API keys and webhook URLs as "Secret". See env/.dev.vars.example for local testing.
 *   EMAIL_PROVIDER            mailgun | sendgrid | cloudflare
 *   CONTACT_TO                inbox that receives enquiries (comma-separated for several)
 *   CONTACT_FROM              sender address on a domain verified with the provider
 *   CONTACT_FALLBACK_EMAIL    optional, public address shown to visitors when sending fails
 *   MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION ("eu" for Mailgun's EU region)
 *   SENDGRID_API_KEY, SENDGRID_REGION ("eu" for an EU regional subuser)
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN (Cloudflare Email Service, REST API)
 *   TURNSTILE_SECRET_KEY      optional; when set, every enquiry must pass Turnstile
 *   FORM_WEBHOOK_URL          optional; every enquiry is also posted here as JSON (a CRM, Zapier, Make)
 *   FORM_WEBHOOK_<FORM>       optional; overrides FORM_WEBHOOK_URL for one form, e.g. FORM_WEBHOOK_QUOTE
 *                             for a form whose `form` field is "quote" (dashes become underscores)
 */
import { HONEYPOT_FIELD, TURNSTILE_FIELD, readEnquiry, safePath, type Enquiry } from '../../src/lib/enquiry.ts';

export interface Env {
  EMAIL_PROVIDER?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  CONTACT_FALLBACK_EMAIL?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_REGION?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_EMAIL_API_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
  FORM_WEBHOOK_URL?: string;
  [formWebhook: `FORM_WEBHOOK_${string}`]: string | undefined;
}

/** The parts of Cloudflare's EventContext this function uses (no @cloudflare/workers-types needed) */
export interface Context {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

interface Mail {
  to: string[];
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** Bodies bigger than this are refused before they are read: a real enquiry is a few KB */
const MAX_BODY_BYTES = 64 * 1024;

const setting = (value: string | undefined) => value?.trim() ?? '';

// ---------------------------------------------------------------------------------------------
// Email providers. Each returns true when the provider accepted the message. Request shapes were
// checked against the providers' own API references (links above each one).
// ---------------------------------------------------------------------------------------------

type Provider = 'mailgun' | 'sendgrid' | 'cloudflare';

/** Which provider is ready to use, or null when the settings it needs are missing */
function readyProvider(env: Env): Provider | null {
  if (!setting(env.CONTACT_TO) || !setting(env.CONTACT_FROM)) return null;
  const provider = setting(env.EMAIL_PROVIDER).toLowerCase();
  if (provider === 'mailgun' && setting(env.MAILGUN_API_KEY) && setting(env.MAILGUN_DOMAIN)) return 'mailgun';
  if (provider === 'sendgrid' && setting(env.SENDGRID_API_KEY)) return 'sendgrid';
  if (provider === 'cloudflare' && setting(env.CLOUDFLARE_ACCOUNT_ID) && setting(env.CLOUDFLARE_EMAIL_API_TOKEN)) return 'cloudflare';
  return null;
}

/**
 * Mailgun: multipart form, HTTP Basic auth with the user "api".
 * https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages
 * The EU region has its own host: https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview
 */
function sendWithMailgun(env: Env, mail: Mail): Promise<Response> {
  const body = new FormData();
  body.append('from', mail.from);
  for (const to of mail.to) body.append('to', to);
  body.append('h:Reply-To', mail.replyTo);
  body.append('subject', mail.subject);
  body.append('text', mail.text);
  const host = setting(env.MAILGUN_REGION).toLowerCase() === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
  return fetch(`https://${host}/v3/${encodeURIComponent(setting(env.MAILGUN_DOMAIN))}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`api:${setting(env.MAILGUN_API_KEY)}`)}` },
    body,
  });
}

/**
 * SendGrid v3 Mail Send: JSON, Bearer auth, answers 202 Accepted.
 * https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
 */
function sendWithSendGrid(env: Env, mail: Mail): Promise<Response> {
  const host = setting(env.SENDGRID_REGION).toLowerCase() === 'eu' ? 'api.eu.sendgrid.com' : 'api.sendgrid.com';
  return fetch(`https://${host}/v3/mail/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${setting(env.SENDGRID_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: mail.to.map((email) => ({ email })) }],
      from: parseAddress(mail.from),
      reply_to: { email: mail.replyTo },
      subject: mail.subject,
      content: [{ type: 'text/plain', value: mail.text }],
    }),
  });
}

/**
 * Cloudflare Email Service, through its REST API.
 * https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
 * https://developers.cloudflare.com/api/resources/email_sending/methods/send/
 *
 * Why not the `send_email` Workers binding (env.EMAIL.send)? Cloudflare documents that binding for
 * Workers, but Pages Functions support only the bindings listed at
 * https://developers.cloudflare.com/pages/functions/bindings/ and email is not one of them.
 * The REST API works from anywhere with an API token allowed to send email.
 */
function sendWithCloudflare(env: Env, mail: Mail): Promise<Response> {
  const account = encodeURIComponent(setting(env.CLOUDFLARE_ACCOUNT_ID));
  return fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/email/sending/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${setting(env.CLOUDFLARE_EMAIL_API_TOKEN)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: mail.from,
      to: mail.to,
      reply_to: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
    }),
  });
}

const PROVIDERS: Record<Provider, (env: Env, mail: Mail) => Promise<Response>> = {
  mailgun: sendWithMailgun,
  sendgrid: sendWithSendGrid,
  cloudflare: sendWithCloudflare,
};

/** "Business Name <hello@example.com>" or "hello@example.com" → SendGrid's { email, name } */
function parseAddress(value: string): { email: string; name?: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (!match) return { email: value.trim() };
  const name = match[1].replace(/^"|"$/g, '');
  return name ? { email: match[2].trim(), name } : { email: match[2].trim() };
}

// ---------------------------------------------------------------------------------------------
// Spam check and webhook
// ---------------------------------------------------------------------------------------------

/**
 * Cloudflare Turnstile siteverify. Accepts JSON; tokens are at most 2048 characters and expire
 * after 5 minutes. https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
async function passesTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const outcome = (await res.json()) as { success?: unknown };
    return outcome.success === true;
  } catch (err) {
    // Turnstile unreachable: refuse rather than let unchecked traffic through
    console.error('[contact] Turnstile check failed', err);
    return false;
  }
}

/** The webhook for this form: FORM_WEBHOOK_<FORM> first, then FORM_WEBHOOK_URL. Only https URLs. */
export function webhookFor(env: Env, form: string): string {
  const key = `FORM_WEBHOOK_${form.toUpperCase().replace(/-/g, '_')}` as const;
  const url = setting(env[key]) || setting(env.FORM_WEBHOOK_URL);
  return url.startsWith('https://') ? url : '';
}

/** Posts the enquiry to a CRM or automation tool. Runs after the visitor has their answer; never throws. */
async function postWebhook(url: string, enquiry: Enquiry): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...enquiry, submittedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error('[contact] webhook answered', res.status);
  } catch (err) {
    console.error('[contact] webhook unreachable', err instanceof Error ? err.name : 'error');
  }
}

// ---------------------------------------------------------------------------------------------
// Responses. _headers rules don't apply to Function responses, so set the headers here.
// ---------------------------------------------------------------------------------------------

const BASE_HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

interface Reply {
  status: number;
  /** Shown to the visitor. Never a provider's error text or anything from the environment. */
  message?: string;
  errors?: Record<string, string>;
  /** mailto: link to offer when the form can't send */
  mailto?: string;
}

function respond(asJson: boolean, reply: Reply, successPath: string): Response {
  if (asJson) {
    const body = reply.status < 300 ? { ok: true } : { ok: false, error: reply.message, errors: reply.errors, mailto: reply.mailto };
    return new Response(JSON.stringify(body), {
      status: reply.status,
      headers: { ...BASE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  // A normal form post (no JavaScript): 303 makes the browser GET the thank-you page
  if (reply.status < 300) return new Response(null, { status: 303, headers: { ...BASE_HEADERS, Location: successPath } });

  const items = Object.values(reply.errors ?? {}).map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  const email = reply.mailto ? `<p>You can also email <a href="${escapeHtml(reply.mailto)}">${escapeHtml(reply.mailto.slice(7))}</a>.</p>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Your message was not sent</title></head><body><main><h1>Your message was not sent</h1><p>${escapeHtml(reply.message ?? '')}</p>${items ? `<ul>${items}</ul>` : ''}${email}<p><a href="javascript:history.back()">Go back to the form</a> (what you typed should still be there).</p></main></body></html>`;
  return new Response(html, { status: reply.status, headers: { ...BASE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' } });
}

/**
 * Only this site may post here. Browsers send Origin on every POST; Sec-Fetch-Site is the backup
 * for older ones. Tools like curl send neither and are let through, because Turnstile (when on)
 * is the real gate against scripts: this check stops other websites posting through visitors' browsers.
 */
function fromThisSite(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (origin) return origin === new URL(request.url).origin;
  const site = request.headers.get('Sec-Fetch-Site');
  return !site || site === 'same-origin' || site === 'none';
}

/** The page path from the Referer header, for no-JS posts that didn't send `page` */
function refererPath(request: Request): string {
  const referer = request.headers.get('Referer');
  if (!referer) return '';
  try {
    return safePath(new URL(referer).pathname, '');
  } catch {
    return '';
  }
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('Content-Type') ?? '';
  try {
    if (type.includes('application/json')) {
      const data: unknown = await request.json();
      return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const data: Record<string, unknown> = {};
      for (const [key, value] of await request.formData()) if (typeof value === 'string') data[key] = value;
      return data;
    }
  } catch {
    // Malformed body: fall through to "invalid request"
  }
  return null;
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  const asJson = (request.headers.get('Accept') ?? '').includes('application/json') || (request.headers.get('Content-Type') ?? '').includes('application/json');
  const fallback = setting(env.CONTACT_FALLBACK_EMAIL);
  const mailto = fallback ? `mailto:${fallback}` : undefined;

  if (!fromThisSite(request)) return respond(asJson, { status: 403, message: 'This form can only be sent from this website.' }, '/');
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) {
    return respond(asJson, { status: 413, message: 'That message is too long to send.' }, '/');
  }

  const body = await readBody(request);
  if (!body) return respond(asJson, { status: 400, message: 'Sorry, that request could not be read.' }, '/');

  const successPath = safePath(body.redirect, '/thank-you/');

  // A bot filled the hidden field: say it worked, send nothing, so it learns nothing
  if (typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD].trim()) return respond(asJson, { status: 200 }, successPath);

  const provider = readyProvider(env);
  if (!provider) {
    // Logged for the site owner; the visitor only hears that the form isn't ready
    console.error('[contact] email is not configured: check EMAIL_PROVIDER, CONTACT_TO, CONTACT_FROM and the provider keys');
    return respond(asJson, { status: 503, message: 'Sorry, the contact form is not working right now.', mailto }, successPath);
  }

  const { enquiry, errors } = readEnquiry(body);
  if (Object.keys(errors).length) return respond(asJson, { status: 400, message: 'Please check the form.', errors }, successPath);
  if (!enquiry.page) enquiry.page = refererPath(request);

  const turnstileSecret = setting(env.TURNSTILE_SECRET_KEY);
  if (turnstileSecret) {
    const token = typeof body[TURNSTILE_FIELD] === 'string' ? body[TURNSTILE_FIELD] : '';
    if (!(await passesTurnstile(turnstileSecret, token, request.headers.get('CF-Connecting-IP')))) {
      return respond(asJson, { status: 400, message: 'The spam check did not pass. Please wait a moment and send again.' }, successPath);
    }
  }

  // A slow or broken CRM must never delay or fail the visitor's enquiry: it runs after the reply
  const webhook = webhookFor(env, enquiry.form);
  if (webhook) waitUntil(postWebhook(webhook, enquiry));

  const mail: Mail = {
    to: setting(env.CONTACT_TO).split(',').map((a) => a.trim()).filter(Boolean),
    from: setting(env.CONTACT_FROM),
    replyTo: enquiry.email,
    subject: `New enquiry from ${enquiry.name}`,
    text: [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || '-'}`,
      `Form: ${enquiry.form}`,
      `Sent from: ${enquiry.page || '-'}`,
      '',
      enquiry.message,
    ].join('\n'),
  };

  try {
    const res = await PROVIDERS[provider](env, mail);
    if (!res.ok) {
      // The provider's own error stays in the log: it can name the account, domain or key problem
      console.error(`[contact] ${provider} answered`, res.status, (await res.text()).slice(0, 500));
      return respond(asJson, { status: 502, message: 'Sorry, your message could not be sent just now. Please try again or email us.', mailto }, successPath);
    }
  } catch (err) {
    console.error(`[contact] ${provider} unreachable`, err instanceof Error ? err.message : 'error');
    return respond(asJson, { status: 502, message: 'Sorry, your message could not be sent just now. Please try again or email us.', mailto }, successPath);
  }

  return respond(asJson, { status: 200 }, successPath);
}
