// Every app a scenario creates is archived when it ends, pass or fail.
import { After, setDefaultTimeout } from '@cucumber/cucumber';
import type { E2EWorld } from './world.js';

// The test environment answers some dashboard calls in ~6s.
setDefaultTimeout(60_000);

After(async function (this: E2EWorld) {
  if (!this.app) return;
  try {
    await this.hub.archiveApp(this.app.id);
  } catch (e) {
    this.log(`cleanup: could not archive app ${this.app.id}: ${(e as Error).message}`);
  }
});
