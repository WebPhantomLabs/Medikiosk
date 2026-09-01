from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    details: Any | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class SuccessResponse(BaseModel, Generic[DataT]):
    data: DataT
    message: str | None = None


class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
