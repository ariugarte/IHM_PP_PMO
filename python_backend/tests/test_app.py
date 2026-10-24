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


def create_data_folder(root: Path, contract_number: str, filename: str) -> Path:
    root.mkdir()
    contract = root / contract_number
    contract.mkdir()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=300)
    with (contract / filename).open("wb") as stream:
        writer.write(stream)
    (contract / "ignored.txt").write_text("not a PDF", encoding="utf-8")
    return root


@pytest.fixture
def data_folders(tmp_path: Path) -> tuple[Path, Path]:
    pmo = create_data_folder(tmp_path / "pmo", "CTR-PMO-001", "company.pdf")
    pp = create_data_folder(tmp_path / "pp", "CTR-PP-001", "identity.pdf")
    return pmo, pp


@pytest.fixture
def app(data_folders: tuple[Path, Path]):
    pmo, pp = data_folders
    return create_app(Settings(pmo_data_folder=pmo, pp_data_folder=pp))


async def get_client(app) -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_health(app) -> None:
    async with await get_client(app) as client:
        response = await client.get("/healthz")
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize(
    ("client_type", "task_id", "workflow_id"),
    [("PMO", "FS-INTAKE-PMO", "FS-PMO"), ("PP", "FS-INTAKE-PP", "FS-PP")],
)
async def test_client_intake_uses_configured_folder(
    app, client_type: str, task_id: str, workflow_id: str
) -> None:
    async with await get_client(app) as client:
        response = await client.post("/v1/intakes", json={"clientType": client_type})

    assert response.status_code == 202
    assert response.json() == {
        "taskId": task_id,
        "status": "succeeded",
        "workflowId": workflow_id,
        "progress": 100,
    }


async def test_intake_rejects_unknown_client_type(app) -> None:
    async with await get_client(app) as client:
        response = await client.post("/v1/intakes", json={"clientType": "UNKNOWN"})

    assert response.status_code == 422


async def test_intake_rejects_browser_supplied_folder_path(app) -> None:
    async with await get_client(app) as client:
        response = await client.post(
            "/v1/intakes",
            json={"clientType": "PMO", "folderPath": "/etc"},
        )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("workflow_id", "contract_number", "filename"),
    [("FS-PMO", "CTR-PMO-001", "company.pdf"), ("FS-PP", "CTR-PP-001", "identity.pdf")],
)
async def test_catalog_uses_the_folder_configured_for_client_type(
    app, workflow_id: str, contract_number: str, filename: str
) -> None:
    async with await get_client(app) as client:
        response = await client.get(f"/v1/workflows/{workflow_id}/contracts")

    assert response.status_code == 200
    payload = response.json()
    assert payload["workflowId"] == workflow_id
    assert len(payload["contracts"]) == 1
    contract = payload["contracts"][0]
    assert contract["contractNumber"] == contract_number
    assert [document["filename"] for document in contract["documents"]] == [filename]
    assert contract["documents"][0]["pageCount"] == 1


async def test_document_content_is_streamed_as_pdf(app) -> None:
    async with await get_client(app) as client:
        catalog = (await client.get("/v1/workflows/FS-PMO/contracts")).json()
        document_id = catalog["contracts"][0]["documents"][0]["documentId"]

        response = await client.get(f"/v1/workflows/FS-PMO/documents/{document_id}/content")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["cache-control"] == "private, max-age=60"
    assert response.content.startswith(b"%PDF")


async def test_unknown_document_is_not_exposed(app) -> None:
    async with await get_client(app) as client:
        response = await client.get("/v1/workflows/FS-PMO/documents/document_unknown/content")

    assert response.status_code == 404
