import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distPath = fileURLToPath(new URL('../dist/', import.meta.url));
const failures = [];

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

const forbiddenRuntimeMarkers = [
  { label: 'TODO/FIXME/HACK marker', pattern: /\b(?:TODO|FIXME|HACK)\b/i },
  { label: 'placeholder/sample copy', pattern: /\b(?:lorem ipsum|dummy content|sample text|placeholder copy)\b/i },
  { label: 'debug data attribute', pattern: /\bdata-(?:debug|dev-only)\s*=/i },
  { label: 'console.debug call', pattern: /\bconsole\.debug\s*\(/ },
  { label: '__DEV__ runtime flag', pattern: /\b__DEV__\b/ }
];

const secretPatterns = [
  { label: 'private key material', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'OpenAI-style secret key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { label: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ }
];

// CSS is executable presentation logic in this project and carries a large part of the
// runtime surface. Scan it alongside HTML/JS/JSON so stale debug/placeholder markers
// cannot bypass the release audit merely because they live in a stylesheet.
const textExtensions = new Set(['.html', '.js', '.json', '.css']);
const files = await walk(distPath);
const textFiles = files.filter((file) => textExtensions.has(path.extname(file).toLowerCase()));

for (const file of textFiles) {
  const relative = path.relative(distPath, file).replaceAll(path.sep, '/');
  const text = await readFile(file, 'utf8');
  for (const check of forbiddenRuntimeMarkers) {
    if (check.pattern.test(text)) failures.push(`${relative}: ${check.label}`);
  }
  for (const check of secretPatterns) {
    if (check.pattern.test(text)) failures.push(`${relative}: ${check.label}`);
  }
}

if (failures.length > 0) {
  console.error('Release audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Release audit OK: scanned ${textFiles.length} packaged text files; no debug/placeholder/secret markers found`);
}
