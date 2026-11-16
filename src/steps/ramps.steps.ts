import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import { trustTestnetAsset } from '../clients/horizon.js';
import type { E2EWorld } from '../support/world.js';

type Direction = 'ONRAMP' | 'OFFRAMP';

// The SDK lists routes per direction; a country is offered when either direction reaches it.
When('the user lists the ramp countries', async function (this: E2EWorld) {
  const sdk = this.requireSdk();
  for (const direction of ['ONRAMP', 'OFFRAMP'] as const)
    this.routes[direction] = (await sdk.getRampRoutes(direction)).routes;
  const seen = new Map<string, string>();
  for (const { fiat } of [...this.routes.ONRAMP, ...this.routes.OFFRAMP]) seen.set(fiat.country, fiat.currency);
  this.countries = [...seen].map(([code, currency]) => ({ code, currency }));
  this.log(`countries: ${this.countries.map((c) => `${c.code}/${c.currency}`).join(', ') || 'none'}`);
});

Then('{string} is among the ramp countries', function (this: E2EWorld, code: string) {
  assert.ok(
    this.countries.some((c) => c.code === code),
    `${code} is not offered (countries: ${this.countries.map((c) => c.code).join(', ') || 'none'})`,
  );
});

// Quotes no longer name the provider, and Pollar picks it among the corridors
// of the methods the app turned on: any quote with a provider leg counts.
Then(
  /^"([^"]+)" quotes (onramp|offramp|onramp and offramp) in "([A-Z]{2})"$/,
  async function (this: E2EWorld, name: string, directions: string, code: string) {
    const sdk = this.requireSdk();
    const failures: string[] = [];
    for (const direction of directions.toUpperCase().split(' AND ') as Direction[]) {
      const routes = this.routes[direction].filter((r) => r.fiat.country === code);
      if (!routes.length) failures.push(`${name} ${direction.toLowerCase()} ${code}: no route`);
      // The catalog may list a route the provider no longer serves: one that quotes is enough.
      const tried: string[] = [];
      for (const route of routes) {
        const label = `${name} ${direction.toLowerCase()} ${code}/${route.fiat.currency}`;
        try {
          // An onramp delivers an issued asset, which the wallet must trust first.
          if (direction === 'ONRAMP' && route.asset.chain === 'STELLAR' && route.asset.identifier) {
            await trustTestnetAsset(this.requireWalletKeypair(), route.asset.code, route.asset.identifier);
            this.log(`${label}: wallet trusts ${route.asset.code}`);
          }
          const { kind: _f, ...fiat } = route.fiat;
          const { kind: _a, ...asset } = route.asset;
          const { quotes } = await sdk.quoteRamp({ direction, fiat, asset, amount: { value: '10', denomination: 'in' } });
          const own = quotes.filter((q) => q.legs.some((l) => l.kind === `PROVIDER_${direction}`));
          if (own.length === 0) throw new Error(`no quote with a provider leg (${quotes.length} quotes)`);
          this.log(`${label}: ${own[0].amountIn} in → ${own[0].amountOut} out via ${fiat.rail}`);
          tried.length = 0;
          break;
        } catch (e) {
          // A quote that found no route says why each route dropped out.
          const rejected = (e as { body?: { rejected?: Array<{ failure: { code: string } }> } }).body?.rejected;
          // New apps ramp only in COSIGNED mode and only a Pollar admin enables EXTERNAL,
          // so an external wallet's offramp reaching the provider and stopping there is expected.
          if (direction === 'OFFRAMP' && rejected?.length && rejected.every((r) => r.failure.code === 'SIGNING_MODE_NOT_ALLOWED')) {
            this.log(`${label}: refused SIGNING_MODE_NOT_ALLOWED (external wallet, app allows COSIGNED only)`);
            tried.length = 0;
            break;
          }
          const why = `${label}: ${(e as Error).message}${rejected ? ` ${JSON.stringify(rejected)}` : ''}`;
          this.log(why);
          tried.push(why);
        }
      }
      failures.push(...tried);
    }
    assert.deepEqual(failures, [], `quotes failed:\n${failures.join('\n')}`);
  },
);
