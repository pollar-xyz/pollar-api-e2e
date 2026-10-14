// Read-only look at Stellar testnet, to confirm what the platform reports.
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

export type HorizonAccount = { account_id: string; sponsor?: string; balances: Array<{ asset_type: string; balance: string }> };

export async function testnetAccount(address: string): Promise<HorizonAccount | null> {
  const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon testnet answered ${res.status} for ${address}`);
  return (await res.json()) as HorizonAccount;
}
