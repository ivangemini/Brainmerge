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

function validateWebp(buffer, relative) {
  if (buffer.length < 20) return `${relative}: WebP file is too short`;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return `${relative}: invalid RIFF/WEBP signature`;
  }

  const declaredBytes = buffer.readUInt32LE(4) + 8;
  if (declaredBytes !== buffer.length) {
    return `${relative}: RIFF declares ${declaredBytes} bytes but file contains ${buffer.length}`;
  }

  let cursor = 12;
  let chunks = 0;
  while (cursor < buffer.length) {
    if (cursor + 8 > buffer.length) return `${relative}: truncated WebP chunk header at byte ${cursor}`;
    const chunkSize = buffer.readUInt32LE(cursor + 4);
    const payloadEnd = cursor + 8 + chunkSize;
    if (payloadEnd > buffer.length) return `${relative}: WebP chunk at byte ${cursor} overruns file boundary`;
    cursor = payloadEnd + (chunkSize % 2);
    chunks += 1;
  }

  if (cursor !== buffer.length) return `${relative}: malformed WebP chunk padding`;
  if (chunks === 0) return `${relative}: WebP contains no chunks`;
  return null;
}

function validatePng(buffer, relative) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) return `${relative}: invalid PNG signature`;

  let cursor = 8;
  let sawIhdr = false;
  let sawIend = false;
  while (cursor < buffer.length) {
    if (cursor + 12 > buffer.length) return `${relative}: truncated PNG chunk header at byte ${cursor}`;
    const chunkSize = buffer.readUInt32BE(cursor);
    const type = buffer.toString('ascii', cursor + 4, cursor + 8);
    const end = cursor + 12 + chunkSize;
    if (end > buffer.length) return `${relative}: PNG ${type} chunk overruns file boundary`;
    if (!sawIhdr && type !== 'IHDR') return `${relative}: PNG first chunk must be IHDR`;
    if (type === 'IHDR') sawIhdr = true;
    if (type === 'IEND') {
      if (chunkSize !== 0) return `${relative}: PNG IEND chunk must be empty`;
      sawIend = true;
      cursor = end;
      break;
    }
    cursor = end;
  }

  if (!sawIhdr) return `${relative}: PNG is missing IHDR`;
  if (!sawIend) return `${relative}: PNG is missing IEND`;
  if (cursor !== buffer.length) return `${relative}: trailing bytes after PNG IEND`;
  return null;
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

for (const file of files.filter((entry) => /\.(?:webp|png)$/i.test(entry))) {
  const relative = path.relative(distPath, file).replaceAll(path.sep, '/');
  const buffer = await readFile(file);
  const failure = file.toLowerCase().endsWith('.webp')
    ? validateWebp(buffer, relative)
    : validatePng(buffer, relative);
  if (failure) failures.push(failure);
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
  const rasterCount = files.filter((entry) => /\.(?:webp|png)$/i.test(entry)).length;
  console.log(`Package integrity OK: platform=${platform}, files=${files.length}, htmlRefs=${htmlReferences.length}, rasters=${rasterCount}`);
}
