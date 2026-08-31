from __future__ import annotations

from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository):
    table_name = "patients"
