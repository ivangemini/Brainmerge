export type Locale = 'en' | 'ru';
type Dictionary = Record<string, string>;

const dictionaries = new Map<Locale, Dictionary>();

export async function loadLocale(locale: Locale): Promise<void> {
  if (dictionaries.has(locale)) return;
  const response = await fetch(`./locales/${locale}.json`);
  if (!response.ok) throw new Error(`Failed to load locale: ${locale}`);
  dictionaries.set(locale, await response.json() as Dictionary);
}

export function detectLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function translate(locale: Locale, key: string, params: Record<string, string | number> = {}): string {
  const selected = dictionaries.get(locale);
  const fallback = dictionaries.get('en');
  const template = selected?.[key] ?? fallback?.[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}
