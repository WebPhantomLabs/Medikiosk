from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class QuestionTransitionResponse(BaseModel):
    id: str | None = None
    node_id: str
    answer_category: str
    next_node_id: str

    model_config = {"from_attributes": True}


class QuestionNodeResponse(BaseModel):
    node_id: str
    question_text: str
    question_type: str = "single_choice"
    is_start_node: bool = False
    is_terminal: bool = False
    active: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)
    transitions: list[QuestionTransitionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class IntakeAnswerRequest(BaseModel):
    session_id: str
    node_id: str
    transcript: str = Field(..., min_length=1, max_length=2000)
    language: str = "en"


class AnswerClassificationResult(BaseModel):
    classified_category: str
    confidence: float = 1.0
    reasoning: str | None = None


class IntakeAnswerResponse(BaseModel):
    session_id: str
    node_id: str
    transcript: str
    classified_category: str
    sequence: int
    next_node_id: str | None = None
    next_question: QuestionNodeResponse | None = None
    queue_token: str | None = None
    is_complete: bool = False
    session_status: str

    model_config = {"from_attributes": True}
