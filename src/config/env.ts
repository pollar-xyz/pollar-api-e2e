// Run configuration, read once. Only the test environment (*.pollar.dev) is
// allowed: a URL that points anywhere else stops the run before any call.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

function testUrl(name: string, fallback: string): string {
  const url = process.env[name] || fallback;
  if (!new URL(url).hostname.endsWith('.pollar.dev')) throw new Error(`${name} must be a *.pollar.dev URL, got ${url}`);
  return url.replace(/\/$/, '');
}

export const config = {
  hubUrl: testUrl('E2E_HUB_URL', 'https://hub-api.pollar.dev'),
  sdkUrl: testUrl('E2E_SDK_URL', 'https://sdk-api.pollar.dev'),
  pat: required('POLLAR_DEV_PAT'),
  runId: process.env.GITHUB_RUN_ID ?? String(Date.now()),
};
