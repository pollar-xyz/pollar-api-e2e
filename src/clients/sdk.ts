// The published SDK (@pollar/core), driven from Node the way an app drives it
// from a browser. The SDK only runs where it can persist state, so the two
// browser globals it checks are stubbed before it is imported.
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';

const g = globalThis as Record<string, unknown>;
g.window ??= {
  location: { origin: 'https://e2e.invalid', href: 'https://e2e.invalid/' },
  addEventListener() {},
  removeEventListener() {},
};
g.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const sdk = await import('@pollar/core');
export type PollarClient = InstanceType<typeof sdk.PollarClient>;
type AuthState = ReturnType<PollarClient['getAuthState']>;

/** A Stellar wallet held in memory: it signs the SEP-10 login itself. */
function keypairWallet(keypair: Keypair) {
  const address = keypair.publicKey();
  return {
    type: 'e2e-keypair',
    meta: { label: 'E2E keypair' },
    chain: 'STELLAR' as const,
    custody: 'external' as const,
    isAvailable: async () => true,
    connect: async () => ({ address }),
    disconnect: async () => {},
    getPublicKey: async () => address,
    async signTransaction(xdr: string, options?: { networkPassphrase?: string }) {
      const tx = TransactionBuilder.fromXDR(xdr, options!.networkPassphrase!);
      tx.sign(keypair);
      return { signedTxXdr: tx.toXDR(), signerAddress: address };
    },
  };
}

/** Logs a fresh wallet into the app behind `apiKey`; resolves once the login settles. */
export async function loginWithNewWallet(baseUrl: string, apiKey: string) {
  const keypair = Keypair.random();
  const wallet = keypairWallet(keypair);
  const client = new sdk.PollarClient({
    apiKey,
    baseUrl,
    storage: sdk.createMemoryAdapter(),
    walletAdapters: [wallet],
  } as ConstructorParameters<typeof sdk.PollarClient>[0]);
  await client.ready();
  const state = await new Promise<AuthState>((resolve) => {
    const stop = client.onAuthStateChange((s) => {
      if (s.step === 'authenticated' || s.step === 'error' || s.step === 'wallet_not_installed') {
        stop();
        resolve(s);
      }
    });
    client.login({ provider: wallet.type });
  });
  return { client, address: keypair.publicKey(), keypair, state };
}
