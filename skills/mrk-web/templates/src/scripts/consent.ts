/**
 * Cookie consent, then Google Analytics 4 or Google Tag Manager. Markup: src/components/Consent.astro.
 *
 * - Nothing from Google is requested until the visitor presses Accept.
 * - The choice is kept in localStorage for 12 months, then the banner asks again.
 * - Decline (including later, from "Cookie settings") switches analytics off and deletes the _ga* cookies.
 * - Any [data-cookie-settings] button reopens the banner and moves focus into it.
 * - Consent Mode v2 is set so only analytics storage is ever granted, never advertising.
 *
 * Not included on purpose: GTM's <noscript> iframe. It would load Google before (and without) consent.
 */

// An import-free module still needs `export {}` for the `declare global` block below
export {};

type Choice = 'granted' | 'denied';

const STORAGE_KEY = 'site-consent';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [disable: `ga-disable-${string}`]: boolean | undefined;
  }
}

const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
const gaId = banner?.dataset.gaId ?? '';
const gtmId = banner?.dataset.gtmId ?? '';

function readChoice(): Choice | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { choice?: unknown; at?: unknown } | null;
    if ((saved?.choice !== 'granted' && saved?.choice !== 'denied') || typeof saved.at !== 'number') return null;
    return Date.now() - saved.at > MAX_AGE_MS ? null : saved.choice;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    // Storage blocked (some private modes): the choice lasts for this page view only
  }
}

function gtag(..._args: unknown[]): void {
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js and GTM read the `arguments` object itself, not an array copy
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

let loaded = false;

function startAnalytics(): void {
  if (gaId) window[`ga-disable-${gaId}`] = false;
  if (loaded) {
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  loaded = true;
  window.gtag = gtag;
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  const script = document.createElement('script');
  script.async = true;
  if (gtmId) {
    // GTM: GA4 and any other tags are then configured inside the GTM container
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  } else {
    gtag('js', new Date());
    gtag('config', gaId, { allow_google_signals: false, allow_ad_personalization_signals: false });
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  }
  document.head.append(script);
}

function stopAnalytics(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  if (gaId) window[`ga-disable-${gaId}`] = true;
  // GA sets _ga and _ga_<id> on the widest domain it can (".example.com"), so try each level
  const parts = location.hostname.split('.');
  const domains = ['', ...parts.slice(0, -1).map((_, i) => '.' + parts.slice(i).join('.'))];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (!name.startsWith('_ga')) continue;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
  }
}

function setOpen(open: boolean): void {
  if (!banner) return;
  banner.hidden = !open;
  document.body.classList.toggle('consent-open', open);
  // Reserve the banner's real height (it wraps differently per screen) so it never covers content
  document.documentElement.style.setProperty('--consent-bar-height', open ? `${banner.offsetHeight}px` : '0px');
}

if (banner && (gaId || gtmId)) {
  let returnFocus: HTMLElement | null = null;
  const choice = readChoice();
  if (choice === 'granted') startAnalytics();
  // First visit: shown without taking focus, so it doesn't interrupt reading or a screen reader
  if (choice === null) setOpen(true);

  new ResizeObserver(() => {
    if (!banner.hidden) setOpen(true);
  }).observe(banner);

  banner.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-consent]');
    if (!button) return;
    const value: Choice = button.dataset.consent === 'granted' ? 'granted' : 'denied';
    saveChoice(value);
    if (value === 'granted') startAnalytics();
    else stopAnalytics();
    setOpen(false);
    returnFocus?.focus();
    returnFocus = null;
  });

  for (const button of document.querySelectorAll<HTMLElement>('[data-cookie-settings]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      returnFocus = button;
      setOpen(true);
      banner.querySelector<HTMLElement>('.consent-title')?.focus();
    });
  }

  // Escape closes a banner that was reopened from Cookie settings, keeping the earlier choice
  banner.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || readChoice() === null) return;
    setOpen(false);
    returnFocus?.focus();
    returnFocus = null;
  });

  // Count sent enquiries (src/scripts/contact-form.ts), only once analytics is allowed
  window.addEventListener('enquiry:sent', (event) => {
    if (readChoice() !== 'granted') return;
    const form = (event as CustomEvent<{ form?: string } | undefined>).detail?.form ?? 'contact';
    if (gtmId) window.dataLayer?.push({ event: 'generate_lead', form });
    else window.gtag?.('event', 'generate_lead', { form });
  });
}
