#!/usr/bin/env node
// speed.mjs - Lighthouse scores for every page, and the launch gate.
//
// Usage:
//   node speed.mjs <site-url> [--label before|after|preview|live] [--device mobile|desktop] [--max 50]
//                  [--urls /,/about/] [--gate 98] [--psi] [--out _mrk/scores]
//
//   <site-url>  the site to test, e.g. http://localhost:4321 or https://www.example.com
//   --label     name for this run, used in file names (default: before)
//   --device    mobile (default) or desktop
//   --max       most pages to test (default 50). Pages come from the sitemap/robots.txt, then links.
//   --urls      test only these paths (comma separated) instead of discovering pages
//   --gate N    a page passes when performance, accessibility, best practices and SEO are all >= N.
//               Pages that fail the first sweep are re-run 3 times on their own; the median counts.
//               Exit 1 if any page still fails.
//   --psi       use Google PageSpeed Insights (public URLs only, set PSI_API_KEY for more quota)
//               instead of local Lighthouse. Tests --urls (default: /).
//
// Outputs (in --out, default ./_mrk/scores):
//   speed-<label>.csv   path,performance,accessibility,best_practices,seo (0-100; re-run pages show the median)
//   speed-<label>.json  medians per category, lowest 10 pages, tool versions, date
//   gate-<label>.json   (with --gate) failing pages, their scores and the 5 audits costing them most
//   unlighthouse-<label>/  Unlighthouse's own output, including a full Lighthouse report per page
// Local runs use Unlighthouse (npx unlighthouse-ci) for the sweep and Lighthouse (npx lighthouse) for re-runs,
// both with Lighthouse's default simulated throttling so the numbers are comparable.
// Exit codes: 0 done / gate passed, 1 gate failed, 2 usage or environment problem.

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const UNLIGHTHOUSE_VERSION = '0.19.1'; // pinned so runs are comparable; bump deliberately
const CATS = [['performance', 'performance'], ['accessibility', 'accessibility'], ['best-practices', 'best_practices'], ['seo', 'seo']];
const HELP = 'Usage: node speed.mjs <site-url> [--label before|after|preview|live] [--device mobile|desktop] [--max 50] [--urls /,/about/] [--gate 98] [--psi] [--out _mrk/scores]';

const die = (msg, code = 2) => { console.error(`Error: ${msg}`); process.exit(code); };
let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      label: { type: 'string', default: 'before' }, device: { type: 'string', default: 'mobile' }, max: { type: 'string', default: '50' },
      urls: { type: 'string' }, gate: { type: 'string' }, psi: { type: 'boolean', default: false }, out: { type: 'string', default: '_mrk/scores' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (e) { die(`${e.message}\n${HELP}`); }
const o = args.values;
if (o.help) { console.log(HELP); process.exit(0); }
if (args.positionals.length !== 1) die(`give the site address, e.g. http://localhost:4321\n${HELP}`);
let site;
try { site = new URL(/^https?:\/\//.test(args.positionals[0]) ? args.positionals[0] : 'https://' + args.positionals[0]); } catch { die('that does not look like a website address'); }
const origin = site.origin;
if (!/^[\w-]+$/.test(o.label)) die('--label should be a simple word such as before, after, preview or live');
if (!['mobile', 'desktop'].includes(o.device)) die('--device must be mobile or desktop');
const max = Number(o.max);
if (!Number.isInteger(max) || max < 1) die('--max must be a whole number of 1 or more');
const gate = o.gate === undefined ? null : Number(o.gate);
if (gate !== null && !(gate >= 0 && gate <= 101)) die('--gate must be a score from 0 to 100');
const urlList = o.urls ? o.urls.split(',').map((u) => u.trim()).filter(Boolean).map((u) => new URL(u, origin)) : null;
if (urlList && urlList.some((u) => u.origin !== origin)) die('every --urls entry must be on the same site as <site-url>');
const outDir = path.resolve(o.out);
const work = path.join(outDir, `.work-${o.label}`);
fs.mkdirSync(work, { recursive: true });

// ---------- environment ----------
const isLocal = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/.test(site.hostname) || /\.(local|localhost|test)$/.test(site.hostname) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(site.hostname);
function findChrome() {
  const c = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  return c.find((p) => fs.existsSync(p)) || null;
}
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let chromePath = null;
if (o.psi) {
  if (isLocal) die('PageSpeed Insights runs on Google\'s servers, so it cannot see localhost or private addresses. Use a public URL, or drop --psi to test locally.');
} else {
  chromePath = findChrome();
  if (!chromePath) die('Google Chrome was not found. Install it from https://www.google.com/chrome/ (or set CHROME_PATH to a Chrome/Chromium binary), then run this again. Or use --psi for a public URL.');
  if (spawnSync(npx, ['--version'], { stdio: 'ignore' }).status !== 0) die('npx was not found. Install Node.js 20 or newer from https://nodejs.org (it includes npx).');
  try { const r = await fetch(origin + '/', { signal: AbortSignal.timeout(20000) }); r.body?.cancel(); }
  catch { die(`nothing answered at ${origin}. Start the site first (for a local build: npm run build && npx astro preview), then run this again.`); }
}

// ---------- helpers ----------
const median = (a) => { const s = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const scoresOf = (cats) => Object.fromEntries(CATS.map(([k, col]) => [col, cats?.[k]?.score == null ? null : Math.round(cats[k].score * 100)]));
const passes = (s) => gate === null || CATS.every(([, c]) => s[c] !== null && s[c] >= gate);
const pathOf = (u) => { const x = new URL(u, origin); return x.pathname + x.search; };

// The audits costing a page the most points, in the categories below the gate.
function topAudits(lhr) {
  const list = [];
  for (const [k] of CATS) {
    const cat = lhr.categories?.[k];
    if (!cat || (gate !== null && Math.round((cat.score ?? 0) * 100) >= gate)) continue;
    const total = cat.auditRefs.reduce((n, r) => n + (r.weight || 0), 0) || 1;
    for (const ref of cat.auditRefs) {
      const a = lhr.audits[ref.id];
      if (!a) continue;
      const savingsMs = a.details?.overallSavingsMs ?? Math.max(0, ...Object.values(a.metricSavings || {}).filter((v) => typeof v === 'number' && v > 1));
      const savingsBytes = a.details?.overallSavingsBytes ?? null;
      if (ref.weight > 0 && a.score !== null && a.score < 1) {
        list.push({ category: k, id: a.id, title: a.title, displayValue: a.displayValue || '', score: a.score, points_lost: +(ref.weight * (1 - a.score) / total * 100).toFixed(1), savings_ms: savingsMs || null, savings_bytes: savingsBytes, impact: ref.weight * (1 - a.score) / total * 100 });
      } else if (k === 'performance' && !ref.weight && (a.score === null || a.score < 1) && (savingsMs > 0 || savingsBytes > 0)) {
        // opportunities/insights carry no weight but are what actually fixes LCP/TBT: rank ~10 points per second saved
        list.push({ category: k, id: a.id, title: a.title, displayValue: a.displayValue || '', score: a.score, points_lost: null, savings_ms: savingsMs || null, savings_bytes: savingsBytes, impact: (savingsMs || 0) / 100 + (savingsBytes || 0) / 100000 });
      }
    }
  }
  return list.sort((a, b) => b.impact - a.impact).slice(0, 5).map(({ impact, ...r }) => r);
}

// One Lighthouse run of one URL. Returns the Lighthouse result (LHR) or throws.
let lighthouseVersion = null;
async function lighthouseOnce(url, n) {
  if (o.psi) return psiOnce(url);
  const file = path.join(work, `lh-${pathOf(url).replace(/[^\w]+/g, '_')}-${n}.json`);
  const a = ['-y', `lighthouse@${lighthouseVersion || 'latest'}`, url, '--output=json', `--output-path=${file}`, '--quiet',
    '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new'];
  if (o.device === 'desktop') a.push('--preset=desktop');
  const r = spawnSync(npx, a, { encoding: 'utf8', timeout: 180000, env: { ...process.env, CHROME_PATH: chromePath } });
  if (r.status !== 0 || !fs.existsSync(file)) throw new Error(`lighthouse failed for ${url}: ${(r.stderr || r.error?.message || '').trim().split('\n').slice(-3).join(' ')}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
async function psiOnce(url) {
  const q = new URLSearchParams({ url, strategy: o.device.toUpperCase() });
  for (const c of ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO']) q.append('category', c);
  if (process.env.PSI_API_KEY) q.set('key', process.env.PSI_API_KEY);
  let res;
  try { res = await fetch(`https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(120000) }); }
  catch (e) { throw new Error(`could not reach PageSpeed Insights (${e.message})`); }
  const body = await res.json().catch(() => ({}));
  if (res.status === 429 || /quota|rate limit/i.test(body?.error?.message || '')) {
    console.error('\nPageSpeed Insights quota reached.' + (process.env.PSI_API_KEY ? ' Wait a few minutes and try again, or test fewer URLs.' : ' Without a key the shared quota runs out quickly: create a free API key at https://developers.google.com/speed/docs/insights/v5/get-started, then run: export PSI_API_KEY=your-key'));
    process.exit(2);
  }
  if (!res.ok || !body.lighthouseResult) throw new Error(`PageSpeed Insights said ${res.status}: ${body?.error?.message || 'no result'}`);
  return body.lighthouseResult;
}

// ---------- sweep ----------
const rows = []; // { path, url, scores, lhr? }
let unlighthouseInfo = null;
const started = new Date();
if (o.psi) {
  const list = (urlList || [new URL('/', origin)]).slice(0, max);
  console.log(`Testing ${list.length} URL(s) with PageSpeed Insights (${o.device})...`);
  for (const u of list) {
    try { const lhr = await psiOnce(u.href); lighthouseVersion = lhr.lighthouseVersion; rows.push({ path: pathOf(u), url: u.href, scores: scoresOf(lhr.categories), lhr }); console.log(`  ${pathOf(u)} done`); }
    catch (e) { console.error(`  ${pathOf(u)}: ${e.message}`); rows.push({ path: pathOf(u), url: u.href, scores: scoresOf(null), error: e.message }); }
  }
} else {
  const ulhOut = path.join(outDir, `unlighthouse-${o.label}`);
  fs.rmSync(ulhOut, { recursive: true, force: true }); // our own folder: start clean so no stale reports are read
  const config = {
    site: origin, outputPath: ulhOut, cache: false,
    scanner: { maxRoutes: max, device: o.device, throttle: true, dynamicSampling: false, samples: 1 },
    ci: { reporter: 'jsonExpanded' },
    ...(urlList ? { urls: urlList.map(pathOf) } : {}),
  };
  const cfgFile = path.join(work, 'unlighthouse.config.mjs');
  fs.writeFileSync(cfgFile, `// generated by speed.mjs\nexport default ${JSON.stringify(config, null, 2)}\n`);
  const logFile = path.join(work, 'unlighthouse.log');
  console.log(`Running Unlighthouse ${UNLIGHTHOUSE_VERSION} on ${origin} (${o.device}, up to ${max} pages). This takes about 5-15 seconds per page...`);
  const fd = fs.openSync(logFile, 'w');
  const r = spawnSync(npx, ['-y', '-p', `unlighthouse@${UNLIGHTHOUSE_VERSION}`, 'unlighthouse-ci', '--config-file', cfgFile], { stdio: ['ignore', fd, fd], timeout: Math.max(600000, max * 90000), env: { ...process.env, CHROME_PATH: chromePath }, cwd: work });
  fs.closeSync(fd);
  const resultFile = path.join(ulhOut, 'ci-result.json');
  if (r.status !== 0 || !fs.existsSync(resultFile)) {
    const tail = fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-12).join('\n');
    die(`Unlighthouse did not finish. Is the site running at ${origin}? (For a local build: npm run build && npx astro preview.)\nLast lines of ${path.relative(process.cwd(), logFile)}:\n${tail}`);
  }
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  unlighthouseInfo = result.metadata || null;
  for (const route of result.routes || []) {
    const lhrFile = path.join(ulhOut, 'reports', route.path.replace(/^\/+|\/+$/g, ''), 'lighthouse.json');
    const lhr = fs.existsSync(lhrFile) ? JSON.parse(fs.readFileSync(lhrFile, 'utf8')) : null;
    if (lhr && !lighthouseVersion) lighthouseVersion = lhr.lighthouseVersion;
    rows.push({ path: route.path, url: new URL(route.path, origin).href, scores: scoresOf(route.categories), lhr });
  }
  if (!rows.length) die(`Unlighthouse found no pages at ${origin}. Check the site has a sitemap.xml or links from the home page, or pass --urls.`);
}

// ---------- gate: re-run failures 3 times, median counts ----------
const gateFailures = []; const rescued = [];
if (gate !== null) {
  const failing = rows.filter((r) => !passes(r.scores));
  if (failing.length) console.log(`\n${failing.length} page(s) below ${gate} in the sweep. Re-running each 3 times (scores wobble 2-5 points between runs)...`);
  for (const row of failing) {
    const runs = [];
    for (let i = 1; i <= 3; i++) {
      try { runs.push(await lighthouseOnce(row.url, i)); process.stdout.write(`  ${row.path} run ${i}/3\n`); }
      catch (e) { console.error(`  ${row.path} run ${i}/3 failed: ${e.message}`); }
    }
    const runScores = runs.map((l) => scoresOf(l.categories));
    if (!runScores.length) { gateFailures.push({ path: row.path, url: row.url, sweep: row.scores, runs: [], median: row.scores, error: 'all re-runs failed', top_audits: row.lhr ? topAudits(row.lhr) : [] }); continue; }
    const med = Object.fromEntries(CATS.map(([, c]) => [c, median(runScores.map((s) => s[c]))]));
    const sweep = row.scores;
    row.scores = med; row.rerun = true;
    if (passes(med)) { rescued.push(row.path); continue; }
    // audits from the run whose performance is closest to the median
    const pick = runs[runScores.map((s, i) => [Math.abs((s.performance ?? 0) - (med.performance ?? 0)), i]).sort((a, b) => a[0] - b[0])[0][1]];
    gateFailures.push({ path: row.path, url: row.url, sweep, runs: runScores, median: med, below_gate: CATS.map(([, c]) => c).filter((c) => !(med[c] >= gate)), top_audits: topAudits(pick) });
  }
}

// ---------- write ----------
const csvRows = rows.map((r) => [r.path, ...CATS.map(([, c]) => r.scores[c] ?? '')].map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(','));
fs.writeFileSync(path.join(outDir, `speed-${o.label}.csv`), ['path,performance,accessibility,best_practices,seo', ...csvRows].join('\n') + '\n');
const minScore = (s) => Math.min(...CATS.map(([, c]) => s[c] ?? 0));
const summary = {
  label: o.label, site: origin, device: o.device, date: started.toISOString(), tool: o.psi ? 'pagespeed-insights-v5' : 'unlighthouse',
  versions: { unlighthouse: o.psi ? null : UNLIGHTHOUSE_VERSION, lighthouse: lighthouseVersion, node: process.version, chrome: rows.find((r) => r.lhr)?.lhr?.environment?.hostUserAgent?.match(/Chrome\/[\d.]+/)?.[0] || null },
  pages: rows.length,
  medians: Object.fromEntries(CATS.map(([, c]) => [c, median(rows.map((r) => r.scores[c]))])),
  lowest: [...rows].sort((a, b) => minScore(a.scores) - minScore(b.scores)).slice(0, 10).map((r) => ({ path: r.path, ...r.scores, ...(r.rerun ? { median_of_3_reruns: true } : {}) })),
  ...(gate !== null ? { gate, gate_passed: gateFailures.length === 0, rescued_by_rerun: rescued } : {}),
};
fs.writeFileSync(path.join(outDir, `speed-${o.label}.json`), JSON.stringify(summary, null, 2) + '\n');
if (gate !== null) fs.writeFileSync(path.join(outDir, `gate-${o.label}.json`), JSON.stringify({ gate, label: o.label, site: origin, device: o.device, date: started.toISOString(), pages_checked: rows.length, passed: gateFailures.length === 0, rescued_by_rerun: rescued, failing: gateFailures }, null, 2) + '\n');

// ---------- print ----------
const pad = (s, n) => String(s).padEnd(n);
const w = Math.min(50, Math.max(6, ...rows.map((r) => r.path.length)));
console.log(`\n${pad('page', w)}  perf  a11y  b-p   seo${gate !== null ? '   result' : ''}`);
const failSet = new Set(gateFailures.map((f) => f.path));
for (const r of rows) {
  const s = r.scores;
  const res = gate === null ? '' : failSet.has(r.path) ? '   FAIL' : r.rerun ? '   pass (median of 3)' : '   pass';
  console.log(`${pad(r.path.length > w ? r.path.slice(0, w - 1) + '~' : r.path, w)}  ${CATS.map(([, c]) => pad(s[c] ?? '-', 4)).join('  ')}${res}`);
}
const m = summary.medians;
console.log(`\nMedians: performance ${m.performance}, accessibility ${m.accessibility}, best practices ${m.best_practices}, SEO ${m.seo} across ${rows.length} page(s).`);
console.log(`Written: ${path.relative(process.cwd(), path.join(outDir, `speed-${o.label}.csv`))} and speed-${o.label}.json${gate !== null ? ` and gate-${o.label}.json` : ''}`);
if (gate !== null) {
  if (gateFailures.length) {
    console.log(`\nGATE FAILED: ${gateFailures.length} page(s) below ${gate} after 3 re-runs. Biggest costs:`);
    for (const f of gateFailures.slice(0, 10)) { console.log(`  ${f.path} (below on: ${(f.below_gate || []).join(', ')})`); f.top_audits.slice(0, 3).forEach((a) => console.log(`      - ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`)); }
    console.log(`Fix those, rebuild, and run again. Full list: gate-${o.label}.json`);
    process.exit(1);
  }
  console.log(`\nGATE PASSED: every page scored ${gate} or more in all four categories.`);
}
