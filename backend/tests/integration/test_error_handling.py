from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client):
    response = await client.get("/api/v1/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_response_has_request_id_header(client):
    response = await client.get("/health")
    assert "x-request-id" in response.headers
