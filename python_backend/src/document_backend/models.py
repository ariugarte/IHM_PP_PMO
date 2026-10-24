from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


ClientType = Literal["PMO", "PP"]


class IntakeRequest(ApiModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    client_type: ClientType = Field(alias="clientType")


class IntakeTask(ApiModel):
    task_id: str = Field(alias="taskId")
    status: Literal["succeeded"] = "succeeded"
    workflow_id: str = Field(alias="workflowId")
    progress: int = 100


class DocumentInfo(ApiModel):
    document_id: str = Field(alias="documentId")
    contract_id: str = Field(alias="contractId")
    filename: str
    mime_type: Literal["application/pdf"] = Field("application/pdf", alias="mimeType")
    page_count: int | None = Field(None, alias="pageCount")
    size_bytes: int = Field(alias="sizeBytes")


class Contract(ApiModel):
    contract_id: str = Field(alias="contractId")
    contract_number: str = Field(alias="contractNumber")
    documents: list[DocumentInfo]


class Catalog(ApiModel):
    workflow_id: str = Field(alias="workflowId")
    contracts: list[Contract]
