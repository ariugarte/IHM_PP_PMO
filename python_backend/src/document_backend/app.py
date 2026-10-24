from collections.abc import AsyncIterator
from email.utils import formatdate
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse

from .catalog import FilesystemCatalog
from .models import Catalog, ClientType, IntakeRequest, IntakeTask
from .settings import Settings, get_settings

WORKFLOW_IDS: dict[ClientType, str] = {"PMO": "FS-PMO", "PP": "FS-PP"}
TASK_IDS: dict[ClientType, str] = {"PMO": "FS-INTAKE-PMO", "PP": "FS-INTAKE-PP"}


def create_app(settings: Settings | None = None) -> FastAPI:
    runtime_settings = settings or get_settings()
    repositories: dict[ClientType, FilesystemCatalog] = {
        "PMO": FilesystemCatalog(runtime_settings.pmo_data_folder, WORKFLOW_IDS["PMO"]),
        "PP": FilesystemCatalog(runtime_settings.pp_data_folder, WORKFLOW_IDS["PP"]),
    }
    application = FastAPI(title="Document filesystem backend", version="0.1.0")

    @application.get("/healthz", tags=["operations"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.post(
        "/v1/intakes",
        response_model=IntakeTask,
        status_code=status.HTTP_202_ACCEPTED,
        tags=["source"],
    )
    async def start_intake(request: IntakeRequest) -> IntakeTask:
        _scan_or_503(repositories[request.client_type])
        return IntakeTask(
            task_id=TASK_IDS[request.client_type],
            workflow_id=WORKFLOW_IDS[request.client_type],
        )

    @application.get("/v1/tasks/{task_id}", response_model=IntakeTask, tags=["source"])
    async def get_task(task_id: str) -> IntakeTask:
        client_type = _client_type_for_task(task_id)
        if client_type is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown task")
        _scan_or_503(repositories[client_type])
        return IntakeTask(task_id=task_id, workflow_id=WORKFLOW_IDS[client_type])

    @application.get(
        "/v1/workflows/{workflow_id}/contracts",
        response_model=Catalog,
        tags=["catalog"],
    )
    async def list_contracts(workflow_id: str) -> Catalog:
        repository = _repository_for_workflow(workflow_id, repositories)
        return _scan_or_503(repository).catalog

    @application.get(
        "/v1/workflows/{workflow_id}/documents/{document_id}/content",
        response_class=StreamingResponse,
        tags=["catalog"],
    )
    async def get_document(workflow_id: str, document_id: str) -> StreamingResponse:
        repository = _repository_for_workflow(workflow_id, repositories)
        snapshot = _scan_or_503(repository)
        document_path = snapshot.document_paths.get(document_id)
        if document_path is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown document")
        file_stat = document_path.stat()
        return StreamingResponse(
            content=_stream_file(document_path),
            media_type="application/pdf",
            headers={
                "Cache-Control": "private, max-age=60",
                "Content-Disposition": (
                    f"inline; filename*=utf-8''{quote(document_path.name, safe='')}"
                ),
                "Content-Length": str(file_stat.st_size),
                "ETag": f'"{file_stat.st_mtime_ns:x}-{file_stat.st_size:x}"',
                "Last-Modified": formatdate(file_stat.st_mtime, usegmt=True),
            },
        )

    return application


def _client_type_for_task(task_id: str) -> ClientType | None:
    return next(
        (client_type for client_type, known_id in TASK_IDS.items() if known_id == task_id),
        None,
    )


def _repository_for_workflow(
    workflow_id: str,
    repositories: dict[ClientType, FilesystemCatalog],
) -> FilesystemCatalog:
    client_type = next(
        (client_type for client_type, known_id in WORKFLOW_IDS.items() if known_id == workflow_id),
        None,
    )
    if client_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown workflow")
    return repositories[client_type]


def _scan_or_503(repository: FilesystemCatalog):
    try:
        return repository.scan()
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error


async def _stream_file(path: Path, chunk_size: int = 64 * 1024) -> AsyncIterator[bytes]:
    with path.open("rb") as stream:
        while chunk := stream.read(chunk_size):
            yield chunk


app = create_app()
