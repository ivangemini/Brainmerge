import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../build/core/game.js';
import { YandexPlatformAdapter } from '../build/platform/yandex.js';

function createHarness() {
  const storageMap = new Map();
  const storage = {
    getItem(key) { return storageMap.get(key) ?? null; },
    setItem(key, value) { storageMap.set(key, value); }
  };
  const cloudWrites = [];
  let cloudData = {};
  const player = {
    async getData() { return cloudData; },
    async setData(data, flush = false) {
      cloudWrites.push({ data, flush });
      cloudData = { ...cloudData, ...data };
    }
  };
  const timers = new Map();
  let timerId = 0;
  const gameplay = [];
  const sdk = {
    environment: { i18n: { lang: 'ru' } },
    async getPlayer() { return player; },
    async getStorage() { return storage; },
    adv: {
      showFullscreenAdv() {},
      showRewardedVideo() {}
    },
    features: {
      LoadingAPI: { ready() {} },
      GameplayAPI: {
        start() { gameplay.push('start'); },
        stop() { gameplay.push('stop'); }
      }
    }
  };
  const windowMock = {
    YaGames: { async init() { return sdk; } },
    localStorage: storage,
    setTimeout(callback) {
      timerId += 1;
      timers.set(timerId, callback);
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); }
  };
  return {
    windowMock,
    cloudWrites,
    storageMap,
    gameplay,
    setCloudData(data) { cloudData = data; },
    runTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      for (const callback of callbacks) callback();
    },
    timerCount() { return timers.size; }
  };
}

async function withWindow(windowMock, callback) {
  const previousWindow = globalThis.window;
  globalThis.window = windowMock;
  try {
    return await callback();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

test('Yandex adapter debounces ordinary cloud saves but flushes latest state immediately at lifecycle boundary', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    assert.equal(adapter.preferredLocale(), 'ru');
    assert.ok(harness.gameplay.includes('start'));

    const first = { ...createInitialState(1000), coins: 111 };
    const latest = { ...first, coins: 222, paidBoxes: 3 };
    await adapter.saveState(first);
    assert.equal(harness.cloudWrites.length, 0, 'ordinary save should remain debounced');
    assert.equal(harness.timerCount(), 1);

    await adapter.saveState(latest, true);
    assert.equal(harness.timerCount(), 0, 'flush should cancel the pending debounce timer');
    assert.equal(harness.cloudWrites.length, 1);
    assert.equal(harness.cloudWrites[0].flush, true);
    assert.equal(harness.cloudWrites[0].data.brainmerge.coins, 222);
    assert.equal(harness.cloudWrites[0].data.brainmerge.paidBoxes, 3);

    const local = JSON.parse(harness.storageMap.get('brainmerge.save.v2'));
    assert.equal(local.coins, 222, 'safe/local copy should always contain latest state too');
  });
});

test('Yandex adapter ordinary debounce persists the newest queued snapshot', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    const base = createInitialState(0);
    await adapter.saveState({ ...base, coins: 120 });
    await adapter.saveState({ ...base, coins: 140 });
    assert.equal(harness.timerCount(), 1, 'newer save replaces old debounce timer');
    harness.runTimers();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(harness.cloudWrites.length, 1);
    assert.equal(harness.cloudWrites[0].data.brainmerge.coins, 140);
    assert.equal(harness.cloudWrites[0].flush, false);
  });
});

test('Yandex adapter prefers cloud state and falls back to safe storage when cloud has no object state', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    const cloud = { ...createInitialState(0), coins: 333 };
    harness.setCloudData({ brainmerge: cloud });
    assert.equal((await adapter.loadState()).coins, 333);

    harness.setCloudData({});
    const local = { ...cloud, coins: 444 };
    harness.storageMap.set('brainmerge.save.v2', JSON.stringify(local));
    assert.equal((await adapter.loadState()).coins, 444);
  });
});
