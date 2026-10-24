from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from pypdf import PdfWriter

from document_backend.app import create_app
from document_backend.settings import Settings

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def data_folder(tmp_path: Path) -> Path:
    contract = tmp_path / "CTR-2026-001"
    contract.mkdir()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=300)
    with (contract / "contract.pdf").open("wb") as stream:
        writer.write(stream)
    (contract / "ignored.txt").write_text("not a PDF", encoding="utf-8")
    return tmp_path


@pytest.fixture
def app(data_folder: Path):
    return create_app(Settings(data_folder=data_folder, public_data_path="/data"))


async def get_client(app) -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_health(app) -> None:
    async with await get_client(app) as client:
        response = await client.get("/healthz")
    assert response.json() == {"status": "ok"}


async def test_filesystem_intake_completes_immediately(app) -> None:
    async with await get_client(app) as client:
        response = await client.post(
            "/v1/intakes", json={"source": "filesystem", "folderPath": "/data"}
        )

    assert response.status_code == 202
    assert response.json() == {
        "taskId": "FS-INTAKE-DATA",
        "status": "succeeded",
        "workflowId": "FS-DATA",
        "progress": 100,
    }


async def test_intake_rejects_paths_outside_configured_alias(app) -> None:
    async with await get_client(app) as client:
        response = await client.post(
            "/v1/intakes",
            json={"source": "filesystem", "folderPath": "/etc"},
        )

    assert response.status_code == 422


async def test_catalog_lists_contract_folders_and_pdf_documents(app) -> None:
    async with await get_client(app) as client:
        response = await client.get("/v1/workflows/FS-DATA/contracts")

    assert response.status_code == 200
    payload = response.json()
    assert payload["workflowId"] == "FS-DATA"
    assert len(payload["contracts"]) == 1
    contract = payload["contracts"][0]
    assert contract["contractNumber"] == "CTR-2026-001"
    assert [document["filename"] for document in contract["documents"]] == ["contract.pdf"]
    assert contract["documents"][0]["pageCount"] == 1


async def test_document_content_is_streamed_as_pdf(app) -> None:
    async with await get_client(app) as client:
        catalog = (await client.get("/v1/workflows/FS-DATA/contracts")).json()
        document_id = catalog["contracts"][0]["documents"][0]["documentId"]

        response = await client.get(f"/v1/workflows/FS-DATA/documents/{document_id}/content")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["cache-control"] == "private, max-age=60"
    assert response.content.startswith(b"%PDF")


async def test_unknown_document_is_not_exposed(app) -> None:
    async with await get_client(app) as client:
        response = await client.get("/v1/workflows/FS-DATA/documents/document_unknown/content")

    assert response.status_code == 404
