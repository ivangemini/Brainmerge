import type { PlatformAdapter } from './adapter.js';
import { LocalPlatformAdapter } from './local.js';
import { YandexPlatformAdapter } from './yandex.js';

type PlatformHint = 'auto' | 'local' | 'yandex';

function readPlatformHint(): PlatformHint {
  const query = new URLSearchParams(window.location.search).get('platform');
  if (query === 'local' || query === 'yandex') return query;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="brainmerge-platform"]')?.content;
  if (meta === 'local' || meta === 'yandex') return meta;
  return 'auto';
}

function hasYandexGlobal(): boolean {
  return Boolean((window as unknown as { YaGames?: unknown }).YaGames);
}

function looksLikeYandexHost(): boolean {
  const host = window.location.hostname.toLowerCase();
  const referrer = document.referrer.toLowerCase();
  return host.includes('yandex') || referrer.includes('yandex.');
}

async function loadYandexSdk(): Promise<boolean> {
  if (hasYandexGlobal()) return true;
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-brainmerge-yandex-sdk]');
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

export async function createPlatformAdapter(): Promise<PlatformAdapter> {
  const hint = readPlatformHint();
  if (hint === 'local') return new LocalPlatformAdapter();

  const shouldTryYandex = hint === 'yandex' || hasYandexGlobal() || (hint === 'auto' && looksLikeYandexHost());
  if (shouldTryYandex && (hasYandexGlobal() || await loadYandexSdk())) {
    return new YandexPlatformAdapter();
  }

  return new LocalPlatformAdapter();
}
