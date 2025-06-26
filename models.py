from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, Text, JSON  # ← JSON type
from sqlmodel import SQLModel, Field


class Rule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # ── metadata ────────────────────────────────────────────────
    name: str
    category: Optional[str] = None

    # ── rule payloads ───────────────────────────────────────────
    logic: Dict[str, Any] = Field(              #  ← add sa_column
        sa_column=Column(JSON), default_factory=dict
    )
    params: Dict[str, Any] = Field(
        sa_column=Column(JSON), default_factory=dict
    )
    explanation: str = Field(sa_column=Column(Text))
    mitigations: Dict[str, Any] = Field(
        sa_column=Column(JSON), default_factory=dict
    )

    # ── versioning / audit ─────────────────────────────────────
    effective_date: datetime
    retired_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:                  # Pydantic v2
        from_attributes = True     # replaces orm_mode
