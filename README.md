# pollar-api-e2e

End-to-end tests of the path a new customer takes, written as Cucumber
scenarios and run against the test environment (`*.pollar.dev` only).

## Layout

```
features/            scenarios in plain language (Gherkin)
src/config/env.ts    run settings; refuses any host that is not *.pollar.dev
src/clients/         dashboard API (hub-api, PAT) and the published SDK (@pollar/core)
src/support/         per-scenario state (World) and cleanup hooks
src/steps/           step definitions, one file per feature
scripts/summary.ts   Markdown summary of the run for GitHub
```

Each scenario creates its own app and archives it when it ends. No ramp order is created.

Ramps run one scenario per provider. A provider not registered for the app network in `.dev`
is reported as skipped, with the reason, instead of failing.

## Run

```sh
cp .env.example .env   # set POLLAR_DEV_PAT
npm ci
npm run test:e2e
```

Reports in `reports/`: `cucumber.html` (open in a browser), `cucumber.json`, `junit.xml`.
In GitHub Actions the summary is on the run page and the files are in the `e2e-report` artifact.

## Configuration

| Name | Where (GitHub) | Purpose |
|---|---|---|
| `POLLAR_DEV_PAT` | Secret | Dashboard token (no app restriction) |
| `E2E_HUB_URL` | Variable | Dashboard API, default `https://hub-api.pollar.dev` |
| `E2E_SDK_URL` | Variable | SDK API, default `https://sdk-api.pollar.dev` |

Locally the same names go in `.env`.
