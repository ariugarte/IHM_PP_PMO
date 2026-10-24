import base64
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .models import Catalog, Contract, DocumentInfo


def _stable_id(prefix: str, value: str) -> str:
    encoded = base64.urlsafe_b64encode(value.encode("utf-8")).decode("ascii").rstrip("=")
    return f"{prefix}_{encoded}"


@dataclass(frozen=True)
class CatalogSnapshot:
    catalog: Catalog
    document_paths: dict[str, Path]


class FilesystemCatalog:
    def __init__(self, data_folder: Path, workflow_id: str) -> None:
        self.data_folder = data_folder
        self.workflow_id = workflow_id

    def scan(self) -> CatalogSnapshot:
        if not self.data_folder.is_dir():
            raise FileNotFoundError(f"Data folder does not exist: {self.data_folder}")

        contracts: list[Contract] = []
        document_paths: dict[str, Path] = {}
        contract_directories = sorted(
            (
                path
                for path in self.data_folder.iterdir()
                if path.is_dir() and not path.is_symlink()
            ),
            key=lambda path: path.name.casefold(),
        )

        for contract_directory in contract_directories:
            contract_number = contract_directory.name
            contract_id = _stable_id("contract", contract_number)
            documents: list[DocumentInfo] = []
            pdf_paths = sorted(
                (
                    path
                    for path in contract_directory.iterdir()
                    if path.is_file() and not path.is_symlink() and path.suffix.casefold() == ".pdf"
                ),
                key=lambda path: path.name.casefold(),
            )
            for pdf_path in pdf_paths:
                relative_path = f"{contract_number}/{pdf_path.name}"
                document_id = _stable_id("document", relative_path)
                documents.append(
                    DocumentInfo(
                        document_id=document_id,
                        contract_id=contract_id,
                        filename=pdf_path.name,
                        page_count=self._page_count(pdf_path),
                        size_bytes=pdf_path.stat().st_size,
                    )
                )
                document_paths[document_id] = pdf_path

            contracts.append(
                Contract(
                    contract_id=contract_id,
                    contract_number=contract_number,
                    documents=documents,
                )
            )

        return CatalogSnapshot(
            catalog=Catalog(workflow_id=self.workflow_id, contracts=contracts),
            document_paths=document_paths,
        )

    @staticmethod
    def _page_count(pdf_path: Path) -> int | None:
        try:
            return len(PdfReader(pdf_path).pages)
        except (OSError, PdfReadError, ValueError):
            return None
