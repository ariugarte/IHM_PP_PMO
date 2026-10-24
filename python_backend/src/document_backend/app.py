from collections.abc import AsyncIterator
from email.utils import formatdate
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse

from .catalog import TASK_ID, WORKFLOW_ID, FilesystemCatalog
from .models import Catalog, IntakeRequest, IntakeTask
from .settings import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    runtime_settings = settings or get_settings()
    repository = FilesystemCatalog(runtime_settings.data_folder)
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
        if request.folder_path.rstrip("/") != runtime_settings.public_data_path:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"folderPath must be {runtime_settings.public_data_path}",
            )
        _scan_or_503(repository)
        return IntakeTask(task_id=TASK_ID, workflow_id=WORKFLOW_ID)

    @application.get("/v1/tasks/{task_id}", response_model=IntakeTask, tags=["source"])
    async def get_task(task_id: str) -> IntakeTask:
        if task_id != TASK_ID:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown task")
        _scan_or_503(repository)
        return IntakeTask(task_id=TASK_ID, workflow_id=WORKFLOW_ID)

    @application.get(
        "/v1/workflows/{workflow_id}/contracts",
        response_model=Catalog,
        tags=["catalog"],
    )
    async def list_contracts(workflow_id: str) -> Catalog:
        _validate_workflow(workflow_id)
        return _scan_or_503(repository).catalog

    @application.get(
        "/v1/workflows/{workflow_id}/documents/{document_id}/content",
        response_class=StreamingResponse,
        tags=["catalog"],
    )
    async def get_document(workflow_id: str, document_id: str) -> StreamingResponse:
        _validate_workflow(workflow_id)
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


def _validate_workflow(workflow_id: str) -> None:
    if workflow_id != WORKFLOW_ID:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown workflow")


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
