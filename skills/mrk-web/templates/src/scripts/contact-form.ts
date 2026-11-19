/**
 * Progressive enhancement for every form[data-enquiry-form] (src/components/ContactForm.astro).
 * Without this script the form still works as a normal POST. With it:
 *   - the same checks the server runs (src/lib/enquiry.ts) show next to each field before sending;
 *   - the enquiry is sent in place and the result is announced in the form's live region;
 *   - Cloudflare Turnstile loads only when someone starts using the form. Its script is heavy
 *     (around 1.5 MB with the challenge), so loading it with every page would slow every page.
 * On success it fires a window event `enquiry:sent` (detail: { form }) that analytics can count
 * (src/scripts/consent.ts sends it to GA4 as generate_lead, only after consent).
 */
import { readEnquiry, TURNSTILE_FIELD, type EnquiryField } from '../lib/enquiry';

declare global {
  interface Window {
    turnstile?: { reset(widget?: string | HTMLElement): void };
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Adds Turnstile's script once. With implicit rendering it renders every .cf-turnstile
 * placeholder on the page when it runs, so loading it late still works.
 */
function loadTurnstile(): void {
  if (!document.querySelector('.cf-turnstile') || document.querySelector(`script[src^="${TURNSTILE_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = TURNSTILE_SRC;
  script.async = true;
  script.defer = true;
  document.head.append(script);
}

function enhance(form: HTMLFormElement): void {
  const status = form.querySelector<HTMLElement>('[data-enquiry-status]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!status || !submit) return;
  const label = submit.dataset.label ?? submit.textContent ?? 'Send';
  const turnstile = form.querySelector<HTMLElement>('.cf-turnstile');

  // Our own messages replace the browser's bubbles, so they match the server's wording
  form.noValidate = true;
  form.addEventListener('focusin', loadTurnstile, { once: true });
  form.addEventListener('pointerdown', loadTurnstile, { once: true });

  const setStatus = (message: string, state: 'idle' | 'sending' | 'sent' | 'error') => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const showErrors = (errors: Partial<Record<EnquiryField | string, string>>) => {
    const invalid: HTMLElement[] = [];
    for (const slot of form.querySelectorAll<HTMLElement>('[data-error-for]')) {
      const field = slot.dataset.errorFor ?? '';
      const input = form.elements.namedItem(field);
      const message = errors[field] ?? '';
      slot.textContent = message;
      slot.hidden = !message;
      if (input instanceof HTMLElement) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
        if (message) invalid.push(input);
      }
    }
    // Move focus to the first problem so keyboard and screen-reader users land on it
    invalid[0]?.focus();
    return invalid.length > 0;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = new FormData(form);
    const values = Object.fromEntries([...data].filter((entry): entry is [string, string] => typeof entry[1] === 'string'));

    if (showErrors(readEnquiry(values).errors)) {
      setStatus('Please check the highlighted fields.', 'error');
      return;
    }
    if (turnstile && !values[TURNSTILE_FIELD]) {
      loadTurnstile();
      setStatus('One moment, the spam check is still loading. Please press send again in a few seconds.', 'error');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    setStatus('Sending your message…', 'sending');
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      });
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Record<string, string>; mailto?: string };
      if (!res.ok || !result.ok) {
        if (result.errors) showErrors(result.errors);
        const email = result.mailto?.slice(7) || form.dataset.fallbackEmail;
        throw new Error(`${result.error ?? 'Sorry, something went wrong.'}${email ? ` You can also email ${email}.` : ''}`);
      }
      form.reset();
      setStatus('Thanks, your message has been sent. We will reply by email.', 'sent');
      window.dispatchEvent(new CustomEvent('enquiry:sent', { detail: { form: values.form ?? 'contact' } }));
    } catch (err) {
      const offline = err instanceof TypeError; // fetch itself failed: no connection
      const email = form.dataset.fallbackEmail;
      setStatus(
        offline ? `Your message could not be sent. Please check your connection and try again${email ? `, or email ${email}` : ''}.` : (err as Error).message,
        'error'
      );
    } finally {
      submit.disabled = false;
      submit.textContent = label;
      // A Turnstile token works once; get a fresh one for the next try
      if (turnstile) window.turnstile?.reset(turnstile);
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-enquiry-form]').forEach(enhance);
