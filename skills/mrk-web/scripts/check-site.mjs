#!/usr/bin/env node
// check-site.mjs - scan a built static site (e.g. Astro's dist/) before it ships.
//
// Usage:
//   node check-site.mjs [dist] [--old-host www.old-site.com] [--site-url https://example.com] [--out _mrk/checks]
//
//   dist        folder with the built site (default: dist)
//   --old-host  the old website's host; any link or image still pointing there is an error
//   --site-url  the live address; absolute links to it are checked like internal links
//
// Errors (exit 1): missing/empty/duplicate <title>, missing meta description, not exactly one <h1>,
//   missing canonical or <html lang>, internal links/images/assets to files not in the build,
//   placeholder text, links to the old host/localhost/*.local/*.pages.dev/staging hosts,
//   JSON-LD that does not parse, sitemap problems, robots.txt problems, no 404.html.
// Warnings: long title/description, image alt/size/lazy issues, image files > 200 KB,
//   JS or CSS per page > 150 KB, missing social tags, llms.txt problems, unlabelled navs, HTML > 250 KB.
// Output: <out>/site-check.json (per-page findings + totals). Exit 0 no errors, 1 errors, 2 usage.
//
// Accepting a finding: add a line to <out>/allow.txt as "rule /path/ # reason" (or * for every
// page). It is then listed as waived instead of counted. A line with no reason is ignored.

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const HELP = 'Usage: node check-site.mjs [dist] [--old-host www.old-site.com] [--site-url https://example.com] [--out _mrk/checks]';
let args;
try {
  args = parseArgs({ allowPositionals: true, options: { 'old-host': { type: 'string' }, 'site-url': { type: 'string' }, out: { type: 'string', default: '_mrk/checks' }, help: { type: 'boolean', short: 'h' } } });
} catch (e) { console.error(`Error: ${e.message}\n${HELP}`); process.exit(2); }
if (args.values.help) { console.log(HELP); process.exit(0); }
if (args.positionals.length > 1) { console.error(`Error: give at most one folder.\n${HELP}`); process.exit(2); }
const dist = path.resolve(args.positionals[0] || 'dist');
if (!fs.existsSync(path.join(dist))) { console.error(`Error: ${dist} does not exist. Build the site first (npm run build), or pass the build folder.`); process.exit(2); }
const oldHost = (args.values['old-host'] || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
let siteHost = '';
if (args.values['site-url']) { try { siteHost = new URL(args.values['site-url']).hostname.toLowerCase(); } catch { console.error('Error: --site-url must be a full address like https://www.example.com'); process.exit(2); } }

// ---------- helpers ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m);
function attrs(inner) {
  const o = {}; const re = /([^\s=\/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g; let m;
  while ((m = re.exec(inner))) o[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return o;
}
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => attrs(m[1]));
const inner = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi'))].map((m) => m[1]);
const text = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const metaBy = (html, key) => { for (const a of tags(html, 'meta')) if ((a.name || a.property || '').toLowerCase() === key) return a.content ?? ''; return null; };
const hasRel = (a, rel) => (a.rel || '').toLowerCase().split(/\s+/).includes(rel);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// ---------- build index ----------
const files = walk(dist);
const built = new Set();
const sizeOf = new Map(); // url path -> bytes
for (const f of files) {
  const rel = '/' + path.relative(dist, f).split(path.sep).join('/');
  built.add(rel); sizeOf.set(rel, fs.statSync(f).size);
  if (rel.endsWith('/index.html')) { const d = rel.slice(0, -'index.html'.length); built.add(d); if (d !== '/') built.add(d.slice(0, -1)); }
  else if (rel.endsWith('.html')) built.add(rel.slice(0, -5));
}
// static rules in _redirects count as valid targets (with a warning)
const redirectSources = new Set();
if (fs.existsSync(path.join(dist, '_redirects'))) {
  for (const line of fs.readFileSync(path.join(dist, '_redirects'), 'utf8').split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p[0] && !p[0].startsWith('#') && !/[*:]/.test(p[0])) { redirectSources.add(p[0]); redirectSources.add(p[0].replace(/\/$/, '') || '/'); }
  }
}

// Findings the owner has accepted: <out>/allow.txt, one per line as "rule /path/ # reason".
// Use * as the path to waive a rule on every page. A line without a reason is ignored.
const allowFile = path.join(path.resolve(args.values.out), 'allow.txt');
const allowed = [];
if (fs.existsSync(allowFile)) for (const line of fs.readFileSync(allowFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*([a-z0-9-]+)\s+(\S+)\s*#\s*(\S.*)$/);
  if (m) allowed.push({ rule: m[1], page: m[2], reason: m[3].trim() });
}
const waived = [];

const findings = {}; // page -> [{rule, level, detail}]
const ruleLevel = {};
function add(page, level, rule, detail = '') {
  const ok = allowed.find((a) => a.rule === rule && (a.page === '*' || a.page === page));
  if (ok) { waived.push({ page, rule, reason: ok.reason }); return; }
  ruleLevel[rule] = level;
  (findings[page] ||= []).push({ rule, level, detail: String(detail).slice(0, 200) });
}

const BAD_HOST = (h) => {
  h = h.toLowerCase();
  if (oldHost && (h === oldHost || h.replace(/^www\./, '') === oldHost.replace(/^www\./, ''))) return 'old host';
  if (h === 'localhost' || /^127\.|^0\.0\.0\.0$|^\[?::1\]?$/.test(h)) return 'localhost';
  if (h.endsWith('.local') || h.endsWith('.localhost') || h.endsWith('.test')) return 'local dev host';
  if (h.endsWith('.pages.dev')) return 'Cloudflare preview host (*.pages.dev)';
  if (/(^|[.-])(staging|stage)([.-]|$)|\.wpengine\.com$|\.wpenginepowered\.com$|\.kinsta\.cloud$|\.flywheelsites\.com$|\.cloudwaysapps\.com$/.test(h)) return 'staging host';
  return '';
};
// Errors block a launch, so only patterns that are almost never real writing are errors.
const PLACEHOLDERS = [
  [/lorem ipsum/i, 'lorem ipsum', 'error'],
  [/\bTODO\b/, 'TODO', 'error'],
  [/\bFIXME\b/, 'FIXME', 'error'],
  // [TOPIC] or [COMPANY NAME] in capitals, and [sales_products]-style leftover shortcodes.
  // Mixed case such as "[How-To Video]" is ordinary writing and is left alone.
  [/\[(?:[A-Z][A-Z0-9 _-]{2,40}|[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?: [^\]\n]{0,60})?)\]/, 'square-bracket placeholder', 'error'],
  [/\[[^\]\n]{0,40}\b(?:placeholder|insert|your [a-z]+|tbd|lorem)\b[^\]\n]{0,40}\]/i, 'square-bracket placeholder', 'error'],
  [/\{\{[^}\n]{0,60}\}\}/, '{{...}} template token', 'error'],
  // Often a leftover, but also ordinary words in an article, so these only warn.
  [/\bexample\.(?:com|org|net)\b/i, 'example.com', 'warning'],
  [/\byour (?:company|business) name\b/i, '"your company name"', 'warning'],
];

// Resolve a URL found in a page to a path in the build, or null if external.
function localPath(u, pageUrl) {
  if (!u || /^(mailto:|tel:|javascript:|data:|sms:|#)/i.test(u.trim())) return null;
  let x;
  try { x = new URL(u.trim(), 'https://build.invalid' + pageUrl); } catch { return null; }
  if (x.hostname !== 'build.invalid' && !(siteHost && x.hostname.toLowerCase() === siteHost)) return null;
  if (!/^https?:$/.test(x.protocol)) return null;
  try { return decodeURI(x.pathname); } catch { return x.pathname; }
}
const exists = (p) => built.has(p) || built.has(p.replace(/\/$/, '')) || built.has(p + '/');

// ---------- per page ----------
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const titles = new Map();
let checked = 0, skippedRedirectPages = 0;
for (const f of htmlFiles) {
  const rel = '/' + path.relative(dist, f).split(path.sep).join('/');
  const page = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
  const html = fs.readFileSync(f, 'utf8');
  if (/<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(html) && !/<h1\b/i.test(html)) { skippedRedirectPages++; continue; }
  checked++;
  const is404 = /^\/404(\.html|\/)$/.test(page) || page === '/404.html';
  // iframe srcdoc="..." holds a whole encoded document: lift it out so its tags are checked as tags
  const srcdocs = [];
  let noScripts = html.replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*')/gi, (m, v) => { srcdocs.push(decode(v.slice(1, -1))); return ''; });
  noScripts = (noScripts + srcdocs.join('\n')).replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script\b(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');

  // title / description / h1 / canonical / lang
  const t = inner(html, 'title')[0];
  const title = t === undefined ? null : text(t);
  if (title === null) add(page, 'error', 'missing-title');
  else if (!title) add(page, 'error', 'empty-title');
  else {
    if (!is404) { if (!titles.has(title)) titles.set(title, []); titles.get(title).push(page); }
    if (title.length > 60) add(page, 'warning', 'title-over-60-chars', `${title.length} chars: ${title}`);
  }
  const desc = metaBy(html, 'description');
  if (!desc || !desc.trim()) add(page, 'error', 'missing-meta-description');
  else if (desc.length > 160) add(page, 'warning', 'description-over-160-chars', `${desc.length} chars`);
  const h1 = (html.match(/<h1\b/gi) || []).length;
  if (h1 !== 1) add(page, 'error', 'not-exactly-one-h1', `${h1} found`);
  if (!is404 && !tags(html, 'link').some((a) => hasRel(a, 'canonical') && a.href)) add(page, 'error', 'missing-canonical');
  if (!(tags(html, 'html')[0] || {}).lang) add(page, 'error', 'missing-html-lang');

  // links, images, assets
  const brokenSeen = new Set();
  const checkRef = (u, rule) => {
    const p = localPath(u, page);
    if (p === null || exists(p)) return;
    if (redirectSources.has(p) || redirectSources.has(p.replace(/\/$/, ''))) { add(page, 'warning', 'link-to-redirect', p); return; }
    if (brokenSeen.has(rule + p)) return; brokenSeen.add(rule + p);
    add(page, 'error', rule, p);
  };
  for (const a of tags(noScripts, 'a')) if (a.href !== undefined) checkRef(a.href, 'broken-internal-link');
  const imgs = tags(noScripts, 'img');
  const srcsetUrls = (ss) => (ss || '').split(/,\s+/).map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
  for (const a of imgs) { checkRef(a.src, 'broken-image'); srcsetUrls(a.srcset).forEach((u) => checkRef(u, 'broken-image')); }
  for (const a of tags(noScripts, 'source')) srcsetUrls(a.srcset).forEach((u) => checkRef(u, 'broken-image'));
  const ogImage = metaBy(html, 'og:image'); if (ogImage) checkRef(ogImage, 'broken-image');
  const scripts = tags(html, 'script').filter((a) => a.src);
  const links = tags(html, 'link');
  for (const a of scripts) checkRef(a.src, 'broken-asset');
  for (const a of links) if (a.href && (hasRel(a, 'stylesheet') || hasRel(a, 'icon') || hasRel(a, 'modulepreload') || hasRel(a, 'preload') || hasRel(a, 'manifest') || hasRel(a, 'apple-touch-icon'))) checkRef(a.href, 'broken-asset');

  // bad hosts anywhere in URLs (links, images, canonical, og, JSON-LD)
  const hostSeen = new Set();
  for (const m of noScripts.matchAll(/(?:https?:)?\/\/([a-z0-9][a-z0-9.-]*[a-z0-9]|\[::1\])(?::\d+)?(?=[\/"'\s?#<)]|$)/gi)) {
    const why = BAD_HOST(m[1]);
    if (why && !hostSeen.has(m[1])) { hostSeen.add(m[1]); add(page, 'error', 'bad-host', `${m[1]} (${why})`); }
  }

  // placeholders in visible text + title/description/alt
  const visible = text(noScripts.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')) + ' ' + imgs.map((a) => a.alt || '').join(' ') + ' ' + (desc || '');
  for (const [re, label, level] of PLACEHOLDERS) { const m = visible.match(re); if (m) add(page, level, level === 'error' ? 'placeholder-text' : 'possible-placeholder', `${label}: "${m[0]}"`); }
  for (const a of tags(noScripts, 'a')) if (/example\.(com|org|net)/i.test(a.href || '')) { add(page, 'error', 'placeholder-text', `link to ${a.href}`); break; }

  // JSON-LD
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch (e) { add(page, 'error', 'jsonld-does-not-parse', e.message); }
  }

  // image warnings
  imgs.forEach((a, i) => {
    if (a.alt === undefined) add(page, 'warning', 'img-missing-alt', a.src);
    if (a.width === undefined || a.height === undefined) add(page, 'warning', 'img-missing-width-height', a.src);
    if (i === 0 && (a.loading || '').toLowerCase() === 'lazy') add(page, 'warning', 'first-image-lazy-loaded', a.src);
  });

  // JS / CSS weight
  let js = 0, css = 0;
  for (const a of scripts) { const p = localPath(a.src, page); if (p) js += sizeOf.get(p) || 0; }
  for (const a of links) { const p = a.href && localPath(a.href, page); if (!p) continue; if (hasRel(a, 'stylesheet')) css += sizeOf.get(p) || 0; else if (hasRel(a, 'modulepreload')) js += sizeOf.get(p) || 0; }
  for (const m of html.matchAll(/<script\b(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)) js += m[1].length; // inline scripts count too
  css += inner(html, 'style').reduce((n, s) => n + s.length, 0);
  if (js > 150 * 1024) add(page, 'warning', 'js-over-150kb', `${Math.round(js / 1024)} KB`);
  if (css > 150 * 1024) add(page, 'warning', 'css-over-150kb', `${Math.round(css / 1024)} KB`);

  // social tags
  if (!is404) for (const k of ['og:title', 'og:image', 'twitter:card']) if (!metaBy(html, k)) add(page, 'warning', `missing-${k.replace(':', '-')}`);

  // navs
  const navs = tags(html, 'nav');
  if (navs.length > 1 && navs.filter((a) => !a['aria-label'] && !a['aria-labelledby']).length > 0) add(page, 'warning', 'unlabelled-nav', `${navs.length} <nav> elements, ${navs.filter((a) => !a['aria-label'] && !a['aria-labelledby']).length} without aria-label`);

  if (html.length > 250 * 1024) add(page, 'warning', 'html-over-250kb', `${Math.round(html.length / 1024)} KB`);
}
for (const [title, pages] of titles) if (pages.length > 1) for (const p of pages) add(p, 'error', 'duplicate-title', `"${title}" also on ${pages.filter((x) => x !== p).slice(0, 3).join(', ')}`);

// ---------- site-wide ----------
const SITE = '(site)';
for (const [rel, bytes] of sizeOf) if (/\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$/i.test(rel) && bytes > 200 * 1024) add(SITE, 'warning', 'image-file-over-200kb', `${rel} (${Math.round(bytes / 1024)} KB)`);
if (!fs.existsSync(path.join(dist, '404.html'))) add(SITE, 'error', 'no-404-page', 'add src/pages/404.astro so dist/404.html is built');

// sitemap
const smFile = ['sitemap.xml', 'sitemap-index.xml'].find((n) => fs.existsSync(path.join(dist, n)));
if (!smFile) add(SITE, 'error', 'no-sitemap', 'no sitemap.xml or sitemap-index.xml in the build');
else {
  const queue = [smFile]; const seen = new Set(); let count = 0;
  while (queue.length) {
    const n = queue.shift(); if (seen.has(n)) continue; seen.add(n);
    const fp = path.join(dist, n); if (!fs.existsSync(fp)) { add(SITE, 'error', 'sitemap-url-not-in-build', `sitemap file ${n} missing`); continue; }
    const xml = fs.readFileSync(fp, 'utf8');
    for (const m of xml.matchAll(/<sitemap>\s*<loc>\s*([^<]+?)\s*<\/loc>/gi)) { try { queue.push(new URL(decode(m[1])).pathname.replace(/^\//, '')); } catch {} }
    for (const m of xml.matchAll(/<url>\s*<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      count++;
      let u; try { u = new URL(decode(m[1])); } catch { add(SITE, 'error', 'sitemap-url-not-in-build', m[1]); continue; }
      const why = BAD_HOST(u.hostname); if (why) add(SITE, 'error', 'bad-host', `sitemap uses ${u.hostname} (${why})`);
      let p; try { p = decodeURI(u.pathname); } catch { p = u.pathname; }
      if (!exists(p)) add(SITE, 'error', 'sitemap-url-not-in-build', p);
    }
  }
  if (!count) add(SITE, 'error', 'no-sitemap', `${smFile} lists no URLs`);
}

// robots.txt
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended'];
if (!fs.existsSync(path.join(dist, 'robots.txt'))) add(SITE, 'error', 'no-robots-txt', 'add public/robots.txt');
else {
  const groups = []; let cur = null; let lastAgent = false;
  for (const raw of fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8').split(/\r?\n/)) {
    const m = raw.replace(/#.*/, '').trim().match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') { if (!lastAgent) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastAgent = true; continue; }
    lastAgent = false;
    if (cur && (k === 'allow' || k === 'disallow')) cur.rules.push({ allow: k === 'allow', path: v });
  }
  const blocksRoot = (agent) => {
    let g = groups.filter((x) => x.agents.includes(agent.toLowerCase()));
    if (!g.length) g = groups.filter((x) => x.agents.includes('*'));
    const rules = g.flatMap((x) => x.rules).filter((r) => r.path);
    const dis = rules.some((r) => !r.allow && (r.path === '/' || r.path === '/*'));
    const allowRoot = rules.some((r) => r.allow && (r.path === '/' || r.path === '/*' || r.path === '/$'));
    return dis && !allowRoot;
  };
  if (blocksRoot('*')) add(SITE, 'error', 'robots-blocks-crawlers', 'User-agent: * is disallowed from /');
  for (const b of AI_BOTS) if (blocksRoot(b)) add(SITE, 'error', 'robots-blocks-ai-crawler', b);
  if (!/^\s*sitemap\s*:/im.test(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8'))) add(SITE, 'warning', 'robots-no-sitemap-line', 'add "Sitemap: https://.../sitemap.xml"');
}

// llms.txt
const llmsPath = path.join(dist, 'llms.txt');
if (!fs.existsSync(llmsPath)) add(SITE, 'warning', 'no-llms-txt', 'add public/llms.txt (H1 with the business name, a summary, and markdown links to key pages)');
else {
  const l = fs.readFileSync(llmsPath, 'utf8');
  if (!/^# \S/m.test(l)) add(SITE, 'warning', 'llms-txt-no-h1');
  if (!/\[[^\]]+\]\([^)]+\)/.test(l)) add(SITE, 'warning', 'llms-txt-no-links');
}

// ---------- report ----------
const byRule = {};
let errors = 0, warnings = 0;
for (const [page, list] of Object.entries(findings)) for (const f of list) {
  const r = (byRule[f.rule] ||= { level: f.level, count: 0, examples: [] });
  r.count++; if (f.level === 'error') errors++; else warnings++;
  if (r.examples.length < 5) r.examples.push(page === SITE ? f.detail : `${page}${f.detail ? '  (' + f.detail + ')' : ''}`);
}
const outDir = path.resolve(args.values.out);
fs.mkdirSync(outDir, { recursive: true });
const report = { dist, checked_at: new Date().toISOString(), totals: { pages_checked: checked, redirect_pages_skipped: skippedRedirectPages, files: files.length, errors, warnings, waived: waived.length }, rules: byRule, pages: findings, waived };
fs.writeFileSync(path.join(outDir, 'site-check.json'), JSON.stringify(report, null, 2) + '\n');

const show = (level) => Object.entries(byRule).filter(([, r]) => r.level === level).sort((a, b) => b[1].count - a[1].count);
console.log(`Checked ${checked} pages in ${dist}${skippedRedirectPages ? ` (${skippedRedirectPages} redirect pages skipped)` : ''}.`);
if (errors) {
  console.log(`\nERRORS (${errors}) - must fix before launch:`);
  for (const [rule, r] of show('error')) { console.log(`  ${rule}: ${r.count}`); r.examples.forEach((e) => console.log(`      ${e}`)); }
}
if (warnings) {
  console.log(`\nWarnings (${warnings}) - worth fixing:`);
  for (const [rule, r] of show('warning')) console.log(`  ${rule}: ${r.count}   e.g. ${r.examples.slice(0, 2).join(' ; ')}`);
}
if (waived.length) console.log(`\nWaived (${waived.length}) by ${path.relative(process.cwd(), allowFile)}. The reasons are in the full report.`);
console.log(`\nFull report: ${path.relative(process.cwd(), path.join(outDir, 'site-check.json'))}`);
console.log(errors ? 'Result: FAIL. Fix the errors above, rebuild, and run this again.' : 'Result: PASS (no errors).');
process.exit(errors ? 1 : 0);
