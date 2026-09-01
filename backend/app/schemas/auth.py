from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class StaffResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: Literal["DOCTOR", "ADMIN"]
    active: bool
    created_at: datetime | str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    staff: StaffResponse


class OTPRequest(BaseModel):
    email: str = Field(..., min_length=3)


class OTPVerifyRequest(BaseModel):
    email: str = Field(..., min_length=3)
    otp: str = Field(..., min_length=6, max_length=6)


class OTPResponse(BaseModel):
    message: str
    expires_in_seconds: int
