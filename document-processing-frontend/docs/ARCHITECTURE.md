# Architecture

## Runtime shape

The deliverable is one React SPA and one production image. Caddy serves static assets and owns four same-origin proxy prefixes. Python services are independent deployments.

```text
Browser (React)
  ├─ /backend/source/*      ── Caddy ── SOURCE_API_ORIGIN
  ├─ /backend/catalog/*     ── Caddy ── CATALOG_API_ORIGIN
  ├─ /backend/processing/*  ── Caddy ── PROCESSING_API_ORIGIN
  └─ /backend/chat/*        ── Caddy ── CHAT_API_ORIGIN
```

In mock mode, MSW intercepts those exact browser requests. Processing/results and chat receive deterministic responses. Client intake, catalog, and PDF requests are passed through to the FastAPI backend, with Vite proxying source and catalog paths during local development. The React endpoint resolver, HTTP client, DTO adapters, TanStack queries, and screens remain shared.

The intake boundary accepts only `clientType`. The FastAPI service owns two configuration entries (`PMO` and `PP`) and maps each to its filesystem repository. The resulting `FS-PMO` or `FS-PP` workflow keeps later catalog and PDF requests scoped to the selected client type.

## Source modules

- `src/app`: bootstrap, providers, router, guards, and application shell.
- `src/config`: runtime JSON Zod schemas, loading, and context.
- `src/api`: central native-fetch client, safe route resolver, and per-domain wire adapters/services.
- `src/domain`: canonical types, status normalization, and selection rules.
- `src/features`: source, selection, results, task monitoring, and contextual chat.
- `src/components`: stable layout, feedback, card, table, and PDF primitives.
- `src/state`: minimal Zustand workflow identity; no duplicate catalog/result server cache.
- `src/mocks`: deterministic public HTTP contract, fixtures, and task state engine.

## State ownership

TanStack Query owns catalogs, current task responses, PDFs, and completed results. Zustand owns workflow identity, included contract IDs, selected document IDs, task references, and navigation. The persistence middleware writes only non-sensitive recovery data to `sessionStorage`.

The task monitor sits above the routes. It keeps active task polling alive across navigation, stops terminal tasks, bounds concurrently enabled task queries, prevents overlapping polling through TanStack Query, handles bounded transport retries, and invalidates task queries when the tab regains focus.

## Contract boundary

`src/domain/models.ts` is the canonical application contract. Each Python domain has a wire parser/adapter under `src/api/<domain>/adapters.ts`. Screens never inspect backend DTOs. Runtime JSON can change service names, base paths, methods, templates, aliases, and timing; material response-shape differences require an adapter edit.

Path placeholders are individually encoded and every supplied parameter must be known. Query values enter `URLSearchParams` unencoded and are encoded once. The schema and resolver reject browser targets outside same-origin `/backend/...` paths.

## Task and result semantics

- Intake may advance only after success plus `workflowId`.
- `PMO` and `PP` intake requests never contain a path; repository resolution is a backend concern.
- The contract multi-selector controls card inclusion independently from each card's document checkboxes.
- Processing creation returns a list; the app never assumes one task per contract.
- Results are requested only for succeeded tasks and deduplicated by stable document ID.
- Failed task data never hides successful task data.
- `DocumentResult.pages[].pageNumber` is one-based. The PDF viewer clamps navigation to the actual PDF page count.
- Classification and field cards are page-scoped. A two-page PDF may have two document type codes.

## Security and deployment

Runtime JSON is public and is rendered as text only; no dynamic HTML or code is evaluated. Private upstreams remain in Caddy environment variables. API and PDF requests are same-origin and use `credentials: same-origin`. Caddy has no admin API or automatic HTTPS, listens on 8080, and the image runs without root or Linux capabilities. OpenShift terminates TLS at the Route.

Authentication/authorization, API rate limits, document access control, and proxy trust policy must be enforced by the Python services or an approved gateway.

## Visual identity

The shell uses AXA's core blue, red, and white palette. `public/axa-logo.svg` is used in the header,
footer, and browser favicon; theme tokens in `src/theme/theme.ts` keep interactive controls and focus
states consistent. Deployment teams remain responsible for confirming brand-asset authorization and
any production typography license.
