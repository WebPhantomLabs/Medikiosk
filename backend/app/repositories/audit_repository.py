from __future__ import annotations

from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository):
    table_name = "audit_logs"
