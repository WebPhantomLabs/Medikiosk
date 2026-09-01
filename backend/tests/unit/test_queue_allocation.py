from __future__ import annotations

import pytest

from app.repositories.session_repository import QueueTokenRepository
from tests.conftest import MockDatabase


@pytest.mark.asyncio
async def test_queue_allocation_idempotency():
    db = MockDatabase()
    repo = QueueTokenRepository(db)

    session_id = "sess-123"
    kiosk_id = "kiosk-001"

    # First allocation
    token1 = await repo.allocate_token(session_id, kiosk_id, prefix="T")
    assert token1["token_number"] == "T-001"

    # Second allocation for same session should return the identical token
    token2 = await repo.allocate_token(session_id, kiosk_id, prefix="T")
    assert token2["token_number"] == "T-001"

    # Another session gets next token
    token3 = await repo.allocate_token("sess-456", kiosk_id, prefix="T")
    assert token3["token_number"] == "T-002"
