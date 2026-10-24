# Local development and operations

## Install and start

Use Node 22.23.2+:

```bash
# terminal 1, from the repository root
cd python_backend
uv sync
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001

# terminal 2
cd document-processing-frontend
npm ci
npm run dev
```

Vite serves <http://localhost:5173> and proxies filesystem source/catalog requests to FastAPI on port 8001. The default config activates MSW after config validation; filesystem requests pass through it while GED, processing/results, and chat remain mocked.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite builds and previews the production bundle, then covers GED and filesystem intake, exact selection payloads, a valid PDF, first-success result entry, mixed page classifications, reload recovery, intake failure, and partial processing failure.

## Work on one mock scenario

Edit `public/config/app-config.json`:

```json
{ "mock": { "enabled": true, "scenario": "partial-failure" } }
```

Valid values: `happy-path`, `partial-failure`, `intake-failure`, `slow-processing`. Fixture documents/results live in `src/mocks/fixtures.ts`; endpoint behavior and poll-count transitions live in `src/mocks/handlers.ts`. Regenerate the checked-in valid PDFs with:

```bash
node scripts/generate-pdf-fixtures.mjs
```

## Real services during Vite development

Vite itself does not use the production Caddy proxy. The supported production-like path is Compose real mode:

```bash
cp .env.example .env
docker compose -f compose.yaml -f compose.real.yaml up --build
```

Set `mock.enabled=false` in the mounted real config. Start the Python services on the configured host ports and bind them to a Docker-reachable interface. Each service remains responsible for authentication, authorization, request limits, and data access.

## Container smoke test

```bash
docker compose up --build -d
docker compose ps
curl -fsS http://localhost:8080/healthz
curl -fsSI http://localhost:8080/config/app-config.json | grep -i 'cache-control: no-store'
# Complete the three-step mock flow at http://localhost:8080
docker compose down
```

To validate runtime replacement without rebuild, change the mounted JSON in `compose.real.yaml`, recreate only the frontend container, and reload the page.

## Language

French and English UI strings are in `src/i18n/index.ts`. The header language button changes the current i18next locale and the document `lang` attribute. Add both translations for any new interface text.

## Troubleshooting

- **Configuration invalide**: inspect the detailed Zod issue, the two `/config/*.json` responses, and their `Content-Type`.
- **PDF error**: verify a 200 `application/pdf` response at the catalog logical path. A 200 HTML SPA fallback is incorrect.
- **Tasks remain queued in real mode**: inspect the Caddy upstream, task alias mapping, and browser network response. Do not classify a local timeout as backend failure.
- **Host API is unreachable from Compose**: bind the Python server to a host-reachable interface and use `host.docker.internal`; Linux mapping is already present.
- **Mock worker not active**: confirm `mock.enabled=true`, `/mockServiceWorker.js` is served, and reload after clearing a stale service worker registration from a different application origin.
