import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalPlatformAdapter } from '../build/platform/local.js';
import { createInitialState } from '../build/core/game.js';

async function withStorage(callback) {
  const previous = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); }
  };
  try {
    return await callback(values);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

test('local adapter reads canonical v2 first and falls back to legacy v1', async () => {
  await withStorage(async (values) => {
    const adapter = new LocalPlatformAdapter();
    const legacy = { ...createInitialState(0), coins: 111 };
    const canonical = { ...legacy, coins: 222 };

    values.set('brainmerge.save.v1', JSON.stringify(legacy));
    assert.equal((await adapter.loadState()).coins, 111, 'legacy-only players must still load');

    values.set('brainmerge.save.v2', JSON.stringify(canonical));
    assert.equal((await adapter.loadState()).coins, 222, 'canonical safe slot must win once present');
  });
});

test('local adapter dual-writes v2 and legacy v1 during the recovery migration window', async () => {
  await withStorage(async (values) => {
    const adapter = new LocalPlatformAdapter();
    const state = { ...createInitialState(0), coins: 333 };
    await adapter.saveState(state);

    assert.equal(JSON.parse(values.get('brainmerge.save.v2')).coins, 333);
    assert.equal(JSON.parse(values.get('brainmerge.save.v1')).coins, 333);
  });
});
