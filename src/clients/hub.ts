// The dashboard API (hub-api), driven with a Personal Access Token: what the
// dashboard does when someone sets up an app, without a browser.

export type HubApp = { id: string; name: string; network: string };
export type RampProvider = { id: string; name: string; network: string };
export type AppUser = { id: string; providers: string[]; wallets: Array<{ network: string; public_key: string }> };
export type AppWallet = { public_key: string; network: string; type: string };

export function hubClient(baseUrl: string, pat: string) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}/v1${path}`, {
      method,
      redirect: 'error', // a moved host must fail, never follow dev into prod
      headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean; code?: string; content?: T } | null;
    if (!res.ok || !json?.success) throw new Error(`${method} ${path} -> ${res.status} ${json?.code ?? ''}`.trim());
    return json.content as T;
  }

  return {
    createApp: (name: string) => call<HubApp>('POST', '/applications', { name }),
    archiveApp: (id: string) => call('POST', `/applications/${id}/archive`),
    createPublishableKey: (appId: string) =>
      call<{ plaintext: string }>('POST', `/applications/${appId}/api-keys`, {
        name: 'e2e',
        type: 'PUBLISHABLE',
        // Node sends no Origin header, like a mobile client.
        allow_native_clients: true,
      }),
    listUsers: async (appId: string) => (await call<{ items: AppUser[] }>('GET', `/applications/${appId}/users`)).items,
    listWallets: async (appId: string) => (await call<{ items: AppWallet[] }>('GET', `/applications/${appId}/wallets`)).items,
    /** The global catalog: every ramp provider registered in this environment. */
    rampCatalog: async () => (await call<{ providers: RampProvider[] }>('GET', '/ramp-providers')).providers,
    enableRampProvider: (appId: string, rampProviderId: string) =>
      call('POST', `/applications/${appId}/ramp-providers`, { rampProviderId }),
  };
}

export type HubClient = ReturnType<typeof hubClient>;
