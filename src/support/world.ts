// State shared by the steps of one scenario. Each scenario gets a new World.
import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import { config } from '../config/env.js';
import { hubClient, type HubApp, type RampProvider } from '../clients/hub.js';
import type { PollarClient } from '../clients/sdk.js';

export class E2EWorld extends World {
  readonly hub = hubClient(config.hubUrl, config.pat);
  app?: HubApp;
  apiKey?: string;
  provider?: RampProvider;
  sdk?: PollarClient;
  walletAddress?: string;
  countries: Array<{ code: string; currency: string | null }> = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  requireApp(): HubApp {
    if (!this.app) throw new Error('no app: a previous step failed');
    return this.app;
  }

  requireProvider(): RampProvider {
    if (!this.provider) throw new Error('no ramp provider: a previous step failed');
    return this.provider;
  }

  requireWalletAddress(): string {
    if (!this.walletAddress) throw new Error('no wallet: a previous step failed');
    return this.walletAddress;
  }

  requireSdk(): PollarClient {
    if (!this.sdk) throw new Error('not logged in: a previous step failed');
    return this.sdk;
  }
}

setWorldConstructor(E2EWorld);
