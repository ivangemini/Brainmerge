import { LocalPlatformAdapter } from './local.js';
import { YandexPlatformAdapter } from './yandex.js';
function readPlatformHint() {
    const query = new URLSearchParams(window.location.search).get('platform');
    if (query === 'local' || query === 'yandex')
        return query;
    const meta = document.querySelector('meta[name="brainmerge-platform"]')?.content;
    if (meta === 'local' || meta === 'yandex')
        return meta;
    return 'auto';
}
function hasYandexGlobal() {
    return Boolean(window.YaGames);
}
function looksLikeYandexHost() {
    const host = window.location.hostname.toLowerCase();
    const referrer = document.referrer.toLowerCase();
    return host.includes('yandex') || referrer.includes('yandex.');
}
async function loadYandexSdk() {
    if (hasYandexGlobal())
        return true;
    return new Promise((resolve) => {
        const existing = document.querySelector('script[data-brainmerge-yandex-sdk]');
        if (existing) {
            existing.addEventListener('load', () => resolve(hasYandexGlobal()), { once: true });
            existing.addEventListener('error', () => resolve(false), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = '/sdk.js';
        script.async = true;
        script.dataset.brainmergeYandexSdk = 'true';
        script.addEventListener('load', () => resolve(hasYandexGlobal()), { once: true });
        script.addEventListener('error', () => resolve(false), { once: true });
        document.head.append(script);
    });
}
export async function createPlatformAdapter() {
    const hint = readPlatformHint();
    if (hint === 'local')
        return new LocalPlatformAdapter();
    const shouldTryYandex = hint === 'yandex' || hasYandexGlobal() || (hint === 'auto' && looksLikeYandexHost());
    if (shouldTryYandex && (hasYandexGlobal() || await loadYandexSdk())) {
        return new YandexPlatformAdapter();
    }
    return new LocalPlatformAdapter();
}
