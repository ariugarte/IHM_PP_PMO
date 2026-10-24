# Document backend

FastAPI service that maps a client type to a configured data directory, then exposes its contract
folders and PDF files. Only immediate child directories are contracts and only immediate `*.pdf`
children are documents.

## Run

```bash
uv sync
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001
```

The defaults are the repository-level `data_PMO/` and `data_PP/` folders. Override either mapping
without changing source code:

```bash
DOCUMENT_BACKEND_PMO_DATA_FOLDER=/absolute/path/to/legal-entity-data \
DOCUMENT_BACKEND_PP_DATA_FOLDER=/absolute/path/to/natural-person-data \
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001
```

`POST /v1/intakes` accepts only the business choice, for example `{"clientType":"PMO"}` or
`{"clientType":"PP"}`. No browser-supplied filesystem path is accepted. The service returns the
corresponding `FS-PMO` or `FS-PP` workflow, and every catalog/PDF request remains scoped by that
workflow.

Then run the frontend development server from `document-processing-frontend/`. Client intake,
catalog, and PDF requests are proxied to this service; processing/results remain mocked in the PoC.

## Verify

```bash
uv run ruff check .
uv run pytest
```
