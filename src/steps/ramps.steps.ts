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

Then('{string} is among the ramp countries', function (this: E2EWorld, code: string) {
  assert.ok(
    this.countries.some((c) => c.code === code),
    `${code} is not offered (countries: ${this.countries.map((c) => c.code).join(', ') || 'none'})`,
  );
});

// The published SDK (0.11.5) has no routes call yet, so a ramp is found the way
// an app finds it today: the country's currency, then a quote per direction.
Then(
  /^"([^"]+)" quotes (onramp|offramp|onramp and offramp) in "([A-Z]{2})"$/,
  async function (this: E2EWorld, name: string, directions: string, code: string) {
    const sdk = this.requireSdk();
    const provider = this.requireProvider();
    const country = this.countries.find((c) => c.code === code)!;
    const failures: string[] = [];
    for (const direction of directions.split(' and ') as Array<'onramp' | 'offramp'>) {
      const label = `${name} ${direction} ${code}/${country.currency}`;
      try {
        const { quotes } = await sdk.getRampsQuote({ country: code, currency: country.currency ?? '', amount: 10, direction });
        const own = quotes.filter((q) => q.provider === provider.name || q.provider === provider.id);
        if (own.length === 0)
          throw new Error(`no quote from ${name} (quoted by: ${quotes.map((q) => q.provider).join(', ') || 'nobody'})`);
        this.log(`${label}: rate ${own[0].rate}, fee ${own[0].fee} ${own[0].feeCurrency}`);
      } catch (e) {
        failures.push(`${label}: ${(e as Error).message}`);
      }
    }
    assert.deepEqual(failures, [], `quotes failed:\n${failures.join('\n')}`);
  },
);
