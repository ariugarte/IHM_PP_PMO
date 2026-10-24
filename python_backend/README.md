# Document backend

FastAPI service that exposes contract folders and PDF files from the configured data directory.
Only immediate child directories are contracts and only immediate `*.pdf` children are documents.

## Run

```bash
uv sync
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001
```

The default data directory is the repository-level `data/` folder and its public filesystem alias is
`/data`. Override either setting without changing source code:

```bash
DOCUMENT_BACKEND_DATA_FOLDER=/absolute/path/to/data \
DOCUMENT_BACKEND_PUBLIC_DATA_PATH=/data \
uv run uvicorn document_backend.app:app --host 127.0.0.1 --port 8001
```

Then run the frontend development server from `document-processing-frontend/`. Filesystem source,
catalog, and PDF requests are proxied to this service; GED and processing/results remain mocked.

## Verify

```bash
uv run ruff check .
uv run pytest
```

