import assert from 'node:assert/strict';
import { Then } from '@cucumber/cucumber';
import type { E2EWorld } from '../support/world.js';

Then("the SDK reports that Stellar wallet as the user's wallet", function (this: E2EWorld) {
  const address = this.requireWalletAddress();
  const wallet = this.requireSdk().getWallet();
  assert.ok(wallet, 'the SDK reports no wallet');
  assert.equal(wallet.address, address);
  assert.equal(wallet.custody, 'external');
  const stellar = this.requireSdk()
    .getWallets()
    .find((w) => w.chain === 'STELLAR');
  assert.equal(stellar?.address, address, 'no Stellar entry in getWallets()');
  this.log(`wallet ${address} (on ledger: ${wallet.existsOnStellar ?? 'unknown'})`);
});

Then('the dashboard lists the user with that wallet', async function (this: E2EWorld) {
  const address = this.requireWalletAddress();
  const users = await this.hub.listUsers(this.requireApp().id);
  const user = users.find((u) => u.wallets.some((w) => w.network === 'STELLAR' && w.public_key === address));
  assert.ok(user, `no app user holds ${address} (users: ${users.length})`);
  assert.ok(user.providers.includes('WALLET'), `login method not recorded as WALLET: ${user.providers.join(', ')}`);
});

Then('the dashboard lists that wallet for the app', async function (this: E2EWorld) {
  const address = this.requireWalletAddress();
  const wallets = await this.hub.listWallets(this.requireApp().id);
  const wallet = wallets.find((w) => w.public_key === address);
  assert.ok(wallet, `${address} is not among the app wallets`);
  assert.equal(wallet.type, 'sdk_user');
});
