# Document Processing Frontend

Production-oriented React/TypeScript frontend for a three-step contract document workflow: source intake, contract/PDF selection, then progressive page classification and OCR results. In the default local runtime, GED and processing/results remain deterministic browser mocks while filesystem intake, contract discovery, and PDF bytes come from the repository's FastAPI backend.

## What works

- Filesystem or GED source selection, including Collective/Sinistres and searchable contract multi-selection.
- Immediate filesystem intake plus asynchronous GED intake polling; the document step stays locked until a successful response supplies a workflow ID.
- Contract/document selection by stable IDs, real PDF preview, exact processing payload, independent task monitoring, partial success, and first-success navigation.
- Page-specific PDF, classifier, OCR fields, raw OCR, unknown types/fields, missing values, optional confidence, and mixed-classification PDFs.
- Contextual assistant-ui `LocalRuntime` chat backed by the configured REST endpoint and current workflow/contract/document/page context.
- Same-tab reload recovery with only workflow IDs, selections, and task references in `sessionStorage`. OCR, PII, PDF bytes, tokens, and chat content are not stored there.
- French by default, English switch, runtime-validated configuration, MSW v2 scenarios, Vitest, Playwright, one unprivileged Caddy image, Compose, OpenShift manifests, and Azure Pipelines.

## Prerequisites

- Node.js 22.23.2 or newer in the Node 22 line
- npm 10+
- Docker with Compose v2 for container runs

## Local development and verification

```bash
# terminal 1
cd ../python_backend
uv sync
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001

# terminal 2
npm ci
npm run dev
```

Open <http://localhost:5173>. Select **Système de fichiers**, leave `/data`, and start analysis to load the backend catalog immediately. GED and downstream processing/results use the checked-in `happy-path` browser mock.

```bash
npm run lint
npm run typecheck
npm run test:ci
npx playwright install chromium   # first browser-test run only
npm run test:e2e
npm run build
```

## Run the production image

Mock mode (one frontend container, no Python containers):

```bash
docker compose up --build
# open http://localhost:8080
```

Real Python APIs:

```bash
cp .env.example .env
# edit only the four server-side upstream origins in .env
docker compose -f compose.yaml -f compose.real.yaml up --build
# open http://localhost:8080
```

Python services started on the host must bind to an address reachable from Docker, not only an isolated loopback interface. Linux Compose maps `host.docker.internal` through `host-gateway`. A single Python gateway can be used by assigning the same origin to all four variables.

Smoke checks:

```bash
curl -fsS http://localhost:8080/healthz
curl -fsS -D- http://localhost:8080/config/app-config.json
curl -fsS http://localhost:8080/ | grep '<div id="root"></div>'
```

`/config/*.json` is served with `Cache-Control: no-store`. Mounting a changed JSON file and recreating the container—or replacing a ConfigMap and reloading the page—does not rebuild JavaScript.

## Runtime configuration

- Browser-visible service names, same-origin base paths, route methods/templates, status aliases, polling, feature flags, locale, and mock selection live in `public/config/app-config.json`.
- Production Compose mounts `deploy/config/app-config.real.json` at `/srv/config/app-config.json` with `mock.enabled=false`.
- Private upstream origins live only in Caddy environment variables: `SOURCE_API_ORIGIN`, `CATALOG_API_ORIGIN`, `PROCESSING_API_ORIGIN`, `CHAT_API_ORIGIN`.
- Document type and field definitions live in `public/config/document-types.json`.

Both JSON documents are validated with Zod before React renders. Invalid configuration shows a blocking error screen; it never silently turns mock mode on.

### Add a document type without changing React

Add a type to `document-types.json`, for example:

```json
{
  "code": "CARTE_GRISE",
  "label": { "fr": "Carte grise", "en": "Vehicle registration" },
  "icon": "directions_car",
  "fields": [
    {
      "key": "registrationNumber",
      "label": { "fr": "Immatriculation", "en": "Registration number" },
      "dataType": "text",
      "order": 10,
      "priority": "primary"
    }
  ]
}
```

Reload the page. No component or JavaScript rebuild is required. Supported data types are `text`, `multiline`, `date`, `number`, `boolean`, and `currency`. Unknown backend types and keys are still rendered safely as text.

## Python integration points

1. Change HTTP method/path templates in runtime JSON when the semantic contract is unchanged.
2. Change one adapter under `src/api/<domain>/adapters.ts` when an actual Python DTO differs. UI components consume only canonical domain models from `src/domain/models.ts`.
3. Keep browser paths under `/backend/...`; point Caddy to private service origins through server environment variables.
4. Return PDF bytes as `application/pdf` through the catalog route. Authentication cookies/headers remain same-origin through the proxy.
5. The chat adapter is request/response today. An SSE adapter can replace `src/api/chat/service.ts` without changing results navigation.

These are proposed application-facing contracts—not claims about an existing Python implementation. See [API contracts](docs/API_CONTRACTS.md) for exact examples and adapter notes.

## Mock scenarios

Set `mock.scenario` in `public/config/app-config.json` to one of:

- `happy-path`: every task succeeds at staggered times.
- `partial-failure`: some processing tasks fail while completed results stay usable.
- `intake-failure`: intake fails and documents remain locked.
- `slow-processing`: tasks take longer, useful for reload-recovery checks.

Add fixtures in `src/mocks/fixtures.ts` and state transitions/routes in `src/mocks/handlers.ts`. The mock service worker is started and awaited only when `mock.enabled` is explicitly true.

## Important behavior and limits

- A filesystem path is text interpreted by the Python backend host/container. A browser cannot browse an arbitrary server directory.
- “Collective” and “Sinistres” are GED intake categories, not document types.
- Task-creating POST requests are never retried automatically. Idempotent GETs use bounded retry/backoff; polling stops at terminal states or a configured local timeout. A timeout means remote state is unknown, not failed.
- One PDF can contain pages with different classifications. Fields shown on the right always belong to the selected one-based page.
- Resetting the UI clears local queries/monitoring; it does not claim to cancel remote tasks because no cancellation endpoint is defined.
- Public runtime JSON must never contain private service URLs, credentials, tokens, or API keys.

## Documentation

- [Functional guide](docs/FUNCTIONAL_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Runtime configuration](docs/CONFIGURATION.md)
- [Local development and operations](docs/LOCAL_DEVELOPMENT.md)
- [OpenShift deployment](deploy/openshift/README.md)

## CI and deployment handoff

`azure-pipelines.yml` runs clean installation, lint, strict typecheck, unit/component tests, production build, and Chromium E2E before building one image. Configure the authorized `dockerRegistryServiceConnection` pipeline variable and, if needed, override `imageRepository`. The image is pushed with both Build ID and full commit SHA tags; registry credentials are never stored in this repository.

There is deliberately no cluster-credential deployment stage and no Helm chart. Promote an immutable image tag, create the runtime ConfigMap, update the image reference, and apply the raw OpenShift resources using [the OpenShift instructions](deploy/openshift/README.md).
