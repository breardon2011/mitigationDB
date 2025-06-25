# backend/routers/rules.py
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from db import get_session
from models import Rule
from schemas import RuleCreate, RuleRead, RuleUpdate  

router = APIRouter(prefix="/api/v1/rules", tags=["rules"])


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────
def _rule_by_id(rule_id: int, session: Session) -> Rule:
    rule = session.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


def _active_rules_stmt(as_of: datetime) -> select:
    return (
        select(Rule)
        .where(Rule.effective_date <= as_of)
        .where((Rule.retired_date.is_(None)) | (Rule.retired_date > as_of))
        .order_by(Rule.effective_date.desc())
    )


# ──────────────────────────────────────────────────────────
# End-points
# ──────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=RuleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_rule(rule_in: RuleCreate, session: Session = Depends(get_session)):
    rule = Rule.model_validate(rule_in)  # Pydantic → SQLModel instance
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.get("/", response_model=List[RuleRead])
def list_rules(
    as_of: Optional[datetime] = Query(
        None,
        description="Return only rules active at this UTC timestamp "
        "(omitted → return all versions)",
    ),
    session: Session = Depends(get_session),
):
    if as_of:
        rules = session.exec(_active_rules_stmt(as_of)).all()
    else:
        rules = session.exec(select(Rule)).all()
    return rules


@router.get("/{rule_id}", response_model=RuleRead)
def read_rule(rule_id: int, session: Session = Depends(get_session)):
    return _rule_by_id(rule_id, session)


@router.put("/{rule_id}", response_model=RuleRead)
def update_rule(
    rule_id: int,
    rule_in: RuleUpdate,
    session: Session = Depends(get_session),
):
    rule = _rule_by_id(rule_id, session)
    rule_data = rule_in.model_dump(exclude_unset=True)
    for k, v in rule_data.items():
        setattr(rule, k, v)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: int, session: Session = Depends(get_session)):
    rule = _rule_by_id(rule_id, session)
    session.delete(rule)
    session.commit()
