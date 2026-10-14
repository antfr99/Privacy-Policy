// Builds the public pages from the apps' own About text, so the app, this site and the Play Console Data safety
// form never disagree. Run it whenever an app's src/about.ts changes:
//
//   node scripts/build.mjs [path to the folder that holds the three app repos]   (default: ..)
//
// It reads Mobile-My-Investments-New, Mobile-My-Entertainment and Mobile-Our-Timeline next to this repo, turns each
// app's privacy policy, rules and notices into a page, and writes them to the repo root (index.html and one page per
// app). delete-account.html is written by hand. TypeScript is borrowed from one of the apps' node_modules.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APPS_DIR = path.resolve(process.argv[2] ?? path.join(ROOT, '..'));

const APPS = [
  { slug: 'my-investments', repo: 'Mobile-My-Investments-New', name: 'My Investments', sections: ['privacy', 'community', 'store', 'disclaimer'] },
  { slug: 'my-entertainment', repo: 'Mobile-My-Entertainment', name: 'My Entertainment', sections: ['privacy', 'social', 'store'] },
  { slug: 'our-timeline', repo: 'Mobile-Our-Timeline', name: 'Our Timeline', sections: ['privacy', 'social', 'store'] },
];

const tsRepo = APPS.map(a => path.join(APPS_DIR, a.repo)).find(d => fs.existsSync(path.join(d, 'node_modules/typescript')));
if (!tsRepo) throw new Error(`No app under ${APPS_DIR} has node_modules/typescript — run npm ci in one of them first.`);
const ts = createRequire(path.join(tsRepo, 'package.json'))('typescript');

/** Transpiles src/about.ts and the local files it imports into a temp folder, then imports it. */
async function loadAbout(repoDir) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'about-'));
  const seen = new Set();
  const emit = file => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = fs.readFileSync(path.join(repoDir, 'src', file + '.ts'), 'utf8');
    const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    for (const m of js.matchAll(/from '\.\/([\w-]+)'/g)) emit(m[1]);
    fs.writeFileSync(path.join(out, file + '.mjs'), js.replace(/from '\.\/([\w-]+)'/g, "from './$1.mjs'"));
  };
  emit('about');
  return import(pathToFileURL(path.join(out, 'about.mjs')).href);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// The apps' inline marks: **bold**, [+good+] and [-harm-] (Our Timeline's colours), and bare links.
const inline = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[\+(.+?)\+\]/g, '$1').replace(/\[-(.+?)-\]/g, '$1')
  .replace(/\b(antfr99\.github\.io\/[\w./-]+)/g, '<a href="https://$1">$1</a>')
  .replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>');

function block(b) {
  if ('h' in b) return `<h3>${inline(b.h)}</h3>`;
  if ('p' in b) return `<p>${inline(b.p)}</p>`;
  if ('list' in b) return `<ul>${b.list.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`;
  if ('rows' in b) return `<dl>${b.rows.map(([k, v]) => `<dt>${inline(k)}</dt><dd>${inline(v)}</dd>`).join('')}</dl>`;
  return '';
}

const page = (title, body, description) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<main>
${body}
<footer><p>© 2026 MyThoughts Apps · <a href="index.html">All apps</a> · <a href="delete-account.html">Delete an account</a></p></footer>
</main>
</body>
</html>
`;

const index = [];
for (const app of APPS) {
  const about = await loadAbout(path.join(APPS_DIR, app.repo));
  const secs = app.sections.map(k => about.SECTIONS.find(s => s.key === k)).filter(Boolean);
  const toc = secs.map(s => `<li><a href="#${s.key}">${esc(s.title)}</a></li>`).join('');
  const body = `<header>
<p class="kicker">Privacy policy</p>
<h1>${esc(app.name)}</h1>
<p class="lead">For the ${esc(app.name)} Android app by MyThoughts Apps. Last updated ${esc(about.POLICY_UPDATED)}.
Contact: <a href="mailto:${esc(about.CONTACT_EMAIL)}">${esc(about.CONTACT_EMAIL)}</a>.</p>
<p class="note">This page shows the same text as the app’s About tab. To delete your account, use <strong>Delete my account</strong>
in the app, or <a href="delete-account.html">delete it on the web</a>.</p>
<nav><ul>${toc}</ul></nav>
</header>
${secs.map(s => `<section id="${s.key}"><h2>${esc(s.title)}</h2>\n${s.blocks.map(block).join('\n')}</section>`).join('\n')}`;
  fs.writeFileSync(path.join(ROOT, `${app.slug}.html`), page(`${app.name} — Privacy policy`, body, `Privacy policy for the ${app.name} app.`));
  index.push({ ...app, updated: about.POLICY_UPDATED, email: about.CONTACT_EMAIL });
  console.log(`${app.slug}.html  (policy updated ${about.POLICY_UPDATED})`);
}

const email = index[0].email;
fs.writeFileSync(path.join(ROOT, 'index.html'), page('Privacy policies — MyThoughts Apps', `<header>
<p class="kicker">Privacy policies</p>
<h1>MyThoughts Apps</h1>
<p class="lead">Free apps by one independent developer, with no ads, no tracking and no selling of your information.
Contact: <a href="mailto:${esc(email)}">${esc(email)}</a>.</p>
</header>
<section>
<ul class="apps">
${index.map(a => `<li><a href="${a.slug}.html"><strong>${esc(a.name)}</strong></a><span>Privacy policy · updated ${esc(a.updated)}</span></li>`).join('\n')}
</ul>
</section>
<section>
<h2>Delete your account</h2>
<p>The three apps share one optional account. Delete it in any app (<strong>Delete my account</strong>), or
<a href="delete-account.html">here on the web</a> — it removes the account and everything linked to it from all three apps.</p>
</section>`, 'Privacy policies for My Investments, My Entertainment and Our Timeline.'));
console.log('index.html');
