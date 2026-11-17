import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const pages = ['index.html', 'privacy.html', 'ugc.html', '404.html'];
const errors = [];

for (const page of pages) {
  const file = path.join(root, page);
  const html = await fs.readFile(file, 'utf8').catch(() => null);
  if (!html) {
    errors.push(`${page}: файл не найден`);
    continue;
  }
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)].map((m) => m[1]);
  for (const ref of new Set(refs)) {
    if (ref === '/') continue;
    const target = path.join(root, ref.slice(1));
    const stat = await fs.stat(target).catch(() => null);
    if (!stat) errors.push(`${page}: битая ссылка ${ref}`);
  }
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${page}: должен быть ровно один h1`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, block] of ld) {
    try {
      JSON.parse(block);
    } catch (error) {
      errors.push(`${page}: JSON-LD не парсится (${error.message})`);
    }
  }
}

const index = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const title = index.match(/<title>([^<]+)<\/title>/)?.[1] || '';
const description = index.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
if (title.length > 70) errors.push(`index.html: title ${title.length} символов`);
if (description.length > 180) errors.push(`index.html: description ${description.length} символов`);

const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
for (const [, loc] of sitemap.matchAll(/<loc>https:\/\/gzms\.ru([^<]*)<\/loc>/g)) {
  const file = loc === '/' ? 'index.html' : loc.replace(/^\//, '');
  const stat = await fs.stat(path.join(root, file)).catch(() => null);
  if (!stat) errors.push(`sitemap: нет файла ${file}`);
}

const manifest = JSON.parse(await fs.readFile(path.join(root, 'apk.json'), 'utf8'));
const apk = path.join(root, 'downloads', manifest.apk);
const apkBuf = await fs.readFile(apk).catch(() => null);
if (!apkBuf) {
  errors.push(`apk.json: нет файла downloads/${manifest.apk}`);
} else {
  const hash = createHash('sha256').update(apkBuf).digest('hex');
  if (hash !== manifest.sha256) errors.push('apk.json: SHA-256 не совпадает с APK');
  if (apkBuf.length !== manifest.size) errors.push('apk.json: размер не совпадает с APK');
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.length} страницы, sitemap, JSON-LD и APK ${manifest.version} в порядке`);
console.log(`✓ title ${title.length}, description ${description.length}`);