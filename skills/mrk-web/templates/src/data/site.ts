/**
 * The business's facts in one place. SeoHead (titles, structured data), robots.txt, llms.txt,
 * the sitemap and the contact form all read from here, so a change is made once.
 *
 * Replace every example value with the real one. Leave an optional field as '' (or the array
 * empty) when the business doesn't have it: empty values are left out of the structured data
 * rather than published blank. Only put facts here that the owner has confirmed.
 */

export interface SiteConfig {
  /** Short trading name, used in titles ("Page title | Name") and Open Graph */
  name: string;
  /** Registered legal name, for the privacy policy, terms and structured data */
  legalName: string;
  /** Production URL with https and no trailing slash. Astro's `site` setting reads this. */
  url: string;
  /** One or two plain sentences: what the business does, for whom, where. Used by llms.txt and as a default description. */
  description: string;
  /** In international format, e.g. "+61 2 0000 0000"; '' if not published */
  phone: string;
  /** Public enquiries address; also the fallback the contact form shows when sending fails */
  email: string;
  address: {
    street: string;
    locality: string;
    region: string;
    postcode: string;
    /** Two-letter country code, e.g. "AU", "GB", "US" */
    country: string;
  };
  /**
   * schema.org type for the business. "Organization" for most; "LocalBusiness" (or a subtype such
   * as "Plumber", "Dentist", "Restaurant") for a business customers visit or that serves a local area.
   */
  schemaType: string;
  /** Path to the logo in public/, e.g. "/logo.png" (square, at least 112px) */
  logo: string;
  /** Default share image in public/ (1200x630) for pages that don't set their own */
  ogImage: string;
  /** Full profile URLs the business controls: these become `sameAs` in structured data */
  social: string[];
  /** X/Twitter handle with the @, or '' */
  xHandle: string;
  /** BCP 47 language tag for <html lang> and inLanguage, e.g. "en-AU", "en-GB", "en-US" */
  locale: string;
  /**
   * llms.txt sections: the key pages, in the order an assistant should read them.
   * Every built, indexable page not listed here goes under "## Optional" automatically,
   * so nothing is ever missing; listing a page that doesn't exist fails the build.
   */
  llms: { heading: string; paths: string[] }[];
}

export const site: SiteConfig = {
  name: 'Example Business',
  legalName: 'Example Business Pty Ltd',
  url: 'https://www.example.com',
  description: 'Example Business helps local homeowners with example services. Based in Example Town and working across the region.',
  phone: '',
  email: 'hello@example.com',
  address: { street: '', locality: 'Example Town', region: '', postcode: '', country: 'AU' },
  schemaType: 'Organization',
  logo: '/logo.png',
  ogImage: '/og-default.png',
  social: [],
  xHandle: '',
  locale: 'en-AU',
  llms: [
    { heading: 'Main pages', paths: ['/', '/contact/'] },
  ],
};

/** Absolute URL for a path on this site */
export const absoluteUrl = (path: string, base: string = site.url) => new URL(path, base).href;
