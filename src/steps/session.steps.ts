import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { config } from '../config/env.js';
import { loginWithNewWallet } from '../clients/sdk.js';
import type { E2EWorld } from '../support/world.js';

async function login(world: E2EWorld) {
  if (!world.apiKey) throw new Error('no api key: a previous step failed');
  const { client, address, keypair, state } = await loginWithNewWallet(config.sdkUrl, world.apiKey);
  if (state.step !== 'authenticated') throw new Error(`login ended in ${JSON.stringify(state)}`);
  world.sdk = client;
  world.walletAddress = address;
  world.walletKeypair = keypair;
}

When('a new Stellar wallet logs in with the SDK', async function (this: E2EWorld) {
  await login(this);
});

Given('a new Stellar wallet is logged in with the SDK', async function (this: E2EWorld) {
  await login(this);
});

Then('the session is authenticated', function (this: E2EWorld) {
  assert.equal(this.requireSdk().getAuthState().step, 'authenticated');
});
