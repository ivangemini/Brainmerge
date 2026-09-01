const dictionaries = new Map();
export async function loadLocale(locale) {
    if (dictionaries.has(locale))
        return;
    const response = await fetch(`./locales/${locale}.json`);
    if (!response.ok)
        throw new Error(`Failed to load locale: ${locale}`);
    dictionaries.set(locale, await response.json());
}
export function localeFromLanguage(language) {
    return language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
export function detectLocale() {
    return localeFromLanguage(navigator.language);
}
export function translate(locale, key, params = {}) {
    const selected = dictionaries.get(locale);
    const fallback = dictionaries.get('en');
    const template = selected?.[key] ?? fallback?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}
