import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const platform = process.env.PLATFORM ?? 'local';
const maxBytes = Number(process.env.MAX_PACKAGE_BYTES ?? 100 * 1024 * 1024);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const name of ['build', 'locales', 'public']) {
  try {
    await cp(new URL(`../${name}/`, import.meta.url), new URL(`../dist/${name}/`, import.meta.url), { recursive: true });
  } catch (error) {
    if (name === 'public' && process.env.ALLOW_MISSING_PUBLIC === '1') continue;
    throw error;
  }
}

let html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
html = html.replace('content="auto"', `content="${platform}"`);
if (platform === 'yandex' && !html.includes('src="/sdk.js"')) {
  html = html.replace('</head>', '    <script src="/sdk.js"></script>\n  </head>');
}
await writeFile(new URL('../dist/index.html', import.meta.url), html);

async function sizeOf(target) {
  const info = await stat(target);
  if (info.isFile()) return info.size;
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(target, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) total += await sizeOf(path.join(target, entry.name));
  return total;
}

const bytes = await sizeOf(new URL('../dist/', import.meta.url));
if (bytes > maxBytes) throw new Error(`Portal package ${bytes} bytes exceeds ${maxBytes} byte limit`);
console.log(`Portal package ready: platform=${platform}, size=${(bytes / 1024 / 1024).toFixed(2)} MiB`);
