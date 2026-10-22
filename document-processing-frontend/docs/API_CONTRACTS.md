# Proposed frontend API contracts

These JSON shapes are the frontend's proposed normalized contracts. They are not claims about existing Python APIs. If a real endpoint differs, adapt it in one `src/api/<domain>/adapters.ts` file while preserving the canonical models.

All browser calls use a same-origin logical prefix. Caddy removes only that prefix before forwarding, so `/backend/source/v1/intakes` becomes `/v1/intakes` at `SOURCE_API_ORIGIN`.

## GED contracts

```http
GET /backend/source/v1/ged/contracts
```

```json
{ "items": [{ "contractNumber": "CTR-2026-001", "label": "Contrat Alpha" }] }
```

## Intake

```json
{ "source": "filesystem", "folderPath": "/data/contracts/2026" }
```

or:

```json
{ "source": "GED", "gedCategory": "COLLECTIVE", "contractNumbers": ["CTR-2026-001"] }
```

`POST /backend/source/v1/intakes` returns HTTP 202:

```json
{ "taskId": "INTAKE-001", "status": "queued" }
```

`GET /backend/source/v1/tasks/INTAKE-001`:

```json
{ "taskId": "INTAKE-001", "status": "succeeded", "workflowId": "WF-001", "progress": 100 }
```

`adaptIntakeTask` also demonstrates mapping `result.workflowId` when a Python service nests the result reference.

## Catalog and PDF

`GET /backend/catalog/v1/workflows/WF-001/contracts`:

```json
{
  "workflowId": "WF-001",
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

`GET /backend/catalog/v1/workflows/WF-001/documents/D-001/content` returns binary `application/pdf`. It must not be redirected to the SPA index. Cookies or proxy-provided authentication remain same-origin.

## Processing

`POST /backend/processing/v1/workflows/WF-001/processing-jobs`:

```json
{
  "workflowId": "WF-001",
  "selections": [{ "contractId": "C-001", "documentIds": ["D-001", "D-002"] }]
}
```

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
    "workflowId": "WF-001",
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
curl -sS http://localhost:8001/v1/ged/contracts
curl -sS -X POST http://localhost:8001/v1/intakes \
  -H 'Content-Type: application/json' \
  -d '{"source":"filesystem","folderPath":"/data/contracts/2026"}'
curl -sS http://localhost:8001/v1/tasks/INTAKE-001
```
