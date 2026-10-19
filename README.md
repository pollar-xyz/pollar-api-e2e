# pollar-api-e2e

End-to-end tests of the path a new customer takes, written as Cucumber
scenarios and run against dev (`*.pollar.dev`) and prod (`*.pollar.xyz`). Every app they create
is on testnet, in both environments: nothing runs on mainnet.

## Layout

```
features/            scenarios in plain language (Gherkin)
src/config/env.ts    run settings; refuses any host that is not *.pollar.dev or *.pollar.xyz
src/clients/         dashboard API (hub-api, PAT), the published SDK (@pollar/core), Horizon testnet (read-only)
src/support/         per-scenario state (World) and cleanup hooks
src/steps/           step definitions, one file per feature
scripts/summary.ts   Markdown summary of the run for GitHub
```

Each scenario creates its own app and archives it when it ends. No ramp order is created.

Ramps run one scenario per provider. A provider not registered for the app network in `.dev`
is reported as skipped, with the reason, instead of failing.

## Run

```sh
cp .env.example .env   # set POLLAR_PAT (dev by default)
npm ci
npm run test:e2e
```

Reports in `reports/`: `cucumber.html` (open in a browser), `cucumber.json`, `junit.xml`.
In GitHub Actions dev and prod run in parallel: the run page has a summary per environment and a
combined table, and the files are in the `e2e-report-dev` and `e2e-report-prod` artifacts. Pull
requests and pushes test dev only.

## Configuration

Per GitHub environment (`dev`, `prod`):

| Name          | Where (GitHub) | dev                             | prod                          |
| ------------- | -------------- | ------------------------------- | ----------------------------- |
| `POLLAR_PAT`  | Secret         | token from dashboard.pollar.dev | token from the prod dashboard |
| `E2E_HUB_URL` | Variable       | `https://hub-api.pollar.dev`    | `https://hub.api.pollar.xyz`  |
| `E2E_SDK_URL` | Variable       | `https://sdk-api.pollar.dev`    | `https://sdk.api.pollar.xyz`  |

The token is a dashboard Personal Access Token with no app restriction. Repository variable
`POLLAR_SDK_VERSION` (optional): `@pollar/core` version or dist-tag CI tests, default `latest`.

Locally the same names go in `.env`. Locally the SDK is the one pinned in `package-lock.json`; CI
installs `latest` (or the version above) on top of it. A manual run can also pick a version.

Release candidates: a manual run with `sdk_ref` (a tag or branch of `pollar-xyz/pollar`, for example
`v0.12.0-rc.1`) builds `@pollar/core` from that ref instead of installing it from npm. The SDK repo
starts this run when an `v*-rc*` tag is pushed.
