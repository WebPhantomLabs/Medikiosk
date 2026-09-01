from __future__ import annotations

import uuid
from pathlib import Path

from app.core.exceptions import NotFoundError
from app.services.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider for development."""

    def __init__(self, base_directory: str = "uploads") -> None:
        self.base_dir = Path(base_directory)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        ext = Path(filename).suffix if filename else ".bin"
        unique_name = f"{uuid.uuid4()}{ext}"
        target_path = self.base_dir / unique_name
        target_path.write_bytes(file_bytes)
        return str(target_path)

    async def get_file(self, storage_path: str) -> bytes:
        p = Path(storage_path)
        if not p.exists():
            raise NotFoundError(f"Stored file '{storage_path}' not found.")
        return p.read_bytes()

    async def delete_file(self, storage_path: str) -> bool:
        p = Path(storage_path)
        if p.exists():
            p.unlink()
            return True
        return False


class MockStorageProvider(StorageProvider):
    """In-memory storage provider for tests."""

    def __init__(self) -> None:
        self.storage: dict[str, tuple[bytes, str]] = {}

    async def save_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        key = f"mock://{uuid.uuid4()}_{filename}"
        self.storage[key] = (file_bytes, content_type)
        return key

    async def get_file(self, storage_path: str) -> bytes:
        if storage_path not in self.storage:
            raise NotFoundError(f"Stored file '{storage_path}' not found.")
        return self.storage[storage_path][0]

    async def delete_file(self, storage_path: str) -> bool:
        if storage_path in self.storage:
            del self.storage[storage_path]
            return True
        return False
