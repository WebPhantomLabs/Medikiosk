from __future__ import annotations

import pytest

from app.services.ai.mock import MockAIProvider


@pytest.mark.asyncio
async def test_medication_extraction_heuristic():
    mock_ai = MockAIProvider()
    ocr_text = """
    Rx:
    Paracetamol 500mg twice daily for 5 days
    Amoxicillin 250mg 3 times a day for 7 days
    """
    meds = await mock_ai.extract_medications(ocr_text)
    assert len(meds) >= 2
    names = [m.name for m in meds]
    assert any("Paracetamol" in n for n in names)
    assert any("Amoxicillin" in n for n in names)
