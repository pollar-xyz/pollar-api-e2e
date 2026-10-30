// Stellar testnet: reads to confirm what the platform reports, and the few
// writes an end user makes from their own wallet (funding, trustlines).
import { Asset, BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

export type HorizonAccount = {
  account_id: string;
  sponsor?: string;
  balances: Array<{ asset_type: string; balance: string; asset_code?: string; asset_issuer?: string }>;
};

export async function testnetAccount(address: string): Promise<HorizonAccount | null> {
  const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon testnet answered ${res.status} for ${address}`);
  return (await res.json()) as HorizonAccount;
}

/** Funds the wallet with friendbot when it has no account yet, then trusts the asset, as a user would. */
export async function trustTestnetAsset(keypair: Keypair, code: string, issuer: string): Promise<void> {
  const address = keypair.publicKey();
  let account = await testnetAccount(address);
  if (!account) {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
    if (!res.ok) throw new Error(`friendbot answered ${res.status} for ${address}`);
    account = await testnetAccount(address);
  }
  if (account?.balances.some((b) => b.asset_code === code && b.asset_issuer === issuer)) return;
  const server = new Horizon.Server(HORIZON_TESTNET);
  const tx = new TransactionBuilder(await server.loadAccount(address), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: new Asset(code, issuer) }))
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  await server.submitTransaction(tx);
}
