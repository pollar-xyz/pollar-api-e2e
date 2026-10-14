import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { config } from '../config/env.js';
import { loginWithNewWallet } from '../clients/sdk.js';
import type { E2EWorld } from '../support/world.js';

async function login(world: E2EWorld) {
  if (!world.apiKey) throw new Error('no api key: a previous step failed');
  const { client, state } = await loginWithNewWallet(config.sdkUrl, world.apiKey);
  if (state.step !== 'authenticated') throw new Error(`login ended in ${JSON.stringify(state)}`);
  world.sdk = client;
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

When('the user lists the ramp countries', async function (this: E2EWorld) {
  this.countries = (await this.requireSdk().getRampCountries()).countries;
  this.log(`countries: ${this.countries.map((c) => `${c.code}/${c.currency}`).join(', ') || 'none'}`);
});

Then('at least one ramp country is offered', function (this: E2EWorld) {
  assert.ok(this.countries.length > 0, 'the app is offered no ramp country');
});

// The published SDK (0.11.5) has no routes call yet, so ramps are found the
// way an app finds them today: countries, then a quote per direction.
Then('every ramp country quotes an onramp and an offramp', async function (this: E2EWorld) {
  const sdk = this.requireSdk();
  const failures: string[] = [];
  for (const country of this.countries) {
    for (const direction of ['onramp', 'offramp'] as const) {
      const label = `${direction} ${country.code}/${country.currency}`;
      try {
        const { quotes } = await sdk.getRampsQuote({
          country: country.code,
          currency: country.currency ?? '',
          amount: 10,
          direction,
        });
        if (quotes.length === 0) throw new Error('no provider quoted');
        this.log(`${label}: ${quotes.length} quote(s)`);
      } catch (e) {
        failures.push(`${label}: ${(e as Error).message}`);
      }
    }
  }
  assert.deepEqual(failures, [], `quotes failed:\n${failures.join('\n')}`);
});
