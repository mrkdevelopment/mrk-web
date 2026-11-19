#!/usr/bin/env node
// version.mjs - bump the site's version in one go so the numbers never drift.
//
// Usage:
//   node version.mjs <patch|minor|major|x.y.z> [--dry-run]
//
// Run in the site repo root. It updates:
//   package.json  "version"
//   README.md     the shields.io badge  img.shields.io/badge/version-1.2.3-<colour>
//   CHANGELOG.md  "## Unreleased" becomes "## x.y.z - YYYY-MM-DD", and a fresh empty "## Unreleased" goes above it
// It refuses when the Unreleased section is empty, or when git shows uncommitted changes in files other
// than those three (the git check is skipped outside a git repo). It prints the git commands for the
// release tag but does not run them. --dry-run shows what would change and writes nothing.
// Exit codes: 0 done, 1 refused (see message), 2 usage error.

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const HELP = 'Usage: node version.mjs <patch|minor|major|x.y.z> [--dry-run]';
let args;
try { args = parseArgs({ allowPositionals: true, options: { 'dry-run': { type: 'boolean', default: false }, help: { type: 'boolean', short: 'h' } } }); }
catch (e) { console.error(`Error: ${e.message}\n${HELP}`); process.exit(2); }
if (args.values.help) { console.log(HELP); process.exit(0); }
if (args.positionals.length !== 1) { console.error(`Error: say how to bump: patch, minor, major or an exact version like 1.4.0.\n${HELP}`); process.exit(2); }
const dry = args.values['dry-run'];
const fail = (msg, code = 1) => { console.error(`Refused: ${msg}`); process.exit(code); };

// ---------- current + next version ----------
if (!fs.existsSync('package.json')) fail('no package.json here. Run this from the site project folder.', 2);
const pkgText = fs.readFileSync('package.json', 'utf8');
let pkg; try { pkg = JSON.parse(pkgText); } catch (e) { fail(`package.json is not valid JSON (${e.message}).`, 2); }
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;
const cur = pkg.version || '0.0.0';
const cm = cur.match(SEMVER);
if (!cm) fail(`package.json version "${cur}" is not x.y.z. Fix it by hand first.`, 2);
const bump = args.positionals[0];
let next;
if (bump === 'patch') next = `${cm[1]}.${cm[2]}.${+cm[3] + 1}`;
else if (bump === 'minor') next = `${cm[1]}.${+cm[2] + 1}.0`;
else if (bump === 'major') next = `${+cm[1] + 1}.0.0`;
else if (SEMVER.test(bump.replace(/^v/, ''))) next = bump.replace(/^v/, '');
else fail(`"${bump}" is not patch, minor, major or a version like 1.4.0.`, 2);
const cmp = (a, b) => { const x = a.match(SEMVER).slice(1, 4).map(Number), y = b.match(SEMVER).slice(1, 4).map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
if (cmp(next, cur) <= 0 && next !== cur.replace(/-.*/, '')) fail(`${next} is not higher than the current version ${cur}.`);
if (next === cur) fail(`the version is already ${cur}.`);

// ---------- git check ----------
const ALLOWED = ['package.json', 'README.md', 'CHANGELOG.md'];
let inGit = false;
try {
  inGit = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'true';
} catch { inGit = false; }
if (inGit) {
  const prefix = execFileSync('git', ['rev-parse', '--show-prefix']).toString().trim();
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all']).toString().split('\n').filter(Boolean)
    .map((l) => l.slice(3).replace(/^.* -> /, '').replace(/^"|"$/g, ''))
    .filter((f) => !ALLOWED.map((a) => prefix + a).includes(f));
  if (dirty.length) fail(`commit or stash these changes first, so the release commit only holds the version bump:\n  ${dirty.slice(0, 15).join('\n  ')}${dirty.length > 15 ? `\n  ... and ${dirty.length - 15} more` : ''}`);
}

// ---------- CHANGELOG ----------
if (!fs.existsSync('CHANGELOG.md')) fail('no CHANGELOG.md. Create one with a "## Unreleased" section listing what changed.');
const log = fs.readFileSync('CHANGELOG.md', 'utf8');
const head = log.match(/^##[ \t]*\[?Unreleased\]?[ \t]*$/im);
if (!head) fail('CHANGELOG.md has no "## Unreleased" heading. Add one above the last release and list the changes under it.');
const bodyStart = head.index + head[0].length;
const nextHead = log.slice(bodyStart).search(/^##\s/m);
const body = nextHead === -1 ? log.slice(bodyStart) : log.slice(bodyStart, bodyStart + nextHead);
if (!body.replace(/<!--[\s\S]*?-->/g, '').replace(/^#{3,}.*$/gm, '').trim()) fail('the "## Unreleased" section in CHANGELOG.md is empty. Write down what changed in this release first.');
if (new RegExp(`^##\\s*\\[?${next.replace(/\./g, '\\.')}\\]?\\b`, 'm').test(log)) fail(`CHANGELOG.md already has a ${next} section.`);
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const newLog = log.slice(0, head.index) + `## Unreleased\n\n## ${next} - ${today}` + log.slice(bodyStart);

// ---------- package.json + README ----------
const newPkg = /"version"\s*:\s*"[^"]*"/.test(pkgText)
  ? pkgText.replace(/"version"\s*:\s*"[^"]*"/, `"version": "${next}"`)
  : JSON.stringify({ ...pkg, version: next }, null, 2) + '\n';
const notes = [];
let newReadme = null;
if (fs.existsSync('README.md')) {
  const readme = fs.readFileSync('README.md', 'utf8');
  const badge = /(img\.shields\.io\/badge\/version-)((?:[^-\s)"']|--)+)(-)/g; // shields escapes "-" as "--"
  if (badge.test(readme)) newReadme = readme.replace(badge, (m, a, v, c) => a + next.replace(/-/g, '--') + c);
  else notes.push('README.md has no shields.io version badge (img.shields.io/badge/version-1.2.3-blue); add one if you want it kept in step.');
} else notes.push('no README.md, so no badge was updated.');

// ---------- write ----------
if (!dry) {
  fs.writeFileSync('package.json', newPkg);
  if (newReadme !== null) fs.writeFileSync('README.md', newReadme);
  fs.writeFileSync('CHANGELOG.md', newLog);
}
const changed = ['package.json', ...(newReadme !== null ? ['README.md'] : []), 'CHANGELOG.md'];
console.log(`${dry ? 'Dry run - nothing written. Would change' : 'Updated'} ${cur} -> ${next} in: ${changed.join(', ')}`);
console.log(`CHANGELOG.md: "## Unreleased" -> "## ${next} - ${today}", fresh empty "## Unreleased" added above.`);
notes.forEach((n) => console.log(`Note: ${n}`));
if (!inGit) console.log('Note: not a git repo, so the uncommitted-changes check was skipped.');
console.log(`\nNext, review the changes and run:\n  git add ${changed.join(' ')}\n  git commit -m "Release v${next}"\n  git tag -a v${next} -m "v${next}"\n  git push && git push origin v${next}`);
