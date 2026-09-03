from __future__ import annotations

from typing import Any

from supabase import AsyncClient

from app.core.exceptions import (
    NotFoundError,
    ValidationError,
)
from app.core.security import hash_password
from app.repositories.audit_repository import AuditLogRepository
from app.repositories.kiosk_repository import KioskRepository
from app.repositories.question_repository import (
    QuestionRepository,
    QuestionTransitionRepository,
)
from app.repositories.staff_repository import StaffRepository
from app.schemas.admin import (
    AuditLogResponse,
    KioskCreate,
    KioskResponse,
    KioskUpdate,
    QuestionCreate,
    QuestionUpdate,
    StaffCreate,
    StaffUpdate,
    AdminSessionResponse,
)
from app.schemas.auth import StaffResponse
from app.schemas.intake import QuestionNodeResponse, QuestionTransitionResponse


class AdminService:
    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.question_repo = QuestionRepository(db)
        self.transition_repo = QuestionTransitionRepository(db)
        self.staff_repo = StaffRepository(db)
        self.kiosk_repo = KioskRepository(db)
        self.audit_repo = AuditLogRepository(db)

    # --- Question Bank ---
    async def list_questions(self) -> list[QuestionNodeResponse]:
        nodes = await self.question_repo.list(limit=100)
        results = []
        for n in nodes:
            transitions = await self.transition_repo.get_transitions_for_node(n["node_id"])
            results.append(
                QuestionNodeResponse(
                    node_id=n["node_id"],
                    question_text=n["question_text"],
                    question_type=n.get("question_type", "single_choice"),
                    is_start_node=n.get("is_start_node", False),
                    is_terminal=n.get("is_terminal", False),
                    active=n.get("active", True),
                    metadata=n.get("metadata", {}),
                    transitions=[QuestionTransitionResponse(**t) for t in transitions],
                )
            )
        return results

    async def get_question(self, node_id: str) -> QuestionNodeResponse:
        node = await self.question_repo.get_by_id(node_id)
        if not node:
            raise NotFoundError(f"Question node '{node_id}' not found.", code="QUESTION_NOT_FOUND")

        transitions = await self.transition_repo.get_transitions_for_node(node_id)
        return QuestionNodeResponse(
            node_id=node["node_id"],
            question_text=node["question_text"],
            question_type=node.get("question_type", "single_choice"),
            is_start_node=node.get("is_start_node", False),
            is_terminal=node.get("is_terminal", False),
            active=node.get("active", True),
            metadata=node.get("metadata", {}),
            transitions=[QuestionTransitionResponse(**t) for t in transitions],
        )

    async def create_question(self, payload: QuestionCreate, admin_id: str) -> QuestionNodeResponse:
        existing = await self.question_repo.get_by_id(payload.node_id)
        if existing:
            raise ValidationError(f"Question node '{payload.node_id}' already exists.", code="NODE_ALREADY_EXISTS")

        node_dict = payload.model_dump(exclude={"transitions"})
        node = await self.question_repo.insert(node_dict)

        created_transitions = []
        for t in payload.transitions:
            t_record = await self.transition_repo.insert({
                "node_id": payload.node_id,
                "answer_category": t.answer_category,
                "next_node_id": t.next_node_id,
            })
            created_transitions.append(t_record)

        await self.audit_repo.insert({
            "actor_id": admin_id,
            "actor_role": "ADMIN",
            "action": "CREATE_QUESTION_NODE",
            "resource_type": "question_bank",
            "resource_id": payload.node_id,
            "metadata": {"node_id": payload.node_id},
        })

        return QuestionNodeResponse(
            node_id=node["node_id"],
            question_text=node["question_text"],
            question_type=node.get("question_type", "single_choice"),
            is_start_node=node.get("is_start_node", False),
            is_terminal=node.get("is_terminal", False),
            active=node.get("active", True),
            metadata=node.get("metadata", {}),
            transitions=[QuestionTransitionResponse(**t) for t in created_transitions],
        )

    async def update_question(self, node_id: str, payload: QuestionUpdate, admin_id: str) -> QuestionNodeResponse:
        node = await self.question_repo.get_by_id(node_id)
        if not node:
            raise NotFoundError(f"Question node '{node_id}' not found.", code="QUESTION_NOT_FOUND")

        update_values = payload.model_dump(exclude_unset=True)
        if update_values:
            node = await self.question_repo.update_by_node_id(node_id, update_values)
        if not node:
            raise NotFoundError(f"Question node '{node_id}' not found.", code="QUESTION_NOT_FOUND")

        transitions = await self.transition_repo.get_transitions_for_node(node_id)
        return QuestionNodeResponse(
            node_id=node["node_id"],
            question_text=node["question_text"],
            question_type=node.get("question_type", "single_choice"),
            is_start_node=node.get("is_start_node", False),
            is_terminal=node.get("is_terminal", False),
            active=node.get("active", True),
            metadata=node.get("metadata", {}),
            transitions=[QuestionTransitionResponse(**t) for t in transitions],
        )

    async def delete_question(self, node_id: str, admin_id: str) -> bool:
        node = await self.question_repo.get_by_id(node_id)
        if not node:
            raise NotFoundError(f"Question node '{node_id}' not found.", code="QUESTION_NOT_FOUND")

        refs = await self.db.table("question_transitions").select("id").eq("next_node_id", node_id).execute()
        if refs.data:
            from app.core.exceptions import MediKioskError
            raise MediKioskError("Cannot delete question node: other transitions reference it", code="DANGLING_TRANSITION")

        await self.transition_repo.delete_by_node_id(node_id)
        success = await self.question_repo.delete_by_node_id(node_id)
        return success

    # --- Staff Management ---
    async def list_staff(self) -> list[StaffResponse]:
        staff_rows = await self.staff_repo.list(limit=100)
        return [StaffResponse(**s) for s in staff_rows]

    async def create_staff(self, payload: StaffCreate, admin_id: str) -> StaffResponse:
        existing = await self.staff_repo.get_by_email(payload.email)
        if existing:
            raise ValidationError(f"Staff account with email '{payload.email}' already exists.", code="EMAIL_ALREADY_EXISTS")

        hashed = hash_password(payload.password)
        new_staff = await self.staff_repo.insert({
            "email": payload.email,
            "password_hash": hashed,
            "full_name": payload.full_name,
            "role": payload.role,
            "active": payload.active,
        })
        return StaffResponse(**new_staff)

    async def update_staff(self, staff_id: str, payload: StaffUpdate, admin_id: str) -> StaffResponse:
        staff_row = await self.staff_repo.get_by_id(staff_id)
        if not staff_row:
            raise NotFoundError(f"Staff member '{staff_id}' not found.", code="STAFF_NOT_FOUND")

        updates: dict[str, Any] = payload.model_dump(exclude_unset=True)
        if "password" in updates and updates["password"]:
            updates["password_hash"] = hash_password(updates.pop("password"))

        updated = await self.staff_repo.update(staff_id, updates)
        if not updated:
            raise NotFoundError(f"Staff member '{staff_id}' not found.", code="STAFF_NOT_FOUND")
        return StaffResponse(**updated)

    async def delete_staff(self, staff_id: str, admin_id: str) -> bool:
        response = await self.db.table("staff").update({"active": False}).eq("id", staff_id).execute()
        return len(response.data) > 0 if response.data else False

    # --- Kiosk Management ---
    async def list_kiosks(self) -> list[KioskResponse]:
        kiosks = await self.kiosk_repo.list(limit=100)
        return [KioskResponse(**k) for k in kiosks]

    async def create_kiosk(self, payload: KioskCreate, admin_id: str) -> KioskResponse:
        existing = await self.kiosk_repo.get_by_code(payload.code)
        if existing:
            raise ValidationError(f"Kiosk code '{payload.code}' already exists.", code="KIOSK_CODE_EXISTS")

        kiosk = await self.kiosk_repo.insert(payload.model_dump())
        return KioskResponse(**kiosk)

    async def update_kiosk(self, kiosk_id: str, payload: KioskUpdate, admin_id: str) -> KioskResponse:
        kiosk = await self.kiosk_repo.get_by_id(kiosk_id)
        if not kiosk:
            raise NotFoundError(f"Kiosk '{kiosk_id}' not found.", code="KIOSK_NOT_FOUND")

        updated = await self.kiosk_repo.update(kiosk_id, payload.model_dump(exclude_unset=True))
        if not updated:
            raise NotFoundError(f"Kiosk '{kiosk_id}' not found.", code="KIOSK_NOT_FOUND")
        return KioskResponse(**updated)

    async def delete_kiosk(self, kiosk_id: str, admin_id: str) -> bool:
        return await self.kiosk_repo.delete(kiosk_id)

    async def list_sessions(self, status: str | None = None, date_filter: str | None = None, page: int = 1, per_page: int = 20) -> list[AdminSessionResponse]:
        query = self.db.table("sessions").select("*")
        if status:
            query = query.eq("status", status)
        if date_filter:
            query = query.gte("created_at", f"{date_filter}T00:00:00").lte("created_at", f"{date_filter}T23:59:59")
        
        offset = (page - 1) * per_page
        query = query.order("created_at", desc=True).range(offset, offset + per_page - 1)
        response = await query.execute()
        sessions = response.data or []
        
        results = []
        for s in sessions:
            patient_row = await self.db.table("patients").select("full_name").eq("id", s["patient_id"]).maybe_single().execute()
            kiosk_row = await self.db.table("kiosks").select("code").eq("id", s["kiosk_id"]).maybe_single().execute()
            token_row = await self.db.table("queue_tokens").select("token_number").eq("session_id", str(s["id"])).maybe_single().execute()
            
            p_name = patient_row.data["full_name"] if patient_row and patient_row.data else None
            k_code = kiosk_row.data["code"] if kiosk_row and kiosk_row.data else None
            t_num = token_row.data["token_number"] if token_row and token_row.data else None
            
            results.append(AdminSessionResponse(
                id=str(s["id"]),
                patient_name=p_name,
                token_number=t_num,
                status=s["status"],
                kiosk_code=k_code,
                created_at=s["created_at"],
            ))
            
        return results

    # --- Audit Logs ---
    async def list_audit_logs(self, action: str | None = None, limit: int = 50, offset: int = 0) -> list[AuditLogResponse]:
        query = self.db.table("audit_logs").select("*")
        if action:
            query = query.eq("action", action)
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        response = await query.execute()
        logs = response.data or []
        return [AuditLogResponse(**log) for log in logs]
