import test from 'node:test';
import assert from 'node:assert/strict';
import { YandexPlatformAdapter } from '../build/platform/yandex.js';

function createWindow() {
  let startCalls = 0;
  let stopCalls = 0;
  let rejectStart = true;
  const storage = { getItem() { return null; }, setItem() {} };
  const sdk = {
    environment: { i18n: { lang: 'en' } },
    async getPlayer() { throw new Error('no player'); },
    async getStorage() { return storage; },
    adv: { showFullscreenAdv() {}, showRewardedVideo() {} },
    features: {
      LoadingAPI: { ready() {} },
      GameplayAPI: {
        start() {
          startCalls += 1;
          if (rejectStart) return Promise.reject(new Error('start rejected'));
        },
        stop() { stopCalls += 1; }
      }
    }
  };
  return {
    windowMock: {
      YaGames: { async init() { return sdk; } },
      localStorage: storage,
      setTimeout,
      clearTimeout
    },
    startCalls: () => startCalls,
    stopCalls: () => stopCalls,
    allowStart() { rejectStart = false; }
  };
}

async function withGlobals(windowMock, callback) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = windowMock;
  globalThis.document = { hidden: false };
  try {
    return await callback();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

test('async GameplayAPI rejection clears the cached lifecycle state so a later signal can retry', async () => {
  const harness = createWindow();
  await withGlobals(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();

    adapter.setGameplayActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(harness.startCalls(), 1);

    harness.allowStart();
    adapter.setGameplayActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(harness.startCalls(), 2, 'a rejected start must be retryable');

    adapter.setGameplayActive(false);
    assert.equal(harness.stopCalls(), 1);
  });
});
