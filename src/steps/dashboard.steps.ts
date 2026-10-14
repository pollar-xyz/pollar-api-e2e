import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { config } from '../config/env.js';
import type { E2EWorld } from '../support/world.js';

async function createApp(world: E2EWorld) {
  world.app = await world.hub.createApp(`e2e-${config.runId}`);
}

async function createKey(world: E2EWorld) {
  const key = await world.hub.createPublishableKey(world.requireApp().id);
  assert.match(key.plaintext, /^pub_(testnet|mainnet)_/, 'unexpected key format');
  world.apiKey = key.plaintext;
}

When('the developer creates a new app', async function (this: E2EWorld) {
  await createApp(this);
});

Then('the app is on testnet', function (this: E2EWorld) {
  assert.equal(this.requireApp().network, 'testnet');
});

Then('the developer can create a publishable key for it', async function (this: E2EWorld) {
  await createKey(this);
});

Given('a new app with a publishable key', async function (this: E2EWorld) {
  await createApp(this);
  await createKey(this);
});

Then('at least one ramp provider is registered for the app network', async function (this: E2EWorld) {
  const network = this.requireApp().network;
  const catalog = await this.hub.rampCatalog();
  const usable = catalog.filter((p) => p.network === network);
  this.log(`catalog: ${catalog.map((p) => `${p.name} (${p.network})`).join(', ') || 'empty'}`);
  assert.ok(usable.length > 0, `no ramp provider registered for ${network}`);
});

Given('the app enables every ramp provider registered for its network', async function (this: E2EWorld) {
  const app = this.requireApp();
  const usable = (await this.hub.rampCatalog()).filter((p) => p.network === app.network);
  for (const p of usable) {
    await this.hub.enableRampProvider(app.id, p.id);
    this.log(`enabled ${p.name}`);
  }
});
