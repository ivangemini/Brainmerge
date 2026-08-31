import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const assets = [
  'public/assets/ui/icon-campaign.webp',
  'public/assets/ui/icon-prestige.webp',
  'public/assets/ui/icon-brain-cell.webp',
  'public/assets/ui/stage-normal.webp',
  'public/assets/ui/stage-challenge.webp',
  'public/assets/ui/stage-elite.webp',
  'public/assets/ui/stage-boss.webp',
  'public/assets/ui/stage-locked.webp',
  'public/assets/campaign/campaign-world-01.webp',
  'public/assets/campaign/campaign-world-02.webp',
  'public/assets/campaign/boss-world-01.webp',
  'public/assets/campaign/boss-world-02.webp'
];

test('campaign production art pack exists', async () => {
  await Promise.all(assets.map((asset) => access(new URL(`../${asset}`, import.meta.url))));
});

test('campaign locale resources keep EN/RU key parity', async () => {
  const [en, ru] = await Promise.all([
    JSON.parse(await readFile(new URL('../locales/campaign-en.json', import.meta.url), 'utf8')),
    JSON.parse(await readFile(new URL('../locales/campaign-ru.json', import.meta.url), 'utf8'))
  ]);
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort());
  assert.ok(Object.values(en).every((value) => typeof value === 'string' && value.length > 0));
  assert.ok(Object.values(ru).every((value) => typeof value === 'string' && value.length > 0));
});

test('campaign shell remains presentation-only', async () => {
  const script = await readFile(new URL('../public/campaign-map.js', import.meta.url), 'utf8');
  assert.match(script, /campaign-world-01\.webp/);
  assert.match(script, /campaign-world-02\.webp/);
  assert.doesNotMatch(script, /localStorage|saveState|paidBoxes|pendingOfflineCoins|purchaseUpgrade|spawnUnit/);
});
