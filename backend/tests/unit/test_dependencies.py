from __future__ import annotations

import pytest

from app.api.dependencies import CurrentUser, get_current_staff_user, require_role
from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_get_current_staff_user_success():
    token = create_access_token(subject="doc-1", role="DOCTOR")
    user = await get_current_staff_user(authorization=f"Bearer {token}")
    assert user == CurrentUser(id="doc-1", role="DOCTOR")


@pytest.mark.asyncio
async def test_get_current_staff_user_missing_header():
    with pytest.raises(NotAuthenticatedError):
        await get_current_staff_user(authorization=None)


@pytest.mark.asyncio
async def test_get_current_staff_user_malformed_header():
    with pytest.raises(NotAuthenticatedError):
        await get_current_staff_user(authorization="NotBearer abc")


@pytest.mark.asyncio
async def test_require_role_allows_matching_role():
    dependency = require_role("ADMIN")
    user = CurrentUser(id="admin-1", role="ADMIN")
    result = await dependency(current_user=user)
    assert result is user


@pytest.mark.asyncio
async def test_require_role_rejects_non_matching_role():
    dependency = require_role("ADMIN")
    user = CurrentUser(id="doc-1", role="DOCTOR")
    with pytest.raises(ForbiddenError):
        await dependency(current_user=user)
