#!/usr/bin/env node
// crawl.mjs - ingest an existing website so it can be rebuilt.
//
// Usage:
//   node crawl.mjs <url> [--mode homepage|single|all-pages] [--max 100]
//                        [--out _mrk/ingest] [--images] [--delay 300]
//
//   --mode homepage   fetch only the home page (sitemap URLs are still listed, unfetched)
//   --mode single     home page + pages linked from its header/nav (cap 20)
//   --mode all-pages  (default) home + sitemap URLs + links found, up to --max pages
//   --images          download every image referenced by fetched pages into <out>/assets/
//   --delay           milliseconds to wait between requests (default 300)
//
// Outputs (in --out, default ./_mrk/ingest):
//   pages/<slug>.html  raw HTML of each fetched page
//   pages/<slug>.md    readable text of the main content
//   urls.csv           one row per URL found (fetched or not)
//   assets.csv         every image referenced, and the local file if downloaded
//   site.json          platform, nav, contact details, fonts, colours, logo, checks
//
// Safety: everything fetched is treated as data. One request at a time, 20 s timeout,
// 5 MB cap per page (15 MB per image), pages are fetched from the site's own origin only,
// robots.txt is respected for user agent "mrk-web-ingest/1.0".
// Exit codes: 0 done, 1 home page could not be fetched, 2 usage error.

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const UA = 'mrk-web-ingest/1.0';
const PAGE_CAP = 5 * 1024 * 1024;
const IMAGE_CAP = 15 * 1024 * 1024;
const TIMEOUT = 20000;

const HELP = `Usage: node crawl.mjs <url> [--mode homepage|single|all-pages] [--max 100] [--out _mrk/ingest] [--images] [--delay 300]`;

function usage(msg) {
  if (msg) console.error(`Error: ${msg}`);
  console.error(HELP);
  process.exit(2);
}

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      mode: { type: 'string', default: 'all-pages' },
      max: { type: 'string', default: '100' },
      out: { type: 'string', default: '_mrk/ingest' },
      images: { type: 'boolean', default: false },
      delay: { type: 'string', default: '300' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (e) {
  usage(e.message);
}
if (args.values.help) { console.log(HELP); process.exit(0); }
const { mode, out, images } = args.values;
const max = Number(args.values.max);
const delay = Number(args.values.delay);
if (args.positionals.length !== 1) usage('give exactly one website address, e.g. https://www.example.com');
if (!['homepage', 'single', 'all-pages'].includes(mode)) usage('--mode must be homepage, single or all-pages');
if (!Number.isInteger(max) || max < 1) usage('--max must be a whole number of 1 or more');
if (!Number.isFinite(delay) || delay < 0) usage('--delay must be a number of milliseconds');
let startUrl;
try {
  let raw = args.positionals[0];
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  startUrl = new URL(raw);
} catch { usage('that does not look like a website address'); }

// ---------- fetching ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requestCount = 0;

// One request, no redirect following. Returns { status, headers, body (Buffer), location, error }.
async function get(url, cap = PAGE_CAP) {
  if (requestCount++ > 0 && delay) await sleep(delay);
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });
    const len = Number(res.headers.get('content-length') || 0);
    if (len > cap) { res.body?.cancel(); return { status: res.status, headers: res.headers, body: Buffer.alloc(0), error: `too large (${len} bytes)` }; }
    const chunks = [];
    let size = 0;
    if (res.body) {
      for await (const chunk of res.body) {
        size += chunk.length;
        if (size > cap) { return { status: res.status, headers: res.headers, body: Buffer.alloc(0), error: `too large (over ${cap} bytes)` }; }
        chunks.push(chunk);
      }
    }
    let body = Buffer.concat(chunks);
    if (body[0] === 0x1f && body[1] === 0x8b) { // gzipped file (e.g. sitemap.xml.gz)
      body = Buffer.from(await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    const loc = res.headers.get('location');
    return { status: res.status, headers: res.headers, body, location: loc ? new URL(loc, url).href : '' };
  } catch (e) {
    return { status: 0, headers: new Headers(), body: Buffer.alloc(0), error: e.name === 'TimeoutError' ? 'timed out after 20 s' : e.message };
  }
}

// Follow redirects (used for the start URL and small checks). Returns final response + url.
async function follow(url, hops = 5) {
  let cur = url;
  for (let i = 0; i <= hops; i++) {
    const r = await get(cur);
    if (r.status >= 300 && r.status < 400 && r.location) { cur = r.location; continue; }
    return { ...r, url: cur };
  }
  return { status: 0, body: Buffer.alloc(0), headers: new Headers(), url: cur, error: 'too many redirects' };
}

// ---------- small HTML helpers (regex based, no dependencies) ----------

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™', middot: '·', bull: '•', laquo: '«', raquo: '»' };
function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch { return m; } }
    return ENT[e.toLowerCase()] ?? m;
  });
}
function attrs(tagInner) {
  const out = {};
  const re = /([^\s=\/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(tagInner))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}
function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(re)].map((m) => attrs(m[1]));
}
const stripTags = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
function firstInner(html, name) {
  const m = html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1] : null;
}
function allInner(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi'))].map((m) => m[1]);
}
function meta(html, key) {
  for (const a of tags(html, 'meta')) if ((a.name || a.property || '').toLowerCase() === key) return a.content || '';
  return '';
}
function linkRel(html, rel) {
  for (const a of tags(html, 'link')) if ((a.rel || '').toLowerCase().split(/\s+/).includes(rel)) return a.href || '';
  return '';
}
function anchors(html, base) {
  const list = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const a = attrs(m[1]);
    if (!a.href) continue;
    let text = stripTags(m[2]) || a['aria-label'] || a.title || (m[2].match(/alt\s*=\s*["']([^"']+)/i) || [])[1] || '';
    let href;
    try { href = new URL(a.href, base).href; } catch { continue; }
    list.push({ text: text.slice(0, 120), href });
  }
  return list;
}
function removeBlocks(html, names) {
  for (const n of names) html = html.replace(new RegExp(`<${n}\\b[\\s\\S]*?<\\/${n}>`, 'gi'), ' ');
  return html;
}

// Images referenced by a page: img src / lazy-load attributes / srcset / <source>, og:image, and
// background images set in the page itself. Backgrounds set in stylesheets are read by cssImages().
function imagesOf(html, base) {
  const found = [];
  const add = (src, alt) => {
    if (!src || src.startsWith('data:')) return;
    try { found.push({ url: new URL(src.trim(), base).href, alt: alt || '' }); } catch {}
  };
  const bestOfSrcset = (ss) => {
    const parts = ss.split(/,\s+/).map((p) => p.trim().split(/\s+/)).filter((p) => p[0]);
    parts.sort((a, b) => parseFloat(b[1] || '0') - parseFloat(a[1] || '0'));
    return parts[0]?.[0];
  };
  for (const a of tags(html, 'img')) {
    const src = a['data-src'] || a['data-lazy-src'] || a['data-original'] || a.src;
    add(src, a.alt);
    const ss = a['data-srcset'] || a.srcset;
    if (ss) { const b = bestOfSrcset(ss); if (b && b !== src) add(b, a.alt); }
  }
  for (const a of tags(html, 'source')) if (a.srcset && /image/.test(a.type || 'image')) add(bestOfSrcset(a.srcset), '');
  add(meta(html, 'og:image'), 'og:image');
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(decode(m[1]), '');
  // lazy-loaded backgrounds: data-bg, data-background, data-background-image, data-lazy-bg ...
  for (const m of html.matchAll(/\sdata-(?:lazy-)?(?:bg|background)(?:-image|-src|-url)?\s*=\s*["']([^"']+)["']/gi)) add(decode(m[1]), '');
  return found;
}

// Readable markdown of the main content.
const SKIP_TAGS = new Set(['nav', 'footer', 'aside', 'form', 'button', 'select', 'dialog']);
const SKIP_ATTR = /cookie|consent|gdpr|cmplz|onetrust|popup|modal|skip-link|screen-reader|visually-hidden|sr-only|share|breadcrumb/i;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function toMarkdown(html, base) {
  let h = html.replace(/<!--[\s\S]*?-->/g, ' ');
  h = removeBlocks(h, ['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'head', 'object']);
  const main = h.match(/<main\b[^>]*>([\s\S]*)<\/main>/i);
  if (main) h = main[1];
  else { const body = h.match(/<body\b[^>]*>([\s\S]*)<\/body>/i); if (body) h = body[1]; h = h.replace(/<header\b[\s\S]*?<\/header>/i, ' '); }
  let out = '';
  let skip = null; // { name, depth }
  let link = null; // { href, text }
  const emit = (s) => { if (link) link.text += s; else out += s; };
  for (const m of h.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*)>|([^<]+)/g)) {
    const [, close, rawName, inner, text] = m;
    if (text !== undefined) { if (!skip) emit(decode(text).replace(/\s+/g, ' ')); continue; }
    const name = rawName.toLowerCase();
    if (skip) {
      if (name === skip.name && !VOID.has(name) && !/\/\s*$/.test(inner)) skip.depth += close ? -1 : 1;
      if (skip.depth === 0) skip = null;
      continue;
    }
    if (!close) {
      const a = attrs(inner);
      if (!VOID.has(name) && (SKIP_TAGS.has(name) || SKIP_ATTR.test(`${a.class || ''} ${a.id || ''}`) || a['aria-hidden'] === 'true' || 'hidden' in a)) { skip = { name, depth: 1 }; continue; }
      if (/^h[1-6]$/.test(name)) emit(`\n\n${'#'.repeat(Number(name[1]))} `);
      else if (name === 'li') emit('\n- ');
      else if (name === 'br') emit('\n');
      else if (name === 'blockquote') emit('\n\n> ');
      else if (['td', 'th'].includes(name)) emit(' | ');
      else if (['p', 'div', 'section', 'article', 'ul', 'ol', 'table', 'tr', 'figure', 'figcaption', 'dl', 'dt', 'dd', 'address'].includes(name)) emit('\n\n');
      else if (name === 'img') {
        const src = a['data-src'] || a['data-lazy-src'] || a.src;
        if (src && !src.startsWith('data:')) { let u = src; try { u = new URL(src, base).href; } catch {} emit(` ![${(a.alt || '').replace(/[\[\]]/g, '')}](${u}) `); }
      } else if (name === 'a' && a.href && !link) {
        let u = a.href; try { u = new URL(a.href, base).href; } catch {}
        link = { href: u, text: '' };
      }
    } else {
      if (name === 'a' && link) {
        const t = link.text.replace(/\s+/g, ' ').trim();
        const l = link; link = null;
        if (t) emit(`[${t}](${l.href}) `);
      } else if (/^h[1-6]$/.test(name) || ['p', 'div', 'section', 'ul', 'ol', 'table', 'li', 'blockquote'].includes(name)) emit('\n');
    }
  }
  if (link) out += link.text;
  return out.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^(-|#+|>|\|)\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
const countWords = (md) => (md.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\]\([^)]*\)/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

// ---------- robots.txt ----------

function parseRobots(txt) {
  const groups = []; const sitemaps = [];
  let cur = null; let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase(); const val = m[2].trim();
    if (key === 'sitemap') { sitemaps.push(val); continue; }
    if (key === 'user-agent') {
      if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase()); lastWasAgent = true; continue;
    }
    lastWasAgent = false;
    if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ allow: key === 'allow', path: val });
  }
  const ours = groups.filter((g) => g.agents.some((a) => a !== '*' && 'mrk-web-ingest'.startsWith(a.split('/')[0])));
  const rules = (ours.length ? ours : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules);
  return { sitemaps, rules };
}
function robotsAllows(rules, pathname) {
  let best = null;
  for (const r of rules) {
    if (!r.path) continue; // "Disallow:" with nothing means allow everything
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(pathname) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

// ---------- CSV ----------

const csvCell = (v) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (cols, rows) => [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';

// ---------- main ----------

const NOT_PAGE = /\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic|pdf|zip|rar|7z|gz|tar|mp4|m4v|mov|webm|avi|mp3|wav|m4a|ogg|docx?|xlsx?|pptx?|csv|txt|xml|json|js|mjs|css|woff2?|ttf|eot|otf|exe|dmg)$/i;
const SKIP_PATH = /\/(wp-admin|wp-json|wp-login\.php|xmlrpc\.php|feed|comments\/feed|cdn-cgi)(\/|$)/i;

const outDir = path.resolve(out);
fs.mkdirSync(path.join(outDir, 'pages'), { recursive: true });

console.log(`Fetching ${startUrl.href} ...`);
const home = await follow(startUrl.href);
if (home.status !== 200) {
  console.error(`Could not load the home page (${home.status || 'no response'}${home.error ? ', ' + home.error : ''}).`);
  console.error('Check the address in a browser. If the site blocks automated visitors, open it in a browser and copy the content instead.');
  process.exit(1);
}
const origin = new URL(home.url).origin;
const bareHost = (h) => h.replace(/^www\./i, '').toLowerCase();
const siteHost = bareHost(new URL(origin).hostname);

// Normalise a link to this site: same host (www or not), no hash, no query. Returns null if not ours.
function ours(u, base = origin) {
  let x;
  try { x = new URL(u, base); } catch { return null; }
  if (!/^https?:$/.test(x.protocol) || bareHost(x.hostname) !== siteHost) return null;
  return origin + x.pathname.replace(/\/{2,}/g, '/');
}

const urls = new Map(); // url -> row
function row(u) {
  if (!urls.has(u)) urls.set(u, { url: u, path: new URL(u).pathname, status: '', redirected_to: '', content_type: '', title: '', meta_description: '', h1: '', canonical: '', robots_meta: '', word_count: '', in_sitemap: 'no', lastmod: '', inlinks: 0, fetched: 'no', needs_browser: '', file: '' });
  return urls.get(u);
}

// robots.txt
const robotsRes = await get(origin + '/robots.txt');
const robotsTxt = robotsRes.status === 200 ? robotsRes.body.toString('utf8') : '';
const robots = parseRobots(robotsTxt);

// sitemaps
const sitemapQueue = [...new Set([...robots.sitemaps, origin + '/sitemap.xml', origin + '/sitemap_index.xml', origin + '/wp-sitemap.xml'])];
const sitemapSeen = new Set(); const sitemapsFound = [];
const sitemapUrls = [];
while (sitemapQueue.length && sitemapSeen.size < 60) {
  const sm = sitemapQueue.shift();
  let smUrl; try { smUrl = new URL(sm, origin); } catch { continue; }
  if (bareHost(smUrl.hostname) !== siteHost) continue;
  smUrl = origin + smUrl.pathname + smUrl.search;
  if (sitemapSeen.has(smUrl)) continue;
  sitemapSeen.add(smUrl);
  const r = await follow(smUrl);
  if (r.status !== 200) continue;
  const xml = r.body.toString('utf8');
  if (!/<(urlset|sitemapindex)\b/i.test(xml)) continue;
  sitemapsFound.push(smUrl);
  for (const m of xml.matchAll(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi)) {
    const loc = (m[1].match(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/i) || [])[1];
    if (loc) sitemapQueue.push(decode(loc));
  }
  for (const m of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)) {
    const loc = (m[1].match(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/i) || [])[1];
    const lastmod = (m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i) || [])[1] || '';
    const u = loc && ours(decode(loc));
    if (!u) continue;
    const r2 = row(u); r2.in_sitemap = 'yes'; r2.lastmod = lastmod;
    sitemapUrls.push(u);
  }
}

// Queue
const homeUrl = ours(home.url);
const queue = [homeUrl];
const queued = new Set(queue);
const enqueue = (u) => { if (u && !queued.has(u)) { queued.add(u); queue.push(u); } };
if (mode === 'all-pages') sitemapUrls.forEach(enqueue);

const pageHtml = new Map(); // url -> html (fetched pages only)
const slugs = new Set();
const assets = new Map(); // image url -> { found_on, alt }
let fetchedCount = 0; const blocked = [];
const linkSeen = new Map(); // url -> Set of pages linking to it

function slugFor(u) {
  let s = decodeURIComponent(new URL(u).pathname).replace(/^\/+|\/+$/g, '').replace(/\.html?$/i, '').replace(/\//g, '--').replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 100) || 'index';
  let t = s; let i = 2;
  while (slugs.has(t)) t = `${s}-${i++}`;
  slugs.add(t);
  return t;
}

function record(u, res) {
  const r = row(u);
  r.status = res.status || 'error';
  r.content_type = (res.headers.get('content-type') || '').split(';')[0];
  if (res.status >= 300 && res.status < 400) r.redirected_to = res.location || '';
  if (res.error) r.content_type = r.content_type || `error: ${res.error}`;
}

// Page builders (Divi, Elementor and others) put hero and section photos in generated stylesheets,
// not in <img> tags, so a crawl that only reads the HTML misses the best pictures on the site.
// Read those stylesheets too, once each. Theme and plugin files are skipped: their images are
// interface furniture, not the business's photos.
const cssSeen = new Set();
const BUILDER_CSS = /\/(?:et-cache|uploads|cache)\/|elementor\/css\//i;
const NOT_CONTENT = /\/(?:themes|plugins|wp-includes)\//i;
async function cssImages(pageUrl, html, foundOn) {
  const sheets = tags(html, 'link')
    .filter((a) => /stylesheet/i.test(a.rel || '') && a.href)
    .map((a) => { try { return new URL(decode(a.href), pageUrl).href; } catch { return ''; } })
    .filter((h) => h && bareHost(new URL(h).hostname) === siteHost && BUILDER_CSS.test(h) && !cssSeen.has(h))
    .slice(0, 4);
  for (const sheet of sheets) {
    cssSeen.add(sheet);
    const res = await get(sheet, 1024 * 1024);
    if (res.status !== 200 || !res.body.length) continue;
    for (const m of res.body.toString('utf8').matchAll(/url\(\s*['"]?([^'")]+?\.(?:jpe?g|png|webp|avif))(?:\?[^'")]*)?['"]?\s*\)/gi)) {
      let abs; try { abs = new URL(m[1], sheet).href; } catch { continue; }
      if (NOT_CONTENT.test(abs)) continue;
      if (!assets.has(abs)) assets.set(abs, { found_on: foundOn, alt: '' });
    }
  }
}

function processPage(u, html) {
  const r = row(u);
  r.fetched = 'yes';
  r.title = stripTags(firstInner(html, 'title') || '');
  r.meta_description = meta(html, 'description');
  const h1s = allInner(html, 'h1').map(stripTags);
  r.h1 = h1s.join(' | ');
  r.canonical = linkRel(html, 'canonical');
  r.robots_meta = meta(html, 'robots');
  const md = toMarkdown(html, u);
  r.word_count = countWords(md);
  r.needs_browser = r.word_count < 50 && html.length > 20000 ? 'yes' : 'no';
  r.file = 'pages/' + slugFor(u);
  fs.writeFileSync(path.join(outDir, r.file + '.html'), html);
  fs.writeFileSync(path.join(outDir, r.file + '.md'), `<!-- source: ${u} -->\n# ${r.title}\n\n${md}`);
  pageHtml.set(u, html);
  for (const img of imagesOf(html, u)) if (!assets.has(img.url)) assets.set(img.url, { found_on: r.path, alt: img.alt });
  const links = new Set();
  for (const a of anchors(html, u)) {
    const t = ours(a.href, u);
    if (t) links.add(t);
  }
  for (const t of links) {
    if (!linkSeen.has(t)) linkSeen.set(t, new Set());
    linkSeen.get(t).add(u);
  }
  return [...links];
}

// Nav links on the home page (used by --mode single and site.json)
function navLinks(html, base) {
  const header = firstInner(html, 'header') || '';
  const nav = (header && firstInner(header, 'nav')) || header || firstInner(html, 'nav') || '';
  const seen = new Set();
  return anchors(nav, base).filter((a) => { if (seen.has(a.href)) return false; seen.add(a.href); return /^https?:/.test(a.href); });
}

while (queue.length && fetchedCount < (mode === 'homepage' ? 1 : mode === 'single' ? 21 : max)) {
  const u = queue.shift();
  const p = new URL(u).pathname;
  if (!robotsAllows(robots.rules, p)) { blocked.push(p); row(u).status = 'blocked by robots.txt'; continue; }
  if (NOT_PAGE.test(p) || SKIP_PATH.test(p)) continue;
  const res = u === homeUrl ? home : await get(u);
  record(u, res);
  if (res.status >= 300 && res.status < 400) {
    const t = ours(res.location);
    if (t && mode === 'all-pages') enqueue(t);
    continue;
  }
  const ct = res.headers.get('content-type') || '';
  if (res.status !== 200 || !/html/i.test(ct)) continue;
  fetchedCount++;
  const links = processPage(u, res.body.toString('utf8'));
  await cssImages(u, pageHtml.get(u), p);
  process.stdout.write(`  [${fetchedCount}] ${p}\n`);
  if (u === homeUrl && mode === 'single') navLinks(pageHtml.get(u), u).map((a) => ours(a.href)).filter(Boolean).slice(0, 20).forEach(enqueue);
  if (mode === 'all-pages') links.forEach(enqueue);
}
if (blocked.length && fetchedCount === 0) {
  console.error('robots.txt blocks this tool from the home page. Ask the site owner to allow "mrk-web-ingest", or copy the content from a browser.');
  process.exit(1);
}
for (const [t, set] of linkSeen) { const r = row(t); r.inlinks = set.size; }
// URLs found as links but never fetched are listed too (useful for redirect planning)

// ---------- site.json ----------

const homeHtml = pageHtml.get(homeUrl) || home.body.toString('utf8');
const allHtml = [...pageHtml.values()];

function platformGuess(html) {
  const gen = meta(html, 'generator');
  const checks = [
    ['WordPress', /wp-content\/|wp-includes\/|wp-json/i],
    ['Wix', /static\.wixstatic\.com|wix-warmup-data|_wixCssImports|X-Wix-/i],
    ['Squarespace', /static1\.squarespace\.com|Static\.SQUARESPACE_CONTEXT|squarespace-cdn\.com/i],
    ['Shopify', /cdn\.shopify\.com|Shopify\.theme/i],
    ['Webflow', /data-wf-page|webflow\.js|website-files\.com/i],
  ];
  for (const [name, re] of checks) if (re.test(gen) || re.test(html)) return { platform: name, evidence: gen || String(html.match(re)[0]) };
  const others = [['Astro', /\/_astro\/|astro-island|data-astro-cid/i], ['Next.js', /__NEXT_DATA__|\/_next\/static/i], ['Framer', /framerusercontent\.com|data-framer/i], ['GoDaddy', /img\d?\.wsimg\.com/i], ['Weebly', /weebly\.com/i], ['Joomla', /\/media\/jui\/|Joomla!/i], ['Drupal', /drupal-settings-json|\/sites\/default\/files\//i]];
  for (const [name, re] of others) if (re.test(gen) || re.test(html)) return { platform: 'other', evidence: `${name}${gen ? ' (' + gen + ')' : ''}` };
  return { platform: 'other', evidence: gen || 'no generator tag or known markers' };
}

const visibleText = allHtml.map((h) => stripTags(removeBlocks(h.replace(/<!--[\s\S]*?-->/g, ''), ['script', 'style', 'noscript', 'svg', 'head']))).join('\n');
const allLinks = allHtml.flatMap((h) => anchors(h, origin));
const uniq = (a) => [...new Set(a.filter(Boolean))];

const phones = uniq([
  ...allLinks.filter((a) => a.href.startsWith('tel:')).map((a) => decodeURIComponent(a.href.slice(4)).trim()),
  ...(visibleText.match(/(?:\+\d{1,3}[\s.-]?)?\(?0?\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g) || []).filter((p) => /^[+(0]/.test(p.trim()) && p.replace(/\D/g, '').length >= 8 && p.replace(/\D/g, '').length <= 15).map((p) => p.trim()),
]).slice(0, 15);
const emails = uniq([
  ...allLinks.filter((a) => a.href.startsWith('mailto:')).map((a) => decodeURIComponent(a.href.slice(7).split('?')[0]).toLowerCase()),
  ...(visibleText.match(/[\w.+-]+@[\w-]+\.[\w.-]+\w/g) || []).filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/i.test(e)).map((e) => e.toLowerCase()),
]).slice(0, 15);
const STREET = /\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][\w'-]*\s+){1,4}(?:St|Street|Rd|Road|Ave|Avenue|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Ct|Court|Pl|Place|Hwy|Highway|Pde|Parade|Tce|Terrace|Cres|Crescent|Cl|Close|Esplanade|Square|Sq)\b\.?(?:,?\s+[A-Z][\w'-]*){0,4}(?:,?\s+[A-Z]{2,3})?(?:,?\s+\d{4,5})?/g;
const ldBlocks = allHtml.flatMap((h) => [...h.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]));
const ldTypes = new Set(); const ldAddresses = []; const ldLogos = [];
function walkLd(o) {
  if (Array.isArray(o)) return o.forEach(walkLd);
  if (!o || typeof o !== 'object') return;
  if (o['@type']) [].concat(o['@type']).forEach((t) => ldTypes.add(String(t)));
  if (o.streetAddress) ldAddresses.push([o.streetAddress, o.addressLocality, o.addressRegion, o.postalCode, o.addressCountry?.name || o.addressCountry].filter((x) => typeof x === 'string').join(', '));
  if (o.logo) ldLogos.push(typeof o.logo === 'string' ? o.logo : o.logo.url || o.logo.contentUrl);
  Object.values(o).forEach(walkLd);
}
let ldErrors = 0;
for (const b of ldBlocks) { try { walkLd(JSON.parse(b.trim())); } catch { ldErrors++; } }
const addresses = uniq([
  ...ldAddresses,
  ...allHtml.flatMap((h) => allInner(h, 'address').map(stripTags)),
  ...(visibleText.match(STREET) || []).map((s) => s.trim()),
]).slice(0, 10);
const SOCIAL = /^(?:https?:)?\/\/(?:[\w-]+\.)?(facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|youtu\.be|tiktok\.com|pinterest\.[a-z.]+|threads\.net|github\.com|vimeo\.com|bsky\.app|behance\.net|dribbble\.com)\//i;
const social = uniq(allLinks.map((a) => a.href).filter((h) => SOCIAL.test(h) && !/sharer|share\?|intent\/|shareArticle|\/plugins\//i.test(h))).slice(0, 20);

// fonts + colours from the home page and its same-origin stylesheets
let cssText = allInner(homeHtml, 'style').join('\n') + '\n' + tags(homeHtml, '[a-z][\\w-]*').map((a) => a.style || '').join(';\n');
const stylesheets = tags(homeHtml, 'link').filter((a) => /stylesheet/i.test(a.rel || '') && a.href).map((a) => { try { return new URL(a.href, origin).href; } catch { return null; } }).filter(Boolean);
const externalCss = [];
for (const s of stylesheets.slice(0, 15)) {
  if (new URL(s).origin !== origin) { externalCss.push(s); continue; }
  const r = await get(s);
  if (r.status === 200) cssText += '\n' + r.body.toString('utf8');
}
const fontCount = new Map();
for (const m of cssText.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
  const fam = m[1].split(',')[0].replace(/!important/, '').replace(/["']/g, '').replace(/-[0-9a-f]{8,}\b/i, '').trim();
  if (/fallback/i.test(fam)) continue;
  if (fam && !/^(inherit|initial|unset|var\(|-apple-system|system-ui|sans-serif|serif|monospace)/i.test(fam)) fontCount.set(fam, (fontCount.get(fam) || 0) + 1);
}
const googleFonts = stylesheets.filter((s) => /fonts\.googleapis\.com/.test(s)).flatMap((s) => new URL(s).searchParams.getAll('family').map((f) => f.split(':')[0].replace(/\+/g, ' ')));
const fonts = uniq([...googleFonts, ...[...fontCount].sort((a, b) => b[1] - a[1]).map((x) => x[0])]).slice(0, 10);
const colourCount = new Map();
for (const m of cssText.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)) {
  let c = m[0].toLowerCase().replace(/\s+/g, '');
  if (m[1] && m[1].length === 3) c = '#' + [...m[1].toLowerCase()].map((x) => x + x).join('');
  colourCount.set(c, (colourCount.get(c) || 0) + 1);
}
const colours = [...colourCount].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([colour, uses]) => ({ colour, uses }));

// logo candidates
const headerHtml = firstInner(homeHtml, 'header') || '';
const logos = uniq([
  ...tags(homeHtml, 'img').filter((a) => /logo/i.test(`${a.src} ${a.alt} ${a.class} ${a.id}`)).map((a) => a.src || a['data-src']),
  ...tags(headerHtml, 'img').slice(0, 1).map((a) => a.src || a['data-src']),
  ...ldLogos,
  meta(homeHtml, 'og:image'),
  linkRel(homeHtml, 'apple-touch-icon'),
  linkRel(homeHtml, 'icon'),
].map((s) => { try { return s && new URL(s, origin).href; } catch { return null; } })).slice(0, 10);

// small checks
const status = async (p) => { const r = await get(origin + p); return { status: r.status, redirected_to: r.location || '', content_type: (r.headers.get('content-type') || '').split(';')[0] }; };
const llms = await status('/llms.txt');
const fake = await status(`/mrk-web-check-${Date.now().toString(36)}-not-a-real-page/`);
const pEq1 = await status('/?p=1');
const feed = await status('/feed/');

const rows = [...urls.values()];
const site = {
  start_url: startUrl.href,
  origin,
  crawled_at: new Date().toISOString(),
  mode,
  counts: {
    urls_known: rows.length,
    pages_fetched: fetchedCount,
    in_sitemap: rows.filter((r) => r.in_sitemap === 'yes').length,
    status_200: rows.filter((r) => r.status === 200).length,
    redirects: rows.filter((r) => r.status >= 300 && r.status < 400).length,
    errors_4xx_5xx: rows.filter((r) => r.status >= 400).length,
    blocked_by_robots: blocked.length,
    needs_browser: rows.filter((r) => r.needs_browser === 'yes').length,
    images: assets.size,
  },
  platform: platformGuess(homeHtml),
  nav_links: navLinks(homeHtml, origin).slice(0, 40),
  footer_links: (() => { const f = allInner(homeHtml, 'footer').pop() || ''; return anchors(f, origin).slice(0, 60); })(),
  phones, emails, addresses, social_links: social,
  jsonld_types: [...ldTypes].sort(), jsonld_parse_errors: ldErrors,
  fonts, colours, external_stylesheets: externalCss,
  logo_candidates: logos,
  checks: {
    robots_txt: robotsRes.status === 200,
    sitemap_xml: sitemapsFound.length > 0,
    sitemaps_found: sitemapsFound,
    llms_txt: llms.status === 200 && !/html/i.test(llms.content_type),
    made_up_url: { ...fake, verdict: fake.status === 404 ? 'real 404' : fake.status === 200 ? 'soft 404 (returns 200 for missing pages)' : `returns ${fake.status}` },
    query_p_1: pEq1,
    feed: feed,
  },
};

// ---------- images ----------

const assetRows = [];
const usedNames = new Set();
let downloaded = 0, skipped = 0;
if (images) fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
for (const [url, info] of assets) {
  const r = { image_url: url, found_on: info.found_on, alt: info.alt, bytes: '', local_file: '' };
  if (images) {
    const res = await get(url, IMAGE_CAP); // images are often on a CDN; only image/* responses are kept
    const ct = res.headers.get('content-type') || '';
    if (res.status === 200 && /^image\//i.test(ct) && res.body.length) {
      let base = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'image').replace(/[^\w.-]+/g, '-').replace(/^\.+/, '').slice(0, 80) || 'image';
      if (!/\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic)$/i.test(base)) base += '.' + (ct.split('/')[1].split(/[;+]/)[0].replace('jpeg', 'jpg') || 'img');
      let name = base; let i = 2;
      while (usedNames.has(name.toLowerCase())) name = base.replace(/(\.\w+)$/, `-${i++}$1`);
      usedNames.add(name.toLowerCase());
      fs.writeFileSync(path.join(outDir, 'assets', name), res.body);
      r.bytes = res.body.length; r.local_file = 'assets/' + name; downloaded++;
    } else { r.local_file = `skipped: ${res.error || res.status + ' ' + ct}`; skipped++; }
  }
  assetRows.push(r);
}

fs.writeFileSync(path.join(outDir, 'urls.csv'), csv(['url', 'path', 'status', 'redirected_to', 'content_type', 'title', 'meta_description', 'h1', 'canonical', 'robots_meta', 'word_count', 'in_sitemap', 'lastmod', 'inlinks', 'fetched', 'needs_browser', 'file'], rows));
fs.writeFileSync(path.join(outDir, 'assets.csv'), csv(['image_url', 'found_on', 'alt', 'bytes', 'local_file'], assetRows));
fs.writeFileSync(path.join(outDir, 'site.json'), JSON.stringify(site, null, 2) + '\n');

// ---------- summary ----------

const c = site.counts;
console.log(`
Done. ${origin} looks like ${site.platform.platform}${site.platform.evidence ? ` (${site.platform.evidence.slice(0, 60)})` : ''}.
  Pages fetched: ${c.pages_fetched}   URLs known: ${c.urls_known}   In sitemap: ${c.in_sitemap}   Redirects: ${c.redirects}   Errors: ${c.errors_4xx_5xx}
  Images referenced: ${c.images}${images ? `   downloaded: ${downloaded}   skipped: ${skipped}` : ' (add --images to download them)'}
  Contact found: ${phones.length} phone, ${emails.length} email, ${addresses.length} address, ${social.length} social links
  robots.txt: ${site.checks.robots_txt ? 'yes' : 'no'}   sitemap: ${site.checks.sitemap_xml ? 'yes' : 'no'}   llms.txt: ${site.checks.llms_txt ? 'yes' : 'no'}   missing pages: ${site.checks.made_up_url.verdict}
${c.needs_browser ? `  ${c.needs_browser} page(s) look JavaScript-rendered (needs_browser=yes in urls.csv): open those in a browser to read them.\n` : ''}${blocked.length ? `  ${blocked.length} URL(s) skipped because robots.txt blocks them.\n` : ''}
Written to ${path.relative(process.cwd(), outDir) || '.'}/: urls.csv, assets.csv, site.json, pages/*.html + *.md
Next: read site.json, then the .md files, to plan the new site. Keep urls.csv for redirects.mjs.`);
