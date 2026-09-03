from __future__ import annotations

import copy
import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.security import hash_password


class MockQueryResult:
    def __init__(self, data: Any = None, count: int | None = None) -> None:
        self.data = data
        self.count = count


class MockTableQuery:
    def __init__(self, store: list[dict[str, Any]]) -> None:
        self._store = store
        self._filters: list[Any] = []
        self._order_by: str | None = None
        self._desc: bool = False
        self._range_start: int = 0
        self._range_end: int | None = None
        self._is_single: bool = False
        self._count_mode: str | None = None
        self._is_not: bool = False

    @property
    def not_(self):
        self._is_not = True
        return self

    def select(self, columns: str = "*", count: str | None = None):
        self._count_mode = count
        return self

    def eq(self, column: str, value: Any):
        is_neg = self._is_not
        self._is_not = False
        if is_neg:
            self._filters.append(lambda r: str(r.get(column)) != str(value))
        else:
            self._filters.append(lambda r: str(r.get(column)) == str(value))
        return self

    def gte(self, column: str, value: Any):
        self._filters.append(lambda r: str(r.get(column)) >= str(value))
        return self

    def lte(self, column: str, value: Any):
        self._filters.append(lambda r: str(r.get(column)) <= str(value))
        return self

    def ilike(self, column: str, value: str):
        is_neg = self._is_not
        self._is_not = False
        v_clean = value.strip("%").lower()
        if is_neg:
            self._filters.append(lambda r: v_clean not in str(r.get(column, "")).lower())
        else:
            self._filters.append(lambda r: v_clean in str(r.get(column, "")).lower())
        return self

    def in_(self, column: str, values: list[Any]):
        is_neg = self._is_not
        self._is_not = False
        val_strs = [str(v) for v in values]
        if is_neg:
            self._filters.append(lambda r: str(r.get(column)) not in val_strs)
        else:
            self._filters.append(lambda r: str(r.get(column)) in val_strs)
        return self

    def order(self, column: str, desc: bool = False):
        self._order_by = column
        self._desc = desc
        return self

    def range(self, start: int, end: int):
        self._range_start = start
        self._range_end = end
        return self

    def limit(self, count: int):
        self._range_start = 0
        self._range_end = count - 1
        return self

    def maybe_single(self):
        self._is_single = True
        return self

    async def execute(self) -> MockQueryResult:
        results = list(self._store)
        for f in self._filters:
            results = [r for r in results if f(r)]

        total_count = len(results) if self._count_mode else None

        if self._order_by:
            col = self._order_by
            results.sort(
                key=lambda r: (r.get(col) is None, str(r.get(col, ""))),
                reverse=self._desc,
            )

        if self._range_end is not None:
            results = results[self._range_start : self._range_end + 1]

        if self._is_single:
            return MockQueryResult(data=results[0] if results else None, count=total_count)

        return MockQueryResult(data=results, count=total_count)


class MockInsertQuery:
    def __init__(self, table: MockTable, values: dict[str, Any] | list[dict[str, Any]]) -> None:
        self.table = table
        self.values = values

    def __await__(self):
        return self.execute().__await__()

    async def execute(self) -> MockQueryResult:
        store = self.table.db.tables.setdefault(self.table.name, [])
        items = self.values if isinstance(self.values, list) else [self.values]
        inserted = []
        now_str = datetime.now(UTC).isoformat()
        for it in items:
            row = copy.deepcopy(it)
            if "id" not in row and self.table.name != "question_bank":
                row["id"] = str(uuid.uuid4())
            if "created_at" not in row:
                row["created_at"] = now_str
            if "updated_at" not in row:
                row["updated_at"] = now_str
            store.append(row)
            inserted.append(row)
        return MockQueryResult(data=inserted)


class MockTable:
    def __init__(self, name: str, db: InMemoryDatabase) -> None:
        self.name = name
        self.db = db

    def select(self, columns: str = "*", count: str | None = None) -> MockTableQuery:
        q = MockTableQuery(self.db.tables.setdefault(self.name, []))
        return q.select(columns, count=count)

    def insert(self, values: dict[str, Any] | list[dict[str, Any]]) -> MockInsertQuery:
        return MockInsertQuery(self, values)

    def update(self, values: dict[str, Any]):
        return MockUpdateQuery(self.db.tables.setdefault(self.name, []), values)

    def delete(self):
        return MockDeleteQuery(self.db.tables.setdefault(self.name, []))


class MockUpdateQuery:
    def __init__(self, store: list[dict[str, Any]], values: dict[str, Any]) -> None:
        self.store = store
        self.values = values
        self._filters: list[Any] = []

    def eq(self, column: str, value: Any):
        self._filters.append(lambda r: str(r.get(column)) == str(value))
        return self

    async def execute(self) -> MockQueryResult:
        now_str = datetime.now(UTC).isoformat()
        updated = []
        for r in self.store:
            if all(f(r) for f in self._filters):
                r.update(copy.deepcopy(self.values))
                r["updated_at"] = now_str
                updated.append(r)
        return MockQueryResult(data=updated)


class MockDeleteQuery:
    def __init__(self, store: list[dict[str, Any]]) -> None:
        self.store = store
        self._filters: list[Any] = []

    def eq(self, column: str, value: Any):
        self._filters.append(lambda r: str(r.get(column)) == str(value))
        return self

    async def execute(self) -> MockQueryResult:
        to_delete = [r for r in self.store if all(f(r) for f in self._filters)]
        for r in to_delete:
            self.store.remove(r)
        return MockQueryResult(data=to_delete)


class MockRPCQuery:
    def __init__(self, db: InMemoryDatabase, fn_name: str, params: dict[str, Any]) -> None:
        self.db = db
        self.fn_name = fn_name
        self.params = params

    async def execute(self) -> MockQueryResult:
        if self.fn_name == "allocate_queue_token":
            session_id = self.params["p_session_id"]
            kiosk_id = self.params["p_kiosk_id"]
            prefix = self.params.get("p_prefix", "T")

            tokens = self.db.tables.setdefault("queue_tokens", [])
            for t in tokens:
                if t["session_id"] == session_id:
                    return MockQueryResult(data=t["token_number"])

            kiosk_tokens = [t for t in tokens if t.get("kiosk_id") == kiosk_id]
            next_num = len(kiosk_tokens) + 1
            token_number = f"{prefix}-{next_num:03d}"
            new_token = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "kiosk_id": kiosk_id,
                "token_number": token_number,
                "allocated_at": datetime.now(UTC).isoformat(),
            }
            tokens.append(new_token)
            return MockQueryResult(data=token_number)

        return MockQueryResult(data=None)


class InMemoryDatabase:
    def __init__(self) -> None:
        self.tables: dict[str, list[dict[str, Any]]] = {}
        self.seed_defaults()

    def table(self, name: str) -> MockTable:
        return MockTable(name, self)

    def rpc(self, fn_name: str, params: dict[str, Any]) -> MockRPCQuery:
        return MockRPCQuery(self, fn_name, params)

    def seed_defaults(self) -> None:
        password_hash = hash_password("Password123!")

        self.tables["staff"] = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "email": "admin@medikiosk.local",
                "password_hash": password_hash,
                "full_name": "System Administrator",
                "role": "ADMIN",
                "active": True,
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "email": "doctor@medikiosk.local",
                "password_hash": password_hash,
                "full_name": "Dr. Sarah Connor",
                "role": "DOCTOR",
                "active": True,
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
        ]

        self.tables["kiosks"] = [
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "code": "KIOSK-MAIN-01",
                "location": "Main Reception Floor 1",
                "status": "ACTIVE",
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            }
        ]

        self.tables["question_bank"] = [
            {
                "node_id": "CHIEF_COMPLAINT",
                "question_text": "What is the main reason for your visit today?",
                "question_type": "single_choice",
                "is_start_node": True,
                "is_terminal": False,
                "active": True,
                "metadata": {"category": "triage"},
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            {
                "node_id": "FEVER_DURATION",
                "question_text": "How many days have you had the fever?",
                "question_type": "single_choice",
                "is_start_node": False,
                "is_terminal": False,
                "active": True,
                "metadata": {"category": "fever"},
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            {
                "node_id": "COUGH_TYPE",
                "question_text": "Is your cough dry or with mucus/phlegm?",
                "question_type": "single_choice",
                "is_start_node": False,
                "is_terminal": False,
                "active": True,
                "metadata": {"category": "respiratory"},
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            {
                "node_id": "PAIN_SEVERITY",
                "question_text": "On a scale of 1 to 10, how severe is your pain?",
                "question_type": "single_choice",
                "is_start_node": False,
                "is_terminal": False,
                "active": True,
                "metadata": {"category": "pain"},
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            {
                "node_id": "TRIAGE_COMPLETE",
                "question_text": "Thank you. Your responses have been recorded for the doctor.",
                "question_type": "info",
                "is_start_node": False,
                "is_terminal": True,
                "active": True,
                "metadata": {"category": "terminal"},
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
            },
        ]

        self.tables["question_transitions"] = [
            {"id": "t1", "node_id": "CHIEF_COMPLAINT", "answer_category": "FEVER", "next_node_id": "FEVER_DURATION"},
            {"id": "t2", "node_id": "CHIEF_COMPLAINT", "answer_category": "COUGH", "next_node_id": "COUGH_TYPE"},
            {"id": "t3", "node_id": "CHIEF_COMPLAINT", "answer_category": "PAIN", "next_node_id": "PAIN_SEVERITY"},
            {"id": "t4", "node_id": "CHIEF_COMPLAINT", "answer_category": "OTHER", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t5", "node_id": "FEVER_DURATION", "answer_category": "LESS_THAN_3_DAYS", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t6", "node_id": "FEVER_DURATION", "answer_category": "3_OR_MORE_DAYS", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t7", "node_id": "COUGH_TYPE", "answer_category": "DRY", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t8", "node_id": "COUGH_TYPE", "answer_category": "PRODUCTIVE", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t9", "node_id": "PAIN_SEVERITY", "answer_category": "MILD", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t10", "node_id": "PAIN_SEVERITY", "answer_category": "MODERATE", "next_node_id": "TRIAGE_COMPLETE"},
            {"id": "t11", "node_id": "PAIN_SEVERITY", "answer_category": "SEVERE", "next_node_id": "TRIAGE_COMPLETE"},
        ]
