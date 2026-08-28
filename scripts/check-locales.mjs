import { readFile } from 'node:fs/promises';
const en = JSON.parse(await readFile(new URL('../locales/en.json', import.meta.url), 'utf8'));
const ru = JSON.parse(await readFile(new URL('../locales/ru.json', import.meta.url), 'utf8'));
const enKeys = Object.keys(en).sort();
const ruKeys = Object.keys(ru).sort();
const missingRu = enKeys.filter((key) => !(key in ru));
const missingEn = ruKeys.filter((key) => !(key in en));
if (missingRu.length || missingEn.length) {
  console.error({ missingRu, missingEn });
  process.exit(1);
}
console.log(`Locale parity OK: ${enKeys.length} keys in EN/RU`);
