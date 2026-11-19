/**
 * The enquiry form's fields and checks, shared by the browser (src/scripts/contact-form.ts)
 * and the server (functions/api/contact.ts), so the two can never disagree about what is valid.
 *
 * No imports and no browser or Cloudflare APIs: this file runs in both places, and in Node for the tests.
 */

/** Hidden field that people never see. Bots fill every field, so a value here means a bot. */
export const HONEYPOT_FIELD = 'leave_this_empty';

/** The field Cloudflare Turnstile adds to the form once its check has passed */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

/** Longest value kept for each field; anything longer is cut, never rejected */
export const FIELD_LIMITS = { name: 200, email: 320, phone: 40, message: 5000 } as const;

export type EnquiryField = keyof typeof FIELD_LIMITS;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export interface Enquiry {
  /** Which form sent it, e.g. "contact" or "quote". Picks the per-form webhook. */
  form: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  /** The page path the form was on, e.g. "/contact/" */
  page: string;
}

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Deliberately loose: the real test of an address is the reply. This only catches typos like "jo@example". */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Digits, spaces and the usual phone punctuation, with at least 6 digits */
export function isPhone(value: string): boolean {
  return /^[+()\d\s.-]+$/.test(value) && value.replace(/\D/g, '').length >= 6;
}

/** A form name is a short slug, because it becomes part of an environment variable name */
export function formName(value: unknown): string {
  const name = clip(value, 40).toLowerCase();
  return /^[a-z0-9][a-z0-9-]*$/.test(name) ? name : 'contact';
}

/** Only a same-site path, never a full URL, so the form can't be used to send people elsewhere */
export function safePath(value: unknown, fallback = '/'): string {
  const path = clip(value, 500);
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : fallback;
}

/**
 * Reads an enquiry from submitted values (JSON body or form fields) and lists any problems,
 * one message per field, written to be shown next to that field.
 */
export function readEnquiry(input: Record<string, unknown>): { enquiry: Enquiry; errors: EnquiryErrors } {
  const enquiry: Enquiry = {
    form: formName(input.form),
    name: clip(input.name, FIELD_LIMITS.name),
    email: clip(input.email, FIELD_LIMITS.email),
    phone: clip(input.phone, FIELD_LIMITS.phone),
    message: clip(input.message, FIELD_LIMITS.message),
    page: safePath(input.page, ''),
  };

  const errors: EnquiryErrors = {};
  if (!enquiry.name) errors.name = 'Please add your name.';
  if (!enquiry.email) errors.email = 'Please add your email address.';
  else if (!isEmail(enquiry.email)) errors.email = 'Please check your email address, it looks incomplete.';
  if (enquiry.phone && !isPhone(enquiry.phone)) errors.phone = 'Please check your phone number.';
  if (!enquiry.message) errors.message = 'Please add a short message.';

  return { enquiry, errors };
}
