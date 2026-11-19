# mrk-web templates

Proven starting points for the parts of a site where a mistake is costly: forms, email, consent, crawler files, headers and legal drafts. Copy each file to the same path in the new site, then adapt it. Everything is generic: replace the example values, never ship them.

No dependencies beyond Astro. Type checking (`astro check`) needs the dev tools `@astrojs/check`, `typescript` and `@types/node`. Tested together on Astro 7.4 and Node 26 (see the bottom of this file).

| Template | What it is | Skill step | What to adapt |
|---|---|---|---|
| `resources/` | The folder the client fills: `brand/` (brand.md, logos, fonts, guidelines), `photos/`, `documents/`, `links.md`, `inspiration/` (sites.md, screenshots, patterns, avoid), with a plain-English README. | 1 | Nothing. Copy the whole folder to the site root as `resources/`. Read it, never edit it. |
| `src/data/site.ts` | The business's facts in one object (name, legal name, URL, description, phone, email, address, schema type, logo, social links, locale, llms.txt sections). Everything below reads it. | 7 | Every value. Only confirmed facts; leave unknowns `''`. Set `schemaType` (`Organization`, `LocalBusiness` or a subtype). Add the key pages to `llms`. |
| `src/components/SeoHead.astro` | Title (adds the business name only when it fits in 60 characters), description, canonical, robots, Open Graph, X card, one JSON-LD `@graph` (business, WebSite, WebPage, optional BreadcrumbList) with stable `@id`s; pages add nodes via `schema`. | 7 | Nothing in the file. Pass `title`, `description`, `pageType`, `breadcrumbs`, `modified` (only real dates) from each page. Add `public/logo.png` and `public/og-default.png` or change the paths in site.ts. |
| `src/integrations/crawler-files.ts` | Writes `sitemap.xml` and `llms.txt` after the build from the built pages themselves: skips noindex, canonical-elsewhere, paginated and error pages; fails the build on invalid JSON-LD or an llms.txt path that wasn't built. | 10 | Add to `astro.config.mjs` (below). Pass `exclude` for any other pages to leave out. |
| `src/pages/robots.txt.ts` | robots.txt: allow all, named AI crawler groups, every group repeats the Disallow lines, Sitemap line from `site`. | 10 | Only `DISALLOW` (keep it shared) or the training group if the owner opts out of AI training. |
| `public/_redirects` | Empty redirects file with the `# mrk-web:start` / `# mrk-web:end` markers. | 15 | Generated rules go between the markers; hand-written ones outside. Exact rules before wildcards. |
| `site/README.md`, `site/CHANGELOG.md` | The new site's own README (badges, how to run, settings table, deploy and rollback, semver, release steps) and changelog. | 14 | Fill every `{{PLACEHOLDER}}`. Keep the badge as `badge/version-1.0.0-...` (a script bumps it). |
| `functions/api/contact.ts` | Pages Function for the form: JSON or plain POST, shared validation, honeypot, optional Turnstile, Mailgun / SendGrid / Cloudflare Email Service, optional webhook in `waitUntil`, 503 + mailto when not set up, same-origin only. | 15 | Nothing for a standard form. Add fields to `src/lib/enquiry.ts` and the email text if the form asks more. |
| `functions/api/contact.test.ts` | `node:test` tests with fetch stubbed: every provider, Turnstile on/off/failing, honeypot, bad input, origin, webhook success and failure, 503. | 15 | Add a test for any field you add. Add `"test": "node --test functions/api/contact.test.ts"` to package.json. |
| `src/lib/enquiry.ts` | Fields, limits and checks shared by browser and server. | 15 | Field rules and messages, if the form changes. |
| `src/components/ContactForm.astro` | Accessible form markup: real labels, autocomplete, inline error slots, aria-live status, hidden honeypot, Turnstile placeholder when the site key is set. Class hooks only. | 15 | Style the `.enquiry-*` classes. Set `form`, `heading`, `successPath`. Create the thank-you page (with `noindex`). |
| `src/scripts/contact-form.ts` | Progressive enhancement: inline errors, send in place, Turnstile loaded on first focus, `enquiry:sent` event. | 15 | Nothing, usually. Success wording. |
| `env/.env.example`, `env/.dev.vars.example`, `env/gitignore.txt` | Build and runtime settings with one-line comments; gitignore lines that keep secrets out. | 15 | Copy to the site root as `.env.example`, `.dev.vars.example`, and into `.gitignore`. Real values go in Cloudflare and local untracked files only. |
| `public/_headers` | Security headers that keep GA/GTM/Turnstile/YouTube working, a year's cache for `/_astro/*`, charset for .txt/.xml/.md. | 15 | Add rules for other hashed asset folders. Consider the report-only CSP if no GTM. |
| `src/components/Consent.astro`, `src/scripts/consent.ts` | Cookie bar and GA4/GTM loader. Renders only with `PUBLIC_GA_ID` or `PUBLIC_GTM_ID`; nothing from Google before Accept; Decline deletes `_ga*`; choice kept 12 months; "Cookie settings" reopens it; compact bottom bar that reserves its height. | 17 | Style it. Add `<button type="button" data-cookie-settings hidden>Cookie settings</button>` to the footer. Give any sticky mobile CTA `bottom: var(--consent-bar-height, 0px)`. |
| `legal/privacy-policy.md`, `legal/website-terms.md` | Plain-English drafts with `{{PLACEHOLDER}}`s, a draft notice and "Add for your country" pointers. No claim of compliance. | 17 | Every placeholder; delete sections for features not used (analytics, Turnstile, webhook). Owner review; lawyer where it matters. |

## Wiring it up

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import crawlerFiles from './src/integrations/crawler-files.ts';
import { site } from './src/data/site.ts';

export default defineConfig({
  site: process.env.SITE_URL || site.url,
  trailingSlash: 'always',
  integrations: [crawlerFiles()],
});
```

Layout `<head>`: `<meta charset>`, `<meta name="viewport">`, then `<SeoHead {...props} />`. End of `<body>`: `<Consent />`. Use `<html lang={site.locale}>`.

## Tested

In a fresh `create astro` minimal project (Astro 7.4.13, Node 26.7.0): `astro check` 0 errors, `astro build` passes, `node --test functions/api/contact.test.ts` 18/18, and `wrangler pages dev dist` answered 503 (not configured), 303 (honeypot) and 403 (other origin).
