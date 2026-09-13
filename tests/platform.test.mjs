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
  let readyCalls = 0;
  const gameplay = [];
  let fullscreenCallbacks = null;
  let rewardedCallbacks = null;
  const sdk = {
    environment: { i18n: { lang: 'ru' } },
    async getPlayer() { return player; },
    async getStorage() { return storage; },
    adv: {
      showFullscreenAdv(options) { fullscreenCallbacks = options?.callbacks ?? null; },
      showRewardedVideo(options) { rewardedCallbacks = options?.callbacks ?? null; }
    },
    features: {
      LoadingAPI: { ready() { readyCalls += 1; } },
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
    sdk,
    player,
    cloudWrites,
    storageMap,
    gameplay,
    readyCalls() { return readyCalls; },
    setCloudData(data) { cloudData = data; },
    fullscreenCallbacks() { return fullscreenCallbacks; },
    rewardedCallbacks() { return rewardedCallbacks; },
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

async function withDocument(hidden, callback) {
  const previousDocument = globalThis.document;
  globalThis.document = { hidden };
  try {
    return await callback();
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

test('Yandex adapter delays Game Ready and gameplay start until the rendered game explicitly signals readiness', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    assert.equal(adapter.preferredLocale(), 'ru');
    assert.equal(harness.readyCalls(), 0, 'SDK initialization must not claim the game is already interactive');
    assert.deepEqual(harness.gameplay, [], 'gameplay must not start before first interactive render');

    await adapter.gameReady();
    assert.equal(harness.readyCalls(), 1);
    assert.deepEqual(harness.gameplay, ['start']);

    await adapter.gameReady();
    assert.equal(harness.readyCalls(), 1, 'Game Ready must be emitted once');
    assert.deepEqual(harness.gameplay, ['start'], 'duplicate readiness must not duplicate GameplayAPI.start');
  });
});

test('Yandex GameplayAPI transitions are idempotent across duplicate lifecycle signals', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    adapter.setGameplayActive(true);
    adapter.setGameplayActive(true);
    adapter.setGameplayActive(false);
    adapter.setGameplayActive(false);
    adapter.setGameplayActive(true);
    assert.deepEqual(harness.gameplay, ['start', 'stop', 'start']);
  });
});

test('rewarded ad grants reward only after onRewarded and resumes once on close', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const rewardPromise = adapter.showRewarded('brain-box');
    assert.deepEqual(harness.gameplay, ['start', 'stop']);
    harness.rewardedCallbacks().onRewarded?.();
    harness.rewardedCallbacks().onClose?.(true);
    assert.equal(await rewardPromise, true);
    assert.deepEqual(harness.gameplay, ['start', 'stop', 'start']);
  });
});

test('rewarded close without reward and ad error never grant a free reward', async () => {
  const closeHarness = createHarness();
  await withWindow(closeHarness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const rewardPromise = adapter.showRewarded('brain-box');
    closeHarness.rewardedCallbacks().onClose?.(true);
    assert.equal(await rewardPromise, false);
    assert.deepEqual(closeHarness.gameplay, ['start', 'stop', 'start']);
  });

  const errorHarness = createHarness();
  await withWindow(errorHarness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const rewardPromise = adapter.showRewarded('brain-box');
    errorHarness.rewardedCallbacks().onError?.(new Error('ad failed'));
    assert.equal(await rewardPromise, false);
    assert.deepEqual(errorHarness.gameplay, ['start', 'stop', 'start']);
  });
});

test('ad close while the document is hidden does not incorrectly resume GameplayAPI', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => withDocument(false, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const rewardPromise = adapter.showRewarded('brain-box');
    globalThis.document.hidden = true;
    harness.rewardedCallbacks().onRewarded?.();
    harness.rewardedCallbacks().onClose?.(true);
    assert.equal(await rewardPromise, true, 'reward event remains valid even if the page was hidden before close');
    assert.deepEqual(harness.gameplay, ['start', 'stop'], 'hidden page must remain stopped after ad close');
    globalThis.document.hidden = false;
    adapter.setGameplayActive(true);
    assert.deepEqual(harness.gameplay, ['start', 'stop', 'start'], 'visibility resume starts gameplay exactly once');
  }));
});

test('fullscreen ads report shown state and recover safely from error', async () => {
  const shownHarness = createHarness();
  await withWindow(shownHarness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const shownPromise = adapter.showInterstitial('break');
    shownHarness.fullscreenCallbacks().onClose?.(true);
    assert.equal(await shownPromise, true);
    assert.deepEqual(shownHarness.gameplay, ['start', 'stop', 'start']);
  });

  const errorHarness = createHarness();
  await withWindow(errorHarness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();
    const shownPromise = adapter.showInterstitial('break');
    errorHarness.fullscreenCallbacks().onError?.(new Error('ad failed'));
    assert.equal(await shownPromise, false);
    assert.deepEqual(errorHarness.gameplay, ['start', 'stop', 'start']);
  });
});

test('Yandex adapter debounces ordinary cloud saves but flushes latest state immediately at lifecycle boundary', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    await adapter.gameReady();

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

test('Yandex adapter serializes cloud writes so an older request cannot finish last', async () => {
  const harness = createHarness();
  const releases = [];
  let activeWrites = 0;
  let maxActiveWrites = 0;
  harness.player.setData = async (data, flush = false) => {
    activeWrites += 1;
    maxActiveWrites = Math.max(maxActiveWrites, activeWrites);
    await new Promise((resolve) => releases.push(resolve));
    harness.cloudWrites.push({ data, flush });
    activeWrites -= 1;
  };

  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    const base = createInitialState(0);
    const firstWrite = adapter.saveState({ ...base, coins: 100 }, true);
    await new Promise((resolve) => setImmediate(resolve));
    const secondWrite = adapter.saveState({ ...base, coins: 200 }, true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(maxActiveWrites, 1);
    releases.shift()?.();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(maxActiveWrites, 1);
    releases.shift()?.();
    await Promise.all([firstWrite, secondWrite]);
    assert.deepEqual(harness.cloudWrites.map((write) => write.data.brainmerge.coins), [100, 200]);
  });
});

test('Yandex adapter selects the newest valid local or cloud state', async () => {
  const harness = createHarness();
  await withWindow(harness.windowMock, async () => {
    const adapter = new YandexPlatformAdapter();
    await adapter.initialize();
    const cloud = { ...createInitialState(0), coins: 333, saveRevision: 3, savedAt: 3_000 };
    harness.setCloudData({ brainmerge: cloud });
    assert.equal((await adapter.loadState()).coins, 333);

    const local = { ...cloud, coins: 444, saveRevision: 4, savedAt: 4_000 };
    harness.storageMap.set('brainmerge.save.v2', JSON.stringify(local));
    assert.equal((await adapter.loadState()).coins, 444);

    harness.setCloudData({ brainmerge: { version: 7, cells: [] } });
    assert.equal((await adapter.loadState()).coins, 444, 'corrupt cloud data must not hide a valid local snapshot');
  });
});
