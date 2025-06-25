from schemas import ObservationInput
from datetime import datetime
from models import Rule
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional
from db import get_session
from services.rules_engine import evaluate as evaluate_rules

router = APIRouter()





def get_active_rules(session: Session, as_of: Optional[datetime] = None) -> list[Rule]:
    now = as_of or datetime.utcnow()
    statement = select(Rule).where(
        Rule.effective_date <= now,
        (Rule.retired_date.is_(None) | (Rule.retired_date > now))
    )
    return session.exec(statement).all()



@router.post("/evaluate")
def evaluate_observation(
    input: ObservationInput,
    as_of: Optional[datetime] = Query(None),
    session: Session = Depends(get_session)
):
    rules = get_active_rules(session, as_of=as_of)

    obs_dict = input.model_dump()
    results = evaluate_rules(observation=obs_dict, rules=[r.model_dump() for r in rules])
    
    return {
        "matched": len(results),
        "vulnerabilities": results,
    }

@router.post("/reflect")
def evaluate_observation(data: ObservationInput):
    # For now, just return the parsed input
    return {"parsed_input": data.dict(by_alias=True)}
