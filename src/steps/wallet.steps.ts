import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { testnetAccount } from '../clients/horizon.js';
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

When('the user creates their Stellar account through the SDK', async function (this: E2EWorld) {
  const outcome = await this.requireSdk().createAccount();
  assert.equal(outcome.status, 'success', `createAccount ended ${JSON.stringify(outcome)}`);
  this.log(`createAccount tx ${outcome.hash}`);
});

Then('the SDK reports the account on the ledger with an XLM balance', async function (this: E2EWorld) {
  const address = this.requireWalletAddress();
  const balance = await this.requireSdk().getWalletBalance(address);
  assert.equal(balance.exists, true, `${address} is not on the ledger`);
  const xlm = balance.balances.find((b) => b.type === 'native');
  assert.ok(xlm, 'no XLM balance reported');
  this.log(`XLM balance ${xlm.balance} on ${balance.network}`);
});

Then('the account reserve is sponsored on Stellar testnet', async function (this: E2EWorld) {
  const address = this.requireWalletAddress();
  const account = await testnetAccount(address);
  assert.ok(account, `${address} is not on Stellar testnet`);
  assert.ok(account.sponsor && account.sponsor !== address, 'the account reserve is not sponsored');
  this.log(`reserve sponsored by ${account.sponsor}`);
});
