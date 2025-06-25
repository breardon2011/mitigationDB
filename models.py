from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON          # ✅ explicit Column + JSON
from typing import Optional
from datetime import datetime



class Rule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    category: Optional[str] = None

    # ---------- THE FIX ----------
    body_json: dict = Field(
        default_factory=dict,
        sa_column=Column(JSON)               # 👈  definitive mapping
    )
    # ------------------------------

    effective_date: datetime
    retired_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
