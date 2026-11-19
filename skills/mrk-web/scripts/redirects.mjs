#!/usr/bin/env node
// redirects.mjs - make sure nothing from the old site 404s on the new one.
//
// Usage:
//   node redirects.mjs --old _mrk/ingest/urls.csv --dist dist [--map _mrk/redirects.csv] [--write public/_redirects]
//
// Every old path that returned 200 (or was listed in the old sitemap) must either exist in the build at
// the same path, or have a row in the map CSV (columns: old_path,new_path,status,note,impressions).
// The first run creates the map with every unmatched old path and a blank new_path. When the last part
// of an old path matches a built page, that page is suggested in `note` (it is never filled in for you).
//
// Fails (exit 1) on: unmapped old paths, new_path not in the build, chains (A->B->C) and loops,
// status other than 301 without a note saying why, query strings in old_path, Cloudflare limits exceeded.
// --write puts the rules into a Cloudflare Pages _redirects file between "# mrk-web:start" and
// "# mrk-web:end", keeping everything else. Each rule is written with and without a trailing slash;
// exact rules come before splat/placeholder rules. Nothing is written while there are errors.
//
// Cloudflare Pages limits (developers.cloudflare.com/pages/configuration/redirects/, checked 2026-11):
// 2,000 static + 100 dynamic rules, 1,000 characters per rule, query strings cannot be matched,
// codes 301/302/303/307/308, top-most rule wins, and a rule applies even if a file exists at that path.
// Exit codes: 0 all good, 1 problems to fix, 2 usage error.

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const HELP = 'Usage: node redirects.mjs --old _mrk/ingest/urls.csv --dist dist [--map _mrk/redirects.csv] [--write public/_redirects]';
let args;
try {
  args = parseArgs({ options: { old: { type: 'string' }, dist: { type: 'string', default: 'dist' }, map: { type: 'string', default: '_mrk/redirects.csv' }, write: { type: 'string' }, help: { type: 'boolean', short: 'h' } } });
} catch (e) { console.error(`Error: ${e.message}\n${HELP}`); process.exit(2); }
const o = args.values;
if (o.help) { console.log(HELP); process.exit(0); }
if (!o.old) { console.error(`Error: --old is required (the urls.csv written by crawl.mjs).\n${HELP}`); process.exit(2); }
if (!fs.existsSync(o.old)) { console.error(`Error: ${o.old} not found. Run crawl.mjs on the old site first.`); process.exit(2); }
if (!fs.existsSync(o.dist)) { console.error(`Error: build folder ${o.dist} not found. Run the build first (npm run build).`); process.exit(2); }

const LIMIT_STATIC = 2000, LIMIT_DYNAMIC = 100, LIMIT_LINE = 1000;
const START = '# mrk-web:start', END = '# mrk-web:end';
const MAP_COLS = ['old_path', 'new_path', 'status', 'note', 'impressions'];

// ---------- CSV ----------
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (rows) => [MAP_COLS.join(','), ...rows.map((r) => MAP_COLS.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';

// ---------- build index ----------
const built = new Set(); const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const rel = '/' + path.relative(o.dist, p).split(path.sep).join('/');
    built.add(rel);
    if (rel.endsWith('/index.html')) { const d = rel.slice(0, -10); built.add(d); if (d !== '/') built.add(d.slice(0, -1)); pages.push(d); }
    else if (rel.endsWith('.html')) { built.add(rel.slice(0, -5)); pages.push(rel.slice(0, -5)); }
  }
})(o.dist);
const inBuild = (p) => built.has(p) || built.has(p.replace(/\/$/, '')) || built.has(p + '/');
const lastSeg = (p) => p.replace(/\/+$/, '').split('/').pop().replace(/\.html?$/i, '').toLowerCase();
const bySeg = new Map();
for (const p of pages) { const s = lastSeg(p); if (!s || /^404$/.test(s)) continue; if (!bySeg.has(s)) bySeg.set(s, []); bySeg.get(s).push(p); }
const isDynamic = (p) => p.includes('*') || /:[A-Za-z]\w*/.test(p);
const patternRe = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:[A-Za-z]\w*/g, '[^/]+') + '$');
const cleanPath = (u) => { try { return decodeURI(new URL(u, 'https://x.invalid').pathname); } catch { return u.split(/[?#]/)[0]; } };

// ---------- old paths ----------
const oldRows = parseCsv(fs.readFileSync(o.old, 'utf8'));
if (oldRows.length && !('path' in oldRows[0] || 'url' in oldRows[0])) { console.error(`Error: ${o.old} needs a "path" or "url" column (use the urls.csv from crawl.mjs).`); process.exit(2); }
const oldPaths = [...new Set(oldRows
  .filter((r) => r.status === '200' || (!r.status && r.in_sitemap === 'yes') || (!('status' in r)))
  .map((r) => r.path || cleanPath(r.url))
  .filter((p) => p && p.startsWith('/')))];

// ---------- map ----------
let map = fs.existsSync(o.map) ? parseCsv(fs.readFileSync(o.map, 'utf8')) : null;
const created = !map;
map ||= [];
const mapped = new Map(map.map((r) => [r.old_path, r]));
const dynamicRows = map.filter((r) => isDynamic(r.old_path) && r.new_path);
const coveredBySplat = (p) => dynamicRows.some((r) => patternRe(r.old_path).test(p));
let added = 0;
for (const p of oldPaths) {
  if (inBuild(p) || mapped.has(p) || coveredBySplat(p)) continue;
  const sug = bySeg.get(lastSeg(p));
  const row = { old_path: p, new_path: '', status: '301', note: sug ? `suggested: ${sug.slice(0, 3).join(' or ')}` : '', impressions: '' };
  map.push(row); mapped.set(p, row); added++;
}
if (added || created) { fs.mkdirSync(path.dirname(path.resolve(o.map)), { recursive: true }); fs.writeFileSync(o.map, toCsv(map)); }

// ---------- validate ----------
const errors = []; const warnings = [];
const err = (rule, detail) => errors.push({ rule, detail });
const warn = (rule, detail) => warnings.push({ rule, detail });
const target = new Map(map.filter((r) => r.new_path).map((r) => [r.old_path.replace(/\/$/, '') || '/', r.new_path]));
for (const r of map) {
  const { old_path: from, new_path: to, note } = r;
  const status = r.status || '301';
  if (!from) { err('row-without-old-path', JSON.stringify(r)); continue; }
  if (!from.startsWith('/') && !/^https?:\/\//.test(from)) err('old-path-must-start-with-slash', from);
  if (/[?]/.test(from)) err('query-string-in-old-path', `${from} (Cloudflare Pages cannot match query strings; map the path only)`);
  if (!to) { err('unmapped-old-path', `${from}${r.impressions ? ` (${r.impressions} impressions)` : ''}${note ? `  - ${note}` : ''}`); continue; }
  if (!['301', '302', '303', '307', '308'].includes(status)) err('unsupported-status', `${from} -> ${status} (Cloudflare Pages redirects support 301, 302, 303, 307, 308)`);
  else if (status !== '301' && !note) err('status-not-301-without-note', `${from} -> ${to} ${status} (use 301, or say why in note)`);
  const external = /^https?:\/\//i.test(to);
  if (external) warn('redirect-to-other-site', `${from} -> ${to}`);
  else {
    if (!to.startsWith('/')) err('new-path-must-start-with-slash', `${from} -> ${to}`);
    const tp = cleanPath(to);
    if (!tp.includes(':splat') && !/:[A-Za-z]\w*/.test(tp) && !inBuild(tp)) err('new-path-not-in-build', `${from} -> ${to}`);
    // chains and loops
    const norm = (p) => cleanPath(p).replace(/\/$/, '') || '/';
    if (norm(to) === norm(from)) { err('redirect-loop', `${from} -> ${to}`); continue; }
    const seen = [norm(from)]; let cur = norm(to); let loop = false;
    while (target.has(cur) && !/^https?:/i.test(target.get(cur)) && seen.length < 20) {
      if (seen.includes(cur)) { loop = true; break; }
      seen.push(cur); cur = norm(target.get(cur));
    }
    if (loop || seen.includes(cur)) err('redirect-loop', [...seen, cur].join(' -> '));
    else if (seen.length > 1) err('redirect-chain', `${[...seen, cur].join(' -> ')} (point ${from} straight at the final page)`);
  }
  if (!isDynamic(from) && inBuild(from) && from !== '/') warn('redirect-hides-built-page', `${from} exists in the build, but Cloudflare follows the redirect anyway, so the page becomes unreachable`);
}

// ---------- rules ----------
const lines = [];
const exact = map.filter((r) => r.new_path && !isDynamic(r.old_path));
const dyn = map.filter((r) => r.new_path && isDynamic(r.old_path));
const seenFrom = new Set();
const push = (from, to, status) => {
  if (seenFrom.has(from)) return; seenFrom.add(from);
  const line = `${from} ${to} ${status}`;
  if (line.length > LIMIT_LINE) err('rule-too-long', `${from} (${line.length} characters, limit ${LIMIT_LINE})`);
  lines.push(line);
};
for (const r of exact) {
  const status = r.status || '301';
  push(r.old_path, r.new_path, status);
  if (r.old_path === '/' || /\.[a-z0-9]{2,5}$/i.test(r.old_path)) continue; // files and home have no slash twin
  const twin = r.old_path.endsWith('/') ? r.old_path.slice(0, -1) : r.old_path + '/';
  if (cleanPath(r.new_path) !== twin && !inBuild(twin)) push(twin, r.new_path, status);
}
const staticRules = lines.length;
for (const r of dyn) push(r.old_path, r.new_path, r.status || '301');
const dynamicRules = lines.length - staticRules;

// Existing rules outside our markers count toward the limits too.
let outside = '';
let before = '', after = '';
if (o.write && fs.existsSync(o.write)) {
  const cur = fs.readFileSync(o.write, 'utf8');
  const s = cur.indexOf(START), e = cur.indexOf(END);
  if (s !== -1 && e > s) { before = cur.slice(0, s); after = cur.slice(e + END.length).replace(/^\r?\n/, ''); }
  else if (s !== -1 || e !== -1) { console.error(`Error: ${o.write} has only one of the "${START}" / "${END}" lines. Fix or remove it by hand, then run again.`); process.exit(2); }
  else after = cur; // no block yet: ours goes on top so exact rules come before any existing splats
  outside = before + '\n' + after;
}
const outsideRules = outside.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const outsideDynamic = outsideRules.filter((l) => isDynamic(l.split(/\s+/)[0])).length;
const totStatic = staticRules + outsideRules.length - outsideDynamic, totDynamic = dynamicRules + outsideDynamic;
if (totStatic > LIMIT_STATIC) err('too-many-static-rules', `${totStatic} static rules (Cloudflare Pages limit ${LIMIT_STATIC}). Use splat rules for whole sections, or Cloudflare Bulk Redirects.`);
else if (totStatic > LIMIT_STATIC * 0.8) warn('static-rules-near-limit', `${totStatic} of ${LIMIT_STATIC}`);
if (totDynamic > LIMIT_DYNAMIC) err('too-many-dynamic-rules', `${totDynamic} splat/placeholder rules (limit ${LIMIT_DYNAMIC})`);
else if (totDynamic > LIMIT_DYNAMIC * 0.8) warn('dynamic-rules-near-limit', `${totDynamic} of ${LIMIT_DYNAMIC}`);
if (outsideDynamic && before.split('\n').some((l) => l.trim() && !l.startsWith('#') && isDynamic(l.trim().split(/\s+/)[0]))) warn('splat-above-mrk-web-block', `a splat rule above "${START}" in ${o.write} will win over the exact rules below it`);

let wrote = false;
if (o.write && !errors.length) {
  const block = [START, `# Generated by redirects.mjs from ${o.map} on ${new Date().toISOString().slice(0, 10)}. Edit the CSV, not these lines.`, ...lines, END].join('\n') + '\n';
  fs.mkdirSync(path.dirname(path.resolve(o.write)), { recursive: true });
  fs.writeFileSync(o.write, before + block + after);
  wrote = true;
}

// ---------- summary ----------
const matched = oldPaths.filter((p) => inBuild(p)).length;
console.log(`Old paths to keep alive: ${oldPaths.length}   same path in build: ${matched}   via redirect: ${oldPaths.length - matched}`);
console.log(`Map: ${o.map}${created ? ' (created)' : ''}${added ? `, ${added} new row(s) added` : ''}   rules: ${staticRules} static + ${dynamicRules} dynamic (limits ${LIMIT_STATIC} / ${LIMIT_DYNAMIC})`);
const group = (list) => { const g = {}; for (const x of list) (g[x.rule] ||= []).push(x.detail); return g; };
for (const [label, list] of [['ERRORS', errors], ['Warnings', warnings]]) {
  if (!list.length) continue;
  console.log(`\n${label}:`);
  for (const [rule, d] of Object.entries(group(list))) { console.log(`  ${rule}: ${d.length}`); d.slice(0, 8).forEach((x) => console.log(`      ${x}`)); if (d.length > 8) console.log(`      ... and ${d.length - 8} more (see ${o.map})`); }
}
if (errors.length) {
  console.log(`\nResult: FAIL. Open ${o.map}, fill in new_path for each unmapped row (check any "suggested" note first), fix the rows above, then run again.${o.write ? ` ${o.write} was not changed.` : ''}`);
  process.exit(1);
}
console.log(`\nResult: PASS. Every old page has a home.${wrote ? ` Wrote ${lines.length} rules to ${o.write} between the mrk-web markers.` : o.write ? '' : ' Add --write public/_redirects to write the rules.'}`);
