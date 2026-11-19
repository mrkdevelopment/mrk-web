/**
 * Writes /sitemap.xml and /llms.txt after `astro build`, from the HTML pages that were actually built.
 *
 * Why read the built pages instead of keeping a list (or using @astrojs/sitemap)?
 *   - A hand-kept list drifts: a page is added and forgotten, or removed and left in.
 *   - @astrojs/sitemap lists every route, including noindex pages and pages whose canonical points
 *     elsewhere, unless each one is excluded by hand, and it is one more dependency to keep current.
 *   - Each built page already says, in its own <head>, whether it should be indexed (robots meta),
 *     what its real URL is (canonical), its title, its description and, when known, when it last
 *     changed (WebPage.dateModified in the JSON-LD from SeoHead). So the page is the single source.
 *
 * A page is listed only when ALL of these hold:
 *   - no `noindex` (or `none`) in <meta name="robots">, and no meta refresh (Astro redirect pages);
 *   - its canonical is its own URL (a page that points elsewhere is a duplicate);
 *   - it is not a paginated listing (/page/2/ etc.) or an error page (404, 500).
 * Every page's JSON-LD is also parsed, so broken structured data fails the build instead of shipping.
 *
 * robots.txt stays a normal Astro endpoint (src/pages/robots.txt.ts): it needs no page data.
 *
 * Use in astro.config.mjs:  integrations: [crawlerFiles()]   (and set `site`)
 */
import type { AstroIntegration } from 'astro';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site as siteConfig } from '../data/site';

interface Page {
  /** "/about/" */
  path: string;
  url: string;
  title: string;
  description: string;
  lastmod?: string;
}

interface Options {
  /** Extra paths to leave out of both files */
  exclude?: RegExp[];
}

const ALWAYS_EXCLUDED = [/\/page\/\d+\/?$/, /^\/(404|500)(\/|\.html)?$/];

const decode = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Attributes of every <meta> and <link> tag. Plenty for HTML Astro itself wrote; not a general parser. */
function headTags(html: string): Record<string, string>[] {
  const head = html.split(/<\/head>/i)[0];
  return [...head.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) => {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
    }
    return attrs;
  });
}

/** Finds dateModified on the WebPage node (any @type ending in "Page", or Article types) */
function dateModified(html: string, file: string): string | undefined {
  let found: string | undefined;
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error(`[crawler-files] ${file}: the JSON-LD structured data is not valid JSON`);
    }
    const graph = (data as { '@graph'?: unknown[] })['@graph'] ?? [data];
    for (const node of graph as { '@type'?: string | string[]; dateModified?: string }[]) {
      const types = ([] as string[]).concat(node['@type'] ?? []);
      if (node.dateModified && types.some((t) => /Page$|Article$|Posting$/.test(t))) found ??= node.dateModified;
    }
  }
  return found && /^\d{4}-\d{2}-\d{2}/.test(found) ? found : undefined;
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.html')).map((e) => join(e.parentPath, e.name));
}

/** dist/about/index.html → /about/ ; dist/about.html → /about */
function pathFor(outDir: string, file: string): string {
  const rel = relative(outDir, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  return '/' + (rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel.replace(/\.html$/, ''));
}

async function readPages(outDir: string, siteUrl: string, exclude: RegExp[]): Promise<Page[]> {
  const pages: Page[] = [];
  for (const file of await htmlFiles(outDir)) {
    const path = pathFor(outDir, file);
    if ([...ALWAYS_EXCLUDED, ...exclude].some((re) => re.test(path))) continue;
    const html = await readFile(file, 'utf8');
    const tags = headTags(html);
    const robots = tags.find((t) => t.name?.toLowerCase() === 'robots')?.content?.toLowerCase() ?? '';
    const lastmod = dateModified(html, path); // parses (and so checks) the JSON-LD on every page
    if (/noindex|none/.test(robots)) continue;
    if (tags.some((t) => t['http-equiv']?.toLowerCase() === 'refresh')) continue;

    // The page's own canonical is the URL to list (it settles /about vs /about/). Compared without
    // the trailing slash so a slash mismatch is not mistaken for "canonical points elsewhere".
    const canonicalHref = tags.find((t) => t.rel?.toLowerCase() === 'canonical')?.href;
    const own = new URL(path, siteUrl).href;
    const url = canonicalHref ? new URL(canonicalHref, siteUrl).href : own;
    if (url.replace(/\/$/, '') !== own.replace(/\/$/, '')) continue;

    const title = decode(/<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? path);
    const description = tags.find((t) => t.name?.toLowerCase() === 'description')?.content ?? '';
    pages.push({ path, url, title, description, lastmod });
  }
  // Home first, then alphabetical, so the files only change when the pages do
  return pages.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
}

function sitemapXml(pages: Page[]): string {
  const urls = pages.map((p) => `  <url><loc>${escapeXml(p.url)}</loc>${p.lastmod ? `<lastmod>${p.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/** llms.txt format: https://llmstxt.org (H1, a > summary, then H2 sections of links; "Optional" may be skipped) */
function llmsTxt(pages: Page[]): string {
  const byPath = new Map(pages.map((p) => [p.path, p]));
  // Titles carry " | Brand" from SeoHead; the H1 already names the business
  const suffix = ` | ${siteConfig.name}`;
  const link = (p: Page) => {
    const title = (p.title.endsWith(suffix) ? p.title.slice(0, -suffix.length) : p.title).replace(/[[\]]/g, '');
    return `- [${title}](${p.url})${p.description ? `: ${p.description}` : ''}`;
  };

  const listed = new Set<string>();
  const out = [`# ${siteConfig.name}`, '', `> ${siteConfig.description}`, ''];
  for (const section of siteConfig.llms) {
    const missing = section.paths.filter((path) => !byPath.has(path));
    if (missing.length) {
      throw new Error(`[crawler-files] llms.txt lists ${missing.join(', ')} under "${section.heading}" (src/data/site.ts), but no indexable page was built there`);
    }
    out.push(`## ${section.heading}`, '', ...section.paths.map((path) => link(byPath.get(path)!)), '');
    section.paths.forEach((path) => listed.add(path));
  }
  const rest = pages.filter((p) => !listed.has(p.path));
  if (rest.length) out.push('## Optional', '', ...rest.map(link), '');
  return out.join('\n');
}

export default function crawlerFiles(options: Options = {}): AstroIntegration {
  let siteUrl = '';
  return {
    name: 'crawler-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        if (!config.site) throw new Error('[crawler-files] set `site` in astro.config.mjs: the sitemap needs absolute URLs');
        siteUrl = config.site;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const pages = await readPages(outDir, siteUrl, options.exclude ?? []);
        await writeFile(join(outDir, 'sitemap.xml'), sitemapXml(pages));
        await writeFile(join(outDir, 'llms.txt'), llmsTxt(pages));
        logger.info(`sitemap.xml and llms.txt: ${pages.length} indexable pages`);
      },
    },
  };
}
