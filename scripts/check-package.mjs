import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const platform = process.argv[2] ?? process.env.PLATFORM ?? 'local';
const distUrl = new URL('../dist/', import.meta.url);
const distPath = fileURLToPath(distUrl);
const failures = [];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function cleanReference(reference) {
  return reference.split('#')[0].split('?')[0];
}

async function requireRelativeReference(ownerPath, reference, label) {
  const clean = cleanReference(reference);
  if (!clean || clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('//')) return;
  if (clean === '/sdk.js') return;
  if (clean.startsWith('/')) {
    failures.push(`${label}: unsupported absolute packaged reference ${clean} in ${path.relative(distPath, ownerPath)}`);
    return;
  }
  const target = path.resolve(path.dirname(ownerPath), clean);
  if (!target.startsWith(distPath)) {
    failures.push(`${label}: reference escapes dist: ${clean} in ${path.relative(distPath, ownerPath)}`);
    return;
  }
  if (!await exists(target)) failures.push(`${label}: missing ${path.relative(distPath, target)} referenced by ${path.relative(distPath, ownerPath)}`);
}

async function walk(target) {
  const entries = await readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...await walk(resolved));
    else files.push(resolved);
  }
  return files;
}

if (!await exists(distPath)) throw new Error('dist/ does not exist; package the game before running integrity check');
const files = await walk(distPath);
const relativeFiles = new Set(files.map((file) => path.relative(distPath, file).replaceAll(path.sep, '/')));

for (const required of ['index.html', 'build/main.js', 'locales/en.json', 'locales/ru.json', 'src/styles.css']) {
  if (!relativeFiles.has(required)) failures.push(`required runtime file missing: ${required}`);
}

const htmlPath = path.join(distPath, 'index.html');
const html = await readFile(htmlPath, 'utf8');
const htmlReferences = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
for (const reference of htmlReferences) await requireRelativeReference(htmlPath, reference, 'HTML');

if (platform === 'yandex') {
  if (!html.includes('content="yandex"')) failures.push('Yandex package must replace the auto platform hint with yandex');
  if (!html.includes('src="/sdk.js"')) failures.push('Yandex package must include the platform /sdk.js loader');
} else if (html.includes('src="/sdk.js"')) {
  failures.push('Non-Yandex package must not include /sdk.js');
}

for (const file of files.filter((entry) => entry.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  const references = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((match) => match[1]);
  for (const reference of references) await requireRelativeReference(file, reference, 'CSS');
}

for (const file of files.filter((entry) => entry.endsWith('.js'))) {
  const js = await readFile(file, 'utf8');
  const references = [
    ...[...js.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1]),
    ...[...js.matchAll(/\bimport\s*["']([^"']+)["']/g)].map((match) => match[1])
  ];
  for (const reference of references.filter((value) => value.startsWith('.'))) await requireRelativeReference(file, reference, 'JS import');
  if (/\bdebugger\s*;/.test(js)) failures.push(`debugger statement found in ${path.relative(distPath, file)}`);
}

const [en, ru] = await Promise.all([
  JSON.parse(await readFile(path.join(distPath, 'locales/en.json'), 'utf8')),
  JSON.parse(await readFile(path.join(distPath, 'locales/ru.json'), 'utf8'))
]);
if (Object.keys(en).length === 0 || Object.keys(ru).length === 0) failures.push('packaged locale files must not be empty');

if (failures.length > 0) {
  console.error('Package integrity check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Package integrity OK: platform=${platform}, files=${files.length}, htmlRefs=${htmlReferences.length}`);
}
