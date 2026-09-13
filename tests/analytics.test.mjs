import test from 'node:test';
import assert from 'node:assert/strict';
import { Analytics } from '../build/analytics/analytics.js';

test('provider-neutral analytics forwards only explicit gameplay aggregates', () => {
  const events = [];
  const analytics = new Analytics({ send: (name, properties) => events.push({ name, properties }) });
  analytics.track('tier_discovered', { tier: 8, activeSeconds: 321 });
  assert.deepEqual(events, [{ name: 'tier_discovered', properties: { tier: 8, activeSeconds: 321 } }]);
});

test('analytics remains a safe no-op without a configured provider', () => {
  assert.doesNotThrow(() => new Analytics().track('wait_shown', { tier: 3 }));
});
