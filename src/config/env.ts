// Run configuration, read once. Two environments: dev (*.pollar.dev) and prod
// (*.pollar.xyz). A URL anywhere else stops the run before any call. Both
// URLs must point at the same environment.

const environments = { dev: '.pollar.dev', prod: '.pollar.xyz' } as const;
export type Environment = keyof typeof environments;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

function environmentOf(name: string, url: string): Environment {
  const host = new URL(url).hostname;
  const env = (Object.keys(environments) as Environment[]).find((e) => host.endsWith(environments[e]));
  if (!env) throw new Error(`${name} must be a *.pollar.dev or *.pollar.xyz URL, got ${url}`);
  return env;
}

const hubUrl = (process.env.E2E_HUB_URL || 'https://hub.api.dev.pollar.dev').replace(/\/$/, '');
const sdkUrl = (process.env.E2E_SDK_URL || 'https://sdk.api.dev.pollar.dev').replace(/\/$/, '');
const env = environmentOf('E2E_HUB_URL', hubUrl);
if (environmentOf('E2E_SDK_URL', sdkUrl) !== env)
  throw new Error('E2E_HUB_URL and E2E_SDK_URL point at different environments');

export const config = {
  env,
  hubUrl,
  sdkUrl,
  pat: required('POLLAR_PAT'),
  runId: process.env.GITHUB_RUN_ID ?? String(Date.now()),
};
