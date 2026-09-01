from __future__ import annotations

from abc import ABC, abstractmethod


class StorageProvider(ABC):
    """Abstract interface for storing uploaded medical documents/prescriptions."""

    @abstractmethod
    async def save_file(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """Save file bytes and return storage path / key."""
        pass

    @abstractmethod
    async def get_file(self, storage_path: str) -> bytes:
        """Retrieve file bytes by storage path."""
        pass

    @abstractmethod
    async def delete_file(self, storage_path: str) -> bool:
        """Delete stored file."""
        pass
