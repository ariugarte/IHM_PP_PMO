# Proposed frontend API contracts

These JSON shapes are the frontend's normalized contracts. Intake, catalog, and PDF delivery are implemented by the repository's FastAPI service; processing and chat are the proposed integration contracts. If another endpoint differs, adapt it in one `src/api/<domain>/adapters.ts` file while preserving the canonical models.

All browser calls use a same-origin logical prefix. Caddy removes only that prefix before forwarding, so `/backend/source/v1/intakes` becomes `/v1/intakes` at `SOURCE_API_ORIGIN`.

## Intake

`POST /backend/source/v1/intakes` accepts a business client type, never a filesystem path:

```json
{ "clientType": "PMO" }
```

or:

```json
{ "clientType": "PP" }
```

The current FastAPI service uses `DOCUMENT_BACKEND_PMO_DATA_FOLDER` and
`DOCUMENT_BACKEND_PP_DATA_FOLDER` to resolve the directory. A PMO request returns HTTP 202 with an
immediately completed, client-scoped workflow:

```json
{ "taskId": "FS-INTAKE-PMO", "status": "succeeded", "workflowId": "FS-PMO", "progress": 100 }
```

The equivalent PP response uses the `FS-INTAKE-PP` task and `FS-PP` workflow. Unknown client types
return HTTP 422 through request validation.

`GET /backend/source/v1/tasks/FS-INTAKE-PMO`:

```json
{ "taskId": "FS-INTAKE-PMO", "status": "succeeded", "workflowId": "FS-PMO", "progress": 100 }
```

`adaptIntakeTask` also demonstrates mapping `result.workflowId` when a Python service nests the result reference.

## Catalog and PDF

`GET /backend/catalog/v1/workflows/FS-PMO/contracts`:

```json
{
  "workflowId": "FS-PMO",
  "contracts": [{
    "contractId": "C-001",
    "contractNumber": "CTR-2026-001",
    "label": "Contrat Alpha",
    "documents": [{
      "documentId": "D-001",
      "contractId": "C-001",
      "filename": "kbis_alpha.pdf",
      "mimeType": "application/pdf",
      "pageCount": 2
    }]
  }]
}
```

`GET /backend/catalog/v1/workflows/FS-PMO/documents/D-001/content` returns binary `application/pdf`. It must not be redirected to the SPA index. Cookies or proxy-provided authentication remain same-origin.

## Processing

`POST /backend/processing/v1/workflows/FS-PMO/processing-jobs`:

```json
{
  "workflowId": "FS-PMO",
  "selections": [{
    "contractId": "C-001",
    "documentIds": ["D-001", "D-002"],
    "documentTypeIds": ["LEGAL_ENTITY_OFFICIAL_DOCUMENT", "BENEFICIAL_OWNERS_REGISTER"]
  }]
}
```

`documentTypeIds` is required and contains the per-contract choices from
`document-search-types.json`. Labels are presentation data and are not sent to the processing API.

HTTP 202:

```json
{
  "tasks": [
    { "taskId": "TASK-101", "status": "queued", "contractId": "C-001", "documentIds": ["D-001"] },
    { "taskId": "TASK-102", "status": "queued", "contractId": "C-001", "documentIds": ["D-002"] }
  ]
}
```

`GET /backend/processing/v1/tasks/TASK-101` returns the same task identity plus normalized status inputs, progress, and optional error information.

`GET /backend/processing/v1/tasks/TASK-101/results` is called after success:

```json
{
  "taskId": "TASK-101",
  "documents": [{
    "contractId": "C-001",
    "documentId": "D-001",
    "taskId": "TASK-101",
    "status": "succeeded",
    "pages": [{
      "pageNumber": 1,
      "documentTypeCode": "KBIS",
      "classificationConfidence": 0.96,
      "ocrText": "EXTRAIT K-BIS ...",
      "fields": [{ "key": "siren", "value": "123456789", "confidence": 0.97, "sourcePage": 1 }]
    }]
  }]
}
```

One response may contain several documents; some documents may have partial page arrays. Page numbers are one-based.

## Chat

`POST /backend/chat/v1/chat`:

```json
{
  "conversationId": "CHAT-001",
  "message": "Quel est le SIREN ?",
  "context": {
    "workflowId": "FS-PMO",
    "contractIds": ["C-001"],
    "documentIds": ["D-001"],
    "pageNumbers": [1]
  }
}
```

```json
{
  "conversationId": "CHAT-001",
  "message": "Le numéro SIREN détecté est 123 456 789.",
  "sources": [{ "documentId": "D-001", "pageNumber": 1, "fieldKey": "siren" }]
}
```

This is request/response, exposed behind an assistant-ui `ChatModelAdapter`. SSE can be introduced in the adapter without changing the result panel's context model.

## Error behavior

The client exposes typed errors for 401, 403, 404, 409, 422, 429, and 500 responses and preserves `x-correlation-id`. GET network errors, 429s, and 5xx responses receive a small bounded backoff. Task-creating POSTs receive no automatic retry.

Example requests to real Python services (not to the browser-only MSW mock):

```bash
curl -sS -X POST http://localhost:8001/v1/intakes \
  -H 'Content-Type: application/json' \
  -d '{"clientType":"PMO"}'
curl -sS http://localhost:8001/v1/tasks/FS-INTAKE-PMO
curl -sS http://localhost:8001/v1/workflows/FS-PMO/contracts
```
